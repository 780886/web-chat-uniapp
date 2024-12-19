export function getLoginToken() {
    return uni.getStorageSync('login-token');
}

export function setLoginToken(loginToken) {
    uni.setStorageSync('login-token', loginToken); // 设置 token
}

export function clearLoginToken() {
    uni.removeStorageSync('login-token'); // 移除 token
}

export function getLoginUser() {
    return uni.getStorageSync('loginUser');
}

export function setLoginUser(loginUser) {
    uni.setStorageSync('loginUser', loginUser);
}

export function clearLoginUser() {
    uni.removeStorageSync('loginUser');
}

export function clearAll() {
    clearLoginToken();
    clearLoginUser();
}
