import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig({
  plugins: [uni()],
  server: {
    host: "0.0.0.0", // 允许局域网访问
    port: 5173, // Vite 默认端口，可根据需要修改
    proxy: {
      "/api": {
        target: "http://115.159.23.172:80", // 后端服务器地址
        // target: "http://127.0.0.1:8966", // 后端服务器地址
        // target: "http://192.168.0.109:80", // 后端服务器地址
        changeOrigin: false, // 开启代理
        rewrite: (path) => path.replace(/^\/api/, ""), // 去掉前缀
      },
    },
  },
});
