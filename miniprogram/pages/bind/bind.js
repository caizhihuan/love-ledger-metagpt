/**
 * 绑定页逻辑
 */

const { inviteAPI } = require('../../utils/api');
const { showLoading, hideLoading, showSuccess, showError } = require('../../utils/util');

Page({
  data: {
    showInvite: false,
    showJoin: false,
    inviteCode: '',
    inputCode: ''
  },
  
  async createGroup() {
    showLoading('创建中...');
    
    try {
      const result = await inviteAPI.create();
      hideLoading();
      
      if (result.success) {
        this.setData({
          showInvite: true,
          inviteCode: result.inviteCode
        });
      } else {
        showError(result.error || '创建失败');
      }
    } catch (error) {
      hideLoading();
      showError('创建失败');
    }
  },
  
  joinGroup() {
    this.setData({ showJoin: true });
  },
  
  onCodeInput(e) {
    this.setData({ inputCode: e.detail.value.toUpperCase() });
  },
  
  async confirmJoin() {
    if (this.data.inputCode.length !== 6) {
      showError('请输入6位邀请码');
      return;
    }
    
    showLoading('加入中...');
    
    try {
      const result = await inviteAPI.join(this.data.inputCode);
      hideLoading();
      
      if (result.success) {
        showSuccess('绑定成功');
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' });
        }, 1500);
      } else {
        showError(result.error || '加入失败');
      }
    } catch (error) {
      hideLoading();
      showError('加入失败');
    }
  },
  
  copyCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => showSuccess('已复制')
    });
  },
  
  goBack() {
    this.setData({
      showInvite: false,
      showJoin: false,
      inputCode: ''
    });
  }
});
