import App from './App'
import * as pinia from 'pinia';
import useChatStore from './store/chatStore.js'
import useUserStore from './store/userStore.js'
// import './static/icon/iconfont.js';



// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
// Vue.config.productionTip = false
// App.mpType = 'app'
// const app = new Vue({
//   ...App
// })
// app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
// export function createApp() {
//   const app = createSSRApp(App)
//   return {
//     app
//   }
// }
// #endif

export function createApp() {
  const app = createSSRApp(App)
  // app.use(uviewPlus);
  app.use(pinia.createPinia());
  // app.config.globalProperties.$http = request;
  // app.config.globalProperties.$wsApi = socketApi;
  // app.config.globalProperties.$msgType = messageType;
  // app.config.globalProperties.$emo = emotion;
  // app.config.globalProperties.$enums = enums;
  // app.config.globalProperties.$date = date;
  // app.config.globalProperties.$rc = recorder;
  // 初始化时再挂载store对象
  app.config.globalProperties.$mountStore = ()=>{
    app.config.globalProperties.chatStore = useChatStore();
    // app.config.globalProperties.friendStore = useFriendStore();
    // app.config.globalProperties.groupStore = useGroupStore();
    // app.config.globalProperties.configStore = useConfigStore();
    app.config.globalProperties.userStore = useUserStore();
  }
  return {
    app,
    pinia
  }
}
