// utils/validation.js

// 正则表达式常量
export const USER_NAME_REGEX = /^[A-Za-z0-9_]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

/**
 * 校验用户名
 * @param userName
 * @returns {boolean}
 */
export function validateUserName(userName){
    return USER_NAME_REGEX.test(userName);
}

/**
 * 校验邮箱
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否是合法的邮箱地址
 */
export function validateEmail(email) {
    return EMAIL_REGEX.test(email);
}

/**
 * 校验密码
 * @param {string} password - 密码
 * @returns {boolean} 是否是合法的密码
 */
export function validatePassword(password) {
    return PASSWORD_REGEX.test(password);
}
