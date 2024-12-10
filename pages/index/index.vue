<template>
  <div class="container">
    <h1>欢迎使用</h1>
    <button @click="goToLogin">前往登录</button>
  </div>
</template>

<script>
export default {
  methods: {
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    }
  }
}
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
button {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
}
</style>
