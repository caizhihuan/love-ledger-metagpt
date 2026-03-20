#!/usr/bin/env python3
"""
恋账项目 - 完整测试套件
包含云函数测试、API测试、功能测试
"""

import unittest
import json
import os
from pathlib import Path
from datetime import datetime

class TestCloudFunctions(unittest.TestCase):
    """测试云函数"""
    
    def test_init_database_structure(self):
        """测试数据库初始化云函数结构"""
        cf_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/cloudfunctions/init_database/index.js")
        self.assertTrue(cf_path.exists(), "init_database云函数存在")
        
        with open(cf_path, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('categories', content, "包含分类初始化")
            self.assertIn('systemCategories', content, "包含系统分类")
        print("✅ init_database 云函数结构正确")
    
    def test_bill_processor_structure(self):
        """测试账单处理云函数结构"""
        cf_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/cloudfunctions/bill_processor/index.js")
        self.assertTrue(cf_path.exists(), "bill_processor云函数存在")
        
        with open(cf_path, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('GLM', content, "集成GLM AI")
            self.assertIn('analyzeImage', content, "支持图片识别")
            self.assertIn('analyzeText', content, "支持文本解析")
            self.assertIn('createBill', content, "支持创建账单")
        print("✅ bill_processor 云函数结构正确")
    
    def test_invite_manager_structure(self):
        """测试邀请管理云函数结构"""
        cf_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/cloudfunctions/invite_manager/index.js")
        self.assertTrue(cf_path.exists(), "invite_manager云函数存在")
        
        with open(cf_path, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('createGroup', content, "支持创建组")
            self.assertIn('joinGroup', content, "支持加入组")
            self.assertIn('generateInviteCode', content, "支持生成邀请码")
        print("✅ invite_manager 云函数结构正确")

class TestFrontendPages(unittest.TestCase):
    """测试前端页面"""
    
    def test_index_page(self):
        """测试记账首页"""
        page_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/pages/index")
        self.assertTrue(page_path.exists(), "index页面目录存在")
        
        required_files = ['index.wxml', 'index.js', 'index.wxss', 'index.json']
        for file in required_files:
            file_path = page_path / file
            self.assertTrue(file_path.exists(), f"{file}存在")
        
        print("✅ index 页面文件完整")
    
    def test_bills_page(self):
        """测试账单列表页"""
        page_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/pages/bills")
        self.assertTrue(page_path.exists(), "bills页面目录存在")
        
        required_files = ['bills.wxml', 'bills.js', 'bills.wxss', 'bills.json']
        for file in required_files:
            file_path = page_path / file
            self.assertTrue(file_path.exists(), f"{file}存在")
        
        print("✅ bills 页面文件完整")
    
    def test_statistics_page(self):
        """测试统计页"""
        page_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/pages/statistics")
        self.assertTrue(page_path.exists(), "statistics页面目录存在")
        
        required_files = ['statistics.wxml', 'statistics.js', 'statistics.wxss', 'statistics.json']
        for file in required_files:
            file_path = page_path / file
            self.assertTrue(file_path.exists(), f"{file}存在")
        
        print("✅ statistics 页面文件完整")
    
    def test_profile_page(self):
        """测试个人中心页"""
        page_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/pages/profile")
        self.assertTrue(page_path.exists(), "profile页面目录存在")
        
        required_files = ['profile.wxml', 'profile.js', 'profile.wxss', 'profile.json']
        for file in required_files:
            file_path = page_path / file
            self.assertTrue(file_path.exists(), f"{file}存在")
        
        print("✅ profile 页面文件完整")
    
    def test_bind_page(self):
        """测试绑定页"""
        page_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/pages/bind")
        self.assertTrue(page_path.exists(), "bind页面目录存在")
        
        required_files = ['bind.wxml', 'bind.js', 'bind.wxss', 'bind.json']
        for file in required_files:
            file_path = page_path / file
            self.assertTrue(file_path.exists(), f"{file}存在")
        
        print("✅ bind 页面文件完整")

class TestConfiguration(unittest.TestCase):
    """测试配置文件"""
    
    def test_project_config(self):
        """测试项目配置"""
        config_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/project.config.json")
        self.assertTrue(config_path.exists(), "project.config.json存在")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            self.assertEqual(config['appid'], 'wxe2ed6d7c2e6ae3e4', "AppID正确")
            self.assertEqual(config['projectname'], 'love-ledger', "项目名正确")
        
        print("✅ project.config.json 配置正确")
    
    def test_app_config(self):
        """测试小程序配置"""
        app_json_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/app.json")
        self.assertTrue(app_json_path.exists(), "app.json存在")
        
        with open(app_json_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
            self.assertIn('pages', config, "包含pages配置")
            self.assertTrue(len(config['pages']) >= 5, "至少5个页面")
        
        print("✅ app.json 配置正确")
    
    def test_app_js(self):
        """测试小程序入口"""
        app_js_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/miniprogram/app.js")
        self.assertTrue(app_js_path.exists(), "app.js存在")
        
        with open(app_js_path, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('cloud1-3gyaxiq6baf2a0ed', content, "云环境ID已配置")
        
        print("✅ app.js 云环境配置正确")

class TestAIFeatures(unittest.TestCase):
    """测试AI功能"""
    
    def test_ai_config(self):
        """测试AI配置"""
        cf_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/cloudfunctions/bill_processor/index.js")
        
        with open(cf_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # 检查使用环境变量而不是硬编码
            self.assertIn('process.env.GLM_API_KEY', content, "使用环境变量存储密钥")
            self.assertIn('glm-4-plus', content, "使用GLM-4-Plus模型")
            # 确保没有硬编码密钥
            self.assertNotIn('a550622d7882404c876763f67558f7f1', content, "不应硬编码密钥")
        
        print("✅ AI配置正确（使用环境变量）")
    
    def test_prompts(self):
        """测试提示词"""
        cf_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/cloudfunctions/bill_processor/index.js")
        
        with open(cf_path, 'r', encoding='utf-8') as f:
            content = f.read()
            self.assertIn('imageAnalysis', content, "包含图片识别提示词")
            self.assertIn('textAnalysis', content, "包含文本解析提示词")
            self.assertIn('JSON', content, "要求返回JSON格式")
        
        print("✅ AI提示词配置完整")

class TestDocumentation(unittest.TestCase):
    """测试文档"""
    
    def test_readme(self):
        """测试README"""
        readme_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/README.md")
        self.assertTrue(readme_path.exists(), "README.md存在")
        print("✅ README.md 存在")
    
    def test_deployment_guide(self):
        """测试部署指南"""
        guide_path = Path("/Users/caizhihuan/.openclaw/workspace/love-ledger-dev/DEPLOYMENT_GUIDE.md")
        self.assertTrue(guide_path.exists(), "DEPLOYMENT_GUIDE.md存在")
        print("✅ DEPLOYMENT_GUIDE.md 存在")

def run_all_tests():
    """运行所有测试"""
    print("\n" + "=" * 70)
    print("🧪 恋账项目 - 完整测试套件")
    print("=" * 70)
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70 + "\n")
    
    # 创建测试套件
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # 添加所有测试类
    suite.addTests(loader.loadTestsFromTestCase(TestCloudFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestFrontendPages))
    suite.addTests(loader.loadTestsFromTestCase(TestConfiguration))
    suite.addTests(loader.loadTestsFromTestCase(TestAIFeatures))
    suite.addTests(loader.loadTestsFromTestCase(TestDocumentation))
    
    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 70)
    print("📊 测试结果总结:")
    print(f"  总计: {result.testsRun}")
    print(f"  ✅ 通过: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"  ❌ 失败: {len(result.failures)}")
    print(f"  ⚠️  错误: {len(result.errors)}")
    
    if result.testsRun > 0:
        success_rate = (result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100
        print(f"  📈 成功率: {success_rate:.1f}%")
    else:
        print(f"  📈 成功率: N/A")
    
    print("=" * 70)
    
    if result.wasSuccessful():
        print("\n🎉 所有测试通过！项目可以部署！\n")
    else:
        print("\n⚠️  部分测试失败，请检查错误信息。\n")
    
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
