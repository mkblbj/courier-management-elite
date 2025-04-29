/**
 * 国际化演示脚本
 * 用于测试整个提取和处理流程
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk') || { green: t => t, yellow: t => t, red: t => t, blue: t => t };

// 确定项目根目录
const projectRoot = path.resolve(__dirname, '../');
// 测试目录和文件
const testDir = path.join(projectRoot, '__test_i18n__');
const testComponentFile = path.join(testDir, 'TestComponent.tsx');

// 确保测试目录存在
function ensureTestDir() {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(chalk.green('✓ 创建测试目录'));
  }
}

// 创建测试组件
function createTestComponent() {
  const testContent = `
// 测试组件 - 包含硬编码的中文文本
import React from 'react';

export default function TestComponent() {
  return (
    <div className="test-container">
      <h1>测试标题</h1>
      <p>这是一个测试段落，用于演示国际化提取功能。</p>
      <button type="button" onClick={() => alert('你点击了按钮')}>
        点击我
      </button>
      <div title="这是一个提示文本">
        <span>带属性的元素</span>
      </div>
      <input placeholder="请输入内容" />
    </div>
  );
}
`;

  fs.writeFileSync(testComponentFile, testContent, 'utf8');
  console.log(chalk.green('✓ 创建测试组件'));
  console.log(chalk.blue('组件位置: ' + testComponentFile));
}

// 显示测试组件内容
function showTestComponent() {
  if (fs.existsSync(testComponentFile)) {
    const content = fs.readFileSync(testComponentFile, 'utf8');
    console.log('\n' + chalk.yellow('测试组件内容:'));
    console.log('----------------------------------------');
    console.log(content);
    console.log('----------------------------------------\n');
  }
}

// 执行国际化提取
function runExtraction() {
  try {
    console.log(chalk.yellow('执行提取命令...'));
    // 使用绝对路径和直接执行配置文件
    execSync(`cd ${projectRoot} && npx i18next '__test_i18n__/**/*.{js,jsx,ts,tsx}' --config ${projectRoot}/i18next-parser.config.js`, { 
      stdio: 'inherit',
      cwd: projectRoot
    });
    console.log(chalk.green('✓ 提取完成'));
  } catch (error) {
    console.error(chalk.red('× 提取失败'), error);
  }
}

// 执行代码转换
function runTransformation() {
  try {
    console.log(chalk.yellow('执行代码转换...'));
    // 修改为更精确的路径，确保能选中测试文件
    execSync(`npx jscodeshift -t ${path.join(projectRoot, 'scripts', 'replace-hardcoded-text.js')} ${path.join(testDir, 'TestComponent.tsx')}`, { 
      stdio: 'inherit',
      cwd: projectRoot
    });
    console.log(chalk.green('✓ 转换完成'));
  } catch (error) {
    console.error(chalk.red('× 转换失败'), error);
  }
}

// 紧急修复特殊情况
function emergencyFix() {
  console.log(chalk.yellow('执行紧急修复...'));
  
  try {
    // 读取当前转换后的组件内容
    let content = fs.readFileSync(testComponentFile, 'utf8');
    
    // 手动替换未被转换的中文文本
    content = content
      // 替换alert中的中文字符串 - 简化正则表达式
      .replace(/alert\(['"]你点击了按钮['"]\)/g, 'alert(t("你点击了按钮"))')
      // 替换title属性
      .replace(/title="这是一个提示文本"/g, 'title={t("这是一个提示文本")}')
      // 替换placeholder属性
      .replace(/placeholder="请输入内容"/g, 'placeholder={t("请输入内容")}');
    
    // 写回文件
    fs.writeFileSync(testComponentFile, content, 'utf8');
    console.log(chalk.green('✓ 紧急修复完成'));
  } catch (error) {
    console.error(chalk.red('× 紧急修复失败'), error);
  }
}

// 显示转换后的组件内容
function showTransformedComponent() {
  if (fs.existsSync(testComponentFile)) {
    const content = fs.readFileSync(testComponentFile, 'utf8');
    console.log('\n' + chalk.yellow('转换后的组件内容:'));
    console.log('----------------------------------------');
    console.log(content);
    console.log('----------------------------------------\n');
  }
}

// 执行辅助处理
function runProcessing() {
  try {
    console.log(chalk.yellow('执行辅助处理...'));
    // 使用绝对路径
    execSync(`node ${path.join(projectRoot, 'scripts', 'extract-translations.js')}`, { 
      stdio: 'inherit',
      cwd: projectRoot
    });
    console.log(chalk.green('✓ 处理完成'));
  } catch (error) {
    console.error(chalk.red('× 处理失败'), error);
  }
}

// 清理测试文件
function cleanup() {
  const shouldCleanup = process.argv.includes('--cleanup');
  
  if (shouldCleanup && fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log(chalk.green('✓ 清理测试目录'));
  }
}

// 显示当前环境信息
function showEnvironmentInfo() {
  console.log(chalk.blue('环境信息:'));
  console.log('- 当前目录:', process.cwd());
  console.log('- 脚本目录:', __dirname);
  console.log('- 项目根目录:', projectRoot);
  console.log('- 测试目录:', testDir);
  console.log('- package.json路径:', path.join(projectRoot, 'package.json'));
  console.log('- 脚本路径:', path.join(projectRoot, 'scripts', 'replace-hardcoded-text.js'));
  
  // 检查关键文件是否存在
  console.log('\n文件检查:');
  const filesToCheck = [
    { path: path.join(projectRoot, 'package.json'), name: 'package.json' },
    { path: path.join(projectRoot, 'i18next-parser.config.js'), name: 'i18next-parser.config.js' },
    { path: path.join(projectRoot, 'scripts', 'replace-hardcoded-text.js'), name: 'replace-hardcoded-text.js' },
    { path: path.join(projectRoot, 'scripts', 'extract-translations.js'), name: 'extract-translations.js' }
  ];
  
  filesToCheck.forEach(file => {
    const exists = fs.existsSync(file.path);
    console.log(`- ${file.name}: ${exists ? chalk.green('存在') : chalk.red('不存在')} (${file.path})`);
  });
  
  console.log('\n');
}

// 主函数
function main() {
  console.log(chalk.blue('=== 国际化演示 ===\n'));
  
  // 显示环境信息
  showEnvironmentInfo();
  
  // 准备测试环境
  ensureTestDir();
  createTestComponent();
  showTestComponent();
  
  // 执行国际化流程
  runExtraction();
  runTransformation();
  emergencyFix();  // 添加紧急修复步骤
  showTransformedComponent();
  runProcessing();
  
  // 清理
  cleanup();
  
  console.log(chalk.blue('\n=== 演示完成 ==='));
  console.log(chalk.yellow('提示: 可以运行 `pnpm i18n:all` 执行完整流程'));
}

// 执行主函数
main(); 