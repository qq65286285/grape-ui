const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8210;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// 模拟数据库
let testCases = [
  { id: 1, title: '测试用例1', description: '测试用例1描述' },
  { id: 2, title: '测试用例2', description: '测试用例2描述' },
  { id: 3, title: '测试用例3', description: '测试用例3描述' },
  { id: 4, title: '测试用例4', description: '测试用例4描述' },
  { id: 5, title: '测试用例5', description: '测试用例5描述' }
];

// 批量删除测试用例
app.post('/api/cases/batchRemove', (req, res) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] 收到批量删除请求:`, req.body);

  try {
    // 验证请求体
    const caseIds = req.body;
    if (!Array.isArray(caseIds)) {
      console.log(`[${requestId}] 错误: 请求体不是数组`);
      return res.status(400).json({
        code: 400,
        message: '请求体必须是一个数组',
        requestId: requestId,
        data: false
      });
    }

    if (caseIds.length === 0) {
      console.log(`[${requestId}] 错误: 数组为空`);
      return res.status(400).json({
        code: 400,
        message: '数组不能为空',
        requestId: requestId,
        data: false
      });
    }

    // 验证数组中的元素是否为数字
    const invalidIds = caseIds.filter(id => typeof id !== 'number' || id <= 0 || !Number.isInteger(id));
    if (invalidIds.length > 0) {
      console.log(`[${requestId}] 错误: 存在无效的ID:`, invalidIds);
      return res.status(400).json({
        code: 400,
        message: '数组中包含无效的ID',
        requestId: requestId,
        data: false
      });
    }

    // 执行批量删除（模拟数据库事务）
    const initialLength = testCases.length;
    testCases = testCases.filter(testCase => !caseIds.includes(testCase.id));
    const deletedCount = initialLength - testCases.length;

    console.log(`[${requestId}] 成功删除 ${deletedCount} 个测试用例`);

    // 返回成功响应
    res.json({
      code: 0,
      message: '操作成功',
      requestId: requestId,
      data: true
    });
  } catch (error) {
    console.error(`[${requestId}] 服务器错误:`, error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      requestId: requestId,
      data: false
    });
  }
});

// 获取所有测试用例（用于测试）
app.get('/api/cases', (req, res) => {
  res.json({
    code: 0,
    message: '操作成功',
    data: testCases
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
