<template>
  <div class="validation-container">
    <!-- 顶部导航 -->
<!--    <div class="navbar">-->
<!--      <div class="back-btn" @click="goBack">-->
<!--        <div class="iconfont">&#xe600;</div>-->
<!--      </div>-->
<!--      <div class="title">验证消息</div>-->
<!--      <div class="clear-btn" @click="clearAll">清空</div>-->
<!--    </div>-->

    <!-- 验证消息列表 -->
    <div class="message-list">
      <div class="message-item" v-for="(message, index) in messages" :key="index">
        <img class="avatar" :src="message.avatar || defaultAvatar" alt="头像" />
        <div class="info">
          <span class="nickname">{{ message.nickname }}</span>
          <span class="message">{{ message.requestMessage }}</span>
        </div>
        <div class="actions">
          <button class="reject-btn" @click="handleReject(index)">拒绝</button>
          <button class="accept-btn" @click="handleAccept(index)">同意</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      messages: [
        {
          avatar: "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg", // 头像 URL
          nickname: "user959393", // 昵称
          requestMessage: "好友申请", // 申请消息
        },
        {
          avatar: "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg", // 头像 URL
          nickname: "user959393", // 昵称
          requestMessage: "好友申请", // 申请消息
        },
        // 更多消息...
      ],
      defaultAvatar: "/static/default-avatar.png", // 默认头像路径
    };
  },
  methods: {
    goBack() {
      uni.navigateBack(); // 返回上一页
    },
    clearAll() {
      this.messages = [];
      uni.showToast({
        title: "已清空所有验证消息",
        icon: "none",
      });
    },
    handleReject(index) {
      this.messages.splice(index, 1);
      uni.showToast({
        title: "已拒绝",
        icon: "none",
      });
    },
    handleAccept(index) {
      this.messages.splice(index, 1);
      uni.showToast({
        title: "已同意",
        icon: "success",
      });
    },
  },
};
</script>

<style scoped>
/* 顶部导航样式 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
  background-color: #ffffff;
}
.back-btn {
  font-size: 18px;
  cursor: pointer;
}
.title {
  font-size: 16px;
  font-weight: bold;
}
.clear-btn {
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

/* 消息列表样式 */
.message-list {
  //padding: 2px 0px;
  background-color: #f5f5f5;
}
.message-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  padding: 6px;
  background-color: #ffffff;
  border-radius: 5px;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 10%;
  margin-right: 10px;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.nickname {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}
.message {
  font-size: 14px;
  color: #666;
}
.actions {
  display: flex;
  gap: 10px;
}
.reject-btn {
  background-color: #f56c6c;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
}
.accept-btn {
  background-color: #67c23a;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 14px;
}
</style>
