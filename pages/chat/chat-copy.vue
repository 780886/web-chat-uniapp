<template>
  <div class="chat-page">
    <!-- 滚动区域 -->
    <div class="chat-content">
      <!-- 循环展示消息 -->
      <div v-for="(message, index) in messages" :key="index"
           :class="['message-item', message.type === 'right' ? 'right' : 'left']">
        <div class="avatar" v-if="message.type === 'left'">
          <img :src="message.avatar" alt="头像"/>
        </div>
        <div class="message-bubble">{{ message.content }}</div>
        <div class="avatar" v-if="message.type === 'right'">
          <img :src="message.avatar" alt="头像"/>
        </div>
      </div>
    </div>
    <!-- 底部输入框 -->
    <div class="chat-input-bar">
      <div class="input-actions">
        <img src="/static/microphone-icon.png" alt="语音"/>
      </div>
      <input type="text" v-model="content" class="input-box" placeholder="发送消息..." @keydown.enter="sendMessage"/>
      <div class="input-actions">
        <img src="/static/biaoqing.png" alt="表情"/>
        <img src="/static/send-more.png" alt="更多"/>
      </div>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request";
import * as wsApi from '../../common/websocket';
import UNI_APP from '../../.env.js'
import {computed, watch} from 'vue';
import userChatStore from "../../store/chatStore";
import {getLoginToken} from "../../utils/auth";

// 获取全局的 chatStore
// const chatStore = chatStore.chats();

export default {
  data() {
    return {
      pageNo: 1,
      pageSize: 10,
      roomId: 0,
      content: "",
      scrollMsgIdx: 0,
      showMinIdx: 0, // 下标小于showMinIdx的消息不显示，否则可能很卡
      messages: [],
      avatar: '', // 会话头像
    };
  },

  setup() {
    console.log("setup加载")
    const chatStore = userChatStore();

    // 监听 chatStore.messages 的变化
    watch(() => chatStore.chats, (newMessages) => {
      console.log('messages updated: ', newMessages);
      this.messages = newMessages; // 同步 messages
    });

    return {
      chatStore
    };
  },
  // computed: {
  //   // 使用 computed 来获取 store 中的数据，这样能确保响应式
  //   // chats() {
  //   //   return userChatStore.chats;
  //   // }
  //   customComputedValue(){
  //     const currentChats = userChatStore().currentChats;
  //     console.log("currentChats",currentChats);
  //     return currentChats;
  //
  //   }
  //
  // },
  // watch: {
  //   // 监听 chats 数组的变化，当数据发生变化时，更新 messages 数组
  //   customComputedValue(newChats) {
  //     console.log("chats changed: ", newChats);
  //     // this.messages.push(...newChats.slice(this.messages.length));
  //   }
  // },
  onLoad(options) {
    // 获取跳转时传递的 roomId
    this.avatar = options.avatar;
    if (options.roomId) {
      console.log(typeof options.roomId);
      this.roomId = Number(options.roomId);
      this.getMessageList(); // 根据 roomId 加载消息列表
    }
    // const chats = this.chatStore.chats;
    // this.chat = this.chatStore.chats;
    // console.log("chatCache",this.chat);
    // const loginToken = uni.getStorageSync("login-token");
    // wsApi.init();
    // wsApi.connect(UNI_APP.WS_URL, loginToken);
    // wsApi.onConnect(() => {
    //   // // 重连成功提示
    //   // if (this.reconnecting) {
    //   //   this.reconnecting = false;
    //   //   uni.showToast({
    //   //     title: "已重新连接",
    //   //     icon: 'none'
    //   //   })
    //   // }
    // });
    // wsApi.onMessage((type, data) => {
    //   if (type === 4) {
    //     //单聊消息
    //     console.log("data", data);
    //     // 处理数据
    //     const loginUser = uni.getStorageSync('loginUser');
    //     const currentLoginUserId = loginUser.userId;
    //     const roomId = data.roomId;
    //     if (roomId !== this.roomId) {
    //       return;
    //     }
    //     const senderUserId = data.senderUserId;
    //     if (senderUserId === currentLoginUserId) {
    //       return
    //     }
    //     const type = senderUserId === currentLoginUserId ? "right" : "left";
    //     const content = data.content;
    //     const message = {
    //       type: type, // 消息类型（"left" 或 "right"）
    //       content: content, // 消息内容
    //       avatar: avatar, // 头像
    //     }
    //     // 赋值处理后的数据
    //     this.messages.push(message);
    //   }
    // })
  },

  // watch: {
  //   // 监听消息数组的变化，自动滚动到底部
  //   messages() {
  //     this.$nextTick(() => {
  //       this.scrollToBottom();
  //     });
  //   },
  // },
  methods: {
    onScrollToTop() {
      if (this.showMinIdx == 0) {
        console.log("消息已滚动到顶部")
        return;
      }
      //  #ifndef H5
      // 防止滚动条定格在顶部，不能一直往上滚
      this.scrollToMsgIdx(this.showMinIdx);
      // #endif
      // 多展示0条信息
      this.showMinIdx = this.showMinIdx > 20 ? this.showMinIdx - 20 : 0;
    },
    scrollToBottom() {
      // let size = this.messageSize;
      // if (size > 0) {
      // 	console.log("size", size)
      // 	this.scrollToMsgIdx(size - 1);
      // }
      this.$nextTick(() => {
        const chatContent = this.$el.querySelector(".chat-content");
        if (chatContent) {
          console.log("触发scrollToBottom")
          chatContent.scrollTop = chatContent.scrollHeight;
        }
      });
    },
    scrollToMsgIdx(idx) {
      // 如果scrollMsgIdx值没变化，滚动条不会移动
      if (idx == this.scrollMsgIdx && idx > 0) {
        this.$nextTick(() => {
          // 先滚动到上一条
          this.scrollMsgIdx = idx - 1;
          // 再滚动目标位置
          this.scrollToMsgIdx(idx);
        });
        return;
      }
      this.$nextTick(() => {
        this.scrollMsgIdx = idx;
      });

    },
    async getMessageList() {
      try {
        // 调用封装的请求
        const res = await request({
          url: "/api/chat/message-list", // 替换为实际接口地址
          method: "GET",
          data: {
            pageNo: this.pageNo,
            pageSize: this.pageSize,
            roomId: this.roomId
          },
          header: {
            "ajax": true
          },
        });
        console.log("消息列表:", res)
        // 处理响应
        if (res.code === '0') {
          const loginUser = uni.getStorageSync('loginUser');
          const currentLoginUserId = loginUser.userId;

          // 处理数据
          const processedMessages = res.data.list.map((message) => {
            const senderUserId = message.senderUserId;
            const type = senderUserId === currentLoginUserId ? "right" : "left";
            const content = message.body.content;
            const avatar = message.avatar;
            // 例如，你可以在这里处理每条消息的数据
            return {
              ...message, // 保留原有的数据
              type: type, // 消息类型（"left" 或 "right"）
              content: content, // 消息内容
              avatar: avatar, // 头像
            };
          });

          // 赋值处理后的数据
          this.messages = processedMessages;

        } else {
          uni.showToast({
            title: res.message || "获取消息列表失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取消息列表失败:", error);
        uni.showToast({
          title: "获取消息列表失败，请重试",
          icon: "none",
        });
      }
    },
    //发送消息
    async sendMessage() {
      console.log("Enter key pressed, content: ", this.content); // 检查 content 是否有值
      console.log("键盘enter事件")
      if (this.content.trim() === "") {
        uni.showToast({
          title: "请输入内容",
          icon: "none",
        });
        return;
      }


      const body = {
        messageType: 1, // 文本消息
        roomId: 40, // 替换为实际 roomId
        body: {
          content: this.content, // 消息内容
        },
      };


      try {
        // 调用封装的请求
        const res = await request({
          url: "/api/chat/sendMessage", // 替换为实际接口地址
          method: "POST",
          data: body,
          header: {
            "ajax": true
          },
        });

        // 处理响应
        if (res.code === '0') {
          const loginUser = uni.getStorageSync('loginUser');
          console.log("loginUser" + loginUser)
          const currentLoginUserId = loginUser.userId;
          const senderUserId = res.data.senderUserId;
          const type = senderUserId === currentLoginUserId ? "right" : "left";
          const content = res.data.body.content;
          const avatar = res.data.avatar;
          this.messages.push({
            type: type,
            content: content,
            avatar: avatar,
          });

          // // 消息发送成功后，自动滚动到底部
          this.scrollToBottom();

          // // // // // 模拟接收对方消息（仅作演示）
          // // setTimeout(() => {
          // setTimeout(() => {
          //   this.messages.push({
          //     type: "left",
          //     content: "这是对方的回复内容",
          //     avatar: "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg",
          //   });
          //
          //   this.scrollToBottom();
          // }, 1000);
        } else {
          uni.showToast({
            title: res.message || "发送消息失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("发送消息失败:", error);
        uni.showToast({
          title: "发送消息失败，请重试",
          icon: "none",
        });
      } finally {
        // 清空输入框
        this.content = "";
        //滚动到最底部
        // this.scrollToBottom();

      }
    },
  },


};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}

/* 顶部导航 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.chat-title {
  font-size: 18px;
  font-weight: bold;
}

.back-btn img,
.menu-btn img {
  width: 20px;
  height: 20px;
}

/* 聊天内容 */
.chat-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #f7f7f7;
}

.date-separator {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 10px 0;
}

.message-item {
  display: flex;
  margin: 10px 0;
}

.message-item.left {
  flex-direction: row;
}

.message-item.right {
  flex-direction: row;
  /* 保持正常排列方向 */
  justify-content: flex-end;
  /* 保证消息内容靠右 */
}

.avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.message-bubble {
  max-width: 70%;
  padding: 10px;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
}

.message-item.left .message-bubble {
  background-color: #f0f0f0;
  margin-left: 10px;
}

.message-item.right .message-bubble {
  background-color: #bde4ff;
  margin-left: 10px;
  /* 调整文本与头像的间距 */
  margin-right: 10px;
  /* 移除原来的右间距 */
}

/* 底部输入框 */
.chat-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  padding: 10px;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

/* .input-box {
  flex: 1;
  padding: 0px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  margin: 0 10px;
  height: 28px;
} */
.input-box {
  z-index: 2;
  /* 确保输入框在顶层 */
  position: relative;
  flex: 1;
  padding: 0px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  margin: 0 10px;
  height: 28px;
  background-color: #fff;
  /* 明确设置背景，防止透明 */
}

.input-actions img {
  width: 24px;
  height: 24px;
  cursor: pointer;
}
</style>