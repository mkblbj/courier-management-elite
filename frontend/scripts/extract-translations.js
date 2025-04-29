/**
 * 翻译提取辅助脚本
 * 用于处理i18next-parser提取的结果，组织翻译文件，确保提取过程完整
 */

const fs = require('fs');
const path = require('path');

// 获取项目根目录
const projectRoot = path.resolve(__dirname, '../');
// 使用相对路径
const localesDir = path.join(projectRoot, 'public/locales');
const supportedLocales = ['zh-CN', 'en', 'ja'];
const namespaces = ['common', 'courier', 'shipping'];

// 调试：打印环境信息
console.log('环境信息:');
console.log('- 当前工作目录:', process.cwd());
console.log('- 脚本目录:', __dirname);
console.log('- 项目根目录:', projectRoot);
console.log('- 语言文件目录:', localesDir);
console.log('');

// 确保所有必要的目录和文件都存在
function ensureDirsAndFiles() {
  console.log('确保所有必要的目录和翻译文件都存在...');
  
  // 确保locales目录存在
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(localesDir, { recursive: true });
    console.log(`创建了语言文件目录: ${localesDir}`);
  }
  
  // 确保每个语言的目录存在
  supportedLocales.forEach(locale => {
    const localeDir = path.join(localesDir, locale);
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
      console.log(`创建了语言目录: ${locale}`);
    }
    
    // 确保每个命名空间的文件存在
    namespaces.forEach(namespace => {
      const filePath = path.join(localeDir, `${namespace}.json`);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}', 'utf8');
        console.log(`创建了空的翻译文件: ${locale}/${namespace}.json`);
      }
    });
  });
}

// 合并翻译文件
function mergeTranslationFiles() {
  console.log('合并翻译文件...');
  
  // 从默认语言文件提取所有的键
  const mainLocale = 'zh-CN';
  const allKeys = {};
  
  // 读取所有命名空间
  namespaces.forEach(namespace => {
    try {
      const filePath = path.join(localesDir, mainLocale, `${namespace}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        
        // 记录所有键
        allKeys[namespace] = Object.keys(json);
      }
    } catch (error) {
      console.error(`读取${mainLocale}/${namespace}.json出错:`, error);
    }
  });
  
  // 确保所有语言包都有相同的键
  supportedLocales.forEach(locale => {
    if (locale === mainLocale) return; // 跳过主语言
    
    namespaces.forEach(namespace => {
      try {
        const filePath = path.join(localesDir, locale, `${namespace}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          let json = {};
          
          try {
            json = JSON.parse(content);
          } catch {
            json = {};
          }
          
          // 获取该命名空间下所有应有的键
          const expectedKeys = allKeys[namespace] || [];
          let updated = false;
          
          // 确保所有键都存在
          expectedKeys.forEach(key => {
            if (!(key in json)) {
              json[key] = key; // 默认使用键名作为翻译值
              updated = true;
            }
          });
          
          // 写回文件
          if (updated) {
            fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
            console.log(`更新了${locale}/${namespace}.json`);
          }
        }
      } catch (error) {
        console.error(`处理${locale}/${namespace}.json出错:`, error);
      }
    });
  });
}

// 显示提取结果的统计信息
function showStatistics() {
  console.log('\n翻译键统计信息:');
  
  supportedLocales.forEach(locale => {
    console.log(`\n${locale}语言包:`);
    
    namespaces.forEach(namespace => {
      try {
        const filePath = path.join(localesDir, locale, `${namespace}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          let json = {};
          
          try {
            json = JSON.parse(content);
          } catch {
            json = {};
          }
          
          const keyCount = Object.keys(json).length;
          console.log(`  - ${namespace}.json: ${keyCount}个翻译键`);
        } else {
          console.log(`  - ${namespace}.json: 文件不存在`);
        }
      } catch (error) {
        console.error(`读取${locale}/${namespace}.json出错:`, error);
      }
    });
  });
}

// 主函数
function main() {
  console.log('开始处理翻译文件...\n');
  
  // 确保目录和文件结构
  ensureDirsAndFiles();
  
  // 合并翻译文件
  mergeTranslationFiles();
  
  // 显示统计信息
  showStatistics();
  
  console.log('\n处理完成!');
}

main(); 