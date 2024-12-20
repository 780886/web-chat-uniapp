import UNI_APP from '../.env.js'
import ClientInformation from "../common/ClientInformation";
import {clearLoginToken, getLoginToken} from "./auth";


export default function request({
                                    url,
                                    method = "GET",
                                    data = {},
                                    header = {},
                                    needAuth = true // 是否需要鉴权（默认为需要）
                                }) {
    return new Promise((resolve, reject) => {
        const deviceId = ClientInformation.getDeviceId();
        console.log("设备ID:", deviceId);

        const defaultHeaders = {
            "DEVICE-ID": deviceId, // 自定义设备头部
            "Content-Type": "application/json", // 默认 Content-Type
        };


        // 如果需要鉴权，获取 token 并加到请求头
        if (needAuth) {
            const loginToken = getLoginToken()
            if (loginToken) {
                defaultHeaders['login-token'] = `${loginToken}`;
            } else {
                // 如果没有 token，可以进行相应处理，比如跳转到登录页面
                uni.showToast({
                    title: '请先登录',
                    icon: 'none',
                });
                uni.reLaunch({
                    url: '/pages/login/login', // 跳转到登录页面
                });
                reject(new Error('请先登录'));
                return; // 结束请求
            }
        }
        console.log("defaultHeaders",defaultHeaders);

        // 如果是 GET 请求，拼接查询参数到 URL
        if (method.toUpperCase() === "GET" && Object.keys(data).length) {
            const queryString = Object.keys(data)
                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                .join("&");
            url = `${url}?${queryString}`;
        }

        // 合并默认头部和用户自定义头部
        const finalHeaders = { ...defaultHeaders, ...header };
        url = UNI_APP.BASE_URL + url;

        console.log("请求URL:", UNI_APP.BASE_URL + url);
        console.log("请求头:", finalHeaders);

        // // 如果需要显示 loading 提示
        // if (showLoading) {
        //     uni.showLoading({
        //         title: '加载中...',
        //     });
        // }

        // 发起请求
        uni.request({
            url,
            method,
            data: method.toUpperCase() === "GET" ? null : data, // GET 请求不需要在 body 中传递数据
            header: finalHeaders,
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data); // 请求成功返回数据
                } else {
                    // 处理 token 过期或其他错误
                    if (res.statusCode === 401 || res.statusCode === 403) {
                        uni.showToast({
                            title: '登录信息已过期，请重新登录',
                            icon: 'none',
                        });
                        clearLoginToken(); // 清除 token
                        uni.reLaunch({
                            url: '/pages/login/login', // 跳转到登录页面
                        });
                        reject(new Error('会话过期'));
                    } else {
                        // 请求失败处理
                        uni.showToast({
                            title: res.data.message || "请求失败",
                            icon: "none",
                        });
                        reject(res);
                    }
                }
            },
            fail: (err) => {
                // uni.hideLoading();
                // 全局错误处理
                uni.showToast({
                    title: "网络请求失败",
                    icon: "none",
                });
                reject(err);
            },
            // complete: () => {
            //     uni.hideLoading();
            // }
        });
    });
}