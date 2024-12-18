import {WebsocketResponseType} from "./WebsocketResponseTypeEnum";
import {WebsocketCodeEnum} from "./WebsocketCodeEnum";
import ClientInformation from "./ClientInformation";

let websocketUrl = "";
let loginToken = ""; // 登录后的 Token
let messageCallBack = null;
let closeCallBack = null;
let connectCallBack = null;
let isConnect = false; // 连接标识 避免重复连接
let isAuthorize = false; // 是否授权成功
let rec = null;
let isInit = false;
let lastConnectTime = new Date(); // 最后一次连接时间

// 初始化 WebSocket
let init = () => {
    if (isInit) {
        console.log("WebSocket 已经初始化...");
        return;
    }
    console.log("WebSocket 初始化...");
    isInit = true;

    uni.onSocketOpen((res) => {
        console.log("WebSocket已打开");
        isConnect = true;

        if (!loginToken) {
            //跳转到登录页面
            console.log("WebSocket未登录，无法认证...  loginToken:",loginToken);
            return;
        }

        if (isAuthorize) {
            console.log("WebSocket已经认证过了...");
            return;
        }
        // 授权
        authorize();
    });

    uni.onSocketMessage((res) => {
        console.log("接收到 WebSocket 消息:", res.data);
        let sendInfo = JSON.parse(res.data);

        if (sendInfo.type === WebsocketResponseType.LOGIN_AUTHORIZE_SUCCESS) {
            isAuthorize = true; // 授权成功
            console.log("WebSocket 授权成功");
            heartCheck.start();
            connectCallBack && connectCallBack();
        } else if (sendInfo.type === 3) {
            // 重置心跳
            heartCheck.reset();
        } else if (sendInfo.type === WebsocketResponseType.INVALIDATE_TOKEN) {
            console.log("login-token 已过期:", loginToken);
            // 停止心跳
            isAuthorize = false; // 授权成功
            heartCheck.stop();
            // 关闭连接
            close(WebsocketCodeEnum.TOKEN_INVALIDATE);
            uni.reLaunch({
                url: "/pages/login/login",
            }); // 跳转到登录页面
        } else {
            // 其他消息转发出去
            console.log("接收到消息", sendInfo);
            messageCallBack && messageCallBack(sendInfo.type, sendInfo.data);
        }
    });

    uni.onSocketClose((res) => {
        isConnect = false;
        isAuthorize = false;
        console.log("WebSocket 连接关闭，原因：", res)

        // 停止心跳
        heartCheck.stop();
        //主动退出登录时不触发关闭回调
        if (res.code === WebsocketCodeEnum.CLOSE_CONNECT) {
            console.log("用户主动退出，不触发 closeCallBack");
            return;
        }

        //调用关闭时回调
        closeCallBack && closeCallBack(res);
    });

    uni.onSocketError((e) => {
        isConnect = false;
        isAuthorize = false;
        console.log("WebSocket 连接出错", e);
        // 停止心跳
        heartCheck.stop();
        closeCallBack && closeCallBack({code: WebsocketCodeEnum.CONNECT_ERROR});
    });
};

// 连接 WebSocket
let connect = (url) => {
    websocketUrl = url;
    if (isConnect) {
        return;
    }
    console.log("WebSocket 连接 URL:", websocketUrl);
    lastConnectTime = new Date();
    uni.connectSocket({
        url: websocketUrl,
        success: (res) => {
            console.log("WebSocket 连接成功");
        },
        fail: (e) => {
            console.log("WebSocket 连接失败，10 秒后重连", e);
            setTimeout(() => {
                connect(websocketUrl);
            }, 10000);
        },
    });
};

// 设置 Token 并认证
let setTokenAndAuthorize = (token) => {
    loginToken = token;
    if (isConnect && !isAuthorize) {
        authorize();
    }
};

// 授权方法
let authorize = () => {
    if (!loginToken) {
        console.log("Token 为空，无法认证...");
        return;
    }
    // 获取设备 ID
    const deviceId = ClientInformation.getDeviceId(); // 获取设备 ID
    //认证信息
    let authorizeInfo = {
        type: 1,
        token: loginToken,
        deviceId: deviceId,  // 加入 deviceId
    };
    console.log("发送认证消息:", authorizeInfo);
    uni.sendSocketMessage({
        data: JSON.stringify(authorizeInfo),
        fail: (res) => {
            console.log("认证消息发送失败:", res);
        },
    });
};
/**
 * 退出登录
 */
let logout = () => {
    console.log("用户退出登录");
    //清空登录状态
    loginToken = "";
    //重置认证状态
    isAuthorize = false;
    // 停止心跳逻辑
    heartCheck.stop();
    //关闭websocket连接 使用自定义状态码
    close(WebsocketCodeEnum.CLOSE_CONNECT);

}

// 重连 WebSocket
let reconnect = () => {
    console.log("尝试重新连接 WebSocket...");
    if (isConnect) {
        return;
    }

    let timeDiff = new Date().getTime() - lastConnectTime.getTime();
    let delay = timeDiff < 10000 ? 10000 - timeDiff : 0;

    rec && clearTimeout(rec);
    rec = setTimeout(() => {
        connect(websocketUrl);
    }, delay);
};

// 关闭连接
let close = (code) => {
    if (!isConnect) {
        return;
    }
    uni.closeSocket({
        code: code,
        complete: () => {
            console.log("WebSocket 连接关闭");
            isConnect = false;
        },
        fail: (e) => {
            console.log("关闭 WebSocket 连接失败", e);
        },
    });
};

// 心跳设置
var heartCheck = {
    timeout: 30000,
    timeoutObj: null,
    start: function () {
        if (isConnect) {
            console.log("发送 WebSocket 心跳包");
            let heartBeat = {
                type: 3,
                data: {},
            };
            uni.sendSocketMessage({
                data: JSON.stringify(heartBeat),
                fail: (res) => {
                    console.log("心跳包发送失败:", res);
                },
            });
        }
        this.reset();
    },
    reset: function () {
        clearTimeout(this.timeoutObj);
        this.timeoutObj = setTimeout(() => {
            heartCheck.start();
        }, this.timeout);
    },
    stop: function () {
        // 停止心跳逻辑，清除定时器
        console.log("停止 WebSocket 心跳包");
        clearTimeout(this.timeoutObj);
        this.timeoutObj = null;
    }
};

// 消息发送
let sendMessage = (agentData) => {
    uni.sendSocketMessage({
        data: agentData,
    });
};

// 回调设置
let onConnect = (callback) => {
    connectCallBack = callback;
};

let onMessage = (callback) => {
    messageCallBack = callback;
};

let onClose = (callback) => {
    closeCallBack = callback;
};

// 暴露方法
export {init, connect, setTokenAndAuthorize, logout,reconnect, close, sendMessage, onConnect, onMessage, onClose};
