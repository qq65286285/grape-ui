<template>
  <div class="screen-mirror-container">
    <!-- 头部工具栏 -->
    <div class="toolbar">
      <div class="device-info">
        <h2>{{ deviceName || '设备投屏' }}</h2>
        <span class="device-serial">序列号: {{ deviceSerial }}</span>
      </div>
      <div class="toolbar-actions">
        <span :class="['status-indicator', connectionStatus]">
          {{ connectionStatusText }}
        </span>
        <el-button type="primary" @click="reconnect" :disabled="isConnecting" size="large">
          重新连接
        </el-button>
        <el-button type="danger" @click="disconnect" size="large">
          断开连接
        </el-button>
        <el-button @click="goBack" size="large">
          返回
        </el-button>
      </div>
    </div>

    <!-- 投屏显示区域 -->
    <div class="screen-display-wrapper">
      <!-- Video 元素始终存在，但在非连接状态下隐藏 -->
      <div :class="['screen-display', { 'hidden': connectionStatus !== 'connected' }]">
        <!-- Scrcpy 模式：使用 video 标签 -->
        <video
          ref="screenVideo"
          id="scrcpy-video"
          class="screen-video"
          autoplay
          muted
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseLeave"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        ></video>
      </div>

      <div v-if="connectionStatus === 'connecting'" class="loading-container">
        <div class="loading-spinner"></div>
        <p>正在连接设备...</p>
      </div>

      <div v-else-if="connectionStatus === 'error'" class="error-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h3>连接失败</h3>
        <p>{{ errorMessage }}</p>
        <el-button type="primary" @click="reconnect" size="large">重试</el-button>
      </div>

      <div v-else-if="connectionStatus === 'disconnected'" class="disconnected-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <h3>未连接</h3>
        <p>点击"重新连接"开始投屏</p>
      </div>
    </div>
  </div>
</template>

<script>
import Scrcpy from '@/utils/scrcpy/index.js';

export default {
  name: 'ScreenMirror',
  data() {
    return {
      deviceSerial: '',
      deviceName: '',
      scrcpyClient: null,
      connectionStatus: 'disconnected', // disconnected, connecting, connected, error
      errorMessage: '',
      isConnecting: false,
      // WebSocket URL 配置 - 从环境变量读取并转换为 ws 协议
      wsBaseUrl: this.getWebSocketBaseUrl(),
      // 触摸控制相关
      isMouseDown: false,
      screenWidth: 1080,
      screenHeight: 2316,
      lastX: 0,
      lastY: 0
    };
  },
  computed: {
    connectionStatusText() {
      const statusMap = {
        disconnected: '未连接',
        connecting: '连接中...',
        connected: '已连接',
        error: '连接错误'
      };
      return statusMap[this.connectionStatus] || '未知';
    }
  },
  mounted() {
    // 从路由参数获取设备信息
    this.deviceSerial = this.$route.params.serial;
    this.deviceName = this.$route.query.name;

    if (!this.deviceSerial) {
      this.$message.error('缺少设备序列号');
      this.goBack();
      return;
    }

    // 确保DOM渲染完成后再连接，避免video元素未就绪
    this.$nextTick(() => {
      // 自动连接
      this.connect();
    });
  },
  beforeUnmount() {
    // 组件销毁前断开连接
    this.disconnect();
  },
  methods: {
    // 获取 WebSocket 基础 URL
    getWebSocketBaseUrl() {
      // 从环境变量获取 HTTP API 地址
      const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8209/api';

      // 将 http:// 或 https:// 转换为 ws:// 或 wss://
      let wsUrl = apiBaseUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

      // 确保 URL 以 /api 结尾（如果没有的话）
      if (!wsUrl.endsWith('/api')) {
        wsUrl = wsUrl + '/api';
      }

      // 去掉末尾的 /api，因为我们会在连接时加上完整路径
      wsUrl = wsUrl.replace(/\/api$/, '');

      console.log('WebSocket Base URL:', wsUrl);
      return wsUrl;
    },

    // 连接 WebSocket
    connect() {
      if (this.scrcpyClient) {
        this.$message.warning('已经连接');
        return;
      }

      this.connectionStatus = 'connecting';
      this.isConnecting = true;
      this.errorMessage = '';

      try {
        // 构建 WebSocket URL - 测试：加上 /api 前缀
        const wsUrl = `${this.wsBaseUrl}/api/screen/${this.deviceSerial}`;
        console.log('正在连接 WebSocket:', wsUrl);

        // 创建 Scrcpy 客户端
        this.scrcpyClient = new Scrcpy({
          socketURL: wsUrl,
          node: 'scrcpy-video',
          excuteMode: 'Scrcpy', // 使用 Scrcpy 模式
          onmessage: this.handleMessage,
          onopen: this.handleOpen,
          onclose: this.handleClose
        });

      } catch (error) {
        console.error('创建 Scrcpy 客户端失败:', error);
        this.connectionStatus = 'error';
        this.errorMessage = error.message;
        this.isConnecting = false;
      }
    },

    // WebSocket 打开
    handleOpen() {
      console.log('WebSocket 连接成功');
      this.connectionStatus = 'connected';
      this.isConnecting = false;
      this.$message.success('投屏连接成功');
    },

    // WebSocket 关闭
    handleClose() {
      console.log('WebSocket 连接关闭');
      if (this.connectionStatus === 'connected') {
        this.connectionStatus = 'disconnected';
        this.$message.info('投屏已断开');
      }
      this.isConnecting = false;
      this.scrcpyClient = null;
    },

    // 处理消息
    handleMessage(event) {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          console.log('收到服务器消息:', msg);

          if (msg.msg === 'picFinish') {
            console.log('投屏准备就绪');
          } else if (msg.msg === 'size') {
            console.log('设备屏幕尺寸:', msg.width, 'x', msg.height);
            // 保存屏幕尺寸用于坐标转换
            this.screenWidth = parseInt(msg.width);
            this.screenHeight = parseInt(msg.height);
          } else if (msg.msg === 'rotation') {
            console.log('屏幕旋转:', msg.value, '度');
          } else if (msg.msg === 'error') {
            this.connectionStatus = 'error';
            this.errorMessage = '投屏服务出错';
            this.$message.error('投屏服务出错');
          }
        } catch (e) {
          console.error('解析消息失败:', e);
        }
      }
    },

    // 重新连接
    reconnect() {
      this.disconnect();
      setTimeout(() => {
        this.connect();
      }, 500);
    },

    // 断开连接
    disconnect() {
      if (this.scrcpyClient) {
        this.scrcpyClient.close();
        this.scrcpyClient = null;
      }
      this.connectionStatus = 'disconnected';
    },

    // 返回
    goBack() {
      this.disconnect();
      this.$router.back();
    },

    // ========== 触摸控制 ==========

    // 计算设备坐标
    getDeviceCoordinates(event) {
      const video = this.$refs.screenVideo;
      if (!video) return { x: 0, y: 0 };

      const rect = video.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);

      // 计算相对于 video 的坐标
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // 转换为设备坐标
      const x = Math.round((relativeX / rect.width) * this.screenWidth);
      const y = Math.round((relativeY / rect.height) * this.screenHeight);

      return { x, y };
    },

    // 发送触摸事件
    sendTouchEvent(type, x, y) {
      if (!this.scrcpyClient || !this.scrcpyClient.websocket) {
        return;
      }

      const message = JSON.stringify({
        type: 'touch',
        detail: `${type} ${x} ${y}\n`
      });

      this.scrcpyClient.websocket.send(message);
      console.log('[Touch]', type, x, y);
    },

    // 鼠标按下
    handleMouseDown(event) {
      event.preventDefault();
      this.isMouseDown = true;
      const { x, y } = this.getDeviceCoordinates(event);
      this.lastX = x;
      this.lastY = y;
      this.sendTouchEvent('down', x, y);
    },

    // 鼠标移动
    handleMouseMove(event) {
      if (!this.isMouseDown) return;
      event.preventDefault();

      // 只记录位置，不发送消息（减少网络传输，保证视频流畅）
      const { x, y } = this.getDeviceCoordinates(event);
      this.lastX = x;
      this.lastY = y;
    },

    // 鼠标抬起
    handleMouseUp(event) {
      if (!this.isMouseDown) return;
      event.preventDefault();

      const { x, y } = this.getDeviceCoordinates(event);
      this.sendTouchEvent('up', x, y);
      this.isMouseDown = false;
    },

    // 鼠标离开
    handleMouseLeave(event) {
      if (!this.isMouseDown) return;
      event.preventDefault();

      const { x, y } = this.getDeviceCoordinates(event);
      this.sendTouchEvent('up', x, y);
      this.isMouseDown = false;
    },

    // 触摸开始（移动设备）
    handleTouchStart(event) {
      event.preventDefault();
      this.isMouseDown = true;
      const { x, y } = this.getDeviceCoordinates(event);
      this.lastX = x;
      this.lastY = y;
      this.sendTouchEvent('down', x, y);
    },

    // 触摸移动
    handleTouchMove(event) {
      if (!this.isMouseDown) return;
      event.preventDefault();

      const { x, y } = this.getDeviceCoordinates(event);
      if (Math.abs(x - this.lastX) > 5 || Math.abs(y - this.lastY) > 5) {
        this.sendTouchEvent('move', x, y);
        this.lastX = x;
        this.lastY = y;
      }
    },

    // 触摸结束
    handleTouchEnd(event) {
      if (!this.isMouseDown) return;
      event.preventDefault();

      const { x, y } = this.getDeviceCoordinates(event);
      this.sendTouchEvent('up', x, y);
      this.isMouseDown = false;
    }
  }
};
</script>

<style scoped>
.screen-mirror-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1a1a1a;
  color: #ffffff;
}

/* 工具栏样式 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #404040;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.device-info h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.device-serial {
  font-size: 14px;
  color: #999999;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.status-indicator::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.connected {
  background-color: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.status-indicator.connected::before {
  background-color: #67c23a;
  animation: pulse 2s infinite;
}

.status-indicator.connecting {
  background-color: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
}

.status-indicator.connecting::before {
  background-color: #e6a23c;
  animation: pulse 1s infinite;
}

.status-indicator.disconnected,
.status-indicator.error {
  background-color: rgba(245, 108, 108, 0.2);
  color: #f56c6c;
}

.status-indicator.disconnected::before,
.status-indicator.error::before {
  background-color: #f56c6c;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 投屏显示区域 */
.screen-display-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: hidden;
  position: relative;
}

.screen-display {
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000000;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.screen-display.hidden {
  display: none;
}

.screen-video {
  max-width: 100%;
  max-height: calc(100vh - 120px);
  object-fit: contain;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

/* 加载状态 */
.loading-container,
.error-container,
.disconnected-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  color: #ffffff;
}

.loading-spinner {
  width: 64px;
  height: 64px;
  border: 4px solid #404040;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container p,
.error-container p,
.disconnected-container p {
  font-size: 16px;
  color: #999999;
  margin: 0;
}

.error-container h3,
.disconnected-container h3 {
  margin: 0;
  font-size: 24px;
  color: #ffffff;
}

.error-container svg,
.disconnected-container svg {
  color: #f56c6c;
}

.disconnected-container svg {
  color: #909399;
}

/* 按钮样式调整 */
.toolbar-actions .el-button {
  border-radius: 6px;
  transition: all 0.3s ease;
}

.toolbar-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
