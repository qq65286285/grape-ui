// src/main.js
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue'
import router from './router';
import service from './utils/request' // 引入配置好的 axios 实例

const app = createApp(App);
app.use(ElementPlus);
app.use(router).mount('#app');

// 将配置好的 axios 实例注册为全局属性
app.config.globalProperties.$http = service;

export default service