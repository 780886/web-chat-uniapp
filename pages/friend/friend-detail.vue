<template>
  <div class="friend-details-container">
    <!-- 顶部导航 -->
    <!--    <div class="navbar">-->
    <!--      <div class="back-btn" @click="goBack">-->
    <!--        <div class="iconfont">&#xe600;</div>-->
    <!--      </div>-->
    <!--      <div class="title">好友详情</div>-->
    <!--    </div>-->

    <!-- 好友信息 -->
    <div class="friend-info">
      <img class="avatar" :src="friend.avatar || defaultAvatar"/>
      <div class="info">
        <span class="nickname">{{ friend.nickName }}</span>
        <span class="account">账号: {{ friend.account }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-container" v-if="!isRequestSent">
      <div class="add-friend-btn" @click="friendApply">
        添加好友
      </div>
    </div>
    <div class="status-tip" v-else>
      好友申请已发送
    </div>
  </div>
</template>

<script>
import request from "../../utils/request";
import ClientInformation from "../../common/ClientInformation";

export default {
  data() {
    return {
      friend: {
        avatar: '', // 好友头像
        nickName: 'user788948', // 好友昵称
        account: '60025', // 好友账号
      },
      isRequestSent: false, // 是否已发送好友申请
      defaultAvatar: '/static/default-avatar.png', // 默认头像路径
    };
  },
  //接收参数
  onLoad(options) {
    console.log("options", options)
    this.friend.avatar = options.avatar;
    this.friend.nickName = options.nickName;
    this.friend.account = options.userSecretIdentify;
  },
  methods: {
    goBack() {
      uni.navigateBack(); // 返回上一页
    },
    async friendApply() {
      const loginToken = uni.getStorageSync("login-token");
      console.log("loginToken:", loginToken);
      try {
        // 调用封装的请求
        const res = await request({
          url: "/audit/friend-apply", // 替换为实际接口地址
          method: "POST",
          data: {
            friendSecretIdentify: this.friend.account,
            reason: "好友申请",
          },
          header: {
            // 额外的头信息
            "login-token": loginToken,
            "ajax": true,
          },
        });

        // 打印完整响应
        console.log("响应结果：", res);
        // 处理响应
        if (res.code === '0') {
          // 模拟发送好友申请
          // this.isRequestSent = true;
          uni.showToast({
            title: '好友申请已发送',
            icon: 'none',
          });
        } else {
          uni.showToast({
            title: res.message || "好友申请失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("好友申请失败:", error);
        uni.showToast({
          title: "好友申请失败，请重试",
          icon: "none",
        });
      }
    },
    sendFriendRequest() {
      // 模拟发送好友申请
      this.isRequestSent = true;
      uni.showToast({
        title: '好友申请已发送',
        icon: 'none',
      });
    },
  },
};
</script>

<style scoped>
/* 顶部导航样式 */
.navbar {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
  background-color: #ffffff;
}

.back-btn {
  font-size: 18px;
  margin-right: 10px;
  cursor: pointer;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

/* 好友信息样式 */
.friend-info {
  display: flex;
  align-items: center;
  padding: 20px 15px;
  border-bottom: 1px solid #f5f5f5;
  background-color: #ffffff;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 10%;
  margin-right: 15px;
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.account {
  font-size: 14px;
  color: #666;
}

/* 操作按钮样式 */
.action-container {
  padding: 10px 15px;
  text-align: center;
}

.add-friend-btn {
  background-color: #409eff;
  color: #ffffff;
  border-radius: 10px;
  padding: 10px 0;
  width: 100%;
  margin: 0 auto;
  font-size: 16px;
  cursor: pointer;
}

.status-tip {
  text-align: center;
  font-size: 14px;
  color: #666;
  margin-top: 20px;
}
</style>
