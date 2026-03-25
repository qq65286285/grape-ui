<template>
  <div class="my-tasks-container">
    <el-card shadow="never" class="page-card">
      <template #header>
        <div class="page-header">
          <span class="page-title">我的任务</span>
        </div>
      </template>
      
      <div class="tasks-content">
        <!-- 搜索和筛选 -->
        <div class="search-filter">
          <el-form :inline="true" :model="searchForm" class="search-form">
            <el-form-item label="计划名称">
              <el-input v-model="searchForm.planName" placeholder="请输入计划名称" style="width: 200px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 120px">
                <el-option label="全部" value="" />
                <el-option label="未开始" value="1" />
                <el-option label="进行中" value="2" />
                <el-option label="已完成" value="3" />
                <el-option label="已暂停" value="4" />
                <el-option label="已取消" value="5" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 测试计划列表 -->
        <div v-loading="loading" class="tasks-list">
          <el-table :data="filteredPlans" style="width: 100%" border>
            <el-table-column prop="planName" label="计划名称" width="200" />
            <el-table-column prop="description" label="计划描述" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag 
                  :type="getStatusType(scope.row.status)"
                >
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="planType" label="计划类型" width="120">
              <template #default="scope">
                <el-tag 
                  :type="getPlanTypeType(scope.row.planType)"
                >
                  {{ getPlanTypeText(scope.row.planType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="planStartDate" label="计划开始日期" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.planStartDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="planEndDate" label="计划结束日期" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.planEndDate) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="executePlan(scope.row)"
                >
                  执行
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 空状态 -->
          <div v-if="!loading && filteredPlans.length === 0" class="empty-state">
            <el-empty description="暂无测试计划" />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'MyTasks',
  data() {
    return {
      loading: false,
      plans: [],
      searchForm: {
        planName: '',
        status: ''
      }
    };
  },
  computed: {
    // 过滤后的测试计划列表
    filteredPlans() {
      let result = [...this.plans];
      
      // 按计划名称过滤
      if (this.searchForm.planName) {
        result = result.filter(plan => 
          plan.planName && plan.planName.includes(this.searchForm.planName)
        );
      }
      
      // 按状态过滤
      if (this.searchForm.status !== '') {
        result = result.filter(plan => 
          plan.status === parseInt(this.searchForm.status)
        );
      }
      
      return result;
    }
  },
  mounted() {
    // 加载测试计划列表
    this.loadMyPlans();
  },
  methods: {
    // 加载当前用户的测试计划
    async loadMyPlans() {
      try {
        this.loading = true;
        const response = await this.$http.get('/api/testPlanMember/listMyPlans');
        
        if (response.data.code === 0) {
          this.plans = response.data.data || [];
          console.log('获取到的测试计划列表:', this.plans);
        } else {
          this.$message.error('获取测试计划失败：' + response.data.message);
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
        planName: '',
        status: ''
      };
      console.log('重置搜索');
    },
    
    // 执行测试计划
    executePlan(plan) {
      // 跳转到我的测试用例页面
      this.$router.push({
        path: '/my-test-cases',
        query: { planId: plan.id }
      });
    },
    
    // 获取状态类型
    getStatusType(status) {
      switch (status) {
        case 1: return 'info';      // 未开始
        case 2: return 'primary';   // 进行中
        case 3: return 'success';   // 已完成
        case 4: return 'warning';   // 已暂停
        case 5: return 'danger';    // 已取消
        default: return '';
      }
    },
    
    // 获取状态文本
    getStatusText(status) {
      switch (status) {
        case 1: return '未开始';
        case 2: return '进行中';
        case 3: return '已完成';
        case 4: return '已暂停';
        case 5: return '已取消';
        default: return '未知';
      }
    },
    
    // 获取计划类型类型
    getPlanTypeType(planType) {
      switch (planType) {
        case 1: return 'primary';   // 项目测试 - 蓝色
        case 2: return 'info';      // 迭代测试 - 浅蓝色
        case 3: return 'warning';   // 专项测试 - 橙色
        default: return '';
      }
    },
    
    // 获取计划类型文本
    getPlanTypeText(planType) {
      switch (planType) {
        case 1: return '项目测试';
        case 2: return '迭代测试';
        case 3: return '专项测试';
        default: return '未知';
      }
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  }
};
</script>

<style scoped>
.my-tasks-container {
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
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.tasks-content {
  margin-top: 20px;
}

.search-filter {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tasks-list {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .my-tasks-container {
    padding: 10px;
  }
  
  .search-form {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-form .el-form-item {
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .search-form .el-button {
    margin-top: 10px;
  }
}
</style>