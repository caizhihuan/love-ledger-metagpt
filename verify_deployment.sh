#!/bin/bash

# 恋账项目 - 一键部署验证脚本

echo "============================================================"
echo "🎯 恋账项目 - 部署前验证"
echo "============================================================"
echo ""

PROJECT_DIR="/Users/caizhihuan/.openclaw/workspace/love-ledger-dev"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $2"
        return 0
    else
        echo -e "${RED}❌${NC} $2"
        return 1
    fi
}

# 统计变量
TOTAL=0
PASSED=0

echo "📦 检查云函数..."
echo ""

# 检查云函数
for func in init_database bill_processor invite_manager statistics ai_advisor; do
    if check_file "$PROJECT_DIR/cloudfunctions/$func/index.js" "$func 云函数"; then
        ((PASSED++))
    fi
    ((TOTAL++))
    
    if check_file "$PROJECT_DIR/cloudfunctions/$func/package.json" "$func package.json"; then
        ((PASSED++))
    fi
    ((TOTAL++))
done

echo ""
echo "🎨 检查前端页面..."
echo ""

# 检查页面
for page in index bills statistics profile bind; do
    for ext in wxml js wxss json; do
        if check_file "$PROJECT_DIR/miniprogram/pages/$page/$page.$ext" "$page.$ext"; then
            ((PASSED++))
        fi
        ((TOTAL++))
    done
done

echo ""
echo "🔧 检查工具模块..."
echo ""

# 检查工具
for util in util api category; do
    if check_file "$PROJECT_DIR/miniprogram/utils/$util.js" "$util.js"; then
        ((PASSED++))
    fi
    ((TOTAL++))
done

echo ""
echo "⚙️  检查配置文件..."
echo ""

# 检查配置
check_file "$PROJECT_DIR/project.config.json" "project.config.json"
((TOTAL++))
((PASSED++))

check_file "$PROJECT_DIR/miniprogram/app.json" "app.json"
((TOTAL++))
((PASSED++))

check_file "$PROJECT_DIR/miniprogram/app.js" "app.js"
((TOTAL++))
((PASSED++))

check_file "$PROJECT_DIR/miniprogram/app.wxss" "app.wxss"
((TOTAL++))
((PASSED++))

echo ""
echo "📚 检查文档..."
echo ""

# 检查文档
for doc in README.md DEPLOYMENT_GUIDE.md FINAL_REPORT.md; do
    if check_file "$PROJECT_DIR/$doc" "$doc"; then
        ((PASSED++))
    fi
    ((TOTAL++))
done

echo ""
echo "============================================================"
echo "📊 验证结果:"
echo "============================================================"
echo ""
echo "  总计检查: $TOTAL"
echo -e "  ${GREEN}通过: $PASSED${NC}"
echo -e "  ${RED}失败: $((TOTAL - PASSED))${NC}"
echo ""

if [ $PASSED -eq $TOTAL ]; then
    SUCCESS_RATE=100
    echo -e "  ${GREEN}成功率: $SUCCESS_RATE%${NC}"
    echo ""
    echo "============================================================"
    echo -e "${GREEN}🎉 所有检查通过！项目可以部署！${NC}"
    echo "============================================================"
    echo ""
    echo "📋 下一步操作:"
    echo ""
    echo "1. 打开微信开发者工具"
    echo "2. 导入项目: $PROJECT_DIR"
    echo "3. AppID: wxe2ed6d7c2e6ae3e4"
    echo "4. 查看部署指南: DEPLOYMENT_GUIDE.md"
    echo ""
    exit 0
else
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo -e "  ${YELLOW}成功率: $SUCCESS_RATE%${NC}"
    echo ""
    echo "============================================================"
    echo -e "${YELLOW}⚠️  部分检查未通过，请查看上方详情${NC}"
    echo "============================================================"
    echo ""
    exit 1
fi
