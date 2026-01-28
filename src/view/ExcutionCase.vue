<template>
  <div class="execution-container">
    <!-- 树形菜单 -->
    <div class="tree-menu">
      <el-tree
        :data="folderTree"
        :props="treeProps"
        node-key="id"
        default-expand-all
        @node-click="handleNodeClick"
      />
      <el-button type="primary" @click="addNode" style="margin-top: 10px;">新增子节点</el-button>
      <el-button type="danger" @click="deleteNode" style="margin-top: 10px;">删除节点</el-button>
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <h1>用例执行-老子还没做</h1>
      <p>用例执行页面</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ExcutionCase',
  data() {
    return {
      folderTree: [], // 树形菜单数据
      treeProps: {
        label: 'folderName', // 树节点显示的名称字段
        children: 'children', // 子节点字段
      },
      selectedNode: null, // 当前选择的节点
    };
  },
  methods: {
    // 获取文件夹数据
    async fetchFolderList() {
      try {
        const response = await this.$http.get('/api/folder/list');
        if (response.data.code === 0) {
          this.folderTree = this.buildTree(response.data.data);
        } else {
          this.$message.error('获取文件夹列表失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    // 将扁平数据转换为树形结构
    buildTree(flatData) {
      const tree = [];
      const map = {};

      flatData.forEach((item) => {
        map[item.id] = { ...item, children: [] };
      });

      flatData.forEach((item) => {
        if (item.parentId) {
          map[item.parentId].children.push(map[item.id]);
        } else {
          tree.push(map[item.id]);
        }
      });

      return tree;
    },

    // 处理树节点点击事件
    handleNodeClick(data) {
      this.selectedNode = data; // 记录当前选中的节点
      console.log('点击的节点：', data);
    },

    // 新增子节点
    async addNode() {
      if (!this.selectedNode) {
        this.$message.warning('请先选择一个节点');
        return;
      }
      const nodeName = prompt('请输入子节点名称');
      if (nodeName) {
        try {
          const response = await this.$http.post('/api/folder/save', { folderName: nodeName, parentId: this.selectedNode.id });
          if (response.data.code === 0) {
            this.$message.success('子节点新增成功');
            this.fetchFolderList(); // 更新树形菜单
          } else {
            this.$message.error('新增失败：' + response.data.message);
          }
        } catch (error) {
          this.$message.error('请求失败：' + error.message);
        }
      }
    },

    // 删除节点
    async deleteNode() {
      if (!this.selectedNode) {
        this.$message.warning('请先选择一个节点');
        return;
      }
      try {
        const response = await this.$http.delete(`/api/folder/remove/${this.selectedNode.id}`);
        if (response.data.code === 0) {
          this.$message.success('节点删除成功');
          this.fetchFolderList(); // 更新树形菜单
        } else {
          this.$message.error('删除失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },
  },
  mounted() {
    this.fetchFolderList(); // 页面加载时获取文件夹数据
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
</style>
