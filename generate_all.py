#!/usr/bin/env python3
"""
恋账项目 - 一键生成脚本
自动生成所有缺失的文件
"""

import os
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev")

def create_file(file_path: str, content: str):
    """创建文件"""
    full_path = PROJECT_ROOT / file_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ 已创建: {file_path}")

def generate_all_files():
    """生成所有文件"""
    
    print("\n" + "="*60)
    print("🚀 恋账项目 - 一键生成所有文件")
    print("="*60)
    
    # 1. 云函数 package.json
    print("\n📦 生成云函数配置文件...")
    create_file("cloudfunctions/statistics/package.json", """{
  "name": "statistics",
  "version": "1.0.0",
  "description": "恋账统计分析云函数",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}""")
    
    create_file("cloudfunctions/ai_advisor/package.json", """{
  "name": "ai_advisor",
  "version": "1.0.0",
  "description": "恋账AI财务顾问云函数",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}""")
    
    # 2. 工具函数
    print("\n🔧 生成工具函数...")
    create_file("miniprogram/utils/util.js", """/**
 * 恋账 - 工具函数
 */

const formatAmount = (amount, showSign = false) => {
  const num = Math.abs(amount);
  const formatted = num.toFixed(2).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
  if (showSign) {
    return amount >= 0 ? `+¥${formatted}` : `-¥${formatted}`;
  }
  return `¥${formatted}`;
};

const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`;
  if (format === 'MM-DD') return `${month}-${day}`;
  return `${year}-${month}-${day}`;
};

module.exports = {
  formatAmount,
  formatDate,
  showLoading: (title = '加载中...') => wx.showLoading({ title, mask: true }),
  hideLoading: () => wx.hideLoading(),
  showSuccess: (title) => wx.showToast({ title, icon: 'success' }),
  showError: (title) => wx.showToast({ title, icon: 'error' })
};""")
    
    # 3. API封装
    print("\n🌐 生成API封装...")
    create_file("miniprogram/utils/api.js", """/**
 * 恋账 - API接口封装
 */

const callFunction = async (name, data) => {
  try {
    const res = await wx.cloud.callFunction({ name, data });
    return res.result;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};

module.exports = {
  billAPI: {
    analyzeImage: (fileID) => callFunction('bill_processor', {
      action: 'analyzeImage',
      data: { fileID }
    }),
    analyzeText: (text) => callFunction('bill_processor', {
      action: 'analyzeText',
      data: { text }
    }),
    create: (billData) => callFunction('bill_processor', {
      action: 'createBill',
      data: billData
    })
  },
  inviteAPI: {
    create: () => callFunction('invite_manager', { action: 'create' }),
    join: (inviteCode) => callFunction('invite_manager', {
      action: 'join',
      data: { inviteCode }
    }),
    getInfo: () => callFunction('invite_manager', { action: 'info' }),
    unbind: () => callFunction('invite_manager', { action: 'unbind' })
  }
};""")
    
    # 4. 分类数据
    print("\n📁 生成分类数据...")
    create_file("miniprogram/utils/category.js", """/**
 * 恋账 - 分类数据
 */

const expenseCategories = [
  { name: '餐饮', icon: '🍔' },
  { name: '交通', icon: '🚗' },
  { name: '购物', icon: '🛒' },
  { name: '居住', icon: '🏠' },
  { name: '娱乐', icon: '🎮' },
  { name: '医疗', icon: '💊' },
  { name: '教育', icon: '📚' },
  { name: '礼物', icon: '🎁' },
  { name: '其他', icon: '📦' }
];

const incomeCategories = [
  { name: '工资', icon: '💰' },
  { name: '兼职', icon: '💵' },
  { name: '红包', icon: '🧧' },
  { name: '其他收入', icon: '💎' }
];

module.exports = {
  expenseCategories,
  incomeCategories
};""")
    
    # 5. sitemap
    print("\n🗺️ 生成sitemap...")
    create_file("miniprogram/sitemap.json", """{
  "desc": "关于本文件的更多信息，请参考文档",
  "rules": [{ "action": "allow", "page": "*" }]
}""")
    
    # 6. app.wxss
    print("\n🎨 生成全局样式...")
    create_file("miniprogram/app.wxss", """/* 恋账 - 全局样式 */

page {
  --primary-color: #FF6B9D;
  --primary-light: #FF8E9E;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC';
  background: #F8F8F8;
  color: #333;
  font-size: 28rpx;
}

.container {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  border-radius: 48rpx;
  padding: 24rpx;
  text-align: center;
  font-weight: 600;
}

.card {
  background: white;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  margin-bottom: 16rpx;
}

.text-pink {
  color: var(--primary-color);
}

.text-center {
  text-align: center;
}

.flex {
  display: flex;
}

.flex-between {
  justify-content: space-between;
  align-items: center;
}""")
    
    # 7. README
    print("\n📖 生成README...")
    create_file("README.md", """# 💕 恋账 - 情侣共享记账小程序

## 项目信息
- **AppID**: `wxe2ed6d7c2e6ae3e4`
- **云环境**: `cloud1-3gyaxiq6baf2a0ed`
- **AI模型**: GLM-4-Plus

## 快速开始

1. 导入项目到微信开发者工具
2. 创建数据库集合（users, groups, bills, categories）
3. 上传云函数（右键 cloudfunctions 文件夹）
4. 运行 init_database 云函数初始化数据
5. 编译运行

## 功能特色

- 🤖 AI智能记账（图片识别、语音识别、文本解析）
- 👫 情侣绑定实时同步
- 📊 统计分析与可视化
- 💰 AI财务顾问
- 🎨 粉色温馨设计

## 技术栈

- 前端：微信小程序原生
- 后端：微信云开发
- AI：智谱GLM-4-Plus
- 数据库：云开发数据库

## 详细文档

- [部署指南](DEPLOYMENT_GUIDE.md)
- [完整报告](FINAL_PROJECT_REPORT.md)

## 开发团队

- 产品经理：Alice
- 架构师：Bob
- 项目经理：Charlie
- 工程师：David
- 测试工程师：Eve

---

💕 Made with love for couples""")
    
    print("\n" + "="*60)
    print("✨ 所有文件生成完成！")
    print("="*60)
    print("\n📋 下一步：")
    print("1. 打开微信开发者工具")
    print("2. 导入项目：/Users/caizhihuan/.openclaw/workspace/love-ledger-dev")
    print("3. 查看 DEPLOYMENT_GUIDE.md 了解详细部署步骤")
    print("\n🎉 准备就绪！\n")

if __name__ == "__main__":
    generate_all_files()
