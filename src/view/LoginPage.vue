<template>
  <div class="login-container">
    <div class="login-form">
      <h2 class="login-title">牛马来这里登录</h2>
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="loginRules" 
        class="form-content"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名" 
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="captcha" v-if="captchaEnabled">
          <div class="captcha-container">
            <el-input 
              v-model="loginForm.captcha" 
              placeholder="请输入验证码" 
              prefix-icon="Key"
              class="captcha-input"
            />
            <div class="captcha-image" @click="refreshCaptcha">
              <img 
                v-if="captchaSrc" 
                :src="captchaSrc" 
                alt="验证码" 
                class="captcha-img"
              />
              <div v-else class="captcha-placeholder">加载中...</div>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            native-type="submit" 
            :loading="loading" 
            class="login-button"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 注册按钮 -->
      <div class="register-section">
        <el-button type="text" @click="showRegisterDialog">立即注册</el-button>
      </div>
    </div>
    
    <!-- 注册弹框 -->
    <el-dialog title="用户注册" v-model="registerDialogVisible">
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="registerUsername">
          <el-input
            v-model="registerForm.registerUsername"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item label="密码" prop="registerPassword">
          <el-input
            v-model="registerForm.registerPassword"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleRegisterClose">取 消</el-button>
          <el-button
            type="primary"
            :loading="registerLoading"
            @click="handleRegister"
          >
            {{ registerLoading ? '注册中...' : '注册' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LoginPage',
  metaInfo() {
    return {
      hideNavbar: true // 标记需要隐藏导航栏
    };
  },
  data() {
    // 确认密码验证规则
    const validateConfirmPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.registerForm.registerPassword) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };

    return {
      loginForm: {
        username: '',
        password: '',
        captcha: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        captcha: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
        ]
      },
      // 注册表单数据
      registerForm: {
        registerUsername: '',
        registerPassword: '',
        confirmPassword: ''
      },
      // 注册表单验证规则
      registerRules: {
        registerUsername: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        registerPassword: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      rememberMe: false,
      loading: false,
      captchaSrc: '', // 验证码图片地址
      captchaId: '', // 验证码ID（UUID）
      captchaEnabled: false, // 验证码是否启用的配置
      // 注册相关状态
      registerDialogVisible: false,
      registerLoading: false
    };
  },
  mounted() {
    this.refreshCaptcha();
  },
  methods: {
    // 刷新验证码
    refreshCaptcha() {
      // 只有在验证码启用时才获取验证码
      if (this.captchaEnabled) {
        this.getCaptcha();
      }
    },
    
    // 获取验证码
    getCaptcha() {
      // 生成 UUID 用于本次验证码会话
      const uuid = this.generateUUID();
      this.captchaId = uuid;
      
      this.$http.get(`/api/captcha/gen?captchaId=${uuid}`, {
        responseType: 'blob'
      }).then(response => {
        // 将返回的图片数据转换为 URL
        this.captchaSrc = URL.createObjectURL(response.data);
      }).catch(error => {
        console.error('获取验证码失败:', error);
        this.$message.error('验证码加载失败');
      });
    },
    
    // 生成 UUID 的方法
    generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },
    
    // 验证验证码
    async verifyCaptcha() {
      try {
        const response = await this.$http.post(`/api/captcha/verify?userInput=${this.loginForm.captcha}&captchaId=${this.captchaId}`);
        return response.data.code === 0;
      } catch (error) {
        console.error('验证码校验失败:', error);
        return false;
      }
    },
    
    // 处理登录
    async handleLogin() {
      this.$refs.loginFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true;
          try {
            // 如果启用了验证码，则先验证验证码
            if (this.captchaEnabled) {
              const isCaptchaValid = await this.verifyCaptcha();
              if (!isCaptchaValid) {
                this.$message.error('验证码错误');
                this.refreshCaptcha();
                return;
              }
            }
            
            // 调用登录接口
            const response = await this.$http.post('/api/auth/login', {
              username: this.loginForm.username,
              password: this.loginForm.password,
              captcha: this.loginForm.captcha,
              captchaId: this.captchaId
            });

            // 登录成功后保存 token
            if (response.data.token) {
              // 将 token 存储到 localStorage
              localStorage.setItem('token', response.data.token);
              // 可选：也存储 userId 和 username
              localStorage.setItem('userId', response.data.userId);
              localStorage.setItem('username', response.data.username);
              
              this.$message.success('登录成功');
              // 跳转到我的任务页面
              this.$router.push('/my-tasks');
            }
          } catch (error) {
            this.$message.error(error.message || '登录失败');
            // 登录失败后刷新验证码
            this.refreshCaptcha();
          } finally {
            this.loading = false;
          }
        }
      });
    },

    // 显示注册弹框
    showRegisterDialog() {
      this.registerDialogVisible = true;
    },

    // 关闭注册弹框
    handleRegisterClose() {
      this.registerDialogVisible = false;
      this.$refs.registerFormRef.resetFields();
    },

    // 处理注册
    handleRegister() {
      this.$refs.registerFormRef.validate(async (valid) => {
        if (valid) {
          this.registerLoading = true;
          try {
            const response = await this.$http.post('/api/user/register', {
              username: this.registerForm.registerUsername,
              password: this.registerForm.registerPassword
            });

            if (response.data.code === 0) {
              this.$message.success('注册成功');
              this.handleRegisterClose();
            } else {
              this.$message.error(response.data.message || '注册失败');
            }
          } catch (error) {
            this.$message.error(error.message || '注册失败');
          } finally {
            this.registerLoading = false;
          }
        }
      });
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-form {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-content {
  margin-top: 20px;
}

.captcha-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-image {
  width: 120px;
  height: 40px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.captcha-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: #909399;
}

.login-button {
  width: 100%;
}

.register-section {
  text-align: center;
  margin-top: 20px;
}
</style>