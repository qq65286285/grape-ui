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

        <el-table-column label="更新时间" min-width="150" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleView(scope.row)"
              icon="el-icon-view"
              style="margin-right: 8px"
            >
              查看
            </el-button>
            <el-button 
              type="info" 
              size="small" 
              @click="handleExecuteStatus(scope.row)"
              icon="el-icon-data-line"
            >
              执行情况
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
        width="60%"
        center
      >
        <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="140px" class="create-plan-form">
          <!-- 基本信息 -->
          <div class="form-section">
            <h3 class="section-title">基本信息</h3>
            <div class="form-row">
              <el-form-item label="计划编号" prop="planNo" class="form-item-half">
                <el-input v-model="createForm.planNo" placeholder="请输入计划编号" size="large" />
              </el-form-item>
              <el-form-item label="计划名称" prop="planName" class="form-item-half">
                <el-input v-model="createForm.planName" placeholder="请输入计划名称" size="large" />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="计划类型" prop="planType" class="form-item-half">
                <el-select v-model="createForm.planType" placeholder="请选择计划类型" size="large">
                  <el-option label="项目测试" value="1" />
                  <el-option label="迭代测试" value="2" />
                  <el-option label="专项测试" value="3" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态" prop="status" class="form-item-half">
                <el-select v-model="createForm.status" placeholder="请选择状态" size="large">
                  <el-option label="未开始" value="1" />
                  <el-option label="进行中" value="2" />
                  <el-option label="已完成" value="3" />
                  <el-option label="已暂停" value="4" />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="项目ID" prop="projectId" class="form-item-half">
                <el-input v-model.number="createForm.projectId" placeholder="请输入项目ID" size="large" />
              </el-form-item>
              <el-form-item label="迭代ID" prop="iterationId" class="form-item-half">
                <el-input v-model.number="createForm.iterationId" placeholder="请输入迭代ID" size="large" />
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="负责人" prop="ownerId" class="form-item-half">
                <el-select v-model="createForm.ownerId" placeholder="请选择负责人" size="large">
                  <el-option 
                    v-for="user in users" 
                    :key="user.id" 
                    :label="user.nickname || user.username" 
                    :value="user.id" 
                  />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="计划开始时间" prop="planStartDate" class="form-item-half">
                <el-date-picker 
                  v-model="createForm.planStartDate" 
                  type="date" 
                  placeholder="请选择计划开始时间" 
                  style="width: 100%" 
                  value-format="YYYY-MM-DD"
                  size="large"
                />
              </el-form-item>
              <el-form-item label="计划结束时间" prop="planEndDate" class="form-item-half">
                <el-date-picker 
                  v-model="createForm.planEndDate" 
                  type="date" 
                  placeholder="请选择计划结束时间" 
                  style="width: 100%" 
                  value-format="YYYY-MM-DD"
                  size="large"
                />
              </el-form-item>
            </div>
          </div>
          
          <!-- 详细信息 -->
          <div class="form-section">
            <h3 class="section-title">详细信息</h3>
            <el-form-item label="计划描述" prop="description">
              <el-input v-model="createForm.description" placeholder="请输入计划描述" type="textarea" rows="3" size="large" />
            </el-form-item>
            <el-form-item label="测试范围" prop="testScope">
              <el-input v-model="createForm.testScope" placeholder="请输入测试范围" type="textarea" rows="3" size="large" />
            </el-form-item>
            <el-form-item label="测试目标" prop="testTarget">
              <el-input v-model="createForm.testTarget" placeholder="请输入测试目标" type="textarea" rows="3" size="large" />
            </el-form-item>
            <el-form-item label="测试策略" prop="testStrategy">
              <el-input v-model="createForm.testStrategy" placeholder="请输入测试策略" type="textarea" rows="3" size="large" />
            </el-form-item>
            <el-form-item label="验收标准" prop="acceptanceCriteria">
              <el-input v-model="createForm.acceptanceCriteria" placeholder="请输入验收标准" type="textarea" rows="3" size="large" />
            </el-form-item>
          </div>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button size="large" @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" size="large" @click="submitForm">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 查看测试计划对话框 -->
      <el-dialog
        v-model="viewDialogVisible"
        title="查看测试计划"
        width="80%"
      >
        <el-tabs v-model="activeTab">
          <!-- 基本信息标签页 -->
          <el-tab-pane label="基本信息" name="basic">
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
              <el-form-item label="计划开始时间">
                <span>{{ viewForm.planStartDate || '-' }}</span>
              </el-form-item>
              <el-form-item label="计划结束时间">
                <span>{{ viewForm.planEndDate || '-' }}</span>
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
          </el-tab-pane>
          <!-- 成员信息标签页 -->
          <el-tab-pane label="成员信息" name="members">
            <div class="members-header" style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
              <h3>成员列表</h3>
              <el-button 
                type="primary" 
                @click="handleAssign({ id: viewForm.id, planName: viewForm.planName })"
                icon="el-icon-user"
              >
                分配人员
              </el-button>
            </div>
            <el-table :data="planMembers" style="width: 100%" v-loading="membersLoading">
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column label="成员" width="150">
                <template #default="scope">
                  {{ getUserName(scope.row.userId) }}
                </template>
              </el-table-column>
              <el-table-column label="角色类型" width="120">
                <template #default="scope">
                  {{ getRoleTypeLabel(scope.row.roleType) }}
                </template>
              </el-table-column>
              <el-table-column prop="assignedCaseCount" label="分配用例数" width="120" />
              <el-table-column prop="executedCaseCount" label="已执行用例数" width="120" />
              <el-table-column label="执行进度" width="150">
                <template #default="scope">
                  <el-progress 
                    :percentage="scope.row.assignedCaseCount > 0 ? (scope.row.executedCaseCount / scope.row.assignedCaseCount) * 100 : 0" 
                    :stroke-width="10" 
                  />
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
                    {{ scope.row.status === 1 ? '活跃' : '非活跃' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="分配时间" width="180">
                <template #default="scope">
                  {{ formatDate(scope.row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="250" fixed="right">
                <template #default="scope">
                  <div style="display: flex; gap: 12px; align-items: center;">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="handleAssignCases(scope.row)"
                      icon="el-icon-s-order"
                    >
                      分配用例
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="handleDeleteMember(scope.row)"
                      icon="el-icon-delete"
                    >
                      删除
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="viewDialogVisible = false">关闭</el-button>
          </span>
        </template>
      </el-dialog>

    <!-- 分配测试计划对话框 -->
    <el-dialog 
      title="分配测试计划" 
      v-model="assignDialogVisible" 
      width="50%"
    >
      <el-form :model="assignForm" label-width="100px">
        <el-form-item label="测试计划">
          <el-input v-model="assignForm.planName" disabled />
        </el-form-item>
        <el-form-item label="分配成员">
          <el-select 
            v-model="assignForm.userIds" 
            multiple 
            placeholder="请选择成员"
            style="width: 100%"
          >
            <el-option 
              v-for="user in users" 
              :key="user.id" 
              :label="user.nickname || user.username" 
              :value="user.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAssign">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 分配用例对话框 -->
    <el-dialog 
      title="分配用例" 
      v-model="assignCasesDialogVisible" 
      width="80%"
    >
      <div v-loading="assignCasesLoading">
        <el-form :model="assignCasesForm" label-width="100px">
          <el-form-item label="执行人">
            <div style="width: 100%;">
              <el-input v-model="assignCasesForm.memberName" disabled style="width: 100%;" />
            </div>
          </el-form-item>
          <!-- 分配类型：自动分配，隐藏选择 -->
          <el-form-item label="分配类型" style="display: none;">
            <div style="width: 100%;">
              <el-select v-model="assignCasesForm.assignType" placeholder="请选择分配类型" style="width: 100%">
                <el-option label="自动分配" value="2" />
              </el-select>
            </div>
          </el-form-item>
          <el-form-item label="选择用例">
            <div style="width: 100%;">
              <el-button type="primary" @click="openCaseSelectionDialog" style="margin-bottom: 20px; width: 100%;">
                选择用例
              </el-button>
              <div style="border: 1px solid #e4e7ed; border-radius: 8px; padding: 20px; background-color: #f9fafc;">
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                  <h5 style="margin: 0; font-size: 14px; font-weight: 600; color: #303133;">已选择用例</h5>
                  <el-tag type="primary" size="small">{{ selectedCases.length }}</el-tag>
                </div>
                <div v-if="selectedCases.length > 0">
                  <div style="max-height: 300px; overflow-y: auto; border: 1px solid #e4e7ed; border-radius: 6px; padding: 16px; background-color: #ffffff;">
                    <div 
                      v-for="caseItem in selectedCases" 
                      :key="caseItem.id"
                      style="font-size: 14px; margin-bottom: 8px; padding: 8px; border-radius: 4px; background-color: #f5f7fa;"
                    >
                      {{ caseItem.caseNumber }} - {{ caseItem.title || caseItem.name }}
                    </div>
                  </div>
                </div>
                <div v-else style="color: #909399; font-size: 14px; text-align: center; padding: 30px 0; border: 1px dashed #e4e7ed; border-radius: 6px;">
                  暂无选中用例
                </div>
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="assignCasesDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAssignCases">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 测试用例选择模态窗口 -->
    <el-dialog 
      title="选择测试用例" 
      v-model="caseSelectionDialogVisible" 
      width="95%"
      :fullscreen="false"
    >
      <div v-loading="caseSelectionLoading">
        <!-- 主内容区域 -->
        <div style="display: flex; gap: 24px; height: 600px">
          <!-- 左侧文件夹树 -->
          <div style="width: 300px; border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden;">
            <div style="padding: 16px; border-bottom: 1px solid #e4e7ed; background-color: #f7f9fc;">
              <h4 style="margin: 0; font-size: 16px; font-weight: 600;">测试用例结构</h4>
            </div>
            <div style="height: calc(100% - 56px); overflow-y: auto;">
              <el-tree
                ref="folderTree"
                :data="folderTree"
                :props="treeProps"
                node-key="id"
                default-expand-all
                @node-click="handleFolderClick"
                style="width: 100%"
              >
                <template #default="{ data }">
                  <div class="tree-node-content">
                    <span>{{ data.name }}</span>
                    <el-tag 
                      v-if="data.id === 0" 
                      type="info"
                      size="small"
                      style="margin-left: 8px"
                    >
                      根目录
                    </el-tag>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
          
          <!-- 右侧测试用例列表 -->
          <div style="flex: 1; border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden;">
            <!-- 搜索和筛选 -->
            <div style="padding: 16px; border-bottom: 1px solid #e4e7ed; background-color: #f7f9fc;">
              <el-form :inline="true" :model="caseSearchForm" style="width: 100%;">
                <el-form-item label="用例编号">
                  <el-input v-model="caseSearchForm.caseNumber" placeholder="请输入用例编号" style="width: 180px" />
                </el-form-item>
                <el-form-item label="用例标题">
                  <el-input v-model="caseSearchForm.title" placeholder="请输入用例标题" style="width: 200px" />
                </el-form-item>
                <el-form-item label="优先级">
                  <el-select v-model="caseSearchForm.priority" placeholder="请选择优先级" style="width: 120px">
                    <el-option label="高" value="3" />
                    <el-option label="中" value="2" />
                    <el-option label="低" value="1" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleCaseSearch">查询</el-button>
                  <el-button @click="resetCaseSearch">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
            
            <!-- 测试用例列表 -->
            <div style="height: calc(100% - 96px); overflow-y: auto;">
              <el-table ref="caseTable" :data="testCasesList" style="width: 100%" @selection-change="handleCaseTableSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column prop="caseNumber" label="用例编号" width="160" />
                <el-table-column prop="title" label="标题" width="250" />
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="priority" label="优先级" width="80">
                  <template #default="scope">
                    <el-tag 
                      :type="scope.row.priority === 3 ? 'danger' : scope.row.priority === 2 ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ scope.row.priority === 3 ? '高' : scope.row.priority === 2 ? '中' : '低' }}
                    </el-tag>
                  </template>
                </el-table-column>

              </el-table>
            </div>
          </div>
          
          <!-- 右侧选中信息 -->
          <div style="width: 300px; border: 1px solid #e4e7ed; border-radius: 8px; overflow: hidden;">
            <div style="padding: 16px; border-bottom: 1px solid #e4e7ed; background-color: #f7f9fc;">
              <h4 style="margin: 0; font-size: 16px; font-weight: 600;">选中信息</h4>
            </div>
            <div style="height: calc(100% - 56px); overflow-y: auto; padding: 16px;">
              <div style="margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
                <span>已选择用例：</span>
                <el-tag type="primary" size="small">{{ selectedCases.length }}</el-tag>
              </div>
              <div v-if="selectedCases.length > 0">
                <h5 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 600;">选中用例</h5>
                <div style="max-height: 400px; overflow-y: auto;">
                  <div 
                    v-for="caseItem in selectedCases" 
                    :key="caseItem.id"
                    style="font-size: 14px; margin-bottom: 8px; padding: 8px; border-radius: 4px; background-color: #f5f7fa; display: flex; justify-content: space-between; align-items: center;"
                  >
                    <span>{{ caseItem.caseNumber }} - {{ caseItem.title || caseItem.name }}</span>
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="removeFromSelectedCases(caseItem)"
                      style="color: #f56c6c;"
                    >
                      移除
                    </el-button>
                  </div>
                </div>
              </div>
              <div v-else style="color: #909399; font-size: 14px; text-align: center; padding: 40px 0; border: 1px dashed #e4e7ed; border-radius: 6px;">
                暂无选中用例
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="caseSelectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCaseSelection">确认选择</el-button>
      </template>
    </el-dialog>

    <!-- 执行情况对话框 -->
    <el-dialog 
      title="执行情况" 
      v-model="executeStatusDialogVisible" 
      width="80%"
    >
      <div v-loading="executeStatusLoading">
        <!-- 执行情况汇总 -->
        <div class="execute-summary" v-if="executeStatusData.summary">
          <h3>执行情况汇总</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">总用例数</div>
                <div class="summary-value">{{ executeStatusData.summary.totalCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">已执行</div>
                <div class="summary-value">{{ executeStatusData.summary.executedCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">通过</div>
                <div class="summary-value">{{ executeStatusData.summary.passCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">失败</div>
                <div class="summary-value">{{ executeStatusData.summary.failCount }}</div>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 16px">
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">未执行</div>
                <div class="summary-value">{{ executeStatusData.summary.unexecutedCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">执行率</div>
                <div class="summary-value">{{ executeStatusData.summary.executeRate }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">通过率</div>
                <div class="summary-value">{{ executeStatusData.summary.passRate }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-label">失败率</div>
                <div class="summary-value">{{ executeStatusData.summary.failRate }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 用例执行详情 -->
        <div class="execute-details" style="margin-top: 24px">
          <h3>用例执行详情</h3>
          <el-table :data="executeStatusData.cases || []" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="caseNumber" label="用例编号" width="120" />
            <el-table-column prop="title" label="用例标题" min-width="200" />
            <el-table-column prop="priority" label="优先级" width="100" />
            <el-table-column label="执行状态" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.executeStatus === 1 ? 'success' : scope.row.executeStatus === 2 ? 'danger' : 'info'">
                  {{ scope.row.executeStatus === 1 ? '通过' : scope.row.executeStatus === 2 ? '失败' : '未执行' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="执行次数" width="100">
              <template #default="scope">
                {{ scope.row.executeCount || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="最后执行时间" width="180">
              <template #default="scope">
                {{ scope.row.lastExecuteTime ? formatDate(scope.row.lastExecuteTime) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="执行人" width="150">
              <template #default="scope">
                {{ getUserName(scope.row.executorId) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="executeStatusDialogVisible = false">关闭</el-button>
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
      assignDialogVisible: false, // 分配对话框显示状态
      assignForm: {
        planId: '',
        userIds: [],
        assignedBy: ''
      }, // 分配表单数据
      activeTab: 'basic', // 当前激活的标签页
      planMembers: [], // 测试计划成员列表
      membersLoading: false, // 成员加载状态
      executeStatusDialogVisible: false, // 执行情况对话框显示状态
      executeStatusData: {}, // 执行情况数据
      executeStatusLoading: false, // 执行情况加载状态
      assignCasesDialogVisible: false, // 分配用例对话框显示状态
      assignCasesLoading: false, // 分配用例加载状态
      assignCasesForm: { // 分配用例表单数据
        memberId: '',
        memberName: '',
        assignType: 2,
        workload: '',
        assignedBy: ''
      },
      caseSelectionDialogVisible: false, // 测试用例选择模态窗口显示状态
      caseSelectionLoading: false, // 测试用例选择模态窗口加载状态
      caseSearchForm: { // 测试用例搜索表单数据
        caseNumber: '',
        title: '',
        priority: ''
      },
      selectedCases: [], // 选中的用例
      testCasesList: [], // 测试用例列表
      testCasesTree: [], // 树形结构的测试用例列表
      folderTree: [], // 文件夹树结构
      currentFolderId: 0, // 当前选中的文件夹ID
      treeProps: {
        children: 'children',
        label: 'name'
      }, // 树形组件配置
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
        acceptanceCriteria: '',
        planStartDate: '',
        planEndDate: ''
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
          // 获取测试计划成员信息
          this.fetchPlanMembers(row.id);
        } else {
          this.$message.error('获取详情失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    async fetchPlanMembers(planId) {
      try {
        this.membersLoading = true;
        const response = await this.$http.get(`/api/testPlanMember/listByPlanId/${planId}`);
        if (response.data.code === 0) {
          this.planMembers = response.data.data;
        } else {
          this.$message.error('获取成员信息失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      } finally {
        this.membersLoading = false;
      }
    },

    handleExecuteStatus(row) {
      this.executeStatusDialogVisible = true;
      // 获取执行情况数据
      this.fetchExecuteStatus(row.id);
    },

    async fetchExecuteStatus(planId) {
      try {
        this.executeStatusLoading = true;
        const response = await this.$http.get(`/api/testPlanCaseSnapshot/listByPlanId/${planId}`);
        if (response.data.code === 0) {
          this.executeStatusData = response.data.data;
        } else {
          this.$message.error('获取执行情况失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      } finally {
        this.executeStatusLoading = false;
      }
    },

    handleDeleteMember(member) {
      this.$confirm('确定要删除该成员吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await this.$http.delete(`/api/testPlanMember/${member.id}`);
          if (response.data.code === 0) {
            this.$message.success('删除成功');
            // 重新获取成员列表
            this.fetchPlanMembers(this.viewForm.id);
          } else {
            this.$message.error('删除失败：' + response.data.message);
          }
        } catch (error) {
          this.$message.error('请求失败：' + error.message);
        }
      }).catch(() => {
        // 取消删除
      });
    },

    handleAssign(row) {
      this.assignForm = {
        planId: row.id,
        planName: row.planName,
        userIds: [],
        assignedBy: '' // 这里可以设置当前登录用户的ID
      };
      this.assignDialogVisible = true;
    },

    async saveAssign() {
      try {
        const response = await this.$http.post('/api/testPlan/assign', {
          planId: this.assignForm.planId,
          userIds: this.assignForm.userIds,
          assignedBy: this.assignForm.assignedBy || 1 // 默认分配人ID为1
        });
        if (response.data.code === 0) {
          this.$message.success('分配成功');
          this.assignDialogVisible = false;
          // 重新获取成员列表，确保显示最新数据
          this.fetchPlanMembers(this.assignForm.planId);
          // 刷新测试计划列表，确保显示最新数据
          this.fetchTestPlans();
        } else {
          this.$message.error('分配失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
      }
    },

    async handleAssignCases(member) {
      this.assignCasesForm = {
        memberId: member.userId,
        memberName: this.getUserName(member.userId),
        assignType: 2,
        assignedBy: '' // 这里可以设置当前登录用户的ID
      };
      this.selectedCases = [];
      this.assignCasesDialogVisible = true;
      
      try {
        // 获取已分配的测试用例
        const response = await this.$http.post('/api/testPlanCaseSnapshot/listByPlanIdAndExecutor', {
          planId: this.viewForm.id,
          executorId: member.userId
        });
        
        if (response.data.code === 0) {
          const assignedCases = response.data.data || [];
          // 转换已分配的用例格式，确保与selectedCases格式一致
          this.selectedCases = assignedCases.map(caseItem => ({
            id: caseItem.originalCaseId, // 使用原测试用例ID
            caseNumber: caseItem.caseNumber,
            title: caseItem.title,
            priority: caseItem.priority
          }));
          console.log('已分配的测试用例:', this.selectedCases);
        }
      } catch (error) {
        console.error('获取已分配用例失败:', error);
      }
      
      // 获取测试用例列表
      this.fetchTestCases(this.viewForm.id);
    },

    // 打开测试用例选择模态窗口
    openCaseSelectionDialog() {
      this.caseSelectionDialogVisible = true;
      // 确保测试用例列表已加载
      if (this.testCasesTree.length === 0) {
        this.fetchTestCases(this.viewForm.id);
      }
    },

    // 处理测试用例搜索
    handleCaseSearch() {
      // 保存当前选中的用例
      const currentSelectedCases = [...this.selectedCases];
      console.log('搜索前选中的用例数量:', currentSelectedCases.length);
      
      // 根据当前文件夹ID和搜索条件加载测试用例
      console.log('搜索条件:', this.caseSearchForm);
      
      // 加载完成后保持选中状态
      this.loadCasesByFolderId(this.currentFolderId).then(() => {
        console.log('搜索后选中的用例数量:', this.selectedCases.length);
      });
    },

    // 重置测试用例搜索表单
    resetCaseSearch() {
      this.caseSearchForm = {
        caseNumber: '',
        title: '',
        priority: ''
      };
      // 重置后重新加载当前文件夹的测试用例
      this.loadCasesByFolderId(this.currentFolderId);
      console.log('重置搜索，重新加载测试用例');
    },

    // 处理测试用例选择
    handleCaseSelectionCheckChange(data, checked) {
      if (data.children && data.children.length > 0) {
        if (checked) {
          // 勾选模块时，选中所有子用例
          data.children.forEach(child => {
            this.addToSelectedCases(child);
          });
        } else {
          // 取消勾选模块时，取消所有子用例
          data.children.forEach(child => {
            this.removeFromSelectedCases(child);
          });
        }
      } else {
        // 处理单个用例的勾选
        if (checked) {
          this.addToSelectedCases(data);
        } else {
          this.removeFromSelectedCases(data);
        }
      }
    },

    // 确认选择测试用例
    confirmCaseSelection() {
      this.caseSelectionDialogVisible = false;
      // 选中的用例已经在selectedCases中
      console.log('确认选择的用例:', this.selectedCases);
    },

    // 选择单个测试用例
    selectSingleCase(caseItem) {
      this.addToSelectedCases(caseItem);
      this.$message.success('已选择用例：' + caseItem.caseNumber);
    },

    // 检查测试用例是否已被选择
    isCaseSelected(caseId) {
      return this.selectedCases.some(item => item.id === caseId);
    },

    // 处理测试用例表格选择变化
    handleCaseTableSelectionChange(selection) {
      // 保存当前所有选中的用例
      const allSelectedCases = [...this.selectedCases];
      
      // 清空selectedCases
      this.selectedCases = [];
      
      // 添加表格中选中的用例
      selection.forEach(caseItem => {
        this.addToSelectedCases(caseItem);
      });
      
      // 保留之前选中但不在当前表格中的用例
      allSelectedCases.forEach(caseItem => {
        if (!selection.some(item => item.id === caseItem.id)) {
          // 检查这个用例是否已经在selectedCases中
          if (!this.selectedCases.some(item => item.id === caseItem.id)) {
            this.addToSelectedCases(caseItem);
          }
        }
      });
      
      console.log('表格选择变化，当前选中用例数量:', this.selectedCases.length);
    },

    async fetchTestCases(planId) {
      try {
        this.assignCasesLoading = true;
        this.caseSelectionLoading = true;
        
        // 1. 加载文件夹树
        const folderResponse = await this.$http.get('http://localhost:8209/api/testCaseFolders/list');
        if (folderResponse.data.code === 0) {
          const folders = folderResponse.data.data || [];
          // 根据parentId构建树结构
          this.folderTree = this.buildFolderTree(folders);
          console.log('获取到的文件夹树:', this.folderTree);
        } else {
          this.$message.error('获取文件夹树失败：' + folderResponse.data.message);
        }
        
        // 2. 加载根目录下的测试用例
        this.currentFolderId = 0;
        await this.loadCasesByFolderId(0);
        
        // 3. 根据测试计划查询绑定的用例数据
        const planCasesResponse = await this.$http.get(`/api/testPlanCaseSnapshot/listByPlanId/${planId}`);
        if (planCasesResponse.data.code === 0) {
          const planCases = planCasesResponse.data.data.cases || [];
          console.log('测试计划绑定的用例:', planCases);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
        console.error('请求错误:', error);
      } finally {
        this.assignCasesLoading = false;
        this.caseSelectionLoading = false;
      }
    },

    // 根据文件夹ID加载测试用例
    async loadCasesByFolderId(folderId) {
      try {
        this.caseSelectionLoading = true;
        
        const response = await this.$http.post('http://localhost:8209/api/cases/listByFolderId', {
          folderId: folderId,
          title: this.caseSearchForm.title,
          description: '',
          priority: this.caseSearchForm.priority,
          createdByList: []
        });
        
        if (response.data.code === 0) {
          this.testCasesList = response.data.data || [];
          console.log(`获取到文件夹 ${folderId} 下的用例列表:`, this.testCasesList);
          console.log('当前已选中的用例数量:', this.selectedCases.length);
          
          // 延迟一下，确保表格已经更新
          setTimeout(() => {
            // 同步表格选择状态，保留之前选中的用例
            const table = this.$refs.caseTable;
            if (table) {
              // 清除所有选择
              table.clearSelection();
              // 重新选择已选中的用例
              this.testCasesList.forEach(caseItem => {
                if (this.selectedCases.some(item => item.id === caseItem.id)) {
                  table.toggleRowSelection(caseItem, true);
                }
              });
              console.log('同步表格选择状态完成');
            }
          }, 100);
        } else {
          this.$message.error('获取用例列表失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
        console.error('请求错误:', error);
      } finally {
        this.caseSelectionLoading = false;
      }
    },

    // 处理文件夹点击事件
    handleFolderClick(data) {
      this.currentFolderId = data.id;
      this.loadCasesByFolderId(data.id);
    },

    // 根据parentId构建树结构
    buildFolderTree(folders) {
      const folderMap = {};
      const tree = [];
      
      // 首先创建所有文件夹的映射
      folders.forEach(folder => {
        folderMap[folder.id] = {
          ...folder,
          children: []
        };
      });
      
      // 然后构建树结构
      folders.forEach(folder => {
        const parentId = folder.parentId || 0;
        if (parentId === 0) {
          // 根节点
          tree.push(folderMap[folder.id]);
        } else if (folderMap[parentId]) {
          // 子节点
          folderMap[parentId].children.push(folderMap[folder.id]);
        }
      });
      
      return tree;
    },

    // 构建测试用例树形结构
    buildTestCaseTree(cases) {
      // 按模块分组
      const moduleMap = {};
      cases.forEach(caseItem => {
        const module = caseItem.module || '未分类';
        if (!moduleMap[module]) {
          moduleMap[module] = {
            id: `module-${module}`,
            name: module,
            children: []
          };
        }
        moduleMap[module].children.push(caseItem);
      });
      return Object.values(moduleMap);
    },

    // 处理树形结构的勾选事件
    handleTreeCheckChange(data, checked) {
      // 如果是模块节点，处理子节点的勾选状态
      if (data.children && data.children.length > 0) {
        if (checked) {
          // 勾选模块时，选中所有子用例
          data.children.forEach(child => {
            this.addToSelectedCases(child);
          });
        } else {
          // 取消勾选模块时，取消所有子用例
          data.children.forEach(child => {
            this.removeFromSelectedCases(child);
          });
        }
      } else {
        // 如果是用例节点，直接处理
        if (checked) {
          this.addToSelectedCases(data);
        } else {
          this.removeFromSelectedCases(data);
        }
      }
    },

    // 添加到选中用例
    addToSelectedCases(caseItem) {
      if (!this.selectedCases.some(item => item.id === caseItem.id)) {
        this.selectedCases.push(caseItem);
      }
    },

    // 从选中用例中移除
    removeFromSelectedCases(caseItem) {
      // 从selectedCases中移除用例
      this.selectedCases = this.selectedCases.filter(item => item.id !== caseItem.id);
      
      // 直接更新表格的选择状态，避免触发selection-change事件
      const table = this.$refs.caseTable;
      if (table) {
        // 找到对应的行数据
        const row = this.testCasesList.find(item => item.id === caseItem.id);
        if (row) {
          // 取消选择这一行
          table.toggleRowSelection(row, false);
        }
      }
    },

    // 同步表格选择状态
    syncTableSelection() {
      // 首先获取表格的引用
      const table = this.$refs.caseTable;
      if (table) {
        // 清除所有选择
        table.clearSelection();
        // 重新选择已选中的用例
        this.selectedCases.forEach(caseItem => {
          const row = this.testCasesList.find(item => item.id === caseItem.id);
          if (row) {
            table.toggleRowSelection(row, true);
          }
        });
        console.log('同步表格选择状态，当前选中用例数量:', this.selectedCases.length);
      }
    },

    async saveAssignCases() {
      if (this.selectedCases.length === 0) {
        this.$message.warning('请至少选择一个用例');
        return;
      }
      
      try {
        this.assignCasesLoading = true;
        // 提取选中用例的ID列表
        const caseIds = this.selectedCases.map(caseItem => caseItem.id);
        
        const response = await this.$http.post('/api/testPlanCaseSnapshot/batchBind', {
          planId: this.viewForm.id, // 测试计划ID
          caseIds: caseIds, // 测试用例ID列表
          executorId: this.assignCasesForm.memberId // 执行人ID
        });
        if (response.data.code === 0) {
          this.$message.success('分配用例成功');
          this.assignCasesDialogVisible = false;
          // 重新获取成员列表，确保显示最新数据
          this.fetchPlanMembers(this.viewForm.id);
        } else {
          this.$message.error('分配失败：' + response.data.message);
        }
      } catch (error) {
        this.$message.error('请求失败：' + error.message);
        console.error('分配用例错误:', error);
      } finally {
        this.assignCasesLoading = false;
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
        4: '已暂停',
        5: '已取消'
      };
      return statusMap[status] || status;
    },

    getRoleTypeLabel(roleType) {
      const roleMap = {
        1: '负责人(Owner)',
        2: '参与人(Member)',
        3: '签署人(Approver)',
        4: '抄送人(CC)'
      };
      return roleMap[roleType] || roleType;
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
    // 检查是否有测试计划ID参数
    const planId = this.$route.query.id;
    if (planId) {
      // 直接查看该测试计划的详情
      this.handleView({ id: planId });
    } else {
      // 否则加载测试计划列表
      this.fetchTestPlans();
    }
    this.fetchUsers();
  },
};
</script>

<style scoped>
.execution-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.content {
  flex: 1;
  padding: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e6e8eb;
  background-color: #ffffff;
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header h1 {
  margin: 0;
  text-align: left;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.search-form {
  margin-bottom: 24px;
  padding: 24px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.search-form:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.search-form :deep(.el-select) {
  width: 160px;
  margin-right: 16px;
}

.search-form :deep(.el-input) {
  width: 200px;
  margin-right: 16px;
}

.search-form :deep(.el-form-item) {
  margin-right: 16px;
}

/* 表格样式 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

:deep(.el-table):hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

:deep(.el-table__header th) {
  background-color: #f7f9fc;
  font-weight: 600;
  color: #1a1a1a;
  height: 56px;
  font-size: 14px;
}

:deep(.el-table__row) {
  height: 52px;
  transition: all 0.2s ease;
}

:deep(.el-table__row:hover) {
  background-color: #f0f7ff;
}

:deep(.el-table__row.current-row) {
  background-color: #e6f7ff;
}

/* 标签样式 */
:deep(.el-tag) {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
}

/* 计划名称样式 */
.plan-name {
  font-weight: 600;
  color: #1a1a1a;
  transition: color 0.2s ease;
}

.plan-name:hover {
  color: #409eff;
}

/* 负责人名称样式 */
.owner-name {
  color: #409eff;
  font-weight: 500;
  transition: color 0.2s ease;
}

.owner-name:hover {
  color: #66b1ff;
  text-decoration: underline;
}

/* 分页样式 */
.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.pagination-container:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

:deep(.el-pagination) {
  margin: 0;
}

:deep(.el-pagination__item:hover) {
  color: #409eff;
}

:deep(.el-pagination__item.active) {
  background-color: #409eff;
  border-color: #409eff;
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog__header) {
  background-color: #f7f9fc;
  padding: 20px 24px;
  border-bottom: 1px solid #e6e8eb;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

:deep(.el-dialog__body) {
  padding: 24px;
  background-color: #ffffff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e6e8eb;
  background-color: #f7f9fc;
}

/* 按钮样式 */
:deep(.el-button) {
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

:deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

:deep(.el-button--info) {
  background-color: #ecf5ff;
  border-color: #d9ecff;
  color: #409eff;
}

:deep(.el-button--info:hover) {
  background-color: #d9ecff;
  border-color: #b3d8ff;
}

:deep(.el-button--success) {
  background-color: #67c23a;
  border-color: #67c23a;
}

:deep(.el-button--success:hover) {
  background-color: #85ce61;
  border-color: #85ce61;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.4);
}

:deep(.el-button--danger) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

:deep(.el-button--danger:hover) {
  background-color: #f78989;
  border-color: #f78989;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.4);
}

/* 新建测试计划表单样式 */
.create-plan-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 10px;
}

/* 表单分区 */
.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9fafc;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* 分区标题 */
.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

/* 表单行 */
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

/* 半宽表单项 */
.form-item-half {
  flex: 1;
  margin-bottom: 0 !important;
}

/* 表单样式 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

:deep(.el-input__inner),
:deep(.el-select__input),
:deep(.el-date-picker__input) {
  border-radius: 6px;
  height: 40px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  font-size: 14px;
}

:deep(.el-input__inner:hover),
:deep(.el-select__input:hover),
:deep(.el-date-picker__input:hover) {
  border-color: #c0c4cc;
}

:deep(.el-input__inner:focus),
:deep(.el-select__input:focus),
:deep(.el-date-picker__input:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 文本域样式 */
:deep(.el-textarea__inner) {
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  transition: all 0.3s ease;
  font-size: 14px;
  resize: vertical;
}

:deep(.el-textarea__inner:hover) {
  border-color: #c0c4cc;
}

:deep(.el-textarea__inner:focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 滚动条样式 */
.create-plan-form::-webkit-scrollbar {
  width: 8px;
}

.create-plan-form::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.create-plan-form::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.create-plan-form::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 大尺寸组件样式 */
:deep(.el-input--large .el-input__inner),
:deep(.el-select--large .el-select__input),
:deep(.el-date-picker--large .el-date-picker__input) {
  height: 44px;
  font-size: 15px;
}

:deep(.el-textarea--large .el-textarea__inner) {
  font-size: 15px;
}

:deep(.el-input__inner:focus),
:deep(.el-select__input.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

/* 树形结构样式 */
:deep(.el-tree) {
  border-radius: 6px;
  overflow: hidden;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
}

:deep(.el-tree-node.is-hover > .el-tree-node__content) {
  background-color: #f0f7ff;
}

/* 进度条样式 */
:deep(.el-progress__bar) {
  border-radius: 10px;
}

/* 用例选择模态窗口样式 */
:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content {
    padding: 20px;
  }
  
  .header {
    padding: 16px 20px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .search-form :deep(.el-select),
  .search-form :deep(.el-input) {
    width: 140px;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 16px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .search-form {
    padding: 16px;
  }
  
  .search-form :deep(.el-form) {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-form :deep(.el-form-item) {
    margin-right: 0;
    margin-bottom: 12px;
  }
  
  .search-form :deep(.el-select),
  .search-form :deep(.el-input) {
    width: 100%;
  }
}

/* 执行情况对话框样式 */
.execute-summary h3,
.execute-details h3 {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 8px;
}

.summary-item {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.summary-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.summary-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
</style>
