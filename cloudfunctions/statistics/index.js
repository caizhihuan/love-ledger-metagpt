/**
 * 恋账 - 统计分析云函数
 * 提供账单聚合统计功能
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const $ = _.aggregate;

/**
 * 获取月度统计
 */
async function getMonthlyStatistics(openid, year, month) {
  const userResult = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  
  if (!user.groupId) {
    throw new Error('请先绑定情侣账号');
  }
  
  const groupId = user.groupId;
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  // 总体统计
  const overallStats = await db.collection('bills')
    .aggregate()
    .match({
      groupId: groupId,
      date: _.gte(startDate).and(_.lte(endDate)),
      isDeleted: false
    })
    .group({
      _id: null,
      totalExpense: $.sum($.cond({
        if: $.lt(['$amount', 0]),
        then: '$amount',
        else: 0
      })),
      totalIncome: $.sum($.cond({
        if: $.gt(['$amount', 0]),
        then: '$amount',
        else: 0
      })),
      billCount: $.sum(1)
    })
    .end();
  
  // 分类统计
  const categoryStats = await db.collection('bills')
    .aggregate()
    .match({
      groupId: groupId,
      date: _.gte(startDate).and(_.lte(endDate)),
      isDeleted: false
    })
    .group({
      _id: '$category',
      amount: $.sum('$amount'),
      count: $.sum(1)
    })
    .sort({
      amount: 1
    })
    .limit(10)
    .end();
  
  // 成员统计
  const memberStats = await db.collection('bills')
    .aggregate()
    .match({
      groupId: groupId,
      date: _.gte(startDate).and(_.lte(endDate)),
      isDeleted: false
    })
    .group({
      _id: '$_openid',
      totalExpense: $.sum($.cond({
        if: $.lt(['$amount', 0]),
        then: '$amount',
        else: 0
      })),
      totalIncome: $.sum($.cond({
        if: $.gt(['$amount', 0]),
        then: '$amount',
        else: 0
      })),
      billCount: $.sum(1)
    })
    .end();
  
  // 获取成员信息
  const groupResult = await db.collection('groups').doc(groupId).get();
  const memberOpenids = groupResult.data.members.map(m => m.openid);
  
  const membersInfo = await db.collection('users').where({
    _openid: _.in(memberOpenids)
  }).get();
  
  const membersMap = {};
  membersInfo.data.forEach(m => {
    membersMap[m._openid] = {
      nickName: m.nickName,
      avatarUrl: m.avatarUrl
    };
  });
  
  // 组装成员统计
  const memberStatistics = memberStats.list.map(stat => ({
    openid: stat._id,
    ...membersMap[stat._id],
    totalExpense: Math.abs(stat.totalExpense),
    totalIncome: stat.totalIncome,
    billCount: stat.billCount
  }));
  
  // 计算消费比例
  const totalExpense = overallStats.list[0]?.totalExpense || 0;
  const totalIncome = overallStats.list[0]?.totalIncome || 0;
  
  if (memberStatistics.length === 2 && totalExpense !== 0) {
    const ratio = memberStatistics[0].totalExpense / (memberStatistics[0].totalExpense + memberStatistics[1].totalExpense);
    memberStatistics[0].expenseRatio = (ratio * 100).toFixed(1);
    memberStatistics[1].expenseRatio = ((1 - ratio) * 100).toFixed(1);
  }
  
  return {
    success: true,
    data: {
      year,
      month,
      overall: {
        totalExpense: Math.abs(totalExpense),
        totalIncome: totalIncome,
        balance: totalIncome + totalExpense,
        billCount: overallStats.list[0]?.billCount || 0
      },
      categories: categoryStats.list.map(cat => ({
        category: cat._id,
        amount: Math.abs(cat.amount),
        count: cat.count
      })),
      members: memberStatistics
    }
  };
}

/**
 * 获取趋势数据
 */
async function getTrendData(openid) {
  const userResult = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userResult.data.length === 0 || !userResult.data[0].groupId) {
    throw new Error('请先绑定情侣账号');
  }
  
  const groupId = userResult.data[0].groupId;
  const trendData = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const stats = await db.collection('bills')
      .aggregate()
      .match({
        groupId: groupId,
        date: _.gte(startDate).and(_.lte(endDate)),
        isDeleted: false
      })
      .group({
        _id: null,
        expense: $.sum($.cond({
          if: $.lt(['$amount', 0]),
          then: '$amount',
          else: 0
        })),
        income: $.sum($.cond({
          if: $.gt(['$amount', 0]),
          then: '$amount',
          else: 0
        }))
      })
      .end();
    
    trendData.push({
      year,
      month,
      label: `${month}月`,
      expense: Math.abs(stats.list[0]?.expense || 0),
      income: stats.list[0]?.income || 0
    });
  }
  
  return {
    success: true,
    data: trendData
  };
}

// ==================== 云函数入口 ====================
exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'monthly':
        const year = data?.year || new Date().getFullYear();
        const month = data?.month || new Date().getMonth() + 1;
        return await getMonthlyStatistics(OPENID, year, month);
        
      case 'trend':
        return await getTrendData(OPENID);
        
      default:
        throw new Error(`未知的操作类型: ${action}`);
    }
  } catch (error) {
    console.error('统计失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
