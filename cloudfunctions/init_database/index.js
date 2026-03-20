/**
 * 恋账 - 数据库初始化脚本
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const results = {
    categories: false,
    errors: []
  };

  try {
    // 系统预设分类
    const systemCategories = [
      // 支出类
      { name: '餐饮', icon: '🍔', type: 'expense', isSystem: true, sortOrder: 1 },
      { name: '交通', icon: '🚗', type: 'expense', isSystem: true, sortOrder: 2 },
      { name: '购物', icon: '🛒', type: 'expense', isSystem: true, sortOrder: 3 },
      { name: '居住', icon: '🏠', type: 'expense', isSystem: true, sortOrder: 4 },
      { name: '娱乐', icon: '🎮', type: 'expense', isSystem: true, sortOrder: 5 },
      { name: '医疗', icon: '💊', type: 'expense', isSystem: true, sortOrder: 6 },
      { name: '教育', icon: '📚', type: 'expense', isSystem: true, sortOrder: 7 },
      { name: '礼物', icon: '🎁', type: 'expense', isSystem: true, sortOrder: 8 },
      { name: '工作', icon: '💼', type: 'expense', isSystem: true, sortOrder: 9 },
      { name: '通讯', icon: '📱', type: 'expense', isSystem: true, sortOrder: 10 },
      { name: '水电', icon: '💧', type: 'expense', isSystem: true, sortOrder: 11 },
      { name: '宠物', icon: '🐾', type: 'expense', isSystem: true, sortOrder: 12 },
      { name: '影音', icon: '🎬', type: 'expense', isSystem: true, sortOrder: 13 },
      { name: '旅行', icon: '✈️', type: 'expense', isSystem: true, sortOrder: 14 },
      { name: '其他', icon: '📦', type: 'expense', isSystem: true, sortOrder: 99 },
      
      // 收入类
      { name: '工资', icon: '💰', type: 'income', isSystem: true, sortOrder: 1 },
      { name: '兼职', icon: '💵', type: 'income', isSystem: true, sortOrder: 2 },
      { name: '红包', icon: '🧧', type: 'income', isSystem: true, sortOrder: 3 },
      { name: '投资', icon: '📈', type: 'income', isSystem: true, sortOrder: 4 },
      { name: '其他收入', icon: '💎', type: 'income', isSystem: true, sortOrder: 99 }
    ];

    // 检查是否已初始化
    const existCategories = await db.collection('categories').where({
      isSystem: true
    }).count();

    if (existCategories.total === 0) {
      // 批量插入分类
      const insertPromises = systemCategories.map(category => 
        db.collection('categories').add({
          data: {
            ...category,
            createdAt: db.serverDate(),
            updatedAt: db.serverDate()
          }
        })
      );
      
      await Promise.all(insertPromises);
      results.categories = true;
      console.log('✅ 分类数据初始化成功');
    } else {
      console.log('ℹ️  分类数据已存在，跳过初始化');
      results.categories = true;
    }

    return {
      success: true,
      message: '数据库初始化完成',
      results
    };

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    results.errors.push(error.message);
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message,
      results
    };
  }
};
