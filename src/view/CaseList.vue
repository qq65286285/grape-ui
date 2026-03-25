<template>
  <div class="case-list-container">
    <!-- 标题行 -->
    <div class="header">
      <h1>用例列表</h1>
      <div>
        <span v-if="selectedCases.length > 0" class="selected-count">已选择 {{ selectedCases.length }} 个用例</span>
        <el-button type="primary" @click="openDialog">新增测试用例</el-button>
        <el-button type="success" @click="refreshList">刷新</el-button>
        <el-button type="danger" @click="confirmBatchDelete" :disabled="selectedCases.length === 0">批量删除</el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 左侧文件夹树 -->
      <div class="folder-tree">
        <div class="folder-header">
          <h3>文件夹</h3>
          <el-button type="text" size="small" @click="refreshFolderTree">
            <el-icon><Refresh /></el-icon> 刷新
          </el-button>
        </div>
        <el-tree
          :data="folderTree"
          :props="treeProps"
          node-key="id"
          default-expand-all
          @node-click="handleFolderClick"
          :expand-on-click-node="false"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <span class="node-name">{{ node.label }}</span>
              <span class="node-actions">
                <span class="action-btn" @click.stop="addSubFolder(data)">
                  <el-icon class="action-icon"><Plus /></el-icon>
                </span>
                <span class="action-btn" @click.stop="editFolder(data)">
                  <el-icon class="action-icon"><Edit /></el-icon>
                </span>
                <span class="action-btn" @click.stop="confirmDeleteFolder(data)">
                  <el-icon class="action-icon"><Delete /></el-icon>
                </span>
              </span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 右侧测试用例列表 -->
    <div class="case-content">
        <!-- 查询表单 -->
        <div class="query-form">
            <el-form :inline="true" :model="queryForm" class="demo-form-inline">
                <el-form-item label="标题">
                    <el-input v-model="queryForm.title" placeholder="请输入标题" style="width: 180px" />
                </el-form-item>
                <el-form-item label="描述">
                    <el-input v-model="queryForm.description" placeholder="请输入描述" style="width: 180px" />
                </el-form-item>
                <el-form-item label="优先级">
                    <el-select v-model="queryForm.priority" placeholder="请选择优先级" style="width: 120px">
                        <el-option label="1" :value="1" />
                        <el-option label="2" :value="2" />
                        <el-option label="3" :value="3" />
                        <el-option label="4" :value="4" />
                        <el-option label="5" :value="5" />
                    </el-select>
                </el-form-item>
                <el-form-item label="创建人">
                    <el-select v-model="queryForm.createdByList" multiple placeholder="请选择创建人" style="width: 180px">
                        <el-option v-for="user in userList" :key="user.id" :label="user.name" :value="user.id" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="fetchCaseList">查询</el-button>
                    <el-button @click="resetQueryForm">重置</el-button>
                </el-form-item>
            </el-form>
        </div>
        
        <!-- 表格 -->
        <el-table :data="caseList.records" style="width: 100%" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="caseNumber" label="用例编号" width="160" />
          <el-table-column prop="title" label="标题" width="200" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="priority" label="优先级" width="80" />
          <el-table-column label="创建人" width="120">
            <template #default="scope">
              {{ scope.row.username || '加载中...' }}
            </template>
          </el-table-column>
          <!-- 操作列 -->
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="text" @click="viewCaseDetail(scope.row)">查看详情</el-button>
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
      </div>
    </div>

    <!-- 对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="50%">
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
        <el-form-item label="步骤和预期结果">
          <div class="step-container">
            <div v-for="(step, index) in form.steps" :key="index" class="step-item">
              <div class="step-header">
                <span>步骤 {{ index + 1 }}</span>
                <div class="step-buttons">
                  <el-button type="info" size="small" @click="moveStepUp(index)" :disabled="index === 0">上移</el-button>
                  <el-button type="info" size="small" @click="moveStepDown(index)" :disabled="index === form.steps.length - 1">下移</el-button>
                  <el-button type="danger" size="small" @click="removeStep(index)" :disabled="form.steps.length <= 1">删除</el-button>
                </div>
              </div>
              <div class="step-content">
                <div class="step-column">
                  <el-form-item :prop="`steps.${index}.step`" :rules="[{ required: true, message: '请输入步骤描述', trigger: 'blur' }]">
                    <el-input v-model="step.step" type="textarea" placeholder="请输入步骤描述" />
                  </el-form-item>
                </div>
                <div class="step-column">
                  <el-form-item :prop="`steps.${index}.expectedResult`" :rules="[{ required: true, message: '请输入预期结果', trigger: 'blur' }]">
                    <el-input v-model="step.expectedResult" type="textarea" placeholder="请输入预期结果" />
                  </el-form-item>
                </div>
              </div>
            </div>
            <div class="step-actions">
              <el-button type="primary" size="small" @click="addStep">添加步骤</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model="form.module" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
        <el-form-item label="所属文件夹">
          <el-select v-model="form.folderId" placeholder="请选择文件夹">
            <el-option label="根目录" :value="0" />
            <el-option
              v-for="folder in allFolders"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCase">保存</el-button>
      </template>
    </el-dialog>

    <!-- 历史版本对话框 -->
    <el-dialog title="历史版本" v-model="historyDialogVisible" width="80%" @close="handleHistoryDialogClose">
      <el-table :data="historyList" style="width: 100%" :row-key="row => row.id">
        <!-- 展开行按钮 -->
        <el-table-column type="expand">
          <template #default="scope">
            <div class="version-detail">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="版本ID">{{ scope.row.id }}</el-descriptions-item>
                <el-descriptions-item label="用例编号">{{ scope.row.caseNumber }}</el-descriptions-item>
                <el-descriptions-item label="标题">{{ scope.row.title }}</el-descriptions-item>
                <el-descriptions-item label="描述">{{ scope.row.description || '无' }}</el-descriptions-item>
                <el-descriptions-item label="优先级">{{ scope.row.priority }}</el-descriptions-item>
                <el-descriptions-item label="状态">{{ scope.row.status }}</el-descriptions-item>
                <el-descriptions-item label="版本号">{{ scope.row.version }}</el-descriptions-item>
                <el-descriptions-item label="环境ID">{{ scope.row.environmentId }}</el-descriptions-item>
                <el-descriptions-item label="模块">{{ scope.row.module || '无' }}</el-descriptions-item>
                <el-descriptions-item label="所属文件夹">{{ scope.row.folderId }}</el-descriptions-item>
                <el-descriptions-item label="备注">{{ scope.row.remark || '无' }}</el-descriptions-item>
                <el-descriptions-item label="创建人">{{ scope.row.createdByName || '无' }}</el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ scope.row.formattedCreatedAt || '无' }}</el-descriptions-item>
                <el-descriptions-item label="更新人">{{ scope.row.updatedByName || '无' }}</el-descriptions-item>
                <el-descriptions-item label="更新时间">{{ scope.row.formattedUpdatedAt || '无' }}</el-descriptions-item>
              </el-descriptions>
              
              <!-- 步骤详情 -->
              <div class="version-steps" v-if="scope.row.steps && scope.row.steps.length > 0">
                <h4>步骤详情</h4>
                <div v-for="(step, index) in scope.row.steps" :key="index" class="step-item">
                  <div class="step-header">
                    <span>步骤 {{ index + 1 }}</span>
                  </div>
                  <div class="step-content">
                    <div class="step-column">
                      <label>步骤描述：</label>
                      <div>{{ step.step }}</div>
                    </div>
                    <div class="step-column">
                      <label>预期结果：</label>
                      <div>{{ step.expectedResult }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="version-steps" v-else>
                <h4>步骤详情</h4>
                <div class="no-steps">无步骤信息</div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <!-- 标题行 -->
        <el-table-column prop="id" label="版本ID" width="100" />
        <el-table-column prop="caseNumber" label="用例编号" width="120" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="更新人" width="120">
          <template #default="scope">
            {{ scope.row.updatedByName || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="scope">
            {{ scope.row.formattedUpdatedAt || '未知' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button type="text" @click="rollbackToVersion(scope.row.id)">回滚到此版本</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="history-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="historyPagination.total"
          :page-size="historyPagination.pageSize"
          :current-page="historyPagination.currentPage"
          @size-change="handleHistorySizeChange"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-dialog>

    <!-- 新建文件夹对话框 -->
    <el-dialog :title="folderDialogTitle" v-model="folderDialogVisible" width="30%">
      <el-form :model="folderForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="folderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="folderForm.sort" :min="1" :max="100" :step="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFolder">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑对话框 -->
    <el-dialog title="批量编辑测试用例" v-model="batchEditDialogVisible" width="50%">
      <div class="batch-edit-info">
        <span>当前正在编辑 {{ selectedCases.length }} 个测试用例</span>
      </div>
      <el-form :model="batchEditForm" label-width="120px">
        <el-form-item label="标题">
          <el-input v-model="batchEditForm.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="batchEditForm.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="batchEditForm.priority" placeholder="请选择优先级">
            <el-option label="1" :value="1" />
            <el-option label="2" :value="2" />
            <el-option label="3" :value="3" />
            <el-option label="4" :value="4" />
            <el-option label="5" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="batchEditForm.status" placeholder="请选择状态">
            <el-option label="未执行" :value="0" />
            <el-option label="已完成" :value="1" />
            <el-option label="已失败" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model="batchEditForm.module" placeholder="请输入模块" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchEditForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="所属文件夹">
          <el-select v-model="batchEditForm.folderId" placeholder="请选择文件夹">
            <el-option label="根目录" :value="0" />
            <el-option
              v-for="folder in allFolders"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBatchEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Refresh, Plus, Delete, Edit } from '@element-plus/icons-vue';

export default {
  components: {
    Refresh,
    Plus,
    Delete,
    Edit
  },
  data() {
    const data = {
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
        version: 0,
        environmentId: 0,
        module: "",
        remark: "",
        steps: [
          {
            step: "",
            expectedResult: ""
          }
        ],
        createdBy: 0,
        createdAt: 0,
        updatedAt: 0,
        updatedBy: "string",
        folderId: 0 // 所属文件夹ID
      }, // 表单数据
      isEditMode: false, // 是否为编辑模式
      historyList: [], // 历史版本数据
      // 历史版本分页相关
      historyPagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      currentCaseId: 0, // 当前查看历史版本的用例ID
      // 文件夹树相关数据
      folderTree: [], // 文件夹树数据
      allFolders: [], // 所有文件夹列表
      treeProps: {
        children: 'children',
        label: 'name'
      },
      currentFolderId: 0, // 当前选中的文件夹ID
      // 新建文件夹弹框相关数据
      folderDialogVisible: false,
      folderDialogTitle: '新建文件夹',
      folderForm: {
        id: 0,
        name: '',
        parentId: 0,
        sort: 1
      },
      // 查询表单相关数据
      queryForm: {
        title: '',
        description: '',
        priority: '',
        createdByList: []
      },
      userList: [] // 用户列表，用于创建人选择
    };
    // 批量编辑相关数据
    data.selectedCases = []; // 选中的测试用例
    data.batchEditDialogVisible = false; // 批量编辑对话框显示状态
    data.batchEditForm = {
      title: '',
      description: '',
      priority: '',
      status: '',
      module: '',
      remark: '',
      folderId: ''
    }; // 批量编辑表单数据
    return data;
  },
  methods: {
    // 打开新增对话框
    openDialog() {
      this.dialogTitle = "新增测试用例";
      this.isEditMode = false;
      this.resetForm();
      // 默认选择当前文件夹
      this.form.folderId = this.currentFolderId;
      // 初始化steps数组
      if (!this.form.steps) {
        this.form.steps = [];
      }
      this.dialogVisible = true;
    },

    // 获取所有文件夹列表并构建树结构
    async getFolderTree() {
      try {
        const response = await this.$http.get('/api/testCaseFolders/list');
        if (response.data.code === 0) {
          this.allFolders = response.data.data;
          this.folderTree = this.buildFolderTree(this.allFolders);
        }
      } catch (error) {
        console.error('获取文件夹失败:', error);
      }
    },

    // 构建文件夹树结构
    buildFolderTree(folders) {
      const folderMap = {};
      const rootFolders = [];

      console.log('原始文件夹数据:', folders);

      // 首先创建所有文件夹的映射
      folders.forEach(folder => {
        folderMap[folder.id] = {
          ...folder,
          children: []
        };
      });

      console.log('文件夹映射:', folderMap);

      // 然后构建树结构
      folders.forEach(folder => {
        if (folder.parentId === 0) {
          // 根文件夹
          rootFolders.push(folderMap[folder.id]);
        } else {
          // 子文件夹
          if (folderMap[folder.parentId]) {
            folderMap[folder.parentId].children.push(folderMap[folder.id]);
          } else {
            // 如果父文件夹不存在，将其作为根文件夹处理
            console.warn(`父文件夹 ${folder.parentId} 不存在，将 ${folder.name} 作为根文件夹处理`);
            rootFolders.push(folderMap[folder.id]);
          }
        }
      });

      console.log('构建后的根文件夹:', rootFolders);

      // 按sort字段排序
      this.sortFolderTree(rootFolders);

      console.log('排序后的文件夹树:', rootFolders);

      return rootFolders;
    },

    // 递归排序文件夹树
    sortFolderTree(folders) {
      folders.forEach(folder => {
        if (folder.children && folder.children.length > 0) {
          folder.children.sort((a, b) => a.sort - b.sort);
          this.sortFolderTree(folder.children);
        }
      });
    },

    // 获取所有文件夹列表（保持与原有方法兼容）
    async getAllFolders() {
      await this.getFolderTree();
    },

    // 处理文件夹点击事件
    handleFolderClick(data) {
      // 根目录使用id=0，其他文件夹使用实际id
      this.currentFolderId = data.parentId === 0 ? 0 : data.id;
      console.log('选中文件夹:', data.name, '，传递给后端的folderId:', this.currentFolderId);
      // 重新加载测试用例列表
      this.fetchCaseList();
    },

    // 刷新文件夹树
    refreshFolderTree() {
      this.getFolderTree();
      this.getAllFolders();
      this.$message.success('文件夹树已刷新');
    },

    // 添加子文件夹
    addSubFolder(parentFolder) {
      // 添加参数检查
      if (!parentFolder || !parentFolder.id) {
        this.$message.error('无法获取父文件夹ID');
        return;
      }
      
      this.folderDialogTitle = '新建文件夹';
      this.folderForm = {
        id: 0,
        name: '',
        parentId: parentFolder.id, // 设置父文件夹ID
        sort: 1
      };
      this.folderDialogVisible = true;
    },

    // 编辑文件夹
    editFolder(folder) {
      // 添加参数检查
      if (!folder || !folder.id) {
        this.$message.error('无法获取文件夹ID');
        return;
      }
      
      this.folderDialogTitle = '修改文件夹';
      this.folderForm = {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentId, // 保持原有的父文件夹ID
        sort: folder.sort
      };
      this.folderDialogVisible = true;
    },

    // 保存文件夹
    async saveFolder() {
      if (!this.folderForm.name) {
        this.$message.error('请输入文件夹名称');
        return;
      }

      try {
        let response;
        if (this.folderForm.id === 0) {
          // 新增文件夹
          response = await this.$http.post('/api/testCaseFolders/save', {
            name: this.folderForm.name,
            parentId: this.folderForm.parentId,
            sort: this.folderForm.sort
          });
        } else {
          // 修改文件夹
          response = await this.$http.put('/api/testCaseFolders/update', {
            id: this.folderForm.id,
            name: this.folderForm.name,
            parentId: this.folderForm.parentId,
            sort: this.folderForm.sort
          });
        }

        if (response.data.code === 0) {
          this.$message.success(this.folderForm.id === 0 ? '创建成功' : '修改成功');
          this.folderDialogVisible = false;
          this.getFolderTree();
          this.getAllFolders();
        } else {
          this.$message.error(this.folderForm.id === 0 ? '创建失败' : '修改失败');
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    // 确认删除文件夹
    confirmDeleteFolder(folder) {
      // 添加参数检查
      if (!folder || !folder.id) {
        this.$message.error('无法获取文件夹ID');
        return;
      }
      
      this.$confirm('确定要删除这个文件夹吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteFolder(folder.id);
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },

    // 删除文件夹
    async deleteFolder(folderId) {
      try {
        // 添加参数检查
        if (!folderId) {
          this.$message.error('无法获取文件夹ID');
          return;
        }
        
        const response = await this.$http.delete(`/api/testCaseFolders/remove/${folderId}`);
        if (response.data.code === 0) {
          this.$message.success('删除成功');
          this.getFolderTree();
          this.getAllFolders();
          // 如果当前选中的文件夹被删除，重置为根目录
          if (this.currentFolderId === folderId) {
            this.currentFolderId = 0;
            this.fetchCaseList();
          }
        } else {
          this.$message.error('删除失败');
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    // 查看详情
    async viewCaseDetail(row) {
      try {
        // 添加参数检查，防止row为undefined
        if (!row || !row.id) {
          this.$message.error("无法获取用例ID");
          return;
        }
        
        const response = await this.$http.get(`/api/cases/getInfo/${row.id}`);
        if (response.data.code === 0) {
          // 添加响应数据检查
          if (!response.data.data) {
            this.$message.error("获取用例详情失败：数据格式错误");
            return;
          }
          
          const data = response.data.data;
          const caseData = data.case;
          const stepsData = data.steps;
          
          // 检查caseData是否存在
          if (!caseData) {
            this.$message.error("获取用例详情失败：用例数据不存在");
            return;
          }
          
          this.dialogTitle = "查看测试用例详情";
          this.isEditMode = true;
          
          // 处理步骤数据
          let steps = [];
          if (stepsData && stepsData.length > 0) {
            steps = stepsData.map(step => ({
              step: step.step,
              expectedResult: step.expectedResult
            }));
          } else {
            // 如果没有步骤，初始化一个空步骤
            steps = [{
              step: "",
              expectedResult: ""
            }];
          }
          
          this.form = {
            id: caseData.id,
            caseNumber: caseData.caseNumber,
            title: caseData.title,
            description: caseData.description,
            priority: caseData.priority,
            version: caseData.version,
            environmentId: caseData.environmentId,
            module: caseData.module,
            remark: caseData.remark,
            folderId: caseData.folderId,
            createdBy: caseData.createdBy,
            createdAt: caseData.createdAt,
            updatedAt: caseData.updatedAt,
            updatedBy: caseData.updatedBy,
            steps: steps
          };
          this.dialogVisible = true;
        } else {
          this.$message.error("获取用例详情失败：" + response.data.message);
        }
      } catch (error) {
        this.$message.error("请求失败：" + error.message);
      }
    },

    // 保存用例
    async saveCase() {
      try {
        let response;
        if (this.isEditMode) {
          // 编辑模式，直接调用更新接口，由后端处理版本历史
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
      // 添加参数检查
      if (!caseId) {
        this.$message.error("无法获取用例ID");
        return;
      }
      
      this.currentCaseId = caseId;
      // 重置分页信息（使用响应式更新）
      this.historyPagination = {
        currentPage: 1,
        pageSize: 10,
        total: 0
      };
      
      // 清空历史版本数据
      this.historyList = [];
      
      // 打开历史版本对话框
      this.historyDialogVisible = true;
      
      // 获取历史版本数据
      this.fetchHistoryVersions();
    },
    
    // 获取历史版本数据（带分页）
    async fetchHistoryVersions() {
      try {
        console.log('开始获取历史版本数据，参数:', {
          caseId: this.currentCaseId,
          pageNumber: this.historyPagination.currentPage,
          pageSize: this.historyPagination.pageSize
        });
        
        const response = await this.$http.get(`/api/caseVersions/pageByCaseId`, {
          params: {
            caseId: this.currentCaseId,
            pageNumber: this.historyPagination.currentPage,
            pageSize: this.historyPagination.pageSize
          },
        });
        
        console.log('后端响应:', response.data);
        
        if (response.data.code === 0) {
          const data = response.data.data;
          console.log('分页数据:', data);
          
          let historyData = data.records || []; // 分页数据，确保records存在
          
          // 更新分页信息（使用对象重新赋值确保响应式更新）
          // 适配后端返回的分页数据格式
          this.historyPagination = {
            ...this.historyPagination,
            total: data.totalRow || data.total || 0,
            currentPage: data.pageNumber || data.current || 1,
            pageSize: data.pageSize || data.size || 10
          };
          
          console.log('更新后的分页信息:', this.historyPagination);
          
          // 先为每个历史版本添加基本信息，确保分页组件能快速显示
          historyData = historyData.map(item => {
            // 添加caseId字段，确保回滚时能正确获取
            item.caseId = this.currentCaseId;
            
            // 格式化更新时间
            if (item.updatedAt) {
              item.formattedUpdatedAt = this.formatDate(item.updatedAt);
            } else {
              item.formattedUpdatedAt = '未知时间';
            }
            
            // 格式化创建时间
            if (item.createdAt) {
              item.formattedCreatedAt = this.formatDate(item.createdAt);
            } else {
              item.formattedCreatedAt = '未知时间';
            }
            
            // 从 stepsJson 中解析步骤信息（如果 steps 为空）
            if (!item.steps && item.stepsJson) {
              try {
                item.steps = JSON.parse(item.stepsJson);
              } catch (error) {
                console.warn('解析步骤信息失败:', error);
                item.steps = [];
              }
            }
            
            // 暂时设置默认值，后续异步更新
            item.updatedByName = '加载中...';
            item.createdByName = '加载中...';
            
            return item;
          });
          
          // 先赋值数据，确保分页组件和表格能快速显示
          this.historyList = historyData;
          console.log('历史版本数据:', this.historyList);
          
          // 然后异步获取用户名信息
          this.fetchUserNamesForHistory(historyData);
        } else {
          this.$message.error("获取历史版本失败：" + (response.data.msg || response.data.message));
        }
      } catch (error) {
        console.error('请求失败:', error);
        this.$message.error("请求失败：" + error.message);
      }
    },
    
    // 异步获取历史版本的用户名信息
    async fetchUserNamesForHistory(historyData) {
      for (const item of historyData) {
        // 获取更新人用户名
        if (item.updatedBy) {
          item.updatedByName = await this.getUserInfo(item.updatedBy);
        } else {
          item.updatedByName = '未知用户';
        }
        
        // 获取创建人用户名
        if (item.createdBy) {
          item.createdByName = await this.getUserInfo(item.createdBy);
        } else {
          item.createdByName = '未知用户';
        }
      }
      
      // 更新列表，触发视图更新
      this.historyList = [...historyData];
    },

    // 格式化日期时间
    formatDate(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      // 转换为 UTC+8 时区
      const utc8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
      const year = utc8Date.getUTCFullYear();
      const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(utc8Date.getUTCDate()).padStart(2, '0');
      const hours = String(utc8Date.getUTCHours()).padStart(2, '0');
      const minutes = String(utc8Date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(utc8Date.getUTCSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },


    // 删除用例
    async deleteCase(id) {
      try {
        // 添加参数检查
        if (!id) {
          this.$message.error("无法获取用例ID");
          return;
        }
        
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
        // 构建请求体
        const requestBody = {
          folderId: this.currentFolderId,
          title: this.queryForm.title,
          description: this.queryForm.description,
          priority: this.queryForm.priority,
          createdByList: this.queryForm.createdByList
        };
        
        const response = await this.$http.post(`/api/cases/listByFolderId`, requestBody);
        
        if (response.data.code === 0) {
          const list = response.data.data;

          // 为每个用例添加用户名
          for (let i = 0; i < list.length; i++) {
            if (list[i].createdBy) {
              list[i].username = await this.getUserInfo(list[i].createdBy);
            } else {
              list[i].username = '未知用户';
            }
          }

          this.caseList.records = list; // 当前页的数据
          this.caseList.pageNumber = 1; // 当前页码
          this.caseList.pageSize = list.length; // 每页条数
          this.caseList.totalPage = 1; // 总页数
          this.caseList.totalRow = list.length; // 总条数
        }
      } catch (error) {
        this.$message.error("加载失败：" + error.message);
      }
    },

    // 重置查询表单
    resetQueryForm() {
      this.queryForm = {
        title: '',
        description: '',
        priority: '',
        createdByList: []
      };
      this.fetchCaseList();
    },

    // 获取用户列表
    async getUserList() {
      try {
        // 这里应该调用获取用户列表的API，暂时使用模拟数据
        // const response = await this.$http.get('/api/users/list');
        // if (response.data.code === 0) {
        //   this.userList = response.data.data;
        // }
        
        // 模拟用户数据
        this.userList = [
          { id: 'user1', name: '用户1' },
          { id: 'user2', name: '用户2' },
          { id: 'user3', name: '用户3' }
        ];
      } catch (error) {
        console.error('获取用户列表失败:', error);
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
        version: 0,
        environmentId: 0,
        module: "",
        remark: "",
        steps: [
          {
            step: "",
            expectedResult: ""
          }
        ],
        createdBy: 0,
        createdAt: 0,
        updatedAt: 0,
        updatedBy: "string",
      };
    },

    // 添加步骤
    addStep() {
      // 确保steps数组存在
      if (!this.form.steps) {
        this.form.steps = [];
      }
      this.form.steps.push({
        step: "",
        expectedResult: ""
      });
    },

    // 删除步骤
    removeStep(index) {
      // 确保steps数组存在
      if (this.form.steps) {
        this.form.steps.splice(index, 1);
      }
    },

    // 上移步骤
    moveStepUp(index) {
      if (index > 0 && this.form.steps) {
        // 交换当前步骤和上一个步骤的位置
        const temp = this.form.steps[index];
        this.form.steps[index] = this.form.steps[index - 1];
        this.form.steps[index - 1] = temp;
      }
    },

    // 下移步骤
    moveStepDown(index) {
      if (index < this.form.steps.length - 1 && this.form.steps) {
        // 交换当前步骤和下一个步骤的位置
        const temp = this.form.steps[index];
        this.form.steps[index] = this.form.steps[index + 1];
        this.form.steps[index + 1] = temp;
      }
    },

    // 处理历史版本对话框关闭
    handleHistoryDialogClose() {
      // 关闭对话框
      this.historyDialogVisible = false;
      
      // 延迟清空历史版本数据，确保对话框完全关闭后再清理
      setTimeout(() => {
        this.historyList = [];
      }, 300);
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
    
    // 处理历史版本分页大小变化
    handleHistorySizeChange(pageSize) {
      // 使用对象重新赋值确保响应式更新
      this.historyPagination = {
        ...this.historyPagination,
        pageSize: pageSize,
        currentPage: 1
      };
      this.fetchHistoryVersions();
    },
    
    // 处理历史版本页码变化
    handleHistoryPageChange(currentPage) {
      // 使用对象重新赋值确保响应式更新
      this.historyPagination = {
        ...this.historyPagination,
        currentPage: currentPage
      };
      this.fetchHistoryVersions();
    },

    // 回滚到指定版本
    async rollbackToVersion(versionId) {
      try {
        // 查找当前版本对应的用例ID
        const versionItem = this.historyList.find(item => item.id === versionId);
        if (!versionItem) {
          this.$message.error('未找到版本信息');
          return;
        }
        
        const caseId = versionItem.caseId;
        
        // 显示确认对话框
        await this.$confirm('确定要回滚到此版本吗？当前版本将会被保存为历史记录。', '确认回滚', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        // 调用回滚接口
        const response = await this.$http.post('/api/cases/rollback', {
          caseId: caseId,
          versionId: versionId
        });
        
        if (response.data.code === 0) {
          this.$message.success('回滚成功');
          // 关闭历史版本对话框
          this.historyDialogVisible = false;
          setTimeout(() => {
            this.historyList = [];
            this.showHistoryDialog = false;
          }, 300);
          // 重新加载用例列表
          this.fetchCaseList();
        } else {
          this.$message.error('回滚失败：' + response.data.message);
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('请求失败：' + error.message);
        }
      }
    },

    // 获取状态文本
    getStatusText(status) {
      switch (status) {
        case 0:
          return '未执行';
        case 1:
          return '已完成';
        case 2:
          return '已失败';
        default:
          return '未知';
      }
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedCases = selection;
    },

    // 打开批量编辑对话框
    openBatchEditDialog() {
      // 重置批量编辑表单
      this.batchEditForm = {
        title: '',
        description: '',
        priority: '',
        status: '',
        module: '',
        remark: '',
        folderId: ''
      };
      // 打开对话框
      this.batchEditDialogVisible = true;
    },

    // 确认批量删除
    confirmBatchDelete() {
      this.$confirm('确定要删除选中的 ' + this.selectedCases.length + ' 个测试用例吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.batchDelete();
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },

    // 批量删除
    async batchDelete() {
      try {
        // 获取选中用例的ID列表
        const caseIds = this.selectedCases.map(caseItem => caseItem.id);

        // 调用批量删除接口
        const response = await this.$http.delete('/api/cases/batchRemove', {
          data: caseIds
        });

        if (response.data.code === 0) {
          this.$message.success('批量删除成功');
          this.fetchCaseList(); // 重新加载用例列表
        } else {
          this.$message.error('批量删除失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },
  },
  mounted() {
    this.getFolderTree(); // 获取文件夹树数据
    this.getAllFolders(); // 获取所有文件夹列表
    this.getUserList(); // 获取用户列表
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
  align-items: center;
}

/* 选中计数样式 */
.selected-count {
  font-size: 14px;
  color: #409eff;
  font-weight: 500;
  margin-right: 8px;
}

/* 批量编辑信息样式 */
.batch-edit-info {
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

/* 左侧文件夹树 */
.folder-tree {
  width: 280px;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  height: calc(100vh - 200px);
  overflow-y: auto;
}

/* 文件夹树头部 */
.folder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eaeaea;
}

.folder-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 树节点样式 */
.tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

/* 节点操作按钮 */
.node-actions {
  display: flex;
  gap: 3px;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

/* 自定义操作按钮 */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background-color: rgba(64, 158, 255, 0.1);
}

.action-icon {
  font-size: 14px;
  color: #606266;
  transition: color 0.3s ease;
}

.action-btn:hover .action-icon {
  color: #409eff;
}



/* 右侧测试用例列表 */
.case-content {
  flex: 1;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  min-height: calc(100vh - 200px);
}

/* 查询表单样式 */
.query-form {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.demo-form-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.demo-form-inline .el-form-item {
  margin-bottom: 0;
}

.demo-form-inline .el-button {
  margin-bottom: 0;
  height: 32px;
}

/* 表格样式 */
.el-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
  margin-bottom: 20px;
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

/* 步骤容器样式 */
.step-container {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

/* 步骤项样式 */
.step-item {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #f9f9f9;
  width: 100%;
  box-sizing: border-box;
}

.step-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eaeaea;
}

.step-header span {
  font-weight: 600;
  color: #333;
}

/* 步骤按钮样式 */
.step-buttons {
  display: flex;
  gap: 8px;
}

.step-buttons .el-button {
  padding: 0 10px;
  font-size: 12px;
}

/* 步骤内容横向排列 */
.step-content {
  display: flex;
  gap: 20px;
  width: 100%;
}

.step-column {
  flex: 1;
  min-width: 0;
}

.step-item .el-form-item {
  margin-bottom: 0;
}

/* 确保文本域高度一致 */
.step-column .el-input__textarea {
  min-height: 100px;
}

/* 步骤操作按钮样式 */
.step-actions {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 10px;
  width: auto;
  max-width: 200px;
}

/* 版本详情样式 */
.version-detail {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-top: 8px;
}

.version-steps {
  margin-top: 20px;
}

.version-steps h4 {
  margin-bottom: 12px;
  font-weight: 600;
  color: #333;
}

.version-steps .step-item {
  margin-bottom: 16px;
  padding: 12px;
  border: 1px solid #eaeaea;
  border-radius: 6px;
  background-color: #ffffff;
}

.version-steps .step-header {
  margin-bottom: 8px;
  font-weight: 500;
  color: #666;
}

.version-steps .step-content {
  display: flex;
  gap: 20px;
}

.version-steps .step-column {
  flex: 1;
}

.version-steps .step-column label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #666;
}

.no-steps {
  padding: 20px;
  text-align: center;
  color: #999;
  background-color: #f5f5f5;
  border-radius: 6px;
}

/* 描述列表样式 */
.version-detail .el-descriptions {
  margin-bottom: 20px;
}

.version-detail .el-descriptions__cell {
  padding: 10px 12px;
}

.version-detail .el-descriptions__label {
  font-weight: 500;
  color: #666;
  width: 100px;
  min-width: 100px;
}

/* 历史版本分页样式 */
.history-pagination {
  margin-top: 20px;
  text-align: right;
  padding: 16px 0;
  border-top: 1px solid #eaeaea;
  clear: both;
  overflow: visible;
}

/* 历史版本对话框样式 */
.el-dialog {
  max-height: 90vh;
  overflow: auto;
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
  
  .main-content {
    flex-direction: column;
  }
  
  .folder-tree {
    width: 100%;
    height: 300px;
  }
  
  .case-content {
    width: 100%;
  }
  
  .el-table {
    font-size: 14px;
  }
  
  .el-pagination {
    text-align: center;
  }
}
</style>