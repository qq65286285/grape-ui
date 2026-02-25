<template>
  <div class="ai-chat-container">
    <!-- 功能选择界面 -->
    <div v-if="!activeFeature" class="features-selection">
      <h1>AI功能中心</h1>
      <div class="ai-features-grid">
        <!-- AI聊天助手方块 -->
        <div class="ai-feature-card">
          <div class="feature-icon chat-icon"></div>
          <h2>AI聊天助手</h2>
          <p>与智能助手进行实时对话，获取专业建议和解答</p>
          <el-button type="primary" @click="showChatAssistant">开始聊天助手</el-button>
        </div>
        
        <!-- 文档识别方块 -->
        <div class="ai-feature-card">
          <div class="feature-icon document-icon"></div>
          <h2>文档识别</h2>
          <p>上传文档并进行智能识别和分析</p>
          <el-button type="primary" @click="showDocumentRecognition">开始文档识别</el-button>
        </div>
        
        <!-- 测试用例生成 -->
          <div class="ai-feature-card">
            <div class="feature-icon scenario-icon"></div>
            <h2>测试用例生成</h2>
            <p>通过描述测试场景，智能生成测试用例</p>
            <el-button type="primary" @click="showTestCaseGeneration">开始生成</el-button>
          </div>
      </div>
    </div>
    
    <!-- 聊天助手全屏界面 -->
    <div v-if="activeFeature === 'chat'" class="fullscreen-feature">
      <div class="feature-header">
        <h1>AI聊天助手</h1>
        <el-button type="primary" @click="activeFeature = null">返回功能选择</el-button>
      </div>
      <div class="fullscreen-content">
        <div class="chat-container">
          <!-- 聊天记录 -->
          <div class="chat-messages">
            <div v-for="(message, index) in messages" :key="index" :class="['message', message.type]">
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">{{ message.type === 'user' ? '我' : 'AI助手' }}</span>
                  <span class="message-time">{{ message.time }}</span>
                </div>
                <div class="message-body">{{ message.content }}</div>
              </div>
            </div>
          </div>
          <!-- 输入区域 -->
          <div class="chat-input-area">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="请输入您的问题..."
              @keyup.enter.exact="sendMessage"
            />
            <div class="input-actions">
              <el-button type="primary" @click="sendMessage" :loading="isLoading">发送</el-button>
              <el-button @click="clearMessages">清空记录</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 文档识别全屏界面 -->
    <div v-if="activeFeature === 'document'" class="fullscreen-feature">
      <div class="feature-header">
        <h1>文档识别</h1>
        <el-button type="primary" @click="activeFeature = null">返回功能选择</el-button>
      </div>
      <div class="fullscreen-content">
        <div class="document-recognition-container">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".pdf,.doc,.docx,.txt"
          >
            <el-button size="large" type="primary">点击上传文档</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传 PDF、Word、TXT 格式的文档
              </div>
            </template>
          </el-upload>
          
          <div v-if="selectedFile" class="file-info">
            <el-icon><Document /></el-icon>
            <span>{{ selectedFile.name }}</span>
            <el-button type="text" @click="removeFile">移除</el-button>
          </div>
          
          <el-button 
            type="primary" 
            :disabled="!selectedFile"
            @click="startRecognition"
            :loading="isRecognizing"
          >
            开始识别
          </el-button>
          
          <div v-if="recognitionResult" class="recognition-result">
            <h3>识别结果</h3>
            <el-divider></el-divider>
            <pre>{{ recognitionResult }}</pre>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 测试用例生成全屏界面 -->
    <div v-if="activeFeature === 'scenario'" class="fullscreen-feature">
      <div class="feature-header">
        <h1>生成测试用例</h1>
        <el-button type="primary" @click="activeFeature = null">返回功能选择</el-button>
      </div>
      <div class="fullscreen-content">
        <div class="scenario-generation-container">
          <!-- 场景列表 -->
          <el-card shadow="never" class="scenario-list-card" style="margin-bottom: 30px" :key="'scenario-list-' + scenarioList.length">
            <template #header>
              <div class="card-header">
                <span>场景列表</span>
                <el-button type="primary" size="small" @click="saveCurrentScenario">保存当前场景</el-button>
              </div>
            </template>
            <div class="scenario-list-content">
              <el-empty v-if="scenarioList.length === 0" description="暂无保存的场景" />
              <el-table v-else :data="scenarioList" style="width: 100%">
                <el-table-column prop="module" label="功能模块" width="180" />
                <el-table-column prop="createdAt" label="保存时间" width="180">
                  <template #default="scope">
                    {{ new Date(scope.row.createdAt).toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="200">
                  <template #default="scope">
                    <el-button type="primary" size="small" @click="loadScenario(scope.row)">加载</el-button>
                    <el-button type="danger" size="small" @click="deleteScenario(scope.row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
          
          <el-form :model="scenarioForm" label-width="120px">
            <el-form-item label="1. 功能模块">
              <el-input
                v-model="scenarioForm.module"
                placeholder="请输入测试的功能模块，例如：用户登录、商品购买、订单管理等"
              />
            </el-form-item>
            
            <el-form-item label="2. 用户故事">
              <el-card shadow="never" class="user-story-card">
                <div class="user-story-item">
                  <span class="label">角色：</span>
                  <el-input v-model="scenarioForm.role" placeholder="作为..." style="width: 200px; margin-left: 10px" />
                </div>
                <div class="user-story-item">
                  <span class="label">功能：</span>
                  <el-input v-model="scenarioForm.feature" placeholder="我希望..." style="flex: 1; margin-left: 10px" />
                </div>
                <div class="user-story-item">
                  <span class="label">价值：</span>
                  <el-input v-model="scenarioForm.value" placeholder="以便..." style="flex: 1; margin-left: 10px" />
                </div>
              </el-card>
            </el-form-item>
            
            <el-form-item label="3. 验收标准">
              <div class="multi-input-container">
                <div v-for="(criterion, index) in scenarioForm.acceptanceCriteria" :key="index" class="multi-input-item">
                  <el-input
                    v-model="scenarioForm.acceptanceCriteria[index]"
                    placeholder="请输入验收标准"
                    style="width: 400px; margin-right: 10px"
                  />
                  <el-button type="danger" @click="removeAcceptanceCriterion(index)">-</el-button>
                </div>
                <el-button type="primary" @click="addAcceptanceCriterion">+ 添加验收标准</el-button>
              </div>
            </el-form-item>
            
            <el-form-item label="4. 边界条件">
              <div class="multi-input-container">
                <div v-for="(condition, index) in scenarioForm.boundaryConditions" :key="index" class="multi-input-item">
                  <el-input
                    v-model="scenarioForm.boundaryConditions[index]"
                    placeholder="请输入边界条件"
                    style="width: 400px; margin-right: 10px"
                  />
                  <el-button type="danger" @click="removeBoundaryCondition(index)">-</el-button>
                </div>
                <el-button type="primary" @click="addBoundaryCondition">+ 添加边界条件</el-button>
              </div>
            </el-form-item>
            
            <el-form-item label="5. 关联模块">
              <el-input
                v-model="scenarioForm.relatedModules"
                placeholder="请输入关联的功能模块，例如：用户管理、权限控制等"
              />
            </el-form-item>
            
            <el-form-item label="6. 测试维度">
              <el-checkbox-group v-model="scenarioForm.testDimensions">
                <el-checkbox label="功能测试">核心业务流程</el-checkbox>
                <el-checkbox label="边界测试">输入边界值</el-checkbox>
                <el-checkbox label="异常测试">错误处理</el-checkbox>
                <el-checkbox label="兼容性测试">不同环境</el-checkbox>
                <el-checkbox label="性能测试">响应时间/并发</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
          
          <el-button 
            type="primary" 
            :disabled="!scenarioForm.module || !scenarioForm.acceptanceCriteria.length"
            @click="generateTestCases"
            :loading="isGenerating"
            style="margin-top: 20px"
          >
            生成测试用例
          </el-button>
          
          <!-- 示例说明 -->
          <el-card shadow="never" class="example-card" style="margin-top: 30px">
            <template #header>
              <div class="card-header">
                <span>示例说明</span>
              </div>
            </template>
            <div class="example-content">
              <h4>电商App的「手机号验证码登录」功能测试用例示例：</h4>
              <ul>
                <li><strong>场景：</strong>用户输入正确手机号+6位验证码登录</li>
                <li><strong>场景：</strong>验证码错误/过期/为空</li>
                <li><strong>场景：</strong>手机号格式错误（少于11位、非数字）</li>
                <li><strong>场景：</strong>60秒内重复请求验证码</li>
              </ul>
              <p><strong>需覆盖：</strong>正常流程、异常流程、边界值、安全性（暴力破解防护）</p>
            </div>
          </el-card>
          
          <div v-if="generatedCases" class="generated-cases">
            <h3>生成的测试用例</h3>
            <el-divider></el-divider>
            <div v-for="(testCase, index) in generatedCases" :key="index" class="test-case-item">
              <h4>测试用例 {{ index + 1 }}</h4>
              <div class="test-case-content">
                <p><strong>用例编号：</strong>{{ testCase.caseNumber }}</p>
                <p><strong>用例标题：</strong>{{ testCase.title }}</p>
                <p><strong>用户故事：</strong>{{ testCase.userStory }}</p>
                <p><strong>验收标准：</strong>{{ testCase.acceptanceCriteria || '无' }}</p>
                <p><strong>边界条件：</strong>{{ testCase.boundaryConditions || '无' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Document } from '@element-plus/icons-vue';

export default {
  name: 'AIChat',
  components: {
    Document
  },
  data() {
    return {
      // 功能状态
      activeFeature: null,
      // 聊天相关
      messages: [],
      inputMessage: '',
      isLoading: false,
      // 文档识别相关
      selectedFile: null,
      isRecognizing: false,
      recognitionResult: null,
      // 测试场景生成相关
    scenarioForm: {
      module: '',
      // 用户故事
      role: '',
      feature: '',
      value: '',
      // 验收标准
      acceptanceCriteria: [],
      // 边界条件和关联模块
      boundaryConditions: [],
      relatedModules: '',
      // 测试维度
      testDimensions: ['功能测试']
    },
    isGenerating: false,
    generatedCases: null,
    // 场景列表
    scenarioList: [],
    currentScenario: null,
      // WebSocket相关
      ws: null,
      wsConnected: false,
      wsUrl: '',
      wsReconnectAttempts: 0,
      maxReconnectAttempts: 5,
      // 流式输出相关
      currentAiMessageId: null,
      currentAiMessageIndex: -1,
      // 心跳相关
      heartbeatTimer: null
    };
  },
  methods: {
    // 显示聊天助手
    showChatAssistant() {
      this.activeFeature = 'chat';
      // 如果是第一次打开聊天助手，添加欢迎消息
      if (this.messages.length === 0) {
        const welcomeMessage = {
          type: 'ai',
          content: '你好！我是AI助手，有什么可以帮到你的吗？',
          time: this.formatTime(new Date())
        };
        this.messages.push(welcomeMessage);
      }
    },
    
    // 显示文档识别
    showDocumentRecognition() {
      this.activeFeature = 'document';
    },
    
    // 显示测试用例生成
    showTestCaseGeneration() {
      this.activeFeature = 'scenario';
      // 重置表单和结果
      this.scenarioForm = {
        module: '',
        // 用户故事
        role: '',
        feature: '',
        value: '',
        // 验收标准
        acceptanceCriteria: [],
        // 边界条件和关联模块
        boundaryConditions: [],
        relatedModules: '',
        // 测试维度
        testDimensions: ['功能测试']
      };
      this.generatedCases = null;
    },
    
    // 生成测试用例
    async generateTestCases() {
      if (!this.scenarioForm.module) {
        this.$message.error('请填写功能模块');
        return;
      }
      
      this.isGenerating = true;
      this.generatedCases = null;
      
      try {
        // 构建请求参数
        const requestData = {
          "module": this.scenarioForm.module,
          "userStory": `作为${this.scenarioForm.role || '用户'}，我希望${this.scenarioForm.feature || '使用该功能'}，以便${this.scenarioForm.value || '实现目标'}`,
          "acceptanceCriteria": this.scenarioForm.acceptanceCriteria.join('\n'),
          "boundaryConditions": this.scenarioForm.boundaryConditions.join('\n'),
          "relatedModules": this.scenarioForm.relatedModules,
          "testDimensions": this.scenarioForm.testDimensions,
          "caseType": "Functional Test Case",
          "caseCount": 5,
          "referenceMode": true,
          "similarityThreshold": 0.7,
          "generateMode": "Detailed Mode",
          "caseTemplate": "Standard Test Case Template",
          "coverageRequirements": ["Functional Coverage", "Boundary Coverage", "Exception Coverage"]
        };
        
        // 调用API生成测试用例
        const response = await this.$http.post('/api/ai/testcase/generate', requestData);
        
        if (response.data.code === 0) {
          // 处理API响应
          this.generatedCases = response.data.data || [];
        } else {
          this.$message.error(response.data.message || '生成测试用例失败');
        }
      } catch (error) {
        this.$message.error(error.message || '生成测试用例失败');
      } finally {
        this.isGenerating = false;
      }
    },
    
    // 处理文件上传
    handleFileChange(file) {
      this.selectedFile = file.raw;
      this.recognitionResult = null;
    },
    
    // 移除文件
    removeFile() {
      this.selectedFile = null;
      this.recognitionResult = null;
    },
    
    // 开始文档识别
    startRecognition() {
      if (!this.selectedFile) return;
      
      this.isRecognizing = true;
      
      // 模拟文档识别过程
      setTimeout(() => {
        this.recognitionResult = `文档识别结果：\n\n文件名：${this.selectedFile.name}\n文件大小：${(this.selectedFile.size / 1024).toFixed(2)} KB\n文件类型：${this.selectedFile.type}\n\n识别状态：成功\n\n识别内容摘要：\n这是一个模拟的文档识别结果。在实际应用中，这里会显示文档的主要内容和分析结果。`;
        this.isRecognizing = false;
      }, 2000);
    },
    
    // 发送消息
    sendMessage() {
      if (!this.inputMessage.trim()) return;
      
      console.log('开始发送消息，WebSocket连接状态:', this.wsConnected);
      
      // 添加用户消息
      const userMessage = {
        type: 'user',
        content: this.inputMessage.trim(),
        time: this.formatTime(new Date())
      };
      this.messages.push(userMessage);
      console.log('添加用户消息后:', this.messages);
      
      // 创建AI消息占位符
      const aiMessagePlaceholder = {
        type: 'ai',
        content: '',
        time: this.formatTime(new Date())
      };
      this.messages.push(aiMessagePlaceholder);
      this.currentAiMessageIndex = this.messages.length - 1;
      this.currentAiMessageId = Date.now(); // 用于标识当前AI消息
      console.log('创建AI消息占位符，索引:', this.currentAiMessageIndex);
      console.log('创建占位符后消息列表:', this.messages);
      
      // 清空输入框
      const question = this.inputMessage.trim();
      this.inputMessage = '';
      
      // 显示加载状态
      this.isLoading = true;
      
      // 滚动到底部
      this.scrollToBottom();
      
      // 只使用WebSocket发送消息
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket已连接，通过WebSocket发送消息');
        this.ws.send(JSON.stringify({
          type: 'ask_question',
          question: question
        }));
        console.log('通过WebSocket发送问题:', question);
      } else {
        console.error('WebSocket连接未就绪');
        // 更新错误消息到当前AI消息占位符
        if (this.currentAiMessageIndex >= 0 && this.currentAiMessageIndex < this.messages.length) {
          this.messages[this.currentAiMessageIndex].content = 'WebSocket连接未就绪，请检查网络连接后重试。';
          // 重置当前AI消息索引
          this.currentAiMessageIndex = -1;
          this.currentAiMessageId = null;
        } else {
          // 如果没有占位符，创建新错误消息
          const errorMessage = {
            type: 'ai',
            content: 'WebSocket连接未就绪，请检查网络连接后重试。',
            time: this.formatTime(new Date())
          };
          this.messages.push(errorMessage);
        }
        // 关闭加载状态
        this.isLoading = false;
        // 滚动到底部
        this.scrollToBottom();
      }
    },
    // 清空聊天记录
    clearMessages() {
      this.messages = [];
    },
    // 格式化时间
    formatTime(date) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    },
    // 滚动到底部
    scrollToBottom() {
      setTimeout(() => {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    },
    // 连接WebSocket
    connectWebSocket() {
      try {
        // 关闭已存在的连接
        if (this.ws) {
          console.log('关闭现有WebSocket连接');
          this.ws.close();
        }
        
        // 检查wsUrl是否为空
        if (!this.wsUrl) {
          console.error('WebSocket连接地址为空');
          return;
        }
        
        console.log('正在连接WebSocket:', this.wsUrl);
        
        // 检查WebSocket地址格式
        try {
          const url = new URL(this.wsUrl);
          console.log('WebSocket地址解析成功:', url);
        } catch (urlError) {
          console.error('WebSocket地址格式错误:', urlError);
          return;
        }
        
        // 创建新的WebSocket连接
        console.log('创建WebSocket实例...');
        this.ws = new WebSocket(this.wsUrl);
        
        console.log('WebSocket连接状态:', this.ws.readyState);
        
        // 连接成功
        this.ws.onopen = () => {
          console.log('WebSocket连接成功');
          console.log('WebSocket readyState:', this.ws.readyState);
          this.wsConnected = true;
          this.wsReconnectAttempts = 0; // 重置重连次数
          console.log('WebSocket连接状态:', this.wsConnected);
          
          // 连接成功后发送心跳
          this.startHeartbeat();
        };
        
        // 接收消息
        this.ws.onmessage = (event) => {
          try {
            console.log('收到WebSocket消息事件:', event);
            const message = JSON.parse(event.data);
            console.log('收到WebSocket消息:', message);
            console.log('当前AI消息索引:', this.currentAiMessageIndex);
            console.log('当前消息列表长度:', this.messages.length);
            
            // 处理新的消息格式
            if (message.header && message.payload) {
              // 检查是否是成功响应
              if (message.header.code === 0 && message.header.status === 1) {
                // 提取AI回复内容
                const aiResponse = message.payload.choices?.text?.[0]?.reasoning_content;
                console.log('提取到的AI响应:', aiResponse);
                if (aiResponse) {
                  // 查找最后一条AI消息
                  let lastAiMessageIndex = -1;
                  for (let i = this.messages.length - 1; i >= 0; i--) {
                    if (this.messages[i].type === 'ai') {
                      lastAiMessageIndex = i;
                      break;
                    }
                  }
                  
                  console.log('找到最后一条AI消息索引:', lastAiMessageIndex);
                  
                  if (lastAiMessageIndex >= 0) {
                    // 更新最后一条AI消息
                    console.log('更新最后一条AI消息，索引:', lastAiMessageIndex);
                    console.log('更新前内容:', this.messages[lastAiMessageIndex].content);
                    // 追加内容到最后一条AI消息
                    this.messages[lastAiMessageIndex].content += aiResponse;
                    console.log('更新后内容:', this.messages[lastAiMessageIndex].content);
                  } else {
                    // 如果没有AI消息，创建新消息
                    console.log('没有找到AI消息，创建新消息');
                    const aiMessage = {
                      type: 'ai',
                      content: aiResponse,
                      time: this.formatTime(new Date())
                    };
                    this.messages.push(aiMessage);
                    console.log('创建新消息后列表长度:', this.messages.length);
                  }
                  this.scrollToBottom();
                  // 关闭加载状态
                  this.isLoading = false;
                }
              }
            } else if (message.type === 'ai_response') {
              // 兼容旧的消息格式
              const aiResponse = message.data;
              console.log('提取到的旧格式AI响应:', aiResponse);
              if (aiResponse) {
                // 查找最后一条AI消息
                let lastAiMessageIndex = -1;
                for (let i = this.messages.length - 1; i >= 0; i--) {
                  if (this.messages[i].type === 'ai') {
                    lastAiMessageIndex = i;
                    break;
                  }
                }
                
                console.log('找到最后一条AI消息索引:', lastAiMessageIndex);
                
                if (lastAiMessageIndex >= 0) {
                  // 更新最后一条AI消息
                  console.log('更新最后一条AI消息（旧格式），索引:', lastAiMessageIndex);
                  // 追加内容到最后一条AI消息
                  this.messages[lastAiMessageIndex].content += aiResponse;
                } else {
                  // 如果没有AI消息，创建新消息
                  console.log('没有找到AI消息（旧格式），创建新消息');
                  const aiMessage = {
                    type: 'ai',
                    content: aiResponse,
                    time: this.formatTime(new Date())
                  };
                  this.messages.push(aiMessage);
                }
                this.scrollToBottom();
                // 关闭加载状态
                this.isLoading = false;
              }
            } else if (message.type === 'heartbeat') {
              // 处理心跳响应
              console.log('收到心跳响应');
              this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), 30000);
            } else if (message.type === 'ai_stream') {
              // 处理流式输出消息
              const streamContent = message.content;
              console.log('收到流式输出内容:', streamContent);
              if (streamContent) {
                // 查找最后一条AI消息
                let lastAiMessageIndex = -1;
                for (let i = this.messages.length - 1; i >= 0; i--) {
                  if (this.messages[i].type === 'ai') {
                    lastAiMessageIndex = i;
                    break;
                  }
                }
                
                console.log('找到最后一条AI消息索引:', lastAiMessageIndex);
                
                if (lastAiMessageIndex >= 0) {
                  // 追加内容到最后一条AI消息
                  this.messages[lastAiMessageIndex].content += streamContent;
                  this.scrollToBottom();
                }
                
                // 检查是否是流结束
                if (message.is_end) {
                  console.log('流式输出结束');
                  // 关闭加载状态
                  this.isLoading = false;
                }
              }
            } else {
              console.log('未知消息格式:', message);
            }
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };
        
        // 连接关闭
        this.ws.onclose = (event) => {
          console.log('WebSocket连接关闭:', event.code, event.reason);
          console.log('WebSocket readyState:', this.ws.readyState);
          this.wsConnected = false;
          console.log('WebSocket连接状态:', this.wsConnected);
          
          // 清除心跳
          this.clearHeartbeat();
          
          // 自动重连
          this.reconnectWebSocket();
        };
        
        // 连接错误
        this.ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          console.log('WebSocket readyState:', this.ws.readyState);
          this.wsConnected = false;
          console.log('WebSocket连接状态:', this.wsConnected);
          
          // 清除心跳
          this.clearHeartbeat();
          
          // 尝试重连
          this.reconnectWebSocket();
        };
      } catch (error) {
        console.error('WebSocket连接失败:', error);
        this.wsConnected = false;
        console.log('WebSocket连接状态:', this.wsConnected);
        
        // 清除心跳
        this.clearHeartbeat();
        
        // 发生错误时尝试重连
        this.reconnectWebSocket();
      }
    },
    
    // 重新连接WebSocket
    reconnectWebSocket() {
      if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
        this.wsReconnectAttempts++;
        console.log(`WebSocket尝试重连(${this.wsReconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        // 延迟重连
        setTimeout(() => {
          this.connectWebSocket();
        }, 2000 * this.wsReconnectAttempts); // 指数退避
      } else {
        console.error('WebSocket重连失败，已达到最大尝试次数');
        // 添加错误消息到聊天界面
        const errorMessage = {
          type: 'ai',
          content: 'AI服务连接失败，请稍后再试',
          time: this.formatTime(new Date())
        };
        this.messages.push(errorMessage);
        this.scrollToBottom();
      }
    },
    // 关闭WebSocket连接
    closeWebSocket() {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
        this.wsConnected = false;
        // 清除心跳
        this.clearHeartbeat();
      }
    },
    // 开始心跳
    startHeartbeat() {
      console.log('开始心跳');
      this.sendHeartbeat();
    },
    // 发送心跳
    sendHeartbeat() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('发送心跳');
        this.ws.send(JSON.stringify({ type: 'heartbeat' }));
        // 设置下次心跳
        this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), 30000);
      }
    },
    // 清除心跳
    clearHeartbeat() {
      if (this.heartbeatTimer) {
        console.log('清除心跳');
        clearTimeout(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    },
    
    // 场景列表相关方法
    // 保存当前场景
    saveCurrentScenario() {
      if (!this.scenarioForm.module) {
        this.$message.error('请填写功能模块');
        return;
      }
      
      const scenario = {
        id: Date.now(),
        module: this.scenarioForm.module,
        role: this.scenarioForm.role,
        feature: this.scenarioForm.feature,
        value: this.scenarioForm.value,
        acceptanceCriteria: [...this.scenarioForm.acceptanceCriteria],
        boundaryConditions: [...this.scenarioForm.boundaryConditions],
        relatedModules: this.scenarioForm.relatedModules,
        testDimensions: [...this.scenarioForm.testDimensions],
        createdAt: Date.now()
      };
      
      this.scenarioList.push(scenario);
      this.$message.success('场景保存成功');
    },
    
    // 加载场景
    loadScenario(scenario) {
      this.scenarioForm = {
        module: scenario.module,
        role: scenario.role,
        feature: scenario.feature,
        value: scenario.value,
        acceptanceCriteria: [...scenario.acceptanceCriteria],
        boundaryConditions: [...scenario.boundaryConditions],
        relatedModules: scenario.relatedModules,
        testDimensions: [...scenario.testDimensions]
      };
      this.currentScenario = scenario;
      this.$message.success('场景加载成功');
    },
    
    // 删除场景
    deleteScenario(scenarioId) {
      this.scenarioList = this.scenarioList.filter(item => item.id !== scenarioId);
      if (this.currentScenario && this.currentScenario.id === scenarioId) {
        this.currentScenario = null;
      }
      this.$message.success('场景删除成功');
    },
    
    // 验收标准相关方法
    addAcceptanceCriterion() {
      this.scenarioForm.acceptanceCriteria.push('');
    },
    
    removeAcceptanceCriterion(index) {
      this.scenarioForm.acceptanceCriteria.splice(index, 1);
    },
    
    // 边界条件相关方法
    addBoundaryCondition() {
      this.scenarioForm.boundaryConditions.push('');
    },
    
    removeBoundaryCondition(index) {
      this.scenarioForm.boundaryConditions.splice(index, 1);
    }
  },
  mounted() {
    // 直接使用localhost:8209作为WebSocket连接地址，确保与后端服务匹配
    // 从环境变量读取API地址并转换为WebSocket地址
    const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://192.168.22.140:8209';
    // 将http://转换为ws://
    this.wsUrl = apiBaseUrl.replace(/^http:/, 'ws:') + '/api/ws';
    console.log('WebSocket连接地址:', this.wsUrl);
    
    // 连接WebSocket
    this.connectWebSocket();
    
    // 监听消息列表变化
    this.$watch('messages', (newVal) => {
      console.log('消息列表变化:', newVal);
      console.log('当前AI消息索引:', this.currentAiMessageIndex);
    }, { deep: true });
  },
  beforeUnmount() {
    // 关闭WebSocket连接
    this.closeWebSocket();
  }
};
</script>

<style scoped>
.ai-chat-container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  overflow: hidden;
}

/* 功能选择界面 */
.features-selection {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 40px 20px;
}

.features-selection h1 {
  margin-bottom: 50px;
  color: #333;
  font-size: 32px;
  font-weight: 600;
  text-align: center;
}

.ai-features-grid {
  display: flex;
  gap: 30px;
  justify-content: center;
  align-items: stretch;
  flex-wrap: wrap;
  flex: 1;
  padding: 0 20px;
}

.ai-feature-card {
  width: 380px;
  height: 320px;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  padding: 30px;
  background-color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.ai-feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.chat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.document-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.scenario-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.ai-feature-card h2 {
  margin-bottom: 12px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.ai-feature-card p {
  margin-bottom: 30px;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
}

.ai-feature-card .el-button {
  padding: 10px 24px;
  font-size: 14px;
  align-self: flex-start;
}

/* 全屏功能界面 */
.fullscreen-feature {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background-color: #f5f7fa;
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.feature-header h1 {
  margin: 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.feature-header .el-button {
  padding: 10px 24px;
  font-size: 14px;
}

.fullscreen-content {
  flex: 1;
  overflow: hidden;
}

/* 聊天容器 */
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  overflow: hidden;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chat-messages {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.message {
  margin-bottom: 20px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.ai {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message.user .message-content {
  background-color: #e6f7ff;
  border-top-right-radius: 0;
}

.message.ai .message-content {
  background-color: #ffffff;
  border-top-left-radius: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #999;
}

.message-sender {
  font-weight: 600;
}

.message-body {
  font-size: 16px;
  line-height: 1.6;
  color: #333;
}

.chat-input-area {
  padding: 30px;
  border-top: 1px solid #eaeaea;
  background-color: #f9f9f9;
}

.chat-input-area .el-input {
  margin-bottom: 20px;
}

.chat-input-area .el-input__inner {
  font-size: 16px;
  line-height: 1.5;
  min-height: 120px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.input-actions .el-button {
  padding: 10px 32px;
  font-size: 16px;
}

/* 文档识别容器 */
.document-recognition-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 40px;
  background-color: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-demo {
  margin-bottom: 30px;
}

.upload-demo .el-button {
  padding: 16px 48px;
  font-size: 18px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  background-color: #f9f9f9;
  font-size: 16px;
}

.file-info .el-icon {
  font-size: 24px;
  color: #666;
}

.file-info span {
  flex: 1;
  color: #333;
}

.document-recognition-container .el-button {
  align-self: flex-start;
  padding: 12px 32px;
  font-size: 16px;
}

.recognition-result {
  flex: 1;
  padding: 30px;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  background-color: #f9f9f9;
  overflow-y: auto;
}

.recognition-result h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.recognition-result pre {
  white-space: pre-wrap;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
}

/* 测试场景生成容器 */
.scenario-generation-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
  padding: 40px;
  background-color: #ffffff;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.scenario-generation-container .el-form {
  margin-bottom: 20px;
}

.scenario-generation-container .el-form-item {
  margin-bottom: 24px;
}

.scenario-generation-container .el-textarea {
  width: 100%;
}

.scenario-generation-container .el-textarea__inner {
  font-size: 16px;
  line-height: 1.6;
  min-height: 120px;
}

/* 用户故事卡片样式 */
.user-story-card {
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.user-story-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.user-story-item:last-child {
  margin-bottom: 0;
}

.user-story-item .label {
  font-weight: 600;
  color: #666;
  min-width: 60px;
}

.user-story-item .el-input {
  flex: 1;
}

/* 测试维度样式 */
.scenario-generation-container .el-checkbox {
  margin-right: 20px;
  margin-bottom: 10px;
}

.scenario-generation-container .el-checkbox__label {
  font-size: 14px;
}

/* 生成的测试用例 */
.generated-cases {
  flex: 1;
  padding: 30px;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  background-color: #f9f9f9;
  overflow-y: auto;
  margin-top: 20px;
}

.generated-cases h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.test-case-item {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.test-case-item h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 10px;
}

.test-case-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.test-case-content p {
  margin-bottom: 10px;
}

.test-case-content strong {
  color: #666;
  margin-right: 8px;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar,
.recognition-result::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track,
.recognition-result::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb,
.recognition-result::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.recognition-result::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 场景列表卡片样式 */
.scenario-list-card {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.scenario-list-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.scenario-list-content {
  padding: 10px 0;
}

/* 示例卡片样式 */
.example-card {
  border: 1px solid #eaeaea;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.example-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.example-content {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}

.example-content h4 {
  margin-bottom: 15px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.example-content ul {
  margin-bottom: 15px;
  padding-left: 20px;
}

.example-content li {
  margin-bottom: 8px;
}

.example-content p {
  margin-bottom: 0;
}

/* 多输入框样式 */
.multi-input-container {
  margin-bottom: 10px;
}

.multi-input-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.multi-input-item .el-input {
  flex: 1;
  margin-right: 10px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .ai-features-grid {
    gap: 30px;
  }
  
  .ai-feature-card {
    width: 480px;
    height: 360px;
  }
}

@media (max-width: 768px) {
  .features-selection {
    padding: 20px 10px;
  }
  
  .features-selection h1 {
    font-size: 24px;
    margin-bottom: 30px;
  }
  
  .ai-feature-card {
    width: 100%;
    max-width: 540px;
    height: auto;
    min-height: 300px;
    padding: 30px;
  }
  
  .feature-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .chat-messages {
    padding: 20px;
  }
  
  .chat-input-area {
    padding: 20px;
  }
  
  .document-recognition-container {
    padding: 20px;
  }
}
</style>