<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <el-menu    
     v-if="!$route.meta.hideNavbar"
      :default-active="$route.path"
      class="nav-menu"
      mode="vertical"
      router
    >

    <!-- 登录状态显示 -->
      <div v-if="isLoggedIn" class="user-info">
        <div class="user-name">{{ userInfo.username || '用户' }}</div>
        <el-button type="text" @click="logout" class="logout-button">退出登录</el-button>
      </div>
      <!-- 未登录状态显示 -->
      <el-menu-item v-else index="/LoginPage">
        <span>登录</span>
      </el-menu-item>
      <el-menu-item index="/case-list">
        <span>用例列表</span>
      </el-menu-item>
      <el-menu-item index="/ExcutionCase">
        <span>测试计划</span>
      </el-menu-item>
      <el-menu-item index="/FilePage">
        <span>文件管理</span>
      </el-menu-item>
      <!-- 手机管理 -->
      <!-- <el-menu-item index="/PhoneManage">
        <span>手机管理</span>
      </el-menu-item> -->
      <!-- 云真机 -->
      <!-- <el-menu-item index="/CloundPhone">
        <span>云真机</span>
      </el-menu-item> -->
      <!-- AI -->
      <!-- <el-menu-item index="/ai-chat">
        <span>AI</span>
      </el-menu-item> -->
      <el-menu-item index="/my-tasks">
        <span>我的任务</span>
      </el-menu-item>
    </el-menu>

    <!-- 内容区域 -->
    <div class="content" :class="{ 'full-width': $route.meta.hideNavbar }">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      // 用户信息
      userInfo: {
        username: localStorage.getItem('username') || ''
      }
    };
  },
  computed: {
    // 检查用户是否已登录
    isLoggedIn() {
      return localStorage.getItem('token') !== null;
    }
  },
  methods: {
    // 退出登录
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      this.userInfo.username = '';
      // 跳转到登录页
      this.$router.push('/LoginPage');
    }
  }
};
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

/* 布局样式 */
.app-container {
  display: flex;
}

.nav-menu {
  width: 200px;
  height: 100vh;
  background-color: #f5f5f5;
  padding: 20px 0;
}

/* 用户信息样式 */
.user-info {
  padding: 0 20px 20px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 20px;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  text-align: center;
}

.logout-button {
  width: 100%;
  color: #909399;
  font-size: 14px;
}

.logout-button:hover {
  color: #f56c6c;
}

.content {
  flex: 1;
  padding: 20px;
}
</style>