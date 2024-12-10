<template>
	<div class="profile-container">
		<!-- 头部区域 -->
		<div class="profile-header">
			<div class="profile-img">
				<img src="https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg"
					alt="User Avatar" />
			</div>
			<div class="user-info">
				<div class="username">{{nickName}}</div>
				<div class="account">账号:{{userName}}</div>
			</div>
		</div>

		<!-- 操作项 -->
		<div class="action-list">
			<div class="action-item">
				<div class="action-icon">
					<image src="/static/shezhi.png" alt="Settings" class="icon"/>
					<div class="action-text">设置</div>
				</div>
				<div class="arrow" @click="navigateTo('settings')">></div>
			</div>
			<!-- <div class="action-item">
				<div class="action-icon">
					<img src="/static/info-icon.png" alt="About" />
				</div>
				<div class="action-text">关于</div>
				<div class="arrow">></div>
			</div> -->
		</div>

		<!-- 底部导航栏 -->
<!--		<div class="tab-bar">-->
<!--			<div class="tab-item" :class="{ active: activeTab === 'conversation' }" @click="navigateTo('conversation')">-->
<!--				<img src="/static/conversation-selected.png" alt="消息" class="tab-icon" />-->
<!--				<div class="tab-text">消息</div>-->
<!--			</div>-->
<!--			<div class="tab-item" :class="{ active: activeTab === 'contact' }" @click="navigateTo('contact')">-->
<!--				<img src="/static/contact-selected.png" alt="通讯录" class="tab-icon" />-->
<!--				<div class="tab-text">通讯录</div>-->
<!--			</div>-->
<!--			<div class="tab-item" :class="{ active: activeTab === 'my' }" @click="navigateTo('my')">-->
<!--				<img src="/static/me-selected.png" alt="我的" class="tab-icon" />-->
<!--				<div class="tab-text">我</div>-->
<!--			</div>-->
<!--		</div>-->
	</div>
</template>

<script>
	export default {
		data() {
			return {
				// 数据和方法可以在这里进一步扩展
				userName: "",
				nickName: "",
				activeTab: 'my', // 默认选中的 tab
			};
		},
		onLoad() {
			const loginUser = uni.getStorageSync('loginUser');
			this.userName = loginUser.userName;
			this.nickName = loginUser.nickName;
		},
		methods: {
			// 可以在此处定义方法
			navigateTo(tab) {
				this.activeTab = tab; // 更新当前选中的 tab
        // 根据 tab 值跳转
        if (tab === 'conversation') {
          uni.navigateTo({
            url: "/pages/conversation/conversation", // 登录成功后的页面
          });
        } else if (tab === 'contact') {
          uni.navigateTo({
            url: "/pages/contact/contact", // 登录成功后的页面
          });
        } else if (tab === 'my') {
          uni.navigateTo({
            url: "/pages/my/my", // 登录成功后的页面
          });
        }else if (tab === 'settings') {
          uni.navigateTo({
            url: "/pages/my/settings", // 登录成功后的页面
          });
        }
			},
		}
	};
</script>

<style scoped>
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	.profile-container {
		//font-family: Arial, sans-serif;
		//padding: 20px;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow-y: hidden; /* 禁止垂直滚动 */
	}

	.profile-header {
		display: flex;
		align-items: center;
		padding-left: 20px;
		padding-top: 20px;
		margin-bottom: 20px;
	}

	.profile-img img {
		width: 60px;
		height: 60px;
		border-radius: 10%;
		object-fit: cover;
	}

	.user-info {
		margin-left: 15px;
	}

	.username {
		font-size: 20px;
		font-weight: bold;
		color: #333;
	}

	.account {
		font-size: 14px;
		color: #888;
	}

	.action-list {
		margin-bottom: 20px;
	}

	.action-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px;
		background-color: #fff;
		border-radius: 8px;
		border: 1px solid #f0f0f0;
		margin-bottom: 12px;
	}

	.action-icon {
		display: flex;
		align-items: center;
	}
	
	.icon{
		width: 24px;
		height: 24px;
	}
	
	.action-text {
		margin-left: 10px;
		font-size: 16px;
		color: #333;
	}

	.arrow {
		font-size: 20px;
		color: #999;
	}

	.bottom-nav {
		display: flex;
		justify-content: space-around;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fff;
		padding: 10px;
		border-top: 1px solid #e1e1e1;
	}

	.nav-item {
		font-size: 16px;
		color: #333;
		text-align: center;
	}

	.nav-item.active {
		color: #4a90e2;
	}

	.tab-bar {
		display: flex;
		justify-content: space-around;
		align-items: center;
		background-color: #ffffff;
		padding: 10px 0;
		border-top: 1px solid #ddd;
		position: absolute;
		bottom: 0%;
		width: 100%;
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 14px;
		color: #999999;
	}

	.tab-item.active {
		color: #007aff;
	}

	.tab-icon {
		width: 24px;
		height: 24px;
		margin-bottom: 5px;
	}

	.tab-text {
		font-size: 12px;
	}
</style>