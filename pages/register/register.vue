<template>
  <div class="container">
    <!-- 页面标题 -->
    <div class="title">欢迎注册</div>

    <!-- 输入用户名 -->
    <div class="input-group">
      <div class="icon">
        <i class="iconfont">&#xe656;</i>
<!--        <svg class="icon" aria-hidden="true">-->
<!--          <use xlink:href="#icon-person"></use>-->
<!--        </svg>-->
      </div>
      <input class="input" type="text" placeholder="用户名" v-model="userName" />
    </div>

    <!-- 输入邮箱 -->
    <div class="input-group">
      <div class="icon">
        <i class="iconfont">&#xe908;</i>
<!--        <svg class="icon" aria-hidden="true">-->
<!--          <use xlink:href="#icon-youxiang"></use>-->
<!--        </svg>-->
      </div>
      <input class="input" type="email" placeholder="邮箱" v-model="email" @blur="validateEmail" />
      <div v-if="emailError" class="error">邮箱地址格式不正确</div>
    </div>

    <!-- 输入密码 -->
    <div class="input-group">
      <div class="icon">
        <i class="iconfont">&#xe6de;</i>
<!--        <svg class="icon" aria-hidden="true">-->
<!--          <use xlink:href="#icon-locked"></use>-->
<!--        </svg>-->
      </div>
      <input class="input" type="password" placeholder="密码" v-model="password" />
    </div>

    <!-- 确认密码 -->
    <div class="input-group">
      <div class="icon">
        <i class="iconfont">&#xe6de;</i>
<!--        <svg class="icon" aria-hidden="true">-->
<!--          <use xlink:href="#icon-locked"></use>-->
<!--        </svg>-->
      </div>
      <input class="input" type="password" placeholder="确认密码" v-model="confirmPassword" />
      <div v-if="passwordMismatch" class="error">两次输入的密码不一致</div>
    </div>

    <!-- 验证码 -->
    <div class="input-group">
      <input class="input code-input" type="text" placeholder="请输入验证码" v-model="captcha" />
      <img :src="captchaImage" alt="验证码" class="captcha-image" @click="refreshCaptcha" />
    </div>

    <!-- 注册按钮 -->
    <button class="login-btn" @click="register">注册</button>
    <div class="login-link">
      <navigator url="/pages/login/login">
        已有账号，前往登录
      </navigator>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request";
import {validateEmail, validatePassword, validateUserName} from '../../utils/validation';
import UNI_APP from '../../.env.js'
import ClientInformation from "../../common/ClientInformation";

export default {
  data() {
    return {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      captcha: "",
      captchaImage: "",
      emailError: false,
      passwordMismatch: false,
    };
  },
  mounted() {
    this.refreshCaptcha();
  },
  methods: {
    // 验证邮箱格式
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.emailError = !emailRegex.test(this.email);
    },
    // 刷新验证码
    async refreshCaptcha() {
      this.captchaImage = UNI_APP.BASE_URL + `/validate-code?t=${Date.now()}`;
    },
    // 注册
    async register() {
      if (!this.userName){
        return uni.showToast({
          title: "请输入用户名",
          icon: "none",
        });
      }
      if (!this.email){
        return uni.showToast({
          title: "请输入邮箱",
          icon: "none",
        });
      }
      if (!this.password){
        return uni.showToast({
          title: "请输入密码",
          icon: "none",
        });
      }
      if (!this.confirmPassword){
        return uni.showToast({
          title: "请输入确认密码",
          icon: "none",
        });
      }
      if (!this.captcha){
        return uni.showToast({
          title: "请输入验证码",
          icon: "none",
        });
      }
      validateUserName(this.userName);
      validateEmail(this.email);
      validatePassword(this.password);
      validatePassword(this.confirmPassword);
      this.passwordMismatch = this.password !== this.confirmPassword;
      try {
        const body = {
          userName: this.userName,
          email: this.email,
          password: this.password,
          confirmPassword:this.confirmPassword,
          channel:null,
          captcha: this.captcha,
        };
        const res = await request({
          url: "/authenticate/email-register", // 替换为实际注册接口地址
          method: "POST",
          data: body,
          needAuth: false,
        });
        // 打印完整响应
        console.log("响应结果：", res);
        if (res.code === "0") {
          uni.showToast({
            title: "注册成功",
            icon: "success",
          });
          uni.navigateTo({
            url: "/pages/login/login",
          });
        } else {
          uni.showToast({
            title: res.message || "注册失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("注册请求错误:", error);
        uni.showToast({
          title: "注册失败，请重试",
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
  margin-top: 30px;
  margin-bottom: 25px;
  text-align: center;
}

.input-group {
  display: flex;
  align-items: center;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 5px;
  margin: 20px auto;
}

.icon {
  font-size: 20px;
  margin-right: 10px;
  padding-left: 10px;
}

.input {
  flex: 1;
  padding: 10px;
  border: none;
  font-size: 16px;
  outline: none;
}

.captcha-image {
  height: 40px;
  cursor: pointer;
}

.error {
  color: red;
  font-size: 12px;
  margin-top: 5px;
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
  margin-top: 20px;
}

.login-link {
  margin-top: 10px;
  color: royalblue;
  text-align: center;
  font-size: 16px;
}
</style>
