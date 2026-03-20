/**
 * 账单列表页逻辑
 */

const { formatAmount, formatDate, getCategoryIcon } = require('../../utils/util');

Page({
  data: {
    selectedMonth: '',
    bills: []
  },
  
  onLoad() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.setData({ selectedMonth: month });
    this.loadBills();
  },
  
  onShow() {
    this.loadBills();
  },
  
  onMonthChange(e) {
    this.setData({
      selectedMonth: e.detail.value,
      bills: []
    });
    this.loadBills();
  },
  
  async loadBills() {
    try {
      const db = wx.cloud.database();
      const userRes = await db.collection('users').where({ _openid: '{openid}' }).get();
      
      if (userRes.data.length === 0 || !userRes.data[0].groupId) {
        this.setData({ bills: [] });
        return;
      }
      
      const groupId = userRes.data[0].groupId;
      const [year, month] = this.data.selectedMonth.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      
      const billsRes = await db.collection('bills')
        .where({
          groupId: groupId,
          date: db.command.gte(startDate).and(db.command.lte(endDate)),
          isDeleted: false
        })
        .orderBy('date', 'desc')
        .get();
      
      const bills = billsRes.data.map(bill => ({
        ...bill,
        amount: formatAmount(bill.amount, true),
        categoryIcon: getCategoryIcon(bill.category)
      }));
      
      this.setData({ bills });
      
    } catch (error) {
      console.error('加载账单失败:', error);
    }
  }
});

// 添加缺失的函数
const getCategoryIcon = (name) => {
  const icons = {
    '餐饮': '🍔', '交通': '🚗', '购物': '🛒', '居住': '🏠',
    '娱乐': '🎮', '医疗': '💊', '教育': '📚', '礼物': '🎁',
    '工作': '💼', '其他': '📦', '工资': '💰', '兼职': '💵',
    '红包': '🧧', '其他收入': '💎'
  };
  return icons[name] || '📦';
};

module.exports = { getCategoryIcon };
