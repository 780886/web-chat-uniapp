<template>
  <div class="container">
    <!-- 标题 -->
    <div class="header">欢迎注册</div>

    <!-- 用户名 -->
    <div class="form-item">
      <input
          type="text"
          placeholder="用户名"
          v-model="body.userName"
          class="input"
      />
    </div>

    <!-- 邮箱 -->
    <div class="form-item">
      <input
          type="email"
          placeholder="邮箱"
          v-model="body.email"
          class="input"
      />
    </div>

    <!-- 验证码 -->
<!--    <div class="form-item verification">-->
<!--      <input-->
<!--          type="text"-->
<!--          placeholder="验证码"-->
<!--          v-model="body.captcha"-->
<!--          class="input captcha-input"-->
<!--      />-->
<!--      <button class="captcha-btn" @click="getCaptcha" :disabled="isCaptchaLoading">-->
<!--        {{ isCaptchaLoading ? "发送中..." : "获取验证码" }}-->
<!--      </button>-->
<!--    </div>-->

    <!-- 密码 -->
    <div class="form-item">
      <input
          type="password"
          placeholder="密码"
          v-model="body.password"
          class="input"
      />
    </div>

    <!-- 确认密码 -->
    <div class="form-item">
      <input
          type="password"
          placeholder="确认密码"
          v-model="body.confirmPassword"
          class="input"
      />
    </div>

    <!-- 用户协议 -->
    <div class="form-item">
      <input
          type="checkbox"
          id="agreement"
          v-model="body.agree"
          class="checkbox"
      />
      <label for="agreement" class="agreement-text">
        我已阅读并同意
        <a href="/pages/agreement/user" class="link">《用户协议》</a>
        和
        <a href="/pages/agreement/privacy" class="link">《隐私政策》</a>
      </label>
    </div>

    <!-- 注册按钮 -->
    <div class="form-item">
      <button class="btn" @click="register">注册并登录</button>
    </div>

    <!-- 返回登录页面 -->
    <div class="back-to-login" @click="goToLogin">
      返回登录页面
    </div>
  </div>
</template>

<script>
import request from "../../utils/request";
import {validateEmail, validatePassword} from '../../utils/validation';

export default {
  data() {
    return {
      body: {
        userName: "",
        email: "",
        password: "",
        confirmPassword: "",
        captcha: "",
        channel: "web",
        agree: false,
      },
    };
  },
  methods: {
    // 注册方法
    async register() {
      if (!this.body.userName || !this.body.email || !this.body.password || !this.body.confirmPassword) {
        return uni.showToast({
          title: "请填写完整信息",
          icon: "none",
        });
      }
      validateEmail(this.body.userName);
      validatePassword(this.body.password);
      validatePassword(this.body.confirmPassword);
      if (this.body.password !== this.body.confirmPassword) {
        return uni.showToast({
          title: "两次密码输入不一致",
          icon: "none",
        });
      }
      if (!this.body.agree) {
        return uni.showToast({
          title: "请先同意用户协议和隐私政策",
          icon: "none",
        });
      }
      // // 请求体数据
      // const body = {
      //   userName: this.userName,
      //   email: this.email,
      //   password: this.password,
      //   confirmPassword: this.confirmPassword,
      //   captcha: this.captcha,
      // };

      console.log("请求体数据：", this.body);

      try {
        // 调用封装的请求
        const res = await request({
          url: "/api/authenticate/email-register", // 替换为实际接口地址
          method: "POST",
          data: this.body,
        });
        // 打印完整响应
        console.log("响应结果：", res);
        // 处理响应
        if (res.code === '0') {
          uni.showToast({
            title: "注册成功",
            icon: "success",
          });
          uni.navigateTo({
            url: "/pages/login/login",
          });
        } else {
          uni.showToast({
            title: res.data.message || "注册失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("注册失败:", error);
        uni.showToast({
          title: "注册失败",
          icon: "none",
        });
      }
    },
    async getCaptcha(){



    },
    // 返回登录页面
    goToLogin() {
      uni.navigateTo({
        url: "/pages/login/login",
      });
    },
  },
};
</script>

<style>
.container {
  padding: 20px;
  background-color: #ffffff;
  min-height: 100vh;
}

.header {
  font-size: 24px;
  font-weight: bold;
  color: #007bff;
  text-align: center;
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.input {
  width: 100%;
  padding: 0px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.checkbox {
  margin-right: 5px;
}

.agreement-text {
  font-size: 14px;
  color: #666;
}

.link {
  color: #007bff;
  text-decoration: underline;
}

.btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  text-align: center;
  background-color: #ff4d4f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn:active {
  background-color: #e63c3f;
}

.back-to-login {
  text-align: center;
  font-size: 14px;
  color: #007bff;
  margin-top: 15px;
  cursor: pointer;
}

.back-to-login:hover {
  text-decoration: underline;
}

.verification {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.captcha-input {
  width: calc(70% - 10px);
}

.captcha-btn {
  width: 28%;
  padding: 1px;
  background-color: #ff4d4f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
}

.captcha-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
