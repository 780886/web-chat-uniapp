if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global2 = uni.requireGlobal();
  ArrayBuffer = global2.ArrayBuffer;
  Int8Array = global2.Int8Array;
  Uint8Array = global2.Uint8Array;
  Uint8ClampedArray = global2.Uint8ClampedArray;
  Int16Array = global2.Int16Array;
  Uint16Array = global2.Uint16Array;
  Int32Array = global2.Int32Array;
  Uint32Array = global2.Uint32Array;
  Float32Array = global2.Float32Array;
  Float64Array = global2.Float64Array;
  BigInt64Array = global2.BigInt64Array;
  BigUint64Array = global2.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const UNI_APP = {};
  {
    UNI_APP.BASE_URL = "http://192.168.0.109:8966";
    UNI_APP.WS_URL = "ws://192.168.0.109:8090";
  }
  function request({
    url,
    method = "GET",
    data = {},
    header = {}
  }) {
    return new Promise((resolve, reject) => {
      const res = uni.getSystemInfoSync();
      const deviceId = String(res.deviceId);
      formatAppLog("log", "at utils/request.js:16", "设备信息：", res);
      formatAppLog("log", "at utils/request.js:17", "设备ID:", res.deviceId);
      const defaultHeaders = {
        "DEVICE_ID": deviceId,
        // 自定义设备头部
        "Content-Type": "application/json"
        // 默认 Content-Type
      };
      if (method.toUpperCase() === "GET" && Object.keys(data).length) {
        const queryString = Object.keys(data).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`).join("&");
        url = `${url}?${queryString}`;
      }
      formatAppLog("log", "at utils/request.js:30", "head:" + header);
      url = UNI_APP.BASE_URL + url;
      formatAppLog("log", "at utils/request.js:32", "url:", url);
      uni.request({
        url,
        method,
        data: method.toUpperCase() === "GET" ? null : data,
        // GET 请求不需要在 body 中传递数据
        header: {
          ...defaultHeaders,
          // 合并默认头部
          ...header
          // 用户自定义头部优先
        },
        success: (res2) => {
          if (res2.statusCode === 200) {
            resolve(res2.data);
          } else {
            uni.showToast({
              title: res2.data.message || "请求失败",
              icon: "none"
            });
            reject(res2);
          }
        },
        fail: (err) => {
          uni.showToast({
            title: "网络请求失败",
            icon: "none"
          });
          reject(err);
        }
      });
    });
  }
  let wsurl = "";
  let loginToken = "";
  let messageCallBack = null;
  let closeCallBack = null;
  let connectCallBack = null;
  let isConnect = false;
  let rec = null;
  let isInit = false;
  let lastConnectTime = /* @__PURE__ */ new Date();
  let init = () => {
    if (isInit) {
      return;
    }
    isInit = true;
    uni.onSocketOpen((res) => {
      formatAppLog("log", "at common/websocket.js:18", "WebSocket连接已打开");
      isConnect = true;
      let authorizeInfo = {
        type: 1,
        token: loginToken
      };
      formatAppLog("log", "at common/websocket.js:25", "authorizeInfo===========", authorizeInfo);
      uni.sendSocketMessage({
        data: JSON.stringify(authorizeInfo)
      });
    });
    uni.onSocketMessage((res) => {
      let sendInfo = JSON.parse(res.data);
      if (sendInfo.type == 1) {
        heartCheck.start();
        connectCallBack && connectCallBack();
        formatAppLog("log", "at common/websocket.js:36", "WebSocket授权成功");
      } else if (sendInfo.type == 3) {
        heartCheck.reset();
      } else {
        formatAppLog("log", "at common/websocket.js:42", "接收到消息", sendInfo);
        messageCallBack && messageCallBack(sendInfo.type, sendInfo.data);
      }
    });
    uni.onSocketClose((res) => {
      formatAppLog("log", "at common/websocket.js:48", "WebSocket连接关闭");
      isConnect = false;
      closeCallBack && closeCallBack(res);
    });
    uni.onSocketError((e) => {
      formatAppLog("log", "at common/websocket.js:54", e);
      isConnect = false;
      closeCallBack && closeCallBack({ code: 1006 });
    });
  };
  let connect = (url, token) => {
    wsurl = url;
    formatAppLog("log", "at common/websocket.js:63", "wsurl====>>>>>", wsurl);
    loginToken = token;
    if (isConnect) {
      return;
    }
    lastConnectTime = /* @__PURE__ */ new Date();
    uni.connectSocket({
      url: wsurl,
      success: (res) => {
        formatAppLog("log", "at common/websocket.js:71", "websocket连接成功");
      },
      fail: (e) => {
        formatAppLog("log", "at common/websocket.js:73", e);
        formatAppLog("log", "at common/websocket.js:74", "websocket连接失败，10s后重连");
        setTimeout(() => {
          connect();
        }, 1e4);
      }
    });
  };
  let reconnect = (wsurl2, accessToken) => {
    formatAppLog("log", "at common/websocket.js:84", "尝试重新连接");
    if (isConnect) {
      return;
    }
    let timeDiff = (/* @__PURE__ */ new Date()).getTime() - lastConnectTime.getTime();
    let delay = timeDiff < 1e4 ? 1e4 - timeDiff : 0;
    rec && clearTimeout(rec);
    rec = setTimeout(function() {
      connect(wsurl2, accessToken);
    }, delay);
  };
  let close = (code) => {
    if (!isConnect) {
      return;
    }
    uni.closeSocket({
      code,
      complete: (res) => {
        formatAppLog("log", "at common/websocket.js:105", "关闭websocket连接");
        isConnect = false;
      },
      fail: (e) => {
        formatAppLog("log", "at common/websocket.js:108", "关闭websocket连接失败", e);
      }
    });
  };
  var heartCheck = {
    timeout: 1e4,
    //每段时间发送一次心跳包 这里设置为30s
    timeoutObj: null,
    //延时发送消息对象（启动心跳新建这个对象，收到消息后重置对象）
    start: function() {
      if (isConnect) {
        formatAppLog("log", "at common/websocket.js:120", "发送WebSocket心跳");
        let heartBeat = {
          type: 3,
          data: {}
        };
        uni.sendSocketMessage({
          data: JSON.stringify(heartBeat),
          fail(res) {
            formatAppLog("log", "at common/websocket.js:126", res);
          }
        });
      }
    },
    reset: function() {
      clearTimeout(this.timeoutObj);
      this.timeoutObj = setTimeout(function() {
        heartCheck.start();
      }, this.timeout);
    }
  };
  let onConnect = (callback) => {
    connectCallBack = callback;
  };
  function onMessage(callback) {
    messageCallBack = callback;
  }
  function onClose(callback) {
    closeCallBack = callback;
  }
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$a = {
    data() {
      return {
        userName: "",
        // 用户名
        emailError: false,
        passwordError: false,
        password: "",
        // 密码
        captcha: "1",
        // 验证码
        remember: false,
        // 记住我
        redirectUrl: "http://jvks.si/ucut"
        // 重定向地址
      };
    },
    mounted() {
    },
    methods: {
      // 验证邮箱格式
      validateEmail(userName) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(userName);
      },
      validatePassword(password) {
        return password.length >= 6;
      },
      // 发送验证码
      sendVerificationCode() {
        if (this.userName === "") {
          uni.showToast({
            title: "请输入邮箱地址",
            icon: "none"
          });
          return;
        }
        if (this.validateEmail(this.userName)) {
          formatAppLog("log", "at pages/login/login.vue:85", this.validateEmail(this.userName));
          uni.showToast({
            title: "邮箱格式不正确",
            icon: "none"
          });
          return;
        }
        uni.showToast({
          title: "验证码已发送",
          icon: "success"
        });
      },
      // // 倒计时功能
      // countdownTimer() {
      // 	const timer = setInterval(() => {
      // 		if (this.countdown <= 1) {
      // 			clearInterval(timer);
      // 			this.countdown = 60;
      // 			this.codeSent = false;
      // 		} else {
      // 			this.countdown--;
      // 		}
      // 	}, 1000);
      // },
      async login() {
        if (this.userName === "" || this.verificationCode === "") {
          uni.showToast({
            title: "请填写完整信息",
            icon: "none"
          });
          return;
        }
        if (!this.validateEmail(this.userName)) {
          formatAppLog("log", "at pages/login/login.vue:120", this.validateEmail(this.userName));
          uni.showToast({
            title: "邮箱格式不正确",
            icon: "none"
          });
          return;
        }
        const body = {
          userName: this.userName,
          password: this.password,
          remember: this.remember,
          captcha: this.captcha,
          redirectUrl: this.redirectUrl
        };
        try {
          const res = await request({
            url: "/authenticate/login",
            // 替换为实际接口地址
            method: "POST",
            data: body
          });
          formatAppLog("log", "at pages/login/login.vue:146", "响应结果：", res);
          if (res.code === "0") {
            uni.setStorageSync("loginUser", res.data.loginUser);
            uni.setStorageSync("login-token", res.data.token);
            formatAppLog("log", "at pages/login/login.vue:152", "用户信息已存储");
            uni.showToast({
              title: "登录成功",
              icon: "success"
            });
            setTimeout(() => {
              uni.navigateTo({
                url: "/pages/conversation/conversation"
                // 登录成功后的页面
              });
            }, 3);
          } else {
            uni.showToast({
              title: res.message,
              icon: "none"
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/login/login.vue:170", "登录请求错误:", error);
          uni.showToast({
            // title: "登录失败，请重试"+error,
            title: error,
            icon: "none"
          });
        }
      }
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "container" }, [
      vue.createCommentVNode(" 页面标题 "),
      vue.createElementVNode("div", { class: "title" }, "欢迎登录"),
      vue.createCommentVNode('		<div class="subtitle">未注册的邮箱验证通过后将自动注册</div>'),
      vue.createCommentVNode(" 输入邮箱 "),
      vue.createElementVNode("div", { class: "input-group" }, [
        vue.createElementVNode("div", { class: "icon" }, [
          vue.createElementVNode("i", { class: "iconfont" }, ""),
          vue.createCommentVNode(" 这里使用iconfont图标 ")
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "input",
            type: "email",
            placeholder: "用户名/邮箱",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.userName = $event),
            onBlur: _cache[1] || (_cache[1] = (...args) => $options.validateEmail && $options.validateEmail(...args))
          },
          null,
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ), [
          [vue.vModelText, $data.userName]
        ]),
        $data.emailError ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: "error"
        }, "邮箱地址格式不正确")) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createElementVNode("div", { class: "input-group" }, [
        vue.createElementVNode("div", { class: "icon" }, [
          vue.createElementVNode("i", { class: "iconfont" }, ""),
          vue.createCommentVNode(" 这里使用iconfont图标 ")
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "input",
            type: "password",
            placeholder: "密码",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.password = $event),
            onBlur: _cache[3] || (_cache[3] = (...args) => $options.validatePassword && $options.validatePassword(...args))
          },
          null,
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ), [
          [vue.vModelText, $data.password]
        ]),
        $data.passwordError ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: "error"
        }, "密码格式不正确")) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 输入验证码 "),
      vue.createCommentVNode('    <div class="input-group">'),
      vue.createCommentVNode('      <div class="code-container">'),
      vue.createCommentVNode('        <input class="input code-input" type="text" placeholder="请输入验证码" v-model="captcha"/>'),
      vue.createCommentVNode(' <button class="get-code" @click="sendVerificationCode" :disabled="codeSent">\r\n          {{ codeSent ? `${countdown}s后重新获取` : \'获取验证码\' }}\r\n        </button> '),
      vue.createCommentVNode('        <button class="get-code" @click="sendVerificationCode">'),
      vue.createCommentVNode("          {{ '获取验证码' }}"),
      vue.createCommentVNode("        </button>"),
      vue.createCommentVNode("      </div>"),
      vue.createCommentVNode("    </div>"),
      vue.createCommentVNode(" 登录按钮 "),
      vue.createElementVNode("button", {
        class: "login-btn",
        onClick: _cache[4] || (_cache[4] = (...args) => $options.login && $options.login(...args))
      }, "登录"),
      vue.createElementVNode("div", { class: "register-link" }, [
        vue.createElementVNode("navigator", { url: "/pages/register/register" }, " 没有账号，前往注册 ")
      ])
    ]);
  }
  const PagesLoginLogin = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/login/login.vue"]]);
  const USER_NAME_REGEX = /^[A-Za-z0-9_]+$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  function validateUserName(userName) {
    return USER_NAME_REGEX.test(userName);
  }
  function validateEmail(email) {
    return EMAIL_REGEX.test(email);
  }
  function validatePassword(password) {
    return PASSWORD_REGEX.test(password);
  }
  const _sfc_main$9 = {
    data() {
      return {
        userName: "",
        email: "",
        password: "",
        confirmPassword: "",
        captcha: "",
        captchaImage: "",
        emailError: false,
        passwordMismatch: false
      };
    },
    mounted() {
      this.refreshCaptcha();
    },
    methods: {
      // 验证邮箱格式
      validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.emailError = !emailRegex.test(this.email);
      },
      // 刷新验证码
      async refreshCaptcha() {
        this.captchaImage = UNI_APP.BASE_URL + `/validate-code?t=${Date.now()}`;
      },
      // 注册
      async register() {
        if (!this.userName) {
          return uni.showToast({
            title: "请输入用户名",
            icon: "none"
          });
        }
        if (!this.email) {
          return uni.showToast({
            title: "请输入邮箱",
            icon: "none"
          });
        }
        if (!this.password) {
          return uni.showToast({
            title: "请输入密码",
            icon: "none"
          });
        }
        if (!this.confirmPassword) {
          return uni.showToast({
            title: "请输入确认密码",
            icon: "none"
          });
        }
        if (!this.captcha) {
          return uni.showToast({
            title: "请输入验证码",
            icon: "none"
          });
        }
        validateUserName(this.userName);
        validateEmail(this.email);
        validatePassword(this.password);
        validatePassword(this.confirmPassword);
        this.passwordMismatch = this.password !== this.confirmPassword;
        try {
          const body = {
            userName: this.userName,
            email: this.email,
            password: this.password,
            confirmPassword: this.confirmPassword,
            channel: null,
            captcha: this.captcha
          };
          const res = await request({
            url: "/authenticate/email-register",
            // 替换为实际注册接口地址
            method: "POST",
            data: body
          });
          formatAppLog("log", "at pages/register/register.vue:139", "响应结果：", res);
          if (res.code === "0") {
            uni.showToast({
              title: "注册成功",
              icon: "success"
            });
            uni.navigateTo({
              url: "/pages/login/login"
            });
          } else {
            uni.showToast({
              title: res.message || "注册失败",
              icon: "none"
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/register/register.vue:155", "注册请求错误:", error);
          uni.showToast({
            title: "注册失败，请重试",
            icon: "none"
          });
        }
      }
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "container" }, [
      vue.createCommentVNode(" 页面标题 "),
      vue.createElementVNode("div", { class: "title" }, "欢迎注册"),
      vue.createCommentVNode(" 输入用户名 "),
      vue.createElementVNode("div", { class: "input-group" }, [
        vue.createElementVNode("div", { class: "icon" }, [
          vue.createElementVNode("i", { class: "iconfont" }, "")
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "input",
            type: "text",
            placeholder: "用户名",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.userName = $event)
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.userName]
        ])
      ]),
      vue.createCommentVNode(" 输入邮箱 "),
      vue.createElementVNode("div", { class: "input-group" }, [
        vue.createElementVNode("div", { class: "icon" }, [
          vue.createElementVNode("i", { class: "iconfont" }, "")
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "input",
            type: "email",
            placeholder: "邮箱",
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.email = $event),
            onBlur: _cache[2] || (_cache[2] = (...args) => $options.validateEmail && $options.validateEmail(...args))
          },
          null,
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ), [
          [vue.vModelText, $data.email]
        ]),
        $data.emailError ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: "error"
        }, "邮箱地址格式不正确")) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 输入密码 "),
      vue.createElementVNode("div", { class: "input-group" }, [
        vue.createElementVNode("div", { class: "icon" }, [
          vue.createElementVNode("i", { class: "iconfont" }, "")
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "input",
            type: "password",
            placeholder: "密码",
            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.password = $event)
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.password]
        ])
      ]),
      vue.createCommentVNode(" 确认密码 "),
      vue.createElementVNode("div", { class: "input-group" }, [
        vue.createElementVNode("div", { class: "icon" }, [
          vue.createElementVNode("i", { class: "iconfont" }, "")
        ]),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "input",
            type: "password",
            placeholder: "确认密码",
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.confirmPassword = $event)
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.confirmPassword]
        ]),
        $data.passwordMismatch ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: "error"
        }, "两次输入的密码不一致")) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createCommentVNode(" 验证码 "),
      vue.createElementVNode("div", { class: "input-group" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            class: "input code-input",
            type: "text",
            placeholder: "请输入验证码",
            "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $data.captcha = $event)
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.captcha]
        ]),
        vue.createElementVNode("img", {
          src: $data.captchaImage,
          alt: "验证码",
          class: "captcha-image",
          onClick: _cache[6] || (_cache[6] = (...args) => $options.refreshCaptcha && $options.refreshCaptcha(...args))
        }, null, 8, ["src"])
      ]),
      vue.createCommentVNode(" 注册按钮 "),
      vue.createElementVNode("button", {
        class: "login-btn",
        onClick: _cache[7] || (_cache[7] = (...args) => $options.register && $options.register(...args))
      }, "注册"),
      vue.createElementVNode("div", { class: "login-link" }, [
        vue.createElementVNode("navigator", { url: "/pages/login/login" }, " 已有账号，前往登录 ")
      ])
    ]);
  }
  const PagesRegisterRegister = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/register/register.vue"]]);
  const _sfc_main$8 = {
    data() {
      return {
        body: {
          userName: "",
          email: "",
          password: "",
          confirmPassword: "",
          captcha: "",
          channel: "web",
          agree: false
        }
      };
    },
    methods: {
      // 注册方法
      async register() {
        if (!this.body.userName || !this.body.email || !this.body.password || !this.body.confirmPassword) {
          return uni.showToast({
            title: "请填写完整信息",
            icon: "none"
          });
        }
        validateEmail(this.body.userName);
        validatePassword(this.body.password);
        validatePassword(this.body.confirmPassword);
        if (this.body.password !== this.body.confirmPassword) {
          return uni.showToast({
            title: "两次密码输入不一致",
            icon: "none"
          });
        }
        if (!this.body.agree) {
          return uni.showToast({
            title: "请先同意用户协议和隐私政策",
            icon: "none"
          });
        }
        formatAppLog("log", "at pages/register/register-1.vue:138", "请求体数据：", this.body);
        try {
          const res = await request({
            url: "/api/authenticate/email-register",
            // 替换为实际接口地址
            method: "POST",
            data: this.body
          });
          formatAppLog("log", "at pages/register/register-1.vue:148", "响应结果：", res);
          if (res.code === "0") {
            uni.showToast({
              title: "注册成功",
              icon: "success"
            });
            uni.navigateTo({
              url: "/pages/login/login"
            });
          } else {
            uni.showToast({
              title: res.data.message || "注册失败",
              icon: "none"
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/register/register-1.vue:165", "注册失败:", error);
          uni.showToast({
            title: "注册失败",
            icon: "none"
          });
        }
      },
      async getCaptcha() {
      },
      // 返回登录页面
      goToLogin() {
        uni.navigateTo({
          url: "/pages/login/login"
        });
      }
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "container" }, [
      vue.createCommentVNode(" 标题 "),
      vue.createElementVNode("div", { class: "header" }, "欢迎注册"),
      vue.createCommentVNode(" 用户名 "),
      vue.createElementVNode("div", { class: "form-item" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "text",
            placeholder: "用户名",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.body.userName = $event),
            class: "input"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.body.userName]
        ])
      ]),
      vue.createCommentVNode(" 邮箱 "),
      vue.createElementVNode("div", { class: "form-item" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "email",
            placeholder: "邮箱",
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $data.body.email = $event),
            class: "input"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.body.email]
        ])
      ]),
      vue.createCommentVNode(" 验证码 "),
      vue.createCommentVNode('    <div class="form-item verification">'),
      vue.createCommentVNode("      <input"),
      vue.createCommentVNode('          type="text"'),
      vue.createCommentVNode('          placeholder="验证码"'),
      vue.createCommentVNode('          v-model="body.captcha"'),
      vue.createCommentVNode('          class="input captcha-input"'),
      vue.createCommentVNode("      />"),
      vue.createCommentVNode('      <button class="captcha-btn" @click="getCaptcha" :disabled="isCaptchaLoading">'),
      vue.createCommentVNode('        {{ isCaptchaLoading ? "发送中..." : "获取验证码" }}'),
      vue.createCommentVNode("      </button>"),
      vue.createCommentVNode("    </div>"),
      vue.createCommentVNode(" 密码 "),
      vue.createElementVNode("div", { class: "form-item" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "password",
            placeholder: "密码",
            "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $data.body.password = $event),
            class: "input"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.body.password]
        ])
      ]),
      vue.createCommentVNode(" 确认密码 "),
      vue.createElementVNode("div", { class: "form-item" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "password",
            placeholder: "确认密码",
            "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $data.body.confirmPassword = $event),
            class: "input"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelText, $data.body.confirmPassword]
        ])
      ]),
      vue.createCommentVNode(" 用户协议 "),
      vue.createElementVNode("div", { class: "form-item" }, [
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "checkbox",
            id: "agreement",
            "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $data.body.agree = $event),
            class: "checkbox"
          },
          null,
          512
          /* NEED_PATCH */
        ), [
          [vue.vModelCheckbox, $data.body.agree]
        ]),
        vue.createElementVNode("label", {
          for: "agreement",
          class: "agreement-text"
        }, [
          vue.createTextVNode(" 我已阅读并同意 "),
          vue.createElementVNode("a", {
            href: "/pages/agreement/user",
            class: "link"
          }, "《用户协议》"),
          vue.createTextVNode(" 和 "),
          vue.createElementVNode("a", {
            href: "/pages/agreement/privacy",
            class: "link"
          }, "《隐私政策》")
        ])
      ]),
      vue.createCommentVNode(" 注册按钮 "),
      vue.createElementVNode("div", { class: "form-item" }, [
        vue.createElementVNode("button", {
          class: "btn",
          onClick: _cache[5] || (_cache[5] = (...args) => $options.register && $options.register(...args))
        }, "注册并登录")
      ]),
      vue.createCommentVNode(" 返回登录页面 "),
      vue.createElementVNode("div", {
        class: "back-to-login",
        onClick: _cache[6] || (_cache[6] = (...args) => $options.goToLogin && $options.goToLogin(...args))
      }, " 返回登录页面 ")
    ]);
  }
  const PagesRegisterRegister1 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/register/register-1.vue"]]);
  const _sfc_main$7 = {
    data() {
      return {
        username: "",
        // 用户名
        password: "",
        // 密码
        showPassword: false
        // 密码是否可见
      };
    },
    methods: {
      // 更新用户名
      updateUsername(e) {
        this.username = e.target.innerText;
      },
      // 清空用户名
      clearUsername() {
        this.username = "";
        this.$nextTick(() => {
          document.querySelector('.input[placeholder="用户名"]').innerText = "";
        });
      },
      // 更新密码
      updatePassword(e) {
        this.password = e.target.innerText;
      },
      // 切换密码可见性
      togglePassword() {
        this.showPassword = !this.showPassword;
        const passwordField = document.querySelector(
          '.input[placeholder="密码"]'
        );
        if (this.showPassword) {
          passwordField.style.webkitTextSecurity = "none";
        } else {
          passwordField.style.webkitTextSecurity = "disc";
        }
      },
      // 登录事件
      login() {
        if (!this.username || !this.password) {
          uni.showToast({
            title: "请输入用户名和密码",
            icon: "none"
          });
          return;
        }
        uni.showToast({
          title: "登录成功",
          icon: "success"
        });
        setTimeout(() => {
          uni.switchTab({
            url: "/pages/home/home"
          });
        }, 1e3);
      }
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "login-container" }, [
      vue.createElementVNode("div", { class: "welcome-text" }, [
        vue.createElementVNode("text", null, "欢迎登录")
      ]),
      vue.createElementVNode("div", { class: "form" }, [
        vue.createCommentVNode(" 用户名输入框 "),
        vue.createElementVNode("div", { class: "input-group" }, [
          vue.createElementVNode("div", { class: "icon user-icon" }),
          vue.createElementVNode("div", { class: "input-wrapper" }, [
            vue.createElementVNode(
              "div",
              {
                class: "input",
                contenteditable: "true",
                onInput: _cache[0] || (_cache[0] = (...args) => $options.updateUsername && $options.updateUsername(...args)),
                placeholder: "用户名"
              },
              null,
              32
              /* NEED_HYDRATION */
            )
          ]),
          $data.username ? (vue.openBlock(), vue.createElementBlock("div", {
            key: 0,
            class: "clear-icon",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.clearUsername && $options.clearUsername(...args))
          }, "✖ ")) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createCommentVNode(" 密码输入框 "),
        vue.createElementVNode("div", { class: "input-group" }, [
          vue.createElementVNode("div", { class: "icon lock-icon" }),
          vue.createElementVNode("div", { class: "input-wrapper" }, [
            vue.createElementVNode(
              "div",
              {
                class: "input",
                contenteditable: "true",
                onInput: _cache[2] || (_cache[2] = (...args) => $options.updatePassword && $options.updatePassword(...args)),
                placeholder: "密码"
              },
              null,
              32
              /* NEED_HYDRATION */
            )
          ]),
          vue.createElementVNode(
            "div",
            {
              class: "toggle-password",
              onClick: _cache[3] || (_cache[3] = (...args) => $options.togglePassword && $options.togglePassword(...args))
            },
            vue.toDisplayString($data.showPassword ? "👁️" : "🔒"),
            1
            /* TEXT */
          )
        ]),
        vue.createCommentVNode(" 登录按钮 "),
        vue.createElementVNode("div", {
          class: "login-button",
          onClick: _cache[4] || (_cache[4] = (...args) => $options.login && $options.login(...args))
        }, "登录")
      ]),
      vue.createElementVNode("div", { class: "register-link" }, [
        vue.createElementVNode("navigator", { url: "/pages/register/register" }, " 没有账号，前往注册 ")
      ])
    ]);
  }
  const PagesLoginLogin1 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/login/login-1.vue"]]);
  const _imports_0$3 = "/static/empty.png";
  const _imports_1$2 = "/static/conversation-selected.png";
  const _imports_2$2 = "/static/contact-selected.png";
  const _imports_3 = "/static/me-selected.png";
  const _sfc_main$6 = {
    data() {
      return {
        pageNo: 1,
        pageSize: 10,
        activeTab: "conversation",
        // 默认选中的 tab
        // 模拟一些聊天记录
        conversations: []
      };
    },
    //刚加载
    onLoad() {
      const loginToken2 = uni.getStorageSync("login-token");
      connect(UNI_APP.WS_URL, loginToken2);
    },
    onShow() {
      this.getConversationList();
    },
    methods: {
      // 格式化时间显示
      formatTime(time) {
        const date = new Date(time);
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
      },
      navigateTo(tab) {
        this.activeTab = tab;
        if (tab === "conversation") {
          uni.navigateTo({
            url: "/pages/conversation/conversation"
            // 登录成功后的页面
          });
        } else if (tab === "contact") {
          uni.navigateTo({
            url: "/pages/contact/contact"
            // 登录成功后的页面
          });
        } else if (tab === "my") {
          uni.navigateTo({
            url: "/pages/my/my"
            // 登录成功后的页面
          });
        }
      },
      //获取会话列表
      async getConversationList() {
        const loginToken2 = uni.getStorageSync("login-token");
        formatAppLog("log", "at pages/conversation/conversation.vue:98", "loginToken:", loginToken2);
        try {
          const res = await request({
            url: "/conversation/conversation-list",
            // 替换为实际接口地址
            method: "GET",
            data: {
              pageNo: this.pageNo,
              pageSize: this.pageSize
            },
            header: {
              // 额外的头信息
              "login-token": loginToken2,
              "ajax": true
            }
          });
          formatAppLog("log", "at pages/conversation/conversation.vue:116", "响应结果：", res);
          if (res.code === "0") {
            this.conversations = res.data.list;
          } else {
            uni.showToast({
              title: res.message || "获取会话失败",
              icon: "none"
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/conversation/conversation.vue:128", "获取会话失败:", error);
          uni.showToast({
            title: "获取会话失败，请重试",
            icon: "none"
          });
        }
      },
      navigateToChat(chat) {
        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/chat/chat?roomId=${chat.roomId}&name=${chat.name}&avatar=${chat.avatar}`
            // 通过 URL 的 query 传递参数
          });
        }, 5);
      }
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "chat-page" }, [
      vue.createCommentVNode(" 搜索栏 "),
      vue.createCommentVNode(' <div class="search-bar">\r\n      <input type="text" placeholder="请输入你要搜索的关键字" class="search-input" />\r\n    </div> '),
      vue.createCommentVNode(" 内容区域 "),
      vue.createElementVNode("div", { class: "content" }, [
        $data.conversations.length === 0 ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 0,
          class: "empty-state"
        }, [
          vue.createElementVNode("img", {
            src: _imports_0$3,
            alt: "暂无会话",
            class: "empty-image"
          }),
          vue.createElementVNode("div", { class: "empty-text" }, "暂无会话")
        ])) : (vue.openBlock(), vue.createElementBlock("div", {
          key: 1,
          class: "chat-list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($data.conversations, (conversation, index) => {
              return vue.openBlock(), vue.createElementBlock("div", {
                key: index,
                class: "chat-item",
                onClick: ($event) => $options.navigateToChat(conversation)
              }, [
                vue.createElementVNode("div", { class: "chat-avatar" }, [
                  vue.createElementVNode("img", {
                    src: conversation.avatar,
                    alt: "头像",
                    class: "avatar-img"
                  }, null, 8, ["src"])
                ]),
                vue.createElementVNode("div", { class: "chat-info" }, [
                  vue.createElementVNode(
                    "div",
                    { class: "chat-name" },
                    vue.toDisplayString(conversation.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "div",
                    { class: "chat-last-message" },
                    vue.toDisplayString(conversation.content),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "div",
                  { class: "chat-time" },
                  vue.toDisplayString($options.formatTime(conversation.lastSendTime)),
                  1
                  /* TEXT */
                ),
                vue.createCommentVNode(" 显示时间 ")
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]))
      ]),
      vue.createCommentVNode(" 底部导航栏 "),
      vue.createElementVNode("div", { class: "tab-bar" }, [
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "conversation" }]),
            onClick: _cache[0] || (_cache[0] = ($event) => $options.navigateTo("conversation"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_1$2,
              alt: "消息",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "消息")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "contact" }]),
            onClick: _cache[1] || (_cache[1] = ($event) => $options.navigateTo("contact"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_2$2,
              alt: "通讯录",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "通讯录")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "my" }]),
            onClick: _cache[2] || (_cache[2] = ($event) => $options.navigateTo("my"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_3,
              alt: "我的",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "我")
          ],
          2
          /* CLASS */
        )
      ])
    ]);
  }
  const PagesConversationConversation = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-e1536a1d"], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/conversation/conversation.vue"]]);
  var isVue2 = false;
  function set(target, key, val) {
    if (Array.isArray(target)) {
      target.length = Math.max(target.length, key);
      target.splice(key, 1, val);
      return val;
    }
    target[key] = val;
    return val;
  }
  function del(target, key) {
    if (Array.isArray(target)) {
      target.splice(key, 1);
      return;
    }
    delete target[key];
  }
  function getDevtoolsGlobalHook() {
    return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }
  function getTarget() {
    return typeof navigator !== "undefined" && typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {};
  }
  const isProxyAvailable = typeof Proxy === "function";
  const HOOK_SETUP = "devtools-plugin:setup";
  const HOOK_PLUGIN_SETTINGS_SET = "plugin:settings:set";
  let supported;
  let perf;
  function isPerformanceSupported() {
    var _a;
    if (supported !== void 0) {
      return supported;
    }
    if (typeof window !== "undefined" && window.performance) {
      supported = true;
      perf = window.performance;
    } else if (typeof global !== "undefined" && ((_a = global.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
      supported = true;
      perf = global.perf_hooks.performance;
    } else {
      supported = false;
    }
    return supported;
  }
  function now() {
    return isPerformanceSupported() ? perf.now() : Date.now();
  }
  class ApiProxy {
    constructor(plugin, hook) {
      this.target = null;
      this.targetQueue = [];
      this.onQueue = [];
      this.plugin = plugin;
      this.hook = hook;
      const defaultSettings = {};
      if (plugin.settings) {
        for (const id in plugin.settings) {
          const item = plugin.settings[id];
          defaultSettings[id] = item.defaultValue;
        }
      }
      const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
      let currentSettings = Object.assign({}, defaultSettings);
      try {
        const raw = localStorage.getItem(localSettingsSaveId);
        const data = JSON.parse(raw);
        Object.assign(currentSettings, data);
      } catch (e) {
      }
      this.fallbacks = {
        getSettings() {
          return currentSettings;
        },
        setSettings(value) {
          try {
            localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
          } catch (e) {
          }
          currentSettings = value;
        },
        now() {
          return now();
        }
      };
      if (hook) {
        hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
          if (pluginId === this.plugin.id) {
            this.fallbacks.setSettings(value);
          }
        });
      }
      this.proxiedOn = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target.on[prop];
          } else {
            return (...args) => {
              this.onQueue.push({
                method: prop,
                args
              });
            };
          }
        }
      });
      this.proxiedTarget = new Proxy({}, {
        get: (_target, prop) => {
          if (this.target) {
            return this.target[prop];
          } else if (prop === "on") {
            return this.proxiedOn;
          } else if (Object.keys(this.fallbacks).includes(prop)) {
            return (...args) => {
              this.targetQueue.push({
                method: prop,
                args,
                resolve: () => {
                }
              });
              return this.fallbacks[prop](...args);
            };
          } else {
            return (...args) => {
              return new Promise((resolve) => {
                this.targetQueue.push({
                  method: prop,
                  args,
                  resolve
                });
              });
            };
          }
        }
      });
    }
    async setRealTarget(target) {
      this.target = target;
      for (const item of this.onQueue) {
        this.target.on[item.method](...item.args);
      }
      for (const item of this.targetQueue) {
        item.resolve(await this.target[item.method](...item.args));
      }
    }
  }
  function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
    const descriptor = pluginDescriptor;
    const target = getTarget();
    const hook = getDevtoolsGlobalHook();
    const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
    if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
      hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
    } else {
      const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
      const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
      list.push({
        pluginDescriptor: descriptor,
        setupFn,
        proxy
      });
      if (proxy)
        setupFn(proxy.proxiedTarget);
    }
  }
  /*!
   * pinia v2.1.7
   * (c) 2023 Eduardo San Martin Morote
   * @license MIT
   */
  let activePinia;
  const setActivePinia = (pinia2) => activePinia = pinia2;
  const getActivePinia = () => vue.hasInjectionContext() && vue.inject(piniaSymbol) || activePinia;
  const piniaSymbol = Symbol("pinia");
  function isPlainObject(o) {
    return o && typeof o === "object" && Object.prototype.toString.call(o) === "[object Object]" && typeof o.toJSON !== "function";
  }
  var MutationType;
  (function(MutationType2) {
    MutationType2["direct"] = "direct";
    MutationType2["patchObject"] = "patch object";
    MutationType2["patchFunction"] = "patch function";
  })(MutationType || (MutationType = {}));
  const IS_CLIENT = typeof window !== "undefined";
  const USE_DEVTOOLS = IS_CLIENT;
  const _global = /* @__PURE__ */ (() => typeof window === "object" && window.window === window ? window : typeof self === "object" && self.self === self ? self : typeof global === "object" && global.global === global ? global : typeof globalThis === "object" ? globalThis : { HTMLElement: null })();
  function bom(blob, { autoBom = false } = {}) {
    if (autoBom && /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
      return new Blob([String.fromCharCode(65279), blob], { type: blob.type });
    }
    return blob;
  }
  function download(url, name, opts) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.responseType = "blob";
    xhr.onload = function() {
      saveAs(xhr.response, name, opts);
    };
    xhr.onerror = function() {
      console.error("could not download file");
    };
    xhr.send();
  }
  function corsEnabled(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("HEAD", url, false);
    try {
      xhr.send();
    } catch (e) {
    }
    return xhr.status >= 200 && xhr.status <= 299;
  }
  function click(node) {
    try {
      node.dispatchEvent(new MouseEvent("click"));
    } catch (e) {
      const evt = document.createEvent("MouseEvents");
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 80, 20, false, false, false, false, 0, null);
      node.dispatchEvent(evt);
    }
  }
  const _navigator = typeof navigator === "object" ? navigator : { userAgent: "" };
  const isMacOSWebView = /* @__PURE__ */ (() => /Macintosh/.test(_navigator.userAgent) && /AppleWebKit/.test(_navigator.userAgent) && !/Safari/.test(_navigator.userAgent))();
  const saveAs = !IS_CLIENT ? () => {
  } : (
    // Use download attribute first if possible (#193 Lumia mobile) unless this is a macOS WebView or mini program
    typeof HTMLAnchorElement !== "undefined" && "download" in HTMLAnchorElement.prototype && !isMacOSWebView ? downloadSaveAs : (
      // Use msSaveOrOpenBlob as a second approach
      "msSaveOrOpenBlob" in _navigator ? msSaveAs : (
        // Fallback to using FileReader and a popup
        fileSaverSaveAs
      )
    )
  );
  function downloadSaveAs(blob, name = "download", opts) {
    const a = document.createElement("a");
    a.download = name;
    a.rel = "noopener";
    if (typeof blob === "string") {
      a.href = blob;
      if (a.origin !== location.origin) {
        if (corsEnabled(a.href)) {
          download(blob, name, opts);
        } else {
          a.target = "_blank";
          click(a);
        }
      } else {
        click(a);
      }
    } else {
      a.href = URL.createObjectURL(blob);
      setTimeout(function() {
        URL.revokeObjectURL(a.href);
      }, 4e4);
      setTimeout(function() {
        click(a);
      }, 0);
    }
  }
  function msSaveAs(blob, name = "download", opts) {
    if (typeof blob === "string") {
      if (corsEnabled(blob)) {
        download(blob, name, opts);
      } else {
        const a = document.createElement("a");
        a.href = blob;
        a.target = "_blank";
        setTimeout(function() {
          click(a);
        });
      }
    } else {
      navigator.msSaveOrOpenBlob(bom(blob, opts), name);
    }
  }
  function fileSaverSaveAs(blob, name, opts, popup) {
    popup = popup || open("", "_blank");
    if (popup) {
      popup.document.title = popup.document.body.innerText = "downloading...";
    }
    if (typeof blob === "string")
      return download(blob, name, opts);
    const force = blob.type === "application/octet-stream";
    const isSafari = /constructor/i.test(String(_global.HTMLElement)) || "safari" in _global;
    const isChromeIOS = /CriOS\/[\d]+/.test(navigator.userAgent);
    if ((isChromeIOS || force && isSafari || isMacOSWebView) && typeof FileReader !== "undefined") {
      const reader = new FileReader();
      reader.onloadend = function() {
        let url = reader.result;
        if (typeof url !== "string") {
          popup = null;
          throw new Error("Wrong reader.result type");
        }
        url = isChromeIOS ? url : url.replace(/^data:[^;]*;/, "data:attachment/file;");
        if (popup) {
          popup.location.href = url;
        } else {
          location.assign(url);
        }
        popup = null;
      };
      reader.readAsDataURL(blob);
    } else {
      const url = URL.createObjectURL(blob);
      if (popup)
        popup.location.assign(url);
      else
        location.href = url;
      popup = null;
      setTimeout(function() {
        URL.revokeObjectURL(url);
      }, 4e4);
    }
  }
  function toastMessage(message, type) {
    const piniaMessage = "🍍 " + message;
    if (typeof __VUE_DEVTOOLS_TOAST__ === "function") {
      __VUE_DEVTOOLS_TOAST__(piniaMessage, type);
    } else if (type === "error") {
      console.error(piniaMessage);
    } else if (type === "warn") {
      console.warn(piniaMessage);
    } else {
      console.log(piniaMessage);
    }
  }
  function isPinia(o) {
    return "_a" in o && "install" in o;
  }
  function checkClipboardAccess() {
    if (!("clipboard" in navigator)) {
      toastMessage(`Your browser doesn't support the Clipboard API`, "error");
      return true;
    }
  }
  function checkNotFocusedError(error) {
    if (error instanceof Error && error.message.toLowerCase().includes("document is not focused")) {
      toastMessage('You need to activate the "Emulate a focused page" setting in the "Rendering" panel of devtools.', "warn");
      return true;
    }
    return false;
  }
  async function actionGlobalCopyState(pinia2) {
    if (checkClipboardAccess())
      return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(pinia2.state.value));
      toastMessage("Global state copied to clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to serialize the state. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalPasteState(pinia2) {
    if (checkClipboardAccess())
      return;
    try {
      loadStoresState(pinia2, JSON.parse(await navigator.clipboard.readText()));
      toastMessage("Global state pasted from clipboard.");
    } catch (error) {
      if (checkNotFocusedError(error))
        return;
      toastMessage(`Failed to deserialize the state from clipboard. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  async function actionGlobalSaveState(pinia2) {
    try {
      saveAs(new Blob([JSON.stringify(pinia2.state.value)], {
        type: "text/plain;charset=utf-8"
      }), "pinia-state.json");
    } catch (error) {
      toastMessage(`Failed to export the state as JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  let fileInput;
  function getFileOpener() {
    if (!fileInput) {
      fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
    }
    function openFile() {
      return new Promise((resolve, reject) => {
        fileInput.onchange = async () => {
          const files = fileInput.files;
          if (!files)
            return resolve(null);
          const file = files.item(0);
          if (!file)
            return resolve(null);
          return resolve({ text: await file.text(), file });
        };
        fileInput.oncancel = () => resolve(null);
        fileInput.onerror = reject;
        fileInput.click();
      });
    }
    return openFile;
  }
  async function actionGlobalOpenStateFile(pinia2) {
    try {
      const open2 = getFileOpener();
      const result = await open2();
      if (!result)
        return;
      const { text, file } = result;
      loadStoresState(pinia2, JSON.parse(text));
      toastMessage(`Global state imported from "${file.name}".`);
    } catch (error) {
      toastMessage(`Failed to import the state from JSON. Check the console for more details.`, "error");
      console.error(error);
    }
  }
  function loadStoresState(pinia2, state) {
    for (const key in state) {
      const storeState = pinia2.state.value[key];
      if (storeState) {
        Object.assign(storeState, state[key]);
      } else {
        pinia2.state.value[key] = state[key];
      }
    }
  }
  function formatDisplay(display) {
    return {
      _custom: {
        display
      }
    };
  }
  const PINIA_ROOT_LABEL = "🍍 Pinia (root)";
  const PINIA_ROOT_ID = "_root";
  function formatStoreForInspectorTree(store) {
    return isPinia(store) ? {
      id: PINIA_ROOT_ID,
      label: PINIA_ROOT_LABEL
    } : {
      id: store.$id,
      label: store.$id
    };
  }
  function formatStoreForInspectorState(store) {
    if (isPinia(store)) {
      const storeNames = Array.from(store._s.keys());
      const storeMap = store._s;
      const state2 = {
        state: storeNames.map((storeId) => ({
          editable: true,
          key: storeId,
          value: store.state.value[storeId]
        })),
        getters: storeNames.filter((id) => storeMap.get(id)._getters).map((id) => {
          const store2 = storeMap.get(id);
          return {
            editable: false,
            key: id,
            value: store2._getters.reduce((getters, key) => {
              getters[key] = store2[key];
              return getters;
            }, {})
          };
        })
      };
      return state2;
    }
    const state = {
      state: Object.keys(store.$state).map((key) => ({
        editable: true,
        key,
        value: store.$state[key]
      }))
    };
    if (store._getters && store._getters.length) {
      state.getters = store._getters.map((getterName) => ({
        editable: false,
        key: getterName,
        value: store[getterName]
      }));
    }
    if (store._customProperties.size) {
      state.customProperties = Array.from(store._customProperties).map((key) => ({
        editable: true,
        key,
        value: store[key]
      }));
    }
    return state;
  }
  function formatEventData(events) {
    if (!events)
      return {};
    if (Array.isArray(events)) {
      return events.reduce((data, event) => {
        data.keys.push(event.key);
        data.operations.push(event.type);
        data.oldValue[event.key] = event.oldValue;
        data.newValue[event.key] = event.newValue;
        return data;
      }, {
        oldValue: {},
        keys: [],
        operations: [],
        newValue: {}
      });
    } else {
      return {
        operation: formatDisplay(events.type),
        key: formatDisplay(events.key),
        oldValue: events.oldValue,
        newValue: events.newValue
      };
    }
  }
  function formatMutationType(type) {
    switch (type) {
      case MutationType.direct:
        return "mutation";
      case MutationType.patchFunction:
        return "$patch";
      case MutationType.patchObject:
        return "$patch";
      default:
        return "unknown";
    }
  }
  let isTimelineActive = true;
  const componentStateTypes = [];
  const MUTATIONS_LAYER_ID = "pinia:mutations";
  const INSPECTOR_ID = "pinia";
  const { assign: assign$1 } = Object;
  const getStoreType = (id) => "🍍 " + id;
  function registerPiniaDevtools(app, pinia2) {
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app
    }, (api) => {
      if (typeof api.now !== "function") {
        toastMessage("You seem to be using an outdated version of Vue Devtools. Are you still using the Beta release instead of the stable one? You can find the links at https://devtools.vuejs.org/guide/installation.html.");
      }
      api.addTimelineLayer({
        id: MUTATIONS_LAYER_ID,
        label: `Pinia 🍍`,
        color: 15064968
      });
      api.addInspector({
        id: INSPECTOR_ID,
        label: "Pinia 🍍",
        icon: "storage",
        treeFilterPlaceholder: "Search stores",
        actions: [
          {
            icon: "content_copy",
            action: () => {
              actionGlobalCopyState(pinia2);
            },
            tooltip: "Serialize and copy the state"
          },
          {
            icon: "content_paste",
            action: async () => {
              await actionGlobalPasteState(pinia2);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Replace the state with the content of your clipboard"
          },
          {
            icon: "save",
            action: () => {
              actionGlobalSaveState(pinia2);
            },
            tooltip: "Save the state as a JSON file"
          },
          {
            icon: "folder_open",
            action: async () => {
              await actionGlobalOpenStateFile(pinia2);
              api.sendInspectorTree(INSPECTOR_ID);
              api.sendInspectorState(INSPECTOR_ID);
            },
            tooltip: "Import the state from a JSON file"
          }
        ],
        nodeActions: [
          {
            icon: "restore",
            tooltip: 'Reset the state (with "$reset")',
            action: (nodeId) => {
              const store = pinia2._s.get(nodeId);
              if (!store) {
                toastMessage(`Cannot reset "${nodeId}" store because it wasn't found.`, "warn");
              } else if (typeof store.$reset !== "function") {
                toastMessage(`Cannot reset "${nodeId}" store because it doesn't have a "$reset" method implemented.`, "warn");
              } else {
                store.$reset();
                toastMessage(`Store "${nodeId}" reset.`);
              }
            }
          }
        ]
      });
      api.on.inspectComponent((payload, ctx) => {
        const proxy = payload.componentInstance && payload.componentInstance.proxy;
        if (proxy && proxy._pStores) {
          const piniaStores = payload.componentInstance.proxy._pStores;
          Object.values(piniaStores).forEach((store) => {
            payload.instanceData.state.push({
              type: getStoreType(store.$id),
              key: "state",
              editable: true,
              value: store._isOptionsAPI ? {
                _custom: {
                  value: vue.toRaw(store.$state),
                  actions: [
                    {
                      icon: "restore",
                      tooltip: "Reset the state of this store",
                      action: () => store.$reset()
                    }
                  ]
                }
              } : (
                // NOTE: workaround to unwrap transferred refs
                Object.keys(store.$state).reduce((state, key) => {
                  state[key] = store.$state[key];
                  return state;
                }, {})
              )
            });
            if (store._getters && store._getters.length) {
              payload.instanceData.state.push({
                type: getStoreType(store.$id),
                key: "getters",
                editable: false,
                value: store._getters.reduce((getters, key) => {
                  try {
                    getters[key] = store[key];
                  } catch (error) {
                    getters[key] = error;
                  }
                  return getters;
                }, {})
              });
            }
          });
        }
      });
      api.on.getInspectorTree((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          let stores = [pinia2];
          stores = stores.concat(Array.from(pinia2._s.values()));
          payload.rootNodes = (payload.filter ? stores.filter((store) => "$id" in store ? store.$id.toLowerCase().includes(payload.filter.toLowerCase()) : PINIA_ROOT_LABEL.toLowerCase().includes(payload.filter.toLowerCase())) : stores).map(formatStoreForInspectorTree);
        }
      });
      api.on.getInspectorState((payload) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia2 : pinia2._s.get(payload.nodeId);
          if (!inspectedStore) {
            return;
          }
          if (inspectedStore) {
            payload.state = formatStoreForInspectorState(inspectedStore);
          }
        }
      });
      api.on.editInspectorState((payload, ctx) => {
        if (payload.app === app && payload.inspectorId === INSPECTOR_ID) {
          const inspectedStore = payload.nodeId === PINIA_ROOT_ID ? pinia2 : pinia2._s.get(payload.nodeId);
          if (!inspectedStore) {
            return toastMessage(`store "${payload.nodeId}" not found`, "error");
          }
          const { path } = payload;
          if (!isPinia(inspectedStore)) {
            if (path.length !== 1 || !inspectedStore._customProperties.has(path[0]) || path[0] in inspectedStore.$state) {
              path.unshift("$state");
            }
          } else {
            path.unshift("state");
          }
          isTimelineActive = false;
          payload.set(inspectedStore, path, payload.state.value);
          isTimelineActive = true;
        }
      });
      api.on.editComponentState((payload) => {
        if (payload.type.startsWith("🍍")) {
          const storeId = payload.type.replace(/^🍍\s*/, "");
          const store = pinia2._s.get(storeId);
          if (!store) {
            return toastMessage(`store "${storeId}" not found`, "error");
          }
          const { path } = payload;
          if (path[0] !== "state") {
            return toastMessage(`Invalid path for store "${storeId}":
${path}
Only state can be modified.`);
          }
          path[0] = "$state";
          isTimelineActive = false;
          payload.set(store, path, payload.state.value);
          isTimelineActive = true;
        }
      });
    });
  }
  function addStoreToDevtools(app, store) {
    if (!componentStateTypes.includes(getStoreType(store.$id))) {
      componentStateTypes.push(getStoreType(store.$id));
    }
    setupDevtoolsPlugin({
      id: "dev.esm.pinia",
      label: "Pinia 🍍",
      logo: "https://pinia.vuejs.org/logo.svg",
      packageName: "pinia",
      homepage: "https://pinia.vuejs.org",
      componentStateTypes,
      app,
      settings: {
        logStoreChanges: {
          label: "Notify about new/deleted stores",
          type: "boolean",
          defaultValue: true
        }
        // useEmojis: {
        //   label: 'Use emojis in messages ⚡️',
        //   type: 'boolean',
        //   defaultValue: true,
        // },
      }
    }, (api) => {
      const now2 = typeof api.now === "function" ? api.now.bind(api) : Date.now;
      store.$onAction(({ after, onError, name, args }) => {
        const groupId = runningActionId++;
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🛫 " + name,
            subtitle: "start",
            data: {
              store: formatDisplay(store.$id),
              action: formatDisplay(name),
              args
            },
            groupId
          }
        });
        after((result) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              title: "🛬 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                result
              },
              groupId
            }
          });
        });
        onError((error) => {
          activeAction = void 0;
          api.addTimelineEvent({
            layerId: MUTATIONS_LAYER_ID,
            event: {
              time: now2(),
              logType: "error",
              title: "💥 " + name,
              subtitle: "end",
              data: {
                store: formatDisplay(store.$id),
                action: formatDisplay(name),
                args,
                error
              },
              groupId
            }
          });
        });
      }, true);
      store._customProperties.forEach((name) => {
        vue.watch(() => vue.unref(store[name]), (newValue, oldValue) => {
          api.notifyComponentUpdate();
          api.sendInspectorState(INSPECTOR_ID);
          if (isTimelineActive) {
            api.addTimelineEvent({
              layerId: MUTATIONS_LAYER_ID,
              event: {
                time: now2(),
                title: "Change",
                subtitle: name,
                data: {
                  newValue,
                  oldValue
                },
                groupId: activeAction
              }
            });
          }
        }, { deep: true });
      });
      store.$subscribe(({ events, type }, state) => {
        api.notifyComponentUpdate();
        api.sendInspectorState(INSPECTOR_ID);
        if (!isTimelineActive)
          return;
        const eventData = {
          time: now2(),
          title: formatMutationType(type),
          data: assign$1({ store: formatDisplay(store.$id) }, formatEventData(events)),
          groupId: activeAction
        };
        if (type === MutationType.patchFunction) {
          eventData.subtitle = "⤵️";
        } else if (type === MutationType.patchObject) {
          eventData.subtitle = "🧩";
        } else if (events && !Array.isArray(events)) {
          eventData.subtitle = events.type;
        }
        if (events) {
          eventData.data["rawEvent(s)"] = {
            _custom: {
              display: "DebuggerEvent",
              type: "object",
              tooltip: "raw DebuggerEvent[]",
              value: events
            }
          };
        }
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: eventData
        });
      }, { detached: true, flush: "sync" });
      const hotUpdate = store._hotUpdate;
      store._hotUpdate = vue.markRaw((newStore) => {
        hotUpdate(newStore);
        api.addTimelineEvent({
          layerId: MUTATIONS_LAYER_ID,
          event: {
            time: now2(),
            title: "🔥 " + store.$id,
            subtitle: "HMR update",
            data: {
              store: formatDisplay(store.$id),
              info: formatDisplay(`HMR update`)
            }
          }
        });
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
      });
      const { $dispose } = store;
      store.$dispose = () => {
        $dispose();
        api.notifyComponentUpdate();
        api.sendInspectorTree(INSPECTOR_ID);
        api.sendInspectorState(INSPECTOR_ID);
        api.getSettings().logStoreChanges && toastMessage(`Disposed "${store.$id}" store 🗑`);
      };
      api.notifyComponentUpdate();
      api.sendInspectorTree(INSPECTOR_ID);
      api.sendInspectorState(INSPECTOR_ID);
      api.getSettings().logStoreChanges && toastMessage(`"${store.$id}" store installed 🆕`);
    });
  }
  let runningActionId = 0;
  let activeAction;
  function patchActionForGrouping(store, actionNames, wrapWithProxy) {
    const actions = actionNames.reduce((storeActions, actionName) => {
      storeActions[actionName] = vue.toRaw(store)[actionName];
      return storeActions;
    }, {});
    for (const actionName in actions) {
      store[actionName] = function() {
        const _actionId = runningActionId;
        const trackedStore = wrapWithProxy ? new Proxy(store, {
          get(...args) {
            activeAction = _actionId;
            return Reflect.get(...args);
          },
          set(...args) {
            activeAction = _actionId;
            return Reflect.set(...args);
          }
        }) : store;
        activeAction = _actionId;
        const retValue = actions[actionName].apply(trackedStore, arguments);
        activeAction = void 0;
        return retValue;
      };
    }
  }
  function devtoolsPlugin({ app, store, options }) {
    if (store.$id.startsWith("__hot:")) {
      return;
    }
    store._isOptionsAPI = !!options.state;
    patchActionForGrouping(store, Object.keys(options.actions), store._isOptionsAPI);
    const originalHotUpdate = store._hotUpdate;
    vue.toRaw(store)._hotUpdate = function(newStore) {
      originalHotUpdate.apply(this, arguments);
      patchActionForGrouping(store, Object.keys(newStore._hmrPayload.actions), !!store._isOptionsAPI);
    };
    addStoreToDevtools(
      app,
      // FIXME: is there a way to allow the assignment from Store<Id, S, G, A> to StoreGeneric?
      store
    );
  }
  function createPinia() {
    const scope = vue.effectScope(true);
    const state = scope.run(() => vue.ref({}));
    let _p = [];
    let toBeInstalled = [];
    const pinia2 = vue.markRaw({
      install(app) {
        setActivePinia(pinia2);
        {
          pinia2._a = app;
          app.provide(piniaSymbol, pinia2);
          app.config.globalProperties.$pinia = pinia2;
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(app, pinia2);
          }
          toBeInstalled.forEach((plugin) => _p.push(plugin));
          toBeInstalled = [];
        }
      },
      use(plugin) {
        if (!this._a && !isVue2) {
          toBeInstalled.push(plugin);
        } else {
          _p.push(plugin);
        }
        return this;
      },
      _p,
      // it's actually undefined here
      // @ts-expect-error
      _a: null,
      _e: scope,
      _s: /* @__PURE__ */ new Map(),
      state
    });
    if (USE_DEVTOOLS && typeof Proxy !== "undefined") {
      pinia2.use(devtoolsPlugin);
    }
    return pinia2;
  }
  const isUseStore = (fn) => {
    return typeof fn === "function" && typeof fn.$id === "string";
  };
  function patchObject(newState, oldState) {
    for (const key in oldState) {
      const subPatch = oldState[key];
      if (!(key in newState)) {
        continue;
      }
      const targetValue = newState[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        newState[key] = patchObject(targetValue, subPatch);
      } else {
        {
          newState[key] = subPatch;
        }
      }
    }
    return newState;
  }
  function acceptHMRUpdate(initialUseStore, hot) {
    return (newModule) => {
      const pinia2 = hot.data.pinia || initialUseStore._pinia;
      if (!pinia2) {
        return;
      }
      hot.data.pinia = pinia2;
      for (const exportName in newModule) {
        const useStore = newModule[exportName];
        if (isUseStore(useStore) && pinia2._s.has(useStore.$id)) {
          const id = useStore.$id;
          if (id !== initialUseStore.$id) {
            console.warn(`The id of the store changed from "${initialUseStore.$id}" to "${id}". Reloading.`);
            return hot.invalidate();
          }
          const existingStore = pinia2._s.get(id);
          if (!existingStore) {
            console.log(`[Pinia]: skipping hmr because store doesn't exist yet`);
            return;
          }
          useStore(pinia2, existingStore);
        }
      }
    };
  }
  const noop = () => {
  };
  function addSubscription(subscriptions, callback, detached, onCleanup = noop) {
    subscriptions.push(callback);
    const removeSubscription = () => {
      const idx = subscriptions.indexOf(callback);
      if (idx > -1) {
        subscriptions.splice(idx, 1);
        onCleanup();
      }
    };
    if (!detached && vue.getCurrentScope()) {
      vue.onScopeDispose(removeSubscription);
    }
    return removeSubscription;
  }
  function triggerSubscriptions(subscriptions, ...args) {
    subscriptions.slice().forEach((callback) => {
      callback(...args);
    });
  }
  const fallbackRunWithContext = (fn) => fn();
  function mergeReactiveObjects(target, patchToApply) {
    if (target instanceof Map && patchToApply instanceof Map) {
      patchToApply.forEach((value, key) => target.set(key, value));
    }
    if (target instanceof Set && patchToApply instanceof Set) {
      patchToApply.forEach(target.add, target);
    }
    for (const key in patchToApply) {
      if (!patchToApply.hasOwnProperty(key))
        continue;
      const subPatch = patchToApply[key];
      const targetValue = target[key];
      if (isPlainObject(targetValue) && isPlainObject(subPatch) && target.hasOwnProperty(key) && !vue.isRef(subPatch) && !vue.isReactive(subPatch)) {
        target[key] = mergeReactiveObjects(targetValue, subPatch);
      } else {
        target[key] = subPatch;
      }
    }
    return target;
  }
  const skipHydrateSymbol = Symbol("pinia:skipHydration");
  function skipHydrate(obj) {
    return Object.defineProperty(obj, skipHydrateSymbol, {});
  }
  function shouldHydrate(obj) {
    return !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol);
  }
  const { assign } = Object;
  function isComputed(o) {
    return !!(vue.isRef(o) && o.effect);
  }
  function createOptionsStore(id, options, pinia2, hot) {
    const { state, actions, getters } = options;
    const initialState = pinia2.state.value[id];
    let store;
    function setup() {
      if (!initialState && !hot) {
        {
          pinia2.state.value[id] = state ? state() : {};
        }
      }
      const localState = hot ? (
        // use ref() to unwrap refs inside state TODO: check if this is still necessary
        vue.toRefs(vue.ref(state ? state() : {}).value)
      ) : vue.toRefs(pinia2.state.value[id]);
      return assign(localState, actions, Object.keys(getters || {}).reduce((computedGetters, name) => {
        if (name in localState) {
          console.warn(`[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`);
        }
        computedGetters[name] = vue.markRaw(vue.computed(() => {
          setActivePinia(pinia2);
          const store2 = pinia2._s.get(id);
          return getters[name].call(store2, store2);
        }));
        return computedGetters;
      }, {}));
    }
    store = createSetupStore(id, setup, options, pinia2, hot, true);
    return store;
  }
  function createSetupStore($id, setup, options = {}, pinia2, hot, isOptionsStore) {
    let scope;
    const optionsForPlugin = assign({ actions: {} }, options);
    if (!pinia2._e.active) {
      throw new Error("Pinia destroyed");
    }
    const $subscribeOptions = {
      deep: true
      // flush: 'post',
    };
    {
      $subscribeOptions.onTrigger = (event) => {
        if (isListening) {
          debuggerEvents = event;
        } else if (isListening == false && !store._hotUpdating) {
          if (Array.isArray(debuggerEvents)) {
            debuggerEvents.push(event);
          } else {
            console.error("🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.");
          }
        }
      };
    }
    let isListening;
    let isSyncListening;
    let subscriptions = [];
    let actionSubscriptions = [];
    let debuggerEvents;
    const initialState = pinia2.state.value[$id];
    if (!isOptionsStore && !initialState && !hot) {
      {
        pinia2.state.value[$id] = {};
      }
    }
    const hotState = vue.ref({});
    let activeListener;
    function $patch(partialStateOrMutator) {
      let subscriptionMutation;
      isListening = isSyncListening = false;
      {
        debuggerEvents = [];
      }
      if (typeof partialStateOrMutator === "function") {
        partialStateOrMutator(pinia2.state.value[$id]);
        subscriptionMutation = {
          type: MutationType.patchFunction,
          storeId: $id,
          events: debuggerEvents
        };
      } else {
        mergeReactiveObjects(pinia2.state.value[$id], partialStateOrMutator);
        subscriptionMutation = {
          type: MutationType.patchObject,
          payload: partialStateOrMutator,
          storeId: $id,
          events: debuggerEvents
        };
      }
      const myListenerId = activeListener = Symbol();
      vue.nextTick().then(() => {
        if (activeListener === myListenerId) {
          isListening = true;
        }
      });
      isSyncListening = true;
      triggerSubscriptions(subscriptions, subscriptionMutation, pinia2.state.value[$id]);
    }
    const $reset = isOptionsStore ? function $reset2() {
      const { state } = options;
      const newState = state ? state() : {};
      this.$patch(($state) => {
        assign($state, newState);
      });
    } : (
      /* istanbul ignore next */
      () => {
        throw new Error(`🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`);
      }
    );
    function $dispose() {
      scope.stop();
      subscriptions = [];
      actionSubscriptions = [];
      pinia2._s.delete($id);
    }
    function wrapAction(name, action) {
      return function() {
        setActivePinia(pinia2);
        const args = Array.from(arguments);
        const afterCallbackList = [];
        const onErrorCallbackList = [];
        function after(callback) {
          afterCallbackList.push(callback);
        }
        function onError(callback) {
          onErrorCallbackList.push(callback);
        }
        triggerSubscriptions(actionSubscriptions, {
          args,
          name,
          store,
          after,
          onError
        });
        let ret;
        try {
          ret = action.apply(this && this.$id === $id ? this : store, args);
        } catch (error) {
          triggerSubscriptions(onErrorCallbackList, error);
          throw error;
        }
        if (ret instanceof Promise) {
          return ret.then((value) => {
            triggerSubscriptions(afterCallbackList, value);
            return value;
          }).catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error);
            return Promise.reject(error);
          });
        }
        triggerSubscriptions(afterCallbackList, ret);
        return ret;
      };
    }
    const _hmrPayload = /* @__PURE__ */ vue.markRaw({
      actions: {},
      getters: {},
      state: [],
      hotState
    });
    const partialStore = {
      _p: pinia2,
      // _s: scope,
      $id,
      $onAction: addSubscription.bind(null, actionSubscriptions),
      $patch,
      $reset,
      $subscribe(callback, options2 = {}) {
        const removeSubscription = addSubscription(subscriptions, callback, options2.detached, () => stopWatcher());
        const stopWatcher = scope.run(() => vue.watch(() => pinia2.state.value[$id], (state) => {
          if (options2.flush === "sync" ? isSyncListening : isListening) {
            callback({
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents
            }, state);
          }
        }, assign({}, $subscribeOptions, options2)));
        return removeSubscription;
      },
      $dispose
    };
    const store = vue.reactive(assign(
      {
        _hmrPayload,
        _customProperties: vue.markRaw(/* @__PURE__ */ new Set())
        // devtools custom properties
      },
      partialStore
      // must be added later
      // setupStore
    ));
    pinia2._s.set($id, store);
    const runWithContext = pinia2._a && pinia2._a.runWithContext || fallbackRunWithContext;
    const setupStore = runWithContext(() => pinia2._e.run(() => (scope = vue.effectScope()).run(setup)));
    for (const key in setupStore) {
      const prop = setupStore[key];
      if (vue.isRef(prop) && !isComputed(prop) || vue.isReactive(prop)) {
        if (hot) {
          set(hotState.value, key, vue.toRef(setupStore, key));
        } else if (!isOptionsStore) {
          if (initialState && shouldHydrate(prop)) {
            if (vue.isRef(prop)) {
              prop.value = initialState[key];
            } else {
              mergeReactiveObjects(prop, initialState[key]);
            }
          }
          {
            pinia2.state.value[$id][key] = prop;
          }
        }
        {
          _hmrPayload.state.push(key);
        }
      } else if (typeof prop === "function") {
        const actionValue = hot ? prop : wrapAction(key, prop);
        {
          setupStore[key] = actionValue;
        }
        {
          _hmrPayload.actions[key] = prop;
        }
        optionsForPlugin.actions[key] = prop;
      } else {
        if (isComputed(prop)) {
          _hmrPayload.getters[key] = isOptionsStore ? (
            // @ts-expect-error
            options.getters[key]
          ) : prop;
          if (IS_CLIENT) {
            const getters = setupStore._getters || // @ts-expect-error: same
            (setupStore._getters = vue.markRaw([]));
            getters.push(key);
          }
        }
      }
    }
    {
      assign(store, setupStore);
      assign(vue.toRaw(store), setupStore);
    }
    Object.defineProperty(store, "$state", {
      get: () => hot ? hotState.value : pinia2.state.value[$id],
      set: (state) => {
        if (hot) {
          throw new Error("cannot set hotState");
        }
        $patch(($state) => {
          assign($state, state);
        });
      }
    });
    {
      store._hotUpdate = vue.markRaw((newStore) => {
        store._hotUpdating = true;
        newStore._hmrPayload.state.forEach((stateKey) => {
          if (stateKey in store.$state) {
            const newStateTarget = newStore.$state[stateKey];
            const oldStateSource = store.$state[stateKey];
            if (typeof newStateTarget === "object" && isPlainObject(newStateTarget) && isPlainObject(oldStateSource)) {
              patchObject(newStateTarget, oldStateSource);
            } else {
              newStore.$state[stateKey] = oldStateSource;
            }
          }
          set(store, stateKey, vue.toRef(newStore.$state, stateKey));
        });
        Object.keys(store.$state).forEach((stateKey) => {
          if (!(stateKey in newStore.$state)) {
            del(store, stateKey);
          }
        });
        isListening = false;
        isSyncListening = false;
        pinia2.state.value[$id] = vue.toRef(newStore._hmrPayload, "hotState");
        isSyncListening = true;
        vue.nextTick().then(() => {
          isListening = true;
        });
        for (const actionName in newStore._hmrPayload.actions) {
          const action = newStore[actionName];
          set(store, actionName, wrapAction(actionName, action));
        }
        for (const getterName in newStore._hmrPayload.getters) {
          const getter = newStore._hmrPayload.getters[getterName];
          const getterValue = isOptionsStore ? (
            // special handling of options api
            vue.computed(() => {
              setActivePinia(pinia2);
              return getter.call(store, store);
            })
          ) : getter;
          set(store, getterName, getterValue);
        }
        Object.keys(store._hmrPayload.getters).forEach((key) => {
          if (!(key in newStore._hmrPayload.getters)) {
            del(store, key);
          }
        });
        Object.keys(store._hmrPayload.actions).forEach((key) => {
          if (!(key in newStore._hmrPayload.actions)) {
            del(store, key);
          }
        });
        store._hmrPayload = newStore._hmrPayload;
        store._getters = newStore._getters;
        store._hotUpdating = false;
      });
    }
    if (USE_DEVTOOLS) {
      const nonEnumerable = {
        writable: true,
        configurable: true,
        // avoid warning on devtools trying to display this property
        enumerable: false
      };
      ["_p", "_hmrPayload", "_getters", "_customProperties"].forEach((p) => {
        Object.defineProperty(store, p, assign({ value: store[p] }, nonEnumerable));
      });
    }
    pinia2._p.forEach((extender) => {
      if (USE_DEVTOOLS) {
        const extensions = scope.run(() => extender({
          store,
          app: pinia2._a,
          pinia: pinia2,
          options: optionsForPlugin
        }));
        Object.keys(extensions || {}).forEach((key) => store._customProperties.add(key));
        assign(store, extensions);
      } else {
        assign(store, scope.run(() => extender({
          store,
          app: pinia2._a,
          pinia: pinia2,
          options: optionsForPlugin
        })));
      }
    });
    if (store.$state && typeof store.$state === "object" && typeof store.$state.constructor === "function" && !store.$state.constructor.toString().includes("[native code]")) {
      console.warn(`[🍍]: The "state" must be a plain object. It cannot be
	state: () => new MyClass()
Found in store "${store.$id}".`);
    }
    if (initialState && isOptionsStore && options.hydrate) {
      options.hydrate(store.$state, initialState);
    }
    isListening = true;
    isSyncListening = true;
    return store;
  }
  function defineStore(idOrOptions, setup, setupOptions) {
    let id;
    let options;
    const isSetupStore = typeof setup === "function";
    if (typeof idOrOptions === "string") {
      id = idOrOptions;
      options = isSetupStore ? setupOptions : setup;
    } else {
      options = idOrOptions;
      id = idOrOptions.id;
      if (typeof id !== "string") {
        throw new Error(`[🍍]: "defineStore()" must be passed a store id as its first argument.`);
      }
    }
    function useStore(pinia2, hot) {
      const hasContext = vue.hasInjectionContext();
      pinia2 = // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      pinia2 || (hasContext ? vue.inject(piniaSymbol, null) : null);
      if (pinia2)
        setActivePinia(pinia2);
      if (!activePinia) {
        throw new Error(`[🍍]: "getActivePinia()" was called but there was no active Pinia. Are you trying to use a store before calling "app.use(pinia)"?
See https://pinia.vuejs.org/core-concepts/outside-component-usage.html for help.
This will fail in production.`);
      }
      pinia2 = activePinia;
      if (!pinia2._s.has(id)) {
        if (isSetupStore) {
          createSetupStore(id, setup, options, pinia2);
        } else {
          createOptionsStore(id, options, pinia2);
        }
        {
          useStore._pinia = pinia2;
        }
      }
      const store = pinia2._s.get(id);
      if (hot) {
        const hotId = "__hot:" + id;
        const newStore = isSetupStore ? createSetupStore(hotId, setup, options, pinia2, true) : createOptionsStore(hotId, assign({}, options), pinia2, true);
        hot._hotUpdate(newStore);
        delete pinia2.state.value[hotId];
        pinia2._s.delete(hotId);
      }
      if (IS_CLIENT) {
        const currentInstance = vue.getCurrentInstance();
        if (currentInstance && currentInstance.proxy && // avoid adding stores that are just built for hot module replacement
        !hot) {
          const vm = currentInstance.proxy;
          const cache = "_pStores" in vm ? vm._pStores : vm._pStores = {};
          cache[id] = store;
        }
      }
      return store;
    }
    useStore.$id = id;
    return useStore;
  }
  let mapStoreSuffix = "Store";
  function setMapStoreSuffix(suffix) {
    mapStoreSuffix = suffix;
  }
  function mapStores(...stores) {
    if (Array.isArray(stores[0])) {
      console.warn(`[🍍]: Directly pass all stores to "mapStores()" without putting them in an array:
Replace
	mapStores([useAuthStore, useCartStore])
with
	mapStores(useAuthStore, useCartStore)
This will fail in production if not fixed.`);
      stores = stores[0];
    }
    return stores.reduce((reduced, useStore) => {
      reduced[useStore.$id + mapStoreSuffix] = function() {
        return useStore(this.$pinia);
      };
      return reduced;
    }, {});
  }
  function mapState(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = function() {
        return useStore(this.$pinia)[key];
      };
      return reduced;
    }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = function() {
        const store = useStore(this.$pinia);
        const storeKey = keysOrMapper[key];
        return typeof storeKey === "function" ? storeKey.call(this, store) : store[storeKey];
      };
      return reduced;
    }, {});
  }
  const mapGetters = mapState;
  function mapActions(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = function(...args) {
        return useStore(this.$pinia)[key](...args);
      };
      return reduced;
    }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = function(...args) {
        return useStore(this.$pinia)[keysOrMapper[key]](...args);
      };
      return reduced;
    }, {});
  }
  function mapWritableState(useStore, keysOrMapper) {
    return Array.isArray(keysOrMapper) ? keysOrMapper.reduce((reduced, key) => {
      reduced[key] = {
        get() {
          return useStore(this.$pinia)[key];
        },
        set(value) {
          return useStore(this.$pinia)[key] = value;
        }
      };
      return reduced;
    }, {}) : Object.keys(keysOrMapper).reduce((reduced, key) => {
      reduced[key] = {
        get() {
          return useStore(this.$pinia)[keysOrMapper[key]];
        },
        set(value) {
          return useStore(this.$pinia)[keysOrMapper[key]] = value;
        }
      };
      return reduced;
    }, {});
  }
  function storeToRefs(store) {
    {
      store = vue.toRaw(store);
      const refs = {};
      for (const key in store) {
        const value = store[key];
        if (vue.isRef(value) || vue.isReactive(value)) {
          refs[key] = // ---
          vue.toRef(store, key);
        }
      }
      return refs;
    }
  }
  const PiniaVuePlugin = function(_Vue) {
    _Vue.mixin({
      beforeCreate() {
        const options = this.$options;
        if (options.pinia) {
          const pinia2 = options.pinia;
          if (!this._provided) {
            const provideCache = {};
            Object.defineProperty(this, "_provided", {
              get: () => provideCache,
              set: (v) => Object.assign(provideCache, v)
            });
          }
          this._provided[piniaSymbol] = pinia2;
          if (!this.$pinia) {
            this.$pinia = pinia2;
          }
          pinia2._a = this;
          if (IS_CLIENT) {
            setActivePinia(pinia2);
          }
          if (USE_DEVTOOLS) {
            registerPiniaDevtools(pinia2._a, pinia2);
          }
        } else if (!this.$pinia && options.parent && options.parent.$pinia) {
          this.$pinia = options.parent.$pinia;
        }
      },
      destroyed() {
        delete this._pStores;
      }
    });
  };
  const pinia = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    get MutationType() {
      return MutationType;
    },
    PiniaVuePlugin,
    acceptHMRUpdate,
    createPinia,
    defineStore,
    getActivePinia,
    mapActions,
    mapGetters,
    mapState,
    mapStores,
    mapWritableState,
    setActivePinia,
    setMapStoreSuffix,
    skipHydrate,
    storeToRefs
  }, Symbol.toStringTag, { value: "Module" }));
  const useChatStore = defineStore("chatStore", {
    id: "chat",
    state: () => {
      return {
        roomId: 0,
        pageSize: 10,
        pageNo: 1,
        messages: [],
        avatar: ""
      };
    },
    actions: {
      setRoomId(roomId) {
        this.roomId = roomId;
      },
      setAvatar(avatar) {
        this.avatar = avatar;
      },
      async getMessageList() {
        try {
          const loginToken2 = uni.getStorageSync("login-token");
          formatAppLog("log", "at store/chatStore.js:28", "loginToken:", loginToken2);
          const res = await request({
            url: "/chat/message-list",
            // 替换为实际接口地址
            method: "GET",
            data: {
              pageNo: this.pageNo,
              pageSize: this.pageSize,
              roomId: this.roomId
            },
            header: {
              // 额外的头信息
              "login-token": loginToken2,
              "ajax": true
            }
          });
          formatAppLog("log", "at store/chatStore.js:44", "消息列表:", res);
          if (res.code === "0") {
            const loginUser = uni.getStorageSync("loginUser");
            const currentLoginUserId = loginUser.userId;
            this.messages = res.data.list.map((message) => {
              const senderUserId = message.senderUserId;
              const roomId = message.roomId;
              const type = senderUserId === currentLoginUserId ? "right" : "left";
              const messageId = message.id;
              const content = message.body.content;
              const avatar = "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg";
              return {
                ...message,
                // 保留原有的数据
                roomId,
                // 房间ID
                type,
                // 消息类型（"left" 或 "right"）
                content,
                // 消息内容
                avatar,
                // 头像
                messageId
              };
            });
          } else {
            uni.showToast({
              title: res.message || "获取消息列表失败",
              icon: "none"
            });
          }
        } catch (error) {
          formatAppLog("error", "at store/chatStore.js:76", "获取消息列表失败:", error);
          uni.showToast({
            title: "获取消息列表失败，请重试",
            icon: "none"
          });
        }
      },
      addOwnMessage(data) {
        const loginUser = uni.getStorageSync("loginUser");
        const currentLoginUserId = loginUser.userId;
        const senderUserId = data.senderUserId;
        const type = senderUserId === currentLoginUserId ? "right" : "left";
        const roomId = data.roomId;
        const messageId = data.messageId;
        const content = data.body.content;
        const avatar = data.avatar;
        const message = {
          messageId,
          roomId,
          type,
          content,
          avatar
        };
        this.messages.push(message);
      },
      addMessage(data) {
        formatAppLog("log", "at store/chatStore.js:102", "message", data);
        const loginUser = uni.getStorageSync("loginUser");
        const currentLoginUserId = loginUser.userId;
        const roomId = data.roomId;
        formatAppLog("log", "at store/chatStore.js:106", "roomId", roomId);
        formatAppLog("log", "at store/chatStore.js:107", "this.roomId", this.roomId);
        formatAppLog("log", "at store/chatStore.js:108", "roomId !== this.roomId", roomId !== this.roomId);
        if (roomId !== Number(this.roomId)) {
          return;
        }
        const senderUserId = data.senderUserId;
        if (senderUserId === currentLoginUserId) {
          return;
        }
        const type = senderUserId === currentLoginUserId ? "right" : "left";
        const content = data.content;
        const messageId = data.id;
        const avatar = this.avatar;
        const message = {
          type,
          // 消息类型（"left" 或 "right"）
          content,
          // 消息内容
          avatar,
          // 头像
          roomId,
          // 房间ID
          messageId
        };
        this.messages.push(message);
        formatAppLog("log", "at store/chatStore.js:130", "this.chats", this.messages);
      }
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
      currentChats: (state) => {
        return state.chats;
      }
    }
  });
  const _imports_0$2 = "/static/microphone-icon.png";
  const _imports_1$1 = "/static/biaoqing.png";
  const _imports_2$1 = "/static/send-more.png";
  const _sfc_main$5 = {
    props: {
      roomId: {
        type: Number,
        required: true,
        // 默认值或转换函数
        default: 0
      },
      avatar: {
        type: String,
        required: true
      }
    },
    setup(props) {
      const chatStore = useChatStore();
      const content = vue.ref("");
      const messages = vue.ref([]);
      const roomId = Number(props.roomId);
      const avatar = props.avatar;
      formatAppLog("log", "at pages/chat/chat.vue:56", "roomId", roomId);
      formatAppLog("log", "at pages/chat/chat.vue:57", "avatar", avatar);
      chatStore.setRoomId(roomId);
      chatStore.setAvatar(avatar);
      vue.watch(
        () => chatStore.messages,
        (newMessages) => {
          messages.value = newMessages;
        },
        { immediate: true }
      );
      vue.onMounted(async () => {
        await chatStore.getMessageList();
      });
      vue.onUnmounted(() => {
      });
      return {
        chatStore,
        content
      };
    },
    methods: {
      //发送消息
      async sendMessage() {
        formatAppLog("log", "at pages/chat/chat.vue:93", "Enter key pressed, content: ", this.content);
        if (this.content.trim() === "") {
          uni.showToast({
            title: "请输入内容",
            icon: "none"
          });
          return;
        }
        const body = {
          messageType: 1,
          // 文本消息
          roomId: 40,
          // 替换为实际 roomId
          body: {
            content: this.content
            // 消息内容
          }
        };
        try {
          const loginToken2 = uni.getStorageSync("login-token");
          formatAppLog("log", "at pages/chat/chat.vue:112", "loginToken:" + loginToken2);
          const res = await request({
            url: "/chat/sendMessage",
            // 替换为实际接口地址
            method: "POST",
            data: body,
            header: {
              // 额外的头信息
              "login-token": loginToken2,
              "ajax": true
            }
          });
          if (res.code === "0") {
            this.content = "";
            const chatStore = useChatStore();
            chatStore.addOwnMessage(res.data);
          } else {
            uni.showToast({
              title: res.message || "发送消息失败",
              icon: "none"
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/chat/chat.vue:136", "发送消息失败:", error);
          uni.showToast({
            title: "发送消息失败，请重试",
            icon: "none"
          });
        }
      }
      // scrollToBottom() {
      //   // 获取消息容器
      //   const container = this.$refs.messageContainer;
      //   // 滚动到容器底部
      //   container.scrollTop = container.scrollHeight;
      // }
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "chat-page" }, [
      vue.createCommentVNode(" 滚动区域 "),
      vue.createElementVNode(
        "div",
        {
          class: "chat-content",
          ref: "messageContainer"
        },
        [
          vue.createCommentVNode(" 循环展示消息 "),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.chatStore.messages, (message, index) => {
              return vue.openBlock(), vue.createElementBlock(
                "div",
                {
                  key: index,
                  class: vue.normalizeClass(["message-item", message.type === "right" ? "right" : "left"])
                },
                [
                  message.type === "left" ? (vue.openBlock(), vue.createElementBlock("div", {
                    key: 0,
                    class: "avatar"
                  }, [
                    vue.createElementVNode("img", {
                      src: message.avatar,
                      alt: "头像"
                    }, null, 8, ["src"])
                  ])) : vue.createCommentVNode("v-if", true),
                  vue.createElementVNode(
                    "div",
                    { class: "message-bubble" },
                    vue.toDisplayString(message.content),
                    1
                    /* TEXT */
                  ),
                  message.type === "right" ? (vue.openBlock(), vue.createElementBlock("div", {
                    key: 1,
                    class: "avatar"
                  }, [
                    vue.createElementVNode("img", {
                      src: message.avatar,
                      alt: "头像"
                    }, null, 8, ["src"])
                  ])) : vue.createCommentVNode("v-if", true)
                ],
                2
                /* CLASS */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ],
        512
        /* NEED_PATCH */
      ),
      vue.createCommentVNode(" 底部输入框 "),
      vue.createElementVNode("div", { class: "chat-input-bar" }, [
        vue.createElementVNode("div", { class: "input-actions" }, [
          vue.createElementVNode("img", {
            src: _imports_0$2,
            alt: "语音"
          })
        ]),
        vue.createCommentVNode("      @keydown.enter"),
        vue.withDirectives(vue.createElementVNode(
          "input",
          {
            type: "text",
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.content = $event),
            class: "input-box",
            placeholder: "发送消息...",
            onConfirm: _cache[1] || (_cache[1] = (...args) => $options.sendMessage && $options.sendMessage(...args))
          },
          null,
          544
          /* NEED_HYDRATION, NEED_PATCH */
        ), [
          [vue.vModelText, $setup.content]
        ]),
        vue.createElementVNode("div", { class: "input-actions" }, [
          vue.createElementVNode("img", {
            src: _imports_1$1,
            alt: "表情"
          }),
          vue.createElementVNode("img", {
            src: _imports_2$1,
            alt: "更多"
          })
        ])
      ])
    ]);
  }
  const PagesChatChat = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-0a633310"], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/chat/chat.vue"]]);
  const _imports_0$1 = "/static/yanzheng.png";
  const _imports_1 = "/static/black.png";
  const _imports_2 = "/static/group.png";
  const _sfc_main$4 = {
    data() {
      return {
        pageNo: 1,
        pageSize: 10,
        activeTab: "contact",
        // 默认选中的 tab
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
        ]
      };
    },
    onShow() {
      this.contactList();
    },
    methods: {
      async contactList() {
        const loginToken2 = uni.getStorageSync("login-token");
        formatAppLog("log", "at pages/contact/contact.vue:136", "loginToken:" + loginToken2);
        try {
          const res = await request({
            url: "/contact/contact-list",
            // 替换为实际接口地址
            method: "GET",
            data: {
              pageNo: this.pageNo,
              pageSize: this.pageSize
            },
            header: {
              // 额外的头信息
              "login-token": loginToken2,
              "ajax": true
            }
          });
          formatAppLog("log", "at pages/contact/contact.vue:154", "联系人列表：", res);
          if (res.code === "0") {
            const contacts = res.data.list.map((contact) => {
              const nationality = contact.userVO.nationality;
              const flagUrl = contact.userVO.flagUrl;
              const roomId = contact.roomId;
              const userId = contact.userVO.userId;
              const userName = contact.userVO.userName;
              const nickName = contact.userVO.nickName;
              const avatar = contact.userVO.avatar;
              return {
                nationality,
                flagUrl,
                roomId,
                userId,
                userName,
                nickName,
                avatar
              };
            });
            this.groupContacts = [{
              letter: "A",
              contacts
            }];
            formatAppLog("log", "at pages/contact/contact.vue:179", "groupContacts", this.groupContacts);
          } else {
            uni.showToast({
              title: res.message || "获取联系人失败",
              icon: "none"
            });
          }
        } catch (error) {
          formatAppLog("error", "at pages/contact/contact.vue:187", "获取联系人失败:", error);
          uni.showToast({
            title: "获取联系人失败，请重试",
            icon: "none"
          });
        }
      },
      navigateToDetail(contact) {
        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/contact/contact-detail?roomId=${contact.roomId}&userId=${contact.userId}&userName=${contact.userName}&nickName=${contact.nickName}&avatar=${contact.avatar}`
            // 通过 URL 的 query 传递参数
          });
        }, 5);
      },
      // 可以在此添加方法来处理用户交互
      navigateTo(tab) {
        this.activeTab = tab;
        if (tab === "conversation") {
          uni.navigateTo({
            url: "/pages/conversation/conversation"
            // 登录成功后的页面
          });
        } else if (tab === "contact") {
          uni.navigateTo({
            url: "/pages/contact/contact"
            // 登录成功后的页面
          });
        } else if (tab === "my") {
          uni.navigateTo({
            url: "/pages/my/my"
            // 登录成功后的页面
          });
        } else if (tab === "contact-detail") {
          uni.navigateTo({
            url: `/pages/contact/contact-detail?userId=${1}`
            // 登录成功后的页面
          });
        }
      },
      verifyMessage() {
        uni.showToast({
          title: "此功能正在开发中...",
          icon: "none"
        });
      },
      blackList() {
        uni.showToast({
          title: "此功能正在开发中...",
          icon: "none"
        });
      },
      myQunList() {
        uni.showToast({
          title: "此功能正在开发中...",
          icon: "none"
        });
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "container" }, [
      vue.createCommentVNode(" 头部 "),
      vue.createCommentVNode(' <div class="header">\r\n      <div class="title">通讯录</div>\r\n      <div class="search-icon">\r\n        <img src="/static/search-icon.png" alt="search"/>\r\n      </div>\r\n    </div '),
      vue.createCommentVNode(" 通讯录列表 "),
      vue.createElementVNode("div", { class: "contact-list" }, [
        vue.createElementVNode("div", { class: "contact-item" }, [
          vue.createElementVNode("div", { class: "contact-icon" }, [
            vue.createElementVNode("img", {
              src: _imports_0$1,
              alt: "Verify",
              class: "icon"
            })
          ]),
          vue.createElementVNode("div", { class: "contact-info" }, [
            vue.createElementVNode("div", {
              class: "contact-name",
              onClick: _cache[0] || (_cache[0] = (...args) => $options.verifyMessage && $options.verifyMessage(...args))
            }, "验证消息")
          ]),
          vue.createElementVNode("div", { class: "arrow" }, ">")
        ]),
        vue.createElementVNode("div", { class: "contact-item" }, [
          vue.createElementVNode("div", { class: "contact-icon" }, [
            vue.createElementVNode("img", {
              src: _imports_1,
              alt: "Blacklist",
              class: "icon"
            })
          ]),
          vue.createElementVNode("div", { class: "contact-info" }, [
            vue.createElementVNode("div", {
              class: "contact-name",
              onClick: _cache[1] || (_cache[1] = (...args) => $options.blackList && $options.blackList(...args))
            }, "黑名单")
          ]),
          vue.createElementVNode("div", { class: "arrow" }, ">")
        ]),
        vue.createElementVNode("div", { class: "contact-item" }, [
          vue.createElementVNode("div", { class: "contact-icon" }, [
            vue.createElementVNode("img", {
              src: _imports_2,
              alt: "Group Chat",
              class: "icon"
            })
          ]),
          vue.createElementVNode("div", { class: "contact-info" }, [
            vue.createElementVNode("div", {
              class: "contact-name",
              onClick: _cache[2] || (_cache[2] = (...args) => $options.myQunList && $options.myQunList(...args))
            }, "我的群聊")
          ]),
          vue.createElementVNode("div", { class: "arrow" }, ">")
        ])
      ]),
      vue.createCommentVNode(" 联系人列表 "),
      vue.createCommentVNode(' <div v-for="(contact, index) in contacts" :key="index" class="contact-item">\r\n      <div class="contact-icon">\r\n        <img :src="contact.avatar" alt="Avatar" class="icon" />\r\n      </div>\r\n      <div class="contact-info">\r\n        <div class="contact-name">{{ contact.name }}</div>\r\n        <div class="contact-status">{{ contact.status }}</div>\r\n      </div>\r\n      <div class="arrow">></div>\r\n    </div> '),
      vue.createCommentVNode(" 联系人列表 "),
      vue.createElementVNode("div", { class: "contact-list" }, [
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($data.groupContacts, (group, index) => {
            return vue.openBlock(), vue.createElementBlock("div", { key: index }, [
              vue.createCommentVNode(" 分组头部 "),
              vue.createElementVNode(
                "div",
                { class: "group-header" },
                vue.toDisplayString(group.letter),
                1
                /* TEXT */
              ),
              vue.createCommentVNode(" 联系人 "),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(group.contacts, (contact, idx) => {
                  return vue.openBlock(), vue.createElementBlock("div", {
                    key: idx,
                    class: "contact-item",
                    onClick: ($event) => $options.navigateToDetail(contact)
                  }, [
                    vue.createElementVNode("div", { class: "avatar-container" }, [
                      vue.createElementVNode("img", {
                        class: "avatar",
                        src: contact.avatar,
                        alt: "Avatar"
                      }, null, 8, ["src"])
                    ]),
                    vue.createElementVNode("div", { class: "contact-info" }, [
                      vue.createElementVNode(
                        "div",
                        { class: "contact-name" },
                        vue.toDisplayString(contact.nickName),
                        1
                        /* TEXT */
                      ),
                      vue.createCommentVNode('            <div class="contact-status">{{ contact.status }}</div>')
                    ])
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      vue.createCommentVNode(" 字母索引 "),
      vue.createCommentVNode(' <div class="alphabet-index">\r\n      <div class="alphabet">A</div>\r\n      <div class="alphabet">B</div>\r\n      <div class="alphabet">C</div>c\r\n      <div class="alphabet">D</div> '),
      vue.createCommentVNode(" ...省略部分字母，直到Z"),
      vue.createCommentVNode(' <div class="alphabet">Z</div> '),
      vue.createCommentVNode(" </div> "),
      vue.createCommentVNode(" 底部导航栏 "),
      vue.createElementVNode("div", { class: "tab-bar" }, [
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "conversation" }]),
            onClick: _cache[3] || (_cache[3] = ($event) => $options.navigateTo("conversation"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_1$2,
              alt: "消息",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "消息")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "contact" }]),
            onClick: _cache[4] || (_cache[4] = ($event) => $options.navigateTo("contact"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_2$2,
              alt: "通讯录",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "通讯录")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "my" }]),
            onClick: _cache[5] || (_cache[5] = ($event) => $options.navigateTo("my"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_3,
              alt: "我的",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "我")
          ],
          2
          /* CLASS */
        )
      ])
    ]);
  }
  const PagesContactContact = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-6bf5d4b5"], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/contact/contact.vue"]]);
  const _sfc_main$3 = {
    data() {
      return {
        roomId: 0,
        userId: 0,
        userName: "",
        nickName: "",
        avatar: "",
        // 是否加入黑名单
        isBlacklisted: false,
        // 联系人详细信息
        details: [
          {
            label: "备注名",
            value: "未设置"
          },
          {
            label: "生日",
            value: "未设置"
          },
          {
            label: "手机",
            value: "未设置"
          },
          {
            label: "邮箱",
            value: "未设置"
          },
          {
            label: "个性签名",
            value: "未设置"
          }
        ]
      };
    },
    /**
     * 接收参数
     */
    onLoad(options) {
      this.roomId = options.roomId;
      this.userId = options.userId;
      this.userName = options.userName;
      this.nickName = options.nickName;
      this.avatar = options.avatar;
    },
    // mounted() {
    //   // 获取路由传递的参数
    //   const { roomId,userId, userName,nickName, avatar } = this.$route.query;
    //
    // },
    methods: {
      // 返回上一页
      // goBack() {
      // 	uni.navigateBack();
      // },
      // 切换黑名单状态
      toggleBlacklist(event) {
        uni.showToast({
          title: "此功能正在开发中...",
          icon: "none"
        });
      },
      // navigateToChat() {
      //   this.$router.push({
      //     path: '/pages/chat/chat',
      //     query: {
      //       roomId: this.roomId,
      //       name: this.nickName,
      //       avatar: this.avatar
      //     }
      //   });
      // },
      navigateToChat() {
        setTimeout(() => {
          uni.navigateTo({
            url: `/pages/chat/chat?roomId=${Number(this.roomId)}&name=${this.nickName}&avatar=${this.avatar}`
            // 通过 URL 的 query 传递参数
          });
        }, 5);
      },
      // 开始聊天
      startChat() {
        uni.showToast({
          title: "进入聊天",
          icon: "none"
        });
      },
      // 删除好友
      deleteFriend() {
        uni.showModal({
          title: "提示",
          content: "确定删除好友吗？",
          success: (res) => {
            if (res.confirm) {
              uni.showToast({
                title: "好友已删除",
                icon: "none"
              });
            }
          }
        });
      }
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "container" }, [
      vue.createCommentVNode(" 顶部导航栏 "),
      vue.createCommentVNode(' <div class="header">\r\n			<span class="back-btn" @click="goBack">←</span>\r\n			<span class="title">联系人详情</span>\r\n		</div> '),
      vue.createCommentVNode(" 个人信息展示 "),
      vue.createElementVNode("div", { class: "profile" }, [
        vue.createElementVNode("img", {
          class: "avatar",
          src: $data.avatar,
          alt: "Avatar"
        }, null, 8, ["src"]),
        vue.createElementVNode("div", { class: "info" }, [
          vue.createElementVNode(
            "div",
            { class: "name" },
            vue.toDisplayString($data.nickName),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "div",
            { class: "account" },
            "账号: " + vue.toDisplayString($data.userName),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 详细信息 "),
      vue.createCommentVNode('		<div class="detail-list">'),
      vue.createCommentVNode(' <div class="detail-item" v-for="(item, index) in details" :key="index">\r\n				<span class="label">{{ item.label }}</span>\r\n				<span class="value">{{ item.value }}</span>\r\n			</div> '),
      vue.createCommentVNode(' <div class="detail-item">\r\n				<span class="label">加入黑名单</span>\r\n				<switch class="switch" v-model="isBlacklisted" @change="toggleBlacklist" />\r\n			</div> '),
      vue.createCommentVNode("		</div>"),
      vue.createCommentVNode(" 操作按钮 "),
      vue.createElementVNode("div", { class: "actions" }, [
        vue.createElementVNode("button", {
          class: "chat-btn",
          onClick: _cache[0] || (_cache[0] = (...args) => $options.navigateToChat && $options.navigateToChat(...args))
        }, "发消息"),
        vue.createElementVNode("button", {
          class: "delete-btn",
          onClick: _cache[1] || (_cache[1] = (...args) => $options.deleteFriend && $options.deleteFriend(...args))
        }, "删除好友")
      ])
    ]);
  }
  const PagesContactContactDetail = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-b3697a76"], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/contact/contact-detail.vue"]]);
  const _imports_0 = "/static/shezhi.png";
  const _sfc_main$2 = {
    data() {
      return {
        // 数据和方法可以在这里进一步扩展
        userName: "",
        nickName: "",
        activeTab: "my"
        // 默认选中的 tab
      };
    },
    onLoad() {
      const loginUser = uni.getStorageSync("loginUser");
      this.userName = loginUser.userName;
      this.nickName = loginUser.nickName;
    },
    methods: {
      // 可以在此处定义方法
      navigateTo(tab) {
        this.activeTab = tab;
        if (tab === "conversation") {
          uni.navigateTo({
            url: "/pages/conversation/conversation"
            // 登录成功后的页面
          });
        } else if (tab === "contact") {
          uni.navigateTo({
            url: "/pages/contact/contact"
            // 登录成功后的页面
          });
        } else if (tab === "my") {
          uni.navigateTo({
            url: "/pages/my/my"
            // 登录成功后的页面
          });
        } else if (tab === "settings") {
          uni.navigateTo({
            url: "/pages/my/settings"
            // 登录成功后的页面
          });
        }
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "profile-container" }, [
      vue.createCommentVNode(" 头部区域 "),
      vue.createElementVNode("div", { class: "profile-header" }, [
        vue.createElementVNode("div", { class: "profile-img" }, [
          vue.createElementVNode("img", {
            src: "https://wgq-im.oss-cn-nanjing.aliyuncs.com/DF957A521978414F505D705F8952C6B8.jpg",
            alt: "User Avatar"
          })
        ]),
        vue.createElementVNode("div", { class: "user-info" }, [
          vue.createElementVNode(
            "div",
            { class: "username" },
            vue.toDisplayString($data.nickName),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "div",
            { class: "account" },
            "账号:" + vue.toDisplayString($data.userName),
            1
            /* TEXT */
          )
        ])
      ]),
      vue.createCommentVNode(" 操作项 "),
      vue.createElementVNode("div", { class: "action-list" }, [
        vue.createElementVNode("div", { class: "action-item" }, [
          vue.createElementVNode("div", { class: "action-icon" }, [
            vue.createElementVNode("img", {
              src: _imports_0,
              alt: "Settings"
            }),
            vue.createElementVNode("div", { class: "action-text" }, "设置")
          ]),
          vue.createElementVNode("div", {
            class: "arrow",
            onClick: _cache[0] || (_cache[0] = ($event) => $options.navigateTo("settings"))
          }, ">")
        ]),
        vue.createCommentVNode(' <div class="action-item">\r\n				<div class="action-icon">\r\n					<img src="/static/info-icon.png" alt="About" />\r\n				</div>\r\n				<div class="action-text">关于</div>\r\n				<div class="arrow">></div>\r\n			</div> ')
      ]),
      vue.createCommentVNode(" 底部导航栏 "),
      vue.createElementVNode("div", { class: "tab-bar" }, [
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "conversation" }]),
            onClick: _cache[1] || (_cache[1] = ($event) => $options.navigateTo("conversation"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_1$2,
              alt: "消息",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "消息")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "contact" }]),
            onClick: _cache[2] || (_cache[2] = ($event) => $options.navigateTo("contact"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_2$2,
              alt: "通讯录",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "通讯录")
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode(
          "div",
          {
            class: vue.normalizeClass(["tab-item", { active: $data.activeTab === "my" }]),
            onClick: _cache[3] || (_cache[3] = ($event) => $options.navigateTo("my"))
          },
          [
            vue.createElementVNode("img", {
              src: _imports_3,
              alt: "我的",
              class: "tab-icon"
            }),
            vue.createElementVNode("div", { class: "tab-text" }, "我")
          ],
          2
          /* CLASS */
        )
      ])
    ]);
  }
  const PagesMyMy = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-2f1ef635"], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/my/my.vue"]]);
  const _sfc_main$1 = {
    data() {
      return {
        settings: {
          listenMode: true,
          // 听筒模式初始值
          readUnread: true
          // 消息已读未读功能初始值
        }
      };
    },
    methods: {
      // 切换听筒模式
      toggleListenMode(event) {
        this.settings.listenMode = event.target.checked;
        formatAppLog("log", "at pages/my/settings.vue:58", "听筒模式切换为:", this.settings.listenMode ? "开" : "关");
      },
      // 切换已读未读功能
      toggleReadUnread(event) {
        this.settings.readUnread = event.target.checked;
        formatAppLog("log", "at pages/my/settings.vue:63", "消息已读未读功能切换为:", this.settings.readUnread ? "开" : "关");
      },
      // 跳转到指定页面
      goToPage(page) {
        formatAppLog("log", "at pages/my/settings.vue:67", `跳转到 ${page} 页面`);
        uni.navigateTo({
          url: `/pages/${page}/${page}`
        });
      },
      // 退出登录逻辑
      logout() {
        uni.showModal({
          title: "确认退出登录",
          content: "退出登录后需要重新登录，确定要退出吗？",
          success: (res) => {
            if (res.confirm) {
              formatAppLog("log", "at pages/my/settings.vue:79", "用户确认退出登录");
              uni.clearStorageSync();
              close();
              uni.reLaunch({
                url: "/pages/login/login"
              });
            } else {
              formatAppLog("log", "at pages/my/settings.vue:88", "用户取消退出");
            }
          }
        });
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("div", { class: "settings-page" }, [
      vue.createCommentVNode(" 页面标题 "),
      vue.createCommentVNode(' <div class="settings-header">\r\n			<span>设置</span>\r\n		</div> '),
      vue.createCommentVNode(" 消息提醒 "),
      vue.createCommentVNode(` <div class="settings-item" @click="goToPage('notification-settings')">\r
			<span>消息提醒</span>\r
			<img src="/static/arrow-right.png" class="arrow-icon" alt="arrow" />\r
		</div> `),
      vue.createCommentVNode(" 外观 "),
      vue.createCommentVNode(` <div class="settings-item" @click="goToPage('theme-settings')">\r
			<span>外观</span>\r
			<img src="/static/arrow-right.png" class="arrow-icon" alt="arrow" />\r
		</div> `),
      vue.createCommentVNode(" 听筒模式 "),
      vue.createCommentVNode(' <div class="settings-item">\r\n			<span>听筒模式</span>\r\n			<div class="switch-container">\r\n				<input type="checkbox" :checked="settings.listenMode" @change="toggleListenMode" class="switch" />\r\n			</div>\r\n		</div> '),
      vue.createCommentVNode(" 消息已读未读功能 "),
      vue.createCommentVNode(' <div class="settings-item">\r\n			<span>消息已读未读功能</span>\r\n			<div class="switch-container">\r\n				<input type="checkbox" :checked="settings.readUnread" @change="toggleReadUnread" class="switch" />\r\n			</div>\r\n		</div> '),
      vue.createCommentVNode(" 退出登录 "),
      vue.createElementVNode("div", {
        class: "logout-btn",
        onClick: _cache[0] || (_cache[0] = (...args) => $options.logout && $options.logout(...args))
      }, [
        vue.createElementVNode("span", null, "退出登录")
      ])
    ]);
  }
  const PagesMySettings = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/pages/my/settings.vue"]]);
  __definePage("pages/login/login", PagesLoginLogin);
  __definePage("pages/register/register", PagesRegisterRegister);
  __definePage("pages/register/register-1", PagesRegisterRegister1);
  __definePage("pages/login/login-1", PagesLoginLogin1);
  __definePage("pages/conversation/conversation", PagesConversationConversation);
  __definePage("pages/chat/chat", PagesChatChat);
  __definePage("pages/contact/contact", PagesContactContact);
  __definePage("pages/contact/contact-detail", PagesContactContactDetail);
  __definePage("pages/my/my", PagesMyMy);
  __definePage("pages/my/settings", PagesMySettings);
  const WebsocketResponseType = {
    MESSAGE: 4
  };
  const MessageType = {
    TEXT: 1
  };
  const _sfc_main = {
    data() {
      return {
        isExit: false,
        // 是否已退出
        reconnecting: false
        // 正在重连标志
      };
    },
    methods: {
      init() {
        this.isExit = false;
        try {
          this.initWebsocket();
        } catch (e) {
          formatAppLog("log", "at App.vue:22", e);
          this.exit();
        }
      },
      //初始化websocket
      initWebsocket() {
        const loginToken2 = uni.getStorageSync("login-token");
        init();
        connect(UNI_APP.WS_URL, loginToken2);
        onConnect(() => {
          if (this.reconnecting) {
            this.reconnecting = false;
            uni.showToast({
              title: "已重新连接",
              icon: "none"
            });
          }
        });
        onMessage((type, data) => {
          if (WebsocketResponseType.MESSAGE === type) {
            this.handlerNewMessage(data);
          }
        });
        onClose((res) => {
          formatAppLog("log", "at App.vue:60", "ws断开", res);
          this.reconnectWebsocket();
        });
      },
      reconnectWebsocket() {
        if (this.isExit) {
          return;
        }
        this.reconnecting = true;
        try {
          const loginToken2 = uni.getStorageSync("login-token");
          reconnect(UNI_APP.WS_URL, loginToken2);
        } catch (e) {
          setTimeout(() => {
            this.reconnectWebsocket();
          }, 5e3);
        }
      },
      loadStore() {
        return this.chatStore.loadChat();
      },
      unloadStore() {
        this.chatStore.clear();
        this.userStore.clear();
      },
      exit() {
        formatAppLog("log", "at App.vue:105", "exit");
        this.isExit = true;
        close(3099);
        uni.removeStorageSync("loginUser");
        uni.removeStorageSync("login-token");
        uni.reLaunch({
          url: "/pages/login/login"
        });
        this.unloadStore();
      },
      handlerNewMessage(message) {
        formatAppLog("log", "at App.vue:116", "this.chatStore", this.chatStore);
        if (MessageType.TEXT === message.type) {
          this.chatStore.addMessage(message);
          return;
        }
        formatAppLog("log", "at App.vue:122", "其他类型消息赞不处理", message.type);
      }
    },
    onLaunch() {
      try {
        this.$mountStore();
        const loginToken2 = uni.getStorageSync("login-token");
        const loginUser = uni.getStorageSync("loginUser");
        if (loginUser && loginToken2) {
          this.init();
          uni.navigateTo({
            url: "/pages/conversation/conversation"
          });
        } else {
        }
      } catch (e) {
        formatAppLog("error", "at App.vue:149", "获取登录信息失败", e);
      }
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "E:/wgq/studyspace/im/前端/web-chat/web-chat/App.vue"]]);
  const useUserStore = defineStore("userStore", {
    state: () => {
      return {
        userInfo: {}
      };
    },
    actions: {
      setUserInfo(userInfo) {
        this.userInfo = userInfo;
      },
      clear() {
        this.userInfo = {};
      },
      loadUser(context) {
        return new Promise((resolve, reject) => {
          http({
            url: "/user/self",
            method: "GET"
          }).then((userInfo) => {
            formatAppLog("log", "at store/userStore.js:22", userInfo);
            this.setUserInfo(userInfo);
            resolve();
          }).catch((res) => {
            reject(res);
          });
        });
      }
    }
  });
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(createPinia());
    app.config.globalProperties.$mountStore = () => {
      app.config.globalProperties.chatStore = useChatStore();
      app.config.globalProperties.userStore = useUserStore();
    };
    return {
      app,
      pinia
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
