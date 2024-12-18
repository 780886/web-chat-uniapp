<template>
  <div class="add-friend-container">
    <!-- 搜索框 -->
    <div class="search-container">
      <input
          class="search-input"
          type="text"
          v-model="userIdentify"
          placeholder="请输入好友ID"
          @confirm="findFriend"
      />
      <div class="clear-btn" v-if="userIdentify" @click="clearInput">
        <div class="iconfont" @click="findFriend">&#xe7a6;</div>
      </div>
    </div>
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
      <div class="message-list" v-if="!showTip">
        <div class="message-item" v-for="(friendApply, index) in friendApplyList" :key="index">
          <img class="avatar" :src="friendApply.avatar" alt="头像"/>
          <div class="info">
            <span class="nickname">{{ friendApply.nickName }}</span>
            <span class="message">好友申请</span>
          </div>
          <div class="actions">
            <!-- 显示 "已拒绝" 文本 -->
            <span class="status-text" v-if="friendApply.auditStatus === 0">已拒绝</span>

            <!--            &lt;!&ndash; 显示 "已同意" 文本 &ndash;&gt;-->
            <span class="status-text" v-if="friendApply.auditStatus === 1">已同意</span>

            <!-- 显示 "拒绝" 和 "同意" 按钮 -->
            <div v-if="friendApply.auditStatus === 2" class="action-buttons">
<!--            <div class="action-buttons">-->
              <button class="reject-btn" @click="handleReject(friendApply)">拒绝</button>
              <button class="accept-btn" @click="handleAccept(friendApply)">同意</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 提示信息 -->
    <div class="message-tip" v-if="showTip">
      <span>没有找到相关好友</span>
    </div>
  </div>
</template>

<script>
import request from "../../utils/request";
import ClientInformation from "../../common/ClientInformation";

export default {
  data() {
    return {
      userIdentify: '', // 输入的好友ID
      showTip: false, // 是否显示提示信息
      pageSize: 10,
      pageNo: 1,
      friendApplyList: []
    };
  },
  watch: {
    // 监听输入框值
    userIdentify(newVal) {
      if (newVal.trim() === '') {
        this.showTip = false;
      }
      // this.showTip = newVal.trim() !== ''; // 判断是否为空
    },
  },
  //加载
  onLoad() {
    this.getFriendApplyList();
  },
  methods: {
    goBack() {
      uni.navigateBack(); // 返回上一页
    },
    async handleReject(friendApply) {
      const loginToken = uni.getStorageSync("login-token");
      console.log("loginToken:", loginToken)
      try {
        // 调用封装的请求
        const res = await request({
          url: "/audit/audit-friend-apply", // 替换为实际接口地址
          method: "POST",
          data: {
            id: friendApply.id,
            reason: "拒绝",
            agree: false,
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
          uni.showToast({
            title: "已拒绝",
            icon: "none",
          });
        } else {
          uni.showToast({
            title: res.message || "",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("拒绝失败:", error);
        uni.showToast({
          title: "拒绝失败，请重试",
          icon: "none",
        });
      }
    },
    async handleAccept(friendApply) {
      const loginToken = uni.getStorageSync("login-token");
      console.log("loginToken:", loginToken)
      try {
        // 调用封装的请求
        const res = await request({
          url: "/audit/audit-friend-apply", // 替换为实际接口地址
          method: "POST",
          data: {
            id: friendApply.id,
            reason: "同意",
            agree: true,
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
          uni.showToast({
            title: "已同意",
            icon: "none",
          });
        } else {
          uni.showToast({
            title: res.message || "",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("同意失败:", error);
        uni.showToast({
          title: "同意失败，请重试",
          icon: "none",
        });
      }
    },
    async findFriend() {
      const loginToken = uni.getStorageSync("login-token");
      console.log("loginToken:", loginToken)
      try {
        // 调用封装的请求
        const res = await request({
          url: "/contact/find-friend", // 替换为实际接口地址
          method: "GET",
          data: {
            userIdentify: this.userIdentify,
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
          const userSecretIdentify = res.data.userSecretIdentify;
          const avatar = res.data.avatar;
          const nickName = res.data.nickName;
          setTimeout(() => {
            uni.navigateTo({
              url: `/pages/friend/friend-detail?userSecretIdentify=${userSecretIdentify}&nickName=${nickName}&avatar=${avatar}`, // 通过 URL 的 query 传递参数
            });
          }, 5);

        } else {
          this.showTip = true;
          // uni.showToast({
          //   title: res.message || "",
          //   icon: "none",
          // });
        }
      } catch (error) {
        console.error("查找好友失败:", error);
        this.showTip = true;
        uni.showToast({
          title: "查找好友失败，请重试",
          icon: "none",
        });
      }
    },
    async getFriendApplyList() {
      const loginToken = uni.getStorageSync("login-token");
      console.log("loginToken:", loginToken)
      try {
        // 调用封装的请求
        const res = await request({
          url: "/audit/friend-apply-list", // 替换为实际接口地址
          method: "GET",
          data: {
            pageSize: this.pageSize,
            pageNo: this.pageNo,
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
          this.friendApplyList = res.data.list.map(friendApply => {
            const auditStatusDict = friendApply.auditStatusDict;
            const auditStatus = friendApply.friendAudit.auditStatus;
            const avatar = friendApply.friendAudit.avatar;
            const id = friendApply.friendAudit.id;
            const nickName = friendApply.friendAudit.nickName;

            return {
              auditStatusDict,
              auditStatus,
              avatar,
              id,
              nickName
            }
          })
          // const userSecretIdentify = res.data.userSecretIdentify;
          // const avatar = res.data.avatar;
          // const nickName = res.data.nickName;
          // setTimeout(() => {
          //   uni.navigateTo({
          //     url: `/pages/friend/friend-detail?userSecretIdentify=${userSecretIdentify}&nickName=${nickName}&avatar=${avatar}`, // 通过 URL 的 query 传递参数
          //   });
          // }, 5);
        } else {
          uni.showToast({
            title: res.message || "",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取好友列表失败:", error);
        uni.showToast({
          title: "获取好友列表失败，请重试",
          icon: "none",
        });
      }
    },
    clearInput() {
      this.friendId = ''; // 清空输入框
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

/* 搜索框样式 */
.search-container {
  display: flex;
  align-items: center;
  margin: 20px 15px;
  background-color: #f5f5f5;
  border-radius: 10px;
  padding: 5px 10px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background-color: transparent;
}

.clear-btn {
  font-size: 16px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图标字体通用样式 */
.iconfont {
  font-family: 'iconfont';
  font-size: 16px;
  line-height: 1;
}

/* 提示信息 */
.message-tip {
  text-align: center;
  color: #666;
  margin-top: 20px;
  font-size: 14px;
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
  margin-left: 6px;
  margin-top: 5px;
  padding: 4px;
  background-color: #ffffff;
  border-radius: 5px;
  height: 50px;
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


.status-text {
  font-size: 16px;
  color: #666;
  margin: 10px 15px;
}

/* 横排按钮容器 */
.action-buttons {
  display: flex;
  gap: 10px; /* 按钮间距 */
}

/* 拒绝按钮样式（黑色字体和边框） */
.reject-btn {
  background-color: #fff;
  color: #000;
  border: 1px solid #000; /* 黑色边框 */
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px; /* 字体稍小一点 */
  line-height: 1; /* 行高缩小，避免按钮显得太高 */
}

.reject-btn:hover {
  background-color: #f0f0f0; /* 鼠标悬停效果 */
}

/* 同意按钮样式（蓝色字体和边框） */
.accept-btn {
  background-color: #fff;
  color: #007bff; /* 蓝色字体 */
  border: 1px solid #007bff; /* 蓝色边框 */
  border-radius: 5px;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
  font-size: 14px; /* 字体稍小一点 */
  line-height: 1; /* 行高缩小，避免按钮显得太高 */
}

.accept-btn:hover {
  background-color: #007bff; /* 鼠标悬停变为蓝底 */
  color: #fff; /* 鼠标悬停字体变为白色 */
}
</style>
