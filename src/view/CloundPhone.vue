<template>
  <div class="execution-container">
    <!-- 内容区域 -->
    <div class="content">
      <!-- 新增的同步按钮 -->
      <div class="header-actions">
        <el-button 
          type="primary" 
          :loading="syncLoading" 
          @click="syncDeviceStatus"
          size="small"
        >
          {{ syncLoading ? '同步中...' : '同步设备状态' }}
        </el-button>
      </div>

      <div v-if="phoneList && phoneList.length > 0" class="device-grid">
        <div 
          v-for="device in phoneList" 
          :key="device.id" 
          class="device-card"
          @mouseenter="showDeviceTooltip(device, $event)"
          @mouseleave="hideDeviceTooltip"
        >
          <div class="device-info">
            <div class="device-content">
              <div class="device-image">
                <img :src="device.deviceIconUrl" :alt="device.name" v-if="device.deviceIconUrl">
                <div class="placeholder-image" v-else>📱</div>
              </div>
              <div class="device-details">    
                <div class="device-name">{{ device.name }}</div>
                <div class="device-specs">
                  <div>品牌: {{ device.devicesBrand }}</div>
                  <div>安卓版本: {{ device.androidVersion }}</div>
                  <div>设备制造商: {{ device.devicesManufacturer }}</div>
                  <div>分辨率: {{ device.resolution }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="device-sn">编号: {{ device.devicesSerialNumber }}</div>
          <div class="device-footer">
            <div class="device-status" :class="{ 'online': device.isOnline, 'offline': !device.isOnline }">
              <!-- 在线状态SVG图标 -->
              <svg v-if="device.isOnline" class="status-icon online-icon" viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M48.505263 692.547368c-10.778947-2.694737-21.557895 2.694737-24.252631 13.473685-2.694737 10.778947 2.694737 21.557895 13.473684 24.252631 110.484211 32.336842 194.021053 123.957895 220.968421 234.442105 2.694737 8.084211 10.778947 13.473685 18.863158 13.473685h5.389473c10.778947-2.694737 16.168421-13.473684 13.473685-21.557895-29.642105-126.652632-123.957895-226.357895-247.91579-264.084211zM45.810526 447.326316c-10.778947-2.694737-18.863158 5.389474-21.557894 16.168421-2.694737 10.778947 5.389474 18.863158 16.168421 21.557895 239.831579 40.421053 428.463158 239.831579 460.8 482.357894 0 10.778947 8.084211 16.168421 18.863158 16.168421h2.694736c10.778947 0 18.863158-10.778947 16.168421-21.557894-32.336842-258.694737-234.442105-471.578947-493.136842-514.694737z" fill="#101010" p-id="5069"></path>
                <path d="M45.810526 223.663158c-10.778947 0-18.863158 8.084211-21.557894 16.168421 0 10.778947 5.389474 18.863158 16.168421 21.557895 361.094737 43.115789 646.736842 336.842105 679.073684 697.936842 0 10.778947 8.084211 16.168421 18.863158 16.168421h2.694737c10.778947 0 18.863158-10.778947 16.168421-21.557895C722.189474 579.368421 423.073684 269.473684 45.810526 223.663158zM994.357895 45.810526c-8.084211-8.084211-18.863158-8.084211-26.947369 0l-269.473684 269.473685-150.905263-150.905264c-8.084211-8.084211-18.863158-8.084211-26.947368 0s-8.084211 18.863158 0 26.947369l164.378947 164.378947c2.694737 2.694737 8.084211 5.389474 13.473684 5.389474s10.778947-2.694737 13.473684-5.389474L994.357895 72.757895c5.389474-5.389474 5.389474-18.863158 0-26.947369z" fill="#101010" p-id="5070"></path>
              </svg>
              <!-- 离线状态SVG图标 -->
              <svg v-else class="status-icon offline-icon" viewBox="0 0 1024 1024" width="16" height="16">
                <path d="M67.368421 689.852632c-10.778947-2.694737-21.557895 2.694737-24.252632 13.473684-2.694737 10.778947 2.694737 21.557895 13.473685 24.252631 115.873684 35.031579 202.105263 129.347368 229.052631 245.221053 2.694737 8.084211 10.778947 13.473684 18.863158 13.473684h5.389474c10.778947-2.694737 16.168421-13.473684 13.473684-21.557895-32.336842-132.042105-129.347368-237.136842-256-274.863157zM64.673684 433.852632c-10.778947-2.694737-18.863158 5.389474-21.557895 16.168421-2.694737 10.778947 5.389474 18.863158 16.168422 21.557894 250.610526 43.115789 447.326316 247.915789 476.968421 501.221053 0 10.778947 8.084211 16.168421 18.863157 16.168421h2.694737c10.778947 0 18.863158-10.778947 16.168421-21.557895-32.336842-266.778947-242.526316-487.747368-509.305263-533.557894z" fill="#101010" p-id="6050"></path>
                <path d="M64.673684 202.105263c-10.778947 0-21.557895 8.084211-21.557895 16.168421s5.389474 18.863158 16.168422 21.557895c374.568421 45.810526 670.989474 350.315789 706.021052 727.578947 0 10.778947 8.084211 16.168421 18.863158 16.168421h2.694737c10.778947 0 18.863158-10.778947 16.168421-21.557894C765.305263 571.284211 455.410526 250.610526 64.673684 202.105263zM843.452632 202.105263l134.736842-134.736842c8.084211-8.084211 8.084211-18.863158 0-26.947368s-18.863158-8.084211-26.947369 0l-134.736842 134.736842-134.736842-134.736842c-8.084211-8.084211-18.863158-8.084211-26.947368 0s-8.084211 18.863158 0 26.947368l134.736842 134.736842-134.736842 134.736842c-8.084211 8.084211-8.084211 18.863158 0 26.947369 2.694737 2.694737 8.084211 5.389474 13.473684 5.389473s10.778947-2.694737 13.473684-5.389473l134.736842-134.736842 134.736842 134.736842c2.694737 2.694737 8.084211 5.389474 13.473684 5.389473s10.778947-2.694737 13.473685-5.389473c8.084211-8.084211 8.084211-18.863158 0-26.947369l-134.736842-134.736842z" fill="#101010" p-id="6051"></path>
              </svg>
              <span>{{ device.isOnline ? '在线' : '离线' }}</span>
            </div>
            <!-- 修改立即使用按钮，添加点击事件 -->
            <el-button type="primary" size="small" @click="openDevice(device)">立即使用</el-button>
          </div>
        </div>
      </div>
      <div v-else class="no-data">
        暂无设备数据
      </div>
      
      <!-- 悬浮展示-->
      <div v-if="tooltipVisible && tooltipDevice" class="device-tooltip" :style="tooltipStyle">
        <div class="tooltip-header">
          <h3>{{ tooltipDevice.name }}</h3>
        </div>
        <div class="tooltip-content">
          <div class="tooltip-row">
            <span class="label">wifi Mac地址:</span>
            <span>{{ tooltipDevice.wifiAddress }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">设备序列号:</span>
            <span>{{ tooltipDevice.devicesSerialNumber }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">设备制造商:</span>
            <span>{{ tooltipDevice.devicesManufacturer }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">品牌:</span>
            <span>{{ tooltipDevice.devicesBrand }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">安卓系统版本:</span>
            <span>{{ tooltipDevice.androidVersion }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">CPU详细信息:</span>
            <span>{{ tooltipDevice.cpuInfo }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">存储分析详情:</span>
            <span>{{ tooltipDevice.storageAnalysis }}</span>
          </div>
          <div class="tooltip-row">
            <span class="label">分辨率:</span>
            <span>{{ tooltipDevice.resolution }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PhoneManage',
  data() {  
    return {
      phoneList: [], // 直接使用列表数据
      selectedPhone: null, // 当前选择的手机
      selectedPhoneDetail: null, // 添加这一行
      tooltipDeviceId: null,  // 当前显示悬浮框的设备ID
      tooltipDevice: null,    // 当前提示的设备
      tooltipStyle: {         // 提示框位置样式
        top: '0px',
        left: '0px'
      },
      syncLoading: false // 同步按钮loading状态
    };    
  },
  computed: {
    // 计算属性：根据当前设备ID判断是否显示悬浮框
    tooltipVisible() {
      return this.tooltipDeviceId !== null;
    }
  },
  methods: {
    // 获取手机数据
    async fetchPhoneList() {
      try {
        const response = await this.$http.post('/api/deviceInfo/page', {
          pageNumber: 1
        });
        if (response.data.code === 0) {
          this.phoneList  = response.data.data.list.map(item  => ({
            id: item.id,
            name: item.devicesName,
            devicesBrand: item.devicesBrand,
            wifiAddress: item.wifiAddress,
            androidVersion: item.androidVersion,
            phoneNumber: item.phoneNumber || '',
            deviceIconUrl: item.deviceIconUrl,
            devicesSerialNumber: item.devicesSerialNumber,
            port: item.port || '',
            devicesManufacturer: item.devicesManufacturer,
            cpuInfo: item.cpuInfo,
            memoryInfo: item.memoryInfo,
            storageAnalysis: item.storageAnalysis,
            isOnline:item.isOnline,
            resolution:item.resolution,
          }));
        } else {
          this.$message.error('获取文件夹列表失败：' + response.data);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },
    // 显示设备详情提示框
    showDeviceTooltip(device, event) {
      this.tooltipDeviceId = device.id;
      this.tooltipDevice = device;
      
      // 计算悬浮框位置
      const cardRect = event.currentTarget.getBoundingClientRect();
      // 让悬浮框紧贴卡片右侧
      // fixed 定位是相对于视口的，不需要考虑滚动
      this.tooltipStyle = {
        top: cardRect.top + 'px',
        left: (cardRect.left + cardRect.width + 2) + 'px'
      };
    },
    
    // 隐藏提示框
    hideDeviceTooltip() {
      this.tooltipDeviceId = null;
      this.tooltipDevice = null;
    },

    // 同步设备状态
    async syncDeviceStatus() {
      this.syncLoading = true;
      try {
        const response = await this.$http.get('/api/deviceInfo/syncDeviceStatus');
        if (response.data.code === 0) {
          this.$message.success('设备状态同步成功');
          // 同步成功后重新获取设备列表
          await this.fetchPhoneList();
        } else {
          this.$message.error('同步失败：' + response.data.msg);
        }
      } catch (error) {
        this.$message.error('同步请求失败：' + error.message);
      } finally {
        this.syncLoading = false;
      }
    },

    async openDevice(device) {
  try {
    // 构建 adb connect 命令
    const ip = device.wifiAddress;
    const adbCommand = `adb connect ${ip}:5555`;
    
    console.log('复制 adb 命令:', adbCommand);
    
    // 复制到剪贴板
    await navigator.clipboard.writeText(adbCommand);
    
    // 显示成功提示
    this.$message.success(`已复制 adb 命令到剪贴板:\n${adbCommand}`);
  } catch (error) {
    console.error('复制失败:', error);
    this.$message.error('复制命令失败：' + error.message);
  }
}
  },
  mounted() {
    this.fetchPhoneList(); // 页面加载时获取手机列表数据
  },
};
</script>

<style scoped>
/* 容器样式 */
.execution-container {
  width: 100%;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 20px;
}

/* 内容区域 */
.content {
  max-width: 1400px;
  margin: 0 auto;
}

/* 头部操作区域 */
.header-actions {
  margin-bottom: 24px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

/* 设备网格布局 */
.device-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

/* 设备卡片样式 */
.device-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
}

.device-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.12);
}

/* 设备信息区域 */
.device-info {
  width: 100%;
}

.device-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

/* 设备图片 */
.device-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.device-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder-image {
  font-size: 40px;
  color: #909399;
}

/* 设备详情 */
.device-details {
  flex: 1;
}

.device-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.device-specs {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}

.device-specs div {
  margin-bottom: 4px;
}

/* 设备编号 */
.device-sn {
  font-size: 12px;
  color: #909399;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

/* 设备底部操作区域 */
.device-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

/* 设备状态 */
.device-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.status-icon {
  transition: all 0.3s ease;
}

.status-icon.online-icon path {
  fill: #67c23a;
}

.status-icon.offline-icon path {
  fill: #909399;
}

.device-status.online {
  color: #67c23a;
}

.device-status.offline {
  color: #909399;
}

/* 立即使用按钮 */
.device-footer .el-button {
  transition: all 0.3s ease;
}

.device-footer .el-button:hover {
  transform: scale(1.05);
}

/* 悬浮提示框 */
.device-tooltip {
  position: fixed;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 10000;
  min-width: 240px;
  max-width: 300px;
  transition: all 0.3s ease;
}

.tooltip-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.tooltip-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.tooltip-content {
  font-size: 13px;
  line-height: 1.6;
}

.tooltip-row {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.tooltip-row:last-child {
  margin-bottom: 0;
}

.tooltip-row .label {
  color: #909399;
  font-weight: 400;
}

.tooltip-row span:last-child {
  color: #303133;
  font-weight: 500;
}

/* 无数据状态 */
.no-data {
  text-align: center;
  padding: 80px 20px;
  color: #909399;
  font-size: 14px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .device-grid {
    grid-template-columns: 1fr;
  }
  
  .content {
    padding: 12px;
  }
  
  .device-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .device-image {
    margin-bottom: 12px;
  }
  
  .device-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .device-footer .el-button {
    width: 100%;
  }
}

/* 加载状态动画 */
.sync-loading {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>