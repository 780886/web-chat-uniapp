<template>
  <div class="container">
    <!-- 通讯录列表 -->
    <div class="book-list">
      <div class="book-item">
        <div class="contact-icon">
          <image src="/static/xindepengyou.png" alt="Verify" class="icon"/>
        </div>
        <div class="book-info">
          <div class="book-name" @click="addFriend">新的朋友</div>
        </div>
<!--        <div class="arrow" @click="addFriend">></div>-->
      </div>
      <div class="book-item">
        <div class="contact-icon">
          <image src="/static/qunliao.png" alt="Group Chat" class="icon"/>
        </div>
        <div class="book-info">
          <div class="book-name" @click="myQunList">群聊</div>
        </div>
<!--        <div class="arrow" @click="myQunList">></div>-->
      </div>
    </div>
    <!-- 联系人列表 -->
    <div class="contact-list">
      <div v-for="(group, index) in groupContacts" :key="index">
        <!-- 分组头部 -->
        <div class="group-header">{{ group.letter }}</div>

        <!-- 联系人 -->
        <div v-for="(contact, idx) in group.contacts" :key="idx" class="contact-item"
             @click="navigateToDetail(contact)">
          <div class="avatar-container">
            <image class="avatar" :src="contact.avatar" alt="Avatar"/>
          </div>
          <div class="contact-info">
            <div class="contact-name">{{ contact.nickName }}</div>
<!--            <div class="contact-status">{{ contact.status }}</div>-->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from "../../utils/request";
import * as wsApi from "../../common/websocket";
import UNI_APP from "../../.env";
import ClientInformation from "../../common/ClientInformation";
import {getAvatar} from "../../common/Avatar";

export default {
  data() {
    return {
      pageNo: 1,
      pageSize: 10,
      activeTab: 'contact', // 默认选中的 tab
      // 模拟分组联系人数据
        groupContacts: [
            // {
          // letter: "A",
          // contacts: [{
          //   name: "Alice",
          //   status: "在线",
          //   avatar: "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg"
          // },
          //   {
          //     name: "Alan",
          //     status: "离线",
          //     avatar: "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg"
          //   },
          // ],
        // }
        ],
    };
  },
  onShow() {
    const loginToken = uni.getStorageSync("login-token");
    wsApi.setTokenAndAuthorize(loginToken);
    this.contactList(); // 组件加载时调用接口
  },
  methods: {
    async contactList() {
      try {
        // 调用封装的请求
        const res = await request({
          url: "/contact/contact-list", // 替换为实际接口地址
          method: "GET",
          data: {
            pageNo: this.pageNo,
            pageSize: this.pageSize
          },
          header: {
            "ajax": true,
          },
        });

        // 打印完整响应
        console.log("联系人列表：", res);
        // 处理响应
        if (res.code === '0') {
          const contacts = res.data.list.map((contact) => {
            const nationality = contact.userVO.nationality;
            const flagUrl = contact.userVO.flagUrl;
            const roomId = contact.roomId;
            const firstLetter  = contact.firstLetter;
            const userId = contact.userVO.userId;
            const userName = contact.userVO.userName;
            const nickName = contact.userVO.nickName;
            const avatar = getAvatar(contact.userVO.avatar);
            return {
              nationality: nationality,
              flagUrl: flagUrl,
              roomId: roomId,
              firstLetter:firstLetter,
              userId: userId,
              userName: userName,
              nickName: nickName,
              avatar: avatar
            }
          });
          // 分组函数
          const groupContactsByFirstLetter = (contacts) => {
            return contacts.reduce((grouped, contact) => {
              const firstLetter = contact.firstLetter || "#";
              if (!grouped[firstLetter]) {
                grouped[firstLetter] = []; // 初始化分组
              }
              grouped[firstLetter].push(contact); // 添加联系人到对应组
              return grouped;
            }, {});
          };

          // 分组联系人
          const groupedContacts = groupContactsByFirstLetter(contacts);

          // 转换为页面渲染的格式
          this.groupContacts = Object.keys(groupedContacts).sort((a, b) => {
            // 特殊字符 "#" 排到最后
            if (a === "#") return 1;
            if (b === "#") return -1;
            return a.localeCompare(b); // 按字母排序
          }).map(letter => ({
            letter: letter,
            contacts: groupedContacts[letter]
          }));

          // this.groupContacts = [{
          //   letter: "A",
          //   contacts: contacts
          // }]
          console.log("groupContacts",this.groupContacts)
        } else {
          uni.showToast({
            title: res.message || "获取联系人失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取联系人失败:", error);
        uni.showToast({
          title: "获取联系人失败，请重试",
          icon: "none",
        });
      }
    },
    navigateToDetail(contact) {
      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/contact/contact-detail?roomId=${contact.roomId}&userId=${contact.userId}&userName=${contact.userName}&nickName=${contact.nickName}&avatar=${contact.avatar}`, // 通过 URL 的 query 传递参数
        });
      }, 5);
      // this.$router.push({
      //   path: '/pages/contact/contact-detail',
      //   query: {
      //     roomId: contact.roomId,
      //     userId: contact.userId,
      //     userName: contact.userName,
      //     nickName: contact.nickName,
      //     avatar: contact.avatar
      //   }
      // });
    },
    // 可以在此添加方法来处理用户交互
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
      } else if (tab === 'contact-detail') {
        uni.navigateTo({
          url: `/pages/contact/contact-detail?userId=${1}`, // 登录成功后的页面
        });
        // this.$router.push({
        //   path: '/pages/contact/contact-detail',
        //   query: {
        //     userId: 1
        //   }
        // });
      }
    },
    addFriend() {
      uni.navigateTo({
        url: "/pages/friend/friend-add", // 登录成功后的页面
      });
    },
    blackList() {
      uni.showToast({
        title: "此功能正在开发中...",
        icon: "none",
      });
    },
    myQunList() {
      uni.showToast({
        title: "此功能正在开发中...",
        icon: "none",
      });
    }
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  //padding: 10px;
  display: flex;
  flex-direction: column;
  height: 100%;
  /*overflow-y: hidden; !* 禁止垂直滚动 *!*/
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.search-icon img {
  width: 24px;
  height: 24px;
}

.book-list {
  /* overflow-y: auto; */
  width: 100%;
 margin-bottom: 10px;
}


.contact-list {
  /*overflow-y: auto;*/
  width: 100%;
  margin-bottom: 15px;
}

.group-header {
  padding: 4px 10px;
   background-color: #ededed;
  font-size: 10px;
  font-weight: bold;
  color: #555;
  /*border-radius: 5px;*/
  margin-bottom: 3px;
}

.book-item {
  display: flex;
  //justify-content: space-between;
  //align-items: center;
  padding: 10px 14px;
  background-color: #fff;
  /*border-radius: 10px;*/
  //margin-bottom: 0px;
}

.contact-item {
  display: flex;
  //justify-content: space-between;
  //align-items: center;
  padding: 6px 16px;
  background-color: #fff;
  border-radius: 10px;
  /*border: 1px solid #f0f0f0;*/
  //margin-bottom: 0px;
}

.avatar-container {
  //flex-shrink: 0;
  //margin-right: 10px;
  display: flex;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 10%;
}

.icon{
 width: 45px;
  height: 45px;
  border-radius: 10%;
}

.iconfont{
  font-size: 40px;
}

.contact-icon {
/*  width: 10px;
  height: 10px; */
  //color: #69b931;
  border-radius: 10%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.contact-icon img {
  width: 30px;
  height: 30px;
}

.book-info {
  /* flex-grow: 1; */
  margin-left: 8px;
  width: 88%;
  border-bottom: 1px solid #f0f0f0;
}

.contact-info {
  /* flex-grow: 1; */
  margin-left: 8px;
  width: 88%;
  border-bottom: 1px solid #f0f0f0;
}

.book-name {
  font-size: 22px;
//font-weight: bold;
  color: #333;
  max-width: 50%;
  white-space: nowrap;   /* 防止文本换行 */
  overflow: hidden;      /* 隐藏超出部分 */
  text-overflow: ellipsis; /* 超出部分显示省略号 */
}

.contact-name {
  font-size: 18px;
  //font-weight: bold;
  color: #333;
  max-width: 50%;
  white-space: nowrap;   /* 防止文本换行 */
  overflow: hidden;      /* 隐藏超出部分 */
  text-overflow: ellipsis; /* 超出部分显示省略号 */
}

.contact-status {
  font-size: 14px;
  color: #999;
}

.arrow {
  font-size: 20px;
  color: #999;
}

.alphabet-index {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 10px 0;
}

.alphabet {
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 14px;
  color: #333;
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