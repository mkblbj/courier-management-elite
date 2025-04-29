/**
 * 硬编码文本替换脚本
 * 用于将代码中的硬编码中文文本替换为使用i18next的t函数调用
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let needsImport = false;
  
  // 配置项
  const CONFIG = {
    debug: false,              // 是否输出调试信息
    useRegexFallback: true,    // 是否在AST操作后使用正则表达式进行后备处理
    // 不需要转换的属性
    skipAttributes: [
      // 样式和标识属性
      'className', 'style', 'key', 'id', 'type', 'src', 'alt', 'href', 'target', 'rel',
      // 开发调试属性
      'data-testid', 'data-cy', 'data-test', 'data-e2e', 'data-automation',
      // 国际化相关属性(避免重复处理)
      'i18nKey', 'ns', 'i18n',
      // 技术属性
      'lang', 'dir', 'xmlns', 'version', 'encoding', 'doctype',
    ],
    // 不需要转换的文件模式
    skipFilePatterns: [
      /\.test\.[jt]sx?$/,       // 测试文件
      /\.spec\.[jt]sx?$/,       // 规格文件
      /\.d\.ts$/,               // 类型定义文件
      /\/mock\//,               // 模拟数据
      /\/tests?\//,             // 测试目录
      /\/debug\//,              // 调试目录
    ],
    // 不需要转换的字符串模式
    skipStringPatterns: [
      /^DEBUG:/i,               // 调试前缀
      /^LOG:/i,                 // 日志前缀
      /^WARN:/i,                // 警告前缀
      /^ERROR:/i,               // 错误前缀
      /^TODO:/i,                // 待办事项
      /^FIXME:/i,               // 待修复
      /^@/,                     // 装饰器和特殊标记
      /^#/,                     // 特殊标记(如路由)
    ],
    // 跳过调试相关的函数
    skipFunctions: [
      'debug', 'log', 'warn', 'error', 'info', 'trace', 'assert', 'time', 'timeEnd',
      'group', 'groupEnd', 'count', 'profile', 'profileEnd', 'table', 'dir', 'dirxml'
    ]
  };
  
  // 检查文件是否应该被跳过
  if (CONFIG.skipFilePatterns.some(pattern => pattern.test(file.path))) {
    return file.source;
  }
  
  function debug(message, obj) {
    if (CONFIG.debug) console.log(`[DEBUG] ${message}`, obj);
  }

  // 检查字符串是否包含中文
  function containsChinese(text) {
    return text && typeof text === 'string' && /[\u4e00-\u9fa5]/.test(text);
  }
  
  // 检查是否需要跳过该字符串
  function shouldSkipString(text) {
    if (!text) return true;
    
    // 跳过短字符串或纯数字/符号 
    if (text.length <= 1 || /^[\d\s\p{P}]+$/u.test(text)) return true;
    
    // 跳过匹配特定模式的字符串
    return CONFIG.skipStringPatterns.some(pattern => pattern.test(text));
  }
  
  // 检查是否是调试相关的函数
  function isDebugFunction(fnName) {
    if (!fnName) return false;
    
    // 检查是否是直接列出的调试函数
    if (CONFIG.skipFunctions.includes(fnName)) return true;
    
    // 检查是否是console的成员函数
    if (fnName.startsWith('console.')) {
      const method = fnName.split('.')[1];
      if (CONFIG.skipFunctions.includes(method)) return true;
    }
    
    return false;
  }
  
  // 获取函数名称(处理嵌套调用)
  function getFunctionName(node) {
    if (!node || !node.callee) return '';
    
    if (node.callee.type === 'Identifier') {
      return node.callee.name;
    } else if (node.callee.type === 'MemberExpression') {
      let obj = '';
      if (node.callee.object.type === 'Identifier') {
        obj = node.callee.object.name;
      }
      let prop = '';
      if (node.callee.property && node.callee.property.type === 'Identifier') {
        prop = node.callee.property.name;
      }
      return obj ? `${obj}.${prop}` : prop;
    }
    
    return '';
  }
  
  // 记录已处理的字符串，防止重复处理
  const processedStrings = new Set();
  
  // 阶段1：JSX文本转换
  debug("处理文件", file.path);
  
  // 查找并替换JSX中的文本字符串
  root.find(j.JSXText).forEach(path => {
    const text = path.node.value.trim();
    if (containsChinese(text) && !processedStrings.has(text) && !shouldSkipString(text)) {
      needsImport = true;
      debug('替换JSX文本', text);
      processedStrings.add(text);
      j(path).replaceWith(
        j.jsxExpressionContainer(
          j.callExpression(j.identifier('t'), [j.literal(text)])
        )
      );
    }
  });

  // 阶段2：JSX属性转换
  root.find(j.JSXAttribute).forEach(path => {
    const attrName = path.node.name.name;
    debug('处理JSX属性', attrName);
    
    // 跳过不需要转换的属性
    if (CONFIG.skipAttributes.includes(attrName)) {
      return;
    }
    
    // 处理字符串字面量属性值
    if (path.node.value && path.node.value.type === 'StringLiteral') {
      const text = path.node.value.value;
      
      if (containsChinese(text) && !processedStrings.has(text) && !shouldSkipString(text)) {
        needsImport = true;
        debug('替换属性字符串', `${attrName}="${text}"`);
        processedStrings.add(text);
        
        // 创建新的属性节点替换旧的
        const newAttr = j.jsxAttribute(
          path.node.name,
          j.jsxExpressionContainer(
            j.callExpression(j.identifier('t'), [j.literal(text)])
          )
        );
        
        j(path).replaceWith(newAttr);
      }
    }
  });
  
  // 阶段3：函数调用参数转换
  root.find(j.CallExpression).forEach(path => {
    // 获取函数名称
    const fnName = getFunctionName(path.node);
    
    // 跳过调试和日志函数
    if (isDebugFunction(fnName)) {
      return;
    }
    
    debug('处理函数调用', fnName);
    
    path.node.arguments.forEach((arg, index) => {
      if (arg.type === 'StringLiteral') {
        const text = arg.value;
        if (containsChinese(text) && !processedStrings.has(text) && !shouldSkipString(text)) {
          // 跳过已经在t函数中的字符串
          if (fnName === 't') {
            return;
          }
          
          needsImport = true;
          debug(`替换${fnName}函数参数`, text);
          processedStrings.add(text);
          
          // 替换参数
          path.node.arguments[index] = j.callExpression(
            j.identifier('t'), 
            [j.literal(text)]
          );
        }
      }
    });
  });
  
  // 阶段4：处理事件处理函数中的字符串
  root.find(j.ArrowFunctionExpression).forEach(path => {
    // 查找箭头函数中的所有函数调用
    j(path).find(j.CallExpression).forEach(callPath => {
      // 获取函数名称
      const fnName = getFunctionName(callPath.node);
      
      // 跳过调试和日志函数
      if (isDebugFunction(fnName)) {
        return;
      }
      
      callPath.node.arguments.forEach((arg, index) => {
        if (arg.type === 'StringLiteral') {
          const text = arg.value;
          if (containsChinese(text) && !processedStrings.has(text) && !shouldSkipString(text)) {
            // 跳过已经在t函数中的字符串
            if (fnName === 't') {
              return;
            }
            
            needsImport = true;
            debug(`替换事件处理函数中的${fnName}参数`, text);
            processedStrings.add(text);
            
            // 替换参数
            callPath.node.arguments[index] = j.callExpression(
              j.identifier('t'), 
              [j.literal(text)]
            );
          }
        }
      });
    });
  });
  
  // 阶段5：最后的JSX元素属性扫描
  root.find(j.JSXOpeningElement).forEach(path => {
    path.node.attributes.forEach(attr => {
      if (!attr.name || !attr.value) return;
      
      const attrName = attr.name.name;
      // 跳过不需要处理的属性
      if (CONFIG.skipAttributes.includes(attrName)) {
        return;
      }
      
      if (attr.value.type === 'StringLiteral') {
        const text = attr.value.value;
        if (containsChinese(text) && !processedStrings.has(text) && !shouldSkipString(text)) {
          needsImport = true;
          debug(`处理JSXOpeningElement的${attrName}属性`, text);
          processedStrings.add(text);
          
          // 直接修改AST节点
          attr.value = j.jsxExpressionContainer(
            j.callExpression(j.identifier('t'), [j.literal(text)])
          );
        }
      }
    });
  });

  // 如果需要，添加useTranslation导入
  if (needsImport) {
    // 检查文件是否已经导入useTranslation
    const hasImport = root
      .find(j.ImportDeclaration)
      .some(path => 
        path.node.source.value === 'react-i18next' &&
        path.node.specifiers.some(spec => 
          spec.type === 'ImportSpecifier' && 
          spec.imported.name === 'useTranslation'
        )
      );

    if (!hasImport) {
      // 添加导入
      root
        .find(j.Program)
        .get('body', 0)
        .insertBefore(
          j.importDeclaration(
            [j.importSpecifier(j.identifier('useTranslation'))],
            j.literal('react-i18next')
          )
        );

      // 在函数组件内部添加钩子调用
      // 处理函数声明组件
      root
        .find(j.FunctionDeclaration, { id: { type: 'Identifier' } })
        .forEach(path => {
          const body = path.node.body.body;
          body.unshift(
            j.variableDeclaration('const', [
              j.variableDeclarator(
                j.objectPattern([
                  j.property('init', j.identifier('t'), j.identifier('t'))
                ]),
                j.callExpression(j.identifier('useTranslation'), [])
              )
            ])
          );
        });

      // 处理箭头函数组件和函数表达式
      root
        .find(j.VariableDeclaration)
        .filter(path => 
          path.node.declarations.some(decl => 
            decl.init && 
            (decl.init.type === 'ArrowFunctionExpression' || 
             decl.init.type === 'FunctionExpression')
          )
        )
        .forEach(path => {
          path.node.declarations.forEach(decl => {
            if (decl.init && 
                (decl.init.type === 'ArrowFunctionExpression' || 
                 decl.init.type === 'FunctionExpression')) {
              const body = decl.init.body;
              if (body.type === 'BlockStatement') {
                body.body.unshift(
                  j.variableDeclaration('const', [
                    j.variableDeclarator(
                      j.objectPattern([
                        j.property('init', j.identifier('t'), j.identifier('t'))
                      ]),
                      j.callExpression(j.identifier('useTranslation'), [])
                    )
                  ])
                );
              }
            }
          });
        });
    }
  }

  // 生成转换后的代码
  let output = root.toSource();

  // 阶段6：正则表达式后备处理
  if (CONFIG.useRegexFallback) {
    debug("开始正则表达式后备处理");
    
    // 常见的函数调用模式
    const fnCallPatterns = [
      // 基础浏览器API
      { 
        regex: /alert\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `alert(t("${text}"))`
      },
      { 
        regex: /confirm\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `confirm(t("${text}"))`
      },
      { 
        regex: /prompt\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `prompt(t("${text}"))`
      },
      
      // UI组件库-消息提示
      { 
        regex: /message\.success\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `message.success(t("${text}"))`
      },
      { 
        regex: /message\.error\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `message.error(t("${text}"))`
      },
      { 
        regex: /message\.info\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `message.info(t("${text}"))`
      },
      { 
        regex: /message\.warning\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `message.warning(t("${text}"))`
      },
      { 
        regex: /message\.loading\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `message.loading(t("${text}"))`
      },
      
      // UI组件库-通知
      { 
        regex: /notification\.open\(\{[^}]*title:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, text) => match.replace(`'${text}'`, `t("${text}")`)
                                       .replace(`"${text}"`, `t("${text}")`)
      },
      { 
        regex: /notification\.open\(\{[^}]*description:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, text) => match.replace(`'${text}'`, `t("${text}")`)
                                       .replace(`"${text}"`, `t("${text}")`)
      },
      { 
        regex: /notification\.(success|error|info|warning)\(\{[^}]*message:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, type, text) => match.replace(`'${text}'`, `t("${text}")`)
                                             .replace(`"${text}"`, `t("${text}")`)
      },
      
      // UI组件库-Modal对话框
      { 
        regex: /Modal\.(info|success|error|warning|confirm)\(\{[^}]*title:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, type, text) => match.replace(`'${text}'`, `t("${text}")`)
                                             .replace(`"${text}"`, `t("${text}")`)
      },
      { 
        regex: /Modal\.(info|success|error|warning|confirm)\(\{[^}]*content:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, type, text) => match.replace(`'${text}'`, `t("${text}")`)
                                             .replace(`"${text}"`, `t("${text}")`)
      },
      { 
        regex: /Modal\.(info|success|error|warning|confirm)\(\{[^}]*okText:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, type, text) => match.replace(`'${text}'`, `t("${text}")`)
                                             .replace(`"${text}"`, `t("${text}")`)
      },
      { 
        regex: /Modal\.(info|success|error|warning|confirm)\(\{[^}]*cancelText:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, type, text) => match.replace(`'${text}'`, `t("${text}")`)
                                             .replace(`"${text}"`, `t("${text}")`)
      },
      
      // Toast通知
      { 
        regex: /toast\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `toast(t("${text}"))`
      },
      { 
        regex: /toast\.(success|error|info|warning)\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, type, text) => `toast.${type}(t("${text}"))`
      },
      
      // 错误处理
      { 
        regex: /throw new Error\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `throw new Error(t("${text}"))`
      },
      { 
        regex: /throw new TypeError\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `throw new TypeError(t("${text}"))`
      },
      
      // 状态更新函数
      { 
        regex: /setState\(\{[^}]*message:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, text) => match.replace(`'${text}'`, `t("${text}")`)
                                       .replace(`"${text}"`, `t("${text}")`)
      },
      { 
        regex: /setError\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `setError(t("${text}"))`
      },
      { 
        regex: /setMessage\(['"]([\u4e00-\u9fa5][^'"]*)['"]\)/g, 
        replace: (match, text) => `setMessage(t("${text}"))`
      },
      
      // 表单验证提示
      { 
        regex: /\{[^}]*required:[ ]*true,[ ]*message:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, text) => match.replace(`'${text}'`, `t("${text}")`)
                                       .replace(`"${text}"`, `t("${text}")`)
      },
      { 
        regex: /rules=\{\[\{[^}]*message:[ ]*['"]([\u4e00-\u9fa5][^'"]*)['"]/g,
        replace: (match, text) => match.replace(`'${text}'`, `t("${text}")`)
                                       .replace(`"${text}"`, `t("${text}")`)
      }
    ];
    
    // 常见的JSX属性模式
    const attrPatterns = [
      // 基础UI属性
      { 
        regex: /title="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `title={t("${text}")}`
      },
      { 
        regex: /placeholder="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `placeholder={t("${text}")}`
      },
      { 
        regex: /alt="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `alt={t("${text}")}`
      },
      
      // 表单相关
      { 
        regex: /label="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `label={t("${text}")}`
      },
      { 
        regex: /description="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `description={t("${text}")}`
      },
      { 
        regex: /help="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `help={t("${text}")}`
      },
      { 
        regex: /errorText="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `errorText={t("${text}")}`
      },
      
      // 按钮文本
      { 
        regex: /buttonText="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `buttonText={t("${text}")}`
      },
      { 
        regex: /confirmText="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `confirmText={t("${text}")}`
      },
      { 
        regex: /cancelText="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `cancelText={t("${text}")}`
      },
      { 
        regex: /okText="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `okText={t("${text}")}`
      },
      
      // 提示相关
      { 
        regex: /tooltip="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `tooltip={t("${text}")}`
      },
      { 
        regex: /hint="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `hint={t("${text}")}`
      },
      { 
        regex: /message="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `message={t("${text}")}`
      },
      
      // 表格相关
      { 
        regex: /headerName="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `headerName={t("${text}")}`
      },
      { 
        regex: /emptyText="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `emptyText={t("${text}")}`
      },
      
      // 菜单相关
      { 
        regex: /itemText="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `itemText={t("${text}")}`
      },
      { 
        regex: /menuTitle="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `menuTitle={t("${text}")}`
      },
      
      // 无障碍相关
      { 
        regex: /aria-label="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `aria-label={t("${text}")}`
      },
      { 
        regex: /aria-description="([\u4e00-\u9fa5][^"]*)"/g, 
        replace: (match, text) => `aria-description={t("${text}")}`
      }
    ];
    
    // 应用函数调用替换
    fnCallPatterns.forEach(pattern => {
      output = output.replace(pattern.regex, pattern.replace);
    });
    
    // 应用属性替换
    attrPatterns.forEach(pattern => {
      output = output.replace(pattern.regex, pattern.replace);
    });
  }

  debug("处理完成，已处理的字符串数量", processedStrings.size);
  
  return output;
}; 