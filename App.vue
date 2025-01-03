<script>

import * as wsApi from './common/websocket';
import UNI_APP from './.env.js'
import {WebsocketResponseType} from './common/WebsocketResponseTypeEnum'
import {MessageType} from "./common/MessageTypeEnum";
import {clearAll, getLoginToken} from "./utils/auth";


export default {
  data() {
    return {
      isExit: false, // 是否已退出
      reconnecting: false // 正在重连标志
    }
  },
  methods: {
    init() {
      this.isExit = false;
      try {
        this.initWebsocket();
      }catch (e) {
        console.log(e)
        this.exit();
      }
      // //加载数据
      // this.loadStore().then(() => {
      //   //获取
      //   //初始化websocket
      //
      // }).catch((e) => {
      //   console.log(e)
      //   this.exit();
      // });
    },
    //初始化websocket
    initWebsocket() {
      //获取登录信息
      const loginToken = getLoginToken();
      wsApi.init();
      wsApi.connect(UNI_APP.WS_URL, loginToken);
      wsApi.onConnect(() => {
        //重连成功提示
        if (this.reconnecting) {
          this.reconnecting = false;
          console.log("已重新连接")
          // uni.showToast({
          //   title: "已重新连接",
          //   icon: 'none'
          // })
        }
      });
      //监听消息
      wsApi.onMessage((type, data) => {
        //新消息
        if (WebsocketResponseType.MESSAGE === type) {
          //新消息处理
          this.handlerNewMessage(data);
        }
      });
      wsApi.onClose((res) => {
        console.log("ws断开", res);
        // 重新连接
        this.reconnectWebsocket();
      })
    },
    reconnectWebsocket() {
      // 已退出则不再重连
      if (this.isExit) {
        return;
      }
      // 记录标志
      this.reconnecting = true;
      //todo 重新加载个人信息
      // 重新连接
      try {
        const loginToken = uni.getStorageSync("login-token")
        wsApi.reconnect(UNI_APP.WS_URL, loginToken);
      } catch (e) {
        // 5s后重试
        setTimeout(() => {
          this.reconnectWebsocket();
        }, 5000)
      }

    },
    loadStore() {
      // return this.userStore.loadUser().then(() => {
      //   const promises = [];
      //   // promises.push(this.friendStore.loadFriend());
      //   // promises.push(this.groupStore.loadGroup());
      //   promises.push(this.chatStore.loadChat());
      //   // promises.push(this.configStore.loadConfig());
      //   return Promise.all(promises);
      // })
      return this.chatStore.loadChat();
    },
    unloadStore() {
      // this.friendStore.clear();
      // this.groupStore.clear();
      this.chatStore.clear();
      // this.configStore.clear();
      this.userStore.clear();
    },
    exit() {
      console.log("exit");
      this.isExit = true;
      wsApi.close(3099);
      clearAll();
      uni.reLaunch({
        url: "/pages/login/login"
      })
      this.unloadStore();
    },
    handlerNewMessage(message) {
      console.log("this.chatStore",this.chatStore);
      if (MessageType.TEXT === message.type) {
        // this.chatStore.setLoadingRoomMessage();
        this.chatStore.addMessage(message);
        return;
      }
      if (MessageType.EMOJI === message.type) {
        // this.chatStore.setLoadingRoomMessage();
        this.chatStore.addMessage(message);
        return;
      }
      console.log("其他类型消息赞不处理", message.type)
    }
  },
  onLaunch() {
    try {
      //初始化时再挂载store对象
      this.$mountStore();
      /**
       * 没有token 则跳转到登录页 避免浪费资源去建立 WebSocket 连接
       * token 过期则重新登录  避免浪费资源去建立 WebSocket 连接
       *
       * 用户成功登录后，获取 token，然后初始化 WebSocket 连接。
       * 在初始化 WebSocket 连接时，可以将 token 作为认证信息发送给服务器。
       * 如果认证通过，则 WebSocket 可以正常工作，进入会话创建。
       *
       * 如果页面刷新或者重启应用时发现有有效的 token，可以直接初始化 WebSocket。
       * 需要通过服务端认证 token 的有效性，如果认证失败则断开连接，并让用户重新登录。
       */
      const loginToken = getLoginToken()
      if (!loginToken) {
        console.log("app.vue onLaunch loginToken 不存在 直接跳到登陆页面")
        // #ifdef H5
        uni.reLaunch({
          url: "/pages/login/login"
        })
        // #endif
        return;
      }
      /**
       * token认证是否过期
       */
      console.log("app.vue onLaunch loginToken 存在 且认证成功 初始化 WebSocket 连接")
      // 初始化
      this.init();
      //登录状态校验
      uni.switchTab({
        url: "/pages/conversation/conversation"
      })
    } catch (e) {
      // 跳转到登录页
      console.error("获取登录信息失败", e);
      // #ifdef H5
      uni.reLaunch({
        url: "/pages/login/login"
      })
      // #endif
    }
  },
  onUnload(){
    this.exit();
  }
}
</script>

<style>
/*每个页面公共css */
@import url('./static/icon/iconfont.css');
</style>
