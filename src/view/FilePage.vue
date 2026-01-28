<template>
  <div >
    <!-- 标题行 -->
    <div class="header">
      <h1>文件-这样也还没空</h1>
      <div>
        <el-button type="primary" @click="handleUpload">上传文件</el-button>
      </div>
    </div>

    <!-- 文件上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="500px"
    >
      <el-upload
        class="upload-demo"
        action=""
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        :file-list="uploadFileList"
        accept="*"
      >
        <el-button type="primary">点击选择文件</el-button>
        <template #tip>
          <div class="el-upload__tip">
            请选择要上传的文件
          </div>
        </template>
      </el-upload>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploadLoading">
            上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 二维码对话框 -->
    <el-dialog
      v-model="qrcodeDialogVisible"
      title="文件二维码"
      width="400px"
    >
      <div class="qrcode-container">
        <div class="qrcode-image" v-if="qrcodeUrl">
          <img :src="qrcodeUrl" alt="文件二维码">
        </div>
        <div class="qrcode-loading" v-else>
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>生成二维码中...</span>
        </div>
        <div class="qrcode-url" v-if="fileUrl">
          <p>文件链接：</p>
          <el-input
            v-model="fileUrl"
            type="textarea"
            :rows="3"
            readonly
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="qrcodeDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
   

    <!-- 内容区域 -->
   

    <el-table :data="fileList.records" style="width: 100%">
      <el-table-column prop="fileName" label="文件名" width="180" />
      <el-table-column prop="fileExtension" label="文件类型" width="180" />
      <el-table-column label="文件大小">
        <template #default="scope">
          {{ formatFileSize(scope.row.fileSize) }}
        </template>
      </el-table-column>
      <el-table-column prop="downloadCount" label="下载次数" />
      <el-table-column prop="createdAt" label="上传时间" />
      <!-- 操作列 -->
      <el-table-column label="操作" width="200">
      <template #default="scope">
        <el-button type="text" @click="showQrcode(scope.row.storagePath)">文件二维码</el-button>
        <el-button type="text" @click="deleteFile(scope.row.id)" style="color: #f56c6c;">删除</el-button>
      </template>
      </el-table-column>
  </el-table>

    <!-- 分页 -->
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="fileList.totalRow"
      :page-size="fileList.pageSize"
      :current-page="fileList.pageNumber"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />


</div>
</template>
<!-- 表格 -->


<script>
import QRCode from 'qrcode';
import { Loading } from '@element-plus/icons-vue';

export default {
  components: {
    Loading
  },
  data() {
    return {
      fileList: {
        records: [], // 当前页的数据
        pageNumber: 0, // 当前页码
        pageSize: 0, // 每页条数
        totalPage: 0, // 总页数
        totalRow: 0, // 总条数
      },
      pagination: {
        pageNumber: 1, // 当前页码（默认第一页）
        pageSize: 20, // 每页条数（默认20条）
      },
      dialogVisible: false, // 控制对话框显示
      historyDialogVisible: false, // 控制历史版本对话框显示
      uploadDialogVisible: false, // 控制上传对话框显示
      qrcodeDialogVisible: false, // 控制二维码对话框显示
      uploadFileList: [], // 上传文件列表
      uploadLoading: false, // 上传加载状态
      selectedFile: null, // 选中的文件
      dialogTitle: "再说", // 对话框标题
      form: {
        id: 0,
        fileName: "",
        fileExtension: "",
        storagePath: "",
        fileSize: 0,
        uploaderId: 0,
        shareToken: 0,
        expireTime: 0,
        downloadCount: "",
        createdAt: "",
        isDeleted: "",
      }, // 表单数据
      isEditMode: false, // 是否为编辑模式
      historyList: [], // 历史版本数据
      qrcodeUrl: '', // 二维码图片 URL
      fileUrl: '', // 文件 URL
    };
  },
  methods: {
    // 打开新增对话框
    openDialog() {
      this.dialogTitle = "还没写";
      this.isEditMode = false;
      this.resetForm();
      this.dialogVisible = true;
    },

    // 打开编辑对话框
    editCase(row) {
      this.dialogTitle = "编辑测试用例";
      this.isEditMode = true;
      this.form = { ...row }; // 将当前行的数据填充到表单中
      this.dialogVisible = true;
    },

    // 保存用例
    async saveCase() {
      try {
        let response;
        if (this.isEditMode) {
          // 编辑模式，调用更新接口
          response = await this.$http.put("/api/cases/update", this.form);
        } else {
          // 新增模式，调用保存接口
          response = await this.$http.post("/api/cases/save", this.form);
        }

        if (response.data.code === 0) {
          this.$message.success("保存成功");
          this.dialogVisible = false; // 关闭对话框
          this.fetchCaseList(); // 重新加载用例列表
        } else {
          this.$message.error("保存失败：" + response.data.message);
        }
      } catch (error) {
        this.$message.error("请求失败：" + error.message);
      }
    },

    

  

    // 删除用例
    async deleteCase(id) {
      try {
        const response = await this.$http.delete(`/api/cases/remove/${id}`);
        if (response.data.code === 0) {
          this.$message.success("删除成功");
          this.fetchCaseList(); // 重新加载用例列表
        } else {
          this.$message.error("删除失败：" + response.data.message);
        }
      } catch (error) {
        this.$message.error("请求失败：" + error.message);
      }
    },

    // 获取用例列表
    async fetchCaseList() {
      try {
        const response = await this.$http.get("/api/fileInfo/page", {
          params: {
            pageNumber: this.pagination.pageNumber,
            pageSize: this.pagination.pageSize,
          },
        });
        if (response.data.code === 0) {
          const { list, pageInfo } = response.data.data;

          this.fileList.records = list; // 当前页的数据
          this.fileList.pageNumber = pageInfo.current; // 当前页码
          this.fileList.pageSize = pageInfo.size; // 每页条数
          this.fileList.totalPage = Math.ceil(pageInfo.total / pageInfo.size); // 总页数
          this.fileList.totalRow = pageInfo.total; // 总条数
        }
      } catch (error) {
        this.$message.error("加载失败：" + error.message);
      }
    },

    // 刷新列表
    refreshList() {
      this.fetchCaseList();
      this.$message.success("刷新成功");
    },

    // 重置表单
    resetForm() {
      this.form = {
        id: 0,
        caseNumber: "",
        title: "",
        description: "",
        priority: 0,
        status: 0,
        version: 0,
        environmentId: 0,
        expectedResult: "",
        module: "",
        remark: "",
        createdBy: 0,
        createdAt: 0,
        updatedAt: 0,
        updatedBy: "string",
      };
    },

    // 处理每页条数变化
    handleSizeChange(pageSize) {
      this.pagination.pageSize = pageSize;
      this.fetchCaseList(); // 重新加载数据
    },

    // 处理页码变化
    handlePageChange(pageNumber) {
      this.pagination.pageNumber = pageNumber;
      this.fetchCaseList(); // 重新加载数据
    },

    // 打开上传对话框
    handleUpload() {
      this.uploadFileList = [];
      this.selectedFile = null;
      this.uploadDialogVisible = true;
    },

    // 处理文件选择
    handleFileChange(file, fileList) {
      this.uploadFileList = fileList;
      this.selectedFile = file.raw;
    },

    // 将文件转换为Base64字符串
    fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // 去掉data:image/xxx;base64,前缀
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
    },

    // 提交文件上传
    async submitUpload() {
      if (!this.selectedFile) {
        this.$message.error('请选择要上传的文件');
        return;
      }

      this.uploadLoading = true;
      try {
        // 将文件转换为Base64字符串
        const fileBase64 = await this.fileToBase64(this.selectedFile);

        // 调用上传接口，使用Base64字符串作为请求体
        const response = await this.$http.post('/api/fileInfo/upload', {
          file: fileBase64,
          fileName: this.selectedFile.name,
          fileSize: this.selectedFile.size,
          fileType: this.selectedFile.type
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data.code === 200) {
          this.$message.success('文件上传成功');
          this.uploadDialogVisible = false;
          this.fetchCaseList(); // 重新加载文件列表
        } else {
          this.$message.error('文件上传失败: ' + (response.data.message || '未知错误'));
        }
      } catch (error) {
        this.$message.error('文件上传失败: ' + (error.message || '网络错误'));
      } finally {
        this.uploadLoading = false;
      }
    },

    // 格式化文件大小，将字节转换为 MB
    formatFileSize(bytes) {
      if (bytes === 0) return '0 MB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // 删除文件
    async deleteFile(id) {
      try {
        const response = await this.$http.delete(`/api/fileInfo/delete/${id}`);
        if (response.data.code === 0) {
          this.$message.success('文件删除成功');
          this.fetchCaseList(); // 重新加载文件列表
        } else {
          this.$message.error('文件删除失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('删除失败：' + error.message);
      }
    },

    // 显示文件二维码
    async showQrcode(storagePath) {
      try {
        // 调用接口获取文件的 URL
        const response = await this.$http.get('/api/fileInfo/getObjectUrl', {
          params: {
            objName: storagePath
          }
        });
        
        if (response.data.code === 0) {
          const fileUrl = response.data.data;
          console.log('文件URL:', fileUrl);
          
          // 保存文件 URL
          this.fileUrl = fileUrl;
          
          // 生成二维码
          this.qrcodeUrl = '';
          this.qrcodeDialogVisible = true;
          
          // 使用 qrcode 库生成二维码
          QRCode.toDataURL(fileUrl, {
            width: 200,
            margin: 1
          })
          .then(url => {
            this.qrcodeUrl = url;
          })
          .catch(err => {
            console.error('生成二维码失败:', err);
            this.$message.error('生成二维码失败：' + err.message);
          });
        } else {
          this.$message.error('获取文件 URL 失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取文件 URL 失败：' + error.message);
      }
    }
  },
  mounted() {
    this.fetchCaseList(); // 组件加载时获取用例列表
  },
};
</script>

<style scoped>
/* 布局样式 */
.execution-container {
  display: flex;
}

.tree-menu {
  width: 250px;
  padding: 20px;
  border-right: 1px solid #e4e7ed;
}

.content {
  flex: 1;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-top: 20px;
}

/* 二维码容器样式 */
.qrcode-container {
  text-align: center;
  padding: 20px 0;
}

.qrcode-image {
  margin-bottom: 20px;
}

.qrcode-image img {
  max-width: 200px;
  height: auto;
}

.qrcode-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.qrcode-loading .is-loading {
  font-size: 48px;
  margin-bottom: 16px;
  color: #409eff;
}

.qrcode-url {
  margin-top: 20px;
  text-align: left;
}

.qrcode-url p {
  margin-bottom: 8px;
  font-weight: 500;
  color: #606266;
}
</style>
