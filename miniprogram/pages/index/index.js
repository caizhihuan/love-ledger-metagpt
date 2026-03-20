/**
 * 恋账 - 记账首页逻辑
 */

const { formatAmount, formatDate, showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');
const { billAPI, inviteAPI } = require('../../utils/api');
const { expenseCategories, incomeCategories } = require('../../utils/category');

Page({
  data: {
    currentMonth: 0,
    currentDay: 0,
    weekday: '',
    isBound: false,
    todayExpense: '¥0.00',
    monthExpense: '¥0.00',
    
    inputText: '',
    aiResult: null,
    
    currentType: 'expense',
    displayCategories: expenseCategories,
    categories: [...expenseCategories, ...incomeCategories],
    categoryIndex: 0,
    
    showManualModal: false,
    manualAmount: '',
    manualCategory: '餐饮',
    manualDesc: '',
    manualDate: formatDate(new Date())
  },
  
  onLoad() {
    this.initDate();
    this.checkBindStatus();
  },
  
  onShow() {
    this.checkBindStatus();
    this.loadTodayStats();
  },
  
  initDate() {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    
    this.setData({
      currentMonth: now.getMonth() + 1,
      currentDay: now.getDate(),
      weekday: days[now.getDay()]
    });
  },
  
  async checkBindStatus() {
    try {
      const result = await inviteAPI.getInfo();
      this.setData({ isBound: result.success && result.isBound });
    } catch (error) {
      console.error('检查绑定状态失败:', error);
    }
  },
  
  async loadTodayStats() {
    if (!this.data.isBound) return;
    
    try {
      const db = wx.cloud.database();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const userRes = await db.collection('users').where({ _openid: '{openid}' }).get();
      if (userRes.data.length === 0 || !userRes.data[0].groupId) return;
      
      const groupId = userRes.data[0].groupId;
      
      // 今日支出
      const todayRes = await db.collection('bills')
        .where({
          groupId: groupId,
          date: db.command.gte(todayStart).and(db.command.lte(todayEnd)),
          amount: db.command.lt(0),
          isDeleted: false
        })
        .get();
      
      const todayExpense = todayRes.data.reduce((sum, bill) => sum + bill.amount, 0);
      
      // 本月支出
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      const monthRes = await db.collection('bills')
        .where({
          groupId: groupId,
          date: db.command.gte(monthStart).and(db.command.lte(monthEnd)),
          amount: db.command.lt(0),
          isDeleted: false
        })
        .get();
      
      const monthExpense = monthRes.data.reduce((sum, bill) => sum + bill.amount, 0);
      
      this.setData({
        todayExpense: formatAmount(Math.abs(todayExpense)),
        monthExpense: formatAmount(Math.abs(monthExpense))
      });
      
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  },
  
  onInputChange(e) {
    this.setData({ inputText: e.detail.value });
  },
  
  async analyzeText() {
    const text = this.data.inputText.trim();
    if (!text) {
      showError('请输入内容');
      return;
    }
    
    showLoading('AI识别中...');
    
    try {
      const result = await billAPI.analyzeText(text);
      hideLoading();
      
      if (result.success) {
        const categoryIndex = this.data.categories.findIndex(c => c.name === result.data.category);
        
        this.setData({
          aiResult: result.data,
          categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
        });
      } else {
        showError(result.error || '识别失败');
      }
    } catch (error) {
      hideLoading();
      showError('AI识别失败');
    }
  },
  
  onAmountChange(e) {
    this.setData({ 'aiResult.amount': parseFloat(e.detail.value) || 0 });
  },
  
  onCategoryChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      categoryIndex: index,
      'aiResult.category': this.data.categories[index].name
    });
  },
  
  onDescChange(e) {
    this.setData({ 'aiResult.description': e.detail.value });
  },
  
  cancelAI() {
    this.setData({ aiResult: null, inputText: '' });
  },
  
  async confirmAI() {
    const aiResult = this.data.aiResult;
    showLoading('保存中...');
    
    try {
      const result = await billAPI.create({
        amount: aiResult.amount,
        type: aiResult.type,
        category: aiResult.category,
        description: aiResult.description,
        date: aiResult.date,
        aiParsed: aiResult.aiParsed
      });
      
      hideLoading();
      
      if (result.success) {
        showSuccess('记账成功');
        this.cancelAI();
        this.loadTodayStats();
      } else {
        showError(result.error || '记账失败');
      }
    } catch (error) {
      hideLoading();
      showError('记账失败');
    }
  },
  
  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera']
      });
      
      const tempFilePath = res.tempFiles[0].tempFilePath;
      
      showLoading('上传中...');
      
      // 上传到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: `bills/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`,
        filePath: tempFilePath
      });
      
      hideLoading();
      showLoading('AI识别中...');
      
      // AI识别
      const result = await billAPI.analyzeImage(uploadRes.fileID);
      
      hideLoading();
      
      if (result.success) {
        const categoryIndex = this.data.categories.findIndex(c => c.name === result.data.category);
        
        this.setData({
          aiResult: result.data,
          categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
        });
      } else {
        showError(result.error || '识别失败');
      }
      
    } catch (error) {
      hideLoading();
      showError('操作失败');
    }
  },
  
  manualAdd() {
    this.setData({
      showManualModal: true,
      manualAmount: '',
      manualCategory: this.data.currentType === 'expense' ? '餐饮' : '工资',
      manualDesc: '',
      manualDate: formatDate(new Date())
    });
  },
  
  closeManualModal() {
    this.setData({ showManualModal: false });
  },
  
  preventClose() {},
  
  onManualAmountInput(e) {
    this.setData({ manualAmount: e.detail.value });
  },
  
  onManualDescInput(e) {
    this.setData({ manualDesc: e.detail.value });
  },
  
  onManualDateChange(e) {
    this.setData({ manualDate: e.detail.value });
  },
  
  selectManualCategory(e) {
    this.setData({ manualCategory: e.currentTarget.dataset.category });
  },
  
  async submitManual() {
    const { manualAmount, manualCategory, manualDesc, manualDate, currentType } = this.data;
    const amount = parseFloat(manualAmount);
    
    if (!amount || amount <= 0) {
      showError('请输入有效金额');
      return;
    }
    
    showLoading('保存中...');
    
    try {
      const result = await billAPI.create({
        amount: currentType === 'expense' ? -amount : amount,
        type: currentType,
        category: manualCategory,
        description: manualDesc,
        date: manualDate
      });
      
      hideLoading();
      
      if (result.success) {
        showSuccess('记账成功');
        this.closeManualModal();
        this.loadTodayStats();
      } else {
        showError(result.error || '记账失败');
      }
    } catch (error) {
      hideLoading();
      showError('记账失败');
    }
  },
  
  switchType(e) {
    const type = e.currentTarget.dataset.type;
    
    this.setData({
      currentType: type,
      displayCategories: type === 'expense' ? expenseCategories : incomeCategories,
      manualCategory: type === 'expense' ? '餐饮' : '工资'
    });
  },
  
  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    
    this.setData({
      showManualModal: true,
      manualAmount: '',
      manualCategory: category,
      manualDesc: '',
      manualDate: formatDate(new Date())
    });
  }
});
