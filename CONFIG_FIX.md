# 🔧 项目配置说明

## 问题：未找到 app.json

### ❌ 错误提示
```
未找到 app.json
```

### ✅ 已修复
在 `project.config.json` 中添加了：
```json
{
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/"
}
```

---

## 📁 正确的项目结构

```
love-ledger-dev/
├── miniprogram/              ← 小程序代码目录
│   ├── app.json             ← 小程序配置文件
│   ├── app.js               ← 小程序入口
│   ├── app.wxss             ← 全局样式
│   ├── pages/               ← 页面目录
│   └── utils/               ← 工具函数
│
├── cloudfunctions/          ← 云函数目录
│   ├── init_database/
│   ├── bill_processor/
│   ├── invite_manager/
│   ├── statistics/
│   └── ai_advisor/
│
├── project.config.json      ← 项目配置（已修复）
└── README.md
```

---

## 🚀 正确的导入步骤

### 1. 拉取最新代码
```bash
cd /Users/caizhihuan/.openclaw/workspace/love-ledger-dev
git pull origin main
```

### 2. 打开微信开发者工具
1. 点击"导入项目"
2. 选择目录：`/Users/caizhihuan/.openclaw/workspace/love-ledger-dev`
3. AppID填写：`wxe2ed6d7c2e6ae3e4`
4. 点击"导入"

### 3. 验证配置
在微信开发者工具中，应该看到：
- ✅ app.json 已识别
- ✅ 5个页面已加载
- ✅ 云函数目录已识别

---

## 📊 project.config.json 配置说明

```json
{
  "appid": "wxe2ed6d7c2e6ae3e4",
  "projectname": "love-ledger",
  
  // 小程序代码目录（关键配置）
  "miniprogramRoot": "miniprogram/",
  
  // 云函数目录
  "cloudfunctionRoot": "cloudfunctions/",
  
  // 云函数模板目录
  "cloudfunctionTemplateRoot": "cloudfunctions/"
}
```

### 配置项说明

#### miniprogramRoot
- 指定小程序代码的根目录
- 默认值：项目根目录
- 我们的值：`miniprogram/`

#### cloudfunctionRoot
- 指定云函数目录
- 用于云函数上传和管理

---

## ✅ 验证步骤

### 1. 检查文件是否存在
```bash
# 应该能找到app.json
ls -la /Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/app.json
```

### 2. 检查配置是否正确
```bash
# 查看project.config.json
cat /Users/caizhihuan/.openclaw/workspace/love-ledger-dev/project.config.json | grep -E "miniprogramRoot|cloudfunctionRoot"
```

### 3. 在微信开发者工具中验证
- 打开项目
- 查看左侧文件树
- 应该能看到 `pages` 目录
- 点击"编译"应该能正常运行

---

## 🐛 常见问题

### Q1: 仍然提示"未找到app.json"
**A:** 
1. 确认已执行 `git pull`
2. 重启微信开发者工具
3. 重新导入项目

### Q2: 云函数无法上传
**A:**
1. 检查 `cloudfunctionRoot` 配置
2. 确保已开通云开发
3. 选择正确的云环境

### Q3: 页面无法跳转
**A:**
1. 检查 `app.json` 中的 pages 配置
2. 确保页面文件完整（wxml/js/wxss/json）

---

## 📞 仍需帮助？

如果问题仍然存在，请提供：
1. 微信开发者工具版本
2. 完整的错误截图
3. project.config.json 内容

---

**✅ 配置已修复！重新导入项目即可！**
