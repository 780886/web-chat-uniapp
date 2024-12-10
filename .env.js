//设置环境(打包前修改此变量)
const ENV = "PROD";
// const ENV = "DEV";
const UNI_APP = {}
if(ENV==="DEV"){
	UNI_APP.BASE_URL = "http://192.168.0.109:8966";
	UNI_APP.WS_URL = "ws://192.168.0.109:8090";
	// H5 走本地代理解决跨域问题
	// #ifdef H5
		UNI_APP.BASE_URL = "/api";
	// #endif
}
if(ENV==="PROD"){
	UNI_APP.BASE_URL = "http://115.159.23.172:80";
	UNI_APP.WS_URL = "ws://115.159.23.172:80/websocket";
	// #ifdef H5
	UNI_APP.BASE_URL = "/api";
	// #endif
}
export default UNI_APP