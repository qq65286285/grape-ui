<template>
  <div>
    <!-- 标题行 -->
    <div class="header">
      <h1>用例列表</h1>
      <div>
        <el-button type="primary" @click="openDialog">新增测试用例</el-button>
        <el-button type="success" @click="refreshList">刷新</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table :data="caseList.records" style="width: 100%">
      <el-table-column prop="caseNumber" label="用例编号" width="160" />
      <el-table-column prop="title" label="标题" width="200" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="priority" label="优先级" width="80" />
      <el-table-column prop="status" label="状态" width="100" />
      <el-table-column label="创建人" width="120">
        <template #default="scope">
          {{ scope.row.username || '加载中...' }}
        </template>
      </el-table-column>
      <!-- 操作列 -->
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button type="text" @click="editCase(scope.row)">编辑</el-button>
          <el-button type="text" @click="deleteCase(scope.row.id)">删除</el-button>
          <el-button type="text" @click="showHistory(scope.row.id)">历史版本</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="caseList.totalRow"
      :page-size="pagination.pageSize"
      :current-page="pagination.pageNumber"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />

    <!-- 新增/编辑对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="30%">
      <!-- 表单 -->
      <el-form :model="form" label-width="120px">
        <el-form-item label="用例编号">
          <el-input v-model="form.caseNumber" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="form.priority">
            <el-radio :label="1">1</el-radio>
            <el-radio :label="2">2</el-radio>
            <el-radio :label="3">3</el-radio>
            <el-radio :label="4">4</el-radio>
            <el-radio :label="5">5</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :label="0">未开始</el-radio>
            <el-radio :label="2">已完成</el-radio>
            <el-radio :label="3">已失败</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="预期结果">
          <el-input v-model="form.expectedResult" type="textarea" />
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model="form.module" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>

      <!-- 对话框底部按钮 -->
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCase">保存</el-button>
      </template>
    </el-dialog>


    <!-- 历史版本对话框 -->
    <el-dialog title="历史版本" v-model="historyDialogVisible" width="50%">
      <!-- 历史版本数据 -->
      <el-table :data="historyList" style="width: 100%">
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column prop="updatedBy" label="更新人" width="120" />
        <el-table-column prop="description" label="描述" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      caseList: {
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
      dialogTitle: "新增测试用例", // 对话框标题
      form: {
        id: 0,
        caseNumber: "",
        title: "",
        description: "",
        priority: 1,
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
      }, // 表单数据
      isEditMode: false, // 是否为编辑模式
      historyList: [], // 历史版本数据
    };
  },
  methods: {
    // 打开新增对话框
    openDialog() {
      this.dialogTitle = "新增测试用例";
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


    // 显示历史版本
    async showHistory(caseId) {
      try {
        const response = await this.$http.get(`/api/caseVersions/listByCaseId`, {
          params: { caseId },
        });
        if (response.data.code === 0) {
          this.historyList = response.data.data; // 更新历史版本数据
          this.historyDialogVisible = true; // 打开历史版本对话框
        } else {
          this.$message.error("获取历史版本失败：" + response.data.message);
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

    // 获取用户信息
    async getUserInfo(userId) {
      try {
        console.log('获取用户信息，userId:', userId);
        const response = await this.$http.get(`/api/user/getInfo/${userId}`);
        console.log('用户信息响应:', JSON.stringify(response.data));
        // 检查响应结构
        if (response.data && response.data.code === 0 && response.data.data && response.data.data.username) {
          console.log('获取用户名成功:', response.data.data.username);
          return response.data.data.username;
        } else if (response.data && response.data.code === 404) {
          console.log('用户不存在:', userId);
          return '用户不存在';
        } else {
          console.log('响应结构不符合预期:', response.data);
          return '未知用户';
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        return '未知用户';
      }
    },

    // 获取用例列表
    async fetchCaseList() {
      try {
        const response = await this.$http.get("/api/cases/page", {
          params: {
            pageNumber: this.pagination.pageNumber,
            pageSize: this.pagination.pageSize,
          },
        });
        if (response.data.code === 0) {
          const { list, pageInfo } = response.data.data;

          // 为每个用例添加用户名
          for (let i = 0; i < list.length; i++) {
            if (list[i].createdBy) {
              list[i].username = await this.getUserInfo(list[i].createdBy);
            } else {
              list[i].username = '未知用户';
            }
          }

          this.caseList.records = list; // 当前页的数据
          this.caseList.pageNumber = pageInfo.current; // 当前页码
          this.caseList.pageSize = pageInfo.size; // 每页条数
          this.caseList.totalPage = Math.ceil(pageInfo.total / pageInfo.size); // 总页数
          this.caseList.totalRow = pageInfo.total; // 总条数
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
        priority: 1,
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
  },
  mounted() {
    this.fetchCaseList(); // 组件加载时获取用例列表
  },
};
</script>

<style scoped>
/* 标题行样式 */
.header {
  display: flex; /* 使用 Flex 布局 */
  justify-content: space-between; /* 标题靠左，按钮靠右 */
  align-items: center; /* 垂直居中 */
  margin-bottom: 24px; /* 与表格的间距 */
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

h1 {
  text-align: center; /* 标题居中 */
  margin: 0; /* 去除默认的 margin */
  flex: 1; /* 让标题占据剩余空间 */
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 按钮组样式 */
.header > div {
  display: flex;
  gap: 12px; /* 按钮之间的间距 */
}

/* 表格样式 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.el-table:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.el-table th {
  background-color: #fafafa !important;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.el-table td {
  text-align: center;
  padding: 12px 0;
}

/* 操作按钮样式 */
.el-button--text {
  color: #409eff;
  transition: all 0.3s ease;
  margin-right: 8px;
}

.el-button--text:last-child {
  margin-right: 0;
}

.el-button--text:hover {
  color: #66b1ff;
  background-color: rgba(64, 158, 255, 0.1);
}

/* 操作列样式 */
.el-table .cell {
  white-space: nowrap;
}

/* 分页样式 */
.el-pagination {
  margin-top: 24px;
  text-align: right;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 对话框样式 */
.el-dialog {
  border-radius: 8px;
  overflow: hidden;
}

.el-dialog__header {
  background-color: #f8f9fa;
  padding: 16px 20px;
  border-bottom: 1px solid #eaeaea;
}

.el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 表单样式 */
.el-form-item {
  margin-bottom: 16px;
}

.el-radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .header > div {
    justify-content: center;
  }
  
  h1 {
    font-size: 18px;
  }
  
  .el-table {
    font-size: 14px;
  }
  
  .el-pagination {
    text-align: center;
  }
}
</style>