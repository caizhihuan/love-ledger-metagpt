/**
 * 个人中心页逻辑
 */

const { inviteAPI } = require('../../utils/api');

Page({
  data: {
    userInfo: { nickName: '加载中...', avatarUrl: '' },
    isBound: false
  },
  
  onLoad() {
    this.loadUserInfo();
  },
  
  onShow() {
    this.loadUserInfo();
  },
  
  async loadUserInfo() {
    try {
      const db = wx.cloud.database();
      const userRes = await db.collection('users').where({ _openid: '{openid}' }).get();
      
      if (userRes.data.length > 0) {
        const user = userRes.data[0];
        this.setData({
          userInfo: {
            nickName: user.nickName,
            avatarUrl: user.avatarUrl
          },
          isBound: !!user.groupId
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  },
  
  goToBind() {
    wx.navigateTo({ url: '/pages/bind/bind' });
  },
  
  async manageGroup() {
    const res = await wx.showModal({
      title: '情侣管理',
      content: '是否解除绑定？',
      confirmText: '解除',
      cancelText: '取消'
    });
    
    if (res.confirm) {
      const result = await inviteAPI.unbind();
      if (result.success) {
        wx.showToast({ title: '已解除绑定', icon: 'success' });
        this.loadUserInfo();
      }
    }
  },
  
  about() {
    wx.showModal({
      title: '关于恋账',
      content: '恋账 v1.0.0\n\n一款专为情侣设计的共享记账小程序\n\n💕 记录我们的每一笔',
      showCancel: false
    });
  }
});
