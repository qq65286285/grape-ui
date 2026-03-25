<template>
  <div class="my-test-cases-container">
    <div class="page-card">
      <div class="page-header">
        <h1 class="page-title">执行详情</h1>
      </div>
      
      <!-- 查询表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用例编号">
          <el-input v-model="searchForm.caseNumber" placeholder="请输入用例编号" />
        </el-form-item>
        <el-form-item label="用例标题">
          <el-input v-model="searchForm.title" placeholder="请输入用例标题" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="请选择优先级">
            <el-option label="高" value="3" />
            <el-option label="中" value="2" />
            <el-option label="低" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="searchForm.executeStatus" placeholder="请选择执行状态">
            <el-option label="未执行" value="0" />
            <el-option label="通过" value="1" />
            <el-option label="失败" value="2" />
            <el-option label="阻塞" value="3" />
            <el-option label="跳过" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 测试用例表格 -->
      <el-table 
        :data="filteredTestCases" 
        style="width: 100%" 
        border
        stripe
        :loading="loading"
        highlight-current-row
      >
        <el-table-column prop="caseNumber" label="用例编号" min-width="120" />
        <el-table-column prop="title" label="用例标题" min-width="200" />
        <el-table-column prop="description" label="用例描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="scope">
            <el-tag 
              :type="getPriorityType(scope.row.priority)"
            >
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="executeStatus" label="执行状态" width="120">
          <template #default="scope">
            <el-tag 
              :type="getExecuteStatusType(scope.row.executeStatus)"
            >
              {{ getExecuteStatusText(scope.row.executeStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="executeTestCase(scope.row)"
              icon="el-icon-s-order"
            >
              执行
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              @click="showHistory(scope.row)"
              icon="el-icon-time"
              style="margin-left: 8px"
            >
              历史
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 空状态 -->
      <div v-if="!loading && filteredTestCases.length === 0" class="empty-state">
        <el-empty description="暂无测试用例" />
      </div>
    </div>
    
    <!-- 历史记录对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="执行历史记录"
      width="80%"
    >
      <div v-if="historyLoading" class="loading-state">
        <el-loading-spinner></el-loading-spinner>
        <p>加载中...</p>
      </div>
      <el-table v-else :data="historyRecords" style="width: 100%" border>
        <el-table-column prop="executeNo" label="执行编号" width="200" />
        <el-table-column prop="executeRound" label="执行轮次" width="100" />
        <el-table-column prop="executeTime" label="执行时间" width="200">
          <template #default="scope">
            {{ formatDate(scope.row.executeTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="executeStatus" label="执行状态">
          <template #default="scope">
            <el-tag :type="getExecuteStatusType(scope.row.executeStatus)">
              {{ getExecuteStatusText(scope.row.executeStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="actualResult" label="实际结果" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewRecordDetail(scope.row.id)"
              icon="el-icon-view"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="执行记录详情"
      width="90%"
    >
      <div v-if="detailLoading" class="loading-state">
        <el-loading-spinner></el-loading-spinner>
        <p>加载中...</p>
      </div>
      <div v-if="currentRecord" class="record-detail">
        <!-- 基本信息 -->
        <el-form label-width="120px" class="detail-form">
          <el-form-item label="执行编号">
            <span class="detail-info">{{ currentRecord.executeNo }}</span>
          </el-form-item>
          <el-form-item label="执行轮次">
            <span class="detail-info">{{ currentRecord.executeRound }}</span>
          </el-form-item>
          <el-form-item label="执行时间">
            <span class="detail-info">{{ formatDate(currentRecord.executeTime) }}</span>
          </el-form-item>
          <el-form-item label="执行状态">
            <el-tag :type="getExecuteStatusType(currentRecord.executeStatus)">
              {{ getExecuteStatusText(currentRecord.executeStatus) }}
            </el-tag>
          </el-form-item>
          <el-form-item label="实际结果">
            <div class="detail-description">{{ currentRecord.actualResult }}</div>
          </el-form-item>
          <el-form-item label="执行环境">
            <div class="detail-description">{{ currentRecord.environmentSnapshot }}</div>
          </el-form-item>
          <el-form-item label="备注">
            <div class="detail-description">{{ currentRecord.remark }}</div>
          </el-form-item>
        </el-form>
        
        <!-- 测试步骤 -->
        <div class="steps-section" v-if="currentSteps.length > 0">
          <h3>测试步骤</h3>
          <el-table :data="currentSteps" style="width: 100%" border>
            <el-table-column prop="step.stepNo" label="步骤序号" width="100" />
            <el-table-column prop="step.stepDescription" label="步骤描述" />
            <el-table-column prop="step.expectedResult" label="预期结果" />
            <el-table-column prop="step.actualResult" label="实际结果" />
            <el-table-column prop="step.executeStatus" label="执行状态" width="120">
              <template #default="scope">
                <el-tag :type="getExecuteStatusType(scope.row.step.executeStatus)">
                  {{ getExecuteStatusText(scope.row.step.executeStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="附件" width="200">
              <template #default="scope">
                <div v-if="scope.row.attachments && scope.row.attachments.length > 0">
                  <el-tag 
                    v-for="(attachment, index) in scope.row.attachments" 
                    :key="index" 
                    type="info" 
                    style="margin-right: 8px; margin-bottom: 8px; cursor: pointer"
                    @click="downloadAttachment(attachment)"
                  >
                    {{ attachment.fileName }}
                  </el-tag>
                </div>
                <span v-else>无</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div v-else class="empty-state">
        <el-empty description="暂无记录详情" />
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      testCases: [], // 测试用例列表
      loading: false, // 加载状态
      searchForm: {
        caseNumber: '',
        title: '',
        priority: '',
        executeStatus: ''
      },
      planId: '', // 测试计划ID
      // 历史记录相关
      historyDialogVisible: false,
      historyLoading: false,
      historyRecords: [],
      currentSnapshotId: null,
      // 详情对话框相关
      detailDialogVisible: false,
      detailLoading: false,
      currentRecord: null,
      currentSteps: []
    };
  },
  computed: {
    // 过滤后的测试用例列表
    filteredTestCases() {
      let result = [...this.testCases];
      
      // 按用例编号筛选
      if (this.searchForm.caseNumber) {
        result = result.filter(item => 
          item.caseNumber.toLowerCase().includes(this.searchForm.caseNumber.toLowerCase())
        );
      }
      
      // 按用例标题筛选
      if (this.searchForm.title) {
        result = result.filter(item => 
          item.title.toLowerCase().includes(this.searchForm.title.toLowerCase())
        );
      }
      
      // 按优先级筛选
      if (this.searchForm.priority) {
        result = result.filter(item => 
          item.priority === parseInt(this.searchForm.priority)
        );
      }
      
      // 按执行状态筛选
      if (this.searchForm.executeStatus) {
        result = result.filter(item => 
          item.executeStatus === parseInt(this.searchForm.executeStatus)
        );
      }
      
      return result;
    }
  },
  mounted() {
    // 获取路由参数中的测试计划ID
    this.planId = this.$route.query.planId;
    // 加载测试用例列表
    this.fetchTestCases();
  },
  methods: {
    // 获取测试用例列表
    async fetchTestCases() {
      this.loading = true;
      try {
        // 调用API获取测试用例列表
        // 这里需要根据实际的API接口来调整
        // 假设API是 POST /api/testPlanCaseSnapshot/listByPlanIdAndExecutor
        const response = await this.$http.post('/api/testPlanCaseSnapshot/listByPlanIdAndExecutor', {
          planId: this.planId
          // 这里不需要executorId，因为后端会自动获取当前登录用户的ID
        });
        
        if (response.data.code === 0) {
          this.testCases = response.data.data || [];
          console.log('获取到测试用例列表:', this.testCases);
        } else {
          this.$message.error('获取测试用例列表失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
        console.error('请求错误:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // 处理搜索
    handleSearch() {
      console.log('搜索条件:', this.searchForm);
      // 搜索逻辑已在computed中处理
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        caseNumber: '',
        title: '',
        priority: '',
        executeStatus: ''
      };
      console.log('重置搜索');
    },
    
    // 执行测试用例
    executeTestCase(testCase) {
      // 跳转到测试用例执行页面
      this.$router.push({
        path: '/test-case-execution',
        query: { caseId: testCase.id }
      });
    },
    
    // 显示历史记录
    async showHistory(testCase) {
      this.currentSnapshotId = testCase.id;
      this.historyLoading = true;
      try {
        // 调用API获取历史记录
        const response = await this.$http.get(`/api/testPlanExecuteRecord/listBySnapshotId/${testCase.id}`);
        
        if (response.data.code === 0) {
          this.historyRecords = response.data.data;
          this.historyDialogVisible = true;
        } else {
          this.$message.error('获取历史记录失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取历史记录失败：' + error.message);
        console.error('请求错误:', error);
      } finally {
        this.historyLoading = false;
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
    
    // 查看记录详情
    async viewRecordDetail(recordId) {
      this.detailLoading = true;
      try {
        // 调用API获取记录详情
        const response = await this.$http.get(`/api/testPlanExecuteRecord/getDetail/${recordId}`);
        
        if (response.data.code === 0) {
          this.currentRecord = response.data.data.executeRecord;
          this.currentSteps = response.data.data.steps || [];
          this.detailDialogVisible = true;
        } else {
          this.$message.error('获取记录详情失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('获取记录详情失败：' + error.message);
        console.error('请求错误:', error);
      } finally {
        this.detailLoading = false;
      }
    },
    
    // 下载附件
    async downloadAttachment(attachment) {
      try {
        // 调用接口获取文件的URL
        const response = await this.$http.get('/api/fileInfo/getObjectUrl', {
          params: {
            objName: attachment.storagePath
          }
        });
        
        if (response.data.code === 0) {
          const fileUrl = response.data.data;
          console.log('文件URL:', fileUrl);
          
          // 创建a标签下载文件
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = attachment.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          this.$message.error('获取文件下载链接失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('下载附件失败：' + error.message);
        console.error('下载错误:', error);
      }
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
    }
  }
};
</script>

<style scoped>
.my-test-cases-container {
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

.search-form {
  margin-bottom: 24px;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.search-form:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.search-form :deep(.el-select) {
  width: 120px;
  margin-right: 16px;
}

.search-form :deep(.el-input) {
  width: 180px;
  margin-right: 16px;
}

.search-form :deep(.el-form-item) {
  margin-right: 16px;
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

:deep(.el-table):hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* 空状态样式 */
.empty-state {
  padding: 40px 0;
  text-align: center;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>