/**
 * i18next-parser配置文件
 * 用于配置翻译文本提取的各项参数
 */

// 获取项目根目录
const path = require('path');
const projectRoot = process.cwd();
// 支持相对路径
const localesPath = './public/locales';

module.exports = {
  // 支持的语言列表
  locales: ['zh-CN', 'en', 'ja'],
  
  // 输出的翻译文件路径
  output: path.join(localesPath, '$LOCALE/$NAMESPACE.json'),
  
  // 输入的文件匹配模式
  input: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './__test_i18n__/**/*.{js,jsx,ts,tsx}',
  ],
  
  // 命名空间
  // 指定默认命名空间
  defaultNamespace: 'common',
  
  // 支持的命名空间列表
  namespacePaths: [
    {
      name: 'common',
      path: path.join(localesPath, '$LOCALE/common.json')
    },
    {
      name: 'courier',
      path: path.join(localesPath, '$LOCALE/courier.json')
    },
    {
      name: 'shipping',
      path: path.join(localesPath, '$LOCALE/shipping.json')
    },
    {
      name: 'shop',
      path: path.join(localesPath, '$LOCALE/shop.json')
    }
  ],
  
  // 未找到翻译时使用键名作为默认值
  defaultValue: (lng, ns, key) => key,
  
  // 禁用键分隔符，使用完整的键名
  keySeparator: false,
  
  // 禁用命名空间分隔符
  namespaceSeparator: false,
  
  // 在更新时保留已有的翻译
  keepRemoved: true,
  
  // 对翻译键进行排序
  sort: true,
  
  // 显示详细输出信息
  verbose: true,
  
  // 开启复数形式处理
  pluralSeparator: '_plural',
  
  // 解析JSX中的属性
  attr: false,
  
  // 深度解析嵌套对象
  nestingPrefix: '$t(',
  nestingSuffix: ')',
  
  // 上下文分隔符
  contextSeparator: '_',
  
  // 跳过已经存在的翻译
  skipDefaultValues: false,
  
  // 解析动态引用的键
  transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
  
  // 调试：打印当前工作目录
  createOldCatalogs: false,
  
  // 忽略特定文件夹
  ignore: ['node_modules', '.next', '.git']
}; 