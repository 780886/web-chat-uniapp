<template>
  <div class="container">
    <!-- 页面标题 -->
    <div class="title">欢迎登录</div>
    <!--		<div class="subtitle">未注册的邮箱验证通过后将自动注册</div>-->

    <!-- 输入邮箱 -->
    <div class="input-group">
      <div class="icon">
        <i class="iconfont">&#xe656;</i> <!-- 这里使用iconfont图标 -->
<!--        <svg class="icon" aria-hidden="true">-->
<!--          <use xlink:href="#icon-person"></use>-->
<!--        </svg>-->
      </div>
      <input class="input" type="email" placeholder="用户名/邮箱" v-model="userName"  @blur="validateEmail"/>
      <div v-if="emailError" class="error">邮箱地址格式不正确</div>
    </div>
    <div class="input-group">
      <div class="icon">
        <i class="iconfont">&#xe6de;</i> <!-- 这里使用iconfont图标 -->
<!--        <svg class="icon" aria-hidden="true">-->
<!--          <use xlink:href="#icon-locked"></use>-->
<!--        </svg>-->
      </div>
      <input class="input" type="password" placeholder="密码" v-model="password"  @blur="validatePassword"/>
      <div v-if="passwordError" class="error">密码格式不正确</div>
    </div>
    <!-- 输入验证码 -->
<!--    <div class="input-group">-->
<!--      <div class="code-container">-->
<!--        <input class="input code-input" type="text" placeholder="请输入验证码" v-model="captcha"/>-->
        <!-- <button class="get-code" @click="sendVerificationCode" :disabled="codeSent">
          {{ codeSent ? `${countdown}s后重新获取` : '获取验证码' }}
        </button> -->
<!--        <button class="get-code" @click="sendVerificationCode">-->
<!--          {{ '获取验证码' }}-->
<!--        </button>-->
<!--      </div>-->
<!--    </div>-->

    <!-- 登录按钮 -->
    <button class="login-btn" @click="login">登录</button>
    <div class="register-link">
      <navigator url="/pages/register/register">
        没有账号，前往注册
      </navigator>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request";
import * as wsApi from '../../common/websocket';
import UNI_APP from "../../.env";

export default {
  data() {
    return {
      userName: "", // 用户名
      emailError: false,
      passwordError: false,
      password: "", // 密码
      captcha: "1", // 验证码
      remember: false, // 记住我
      redirectUrl: "http://jvks.si/ucut" // 重定向地址
    };
  },
  mounted() {
  },
  methods: {
    // 验证邮箱格式
    validateEmail(userName) {
      // 2460280679@qq.com
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(userName);
    },
    validatePassword(password) {
      // 密码验证逻辑，例如长度、复杂度等
      return password.length >= 6; // 示例：密码长度至少为6
    },
    // 发送验证码
    sendVerificationCode() {
      if (this.userName === "") {
        uni.showToast({
          title: "请输入邮箱地址",
          icon: "none",
        });
        return;
      }
      // 验证邮箱格式
      if (this.validateEmail(this.userName)) {
        console.log(this.validateEmail(this.userName))
        uni.showToast({
          title: "邮箱格式不正确",
          icon: "none",
        });
        return;
      }
      // 模拟发送验证码
      uni.showToast({
        title: "验证码已发送",
        icon: "success",
      });
    },
    // // 倒计时功能
    // countdownTimer() {
    // 	const timer = setInterval(() => {
    // 		if (this.countdown <= 1) {
    // 			clearInterval(timer);
    // 			this.countdown = 60;
    // 			this.codeSent = false;
    // 		} else {
    // 			this.countdown--;
    // 		}
    // 	}, 1000);
    // },
    async login() {
      if (this.userName === "" || this.verificationCode === "") {
        uni.showToast({
          title: "请填写完整信息",
          icon: "none",
        });
        return;
      }
      // 验证邮箱格式
      if (!this.validateEmail(this.userName)) {
        console.log(this.validateEmail(this.userName))
        uni.showToast({
          title: "邮箱格式不正确",
          icon: "none",
        });
        return;
      }


      // 请求体数据
      const body = {
        userName: this.userName,
        password: this.password,
        remember: this.remember,
        captcha: this.captcha,
        redirectUrl: this.redirectUrl,
      };
      try {
        // 调用封装的请求
        const res = await request({
          url: "/authenticate/login", // 替换为实际接口地址
          method: "POST",
          data: body,
        });

        // 打印完整响应
        console.log("响应结果：", res);
        // 处理响应
        if (res.code === '0') {
          //存储用户信息和token
          uni.setStorageSync('loginUser', res.data.loginUser);
          uni.setStorageSync('login-token', res.data.token);
          console.log('用户信息已存储');
          // wsApi.init();
          //认证
          wsApi.setTokenAndAuthorize(res.data.token);
          // uni.showToast({
          //   title: "登录成功",
          //   icon: "success",
          // });
          // 重定向到目标地址
          setTimeout(() => {
            uni.switchTab({
              url: "/pages/conversation/conversation", // 登录成功后的页面
            });
          }, 300);
          // wsApi.onConnect(() => {
          //   console.log("认证成功，跳转页面");
          //   uni.showToast({
          //     title: "登录成功",
          //     icon: "success",
          //   });
          //   uni.switchTab({
          //     url: "/pages/conversation/conversation", // 登录成功后的页面
          //   });
          // });
          // uni.switchTab({
          //   url: "/pages/conversation/conversation", // 登录成功后的页面
          // });
        } else {
          uni.showToast({
            title: res.message,
            icon: "none",
          });
        }
      } catch (error) {
        console.error("登录请求错误:", error);
        uni.showToast({
          title: "登录失败，请重试",
          icon: "none",
        });
      }
    },
  },
};
</script>

<style>
.container {
  padding: 20px;
}

.title {
  color: royalblue;
  font-size: 30px;
  font-weight: bold;
  margin-top: 70px;
  margin-bottom: 50px;
  text-align: center;
}

.subtitle {
  font-size: 14px;
  color: #999;
  margin-bottom: 30px;
}

.input-group {
  display: flex; /* 使用flex布局 */
  align-items: center; /* 垂直居中图标和输入框 */
  width: 100%; /* 保持与父容器宽度92% */
  border: 1px solid #ddd; /* 输入框的边框 */
  border-radius: 5px; /* 圆角 */
  padding: 0; /* 去除内边距，外部统一控制 */
  /* 设置两个input之间的间距 */
  margin: 20px auto;
  //margin-bottom: 20px;
}

.label {
  font-size: 16px;
  margin-bottom: 5px;
  display: block;
}

.icon {
  font-size: 20px; /* 图标的大小 */
  margin-right: 10px; /* 图标与输入框之间的间距 */
  padding-left: 10px; /* 图标的左侧内边距 */
  margin-bottom: 6px;
}

.input {
  //width: 92%;
  //padding: 0px;
  //border: 1px solid #ddd;
  //border-radius: 5px;
  //margin: 0 auto;
  flex: 1; /* 输入框占据剩余空间 */
  padding: 10px; /* 输入框的内边距 */
  border: none; /* 去除边框，交给外层的 .input-group 来控制 */
  font-size: 16px; /* 输入框字体大小 */
  outline: none; /* 去除焦点时的轮廓 */
}

.eye-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.error {
  color: red;
  font-size: 12px;
  margin-top: 5px;
}

.icon-eye, .icon-eye-off {
  font-size: 20px;
}

.error {
  color: red;
  font-size: 12px;
  margin-top: 5px;
}

.code-container {
  display: flex;
  align-items: center;
}

.code-input {
  flex: 1;
  margin-right: 10px;
}

.get-code {
  padding: 2px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
}

.get-code:disabled {
  background-color: #ccc;
}

.login-btn {
  width: 100%;
  padding: 5px;
  background-color: #007bff;
  color: white;
  font-size: 16px;
  text-align: center;
  border: none;
  border-radius: 50px;
  margin-top: 80rpx;
}

.register-link {
  position: fixed;
  width: 100%;
  bottom: 100rpx;
  color: royalblue;
  text-align: center;
  left: 0;
  right: 0;
  font-size: 32rpx;
}
</style>