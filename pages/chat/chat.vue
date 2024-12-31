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
    <div class="input-container">
      <!-- 底部输入框 -->
      <div class="chat-input-bar" :style="{ bottom: chatInputBarBottom }">
        <div class="input-actions">
          <span class="iconfont">&#xe888;</span>
        </div>
        <input type="text" v-model="content" class="input-box" placeholder="发送消息..." confirm-type="send"
              @confirm="sendMessage" @focus="onInputFocus"
              @blur="onInputBlur"/>
        <div class="input-actions">
          <span class="iconfont">&#xe600;</span>
          <span class="iconfont" @click="toggleMenu">&#xe7a6;</span>
        </div>
      </div>
      <!-- 动态区域 - 用于显示功能菜单或键盘 -->
      <div class="dynamic-area" :style="{ height: areaHeight + 'px' }">
        <!-- 功能菜单 -->
        <div v-show="menuVisible" class="function-menu">
          <div class="menu-grid">
            <div class="menu-item">
              <div class="menu-icon">
                <span class="iconfont" @click="openAlbum">&#xe87a;</span>
              </div>
              <div class="menu-text">相机</div>
            </div>
            <div class="menu-item">
              <div class="menu-icon" @click="takePhoto">
                <span class="iconfont">&#xe61d;</span>
              </div>
              <div class="menu-text">拍摄</div>
            </div>
            <div class="menu-item">
              <div class="menu-icon" @click="openFile">
                <span class="iconfont">&#xe665;</span>
              </div>
              <div class="menu-text">文件</div>
            </div>
            <div class="menu-item">
              <div class="menu-icon">
                <span class="iconfont">&#xe60f;</span>
              </div>
              <div class="menu-text">语音输入</div>
            </div>
            <div class="menu-item">
              <div class="menu-icon">
                <span class="iconfont">&#xe602;</span>
              </div>
              <div class="menu-text">视频通话</div>
            </div>
            <div class="menu-item">
              <div class="menu-icon">
                <span class="iconfont">&#xe64f;</span>
              </div>
              <div class="menu-text">语音通话</div>
            </div>
          </div>
        </div>
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
      default: 0,
    },
    avatar: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const chatStore = userChatStore();
    const messageContainer = ref(null);
    const name = props.name;
    const content = ref('');
    const messages = ref([]);
    const roomId = Number(props.roomId);
    console.log("会话roomId:", roomId);
    const avatar = props.avatar;
    const menuVisible = ref(false);
    const chatInputBarBottom = ref("0px");
    chatStore.setRoomId(roomId);
    chatStore.setAvatar(avatar);
    const areaHeight = ref(0); // 动态区域高度

    // 切换功能菜单
    function toggleMenu() {
      menuVisible.value = !menuVisible.value;
      if (menuVisible.value) {
        // 显示菜单时隐藏键盘
        uni.hideKeyboard();
        areaHeight.value = 280; // 设置菜单高度
      } else {
        areaHeight.value = 0;
      }
      
      // 获取系统信息
      const systemInfo = uni.getSystemInfoSync();
      const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
      
      // 计算底部位置
      chatInputBarBottom.value = menuVisible.value 
        ? `${areaHeight.value + safeAreaBottom}px` 
        : `${safeAreaBottom}px`;
    }

    // 输入框获取焦点
    const onInputFocus = (event) => {
      menuVisible.value = false; // 隐藏功能菜单
      const keyboardHeight = event.detail.height;
      if (keyboardHeight) {
        areaHeight.value = keyboardHeight;
        chatInputBarBottom.value = `${keyboardHeight}px`;
      }
    };

    // 输入框失去焦点
    const onInputBlur = () => {
      if (!menuVisible.value) {
        areaHeight.value = 0;
        const systemInfo = uni.getSystemInfoSync();
        const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
        chatInputBarBottom.value = `${safeAreaBottom}px`;
      }
    };

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
        { deep: true }
    );

     const scrollToBottom = () => {
        nextTick(() => {
          const container = messageContainer.value;
          if (container) {
            setTimeout(() => {
              const scrollHeight = container.scrollHeight;
              const clientHeight = container.clientHeight;
              const maxScrollTop = scrollHeight - clientHeight + 100;
              container.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
            }, 100);
          }
        });
      };

    onMounted(async () => {
      const loginToken = getLoginToken()
      wsApi.connect(UNI_APP.WS_URL, loginToken);
      await chatStore.getMessageList();
      await setNavigationBarTitle(name);
      
      const systemInfo = uni.getSystemInfoSync();
      const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
      chatInputBarBottom.value = `${safeAreaBottom}px`;

      nextTick(() => {
        scrollToBottom();
      });
      
      uni.onKeyboardHeightChange(res => {
        if (res.height > 0) {
          menuVisible.value = false;
          areaHeight.value = res.height;
          chatInputBarBottom.value = `${res.height}px`;
        } else {
          if (!menuVisible.value) {
            areaHeight.value = 0;
            chatInputBarBottom.value = `${safeAreaBottom}px`;
          }
        }
      });
    });

    onUnmounted(() => {
      uni.offKeyboardHeightChange();
    });

    return {
      roomId,
      name,
      chatStore,
      content,
      scrollToBottom,
      messageContainer,
      menuVisible,
      chatInputBarBottom,
      toggleMenu,
      onInputFocus,
      onInputBlur,
      areaHeight
    };
  },
  methods: {
    openAlbum() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album'],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          console.log(tempFilePaths);
        },
        fail: (err) => {
          console.log('Error while opening album:', err);
        }
      });
    },
    takePhoto() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['camera'],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          console.log(tempFilePaths);
        },
        fail: (err) => {
          console.log('Error while choosing image:', err);
        }
      });
    },
    openFile() {
      if (uni.getSystemInfoSync().platform === 'android' || uni.getSystemInfoSync().platform === 'ios') {
        plus.io.resolveLocalFileSystemURL(filePath, function (entry) {
          if (entry) {
            entry.open('r', function (file) {
              plus.runtime.openFile(file);
            }, function (e) {
              console.log("打开文件失败: " + e.message);
            });
          } else {
            console.log("文件不存在");
          }
        }, function (e) {
          console.log("获取文件失败: " + e.message);
        });
      } else {
        console.log("此功能仅支持移动设备");
      }
    },
    getAvatar,
    async sendMessage() {
      console.log("Enter key pressed, content: ", this.content);
      if (this.content.trim() === "") {
        uni.showToast({
          title: "请输入内容",
          icon: "none",
        });
        return;
      }

      const body = {
        messageType: 1,
        roomId: this.roomId,
        body: {
          content: this.content,
        },
      };

      try {
        const res = await request({
          url: "/chat/sendMessage",
          method: "POST",
          data: body,
          header: {
            "ajax": true,
          },
        });
        if (res.code === ResponseCodeEnum.SUCCESS) {
          this.content = '';
          const chatStore = userChatStore();
          chatStore.addOwnMessage(res.data);
          await nextTick();
          this.scrollToBottom();
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
  position: relative;
  background-color: #ededed;
}

.iconfont {
  font-size: 28px;
}

.back-btn img,
.menu-btn img {
  width: 20px;
  height: 20px;
}

.chat-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
  height: calc(100vh - env(safe-area-inset-top));
}

.message-item {
  display: flex;
  margin: 8px 0;
  word-break: break-word;
}

.message-item.left {
  flex-direction: row;
}

.message-item.right {
  flex-direction: row;
  justify-content: flex-end;
}

.avatar img {
  width: 44px;
  height: 44px;
  border-radius: 10%;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 18px;
  line-height: 1.5;
  word-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
}

.message-item.left .message-bubble {
  background-color: #ffffff;
  margin-left: 10px;
}

.message-item.right .message-bubble {
  background-color: #bde4ff;
  margin-left: 10px;
  margin-right: 10px;
}

.chat-input-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  min-height: 58px;
  background-color: #f8f8f8;
  display: flex;
  align-items: center;
  padding: 8px 10px;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
}

.input-box {
  flex: 1;
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  margin: 0 10px;
  background-color: #fff;
  -webkit-appearance: none;
}

.input-actions img {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.dynamic-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  transition: height 0.3s ease;
  z-index: 98;
}

.function-menu {
  height: 100%;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
  padding: 15px 0;
  padding-bottom: calc(15px + env(safe-area-inset-bottom));
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 0 15px;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.menu-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
}

.menu-text {
  font-size: 12px;
  color: #333;
  text-align: center;
}
</style>