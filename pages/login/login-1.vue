<template>
  <view class="login-container">
    <div class="welcome-text">
      <text>欢迎登录</text>
    </div>
    <div class="form">
      <!-- 用户名输入框 -->
      <div class="input-group">
        <div class="icon user-icon"></div>
        <div class="input-wrapper">
          <div
              class="input"
              contenteditable="true"
              @input="updateUsername"
              placeholder="用户名"
          ></div>
        </div>
        <div
            class="clear-icon"
            v-if="username"
            @click="clearUsername"
        >✖
        </div>
      </div>
      <!-- 密码输入框 -->
      <div class="input-group">
        <div class="icon lock-icon"></div>
        <div class="input-wrapper">
          <div
              class="input"
              contenteditable="true"
              @input="updatePassword"
              placeholder="密码"
          ></div>
        </div>
        <div
            class="toggle-password"
            @click="togglePassword"
        >{{ showPassword ? '👁️' : '🔒' }}
        </div>
      </div>
      <!-- 登录按钮 -->
      <div class="login-button" @click="login">登录</div>
    </div>
    <div class="register-link">
      <navigator url="/pages/register/register">
        没有账号，前往注册
      </navigator>
    </div>
  </view>
</template>
<script>
export default {
  data() {
    return {
      username: '', // 用户名
      password: '', // 密码
      showPassword: false, // 密码是否可见
    };
  },
  methods: {
    // 更新用户名
    updateUsername(e) {
      this.username = e.target.innerText;
    },
    // 清空用户名
    clearUsername() {
      this.username = '';
      this.$nextTick(() => {
        document.querySelector('.input[placeholder="用户名"]').innerText = '';
      });
    },
    // 更新密码
    updatePassword(e) {
      this.password = e.target.innerText;
    },
    // 切换密码可见性
    togglePassword() {
      this.showPassword = !this.showPassword;
      const passwordField = document.querySelector(
          '.input[placeholder="密码"]'
      );
      if (this.showPassword) {
        passwordField.style.webkitTextSecurity = 'none';
      } else {
        passwordField.style.webkitTextSecurity = 'disc';
      }
    },
    // 登录事件
    login() {
      if (!this.username || !this.password) {
        uni.showToast({
          title: '请输入用户名和密码',
          icon: 'none',
        });
        return;
      }

      // 模拟登录逻辑
      uni.showToast({
        title: '登录成功',
        icon: 'success',
      });

      // 跳转页面示例
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/home/home',
        });
      }, 1000);
    },
  },
};
</script>

<style>
/* 主容器样式 */
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  height: 100%;
}

/* 标题样式 */
.header {
  margin-bottom: 40rpx;
}

.app-title {
  font-size: 40rpx;
  color: #0057ff;
  font-weight: 700;
}

/* 欢迎文字 */
.welcome-text text {
  font-size: 32rpx;
  color: #444;
  margin-bottom: 50rpx;
}

/* 表单样式 */
.form {
  width: 85%;
  display: flex;
  flex-direction: column;
  gap: 35rpx;
}

/* 输入框分组 */
.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 12rpx;
  padding: 12rpx 18rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.icon {
  width: 35rpx;
  height: 35rpx;
  margin-right: 12rpx;
}

.user-icon {
  background-image: url('/static/black.png');
  background-size: cover;
}

.lock-icon {
  background-image: url('/static/black.png');
  background-size: cover;
}

/* 输入框样式 */
.input-wrapper {
  flex: 1;
}

.input {
  height: 42rpx;
  font-size: 28rpx;
  outline: none;
}

.input[contenteditable="true"]::before {
  content: attr(placeholder);
  color: #999;
  pointer-events: none;
}

/* 清空按钮 */
.clear-icon {
  font-size: 26rpx;
  color: #888;
  cursor: pointer;
  margin-left: 10rpx;
}

/* 密码可见切换按钮 */
.toggle-password {
  font-size: 26rpx;
  color: #888;
  cursor: pointer;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 52rpx;
  background-color: #0057ff;
  color: #fff;
  text-align: center;
  line-height: 52rpx;
  border-radius: 15rpx;
  font-size: 30rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 6rpx rgba(0, 0, 0, 0.2);
}

.login-button:active {
  background-color: #0040cc;
}

/* 注册链接 */
.register-link navigator {
  color: #0057ff;
  font-size: 26rpx;
  text-decoration: underline;
  margin-top: 25rpx;
}

</style>