
export default class ClientInformation {
    static getDeviceId() {
        let deviceId = '';

        try {
            // 获取系统信息
            const systemInfo = uni.getSystemInfoSync();

            // 尝试从系统信息中获取 deviceId
            if (systemInfo.deviceId) {
                deviceId = String(systemInfo.deviceId);  // 如果存在直接使用
            } else {
                // 如果没有 deviceId, 使用其他字段拼接一个唯一的设备标识符
                deviceId = `${systemInfo.brand}-${systemInfo.model}-${systemInfo.system}-${systemInfo.platform}`;
            }
            console.log("device:",deviceId);

            // 返回设备ID
			deviceId = "222.190.110.195";//测试
            return deviceId;
        } catch (error) {
            console.error('获取 deviceId 时出错:', error);
            return '';  // 出现错误时返回空字符串
        }
    }
}
