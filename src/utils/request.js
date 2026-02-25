// src/utils/request.js
import axios from 'axios';

// 创建 axios 实例
const service = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://192.168.23.168:8209', // 后端 API 地址
  timeout: 30000, // 请求超时时间
  withCredentials: true, // 允许携带凭证，解决跨域问题
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      // 将 token 添加到请求头中
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.log(error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.log('err' + error)
    
    // 处理 401 未授权
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      window.location.href = '/LoginPage'
    }
    
    // 提取后端详细错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data
      
      // 构建详细错误信息
      let errorMessage = errorData.message || '服务器错误'
      
      // 如果有详细错误信息，添加到错误消息中
      if (errorData.detailedMessage) {
        errorMessage += '\n详细信息: ' + errorData.detailedMessage
      }
      
      if (errorData.errorType) {
        errorMessage += '\n错误类型: ' + errorData.errorType
      }
      
      if (errorData.code) {
        errorMessage += '\n错误代码: ' + errorData.code
      }
      
      if (errorData.requestId) {
        errorMessage += '\n请求ID: ' + errorData.requestId
      }
      
      // 如果 data 字段中也有错误信息
      if (errorData.data && typeof errorData.data === 'object') {
        if (errorData.data.detailedMessage) {
          errorMessage += '\n详细信息: ' + errorData.data.detailedMessage
        }
        if (errorData.data.errorType) {
          errorMessage += '\n错误类型: ' + errorData.data.errorType
        }
        if (errorData.data.stackTrace) {
          errorMessage += '\n堆栈信息: ' + errorData.data.stackTrace
        }
      }
      
      // 创建自定义错误对象
      const customError = new Error(errorMessage)
      customError.response = error.response
      customError.code = errorData.code
      customError.detailedMessage = errorData.detailedMessage || (errorData.data && errorData.data.detailedMessage)
      customError.errorType = errorData.errorType || (errorData.data && errorData.data.errorType)
      customError.stackTrace = errorData.stackTrace || (errorData.data && errorData.data.stackTrace)
      customError.requestId = errorData.requestId
      customError.errorData = errorData
      
      console.log('后端错误信息:', customError)
      
      return Promise.reject(customError)
    }
    
    return Promise.reject(error)
  }
)

export default service