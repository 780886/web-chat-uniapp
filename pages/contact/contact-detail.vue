<template>
	<div class="container">
		<!-- 顶部导航栏 -->
		<!-- <div class="header">
			<span class="back-btn" @click="goBack">←</span>
			<span class="title">联系人详情</span>
		</div> -->

		<!-- 个人信息展示 -->
		<div class="profile">
			<img class="avatar" :src="avatar"
				alt="Avatar" />
			<div class="info">
				<div class="name">{{nickName}}</div>
				<div class="account">账号: {{userName}}</div>
			</div>
		</div>

		<!-- 详细信息 -->
<!--		<div class="detail-list">-->
			<!-- <div class="detail-item" v-for="(item, index) in details" :key="index">
				<span class="label">{{ item.label }}</span>
				<span class="value">{{ item.value }}</span>
			</div> -->
			<!-- <div class="detail-item">
				<span class="label">加入黑名单</span>
				<switch class="switch" v-model="isBlacklisted" @change="toggleBlacklist" />
			</div> -->
<!--		</div>-->

		<!-- 操作按钮 -->
		<div class="actions">
			<button class="chat-btn" @click="navigateToChat">发消息</button>
			<button class="delete-btn" @click="deleteFriend">删除好友</button>
		</div>
	</div>
</template>

<script>
	export default {
		data() {
			return {
        roomId:0,
        userId:0,
        userName:'',
        nickName:'',
        avatar:'',
				// 是否加入黑名单
				isBlacklisted: false,
				// 联系人详细信息

				details: [{
						label: "备注名",
						value: "未设置"
					},
					{
						label: "生日",
						value: "未设置"
					},
					{
						label: "手机",
						value: "未设置"
					},
					{
						label: "邮箱",
						value: "未设置"
					},
					{
						label: "个性签名",
						value: "未设置"
					},
				],
			};
		},
    /**
     * 接收参数
     */
    onLoad(options) {
      this.roomId = options.roomId;
      this.userId = options.userId;
      this.userName = options.userName;
      this.nickName = options.nickName;
      this.avatar = options.avatar;
    },
    // mounted() {
    //   // 获取路由传递的参数
    //   const { roomId,userId, userName,nickName, avatar } = this.$route.query;
    //
    // },
		methods: {
			// 返回上一页
			// goBack() {
			// 	uni.navigateBack();
			// },
			// 切换黑名单状态
			toggleBlacklist(event) {
				// this.isBlacklisted = event.detail.value;
				uni.showToast({
					title: "此功能正在开发中...",
					icon: "none",
				});
			},
      // navigateToChat() {
      //   this.$router.push({
      //     path: '/pages/chat/chat',
      //     query: {
      //       roomId: this.roomId,
      //       name: this.nickName,
      //       avatar: this.avatar
      //     }
      //   });
      // },
      navigateToChat() {
        // // 获取当前页面的查询参数
        // const { roomId,userId, userName,nickName, avatar } = this.$route.query;
        // 打印当前页面的查询参数
        // console.log("Current page query params:", { this.roomId, name, avatar });
        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/chat/chat?roomId=${Number(this.roomId)}&name=${this.nickName}&avatar=${this.avatar}`, // 通过 URL 的 query 传递参数
          });
        }, 5);
      },
			// 开始聊天
			startChat() {
				uni.showToast({
					title: "进入聊天",
					icon: "none",
				});
			},
			// 删除好友
			deleteFriend() {
				uni.showModal({
					title: "提示",
					content: "确定删除好友吗？",
					success: (res) => {
						if (res.confirm) {
							uni.showToast({
								title: "好友已删除",
								icon: "none",
							});
						}
					},
				});
			},
		},
	};
</script>

<style scoped>
	/* 容器样式 */
	.container {
		background-color: #f5f5f5;
		min-height: 100vh;
	}

	/* 顶部导航栏 */
	.header {
		display: flex;
		align-items: center;
		padding: 10px 16px;
		background-color: #ffffff;
		border-bottom: 1px solid #ddd;
	}

	.back-btn {
		font-size: 18px;
		color: #333;
		margin-right: 16px;
		cursor: pointer;
	}

	.title {
		font-size: 18px;
		font-weight: bold;
	}

	.profile {
		display: flex;
		align-items: center;
		/* 垂直居中对齐头像和信息 */
		padding: 20px;
		background-color: #ffffff;
		border-bottom: 1px solid #ddd;
	}

	.avatar {
		width: 60px;
		height: 60px;
		border-radius: 50%;
		margin-right: 16px;
	}

	.info {
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	.name {
		font-size: 20px;
		font-weight: bold;
		color: #333;
	}

	.account {
		font-size: 14px;
		color: #888;
	}


	/* 详细信息列表 */
	.detail-list {
		background-color: #ffffff;
		margin: 10px;
		border-radius: 8px;
		padding: 10px;
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px solid #f0f0f0;
	}

	.detail-item:last-child {
		border-bottom: none;
	}

	.label {
		color: #666;
		font-size: 16px;
	}

	.value {
		color: #333;
		font-size: 16px;
	}

	.switch {
		margin-left: auto;
	}

	/* 操作按钮 */
	.actions {
		text-align: center;
		margin: 20px 0;
	}

	.chat-btn {
		background-color: #fff;
		color: #007bff;
		font-size: 16px;
		padding: 10px 20px;
		border-radius: 5px;
		margin: 10px;
	}

	.delete-btn {
		background-color: #fff;
		color: #ff4d4f;
		font-size: 16px;
		padding: 10px 20px;
		border-radius: 5px;
		margin: 10px;
	}
</style>