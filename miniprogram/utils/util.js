/**
 * 恋账 - 工具函数
 */

const formatAmount = (amount, showSign = false) => {
  const num = Math.abs(amount);
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
};