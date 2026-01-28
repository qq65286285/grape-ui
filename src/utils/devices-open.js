const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https'); // 用于下载文件（若为 http 则用 http 模块）

// 配置参数（可根据需求修改）
const config = {
  // 1. 下载文件信息（以 7-Zip 为例，64位 Windows 安装包）
  downloadUrl: 'https://nodejs.org/dist/v22.21.0/node-v22.21.0-x64.msi', // 下载链接
  downloadPath: path.resolve(__dirname, 'node-v22.21.0-x64.msi'), // 本地保存路径

  // 2. 安装命令（不同安装包格式的命令不同，此处为 MSI 安装包）
  installCommand: 'msiexec /i "node-v22.21.0-x64.msi" /quiet /norestart', // 静默安装（无界面）

  // 3. 待执行的 CMD 命令（示例：查看 7-Zip 安装目录）
  cmdCommand: 'dir "C:\\Program Files\\node-v22.21.0-x64.msi"',

  // 4. 待执行的 BAT 文件路径（会自动创建一个测试 BAT）
  batFilePath: path.resolve(__dirname, 'test.bat')
};

// 步骤1：下载文件
function downloadFile(url, savePath) {
  return new Promise((resolve, reject) => {
    console.log(`开始下载文件：${url}`);
    const file = fs.createWriteStream(savePath);

    https.get(url, (response) => {
      // 处理重定向（部分链接会跳转）
      if (response.statusCode === 302) {
        return downloadFile(response.headers.location, savePath).then(resolve).catch(reject);
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`文件下载完成，保存至：${savePath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(savePath, () => {}); // 下载失败删除文件
      reject(`下载失败：${err.message}`);
    });
  });
}

// 步骤2：执行安装命令
function installProgram(command) {
  return new Promise((resolve, reject) => {
    console.log(`开始执行安装命令：${command}`);
    const installProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`安装失败：${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`安装警告：${stderr}`); // 部分安装程序会输出警告到 stderr
      }
      console.log('安装完成');
      resolve();
    });

    // 实时输出安装日志（部分安装程序会输出进度）
    installProcess.stdout.on('data', (data) => console.log(`安装日志：${data}`));
  });
}

// 步骤3：执行 CMD 命令
function runCmdCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`开始执行 CMD 命令：${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`CMD 命令执行失败：${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`CMD 错误输出：${stderr}`);
      }
      console.log(`CMD 命令输出：\n${stdout}`);
      resolve();
    });
  });
}

// 步骤4：创建并执行 BAT 文件
// function createAndRunBat(filePath) {
//   return new Promise((resolve, reject) => {
//     // 创建测试 BAT 文件内容
//     const batContent = `@echo off
// echo 这是测试 BAT 文件
// echo 当前时间：%time%
// echo 7-Zip 安装目录检查：
// dir "C:\\Program Files\\7-Zip" /b
// echo BAT 文件执行完毕
// `;

//     // 写入 BAT 文件
//     fs.writeFile(filePath, batContent, (err) => {
//       if (err) {
//         reject(`创建 BAT 文件失败：${err.message}`);
//         return;
//       }
//       console.log(`BAT 文件创建成功：${filePath}`);

//       // 执行 BAT 文件
//       console.log('开始执行 BAT 文件');
//       const batProcess = spawn('cmd.exe', ['/c', filePath]);

//       batProcess.stdout.on('data', (data) => console.log(`BAT 输出：${data}`));
//       batProcess.stderr.on('data', (data) => console.error(`BAT 错误：${data}`));

//       batProcess.on('close', (code) => {
//         if (code !== 0) {
//           reject(`BAT 文件执行失败，退出码：${code}`);
//           return;
//         }
//         console.log('BAT 文件执行完毕');
//         resolve();
//       });
//     });
//   });
// }

//执行设备连接和打开云真机
//执行设备连接和打开云真机
function exec_connect_open() {
  return new Promise((resolve, reject) => {
    //连接设备
    const command = "adb connect 172.29.132.172:5555";
    exec(command, (error, stdout, stderr) => {  // 移除未使用的 installProcess 变量
      if (error) {
        reject(`连接失败：${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`连接警告：${stderr}`);
      }
      console.log('连接完成');

      //打开云真机
      console.log('开始执行 BAT 文件');
      const filePath = "E:\\run.bat";    //本地云真机调用bat
      const batProcess = spawn('cmd.exe', ['/c', filePath]);

      batProcess.stdout.on('data', (data) => console.log(`BAT 输出：${data}`));
      batProcess.stderr.on('data', (data) => console.error(`BAT 错误：${data}`));

      batProcess.on('close', (code) => {
        if (code !== 0) {
          reject(`BAT 文件执行失败，退出码：${code}`);
          return;
        }
        console.log('BAT 文件执行完毕');
        resolve();
      });
    });
  });
}

// 主流程：按顺序执行所有步骤
async function main() {
  try {
    // 步骤1：下载安装包
    await downloadFile(config.downloadUrl, config.downloadPath);

    // 步骤2：安装程序
    await installProgram(config.installCommand);

    // 步骤3：执行 CMD 命令
    await runCmdCommand(config.cmdCommand);

    // 步骤4：执行 BAT 文件
    // await createAndRunBat(config.batFilePath);
	
    //执行云真机相关
    await exec_connect_open();

    console.log('所有流程执行完成！');
  } catch (err) {
    console.error('流程执行失败：', err);
    process.exit(1); // 出错时退出程序
  }
}

// 启动主流程
main();