/**
 * 恋账 - 邀请管理云函数
 * 处理情侣绑定、邀请码生成等
 */

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

/**
 * 生成邀请码（6位字母数字）
 */
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // 去掉容易混淆的字符
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 创建新的情侣组
 */
async function createGroup(openid) {
  // 检查用户是否已绑定
  const userCheck = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userCheck.data.length === 0) {
    throw new Error('用户不存在，请先登录');
  }
  
  const user = userCheck.data[0];
  
  if (user.groupId) {
    throw new Error('您已绑定，不能重复创建');
  }
  
  // 生成唯一邀请码
  let inviteCode;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    inviteCode = generateInviteCode();
    
    // 检查邀请码是否已存在
    const existGroup = await db.collection('groups').where({
      inviteCode: inviteCode
    }).count();
    
    if (existGroup.total === 0) {
      break;
    }
    
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    throw new Error('生成邀请码失败，请重试');
  }
  
  // 创建组
  const groupData = {
    members: [{
      openid: openid,
      role: 'owner',
      joinedAt: db.serverDate()
    }],
    inviteCode: inviteCode,
    inviteCodeExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7天有效期
    budget: {
      monthly: 0,  // 默认无预算
      categories: {}
    },
    createdAt: db.serverDate(),
    status: 'active'
  };
  
  const groupResult = await db.collection('groups').add({ data: groupData });
  const groupId = groupResult._id;
  
  // 更新用户的groupId
  await db.collection('users').where({
    _openid: openid
  }).update({
    data: {
      groupId: groupId,
      updatedAt: db.serverDate()
    }
  });
  
  return {
    success: true,
    groupId: groupId,
    inviteCode: inviteCode,
    expiresAt: groupData.inviteCodeExpires
  };
}

/**
 * 使用邀请码加入组
 */
async function joinGroup(openid, inviteCode) {
  // 检查用户状态
  const userCheck = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userCheck.data.length === 0) {
    throw new Error('用户不存在，请先登录');
  }
  
  const user = userCheck.data[0];
  
  if (user.groupId) {
    throw new Error('您已绑定，请先解除当前绑定');
  }
  
  // 查找邀请码对应的组
  const groupResult = await db.collection('groups').where({
    inviteCode: inviteCode.toUpperCase(),
    status: 'active'
  }).get();
  
  if (groupResult.data.length === 0) {
    throw new Error('邀请码无效或已过期');
  }
  
  const group = groupResult.data[0];
  
  // 检查邀请码是否过期
  if (new Date() > new Date(group.inviteCodeExpires)) {
    throw new Error('邀请码已过期');
  }
  
  // 检查组是否已满（情侣组最多2人）
  if (group.members.length >= 2) {
    throw new Error('该组已满员');
  }
  
  // 检查是否已在组内
  if (group.members.find(m => m.openid === openid)) {
    throw new Error('您已在组内');
  }
  
  // 添加成员
  await db.collection('groups').doc(group._id).update({
    data: {
      members: _.push({
        openid: openid,
        role: 'partner',
        joinedAt: db.serverDate()
      })
    }
  });
  
  // 更新用户的groupId
  await db.collection('users').where({
    _openid: openid
  }).update({
    data: {
      groupId: group._id,
      updatedAt: db.serverDate()
    }
  });
  
  return {
    success: true,
    groupId: group._id,
    message: '绑定成功！'
  };
}

/**
 * 获取组信息
 */
async function getGroupInfo(openid) {
  // 获取用户信息
  const userResult = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  
  if (!user.groupId) {
    return {
      success: true,
      isBound: false,
      group: null
    };
  }
  
  // 获取组信息
  const groupResult = await db.collection('groups').doc(user.groupId).get();
  
  if (!groupResult.data) {
    return {
      success: true,
      isBound: false,
      group: null
    };
  }
  
  const group = groupResult.data;
  
  // 获取所有成员的详细信息
  const memberOpenids = group.members.map(m => m.openid);
  const membersResult = await db.collection('users').where({
    _openid: _.in(memberOpenids)
  }).get();
  
  const membersMap = {};
  membersResult.data.forEach(m => {
    membersMap[m._openid] = m;
  });
  
  // 组装成员信息
  const members = group.members.map(m => ({
    openid: m.openid,
    role: m.role,
    joinedAt: m.joinedAt,
    nickName: membersMap[m.openid]?.nickName || '未知用户',
    avatarUrl: membersMap[m.openid]?.avatarUrl || ''
  }));
  
  return {
    success: true,
    isBound: true,
    group: {
      _id: group._id,
      members: members,
      inviteCode: m.role === 'owner' ? group.inviteCode : undefined,  // 只有owner能看到邀请码
      budget: group.budget,
      createdAt: group.createdAt
    }
  };
}

/**
 * 解除绑定
 */
async function unbindGroup(openid) {
  // 获取用户信息
  const userResult = await db.collection('users').where({
    _openid: openid
  }).get();
  
  if (userResult.data.length === 0) {
    throw new Error('用户不存在');
  }
  
  const user = userResult.data[0];
  
  if (!user.groupId) {
    throw new Error('您还未绑定');
  }
  
  // 获取组信息
  const groupResult = await db.collection('groups').doc(user.groupId).get();
  const group = groupResult.data;
  
  // 从组中移除成员
  const newMembers = group.members.filter(m => m.openid !== openid);
  
  if (newMembers.length === 0) {
    // 如果没有成员了，删除组
    await db.collection('groups').doc(group._id).remove();
  } else {
    // 更新组成员
    await db.collection('groups').doc(group._id).update({
      data: {
        members: newMembers
      }
    });
  }
  
  // 清除用户的groupId
  await db.collection('users').where({
    _openid: openid
  }).update({
    data: {
      groupId: _.remove(),
      updatedAt: db.serverDate()
    }
  });
  
  return {
    success: true,
    message: '已解除绑定'
  };
}

// ==================== 云函数入口 ====================
exports.main = async (event, context) => {
  const { action, data } = event;
  const { OPENID } = cloud.getWXContext();
  
  try {
    switch (action) {
      case 'create':
        return await createGroup(OPENID);
        
      case 'join':
        if (!data || !data.inviteCode) {
          throw new Error('请输入邀请码');
        }
        return await joinGroup(OPENID, data.inviteCode);
        
      case 'info':
        return await getGroupInfo(OPENID);
        
      case 'unbind':
        return await unbindGroup(OPENID);
        
      default:
        throw new Error(`未知的操作类型: ${action}`);
    }
  } catch (error) {
    console.error('处理失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
