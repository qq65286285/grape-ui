// src/main.js
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue'
import router from './router';
import service from './utils/request' // 引入配置好的 axios 实例

// 捕获 ResizeObserver 错误，避免页面崩溃
if (window.ResizeObserver) {
  const originalObserve = window.ResizeObserver.prototype.observe;
  window.ResizeObserver.prototype.observe = function(target, options) {
    try {
      originalObserve.call(this, target, options);
    } catch (error) {
      console.warn('ResizeObserver 错误:', error);
    }
  };
}

const app = createApp(App);
app.use(ElementPlus);
app.use(router).mount('#app');

// 将配置好的 axios 实例注册为全局属性
app.config.globalProperties.$http = service;