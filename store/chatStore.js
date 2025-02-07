import {defineStore} from 'pinia';
import request from "../utils/request";
import ClientInformation from "../common/ClientInformation";
import {getAvatar} from "../common/Avatar";


let chatCache = [];
export default defineStore('chatStore', {
    id: 'chat',
    state: () => {
        return {
            roomId: 0,
            minMessageId: null,
            pageSize: 50,
            pageNo: 1,
            messages: [],
            avatar: ''
        }
    },
    actions: {
        setRoomId(roomId) {
            this.roomId = roomId;
            // 可以在这里添加其他逻辑，比如根据roomId获取消息等
        },
        setAvatar(avatar) {
            this.avatar = avatar;
        },
        setPageNo(pageNo) {
            this.pageNo = pageNo;
        },
        getPageNo() {
            return this.pageNo;
        },
        setMinMessageId(minMessageId){
            this.minMessageId = minMessageId;
        },
        getMinMessageId() {
            return this.minMessageId;
        },
        async getMessageList() {
            try {
                // 调用封装的请求
                const res = await request({
                    url: "/chat/message-list", // 替换为实际接口地址
                    method: "GET",
                    data: {
                        pageNo: this.pageNo,
                        pageSize: this.pageSize,
                        roomId: this.roomId,
                        minMessageId:Number(this.minMessageId),
                    },
                    header: {
                        "ajax": true,
                    },
                });
                console.log("消息列表:", res)
                // 处理响应
                if (res.code === '0') {
                    const loginUser = uni.getStorageSync('loginUser');
                    const currentLoginUserId = loginUser.userId;
                    // 处理数据
                    // 赋值处理后的数据
                    const messageList = res.data.list.map((message) => {
                        const senderUserId = message.senderUserId;
                        const roomId = message.roomId;
                        const type = senderUserId === currentLoginUserId ? "right" : "left";
                        const messageId = message.messageId;
                        const sendTime = message.sendTime;
                        const messageType = message.messageType;
                        const content = message.body.content;
                        const avatar = message.avatar;
                        // const avatar = "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg";
                        // 例如，你可以在这里处理每条消息的数据
                        return {
                            roomId: roomId, // 房间ID
                            type: type, // 消息类型（"left" 或 "right"）
                            messageType: messageType,
                            content: content, // 消息内容
                            avatar: avatar, // 头像
                            messageId: messageId,
                            sendTime:sendTime
                        };
                    });
                    // console.log("当前页号",this.getPageNo());
                    // this.messages = messageList;
                    //计算最小的messageId 每次查询最小的
                    //校验数组为空
                    if (messageList.length === 0) {
                        console.log("已经没有更多了")
                        return;
                    }
                    console.log("messageList", messageList);
                    const currentRoomMinId = messageList[0].messageId;
                    console.log("this.minMessageId", this.minMessageId);
                    if (this.minMessageId === null) {
                        console.log("第一次查询")
                        this.messages = messageList;
                    } else {
                        this.messages = [...messageList,...this.messages];
                    }
                    this.minMessageId = currentRoomMinId;
                    console.log("当前最小id", this.minMessageId);
                    // //每次将消息插入到最前面
                    // this.messages = messageList;
                    // this.messages.push(messageList);
                    // if (this.getPageNo() === 1){
                    //     this.messages = messageList;
                    //     //计算最小的messageId
                    //     this.roomMinId = messageList[0].id;
                    // }else {
                    //     this.messages = [...messageList];
                    // }
                } else {
                    uni.showToast({
                        title: res.message || "获取消息列表失败",
                        icon: "none",
                    });
                }
            } catch (error) {
                console.error("获取消息列表失败:111", error);
                uni.showToast({
                    title: "获取消息列表失败，请重试",
                    icon: "none",
                });
            }
        },
        addOwnMessage(data) {
            const loginUser = uni.getStorageSync('loginUser');
            const currentLoginUserId = loginUser.userId;
            const senderUserId = data.senderUserId;
            const type = senderUserId === currentLoginUserId ? "right" : "left";
            const roomId = data.roomId;
            const messageId = data.messageId;
            const messageType = data.messageType;
            const content = data.body.content;
            const avatar = data.avatar;
            const message = {
                messageId: messageId,
                roomId: roomId,
                messageType: messageType,
                type: type,
                content: content,
                avatar: avatar,
            }
            this.messages.push(message);
        },
        addMessage(data) {
            console.log("message", data)
            const loginUser = uni.getStorageSync('loginUser');
            const currentLoginUserId = loginUser.userId;
            const roomId = data.roomId;
            console.log("roomId", roomId);
            console.log("this.roomId", this.roomId);
            console.log("roomId !== this.roomId", roomId !== this.roomId);
            if (roomId !== Number(this.roomId)) {
                return;
            }
            const senderUserId = data.senderUserId;
            if (senderUserId === currentLoginUserId) {
                return;
            }
            const type = senderUserId === currentLoginUserId ? "right" : "left";
            const messageType = data.type;
            const content = data.content;
            const messageId = data.id;
            // const avatar = "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg";
            const avatar = this.avatar;
            const message = {
                type: type, // 消息类型（"left" 或 "right"）
                messageType: messageType,
                content: content, // 消息内容
                avatar: avatar, // 头像
                roomId: roomId, // 房间ID
                messageId: messageId,
            }
            // 赋值处理后的数据
            this.messages.push(message);
            // 触发更新通知
            uni.$emit('onMessage');
            console.log("this.chats", this.messages);
        },
        clear(){
            this.messages = [];
        },
    },
    // setLoadingRoomMessage() {
    //     this.refreshChats();
    // },
    // refreshChats() {
    //     if (!chatCache) {
    //         return;
    //     }
    //     // 排序
    //     // cacheChats.sort((chat1, chat2) => {
    //     //     return chat2.lastSendTime - chat1.lastSendTime;
    //     // });
    //     // 将消息一次性装载回来
    //     this.chats = chatCache;
    //     // 清空缓存，不再使用
    //     chatCache = null;
    //     // this.saveToStorage();
    // },
    // saveToStorage() {
    //     const userStore = useUserStore();
    //     let userId = userStore.userInfo.id;
    //     let key = "chats-app-" + userId;
    //     let chatKeys = [];
    //     // 按会话为单位存储，只存储有改动的会话
    //     this.chats.forEach((chat) => {
    //         let chatKey = `${key}-${chat.type}-${chat.targetId}`
    //         if (!chat.stored) {
    //             if (chat.delete) {
    //                 uni.removeStorageSync(chatKey);
    //             } else {
    //                 uni.setStorageSync(chatKey, chat);
    //             }
    //             chat.stored = true;
    //         }
    //         if (!chat.delete) {
    //             chatKeys.push(chatKey);
    //         }
    //     })
    //     // 会话核心信息
    //     let chatsData = {
    //         privateMsgMaxId: this.privateMsgMaxId,
    //         groupMsgMaxId: this.groupMsgMaxId,
    //         chatKeys: chatKeys
    //     }
    //     uni.setStorageSync(key, chatsData)
    //     // 清理已删除的会话
    //     this.chats = this.chats.filter(chat => !chat.delete)
    // }
    getters: {
        currentChats: state => {
            return state.chats;
        }

    }
});