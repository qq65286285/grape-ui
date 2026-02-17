<template>
  <div class="ai-chat-container">
    <h1>AI聊天助手</h1>
    <div class="chat-container">
      <!-- 聊天记录 -->
      <div class="chat-messages">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.type]">
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">{{ message.type === 'user' ? '我' : 'AI助手' }}</span>
              <span class="message-time">{{ message.time }}</span>
            </div>
            <div class="message-body">{{ message.content }}</div>
          </div>
        </div>
      </div>
      <!-- 输入区域 -->
      <div class="chat-input-area">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          placeholder="请输入您的问题..."
          @keyup.enter.exact="sendMessage"
        />
        <div class="input-actions">
          <el-button type="primary" @click="sendMessage" :loading="isLoading">发送</el-button>
          <el-button @click="clearMessages">清空记录</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AIChat',
  data() {
    return {
      messages: [],
      inputMessage: '',
      isLoading: false,
      // WebSocket相关
      ws: null,
      wsConnected: false,
      wsUrl: '',
      wsReconnectAttempts: 0,
      maxReconnectAttempts: 5,
      // 流式输出相关
      currentAiMessageId: null,
      currentAiMessageIndex: -1,
      // 心跳相关
      heartbeatTimer: null
    };
  },
  methods: {
    // 发送消息
    sendMessage() {
      if (!this.inputMessage.trim()) return;
      
      console.log('开始发送消息，WebSocket连接状态:', this.wsConnected);
      
      // 添加用户消息
      const userMessage = {
        type: 'user',
        content: this.inputMessage.trim(),
        time: this.formatTime(new Date())
      };
      this.messages.push(userMessage);
      console.log('添加用户消息后:', this.messages);
      
      // 创建AI消息占位符
      const aiMessagePlaceholder = {
        type: 'ai',
        content: '',
        time: this.formatTime(new Date())
      };
      this.messages.push(aiMessagePlaceholder);
      this.currentAiMessageIndex = this.messages.length - 1;
      this.currentAiMessageId = Date.now(); // 用于标识当前AI消息
      console.log('创建AI消息占位符，索引:', this.currentAiMessageIndex);
      console.log('创建占位符后消息列表:', this.messages);
      
      // 清空输入框
      const question = this.inputMessage.trim();
      this.inputMessage = '';
      
      // 显示加载状态
      this.isLoading = true;
      
      // 滚动到底部
      this.scrollToBottom();
      
      // 只使用WebSocket发送消息
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket已连接，通过WebSocket发送消息');
        this.ws.send(JSON.stringify({
          type: 'ask_question',
          question: question
        }));
        console.log('通过WebSocket发送问题:', question);
      } else {
        console.error('WebSocket连接未就绪');
        // 更新错误消息到当前AI消息占位符
        if (this.currentAiMessageIndex >= 0 && this.currentAiMessageIndex < this.messages.length) {
          this.messages[this.currentAiMessageIndex].content = 'WebSocket连接未就绪，请检查网络连接后重试。';
          // 重置当前AI消息索引
          this.currentAiMessageIndex = -1;
          this.currentAiMessageId = null;
        } else {
          // 如果没有占位符，创建新错误消息
          const errorMessage = {
            type: 'ai',
            content: 'WebSocket连接未就绪，请检查网络连接后重试。',
            time: this.formatTime(new Date())
          };
          this.messages.push(errorMessage);
        }
        // 关闭加载状态
        this.isLoading = false;
        // 滚动到底部
        this.scrollToBottom();
      }
    },
    // 清空聊天记录
    clearMessages() {
      this.messages = [];
    },
    // 格式化时间
    formatTime(date) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    },
    // 滚动到底部
    scrollToBottom() {
      setTimeout(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    },
    // 连接WebSocket
    connectWebSocket() {
      try {
        // 关闭已存在的连接
        if (this.ws) {
          console.log('关闭现有WebSocket连接');
          this.ws.close();
        }
        
        // 检查wsUrl是否为空
        if (!this.wsUrl) {
          console.error('WebSocket连接地址为空');
          return;
        }
        
        console.log('正在连接WebSocket:', this.wsUrl);
        
        // 检查WebSocket地址格式
        try {
          const url = new URL(this.wsUrl);
          console.log('WebSocket地址解析成功:', url);
        } catch (urlError) {
          console.error('WebSocket地址格式错误:', urlError);
          return;
        }
        
        // 创建新的WebSocket连接
        console.log('创建WebSocket实例...');
        this.ws = new WebSocket(this.wsUrl);
        
        console.log('WebSocket连接状态:', this.ws.readyState);
        
        // 连接成功
        this.ws.onopen = () => {
          console.log('WebSocket连接成功');
          console.log('WebSocket readyState:', this.ws.readyState);
          this.wsConnected = true;
          this.wsReconnectAttempts = 0; // 重置重连次数
          console.log('WebSocket连接状态:', this.wsConnected);
          
          // 连接成功后发送心跳
          this.startHeartbeat();
        };
        
        // 接收消息
        this.ws.onmessage = (event) => {
          try {
            console.log('收到WebSocket消息事件:', event);
            const message = JSON.parse(event.data);
            console.log('收到WebSocket消息:', message);
            console.log('当前AI消息索引:', this.currentAiMessageIndex);
            console.log('当前消息列表长度:', this.messages.length);
            
            // 处理新的消息格式
            if (message.header && message.payload) {
              // 检查是否是成功响应
              if (message.header.code === 0 && message.header.status === 1) {
                // 提取AI回复内容
                const aiResponse = message.payload.choices?.text?.[0]?.reasoning_content;
                console.log('提取到的AI响应:', aiResponse);
                if (aiResponse) {
                  // 查找最后一条AI消息
                  let lastAiMessageIndex = -1;
                  for (let i = this.messages.length - 1; i >= 0; i--) {
                    if (this.messages[i].type === 'ai') {
                      lastAiMessageIndex = i;
                      break;
                    }
                  }
                  
                  console.log('找到最后一条AI消息索引:', lastAiMessageIndex);
                  
                  if (lastAiMessageIndex >= 0) {
                    // 更新最后一条AI消息
                    console.log('更新最后一条AI消息，索引:', lastAiMessageIndex);
                    console.log('更新前内容:', this.messages[lastAiMessageIndex].content);
                    // 追加内容到最后一条AI消息
                    this.messages[lastAiMessageIndex].content += aiResponse;
                    console.log('更新后内容:', this.messages[lastAiMessageIndex].content);
                  } else {
                    // 如果没有AI消息，创建新消息
                    console.log('没有找到AI消息，创建新消息');
                    const aiMessage = {
                      type: 'ai',
                      content: aiResponse,
                      time: this.formatTime(new Date())
                    };
                    this.messages.push(aiMessage);
                    console.log('创建新消息后列表长度:', this.messages.length);
                  }
                  this.scrollToBottom();
                  // 关闭加载状态
                  this.isLoading = false;
                }
              }
            } else if (message.type === 'ai_response') {
              // 兼容旧的消息格式
              const aiResponse = message.data;
              console.log('提取到的旧格式AI响应:', aiResponse);
              if (aiResponse) {
                // 查找最后一条AI消息
                let lastAiMessageIndex = -1;
                for (let i = this.messages.length - 1; i >= 0; i--) {
                  if (this.messages[i].type === 'ai') {
                    lastAiMessageIndex = i;
                    break;
                  }
                }
                
                console.log('找到最后一条AI消息索引:', lastAiMessageIndex);
                
                if (lastAiMessageIndex >= 0) {
                  // 更新最后一条AI消息
                  console.log('更新最后一条AI消息（旧格式），索引:', lastAiMessageIndex);
                  // 追加内容到最后一条AI消息
                  this.messages[lastAiMessageIndex].content += aiResponse;
                } else {
                  // 如果没有AI消息，创建新消息
                  console.log('没有找到AI消息（旧格式），创建新消息');
                  const aiMessage = {
                    type: 'ai',
                    content: aiResponse,
                    time: this.formatTime(new Date())
                  };
                  this.messages.push(aiMessage);
                }
                this.scrollToBottom();
                // 关闭加载状态
                this.isLoading = false;
              }
            } else if (message.type === 'heartbeat') {
              // 处理心跳响应
              console.log('收到心跳响应');
              this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), 30000);
            } else if (message.type === 'ai_stream') {
              // 处理流式输出消息
              const streamContent = message.content;
              console.log('收到流式输出内容:', streamContent);
              if (streamContent) {
                // 查找最后一条AI消息
                let lastAiMessageIndex = -1;
                for (let i = this.messages.length - 1; i >= 0; i--) {
                  if (this.messages[i].type === 'ai') {
                    lastAiMessageIndex = i;
                    break;
                  }
                }
                
                console.log('找到最后一条AI消息索引:', lastAiMessageIndex);
                
                if (lastAiMessageIndex >= 0) {
                  // 追加内容到最后一条AI消息
                  this.messages[lastAiMessageIndex].content += streamContent;
                  this.scrollToBottom();
                }
                
                // 检查是否是流结束
                if (message.is_end) {
                  console.log('流式输出结束');
                  // 关闭加载状态
                  this.isLoading = false;
                }
              }
            } else {
              console.log('未知消息格式:', message);
            }
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };
        
        // 连接关闭
        this.ws.onclose = (event) => {
          console.log('WebSocket连接关闭:', event.code, event.reason);
          console.log('WebSocket readyState:', this.ws.readyState);
          this.wsConnected = false;
          console.log('WebSocket连接状态:', this.wsConnected);
          
          // 清除心跳
          this.clearHeartbeat();
          
          // 自动重连
          this.reconnectWebSocket();
        };
        
        // 连接错误
        this.ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          console.log('WebSocket readyState:', this.ws.readyState);
          this.wsConnected = false;
          console.log('WebSocket连接状态:', this.wsConnected);
          
          // 清除心跳
          this.clearHeartbeat();
          
          // 尝试重连
          this.reconnectWebSocket();
        };
      } catch (error) {
        console.error('WebSocket连接失败:', error);
        this.wsConnected = false;
        console.log('WebSocket连接状态:', this.wsConnected);
        
        // 清除心跳
        this.clearHeartbeat();
        
        // 发生错误时尝试重连
        this.reconnectWebSocket();
      }
    },
    
    // 重新连接WebSocket
    reconnectWebSocket() {
      if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
        this.wsReconnectAttempts++;
        console.log(`WebSocket尝试重连(${this.wsReconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        // 延迟重连
        setTimeout(() => {
          this.connectWebSocket();
        }, 2000 * this.wsReconnectAttempts); // 指数退避
      } else {
        console.error('WebSocket重连失败，已达到最大尝试次数');
        // 添加错误消息到聊天界面
        const errorMessage = {
          type: 'ai',
          content: 'AI服务连接失败，请稍后再试',
          time: this.formatTime(new Date())
        };
        this.messages.push(errorMessage);
        this.scrollToBottom();
      }
    },
    // 关闭WebSocket连接
    closeWebSocket() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.wsConnected = false;
        // 清除心跳
        this.clearHeartbeat();
      }
    },
    // 开始心跳
    startHeartbeat() {
      console.log('开始心跳');
      this.sendHeartbeat();
    },
    // 发送心跳
    sendHeartbeat() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('发送心跳');
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
        // 设置下次心跳
        this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), 30000);
      }
    },
    // 清除心跳
    clearHeartbeat() {
      if (this.heartbeatTimer) {
        console.log('清除心跳');
        clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }
  },
  mounted() {
    // 初始化时添加欢迎消息
    const welcomeMessage = {
      type: 'ai',
      content: '你好！我是AI助手，有什么可以帮到你的吗？',
      time: this.formatTime(new Date())
    };
    this.messages.push(welcomeMessage);
    
    // 直接使用localhost:8209作为WebSocket连接地址，确保与后端服务匹配
    // 从环境变量读取API地址并转换为WebSocket地址
    const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://192.168.22.140:8209';
    // 将http://转换为ws://
    this.wsUrl = apiBaseUrl.replace(/^http:/, 'ws:') + '/api/ws';
    console.log('WebSocket连接地址:', this.wsUrl);
    
    // 连接WebSocket
    this.connectWebSocket();
    
    // 监听消息列表变化
    this.$watch('messages', (newVal) => {
      console.log('消息列表变化:', newVal);
      console.log('当前AI消息索引:', this.currentAiMessageIndex);
    }, { deep: true });
  },
  beforeUnmount() {
    // 关闭WebSocket连接
    this.closeWebSocket();
  }
};
</script>

<style scoped>
.ai-chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

h1 {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 300px);
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message.user .message-content {
  background-color: #e6f7ff;
  border-top-right-radius: 0;
}

.message.ai .message-content {
  background-color: #ffffff;
  border-top-left-radius: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #999;
}

.message-sender {
  font-weight: 500;
}

.message-body {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.chat-input-area {
  padding: 20px;
  border-top: 1px solid #eaeaea;
  background-color: #ffffff;
}

.input-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>