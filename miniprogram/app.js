/**
 * 恋账 - 小程序入口
 */

App({
  globalData: {
    userInfo: null,
    isBound: false,
    groupId: null
  },

  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloud1-3gyaxiq6baf2a0ed', // 云环境ID
        traceUser: true,
      });
    }

    // 检查登录状态
    this.checkLoginStatus();
  },

  /**
   * 检查登录状态
   */
  async checkLoginStatus() {
    try {
      const db = wx.cloud.database();
      
      // 获取用户信息
      const userRes = await db.collection('users').where({
        _openid: '{openid}'
      }).get();
      
      if (userRes.data.length > 0) {
        const user = userRes.data[0];
        
        this.globalData.userInfo = {
          nickName: user.nickName,
          avatarUrl: user.avatarUrl
        };
        
        this.globalData.isBound = !!user.groupId;
        this.globalData.groupId = user.groupId;
      }
      
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  },

  /**
   * 更新全局数据
   */
  updateGlobalData(data) {
    this.globalData = {
      ...this.globalData,
      ...data
    };
  }
});
