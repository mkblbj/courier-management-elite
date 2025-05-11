# 出力数据逻辑修改方案

## 1. 业务逻辑修改概述

### 当前问题

- 目前录入出力数据时采用累加逻辑，导致数据不是独立记录
- API 3.6 和 3.7 返回原始数据，没有按相同条件（同日期、同快递、同店铺）进行累加统计

### 修改目标

1. 恢复独立记录业务逻辑，每次录入的出力数据作为独立记录存储
2. 修改 API 返回逻辑，使 3.6 和 3.7 接口返回已累加的出力数据（按日期、快递类型、店铺分组并累加）

## 2. 后端修改方案

### 2.1 数据库保持不变

- 数据结构无需修改，继续使用现有的 shop_outputs 表

### 2.2 API 修改

#### 2.2.1 修改创建出力记录 API（POST /shop-outputs）

```javascript
// 修改前：累加逻辑
const existingRecord = await ShopOutput.findOne({
  where: {
    shop_id: data.shop_id,
    courier_id: data.courier_id,
    output_date: data.output_date,
  },
});

if (existingRecord) {
  // 累加现有记录
  existingRecord.quantity += data.quantity;
  await existingRecord.save();
  return existingRecord;
} else {
  // 创建新记录
  return await ShopOutput.create(data);
}

// 修改后：直接创建新记录
return await ShopOutput.create(data);
```

#### 2.2.2 修改 3.6 获取当日出力数据 API（GET /shop-outputs/recent）

```javascript
// 修改前：直接返回当日数据
const outputs = await ShopOutput.findAll({
  where: { output_date: today },
  include: [{...}]
});
return outputs;

// 修改后：按分组条件聚合并累加
const outputs = await ShopOutput.findAll({
  where: { output_date: today },
  include: [{...}]
});

// 按shop_id和courier_id分组累加
const groupedOutputs = {};
outputs.forEach(output => {
  const key = `${output.shop_id}-${output.courier_id}`;
  if (!groupedOutputs[key]) {
    groupedOutputs[key] = {
      ...output.toJSON(),
      original_id: output.id, // 保存原始ID供参考
      quantity: 0
    };
  }
  groupedOutputs[key].quantity += output.quantity;
});

return Object.values(groupedOutputs);
```

#### 2.2.3 修改 3.7 获取今日出力数据 API（GET /shop-outputs/today）

```javascript
// 修改逻辑同上，将分组聚合逻辑应用到今日数据
const today = new Date().toISOString().split('T')[0];
const outputs = await ShopOutput.findAll({
  where: { output_date: today },
  include: [{...}]
});

// 按shop_id和courier_id分组累加
const groupedOutputs = {};
outputs.forEach(output => {
  const key = `${output.shop_id}-${output.courier_id}`;
  if (!groupedOutputs[key]) {
    groupedOutputs[key] = {
      ...output.toJSON(),
      original_id: output.id, // 保存原始ID供参考
      quantity: 0
    };
  }
  groupedOutputs[key].quantity += output.quantity;
});

return Object.values(groupedOutputs);
```

## 3. 前端修改方案

### 3.1 录入出力数据组件（CreateOutputModal.vue）

```javascript
// 修改前：可能存在检查是否有相同记录的逻辑
// 无需特别修改，移除任何检查相同记录的逻辑即可，直接调用API

// 确保提交时直接发送数据创建新记录
const handleSubmit = async () => {
  try {
    const response = await api.post("/shop-outputs", formData);
    // 处理成功响应...
  } catch (error) {
    // 处理错误...
  }
};
```

### 3.2 出力数据展示组件

```javascript
// 对于使用3.6和3.7 API获取数据的组件
// 无需特别修改，因为API会返回已累加的数据
// 只需确保界面能正确显示"累加后"的数据

// 可能需要移除前端的任何手动累加计算，因为这现在由后端处理
```

## 4. 实施步骤

1. 先修改后端创建出力记录 API，移除累加逻辑
2. 实现 3.6 和 3.7 API 的数据分组累加逻辑
3. 更新前端组件，移除任何依赖累加逻辑的代码
4. 测试新逻辑，确保数据正确录入和显示

## 5. 测试计划

1. 测试录入多条相同日期、店铺、快递类型的数据，确认每条都是独立记录
2. 测试获取当日/今日数据 API，确认返回的是按条件累加后的数据
3. 验证前端展示是否正确显示累加后的数据
4. 测试统计功能是否正常工作
