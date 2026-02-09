<template>
  <div class="test-case-folder-tree">
    <!-- 标题行 -->
    <div class="header">
      <h1>测试用例文件夹</h1>
      <div>
        <el-button type="primary" @click="refreshTree">刷新</el-button>
        <el-button type="success" @click="switchToListView">返回列表</el-button>
      </div>
    </div>

    <!-- 文件夹树 -->
    <div class="tree-container">
      <el-tree
        :data="folderTree"
        :props="treeProps"
        node-key="id"
        default-expand-all
        @node-click="handleNodeClick"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="tree-node">
            <span class="node-name">{{ node.label }}</span>
            <span class="node-actions">
              <el-button type="text" size="small" @click.stop="handleAddSubFolder(data)">
                <el-icon><Plus /></el-icon> 新建子文件夹
              </el-button>
              <el-button type="text" size="small" @click.stop="handleEditFolder(data)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button type="text" size="small" @click.stop="handleDeleteFolder(data)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </span>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 新建/编辑文件夹对话框 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="30%">
      <el-form :model="folderForm" label-width="120px">
        <el-form-item label="文件夹名称">
          <el-input v-model="folderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
        <el-form-item label="父文件夹">
          <el-select v-model="folderForm.parentId" placeholder="请选择父文件夹">
            <el-option label="根目录" :value="0" />
            <el-option
              v-for="folder in allFolders"
              :key="folder.id"
              :label="folder.path + ' ' + folder.name"
              :value="folder.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFolder">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Edit, Delete } from '@element-plus/icons-vue';

export default {
  name: 'TestCaseFolderTree',
  components: {
    Plus,
    Edit,
    Delete
  },
  data() {
    return {
      folderTree: [],
      allFolders: [],
      treeProps: {
        children: 'children',
        label: 'name'
      },
      dialogVisible: false,
      dialogTitle: '新建文件夹',
      folderForm: {
        id: 0,
        name: '',
        parentId: 0
      }
    };
  },
  methods: {
    // 切换到列表视图
    switchToListView() {
      this.$router.push('/case-list');
    },

    // 刷新树状结构
    async refreshTree() {
      try {
        const response = await this.$http.get('/api/testCaseFolders/list');
        if (response.data.code === 0) {
          this.allFolders = response.data.data;
          this.folderTree = this.buildFolderTree(this.allFolders);
          this.$message.success('刷新成功');
        } else {
          this.$message.error('获取文件夹树失败');
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    // 构建文件夹树结构
    buildFolderTree(folders) {
      const folderMap = {};
      const rootFolders = [];

      // 首先创建所有文件夹的映射
      folders.forEach(folder => {
        folderMap[folder.id] = {
          ...folder,
          children: []
        };
      });

      // 然后构建树结构
      folders.forEach(folder => {
        if (folder.parentId === 0) {
          // 根文件夹
          rootFolders.push(folderMap[folder.id]);
        } else {
          // 子文件夹
          if (folderMap[folder.parentId]) {
            folderMap[folder.parentId].children.push(folderMap[folder.id]);
          }
        }
      });

      // 按sort字段排序
      this.sortFolderTree(rootFolders);

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

    // 获取所有文件夹
    async getAllFolders() {
      try {
        const response = await this.$http.get('/api/testCaseFolders/list');
        if (response.data.code === 0) {
          this.allFolders = response.data.data;
          this.folderTree = this.buildFolderTree(this.allFolders);
        }
      } catch (error) {
        console.error('获取文件夹列表失败:', error);
      }
    },

    // 处理节点点击
    handleNodeClick(data) {
      console.log('点击节点:', data);
      // 可以在这里添加点击节点后的操作，比如显示该文件夹下的测试用例
    },

    // 处理添加子文件夹
    handleAddSubFolder(data) {
      this.dialogTitle = '新建子文件夹';
      this.folderForm = {
        id: 0,
        name: '',
        parentId: data.id
      };
      this.dialogVisible = true;
    },

    // 处理编辑文件夹
    handleEditFolder(data) {
      this.dialogTitle = '编辑文件夹';
      this.folderForm = {
        id: data.id,
        name: data.name,
        parentId: data.parentId
      };
      this.dialogVisible = true;
    },

    // 处理删除文件夹
    async handleDeleteFolder(folder) {
      this.$confirm('确定要删除这个文件夹吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await this.$http.delete(`/api/testCaseFolders/remove/${folder.id}`);
          if (response.data.code === 0) {
            this.$message.success('删除成功');
            this.refreshTree();
          } else {
            this.$message.error('删除失败');
          }
        } catch (error) {
          this.$message.error('请求失败：' + error.message);
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
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
            sort: 1 // 默认排序值
          });
        } else {
          // 更新文件夹
          response = await this.$http.put('/api/testCaseFolders/update', {
            id: this.folderForm.id,
            name: this.folderForm.name,
            parentId: this.folderForm.parentId,
            sort: 1 // 默认排序值
          });
        }

        if (response.data.code === 0) {
          this.$message.success(this.folderForm.id === 0 ? '创建成功' : '更新成功');
          this.dialogVisible = false;
          this.refreshTree();
        } else {
          this.$message.error(this.folderForm.id === 0 ? '创建失败' : '更新失败');
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    }
  },
  mounted() {
    this.refreshTree();
    this.getAllFolders();
  }
};
</script>

<style scoped>
/* 标题行样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

h1 {
  text-align: center;
  margin: 0;
  flex: 1;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

/* 按钮组样式 */
.header > div {
  display: flex;
  gap: 12px;
}

/* 树状结构容器 */
.tree-container {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  min-height: 600px;
}

/* 树节点样式 */
.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
}

.node-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tree-node:hover .node-actions {
  opacity: 1;
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
  
  .tree-container {
    padding: 16px;
    min-height: 500px;
  }
  
  .node-actions {
    opacity: 1;
    display: flex;
    gap: 4px;
  }
  
  .node-actions .el-button {
    padding: 0 4px;
    font-size: 12px;
  }
}
</style>