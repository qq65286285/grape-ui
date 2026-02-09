// src/main.js
import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue'
import router from './router';
import service from './utils/request' // 引入配置好的 axios 实例

// 增强 ResizeObserver 错误捕获，避免页面崩溃
if (window.ResizeObserver) {
  // 重写 ResizeObserver 构造函数，捕获所有错误
  const OriginalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = function(callback) {
    const wrappedCallback = function(entries, observer) {
      try {
        callback(entries, observer);
      } catch (error) {
        console.warn('ResizeObserver 回调错误:', error);
      }
    };
    
    try {
      return new OriginalResizeObserver(wrappedCallback);
    } catch (error) {
      console.warn('ResizeObserver 构造错误:', error);
      // 返回一个空对象，避免后续调用出错
      return {
        observe: function() {},
        unobserve: function() {},
        disconnect: function() {}
      };
    }
  };
  
  // 捕获 observe 方法错误
  const originalObserve = window.ResizeObserver.prototype.observe;
  if (originalObserve) {
    window.ResizeObserver.prototype.observe = function(target, options) {
      try {
        originalObserve.call(this, target, options);
      } catch (error) {
        console.warn('ResizeObserver observe 错误:', error);
      }
    };
  }
  
  // 捕获 unobserve 方法错误
  const originalUnobserve = window.ResizeObserver.prototype.unobserve;
  if (originalUnobserve) {
    window.ResizeObserver.prototype.unobserve = function(target) {
      try {
        originalUnobserve.call(this, target);
      } catch (error) {
        console.warn('ResizeObserver unobserve 错误:', error);
      }
    };
  }
  
  // 捕获 disconnect 方法错误
  const originalDisconnect = window.ResizeObserver.prototype.disconnect;
  if (originalDisconnect) {
    window.ResizeObserver.prototype.disconnect = function() {
      try {
        originalDisconnect.call(this);
      } catch (error) {
        console.warn('ResizeObserver disconnect 错误:', error);
      }
    };
  }
}

// 捕获未处理的 Promise 错误
window.addEventListener('unhandledrejection', function(event) {
  console.warn('未处理的 Promise 错误:', event.reason);
  event.preventDefault();
});

// 捕获未捕获的错误
window.addEventListener('error', function(event) {
  if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    console.warn('ResizeObserver 循环错误，已忽略:', event.message);
    event.preventDefault();
    event.stopPropagation();
  }
});

// 捕获控制台错误，避免错误叠加层显示
const originalConsoleError = console.error;
console.error = function(...args) {
  const errorMessage = args[0];
  if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('ResizeObserver loop completed with undelivered notifications')) {
    console.warn('ResizeObserver 循环错误，已忽略:', errorMessage);
    return;
  }
  originalConsoleError.apply(console, args);
};

const app = createApp(App);
app.use(ElementPlus);
app.use(router).mount('#app');

// 将配置好的 axios 实例注册为全局属性
app.config.globalProperties.$http = service;