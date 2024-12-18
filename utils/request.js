import UNI_APP from '../.env.js'
import ClientInformation from "../common/ClientInformation";


export default function request({
                                    url,
                                    method = "GET",
                                    data = {},
                                    header = {}
                                }) {
    return new Promise((resolve, reject) => {
        // 设置默认的 DEVICE_ID
        // const deviceId = "127.0.0.1"; // 可替换为动态获取逻辑
        // const res = uni.getSystemInfoSync();
        // // const deviceId2 = `${res.brand}-${res.model}-${res.system}-${res.platform}`;
        // const deviceId = String(res.deviceId);
        const deviceId = ClientInformation.getDeviceId();
        console.log("设备ID:", deviceId);
        const defaultHeaders = {
            "DEVICE-ID": deviceId, // 自定义设备头部
            "Content-Type": "application/json", // 默认 Content-Type
        };
        console.log("defaultHeaders:", defaultHeaders);
        // 如果是 GET 请求，拼接查询参数到 URL
        if (method.toUpperCase() === "GET" && Object.keys(data).length) {
            const queryString = Object.keys(data)
                .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
                .join("&");
            url = `${url}?${queryString}`;
        }

        console.log("head:" + header)
        url = UNI_APP.BASE_URL + url;
        console.log("url:", url);
        // 发起请求
        uni.request({
            url,
            method,
            data: method.toUpperCase() === "GET" ? null : data, // GET 请求不需要在 body 中传递数据
            header: {
                ...defaultHeaders, // 合并默认头部
                ...header, // 用户自定义头部优先
            },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data); // 请求成功返回数据
                } else {
                    // 全局错误提示
                    uni.showToast({
                        title: res.data.message || "请求失败",
                        icon: "none",
                    });
                    reject(res);
                }
            },
            fail: (err) => {
                // 全局错误处理
                uni.showToast({
                    title: "网络请求失败",
                    icon: "none",
                });
                reject(err);
            },
        });
    });
}