let defaultAvatar = '/static/yonghutouxiang.png'; // 默认头像的 URL
// 获取头像的封装函数
export function getAvatar(avatarUrl) {
    // if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '' || avatarUrl.trim() === "''") {
    if (!avatarUrl || typeof avatarUrl !== 'string' || avatarUrl.trim() === '' || avatarUrl.trim() === "''") {
        return defaultAvatar;
    }
    // 校验 avatarUrl 是否为有效的 URLdata:image/png;base64,
    // if (!isValidUrl(avatarUrl)) {
    //     return defaultAvatar;
    // }
    // 如果头像 URL 有效，返回传入的头像 URL
    return avatarUrl;
}

function isValidUrl(url) {
    const pattern = /^(https?:\/\/)?([a-z0-9\-]+\.)+[a-z0-9]{2,6}(\/[^\s]*)?$/i;
    return pattern.test(url);
}
