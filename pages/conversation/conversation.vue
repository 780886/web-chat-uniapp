<template>
  <div class="chat-page">
    <!-- 搜索栏 -->
    <!-- <div class="search-bar">
      <input type="text" placeholder="请输入你要搜索的关键字" class="search-input" />
    </div> -->

    <!-- 内容区域 -->
    <div class="content">
      <div v-if="conversations.length === 0" class="empty-state">
        <img src="/static/empty.png" alt="暂无会话" class="empty-image"/>
        <div class="empty-text">暂无会话</div>
      </div>
      <div v-else class="chat-list">
        <div v-for="(conversation, index) in conversations" :key="index" class="chat-item"
             @click="navigateToChat(conversation)">
          <div class="chat-avatar">
            <img :src="conversation.avatar" alt="头像" class="avatar-img"/>
          </div>
          <div class="chat-info">
            <div class="chat-name">{{ conversation.name }}</div>
            <div class="chat-last-message">{{ conversation.content }}</div>
          </div>
          <div class="chat-time">{{ formatTime(conversation.lastSendTime) }}</div> <!-- 显示时间 -->
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
<!--    <div class="tab-bar">-->
<!--      <div class="tab-item" :class="{ active: activeTab === 'conversation' }" @click="navigateTo('conversation')">-->
<!--        <img src="/static/conversation-selected.png" alt="消息" class="tab-icon"/>-->
<!--        <div class="tab-text">消息</div>-->
<!--      </div>-->
<!--      <div class="tab-item" :class="{ active: activeTab === 'contact' }" @click="navigateTo('contact')">-->
<!--        <img src="/static/contact-selected.png" alt="通讯录" class="tab-icon"/>-->
<!--        <div class="tab-text">通讯录</div>-->
<!--      </div>-->
<!--      <div class="tab-item" :class="{ active: activeTab === 'my' }" @click="navigateTo('my')">-->
<!--        <img src="/static/me-selected.png" alt="我的" class="tab-icon"/>-->
<!--        <div class="tab-text">我</div>-->
<!--      </div>-->
<!--    </div>-->
  </div>
</template>

<script>
import request from "@/utils/request";
import * as wsApi from '../../common/websocket';
import UNI_APP from "../../.env";
import {toTimeText, isYestday, isYear, formatDateTime} from "../../utils/date";

export default {
  data() {
    return {
      pageNo: 1,
      pageSize: 10,
      activeTab: 'conversation', // 默认选中的 tab
      // 模拟一些聊天记录
      conversations: []
    };
  },
  //刚加载
  onLoad() {
    const loginToken = uni.getStorageSync("login-token");
    wsApi.connect(UNI_APP.WS_URL, loginToken);
  },
  onShow() {
    this.getConversationList(); // 组件加载时调用接口
  },
  methods: {
    // 格式化时间显示
    formatTime(time) {
      return toTimeText(time,false);
      // const date = new Date(time);
      // const hours = String(date.getHours()).padStart(2, '0');
      // const minutes = String(date.getMinutes()).padStart(2, '0');
      // return `${hours}:${minutes}`; // 格式化为时:分
    },
    navigateTo(tab) {
      this.activeTab = tab; // 更新当前选中的 tab
      // 根据 tab 值跳转
      if (tab === 'conversation') {
        uni.navigateTo({
          url: "/pages/conversation/conversation", // 登录成功后的页面
        });
      } else if (tab === 'contact') {
        uni.navigateTo({
          url: "/pages/contact/contact", // 登录成功后的页面
        });
      } else if (tab === 'my') {
        uni.navigateTo({
          url: "/pages/my/my", // 登录成功后的页面
        });
      }
    },
    //获取会话列表
    async getConversationList() {
      const loginToken = uni.getStorageSync("login-token");
      console.log("loginToken:", loginToken)
      try {
        // 调用封装的请求
        const res = await request({
          url: "/conversation/conversation-list", // 替换为实际接口地址
          method: "GET",
          data: {
            pageNo: this.pageNo,
            pageSize: this.pageSize
          },
          header: {
            // 额外的头信息
            "login-token": loginToken,
            "ajax": true
          },
        });

        // 打印完整响应
        console.log("响应结果：", res);
        // 处理响应
        if (res.code === '0') {
          this.conversations = res.data.list;

        } else {
          uni.showToast({
            title: res.message || "获取会话失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取会话失败:", error);
        uni.showToast({
          title: "获取会话失败，请重试",
          icon: "none",
        });
      }
    },
    navigateToChat(conversation) {
      const roomId = Number(conversation.roomId); // 确保是数字
      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/chat/chat?roomId=${roomId}&name=${conversation.name}&avatar=${conversation.avatar}`, // 通过 URL 的 query 传递参数
        });
      }, 5);
    }
  }
};
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.search-bar {
  background-color: #ffffff;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  box-sizing: border-box;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.empty-state {
  text-align: center;
}

.empty-image {
  width: 150px;
  height: 150px;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 16px;
  color: #999999;
}

.chat-list {
  padding: 14px;
  overflow-y: auto;
  width: 100%;
}

.chat-item {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  align-items: center;
}

.chat-avatar {
  margin-right: 10px;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 10%;
}

.chat-info {
  flex: 1;
}

.chat-name {
  font-size: 16px;
  color: #333;
}

.chat-last-message {
  font-size: 14px;
  color: #999;
  max-width: 80%;
  white-space: nowrap; /* 防止文本换行 */
  overflow: hidden; /* 隐藏超出部分 */
  text-overflow: ellipsis; /* 超出部分显示省略号 */
}

.chat-time {
  font-size: 12px;
  color: #b0b0b0;
  /* 时间的颜色 */
}

.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #ffffff;
  padding: 10px 0;
  border-top: 1px solid #ddd;
  position: absolute;
  bottom: 0%;
  width: 100%;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  color: #999999;
}

.tab-item.active {
  color: #007aff;
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 5px;
}

.tab-text {
  font-size: 12px;
}
</style>