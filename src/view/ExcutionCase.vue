<template>
  <div class="execution-container">
    <!-- 内容区域 -->
    <div class="content">
      <div class="header">
        <h1>测试计划</h1>
        <el-button type="primary" @click="openCreateDialog">新建测试计划</el-button>
      </div>
      
      <!-- 查询表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="计划名称">
          <el-input v-model="searchForm.planName" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planNo" placeholder="请输入计划编号" />
        </el-form-item>
        <el-form-item label="计划类型">
          <el-select v-model="searchForm.planType" placeholder="请选择计划类型">
            <el-option label="项目测试" value="1" />
            <el-option label="迭代测试" value="2" />
            <el-option label="专项测试" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="未开始" value="1" />
            <el-option label="进行中" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已暂停" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 测试计划表格 -->
      <el-table 
        :data="testPlans" 
        style="width: 100%" 
        border
        stripe
        :loading="loading"
        highlight-current-row
        @row-hover="handleRowHover"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="planNo" label="计划编号" min-width="120" />
        <el-table-column prop="planName" label="计划名称" min-width="180">
          <template #default="scope">
            <span class="plan-name">{{ scope.row.planName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="planType" label="计划类型" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getPlanTypeTagType(scope.row.planType)">
              {{ getPlanTypeLabel(scope.row.planType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="projectId" label="项目ID" width="100" align="center" />
        <el-table-column prop="iterationId" label="迭代ID" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ownerId" label="负责人" width="120">
          <template #default="scope">
            <span class="owner-name">{{ getUserName(scope.row.ownerId) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isTemplate" label="是否模板" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isTemplate === 1 ? 'success' : 'info'">
              {{ scope.row.isTemplate === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="150" align="center" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="150" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleView(scope.row)"
              icon="el-icon-view"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.current"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        />
      </div>
      
      <!-- 新建测试计划对话框 -->
      <el-dialog
        v-model="dialogVisible"
        title="新建测试计划"
        width="50%"
      >
        <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="120px">
          <el-form-item label="计划编号" prop="planNo">
            <el-input v-model="createForm.planNo" placeholder="请输入计划编号" />
          </el-form-item>
          <el-form-item label="计划名称" prop="planName">
            <el-input v-model="createForm.planName" placeholder="请输入计划名称" />
          </el-form-item>
          <el-form-item label="计划类型" prop="planType">
            <el-select v-model="createForm.planType" placeholder="请选择计划类型">
              <el-option label="项目测试" value="1" />
              <el-option label="迭代测试" value="2" />
              <el-option label="专项测试" value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="项目ID" prop="projectId">
            <el-input v-model.number="createForm.projectId" placeholder="请输入项目ID" />
          </el-form-item>
          <el-form-item label="迭代ID" prop="iterationId">
            <el-input v-model.number="createForm.iterationId" placeholder="请输入迭代ID" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="createForm.status" placeholder="请选择状态">
              <el-option label="未开始" value="1" />
              <el-option label="进行中" value="2" />
              <el-option label="已完成" value="3" />
              <el-option label="已暂停" value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="负责人" prop="ownerId">
            <el-select v-model="createForm.ownerId" placeholder="请选择负责人">
              <el-option 
                v-for="user in users" 
                :key="user.id" 
                :label="user.nickname || user.username" 
                :value="user.id" 
              />
            </el-select>
          </el-form-item>

          <el-form-item label="计划描述" prop="description">
            <el-input v-model="createForm.description" placeholder="请输入计划描述" type="textarea" />
          </el-form-item>
          <el-form-item label="测试范围" prop="testScope">
            <el-input v-model="createForm.testScope" placeholder="请输入测试范围" type="textarea" />
          </el-form-item>
          <el-form-item label="测试目标" prop="testTarget">
            <el-input v-model="createForm.testTarget" placeholder="请输入测试目标" type="textarea" />
          </el-form-item>
          <el-form-item label="测试策略" prop="testStrategy">
            <el-input v-model="createForm.testStrategy" placeholder="请输入测试策略" type="textarea" />
          </el-form-item>
          <el-form-item label="验收标准" prop="acceptanceCriteria">
            <el-input v-model="createForm.acceptanceCriteria" placeholder="请输入验收标准" type="textarea" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="submitForm">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 查看测试计划对话框 -->
      <el-dialog
        v-model="viewDialogVisible"
        title="查看测试计划"
        width="50%"
      >
        <el-form label-width="120px">
          <el-form-item label="ID">
            <span>{{ viewForm.id }}</span>
          </el-form-item>
          <el-form-item label="计划编号">
            <span>{{ viewForm.planNo }}</span>
          </el-form-item>
          <el-form-item label="计划名称">
            <span>{{ viewForm.planName }}</span>
          </el-form-item>
          <el-form-item label="计划类型">
            <span>{{ getPlanTypeLabel(viewForm.planType) }}</span>
          </el-form-item>
          <el-form-item label="项目ID">
            <span>{{ viewForm.projectId }}</span>
          </el-form-item>
          <el-form-item label="迭代ID">
            <span>{{ viewForm.iterationId }}</span>
          </el-form-item>
          <el-form-item label="状态">
            <span>{{ getStatusLabel(viewForm.status) }}</span>
          </el-form-item>
          <el-form-item label="负责人">
            <span>{{ getUserName(viewForm.ownerId) }}</span>
          </el-form-item>
          <el-form-item label="是否模板">
            <span>{{ viewForm.isTemplate === 1 ? '是' : '否' }}</span>
          </el-form-item>
          <el-form-item label="计划描述">
            <span>{{ viewForm.description || '-' }}</span>
          </el-form-item>
          <el-form-item label="测试范围">
            <span>{{ viewForm.testScope || '-' }}</span>
          </el-form-item>
          <el-form-item label="测试目标">
            <span>{{ viewForm.testTarget || '-' }}</span>
          </el-form-item>
          <el-form-item label="测试策略">
            <span>{{ viewForm.testStrategy || '-' }}</span>
          </el-form-item>
          <el-form-item label="验收标准">
            <span>{{ viewForm.acceptanceCriteria || '-' }}</span>
          </el-form-item>
          <el-form-item label="创建时间">
            <span>{{ formatDate(viewForm.createdAt) }}</span>
          </el-form-item>
          <el-form-item label="更新时间">
            <span>{{ formatDate(viewForm.updatedAt) }}</span>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="viewDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExcutionCase',
  data() {
    return {
      searchForm: {
        planName: '',
        planNo: '',
        planType: '',
        projectId: '',
        iterationId: '',
        status: '',
        ownerId: '',
        isTemplate: ''
      },
      testPlans: [],
      loading: false,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0
      },
      dialogVisible: false,
      viewDialogVisible: false,
      createForm: {
        planNo: '',
        planName: '',
        planType: '',
        projectId: '',
        iterationId: '',
        status: '',
        ownerId: '',
        description: '',
        testScope: '',
        testTarget: '',
        testStrategy: '',
        acceptanceCriteria: ''
      },
      viewForm: {
        id: '',
        planNo: '',
        planName: '',
        planType: '',
        projectId: '',
        iterationId: '',
        status: '',
        ownerId: '',
        isTemplate: '',
        description: '',
        testScope: '',
        testTarget: '',
        testStrategy: '',
        acceptanceCriteria: '',
        createdAt: '',
        updatedAt: ''
      },
      users: [],
      createRules: {
        planNo: [
          { required: true, message: '请输入计划编号', trigger: 'blur' }
        ],
        planName: [
          { required: true, message: '请输入计划名称', trigger: 'blur' }
        ],
        planType: [
          { required: true, message: '请选择计划类型', trigger: 'change' }
        ],
        projectId: [
          { required: true, message: '请输入项目ID', trigger: 'blur' },
          { type: 'number', message: '项目ID必须是数字', trigger: 'blur' }
        ],
        iterationId: [
          { required: true, message: '请输入迭代ID', trigger: 'blur' },
          { type: 'number', message: '迭代ID必须是数字', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ],
        ownerId: [
          { required: true, message: '请选择负责人', trigger: 'change' }
        ],

      }
    };
  },
  methods: {
    async fetchTestPlans() {
      this.loading = true;
      try {
        const response = await this.$http.post('/api/testPlan/page', 
          this.searchForm,
          {
            params: {
              pageNum: this.pagination.current,
              pageSize: this.pagination.pageSize
            }
          }
        );
        if (response.data.code === 0) {
          this.testPlans = response.data.data.records;
          this.pagination.total = response.data.data.totalRow;
          this.pagination.current = response.data.data.pageNumber;
          this.pagination.pageSize = response.data.data.pageSize;
        } else {
          this.$message.error('获取测试计划列表失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      } finally {
        this.loading = false;
      }
    },

    handleSearch() {
      this.pagination.current = 1;
      this.fetchTestPlans();
    },

    resetForm() {
      this.searchForm = {
        planName: '',
        planNo: '',
        planType: '',
        projectId: '',
        iterationId: '',
        status: '',
        ownerId: '',
        isTemplate: ''
      };
      this.pagination.current = 1;
      this.fetchTestPlans();
    },

    handleSizeChange(size) {
      this.pagination.pageSize = size;
      this.fetchTestPlans();
    },

    handleCurrentChange(current) {
      this.pagination.current = current;
      this.fetchTestPlans();
    },

    openCreateDialog() {
      this.$refs.createFormRef && this.$refs.createFormRef.resetFields();
      this.createForm = {
        planNo: '',
        planName: '',
        planType: '',
        projectId: '',
        iterationId: '',
        status: '',
        ownerId: '',
        description: '',
        testScope: '',
        testTarget: '',
        testStrategy: '',
        acceptanceCriteria: ''
      };
      this.dialogVisible = true;
    },

    async submitForm() {
      try {
        await this.$refs.createFormRef.validate();
        
        const response = await this.$http.post('/api/testPlan/save', this.createForm);
        if (response.data.code === 0) {
          this.$message.success('添加成功');
          this.dialogVisible = false;
          this.fetchTestPlans();
        } else {
          this.$message.error('添加失败：' + response.data.message);
        }
      } catch (error) {
        if (error.message !== 'Validation failed') {
          this.$message.error('请求失败：' + error.message);
        }
      }
    },

    async handleView(row) {
      try {
        const response = await this.$http.get(`/api/testPlan/getInfo/${row.id}`);
        if (response.data.code === 0) {
          this.viewForm = response.data.data;
          this.viewDialogVisible = true;
        } else {
          this.$message.error('获取详情失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    getPlanTypeLabel(type) {
      const typeMap = {
        1: '项目测试',
        2: '迭代测试',
        3: '专项测试'
      };
      return typeMap[type] || type;
    },

    getStatusLabel(status) {
      const statusMap = {
        1: '未开始',
        2: '进行中',
        3: '已完成',
        4: '已暂停'
      };
      return statusMap[status] || status;
    },

    getPlanTypeTagType(type) {
      const typeMap = {
        1: 'primary',
        2: 'success',
        3: 'warning'
      };
      return typeMap[type] || 'info';
    },

    getStatusTagType(status) {
      const statusMap = {
        1: 'info',
        2: 'success',
        3: 'warning',
        4: 'danger'
      };
      return statusMap[status] || 'info';
    },

    handleRowHover() {
      // 可以在这里添加悬停时的自定义逻辑
    },

    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    getUserName(userId) {
      const user = this.users.find(u => String(u.id) === String(userId));
      return user ? (user.nickname || user.username) : userId || '-';
    },

    async fetchUsers() {
      try {
        const response = await this.$http.post('/api/user/list', {});
        if (response.data.code === 0) {
          this.users = response.data.data;
        } else {
          this.$message.error('获取用户列表失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    }
  },
  mounted() {
    this.fetchTestPlans();
    this.fetchUsers();
  },
};
</script>

<style scoped>
.execution-container {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.content {
  flex: 1;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.header h1 {
  margin: 0;
  text-align: left;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-form :deep(.el-select) {
  width: 150px;
}

.search-form :deep(.el-input) {
  width: 180px;
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-table__header th) {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #303133;
  height: 50px;
}

:deep(.el-table__row) {
  height: 48px;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

/* 标签样式 */
:deep(.el-tag) {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 计划名称样式 */
.plan-name {
  font-weight: 500;
  color: #303133;
}

/* 负责人名称样式 */
.owner-name {
  color: #409eff;
}

/* 分页样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 15px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

:deep(.el-pagination) {
  margin: 0;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background-color: #f5f7fa;
  padding: 15px 20px;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-top: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 4px;
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
</style>
