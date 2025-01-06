<template>
  <div class="chat-page">
    <!-- 聊天内容区域 -->
    <scroll-view class="chat-content" ref="messageContainer" @click="closeAllMenus" scroll-y :scroll-into-view="scrollIntoView">
      <!-- 消息列表 -->
      <view v-for="(message, index) in chatStore.messages" :key="index" :id="'message-' + index"
            :class="['message-item', message.type === 'right' ? 'right' : 'left']">
        <view class="avatar" v-if="message.type === 'left'">
          <image :src="message.avatar" mode="aspectFill" lazy-load/>
        </view>
        <view class="message-bubble">
          <view class="message-content">{{ message.content }}</view>
        </view>
        <view class="avatar" v-if="message.type === 'right'">
          <image :src="getAvatar(message.avatar)" mode="aspectFill" lazy-load/>
        </view>
      </view>
    </scroll-view>
    <!-- 底部输入区域 -->
    <view class="input-container">
      <view class="chat-input-bar" :style="{ transform: `translateY(-${areaHeight}px)` }">
        <view class="input-actions">
          <text class="iconfont voice-icon" @tap="toggleVoiceInput">&#xe888;</text>
        </view>

        <!-- 文本输入框/语音按钮 -->
        <view v-if="!isVoiceMode" class="text-input">
          <input type="text"
                 v-model="content"
                 class="input-box"
                 placeholder="发送消息..."
                 confirm-type="send"
                 :adjust-position="false"
                 @confirm="sendTextMessage"
                 @focus="onInputFocus"
                 @blur="onInputBlur"/>
        </view>
        <view v-else class="voice-input">
          <button class="voice-btn"
                  @touchstart="startRecording"
                  @touchend="stopRecording"
                  @touchcancel="cancelRecording">
            按住说话
          </button>
        </view>

        <view class="input-actions">
          <text class="iconfont emoji-icon" @tap="toggleEmoji">&#xe600;</text>
          <text class="iconfont more-icon" @tap="toggleMenu">&#xe7a6;</text>
        </view>
      </view>

      <!-- 扩展菜单区域 -->
      <view class="dynamic-area" :style="{ height: areaHeight + 'px', transform: `translateY(-${areaHeight}px)` }">
        <view v-show="menuVisible" class="function-menu">
          <view class="menu-grid">
            <view class="menu-item" @tap="openAlbum">
              <view class="menu-icon">
                <text class="iconfont">&#xe87a;</text>
              </view>
              <text class="menu-text">相册</text>
            </view>
            <view class="menu-item" @tap="takePhoto">
              <view class="menu-icon">
                <text class="iconfont">&#xe61d;</text>
              </view>
              <text class="menu-text">拍摄</text>
            </view>
            <view class="menu-item" @tap="openFile">
              <view class="menu-icon">
                <text class="iconfont">&#xe665;</text>
              </view>
              <text class="menu-text">文件</text>
            </view>
            <view class="menu-item" @tap="startVoiceInput">
              <view class="menu-icon">
                <text class="iconfont">&#xe60f;</text>
              </view>
              <text class="menu-text">语音输入</text>
            </view>
            <view class="menu-item" @tap="startVideoCall">
              <view class="menu-icon">
                <text class="iconfont">&#xe602;</text>
              </view>
              <text class="menu-text">视频通话</text>
            </view>
            <view class="menu-item" @tap="startVoiceCall">
              <view class="menu-icon">
                <text class="iconfont">&#xe64f;</text>
              </view>
              <text class="menu-text">语音通话</text>
            </view>
          </view>
        </view>
        <!-- 表情包区域 -->
        <scroll-view v-show="emojiVisible" class="emoji-menu" scroll-y>
          <view class="emoji-grid">
            <view v-for="(emoji, index) in emojiList" :key="index" class="emoji-item" @tap="selectEmoji(emoji.url)">
              <image :src="emoji.url" mode="aspectFill" class="emoji-image"/>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
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
import {emojiList} from "../../utils/emoji";

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
    const content = ref('');
    const roomId = Number(props.roomId);
    const menuVisible = ref(false);
    const emojiVisible = ref(false);
    const isVoiceMode = ref(false);
    const isLoading = ref(false);
    const scrollTop = ref(0);
    const areaHeight = ref(0);
    const recorderManager = ref(null);
    const recordStartTime = ref(0);
    const recordEndTime = ref(0);
    const scrollIntoView = ref('');
    console.log("roomId", roomId)
    chatStore.setRoomId(roomId);
    chatStore.setAvatar(props.avatar);

    // 加载更多消息
    const loadMoreMessages = async () => {
      if (isLoading.value) return;
      isLoading.value = true;
      const pageNo = chatStore.getPageNo();
      console.log("pageNo", pageNo)
      await chatStore.setPageNo(pageNo + 1);
      await chatStore.getMessageList();
      isLoading.value = false;
    }

    // 切换语音输入模式
    const toggleVoiceInput = () => {
      isVoiceMode.value = !isVoiceMode.value;
    }

    // 录音相关方法
    const startRecording = () => {
      // 初始化录音管理器
      if (!recorderManager.value) {
        // #ifdef APP-PLUS || MP-WEIXIN
        recorderManager.value = uni.getRecorderManager();

        // 监听录音开始事件
        recorderManager.value.onStart(() => {
          recordStartTime.value = Date.now();
          uni.showToast({
            title: '开始录音',
            icon: 'none'
          });
        });

        // 监听录音结束事件
        recorderManager.value.onStop((res) => {
          recordEndTime.value = Date.now();
          const duration = Math.floor((recordEndTime.value - recordStartTime.value) / 1000);

          // 如果录音时间太短
          if (duration < 1) {
            uni.showToast({
              title: '说话时间太短',
              icon: 'none'
            });
            return;
          }

          // 上传录音文件
          uploadVoiceFile(res.tempFilePath, duration);
        });

        // 监听录音错误事件
        recorderManager.value.onError((error) => {
          console.error('录音失败:', error);
          uni.showToast({
            title: '录音失败',
            icon: 'none'
          });
        });
        // #endif
      }

      // 开始录音
      // #ifdef APP-PLUS || MP-WEIXIN
      recorderManager.value.start({
        duration: 60000, // 最长录音时间，单位ms
        sampleRate: 16000, // 采样率
        numberOfChannels: 1, // 录音通道数
        encodeBitRate: 96000, // 编码码率
        format: 'mp3', // 音频格式
        frameSize: 50 // 指定帧大小
      });
      // #endif

      // #ifdef H5
      uni.showToast({
        title: 'H5暂不支持录音',
        icon: 'none'
      });
      // #endif
    }

    // 停止录音并发送
    const stopRecording = () => {
      // #ifdef APP-PLUS || MP-WEIXIN
      if (recorderManager.value) {
        recorderManager.value.stop();
      }
      // #endif
    }

    // 取消录音
    const cancelRecording = () => {
      // #ifdef APP-PLUS || MP-WEIXIN
      if (recorderManager.value) {
        recordStartTime.value = 0;
        recordEndTime.value = 0;
        recorderManager.value.stop();
        uni.showToast({
          title: '已取消',
          icon: 'none'
        });
      }
      // #endif
    }

    // 上传语音文件
    const uploadVoiceFile = async (tempFilePath, duration) => {
      try {
        // 上传文件
        const uploadRes = await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: UNI_APP.BASE_URL + '/upload/file',
            filePath: tempFilePath,
            name: 'file',
            header: {
              'token': getLoginToken()
            },
            success: (uploadRes) => {
              const data = JSON.parse(uploadRes.data);
              if (data.code === ResponseCodeEnum.SUCCESS) {
                resolve(data.data);
              } else {
                reject(new Error(data.message));
              }
            },
            fail: (error) => {
              reject(error);
            }
          });
        });

        // 发送语音消息
        const body = {
          messageType: 3, // 语音消息类型
          roomId: roomId,
          body: {
            content: uploadRes.url,
            duration: duration
          }
        };

        const res = await request({
          url: "/chat/sendMessage",
          method: "POST",
          data: body,
          header: {
            "ajax": true,
          }
        });

        if (res.code === ResponseCodeEnum.SUCCESS) {
          chatStore.addOwnMessage(res.data);
        } else {
          throw new Error(res.message || "发送失败");
        }
      } catch (error) {
        console.error("发送语音失败:", error);
        uni.showToast({
          title: error.message || "发送失败,请重试",
          icon: 'none'
        });
      }
    }

    // 预览图片
    const previewImage = (url) => {
      uni.previewImage({
        urls: [url]
      });
    }

    // 播放语音
    const playVoice = (url) => {
      // 实现语音播放逻辑
    }

    const closeAllMenus = () => {
      // 关闭表情和功能菜单
      if (menuVisible.value) {
        menuVisible.value = !menuVisible.value;
      }
      if (emojiVisible.value) {
        emojiVisible.value = !emojiVisible.value;
      }
      areaHeight.value = 0;
      // 关闭键盘
      uni.hideKeyboard();
    }

    // 切换功能菜单
    const toggleMenu = () => {
      if (emojiVisible.value) {
        emojiVisible.value = !emojiVisible.value;
      }
      menuVisible.value = !menuVisible.value;
      if (menuVisible.value) {
        uni.hideKeyboard();
        areaHeight.value = 280;
      } else {
        areaHeight.value = 0;
      }
    }

    // 切换表情包
    const toggleEmoji = () => {
      if (menuVisible.value) {
        menuVisible.value = !menuVisible.value;
      }
      emojiVisible.value = !emojiVisible.value;
      if (emojiVisible.value) {
        uni.hideKeyboard();
        areaHeight.value = 280;
      } else {
        areaHeight.value = 0;
      }
    }

    // 选择表情
    const selectEmoji = (code) => {
      content.value += code;
    }

    // 输入框获取焦点
    const onInputFocus = (event) => {
      menuVisible.value = false;
      emojiVisible.value = false;
      const keyboardHeight = event.detail.height;
      if (keyboardHeight) {
        areaHeight.value = keyboardHeight;
      }
    }

    // 输入框失去焦点
    const onInputBlur = () => {
      if (!menuVisible.value && !emojiVisible.value) {
        areaHeight.value = 0;
      }
    }

    // 监听消息变化,自动滚动
    watch(
        () => chatStore.messages,
        () => {
          nextTick(() => {
            scrollToBottom();
          });
        },
        {deep: true}
    );

    const scrollToBottom = () => {
      nextTick(() => {
        const lastMessageIndex = chatStore.messages.length - 1;
        scrollIntoView.value = 'message-' + lastMessageIndex;
      });
    };

    onMounted(async () => {
      await chatStore.setPageNo(1);
      const loginToken = getLoginToken()
      wsApi.connect(UNI_APP.WS_URL, loginToken);
      await chatStore.getMessageList();
      await setNavigationBarTitle(props.name);
      scrollToBottom();

      uni.onKeyboardHeightChange(res => {
        if (res.height > 0) {
          menuVisible.value = false;
          emojiVisible.value = false;
          areaHeight.value = res.height;
        } else {
          if (!menuVisible.value && !emojiVisible.value) {
            areaHeight.value = 0;
          }
        }
      });
    });

    onUnmounted(() => {
      uni.offKeyboardHeightChange();
    });

    return {
      roomId,
      chatStore,
      content,
      messageContainer,
      menuVisible,
      emojiVisible,
      isVoiceMode,
      isLoading,
      scrollTop,
      areaHeight,
      toggleMenu,
      toggleEmoji,
      onInputFocus,
      onInputBlur,
      startRecording,
      stopRecording,
      cancelRecording,
      previewImage,
      playVoice,
      loadMoreMessages,
      scrollToBottom,
      emojiList,
      selectEmoji,
      toggleVoiceInput,
      recorderManager,
      recordStartTime,
      recordEndTime,
      closeAllMenus,
      scrollIntoView
    };
  },
  methods: {
    // 发送文本消息
    async sendTextMessage() {
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
          this.chatStore.addOwnMessage(res.data);
          await nextTick();
          this.scrollToBottom();
        } else {
          uni.showToast({
            title: res.message || "发送失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("发送失败:", error);
        uni.showToast({
          title: "发送失败,请重试",
          icon: "none",
        });
      }
    },

    // 打开相册
    openAlbum() {
      uni.chooseImage({
        count: 9,
        sizeType: ['original', 'compressed'],
        sourceType: ['album'],
        success: (res) => {
          // 实现发送图片逻辑
          console.log(res.tempFilePaths);
        }
      });
    },

    // 拍照
    takePhoto() {
      uni.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['camera'],
        success: (res) => {
          // 实现发送图片逻辑
          console.log(res.tempFilePaths);
        }
      });
    },

    // 打开文件
    openFile() {

    },

    // 开始语音输入
    startVoiceInput() {
      // 实现语音输入逻辑
    },

    // 发起视频通话
    startVideoCall() {
      uni.showToast({
        title: '视频通话功能开发中',
        icon: 'none'
      });
    },

    // 发起语音通话
    startVoiceCall() {
      uni.showToast({
        title: '语音通话功能开发中',
        icon: 'none'
      });
    },

    getAvatar,

    // 格式化文件大小
    formatFileSize(size) {
      if (size < 1024) {
        return size + 'B';
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + 'KB';
      } else {
        return (size / (1024 * 1024)).toFixed(2) + 'MB';
      }
    },

    // 打开文件
    openFileUrl(fileInfo) {
      // 根据平台处理文件打开方式
      // #ifdef H5
      window.open(fileInfo.content);
      // #endif

      // #ifdef APP-PLUS || MP-WEIXIN
      uni.downloadFile({
        url: fileInfo.content,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.openDocument({
              filePath: res.tempFilePath,
              success: function () {
                console.log('打开文件成功');
              },
              fail: function () {
                uni.showToast({
                  title: '无法打开此类型文件',
                  icon: 'none'
                });
              }
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '文件下载失败',
            icon: 'none'
          });
        }
      });
      // #endif
    }
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
  background-color: #ededed;
  overflow-y: hidden; /* 禁止垂直滚动 */
}

.iconfont {
  font-size: 28px;
}

.chat-content {
  flex: 1; /* 让聊天内容区域占据剩余空间 */
  padding: 10px;
  overflow-y: auto; /* 只在聊天内容区域启用滚动 */
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(68px + env(safe-area-inset-bottom)); /* 增加底部间距 */
  height: calc(100vh - env(safe-area-inset-top));
}

.loading {
  text-align: center;
  padding: 10px;
  color: #999;
}

.message-item {
  display: flex;
  margin: 8px 0;
  word-break: break-word;
  align-items: center;
  min-width: 50px;
}

.message-item.left {
  flex-direction: row;
}

.message-item.right {
  flex-direction: row;
  justify-content: flex-end;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  /* margin: 0 10px; 调整头像与消息气泡之间的间距 */
}


.avatar image {
  width: 44px;
  height: 44px;
  border-radius: 10%;
}

.message-bubble {
  max-width: 70%;
  padding: 0;
  border-radius: 10px;
  word-wrap: break-word;
  position: relative;
  display: flex;
  align-items: center; /* 确保消息内容垂直居中 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-content {
  padding: 10px 12px;
  font-size: 18px;
  line-height: 1.4;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-item.left .message-bubble {
  background-color: #ffffff;
  margin-left: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-item.right .message-bubble {
  background-color: #bde4ff;
  margin-right: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.input-container {
  position: relative;
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
  /* transition: transform 0.3s ease; */
}

.text-input {
  flex: 1;
}

.input-box {
  width: 100%;
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  background-color: #fff;
}

.voice-input {
  flex: 1;
  padding: 0 10px;
}

.voice-btn {
  width: 100%;
  height: 36px;
  line-height: 36px;
  text-align: center;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dynamic-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: -280px;
  width: 100%;
  /* transition: all 0.3s ease; */
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

.emoji-menu {
  height: 100%;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
  padding: 15px 0;
  padding-bottom: calc(15px + env(safe-area-inset-bottom));
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  padding: 0 10px;
}

.emoji-item {
  display: flex;
  justify-content: center;
  align-items: center;
}

.emoji-image {
  width: 40px;
  height: 40px;
}

.file-message {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8f8f8;
  border-radius: 4px;
  cursor: pointer;
}

.file-info {
  flex: 1;
  margin-right: 10px;
}

.file-name {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  word-break: break-all;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.file-message .iconfont {
  font-size: 24px;
  color: #666;
}

/* 表情样式优化 */
:deep(.chat-emoji) {
  display: inline-block;
  width: 32px;
  height: 32px;
  vertical-align: middle;
  margin: 0 1px;
}
</style>