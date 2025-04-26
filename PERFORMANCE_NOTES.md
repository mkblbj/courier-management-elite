### 性能优化后，请重启VS Code，然后使用以下命令停止旧的tsserver进程
pkill -f tsserver

## TypeScript项目性能优化建议

### 已完成的优化

1. 配置了VS Code设置，限制了tsserver内存使用
2. 创建了基础tsconfig优化配置
3. 增加了忽略文件配置，减少索引负担
4. 固定了Node.js版本

### 进一步优化建议

1. **分析项目结构**：
   - 考虑将项目拆分为多个子项目，使用monorepo结构
   - 使用project references优化大型项目构建
   
2. **类型定义优化**：
   - 避免过度复杂的类型定义
   - 使用类型断言替代复杂的类型推断
   - 小心使用映射类型和条件类型
   - 减少类型递归深度

3. **依赖管理**：
   - 运行 `npm dedupe` 优化依赖结构
   - 考虑使用 `pnpm` 代替 `npm`，提高依赖管理效率
   - 审查并移除未使用的依赖

4. **编辑器使用**：
   - 在大型文件上禁用代码镜头，在Cursor中使用 `@lens:off`
   - 打开文件时，在需要时才加载
   - 编辑大型项目时，手动重启TS服务

5. **代码风格**：
   - 避免使用 `any`，但对已知安全的情况使用 `as unknown as Type`
   - 尽量避免复杂的类型体操（type gymnastics）
   - 考虑拆分大型接口和类型定义

### 紧急修复

如果VS Code/Cursor中的TypeScript服务不响应：

```bash
# 杀死所有tsserver进程
pkill -f tsserver

# 清除TypeScript服务缓存
rm -rf ~/.config/Code/Cache
rm -rf ~/.config/Code/CachedData

# 重启编辑器
```

### 检查错误源文件

考虑使用TypeScript项目分析工具识别问题：

```bash
npx type-coverage --detail
```
