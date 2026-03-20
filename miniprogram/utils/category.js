/**
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
};