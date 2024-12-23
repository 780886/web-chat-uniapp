<template>
  <div class="chat-page">
    <!-- 滚动区域 -->
    <div class="chat-content" ref="messageContainer">
      <!-- 循环展示消息 -->
      <div v-for="(message, index) in chatStore.messages" :key="index"
           :class="['message-item', message.type === 'right' ? 'right' : 'left']">
        <div class="avatar" v-if="message.type === 'left'">
          <img :src="message.avatar" alt="头像"/>
        </div>
        <div class="message-bubble">{{ message.content }}</div>
        <div class="avatar" v-if="message.type === 'right'">
          <img :src="getAvatar(message.avatar)" alt="头像"/>
        </div>
      </div>
    </div>
    <!-- 底部输入框 -->
    <div class="chat-input-bar">
      <div class="input-actions">
        <span class="iconfont">&#xe888;</span>
        <!--        <svg class="icon" aria-hidden="true">-->
        <!--          <use xlink:href="#icon-yuyin"></use>-->
        <!--        </svg>-->
      </div>
      <!--      @keydown.enter-->
      <input type="text" v-model="content" class="input-box" placeholder="发送消息..." confirm-type="send" @confirm="sendMessage"/>
      <div class="input-actions">
        <!--        <svg class="icon" aria-hidden="true">-->
        <!--          <use xlink:href="#icon-biaoqing"></use>-->
        <!--        </svg>-->
        <!--        <svg class="icon" aria-hidden="true">-->
        <!--          <use xlink:href="#icon-jia1"></use>-->
        <!--        </svg>-->
        <span class="iconfont">&#xe600;</span>
        <span class="iconfont">&#xe7a6;</span>
      </div>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request";
import {onMounted, ref, onUnmounted, nextTick, watch} from 'vue';
import userChatStore from "../../store/chatStore";
import {setNavigationBarTitle} from '../../utils/navigationBar';
import * as wsApi from "../../common/websocket";
import UNI_APP from "../../.env";
import ClientInformation from "../../common/ClientInformation";
import {ResponseCodeEnum} from "../../common/ResponseCodeEnum";
import {getLoginToken} from "../../utils/auth";
import {getAvatar} from "../../common/Avatar";

export default {
  props: {
    name: {
      type: String,
      required: true,
      default: '会话',
    },
    roomId: {
      type: [Number, String],
      required: true,
      // 默认值或转换函数
      default: 0,
    },
    avatar: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const chatStore = userChatStore();
    const name = props.name;
    const content = ref('');
    const messages = ref([]);
    const roomId = Number(props.roomId);
    console.log("会话roomId:", roomId);
    const avatar = props.avatar;
    // 立即设置roomId
    chatStore.setRoomId(roomId);
    chatStore.setAvatar(avatar);
    // 监听store中的messages状态变化
    watch(
        () => chatStore.messages,
        (newMessages) => {
          messages.value = newMessages;
          nextTick(() => {
            console.log("当前聊天框有新消息：", newMessages);
            scrollToBottom();
          });
        },
        {immediate: true}
    );

    const messageContainer = ref(null);

    function scrollToBottom() {
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    }

    // 在组件挂载时获取初始消息列表并初始化WebSocket连接
    onMounted(async () => {
      const loginToken = getLoginToken()
      wsApi.connect(UNI_APP.WS_URL, loginToken);
      await chatStore.getMessageList(); // 获取初始消息列表
      await setNavigationBarTitle(name);
    });

    // 在组件卸载时关闭WebSocket连接（可选）
    onUnmounted(() => {
      // if (chatStore.ws) {
      //   chatStore.ws.close();
      // }
    });
    // 返回给模板使用的响应式数据
    return {
      roomId, // 直接返回 roomId
      name,
      chatStore,
      content,
      scrollToBottom,
      messageContainer, // 返回 messageContainer 给模板
    };
  },
  methods: {
    getAvatar,
    //发送消息
    async sendMessage() {
      console.log("Enter key pressed, content: ", this.content); // 检查 content 是否有值
      if (this.content.trim() === "") {
        uni.showToast({
          title: "请输入内容",
          icon: "none",
        });
        return;
      }

      const body = {
        messageType: 1, // 文本消息
        roomId: this.roomId, // 替换为实际 roomId
        body: {
          content: this.content, // 消息内容
        },
      };

      try {
        // 调用封装的请求
        const res = await request({
          url: "/chat/sendMessage", // 替换为实际接口地址
          method: "POST",
          data: body,
          header: {
            // 额外的头信息
            "ajax": true,
          },
        });
        // 处理响应
        if (res.code === ResponseCodeEnum.SUCCESS) {
          this.content = '';
          const chatStore = userChatStore();
          chatStore.addOwnMessage(res.data);
          //滚动到底部
          this.$nextTick(() => {
            this.scrollToBottom();
          });
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
      }
    },
    // scrollToBottom() {
    //   if (messageContainer.value) {
    //     // 滚动到最底部
    //     messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    //   }
    // }
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
  padding-bottom: 54px;
  //padding-bottom: env(safe-area-inset-bottom, 54px); /* 避免输入框被遮挡 */
}

.iconfont {
  font-size: 36px; /* 设置字体大小为24px */
}

.icon {
  //width: 36px;
  //height: 36px;
  //margin-top: 1px;
  //vertical-align: -0.15em;
  //fill: currentColor;
  //overflow: hidden;
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
  max-height: 100%;
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
  border-radius: 10%;
}

.message-bubble {
  max-width: 70%;
  padding: 10px;
  border-radius: 10px;
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word; /* 允许长单词换行 */
  overflow: hidden; /* 隐藏超出部分 */
  text-overflow: ellipsis; /* 超出部分显示省略号 */
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
  margin-bottom: 2px;
  /*padding-bottom: 10px;*/
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
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 2px;
  font-size: 20px;
  margin: 5px 10px;
  height: 40px;
  background-color: #fff;
  /* 明确设置背景，防止透明 */
}

.input-actions img {
  width: 24px;
  height: 24px;
  cursor: pointer;
}
</style>