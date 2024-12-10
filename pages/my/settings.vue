<template>
	<div class="settings-page">
		<!-- 页面标题 -->
		<!-- <div class="settings-header">
			<span>设置</span>
		</div> -->

		<!-- 消息提醒 -->
		<!-- <div class="settings-item" @click="goToPage('notification-settings')">
			<span>消息提醒</span>
			<img src="/static/arrow-right.png" class="arrow-icon" alt="arrow" />
		</div> -->

		<!-- 外观 -->
		<!-- <div class="settings-item" @click="goToPage('theme-settings')">
			<span>外观</span>
			<img src="/static/arrow-right.png" class="arrow-icon" alt="arrow" />
		</div> -->

		<!-- 听筒模式 -->
		<!-- <div class="settings-item">
			<span>听筒模式</span>
			<div class="switch-container">
				<input type="checkbox" :checked="settings.listenMode" @change="toggleListenMode" class="switch" />
			</div>
		</div> -->

		<!-- 消息已读未读功能 -->
		<!-- <div class="settings-item">
			<span>消息已读未读功能</span>
			<div class="switch-container">
				<input type="checkbox" :checked="settings.readUnread" @change="toggleReadUnread" class="switch" />
			</div>
		</div> -->

		<!-- 退出登录 -->
		<div class="logout-btn" @click="logout">
			<span>退出登录</span>
		</div>
	</div>
</template>
<script>
import * as wsApi from '../../common/websocket';

	export default {
		data() {
			return {
				// settings: {
				// 	// listenMode: true, // 听筒模式初始值
				// 	// readUnread: true, // 消息已读未读功能初始值
				// },
			};
		},
		methods: {
			// // 切换听筒模式
			// toggleListenMode(event) {
			// 	this.settings.listenMode = event.target.checked;
			// 	console.log("听筒模式切换为:", this.settings.listenMode ? "开" : "关");
			// },
			// // 切换已读未读功能
			// toggleReadUnread(event) {
			// 	this.settings.readUnread = event.target.checked;
			// 	console.log("消息已读未读功能切换为:", this.settings.readUnread ? "开" : "关");
			// },
			// 跳转到指定页面
			goToPage(page) {
				console.log(`跳转到 ${page} 页面`);
				uni.navigateTo({
					url: `/pages/${page}/${page}`
				});
			},
			// 退出登录逻辑
			logout() {
				uni.showModal({
					title: "确认退出登录",
					content: "退出登录后需要重新登录，确定要退出吗？",
					success: (res) => {
						if (res.confirm) {
							console.log("用户确认退出登录");
              //关闭连接
              wsApi.close();
              // 清除登录状态并跳转到登录页面
              uni.clearStorageSync();
							uni.reLaunch({
								url: "/pages/login/login"
							});
						} else {
							console.log("用户取消退出");
						}
					},
				});
			},
		},
	};
</script>
<style>
	.settings-page {
		padding: 10px;
		background-color: #f7f7f7;
		height: 100vh;
	}

	.settings-header {
		font-size: 20px;
		font-weight: bold;
		text-align: center;
		margin-bottom: 30px;
	}

	.settings-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: #fff;
		padding: 15px;
		margin-bottom: 10px;
		border-radius: 10px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		cursor: pointer;
	}

	.settings-item span {
		font-size: 16px;
	}

	.arrow-icon {
		width: 20px;
		height: 20px;
	}

	.switch-container {
		display: flex;
		align-items: center;
	}

	.switch {
		width: 40px;
		height: 20px;
		cursor: pointer;
	}

	.logout-btn {
		//width: 100%;
		background-color: #fff;
		/* 背景颜色设置为白色 */
		color: #ff4d4f;
		/* 字体颜色设置为红色 */
		font-size: 16px;
		text-align: center;
		padding: 15px;
		margin-top: 1px;
		border-radius: 10px;
		cursor: pointer;
	}
</style>