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
    <div class="chat-input-bar" :style="{ bottom: chatInputBarBottom }">
      <div class="input-actions">
        <span class="iconfont">&#xe888;</span>
      </div>
      <!--      @keydown.enter-->
      <input type="text" v-model="content" class="input-box" placeholder="发送消息..." confirm-type="send"
             @confirm="sendMessage"/>
      <div class="input-actions">
        <span class="iconfont">&#xe600;</span>
        <span class="iconfont" @click="toggleMenu">&#xe7a6;</span>
      </div>
    </div>
    <!-- 弹出功能菜单 -->
    <div v-show="menuVisible" :class="['function-menu', menuVisible ? 'visible' : '']">
      <div class="menu-grid">
        <!--相机-->
        <div class="menu-item">
          <div class="menu-icon">
            <!-- 使用 v-html 渲染 Unicode -->
            <span class="iconfont" @click="openAlbum">&#xe87a;</span>
          </div>
          <div class="menu-text">相机</div>
        </div>
        <!--拍摄-->
        <div class="menu-item">
          <div class="menu-icon" @click="takePhoto">
            <!-- 使用 v-html 渲染 Unicode -->
            <span class="iconfont">&#xe61d;</span>
          </div>
          <div class="menu-text">拍摄</div>
          <!-- 预览图片 -->
          <!--          <image v-for="(item, index) in images" :key="index" :src="item" @click="previewImage(index)"></image>-->
        </div>
        <!--文件-->
        <div class="menu-item">
          <div class="menu-icon" @click="openFile">
            <!-- 使用 v-html 渲染 Unicode -->
            <span class="iconfont">&#xe665;</span>
          </div>
          <div class="menu-text">文件</div>
        </div>
        <!--语音输入-->
        <div class="menu-item">
          <div class="menu-icon">
            <!-- 使用 v-html 渲染 Unicode -->
            <span class="iconfont">&#xe60f;</span>
          </div>
          <div class="menu-text">语音输入</div>
        </div>
        <!--视频通话-->
        <div class="menu-item">
          <div class="menu-icon">
            <!-- 使用 v-html 渲染 Unicode -->
            <span class="iconfont">&#xe602;</span>
          </div>
          <div class="menu-text">视频通话</div>
        </div>
        <!--语音通话-->
        <div class="menu-item">
          <div class="menu-icon">
            <!-- 使用 v-html 渲染 Unicode -->
            <span class="iconfont">&#xe64f;</span>
          </div>
          <div class="menu-text">语音通话</div>
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
    const messageContainer = ref(null);
    const name = props.name;
    const content = ref('');
    const messages = ref([]);
    const roomId = Number(props.roomId);
    console.log("会话roomId:", roomId);
    const avatar = props.avatar;
    // 控制功能菜单显示状态
    const menuVisible = ref(false);
    const chatInputBarBottom = ref("0px");
    // 立即设置roomId
    chatStore.setRoomId(roomId);
    chatStore.setAvatar(avatar);

    // 切换功能菜单显示状态
    function toggleMenu() {
      menuVisible.value = !menuVisible.value;
      const menuHeight = 267;

      // 获取系统信息
      const systemInfo = uni.getSystemInfoSync();
      const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;

      // 计算底部位置
      chatInputBarBottom.value = menuVisible.value
          ? `${menuHeight + safeAreaBottom}px`
          : `${safeAreaBottom}px`;
    }

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
        { deep: true } // 添加 deep 以监听数组内部变化
    );


    // 定义 scrollToBottom 函数
    const scrollToBottom = () => {
      nextTick(() => {
        const container = messageContainer.value;
        if (container) {
          setTimeout(() => {
            // 计算实际需要滚动的位置
            const scrollHeight = container.scrollHeight;
            const clientHeight = container.clientHeight;
            const maxScrollTop = scrollHeight - clientHeight + 100; // 添加额外偏移量

            // 确保滚动到最底部
            container.scrollTop = maxScrollTop > 0 ? maxScrollTop : 0;
          }, 100);
        }
      });
    };

    // 在组件挂载时获取初始消息列表并初始化WebSocket连接
    onMounted(async () => {
      const loginToken = getLoginToken()
      wsApi.connect(UNI_APP.WS_URL, loginToken);
      await chatStore.getMessageList(); // 获取初始消息列表
      await setNavigationBarTitle(name);
      // const chatInputBar = document.querySelector(".chat-input-bar");
      // if (chatInputBar) {
      //   chatInputBar.style.bottom = "0px"; // 初始时输入框在底部
      // }、
      // 获取系统信息
      const systemInfo = uni.getSystemInfoSync();
      const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;

      // 初始化底部安全区域
      chatInputBarBottom.value = `${safeAreaBottom}px`;

      // 确保初始消息加载后滚动到底部
      nextTick(() => {
        scrollToBottom();
      });

      // 监听软键盘
      uni.onKeyboardHeightChange(res => {
        if (res.height > 0) {
          // 键盘弹出时，隐藏功能菜单
          menuVisible.value = false;
          chatInputBarBottom.value = `${res.height}px`;
        } else {
          // 键盘收起时，恢复原始位置
          chatInputBarBottom.value = `${safeAreaBottom}px`;
        }
      });
    });

    // 在组件卸载时关闭WebSocket连接（可选）
    onUnmounted(() => {
      // if (chatStore.ws) {
      //   chatStore.ws.close();
      // }
      uni.offKeyboardHeightChange();
    });
    // 返回给模板使用的响应式数据
    return {
      roomId, // 直接返回 roomId
      name,
      chatStore,
      content,
      scrollToBottom,
      messageContainer, // 返回 messageContainer 给模板
      menuVisible,
      chatInputBarBottom,
      toggleMenu,

    };
  },
  methods: {
    openAlbum() {
      uni.chooseImage({
        count: 1, // 默认9，设置图片的选择数量
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album'], // 从相册选择
        success: (res) => {
          const tempFilePaths = res.tempFilePaths;
          console.log(tempFilePaths);
          // 处理选中的图片，例如预览、上传等
        },
        fail: (err) => {
          console.log('Error while opening album:', err);
        }
      });
    },
    takePhoto() {
      // 调用uni.chooseImage API
      uni.chooseImage({
        count: 1, // 默认1, 设置图片的数量
        sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
        sourceType: ['camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: (res) => { // 成功的回调
          const tempFilePaths = res.tempFilePaths;
          console.log(tempFilePaths);
          // 处理图片，例如预览、上传等
        },
        fail: (err) => { // 失败的回调
          console.log('Error while choosing image:', err);
        }
      });
    },
    openFile() {
      // 判断当前环境是否为移动设备
      if (uni.getSystemInfoSync().platform === 'android' || uni.getSystemInfoSync().platform === 'ios') {
        // 使用plus.io获取文件
        plus.io.resolveLocalFileSystemURL(filePath, function (entry) {
          // 判断文件是否存在
          if (entry) {
            // 打开文件
            entry.open('r', function (file) {
              // 根据文件类型调用相应的应用打开文件
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
          // 确保消息发送成功后滚动到底部
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
  position: relative;
  background-color: #ededed;
}

/* 图标大小调整 */
.iconfont {
  font-size: 28px; /* 调整图标大小 */
}

.back-btn img,
.menu-btn img {
  width: 20px;
  height: 20px;
}

/* 聊天内容区域样式调整 */
.chat-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* 增加底部padding以确保内容不被输入框遮挡 */
  padding-bottom: calc(100px + env(safe-area-inset-bottom)); /* 调整为100px */
  height: calc(100vh - env(safe-area-inset-top));
}

/* 消息项样式微调 */
.message-item {
  display: flex;
  margin: 8px 0; /* 从10px改为8px，使消息间距更紧凑 */
  word-break: break-word;
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
  width: 44px;
  height: 44px;
  border-radius: 10%;
}

.message-bubble {
  max-width: 70%;
  padding: 8px 10px; /* 减小内边距 */
  border-radius: 10px;
  font-size: 18px;
  line-height: 1.5;
  word-wrap: break-word; /* 允许长单词换行 */
  overflow: hidden; /* 隐藏超出部分 */
  text-overflow: ellipsis; /* 超出部分显示省略号 */
  display: flex;
  align-items: center; /* 垂直居中 */
}

.message-item.left .message-bubble {
  /*background-color: #f0f0f0;*/
  background-color: #ffffff;
  margin-left: 10px;
}

.message-item.right .message-bubble {
  background-color: #bde4ff;
  margin-left: 10px;
  /* 调整文本与头像的间距 */
  margin-right: 10px;
  /* 移除原来的右间距 */
}

/* 输入框样式调整 */
.chat-input-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  min-height: 58px; /* 稍微减小输入框高度 */
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
  height: 36px; /* 固定高度 */
  line-height: 36px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px; /* 移动端更合适的字体大小 */
  margin: 0 10px;
  background-color: #fff;
  -webkit-appearance: none; /* 移除 iOS 默认样式 */
}

.input-actions img {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.function-menu {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
  z-index: 99;
  padding: 15px 0;
  height: 267px;
  padding-bottom: calc(15px + env(safe-area-inset-bottom));
  display: none;
}
/* 显示时的样式 */
.function-menu.visible {
  display: block; /* 显示时直接显示 */
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

/* 菜单图标样式优化 */
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

/* 菜单文字样式 */
.menu-text {
  font-size: 12px;
  color: #333;
  text-align: center;
}

</style>