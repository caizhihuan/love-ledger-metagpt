/**
 * 恋账 - 账单处理核心云函数
 * 支持AI图片识别、语音识别、文本解析
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// ==================== 配置 ====================
const AI_CONFIG = {
  // 智谱AI配置 - 使用环境变量
  glm: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY || '',  // 从环境变量读取，不要硬编码
    model: 'glm-4-plus'  // 使用 GLM-4-Plus
  }
};

// ==================== 提示词模板 ====================
const PROMPTS = {
  // 图片识别提示词
  imageAnalysis: `你是一个专业的账单识别助手。请仔细分析这张图片，提取消费信息。

**重要规则：**
1. 识别图片中的金额、商家名称、消费时间、消费类型
2. 如果是收据或账单截图，提取关键信息
3. 如果图片不清晰或无法识别，请在 error 字段说明原因
4. 必须返回严格的JSON格式，不要包含任何其他文字

**返回格式：**
{
  "success": true,
  "amount": -50.5,
  "type": "expense",
  "category": "餐饮",
  "merchant": "麦当劳",
  "description": "午餐",
  "date": "2024-03-20",
  "confidence": 0.95,
  "error": null
}

**注意：**
- amount: 支出为负数，收入为正数
- category: 必须是以下之一：餐饮、交通、购物、居住、娱乐、医疗、教育、礼物、工作、通讯、水电、宠物、影音、旅行、其他
- confidence: 识别置信度 0-1
- 如果无法识别，success设为false，error说明原因`,

  // 语音/文本识别提示词
  textAnalysis: `你是一个智能记账助手。请分析用户的记账描述，提取关键信息。

**用户描述：** {USER_INPUT}

**重要规则：**
1. 从描述中提取金额、分类、时间等信息
2. 如果用户没有指定时间，使用今天
3. 智能判断消费类型（餐饮、交通等）
4. 必须返回严格的JSON格式

**返回格式：**
{
  "success": true,
  "amount": -30,
  "type": "expense",
  "category": "餐饮",
  "description": "早餐豆浆油条",
  "date": "2024-03-20",
  "confidence": 0.9,
  "error": null
}

**注意：**
- 自动判断是支出还是收入
- 金额必须是数字（支出为负）
- category必须是系统预设分类之一
- description用简洁的语言概括`
};

// ==================== 工具函数 ====================

/**
 * 调用智谱AI API
 */
async function callGLM(prompt, imageBase64 = null) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const messages = [];
    
    if (imageBase64) {
      // GLM-4V 支持图片
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: prompt
      });
    }
    
    const postData = JSON.stringify({
      model: AI_CONFIG.glm.model,
      messages: messages,
      temperature: 0.3,
      max_tokens: 500
    });
    
    const options = {
      hostname: 'open.bigmodel.cn',
      port: 443,
      path: '/api/paas/v4/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.glm.apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.choices && result.choices[0]) {
            resolve(result.choices[0].message.content);
          } else {
            reject(new Error('AI返回格式错误'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI请求超时'));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * 解析AI返回的JSON
 */
function parseAIResponse(responseText) {
  try {
    // 尝试直接解析
    let result = JSON.parse(responseText);
    return result;
  } catch (e) {
    // 尝试提取JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        throw new Error('AI返回格式错误，无法解析');
      }
    }
    throw new Error('AI未返回有效的JSON数据');
  }
}

/**
 * 获取文件Base64
 */
async function getFileBase64(fileID) {
  try {
    const result = await cloud.downloadFile({
      fileID: fileID
    });
    
    return result.fileContent.toString('base64');
  } catch (error) {
    console.error('文件下载失败:', error);
    throw new Error('文件下载失败');
  }
}

/**
 * 验证账单数据
 */
function validateBillData(data) {
  const errors = [];
  
  if (typeof data.amount !== 'number' || isNaN(data.amount)) {
    errors.push('金额必须是数字');
  }
  
  if (data.amount === 0) {
    errors.push('金额不能为0');
  }
  
  const validCategories = [
    '餐饮', '交通', '购物', '居住', '娱乐', '医疗', '教育',
    '礼物', '工作', '通讯', '水电', '宠物', '影音', '旅行', '其他',
    '工资', '兼职', '红包', '投资', '其他收入'
  ];
  
  if (!validCategories.includes(data.category)) {
    errors.push(`无效的分类: ${data.category}`);
  }
  
  return errors;
}

// ==================== 主要功能函数 ====================

/**
 * 分析图片账单
 */
async function analyzeImage(fileID) {
  console.log('开始分析图片:', fileID);
  
  // 1. 下载图片并转Base64
  const imageBase64 = await getFileBase64(fileID);
  console.log('图片下载成功，大小:', imageBase64.length);
  
  // 2. 调用AI识别
  const aiResponse = await callGLM(PROMPTS.imageAnalysis, imageBase64);
  console.log('AI响应:', aiResponse);
  
  // 3. 解析结果
  const result = parseAIResponse(aiResponse);
  
  // 4. 验证数据
  if (!result.success) {
    return {
      success: false,
      error: result.error || '识别失败',
      data: null
    };
  }
  
  const errors = validateBillData(result);
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.join('; '),
      data: result
    };
  }
  
  return {
    success: true,
    error: null,
    data: {
      amount: result.amount,
      type: result.type || (result.amount < 0 ? 'expense' : 'income'),
      category: result.category,
      description: result.description || result.merchant || '',
      merchant: result.merchant,
      date: result.date || new Date().toISOString().split('T')[0],
      aiParsed: {
        rawText: aiResponse,
        imageUrl: fileID,
        confidence: result.confidence || 0.8,
        model: 'glm-4-plus'
      }
    }
  };
}

/**
 * 分析语音/文本
 */
async function analyzeVoice(text) {
  console.log('开始分析文本:', text);
  
  // 构建提示词
  const prompt = PROMPTS.textAnalysis.replace('{USER_INPUT}', text);
  
  // 调用AI
  const aiResponse = await callGLM(prompt);
  console.log('AI响应:', aiResponse);
  
  // 解析结果
  const result = parseAIResponse(aiResponse);
  
  // 验证数据
  if (!result.success) {
    return {
      success: false,
      error: result.error || '解析失败',
      data: null
    };
  }
  
  const errors = validateBillData(result);
  if (errors.length > 0) {
    return {
      success: false,
      error: errors.join('; '),
      data: result
    };
  }
  
  return {
    success: true,
    error: null,
    data: {
      amount: result.amount,
      type: result.type || (result.amount < 0 ? 'expense' : 'income'),
      category: result.category,
      description: result.description || text,
      date: result.date || new Date().toISOString().split('T')[0],
      aiParsed: {
        rawText: text,
        confidence: result.confidence || 0.8,
        model: 'glm-4-plus'
      }
    }
  };
}

/**
 * 创建账单
 */
async function createBill(billData, openid) {
  // 获取用户信息
  const userResult = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  
  if (!user.groupId) {
    throw new Error('请先绑定情侣账号');
  }
  
  // 创建账单
  const bill = {
    _openid: openid,
    groupId: user.groupId,
    amount: billData.amount,
    type: billData.type,
    category: billData.category,
    subcategory: billData.subcategory,
    description: billData.description,
    merchant: billData.merchant,
    date: new Date(billData.date),
    attachments: billData.attachments || [],
    aiParsed: billData.aiParsed,
    createdAt: db.serverDate(),
    updatedAt: db.serverDate(),
    isDeleted: false
  };
  
  const result = await db.collection('bills').add({ data: bill });
  
  return {
    success: true,
    billId: result._id,
    bill
  };
}

// ==================== 云函数入口 ====================
exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'analyzeImage':
        return await analyzeImage(data.fileID);
        
      case 'analyzeVoice':
      case 'analyzeText':
        return await analyzeVoice(data.text);
        
      case 'createBill':
        return await createBill(data, OPENID);
        
      case 'analyzeAndCreate':
        // 一站式：AI分析 + 创建账单
        let analysisResult;
        
        if (data.fileID) {
          analysisResult = await analyzeImage(data.fileID);
        } else if (data.text) {
          analysisResult = await analyzeVoice(data.text);
        } else {
          throw new Error('请提供图片或文本');
        }
        
        if (!analysisResult.success) {
          return analysisResult;
        }
        
        // 合并用户提供的额外信息
        const billData = {
          ...analysisResult.data,
          ...data.override  // 用户可以覆盖AI识别结果
        };
        
        return await createBill(billData, OPENID);
        
      default:
        throw new Error(`未知的操作类型: ${action}`);
    }
  } catch (error) {
    console.error('处理失败:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};
