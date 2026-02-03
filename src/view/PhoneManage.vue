<template>
  <div class="execution-container">
    <!-- 树形菜单 -->
  <div class="phone-list">
    <div v-if="phoneList && phoneList.length > 0">
      <el-table 
        :data="phoneList" 
        highlight-current-row
        @current-change="handlePhoneSelect"
        style="width: 100%">
        <el-table-column prop="name" label="手机列表" width="180"></el-table-column>
        <el-table-column prop="id" label="ID" width="180" v-if="false"></el-table-column>
      </el-table>
      <div class="button-group">
        <el-button type="primary" @click="syncDevices" size="medium">同步设备</el-button>
      </div>
      <!-- 隐藏的文件输入框 -->
      <input 
        ref="fileInput" 
        type="file" 
        accept="image/*" 
        @change="handleFileUpload" 
        style="display: none;"
      />
    </div>
    <div v-else class="no-phone-message">
      请添加手机
    </div>
  </div>

    <!-- 内容区域 -->
    <div class="content">
      <div v-if="selectedPhoneDetail" class="phone-detail-container">
        <div class="phone-info">
          <div class="detail-header">
            <h2>{{ selectedPhoneDetail.name }} 详细信息</h2>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{ selectedPhoneDetail.id }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ selectedPhoneDetail.name }}</el-descriptions-item>
            <el-descriptions-item label="IP地址">{{ selectedPhoneDetail.wifiAddress }}</el-descriptions-item>
            <el-descriptions-item label="序列号">{{ selectedPhoneDetail.devicesSerialNumber }}</el-descriptions-item>
            <el-descriptions-item label="制造商">{{ selectedPhoneDetail.devicesManufacturer }}</el-descriptions-item>
            <el-descriptions-item label="品牌">{{ selectedPhoneDetail.devicesBrand }}</el-descriptions-item>
            <el-descriptions-item label="Android版本">{{ selectedPhoneDetail.androidVersion }}</el-descriptions-item>
            <el-descriptions-item label="CPU信息">{{ selectedPhoneDetail.cpuInfo }}</el-descriptions-item>
            <el-descriptions-item label="内存信息">{{ selectedPhoneDetail.memoryInfo }}</el-descriptions-item>
            <el-descriptions-item label="存储分析">{{ selectedPhoneDetail.storageAnalysis || '无' }}</el-descriptions-item>
            <el-descriptions-item label="在线状态">{{ selectedPhoneDetail.isOnline === 1 ? '在线' : '离线' }}</el-descriptions-item>
            <el-descriptions-item label="分辨率">{{ selectedPhoneDetail.resolution }}</el-descriptions-item>
          </el-descriptions>

          <!-- 设备图片移到详情下面 -->
          <div class="phone-images-below">
            <div class="image-container">
              <h3>设备图片</h3>
              <div class="image-wrapper" @mouseenter="showPreviewButton('device')" @mouseleave="hidePreviewButton">
                <img 
                  v-if="getFullImageUrl(selectedPhoneDetail.deviceIconUrl)" 
                  :src="getFullImageUrl(selectedPhoneDetail.deviceIconUrl)" 
                  alt="设备图片" 
                  class="device-image"
                  @error="handleImageError"
                />
                <div v-else class="no-image">暂无设备图片</div>
                <div v-if="previewButtonVisible === 'device' && getFullImageUrl(selectedPhoneDetail.deviceIconUrl)" class="preview-button" @click="previewImage(getFullImageUrl(selectedPhoneDetail.deviceIconUrl))">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
              </div>
              <div class="image-actions">
                <el-button type="danger" size="small" @click="triggerFileUpload">上传设备图片</el-button>
              </div>
            </div>
            
            <div class="image-container">
              <h3>品牌图片</h3>
              <div class="image-wrapper" @mouseenter="showPreviewButton('brand')" @mouseleave="hidePreviewButton">
                <img 
                  v-if="getFullImageUrl(selectedPhoneDetail.brandIconUrl)" 
                  :src="getFullImageUrl(selectedPhoneDetail.brandIconUrl)" 
                  alt="品牌图片" 
                  class="brand-image"
                  @error="handleImageError"
                />
                <div v-else class="no-image">暂无品牌图片</div>
                <div v-if="previewButtonVisible === 'brand' && getFullImageUrl(selectedPhoneDetail.brandIconUrl)" class="preview-button" @click="previewImage(getFullImageUrl(selectedPhoneDetail.brandIconUrl))">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </div>
              </div>
              <div class="image-actions">
                <el-button type="danger" size="small" @click="triggerFileUpload('brand')">上传品牌图片</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-selection">
        <h1>手机详情</h1>
        <p>请选择一个手机查看详情</p>
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
      previewButtonVisible: null, // 控制预览按钮显示，值为 'device' 或 'brand'
      uploadType: null, // 控制上传类型，值为 'device' 或 'brand'
    };    
  },
  methods: {
    // 获取手机数据
    async fetchPhoneList() {
      try {
        const response = await this.$http.get('/api/deviceInfo/list');
        if (response.data.code === 0) {
          const newPhoneList = response.data.data.map(item => ({
            id: item.id,
            name: item.devicesName,
            wifiAddress: item.wifiAddress,
            devicesSerialNumber: item.devicesSerialNumber,
            devicesManufacturer: item.devicesManufacturer,
            devicesBrand: item.devicesBrand,
            androidVersion: item.androidVersion,
            cpuInfo: item.cpuInfo,
            memoryInfo: item.memoryInfo,
            storageAnalysis: item.storageAnalysis,
            deviceIconId: item.deviceIconId,
            brandIconId: item.brandIconId,
            deviceIconUrl: item.deviceIconUrl, // 添加设备图片URL
            brandIconUrl: item.brandIconUrl,   // 添加品牌图片URL
            isOnline: item.isOnline,
            resolution: item.resolution
          }));
          
          // 保存当前选中的手机ID
          const selectedPhoneId = this.selectedPhone ? this.selectedPhone.id : null;
          
          // 更新手机列表
          this.phoneList = newPhoneList;
          
          // 如果之前有选中的手机，在新列表中找到并重新选中
          if (selectedPhoneId) {
            const selectedPhone = newPhoneList.find(phone => phone.id === selectedPhoneId);
            if (selectedPhone) {
              this.selectedPhone = selectedPhone;
              this.selectedPhoneDetail = selectedPhone;
            }
          }
        } else {
          this.$message.error('获取列表失败：' + response.data);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    // 同步设备
    async syncDevices() {
      try {
        const response = await this.$http.post('/api/deviceInfo/syncDeviceStatus');
        if (response.data.code === 0) {
          this.$message.success('设备同步成功');
          this.fetchPhoneList(); // 更新列表
        } else {
          this.$message.error('同步失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('同步请求失败：' + error.message);
      }
    },

    // 处理手机选择事件
    handlePhoneSelect(phone) {
      this.selectedPhone = phone;
      this.selectedPhoneDetail = phone; // 同步更新详情数据

      console.log('选择的手机：', phone);
    },

    // 获取完整图片URL
    getFullImageUrl(url) {
      if (!url) return '';
      return url;
    },

    // 图片加载失败处理
    handleImageError(event) {
      console.log('图片加载失败:', event);
      // 隐藏加载失败的图片
      event.target.style.display = 'none';
    },

    // 显示预览按钮
    showPreviewButton(type) {
      this.previewButtonVisible = type;
    },

    // 隐藏预览按钮
    hidePreviewButton() {
      this.previewButtonVisible = null;
    },

    // 预览图片
    previewImage(imageUrl) {
      // 创建一个新窗口全屏预览图片
      const previewWindow = window.open('', '_blank', 'fullscreen=yes,width=1000,height=800');
      if (previewWindow) {
        previewWindow.document.write(`
          <html>
            <head>
              <title>图片预览</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  background-color: #000;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  overflow: hidden;
                }
                img {
                  max-width: 100%;
                  max-height: 100vh;
                  object-fit: contain;
                }
                .close-button {
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background-color: rgba(255, 255, 255, 0.2);
                  color: white;
                  border: none;
                  border-radius: 50%;
                  width: 40px;
                  height: 40px;
                  font-size: 20px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: background-color 0.3s ease;
                }
                .close-button:hover {
                  background-color: rgba(255, 255, 255, 0.4);
                }
              </style>
            </head>
            <body>
              <button class="close-button" onclick="window.close()">&times;</button>
              <img src="${imageUrl}" alt="预览图片">
            </body>
          </html>
        `);
        previewWindow.document.close();
      }
    },

    // 新增手机
    async addPhone() {
      const phoneName = prompt('请输入手机名称');
      if (phoneName) {
        try {
          const response = await this.$http.post('/api/phone/save', { name: phoneName });
          if (response.data.code === 0) {
            this.$message.success('手机新增成功');
            this.fetchPhoneList(); // 更新列表
          } else {
            this.$message.error('新增失败：' + response.data.message);
          }
        } catch (error) {
          this.$message.error('请求失败：' + error.message);
        }
      }
    },

    // 删除手机
    async deletePhone() {
      if (!this.selectedPhone) {
        this.$message.warning('请先选择一个手机');
        return;
      }
      try {
        const response = await this.$http.delete(`/api/phone/remove/${this.selectedPhone.id}`);
        if (response.data.code === 0) {
          this.$message.success('手机删除成功');
          this.fetchPhoneList(); // 更新列表
        } else {
          this.$message.error('删除失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },
    
    // 触发文件选择
    triggerFileUpload(type = 'device') {
      this.uploadType = type;
      this.$refs.fileInput.click();
    },
    
    // 处理文件上传
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // 保存当前选中的手机ID
      const currentPhoneId = this.selectedPhone.id;

      // 创建 FormData 对象
      const formData = new FormData();
      formData.append('file', file);
      formData.append('deviceId', currentPhoneId);
      try {
        // 根据上传类型选择不同的接口
        const apiUrl = this.uploadType === 'brand' ? '/api/deviceInfo/updateBrandImg' : '/api/deviceInfo/updateImg';

        // 使用正确的配置上传文件
        const response = await this.$http({
          method: 'post',
          url: apiUrl,
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.code === 0) {
          this.$message.success(this.uploadType === 'brand' ? '品牌图片上传成功' : '设备图片上传成功');
          // 重新获取列表以更新图片
          await this.fetchPhoneList();

          // 确保重新选中当前手机
          if (currentPhoneId) {
            const phone = this.phoneList.find(p => p.id === currentPhoneId);
            if (phone) {
              this.selectedPhone = phone;
              this.selectedPhoneDetail = phone;
            }
          }
        } else {
          this.$message.error('图片上传失败：' + response.data.message);
        }
      } catch (error) {
        console.error('上传错误详情:', error);
        this.$message.error('上传失败：' + (error.response?.data?.message || error.message));
      } finally {
        // 清空文件输入框
        event.target.value = '';
        // 清空上传类型
        this.uploadType = null;
      }
    }
  },
 mounted() {
    this.fetchPhoneList(); // 页面加载时获取手机列表数据
  },
};
</script>

<style scoped>
/* 整体布局样式 */
.execution-container {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
}

/* 左侧手机列表面板 */
.phone-list {
  width: 300px;
  background-color: #ffffff;
  border-right: 1px solid #e4e7ed;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  padding: 24px;
  transition: all 0.3s ease;
}

/* 右侧内容区域 */
.content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

/* 表格样式美化 */
.phone-list .el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.phone-list .el-table th {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #303133;
}

.phone-list .el-table tr:hover {
  background-color: #f5f7fa;
}

.phone-list .el-table__row.current-row {
  background-color: #ecf5ff !important;
}

/* 按钮区域样式 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  align-items: stretch;
}

.button-group .el-button {
  width: 100%;
  min-width: 200px;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.phone-list .el-button {
  transition: all 0.3s ease;
  border-radius: 6px;
}

.phone-list .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 无手机消息样式 */
.no-phone-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
  font-size: 18px;
  text-align: center;
  border: 2px dashed #e4e7ed;
  border-radius: 12px;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
}

.no-phone-message:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

/* 详情区域样式 */
.phone-detail-container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  padding: 24px;
  transition: all 0.3s ease;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.phone-info h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.detail-header .el-button {
  transition: all 0.3s ease;
  border-radius: 6px;
}

.detail-header .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 描述列表样式 */
.phone-info .el-descriptions {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
}

.phone-info .el-descriptions__header {
  font-weight: 600;
  color: #303133;
}

.phone-info .el-descriptions__body {
  background-color: #f9f9f9;
}

.phone-info .el-descriptions__cell {
  padding: 12px 16px;
}

.phone-info .el-descriptions__label {
  font-weight: 500;
  color: #606266;
  width: 120px;
  min-width: 120px;
  max-width: 150px;
}

.phone-info .el-descriptions__content {
  flex: 1;
  color: #303133;
}

/* 图片展示区域样式 */
.phone-images-below {
  display: flex;
  gap: 24px;
  margin-top: 30px;
}

.image-container {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.image-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.image-container h3 {
  margin-bottom: 16px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.image-actions {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.image-actions .el-button {
  transition: all 0.3s ease;
  border-radius: 6px;
}

.image-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-wrapper {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.preview-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.preview-button:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

.eye-icon {
  width: 24px;
  height: 24px;
  fill: white;
}

.image-wrapper:hover {
  border-color: #409eff;
}

.image-wrapper:hover img {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.device-image,
.brand-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.device-image:hover,
.brand-image:hover {
  transform: scale(1.05);
}

.no-image {
  color: #909399;
  font-size: 16px;
  font-weight: 400;
}

/* 无选择提示样式 */
.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  color: #909399;
  text-align: center;
  padding: 40px;
  transition: all 0.3s ease;
}

.no-selection:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.no-selection h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #606266;
}

.no-selection p {
  font-size: 16px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .execution-container {
    flex-direction: column;
  }

  .phone-list {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e4e7ed;
    padding: 16px;
  }

  .content {
    padding: 16px;
  }

  .phone-images-below {
    flex-direction: column;
    gap: 16px;
  }

  .phone-detail-container {
    padding: 16px;
  }

  .button-group {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .button-group .el-button {
    flex: 1;
    min-width: 120px;
  }
}

/* 过渡动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>