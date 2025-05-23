# 快递类型管理 - 子类型功能测试文档

## 测试范围

本文档记录了针对新增的母子类型层级关系功能的测试用例，主要包括：

1. 子类型添加对话框组件测试
2. 从列表添加子类型功能测试
3. 子类型显示测试
4. 数据完整性和层级结构测试

## 测试用例

### 1. 子类型添加对话框测试

#### 测试用例 1.1: 显示父类型信息

- **前置条件**: 选择一个母类型，打开子类型添加对话框
- **操作步骤**: 检查对话框内容
- **预期结果**: 对话框标题显示"添加子类型"，并展示所选母类型的名称和代码

#### 测试用例 1.2: 表单验证

- **前置条件**: 打开子类型添加对话框
- **操作步骤**:
  1. 尝试提交空表单
  2. 尝试提交已存在的名称和代码
  3. 尝试提交过长的名称和代码
  4. 尝试提交非法字符的代码
- **预期结果**:
  1. 显示"必填"错误提示
  2. 显示"已存在"错误提示
  3. 显示"过长"错误提示
  4. 显示"格式错误"错误提示

#### 测试用例 1.3: 成功提交

- **前置条件**: 打开子类型添加对话框
- **操作步骤**:
  1. 填写有效的名称、代码和备注
  2. 提交表单
- **预期结果**:
  1. 表单提交成功
  2. 显示成功提示
  3. 对话框关闭
  4. 子类型成功添加到列表中

#### 测试用例 1.4: 表单重置

- **前置条件**: 打开子类型添加对话框并填写部分内容
- **操作步骤**:
  1. 点击重置按钮
  2. 在确认对话框中选择确认
- **预期结果**: 表单内容被清空，恢复初始状态

### 2. 从列表添加子类型功能测试

#### 测试用例 2.1: 添加子类型按钮显示

- **前置条件**: 显示快递类型列表
- **操作步骤**: 检查列表中的每个快递类型项
- **预期结果**: 每个列表项都显示"添加子类型"按钮

#### 测试用例 2.2: 点击添加子类型按钮

- **前置条件**: 显示快递类型列表
- **操作步骤**: 点击任一快递类型的"添加子类型"按钮
- **预期结果**: 打开子类型添加对话框，对话框中显示所选快递类型作为父类型

### 3. 子类型显示测试

#### 测试用例 3.1: 显示子类型数量

- **前置条件**: 有母子类型结构的数据
- **操作步骤**: 查看快递类型列表
- **预期结果**: 母类型旁边显示其子类型数量

#### 测试用例 3.2: 层级结构显示

- **前置条件**: 有母子类型结构的数据
- **操作步骤**: 查看快递类型列表
- **预期结果**: 列表以缩进或其他视觉方式显示母子类型层级关系

### 4. 数据完整性和层级结构测试

#### 测试用例 4.1: 子类型创建验证

- **前置条件**: 成功创建子类型
- **操作步骤**:
  1. 检查后端数据
  2. 重新加载页面
- **预期结果**:
  1. 子类型正确关联到父类型
  2. 重新加载后，层级关系仍然正确显示

#### 测试用例 4.2: 删除子类型

- **前置条件**: 选择一个子类型
- **操作步骤**: 删除该子类型
- **预期结果**:
  1. 子类型被删除
  2. 不影响母类型及其他子类型
  3. 母类型的子类型计数更新

#### 测试用例 4.3: 母子类型数据完整性

- **前置条件**: 有母子类型结构的数据
- **操作步骤**: 操作不同的母子类型
- **预期结果**: 所有母子类型关系数据保持一致

## 实现注意事项

1. 测试时需要考虑移动端和桌面端两种视图的显示差异
2. 需要测试不同状态下的功能（激活/非激活状态）
3. 测试权限控制：某些用户可能没有创建子类型的权限
4. 测试大规模数据：当有大量子类型时的性能和显示

## 测试环境

- 开发环境: 使用模拟数据
- 测试环境: 使用接近生产的测试数据
- 浏览器兼容性: 需在 Chrome, Firefox, Safari 和 Edge 上测试
- 响应式测试: 在不同屏幕尺寸上测试

## 自动化测试代码

为了完成自动化测试，应该创建以下测试文件：

1. `add-sub-type-dialog.test.tsx` - 测试子类型添加对话框组件
2. `courier-type-table.test.tsx` - 测试添加了子类型功能的列表组件
3. `courier-type-management.test.tsx` - 测试整体管理功能
4. `use-courier-types.test.ts` - 测试数据层相关功能
