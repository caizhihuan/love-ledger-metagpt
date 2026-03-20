/**
 * 恋账 - AI财务顾问云函数
 * 生成个性化的理财周报/月报
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// GLM配置 - 使用环境变量
const AI_CONFIG = {
  glm: {
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    apiKey: process.env.GLM_API_KEY || '',  // 从环境变量读取，不要硬编码
    model: 'glm-4-plus'
  }
};

/**
 * 调用GLM API
 */
async function callGLM(prompt) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: AI_CONFIG.glm.model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 800
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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.choices[0].message.content);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('AI请求超时'));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * 生成周报
 */
async function generateWeeklyReport(openid) {
  const userResult = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userResult.data.length === 0 || !userResult.data[0].groupId) {
    throw new Error('请先绑定情侣账号');
  }
  
  const user = userResult.data[0];
  const groupId = user.groupId;
  
  // 获取本周数据
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  // 聚合数据
  const weekStats = await db.collection('bills')
    .aggregate()
    .match({
      groupId: groupId,
      date: _.gte(weekStart).and(_.lte(weekEnd)),
      isDeleted: false
    })
    .group({
      _id: null,
      totalExpense: $.sum($.cond({
        if: $.lt(['$amount', 0]),
        then: '$amount',
        else: 0
      })),
      totalIncome: $.sum($.cond({
        if: $.gt(['$amount', 0]),
        then: '$amount',
        else: 0
      })),
      billCount: $.sum(1)
    })
    .end();
  
  // 获取Top 5分类
  const topCategories = await db.collection('bills')
    .aggregate()
    .match({
      groupId: groupId,
      date: _.gte(weekStart).and(_.lte(weekEnd)),
      amount: _.lt(0),
      isDeleted: false
    })
    .group({
      _id: '$category',
      amount: $.sum('$amount'),
      count: $.sum(1)
    })
    .sort({ amount: 1 })
    .limit(5)
    .end();
  
  // 构建提示词
  const totalExpense = Math.abs(weekStats.list[0]?.totalExpense || 0);
  const totalIncome = weekStats.list[0]?.totalIncome || 0;
  const billCount = weekStats.list[0]?.billCount || 0;
  
  const topCategoriesText = topCategories.list
    .map((cat, index) => `${index + 1}. ${cat._id}: ¥${Math.abs(cat.amount)} (${cat.count}笔)`)
    .join('\n');
  
  const prompt = `你是一个温暖的情侣财务顾问。请基于以下数据生成一份理财周报：

**本周消费概况：**
- 总支出：¥${totalExpense}
- 总收入：¥${totalIncome}
- 消费笔数：${billCount}

**消费Top 5分类：**
${topCategoriesText}

**要求：**
1. 用温暖亲切的语气，像是朋友在聊天
2. 分析消费结构，指出亮点和可改进之处
3. 给出2-3条实用建议
4. 字数200-300字
5. 适当使用emoji增加趣味性`;

  // 生成报告
  const report = await callGLM(prompt);
  
  return {
    success: true,
    data: {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      statistics: {
        totalExpense,
        totalIncome,
        billCount
      },
      report
    }
  };
}

// 云函数入口
exports.main = async (event, context) => {
  const { action } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'weekly':
        return await generateWeeklyReport(OPENID);
      default:
        throw new Error(`未知的操作类型: ${action}`);
    }
  } catch (error) {
    console.error('AI顾问失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// 添加缺失的aggregate变量
const $ = _.aggregate;
