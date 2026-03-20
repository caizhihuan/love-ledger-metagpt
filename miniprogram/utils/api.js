/**
 * 恋账 - API接口封装
 */

const callFunction = async (name, data) => {
  try {
    const res = await wx.cloud.callFunction({ name, data });
    return res.result;
  } catch (error) {
    console.error('API调用失败:', error);
    throw error;
  }
};

module.exports = {
  billAPI: {
    analyzeImage: (fileID) => callFunction('bill_processor', {
      action: 'analyzeImage',
      data: { fileID }
    }),
    analyzeText: (text) => callFunction('bill_processor', {
      action: 'analyzeText',
      data: { text }
    }),
    create: (billData) => callFunction('bill_processor', {
      action: 'createBill',
      data: billData
    })
  },
  inviteAPI: {
    create: () => callFunction('invite_manager', { action: 'create' }),
    join: (inviteCode) => callFunction('invite_manager', {
      action: 'join',
      data: { inviteCode }
    }),
    getInfo: () => callFunction('invite_manager', { action: 'info' }),
    unbind: () => callFunction('invite_manager', { action: 'unbind' })
  }
};