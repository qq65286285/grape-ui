<template>
  <div class="test-case-execution-container">
    <div class="page-card">
      <div class="page-header">
        <h1 class="page-title">执行测试用例</h1>
        <el-button type="primary" @click="goBack">返回</el-button>
      </div>
      
      <!-- 测试用例详情 -->
      <div class="case-detail" v-if="testCase">
        <el-form label-width="120px" class="case-form">
          <el-form-item label="用例编号">
            <span class="case-info">{{ testCase.caseNumber }}</span>
          </el-form-item>
          <el-form-item label="用例标题">
            <span class="case-info">{{ testCase.title }}</span>
          </el-form-item>
          <el-form-item label="用例描述">
            <div class="case-description">{{ testCase.description }}</div>
          </el-form-item>
          <el-form-item label="预期结果">
            <div class="case-description">{{ testCase.expectedResult }}</div>
          </el-form-item>
          <el-form-item label="模块">
            <span class="case-info">{{ testCase.module }}</span>
          </el-form-item>
          <el-form-item label="优先级">
            <el-tag :type="getPriorityType(testCase.priority)">
              {{ getPriorityText(testCase.priority) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="执行状态">
            <el-tag :type="getExecuteStatusType(testCase.executeStatus)">
              {{ getExecuteStatusText(testCase.executeStatus) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="执行次数">
            <span class="case-info">{{ testCase.executeCount }}</span>
          </el-form-item>
          <el-form-item label="最后执行时间">
            <span class="case-info">{{ formatDate(testCase.lastExecuteTime) }}</span>
          </el-form-item>
        </el-form>
        
        <!-- 测试步骤 -->
        <div class="steps-section" v-if="steps.length > 0">
          <h3>测试步骤</h3>
          <el-table :data="steps" style="width: 100%" border>
            <el-table-column prop="stepNumber" label="步骤序号" width="100" />
            <el-table-column prop="stepDescription" label="步骤描述" />
            <el-table-column prop="expectedResult" label="预期结果" />
            <el-table-column prop="actualResult" label="实际结果">
              <template v-slot="scope">
                <el-input v-model="scope.row.actualResult" placeholder="请输入实际结果" />
              </template>
            </el-table-column>
            <el-table-column prop="executeStatus" label="执行状态">
              <template v-slot="scope">
                <el-select v-model="scope.row.executeStatus" @change="updateExecutionStatus" placeholder="请选择执行状态">
                  <el-option label="未执行" value="0" />
                  <el-option label="通过" value="1" />
                  <el-option label="失败" value="2" />
                  <el-option label="阻塞" value="3" />
                  <el-option label="跳过" value="4" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="附件" width="200">
              <template v-slot="scope">
                <el-upload
                  class="upload-demo"
                  :action="''"
                  :on-change="(file, fileList) => handleStepFileChange(file, fileList, scope.row.id)"
                  :on-remove="(file, fileList) => handleStepFileRemove(file, fileList, scope.row.id)"
                  :file-list="stepFiles[scope.row.id] || []"
                  :auto-upload="false"
                >
                  <el-button size="small" type="primary">点击上传</el-button>
                  <template v-slot:tip>
                    <div class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
                  </template>
                </el-upload>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <!-- 执行区域 -->
        <div class="execution-section">
          <h3>执行操作</h3>
          <el-form :model="executionForm" class="execution-form">
            <el-form-item label="执行结果">
              <el-select v-model="executionForm.status" placeholder="请选择执行结果">
                <el-option label="通过" value="1" />
                <el-option label="失败" value="2" />
                <el-option label="阻塞" value="3" />
                <el-option label="跳过" value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="执行备注">
              <el-input v-model="executionForm.notes" type="textarea" rows="4" placeholder="请输入执行备注" />
            </el-form-item>
            <el-form-item label="附件">
              <el-upload
                class="upload-demo"
                action="#"
                :on-preview="handlePreview"
                :on-remove="handleRemove"
                :file-list="fileList"
                :auto-upload="false"
              >
                <el-button size="small" type="primary">点击上传</el-button>
                <template v-slot:tip>
            <div class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
          </template>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitExecution">提交执行结果</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <el-loading-spinner></el-loading-spinner>
        <p>加载中...</p>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!loading && !testCase" class="empty-state">
        <el-empty description="测试用例不存在" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      testCase: null, // 测试用例详情
      steps: [], // 测试步骤
      stepFiles: {}, // 步骤附件文件列表
      loading: false, // 加载状态
      executionForm: {
        status: '',
        notes: ''
      },
      fileList: [] // 上传文件列表
    };
  },
  mounted() {
    // 获取路由参数中的测试用例ID
    const caseId = this.$route.query.caseId;
    if (caseId) {
      // 加载测试用例详情
      this.fetchTestCaseDetail(caseId);
    }
  },
  methods: {
    // 获取测试用例详情
    async fetchTestCaseDetail(caseId) {
      this.loading = true;
      try {
        // 调用API获取测试用例详情
        const response = await this.$http.get(`/api/testPlanCaseSnapshot/getInfo/${caseId}`);
        
        if (response.data.code === 0) {
          this.testCase = response.data.data.snapshot;
          this.steps = response.data.data.steps || [];
          console.log('获取到测试用例详情:', this.testCase);
          console.log('获取到测试步骤:', this.steps);
          // 初始化执行结果
          this.updateExecutionStatus();
        } else {
          this.$message.error('获取测试用例详情失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取测试用例详情失败：' + error.message);
        console.error('请求错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 提交执行结果
    async submitExecution() {
      try {
        // 准备请求参数
        const requestData = {
          snapshotId: this.testCase.id,
          executeStatus: this.executionForm.status,
          steps: this.steps.map(step => ({
            id: step.id,
            actualResult: step.actualResult,
            executeStatus: step.executeStatus,
            attachments: (this.stepFiles[step.id] || []).map(file => file.name).filter(Boolean)
          }))
        };
        
        // 调用执行接口
        const response = await this.$http.post('/api/testPlanCaseSnapshot/execute', requestData);
        
        if (response.data.code === 0) {
          this.$message.success('执行结果提交成功');
          // 重置执行表单
          this.executionForm = {
            status: '',
            notes: ''
          };
          this.fileList = [];
          this.stepFiles = {};
        } else {
          this.$message.error('提交执行结果失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('提交执行结果失败：' + error.message);
        console.error('请求错误:', error);
      }
    },
    
    // 处理文件预览
    handlePreview(file) {
      console.log('预览文件:', file);
    },
    
    // 处理文件移除
    handleRemove(file) {
      console.log('移除文件:', file);
    },
    
    // 处理步骤文件选择
    handleStepFileChange(file, fileList, stepId) {
      // 确保stepFiles对象中存在该步骤的文件列表
      if (!this.stepFiles[stepId]) {
        this.stepFiles[stepId] = [];
      }
      
      // 上传文件
      this.uploadStepFile(file, stepId, fileList);
    },
    
    // 处理步骤文件移除
    handleStepFileRemove(file, fileList, stepId) {
      // 更新步骤文件列表
      this.stepFiles[stepId] = fileList;
    },
    
    // 上传步骤附件
    async uploadStepFile(file, stepId, fileList) {
      try {
        const formData = new FormData();
        formData.append('file', file.raw);
        formData.append('planId', this.testCase.planId); // 从测试用例中获取planId
        formData.append('attachmentType', 3); // 执行附件固定为3
        formData.append('relatedId', stepId); // 关联对象ID为步骤ID
        
        // 调用上传接口
        const response = await this.$http.post('/api/testPlanAttachment/uploadAndReturnId', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.code === 0) {
          // 上传成功，获取附件ID
          const attachmentId = response.data.data;
          console.log('附件上传成功，ID:', attachmentId);
          
          // 更新文件列表，添加附件ID
          this.stepFiles[stepId] = fileList.map(f => {
            if (f.uid === file.uid) {
              return { ...f, attachmentId };
            }
            return f;
          });
          
          this.$message.success('附件上传成功');
        } else {
          this.$message.error('附件上传失败：' + response.data.message);
          // 上传失败，从文件列表中移除该文件
          if (this.stepFiles[stepId]) {
            this.stepFiles[stepId] = this.stepFiles[stepId].filter(f => f.uid !== file.uid);
          }
        }
      } catch (error) {
        this.$message.error('附件上传失败：' + error.message);
        console.error('上传错误:', error);
        // 上传失败，从文件列表中移除该文件
        if (this.stepFiles[stepId]) {
          this.stepFiles[stepId] = this.stepFiles[stepId].filter(f => f.uid !== file.uid);
        }
      }
    },
    
    // 返回上一页
    goBack() {
      this.$router.back();
    },
    
    // 获取优先级类型
    getPriorityType(priority) {
      switch (priority) {
        case 1: return 'info';
        case 2: return 'warning';
        case 3: return 'danger';
        default: return '';
      }
    },
    
    // 获取优先级文本
    getPriorityText(priority) {
      switch (priority) {
        case 1: return '低';
        case 2: return '中';
        case 3: return '高';
        default: return '未知';
      }
    },
    
    // 获取执行状态类型
    getExecuteStatusType(status) {
      switch (status) {
        case 0: return 'info';      // 未执行
        case 1: return 'success';   // 通过
        case 2: return 'danger';    // 失败
        case 3: return 'warning';   // 阻塞
        case 4: return 'warning';   // 跳过
        default: return '';
      }
    },
    
    // 获取执行状态文本
    getExecuteStatusText(status) {
      switch (status) {
        case 0: return '未执行';
        case 1: return '通过';
        case 2: return '失败';
        case 3: return '阻塞';
        case 4: return '跳过';
        default: return '未知';
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    // 根据步骤执行状态更新整体执行结果
    updateExecutionStatus() {
      // 默认为成功
      let overallStatus = '1';
      
      // 检查步骤执行状态
      for (const step of this.steps) {
        const status = step.executeStatus;
        if (status === '2' || status === 2) {
          // 有步骤失败，整体为失败
          overallStatus = '2';
          break;
        } else if (status === '3' || status === 3) {
          // 有步骤阻塞，整体为阻塞
          overallStatus = '3';
        } else if (status === '4' || status === 4) {
          // 有步骤跳过，整体为跳过
          overallStatus = '4';
        }
      }
      
      // 更新执行表单的状态
      this.executionForm.status = overallStatus;
    }
  }
};
</script>

<style scoped>
.test-case-execution-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-card {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.case-detail {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.case-form {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
}

.case-info {
  font-size: 14px;
  color: #303133;
}

.case-description {
  font-size: 14px;
  color: #303133;
  line-height: 1.5;
  white-space: pre-wrap;
}

.execution-section {
  margin-top: 32px;
}

.steps-section {
  margin-top: 32px;
  margin-bottom: 32px;
}

.steps-section h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.execution-section h3 {
  margin: 0 0 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.execution-form {
  background-color: #f9f9f9;
  padding: 24px;
  border-radius: 8px;
}

.execution-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.upload-demo {
  margin-top: 8px;
}

.loading-state {
  text-align: center;
  padding: 40px 0;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.loading-state p {
  margin-top: 16px;
  color: #909399;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>