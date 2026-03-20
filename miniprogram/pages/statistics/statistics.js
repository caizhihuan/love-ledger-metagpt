/**
 * 统计页逻辑
 */

const { formatAmount, showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    stats: {
      totalExpense: '¥0.00',
      totalIncome: '¥0.00'
    },
    categories: []
  },
  
  onLoad() {
    this.loadStatistics();
  },
  
  onShow() {
    this.loadStatistics();
  },
  
  async loadStatistics() {
    showLoading('加载中...');
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'statistics',
        data: {
          action: 'monthly',
          data: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1
          }
        }
      });
      
      hideLoading();
      
      if (res.result.success) {
        const { overall, categories } = res.result.data;
        
        this.setData({
          stats: {
            totalExpense: formatAmount(overall.totalExpense),
            totalIncome: formatAmount(overall.totalIncome)
          },
          categories: categories.map(cat => ({
            category: cat.category,
            amount: formatAmount(cat.amount)
          }))
        });
      }
    } catch (error) {
      hideLoading();
      showError('加载失败');
    }
  },
  
  async generateReport() {
    showLoading('生成中...');
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'ai_advisor',
        data: { action: 'weekly' }
      });
      
      hideLoading();
      
      if (res.result.success) {
        wx.showModal({
          title: '理财周报',
          content: res.result.data.report,
          showCancel: false
        });
      } else {
        showError(res.result.error || '生成失败');
      }
    } catch (error) {
      hideLoading();
      showError('生成失败');
    }
  }
});
