import {WebsocketResponseType} from "./WebsocketResponseTypeEnum";

let websocketUrl = "";
let loginToken = "";
let messageCallBack = null;
let closeCallBack = null;
let connectCallBack = null;
let isConnect = false; //连接标识 避免重复连接
//是否授权成功
let isAuthorize = false;//是否授权成功
let rec = null;
let isInit = false;
let lastConnectTime = new Date(); // 最后一次连接时间

let init = () => {
    // 防止重复初始化
    if (isInit) {
        console.log("WebSocket 已经初始化...");
        return;
    }
    console.log("WebSocket 初始化...");
    isInit = true;
    uni.onSocketOpen((res) => {
        console.log("WebSocket已打开");
        isConnect = true;
        if (isAuthorize) {
            console.log("WebSocket已经认证过了.");
            return;
        }
        // if(!loginToken){
        //     console.log("WebSocket未登录.");
        //     return;
        // }
        // 授权
        let authorizeInfo = {
            type: 1,
            token: loginToken
        };
        console.log("发送认证消息:", authorizeInfo)
        uni.sendSocketMessage({
            data: JSON.stringify(authorizeInfo)
        });
    })

    uni.onSocketMessage((res) => {
        console.log("接收到WebSocket消息:", res.data);
        let sendInfo = JSON.parse(res.data)
        if (sendInfo.type === WebsocketResponseType.LOGIN_AUTHORIZE_SUCCESS) {
            isAuthorize = true;//授权成功
            heartCheck.start();
            console.log('WebSocket授权成功')
            connectCallBack && connectCallBack();
        } else if (sendInfo.type === 3) {
            // 重新开启心跳定时
            heartCheck.reset();
        } else if (sendInfo.type === WebsocketResponseType.INVALIDATE_TOKEN) {
            console.log("login-token 已过期", loginToken);
            isAuthorize = false;
            close(4001); // 关闭连接
            uni.reLaunch({
                url: "/pages/login/login"
            }); // 跳转到登录页面
        } else {
            // 其他消息转发出去
            console.log("接收到消息", sendInfo);
            messageCallBack && messageCallBack(sendInfo.type, sendInfo.data)
        }
    })

    uni.onSocketClose((res) => {
        isConnect = false;
        isAuthorize = false;
        console.log('websocket socket close')
        closeCallBack && closeCallBack(res);
    })

    uni.onSocketError((e) => {
        isConnect = false;
        isAuthorize = false;
        console.log("websocket socket error", e)
        // APP 应用切出超过一定时间(约1分钟)会触发报错，此处回调给应用进行重连
        closeCallBack && closeCallBack({code: 1006});
    })
};

let connect = (url, token) => {
    websocketUrl = url;
    loginToken = token;
    if (isConnect) {
        return;
    }
    console.log("websocket connect url:", websocketUrl);
    lastConnectTime = new Date();
    uni.connectSocket({
        url: websocketUrl, success: (res) => {
            console.log("websocket连接成功");
        }, fail: (e) => {
            console.log("websocket连接失败，10s后重连", e);
            setTimeout(() => {
                connect(websocketUrl, loginToken);
            }, 10000)
        }
    });
}

//定义重连函数
let reconnect = (websocketUrl, accessToken) => {
    console.log("尝试重新连接");
    if (isConnect) {
        //如果已经连上或已经在重连就不在重连了
        return;
    }
    // 延迟10秒重连  避免过多次过频繁请求重连
    let timeDiff = new Date().getTime() - lastConnectTime.getTime()
    let delay = timeDiff < 10000 ? 10000 - timeDiff : 0;
    rec && clearTimeout(rec);
    rec = setTimeout(function () {
        connect(websocketUrl, accessToken);
    }, delay);
};

//设置关闭连接
let close = (code) => {
    if (!isConnect) {
        return;
    }
    uni.closeSocket({
        code: code, complete: (res) => {
            console.log("关闭websocket连接");
            isConnect = false;
        }, fail: (e) => {
            console.log("关闭websocket连接失败", e);
        }
    });
};


//心跳设置
var heartCheck = {
    timeout: 30000, //每段时间发送一次心跳包 这里设置为30s
    timeoutObj: null, //延时发送消息对象（启动心跳新建这个对象，收到消息后重置对象）
    start: function () {
        if (isConnect) {
            console.log('发送WebSocket心跳')
            let heartBeat = {
                type: 3, data: {}
            };
            uni.sendSocketMessage({
                data: JSON.stringify(heartBeat), fail(res) {
                    console.log(res);
                }
            })
        }
        this.reset(); // 确保定时任务持续运行
    }, reset: function () {
        clearTimeout(this.timeoutObj);
        this.timeoutObj = setTimeout(function () {
            heartCheck.start();
        }, this.timeout);
    }

}

// 实际调用的方法
function sendMessage(agentData) {
    uni.sendSocketMessage({
        data: agentData
    })
}

let onConnect = (callback) => {
    connectCallBack = callback;
}


function onMessage(callback) {
    messageCallBack = callback;
}


function onClose(callback) {
    closeCallBack = callback;
}


// 将方法暴露出去
export {
    init, connect, reconnect, close, sendMessage, onConnect, onMessage, onClose
}