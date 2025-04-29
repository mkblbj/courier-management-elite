/**
 * i18n转换运行脚本
 * 使用jscodeshift批量处理项目中的代码文件
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk'); // 确保先安装: npm install chalk

// 配置项
const CONFIG = {
  // 要处理的目录
  sourceDirs: [
    './src/components',
    './src/pages',
    './src/layouts',
    './src/modules',
  ],
  // 转换器路径
  transformPath: path.resolve(__dirname, 'replace-hardcoded-text.js'),
  // 要处理的文件扩展名
  extensions: ['js', 'jsx', 'ts', 'tsx'],
  // 是否打印详细信息
  verbose: true,
  // 是否使用多线程(提高性能)
  parallelProcessing: true,
  // 线程数(0表示自动)
  workers: 0,
  // 是否先备份文件
  backup: true,
  // 备份文件夹的名称
  backupDir: './i18n-backup',
  // 排除的文件或目录模式
  exclude: [
    'node_modules',
    'dist',
    'build',
    '.storybook',
    'coverage',
    'test',
    'tests',
    '__tests__',
    '__mocks__',
    'mock',
    'mocks',
    'stubs',
    'e2e',
  ]
};

// 控制台输出格式化
const logger = {
  info: (msg) => console.log(chalk.blue.bold('ℹ️ INFO: ') + msg),
  success: (msg) => console.log(chalk.green.bold('✅ SUCCESS: ') + msg),
  warn: (msg) => console.log(chalk.yellow.bold('⚠️ WARNING: ') + msg),
  error: (msg) => console.log(chalk.red.bold('❌ ERROR: ') + msg),
  debug: (msg) => CONFIG.verbose && console.log(chalk.gray('🔍 DEBUG: ') + msg),
  divider: () => console.log(chalk.gray('-------------------------------------------')),
};

/**
 * 创建备份目录
 */
function createBackupDir() {
  if (!CONFIG.backup) return;
  
  const backupDir = path.resolve(process.cwd(), CONFIG.backupDir);
  
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
      logger.info(`创建备份目录: ${backupDir}`);
    } catch (err) {
      logger.error(`无法创建备份目录: ${err.message}`);
      process.exit(1);
    }
  }
  
  // 创建时间戳子目录
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const timestampDir = path.join(backupDir, timestamp);
  
  try {
    fs.mkdirSync(timestampDir, { recursive: true });
    logger.info(`创建时间戳备份目录: ${timestampDir}`);
    return timestampDir;
  } catch (err) {
    logger.error(`无法创建时间戳备份目录: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 备份源代码
 */
function backupSourceCode(backupDir) {
  if (!CONFIG.backup || !backupDir) return;
  
  logger.info('开始备份源代码...');
  
  for (const sourceDir of CONFIG.sourceDirs) {
    try {
      // 使用rsync或系统命令进行高效备份
      const sourcePath = path.resolve(process.cwd(), sourceDir);
      const targetPath = path.join(backupDir, path.basename(sourceDir));
      
      // 创建目标目录
      fs.mkdirSync(targetPath, { recursive: true });
      
      // 使用系统命令来高效复制
      let command;
      if (process.platform === 'win32') {
        // Windows
        command = `xcopy "${sourcePath}" "${targetPath}" /E /I /H /Y`;
      } else {
        // Unix/Linux/MacOS
        command = `cp -R "${sourcePath}/"* "${targetPath}"`;
      }
      
      execSync(command, { stdio: CONFIG.verbose ? 'inherit' : 'ignore' });
      logger.success(`备份 ${sourceDir} 完成`);
    } catch (err) {
      logger.error(`备份 ${sourceDir} 失败: ${err.message}`);
    }
  }
  
  logger.success('源代码备份完成');
}

/**
 * 生成jscodeshift命令并运行
 */
function runJscodeshift() {
  logger.info('开始运行jscodeshift转换...');
  
  // 构建jscodeshift命令
  const args = [
    '--extensions=' + CONFIG.extensions.join(','),
    CONFIG.verbose ? '--verbose=2' : '--verbose=0',
    CONFIG.parallelProcessing ? '--cpus=' + (CONFIG.workers || 'max') : '--cpus=1',
    '--ignore-pattern=**/node_modules/**',
  ];
  
  // 添加排除模式
  CONFIG.exclude.forEach(pattern => {
    args.push(`--ignore-pattern=**/${pattern}/**`);
  });
  
  // 添加转换器路径
  args.push('--transform', CONFIG.transformPath);
  
  // 添加要处理的目录
  args.push(...CONFIG.sourceDirs);
  
  const jscodeshiftBin = path.resolve(process.cwd(), 'node_modules', '.bin', 'jscodeshift');
  
  if (!fs.existsSync(jscodeshiftBin)) {
    logger.error('找不到jscodeshift。请先安装: npm install -D jscodeshift');
    process.exit(1);
  }
  
  const command = `${jscodeshiftBin} ${args.join(' ')}`;
  logger.debug(`运行命令: ${command}`);
  
  try {
    logger.divider();
    execSync(command, { stdio: 'inherit' });
    logger.divider();
    logger.success('jscodeshift转换完成');
  } catch (err) {
    logger.error(`jscodeshift转换失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 显示转换结果概要
 */
function showSummary() {
  logger.divider();
  logger.success('i18n转换任务完成!');
  logger.info('后续步骤:');
  logger.info('1. 检查生成的代码，确保一切正常');
  logger.info('2. 运行应用程序，测试i18n功能');
  logger.info('3. 生成并完善翻译文件');
  logger.info('4. 处理可能被遗漏的文本');
  logger.divider();
}

// 主函数
function main() {
  console.log(chalk.bgBlue.white.bold('\n i18n 自动转换工具 \n'));
  logger.divider();
  
  logger.info('配置信息:');
  logger.info(`- 源目录: ${CONFIG.sourceDirs.join(', ')}`);
  logger.info(`- 文件类型: ${CONFIG.extensions.join(', ')}`);
  logger.info(`- 备份: ${CONFIG.backup ? '是' : '否'}`);
  logger.info(`- 详细模式: ${CONFIG.verbose ? '是' : '否'}`);
  logger.info(`- 并行处理: ${CONFIG.parallelProcessing ? '是' : '否'}`);
  logger.divider();
  
  const backupDir = createBackupDir();
  backupSourceCode(backupDir);
  runJscodeshift();
  showSummary();
}

// 运行主函数
main(); 