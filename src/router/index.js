// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router';
import CaseList from '@/view/CaseList.vue';
import ExcutionCase from '@/view/ExcutionCase.vue';
import FilePage from '@/view/FilePage.vue';
import PhoneManage from '@/view/PhoneManage.vue';
import CloundPhone from '@/view/CloundPhone.vue';
import LoginPage from '@/view/LoginPage.vue';
import ScreenMirror from '@/view/ScreenMirror.vue';
import TestCaseFolderTree from '@/view/TestCaseFolderTree.vue';
import AIChat from '@/view/AIChat.vue';
import MyTasks from '@/view/MyTasks.vue';
import MyTestCases from '@/view/MyTestCases.vue';
import TestCaseExecution from '@/view/TestCaseExecution.vue';

const routes = [
  {
    path: '/LoginPage',
    name: 'LoginPage',
    meta: { hideNavbar: true },
    component: LoginPage,
  },
  {
    path: '/case-list',
    name: 'CaseList',
    component: CaseList,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/ExcutionCase',
    name: 'ExcutionCase',
    component: ExcutionCase,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/FilePage',
    name: 'FilePage',
    component: FilePage,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/PhoneManage',
    name: 'PhoneManage',
    component: PhoneManage,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/CloundPhone',
    name: 'CloundPhone',
    component: CloundPhone,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/ScreenMirror/:serial',
    name: 'ScreenMirror',
    component: ScreenMirror,
    meta: { requiresAuth: true, hideNavbar: true }, // 需要认证，隐藏导航栏
  },
  {
    path: '/test-case-folder-tree',
    name: 'TestCaseFolderTree',
    component: TestCaseFolderTree,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/ai-chat',
    name: 'AIChat',
    component: AIChat,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/my-tasks',
    name: 'MyTasks',
    component: MyTasks,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/my-test-cases',
    name: 'MyTestCases',
    component: MyTestCases,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  {
    path: '/test-case-execution',
    name: 'TestCaseExecution',
    component: TestCaseExecution,
    meta: { requiresAuth: true }, // 添加需要认证的标识
  },
  // 添加默认路径重定向到我的任务页面
  {
    path: '/',
    redirect: '/my-tasks'
  }
];

// 方案一：使用hash模式（简单，不需要服务器配置）
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// 方案二：保持history模式（需要服务器配置支持）
// const router = createRouter({
//   history: createWebHistory(),
//   routes,
// });

// 添加导航守卫
router.beforeEach((to, from, next) => {
  // 检查是否存在 token
  const token = localStorage.getItem('token');
  
  // 检查目标路由是否是登录页
  if (to.path === '/LoginPage') {
    // 如果已登录，保持当前路径不变
    if (token) {
      // 不进行重定向，保持当前路径
      next();
    } else {
      // 未登录，允许访问登录页
      next();
    }
  } 
  // 检查目标路由是否需要认证
  else if (to.meta.requiresAuth) {
    if (token) {
      // 有 token，允许访问
      next();
    } else {
      // 无 token，重定向到登录页
      next('/LoginPage');
    }
  } else {
    // 不需要认证的路由，直接访问
    next();
  }
});

// 处理hash模式下的URL解析
router.beforeResolve((to, from, next) => {
  // 检查是否是从登录页跳转过来的，并且目标路径是云真机页面
  if (from.path === '/LoginPage' && to.path === '/CloundPhone') {
    // 阻止跳转到云真机页面，重定向到我的任务页面
    next('/my-tasks');
  } else {
    next();
  }
});

export default router;