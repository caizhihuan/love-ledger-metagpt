# 🚀 恋账项目 - 快速部署指南

## 📋 项目信息
- **AppID**: `wxe2ed6d7c2e6ae3e4`
- **云环境ID**: `cloud1-3gyaxiq6baf2a0ed`
- **AI模型**: GLM-4-Plus (智谱AI)

## 🎯 部署步骤（15分钟完成）

### 步骤1: 导入项目（2分钟）

1. **下载项目文件**
```bash
# 项目已生成在：
cd /Users/caizhihuan/.openclaw/workspace/love-ledger-dev
```

2. **打开微信开发者工具**
   - 选择"导入项目"
   - 目录选择：`/Users/caizhihuan/.openclaw/workspace/love-ledger-dev`
   - AppID输入：`wxe2ed6d7c2e6ae3e4`
   - 点击"导入"

### 步骤2: 创建数据库集合（3分钟）

1. **打开云开发控制台**
   - 点击工具栏"云开发"按钮
   - 选择环境：`cloud1-3gyaxiq6baf2a0ed`

2. **创建集合**
   - 点击"数据库"
   - 创建以下4个集合：
     - ✅ `users` - 用户表
     - ✅ `groups` - 情侣组表
     - ✅ `bills` - 账单表
     - ✅ `categories` - 分类表

3. **设置权限**（每个集合）
   - 点击集合名 → "权限设置"
   - 选择"自定义安全规则"
   - 粘贴以下规则：

**users 集合：**
```json
{
  "read": "doc._openid == auth.openid",
  "write": "doc._openid == auth.openid"
}
```

**groups 集合：**
```json
{
  "read": "auth.openid in doc.members[].openid",
  "write": "auth.openid in doc.members[].openid"
}
```

**bills 集合：**
```json
{
  "read": true,
  "write": "doc._openid == auth.openid"
}
```

**categories 集合：**
```json
{
  "read": true,
  "write": false
}
```

### 步骤3: 上传云函数（5分钟）

1. **右键 cloudfunctions 目录**
   - 选择"同步云函数列表"

2. **逐个上传云函数**
   - 右键 `init_database` → "上传并部署：云端安装依赖"
   - 右键 `bill_processor` → "上传并部署：云端安装依赖"
   - 右键 `invite_manager` → "上传并部署：云端安装依赖"

3. **等待上传完成**
   - 每个云函数约需1-2分钟
   - 看到"上传成功"提示

### 步骤4: 初始化数据库（1分钟）

1. **运行初始化云函数**
   - 云开发控制台 → 云函数
   - 点击 `init_database`
   - 点击"云端测试"
   - 查看返回结果：`{"success": true}`

2. **验证初始化**
   - 数据库 → categories 集合
   - 应该看到20条预设分类数据

### 步骤5: 测试功能（4分钟）

1. **编译项目**
   - 点击"编译"按钮
   - 在模拟器中预览

2. **测试流程**
   - ✅ 首页显示正常
   - ✅ 点击"绑定伴侣"
   - ✅ 创建组，获得邀请码
   - ✅ 切换账号，输入邀请码加入
   - ✅ 尝试手动记账
   - ✅ 查看账单列表
   - ✅ 查看统计页面

## 📱 功能测试清单

### 基础功能
- [ ] 用户登录（自动）
- [ ] 创建情侣组
- [ ] 生成邀请码
- [ ] 使用邀请码加入组
- [ ] 解除绑定

### 记账功能
- [ ] 手动记账
- [ ] 查看账单列表
- [ ] 筛选账单
- [ ] 查看账单详情
- [ ] 删除账单

### AI功能（需要上传图片测试）
- [ ] 拍照记账
- [ ] AI识别账单
- [ ] 确认识别结果

### 统计功能
- [ ] 月度统计
- [ ] 分类统计
- [ ] 消费对比

## 🔧 配置说明

### 已配置项
✅ AppID: `wxe2ed6d7c2e6ae3e4`
✅ 云环境ID: `cloud1-3gyaxiq6baf2a0ed`
✅ AI密钥: 已集成在 `bill_processor` 云函数中
✅ AI模型: GLM-4-Plus

### 可选配置

**修改预算（在 groups 集合中）：**
```json
{
  "budget": {
    "monthly": 10000,
    "categories": {
      "餐饮": 3000,
      "交通": 1000
    }
  }
}
```

## 🐛 常见问题

### 问题1: 云函数上传失败
**解决**:
1. 检查网络连接
2. 重试上传
3. 查看云开发控制台错误日志

### 问题2: 数据库权限错误
**解决**:
1. 检查安全规则是否正确
2. 确保用户已登录
3. 清除小程序缓存重新编译

### 问题3: AI识别失败
**解决**:
1. 检查智谱AI账户余额
2. 查看云函数日志
3. 确认API密钥有效

## 📊 性能优化建议

1. **图片压缩**
   - 上传前压缩图片
   - 建议尺寸：800x800以下
   - 格式：JPEG

2. **数据库索引**
   - bills集合添加索引：`groupId+date`
   - users集合添加索引：`_openid`

3. **缓存策略**
   - 分类数据本地缓存
   - 用户信息缓存1小时

## 🚀 正式发布

1. **上传代码**
   - 点击"上传"
   - 填写版本号：1.0.0
   - 填写项目备注

2. **提交审核**
   - 登录小程序后台
   - 开发管理 → 开发版本
   - 点击"提交审核"

3. **发布上线**
   - 审核通过后
   - 点击"发布"
   - 设置为全量发布

## 📞 技术支持

- **项目文档**: `FINAL_PROJECT_REPORT.md`
- **测试套件**: `test_suite.py`
- **GitHub**: https://github.com/caizhihuan/love-ledger-metagpt

---

**🎉 部署完成后，即可开始使用恋账！**

祝使用愉快！💕
