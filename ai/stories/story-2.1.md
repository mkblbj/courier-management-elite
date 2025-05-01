# 母子快递类型管理 - Epic 2：前端实现 - 故事 1：数据管理 Hooks 更新

## 状态: 草稿

## 简介

本故事实现前端数据管理层的更新，创建或扩展必要的 React hooks，以支持母子快递类型的数据获取、管理和统计，为 UI 组件提供数据支持。

## 验收标准

1. 可以获取带有层级结构的快递类型数据
2. 可以创建、更新和删除子类型
3. 可以正确计算和更新母类型的总数（子类型总和）
4. 所有数据操作有适当的加载状态和错误处理
5. 单元测试通过

## 子任务

### 子任务 1: 更新 API 服务层

- 创建或更新 API 服务函数，用于与后端 API 交互
- 实现获取层级结构、创建子类型等功能

**具体实现例子（需根据实际情况修改）**

```typescript
// frontend/services/courier-type-api.ts
import { api } from "./api";
import { CourierType, CourierTypeHierarchy } from "@/types/courier-type";

// 获取快递类型层级结构
export const getCourierTypeHierarchy = async (): Promise<
  CourierTypeHierarchy[]
> => {
  const response = await api.get("/courier-types/hierarchy");
  return response.data;
};

// 获取特定快递类型详情
export const getCourierTypeDetails = async (
  id: number
): Promise<CourierType> => {
  const response = await api.get(`/courier-types/${id}`);
  return response.data;
};

// 创建快递类型(母类型或子类型)
export const createCourierType = async (
  data: Partial<CourierType>
): Promise<CourierType> => {
  const response = await api.post("/courier-types", data);
  return response.data;
};

// 更新快递类型
export const updateCourierType = async (
  id: number,
  data: Partial<CourierType>
): Promise<CourierType> => {
  const response = await api.put(`/courier-types/${id}`, data);
  return response.data;
};

// 删除快递类型
export const deleteCourierType = async (id: number): Promise<void> => {
  await api.delete(`/courier-types/${id}`);
};
```

### 子任务 2: 更新类型定义

- 更新 TypeScript 类型定义，支持母子类型关系
- 添加层级结构和统计相关的类型

**具体实现例子（需根据实际情况修改）**

```typescript
// frontend/types/courier-type.ts
export interface CourierType {
  id: number;
  name: string;
  parent_id: number | null;
  count: number;
  created_at: string;
  updated_at: string;
}

// 层级结构中的母类型（包含子类型和统计）
export interface CourierTypeHierarchy extends CourierType {
  children: CourierType[];
  totalCount: number;
}

// 创建/更新类型的表单数据
export interface CourierTypeFormData {
  name: string;
  parent_id?: number | null;
  count?: number;
}
```

### 子任务 3: 实现快递类型数据钩子

- 创建或更新 useCourierTypes 钩子
- 实现获取层级结构的逻辑
- 实现创建子类型和更新的逻辑

**具体实现例子（需根据实际情况修改）**

```typescript
// frontend/hooks/use-courier-types.ts
import { useState, useCallback, useEffect } from "react";
import {
  getCourierTypeHierarchy,
  createCourierType,
  updateCourierType,
  deleteCourierType,
} from "@/services/courier-type-api";
import {
  CourierType,
  CourierTypeHierarchy,
  CourierTypeFormData,
} from "@/types/courier-type";
import { useToast } from "@/hooks/use-toast";

export function useCourierTypes() {
  const [types, setTypes] = useState<CourierTypeHierarchy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // 获取类型层级结构
  const fetchTypesHierarchy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getCourierTypeHierarchy();
      setTypes(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取快递类型失败";
      setError(errorMessage);
      toast({
        title: "错误",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 创建母类型
  const createParentType = useCallback(
    async (data: CourierTypeFormData) => {
      setLoading(true);
      setError(null);

      try {
        await createCourierType({
          ...data,
          parent_id: null,
        });

        toast({
          title: "成功",
          description: "快递母类型创建成功",
        });

        // 重新获取数据以更新列表
        await fetchTypesHierarchy();
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "创建快递类型失败";
        setError(errorMessage);
        toast({
          title: "错误",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchTypesHierarchy, toast]
  );

  // 创建子类型
  const createChildType = useCallback(
    async (parentId: number, data: CourierTypeFormData) => {
      setLoading(true);
      setError(null);

      try {
        const newType = await createCourierType({
          ...data,
          parent_id: parentId,
        });

        toast({
          title: "成功",
          description: "快递子类型创建成功",
        });

        // 更新本地状态，避免重新获取全部数据
        setTypes((prev) =>
          prev.map((parent) => {
            if (parent.id === parentId) {
              const newChildren = [...parent.children, newType];
              const newTotalCount = newChildren.reduce(
                (sum, child) => sum + (child.count || 0),
                0
              );

              return {
                ...parent,
                children: newChildren,
                totalCount: newTotalCount,
              };
            }
            return parent;
          })
        );

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "创建子类型失败";
        setError(errorMessage);
        toast({
          title: "错误",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // 更新快递类型
  const updateType = useCallback(
    async (id: number, data: CourierTypeFormData) => {
      setLoading(true);
      setError(null);

      try {
        const updatedType = await updateCourierType(id, data);

        toast({
          title: "成功",
          description: "快递类型更新成功",
        });

        // 更新本地状态
        setTypes((prev) => {
          // 检查是否为母类型
          const parentIndex = prev.findIndex((p) => p.id === id);
          if (parentIndex >= 0) {
            // 更新母类型
            const updated = [...prev];
            updated[parentIndex] = {
              ...updated[parentIndex],
              ...updatedType,
              // 保持children和totalCount不变
              children: updated[parentIndex].children,
              totalCount: updated[parentIndex].totalCount,
            };
            return updated;
          }

          // 检查是否为子类型
          return prev.map((parent) => {
            const childIndex = parent.children.findIndex((c) => c.id === id);
            if (childIndex >= 0) {
              // 更新子类型
              const newChildren = [...parent.children];
              newChildren[childIndex] = {
                ...newChildren[childIndex],
                ...updatedType,
              };

              // 重新计算母类型的totalCount
              const newTotalCount = newChildren.reduce(
                (sum, child) => sum + (child.count || 0),
                0
              );

              return {
                ...parent,
                children: newChildren,
                totalCount: newTotalCount,
              };
            }
            return parent;
          });
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "更新快递类型失败";
        setError(errorMessage);
        toast({
          title: "错误",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // 删除快递类型
  const deleteType = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);

      try {
        await deleteCourierType(id);

        toast({
          title: "成功",
          description: "快递类型删除成功",
        });

        // 更新本地状态
        setTypes((prev) => {
          // 检查是否为母类型
          const parentIndex = prev.findIndex((p) => p.id === id);
          if (parentIndex >= 0) {
            // 删除母类型
            const updated = [...prev];
            updated.splice(parentIndex, 1);
            return updated;
          }

          // 检查是否为子类型
          return prev.map((parent) => {
            const childIndex = parent.children.findIndex((c) => c.id === id);
            if (childIndex >= 0) {
              // 删除子类型
              const newChildren = [...parent.children];
              newChildren.splice(childIndex, 1);

              // 重新计算母类型的totalCount
              const newTotalCount = newChildren.reduce(
                (sum, child) => sum + (child.count || 0),
                0
              );

              return {
                ...parent,
                children: newChildren,
                totalCount: newTotalCount,
              };
            }
            return parent;
          });
        });

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "删除快递类型失败";
        setError(errorMessage);
        toast({
          title: "错误",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  // 初始加载数据
  useEffect(() => {
    fetchTypesHierarchy();
  }, [fetchTypesHierarchy]);

  return {
    types,
    loading,
    error,
    fetchTypesHierarchy,
    createParentType,
    createChildType,
    updateType,
    deleteType,
  };
}
```

### 子任务 4: 编写单元测试

- 为钩子添加单元测试
- 验证数据获取和操作的正确性

**具体实现例子（需根据实际情况修改）**

```typescript
// frontend/hooks/use-courier-types.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import { useCourierTypes } from "./use-courier-types";
import * as api from "@/services/courier-type-api";

// 模拟API
jest.mock("@/services/courier-type-api");
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe("useCourierTypes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("获取层级结构", async () => {
    const mockData = [
      {
        id: 1,
        name: "母类型1",
        parent_id: null,
        count: 0,
        children: [{ id: 3, name: "子类型1", parent_id: 1, count: 5 }],
        totalCount: 5,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
    ];

    (api.getCourierTypeHierarchy as jest.Mock).mockResolvedValue(mockData);

    const { result, waitForNextUpdate } = renderHook(() => useCourierTypes());

    // 初始状态
    expect(result.current.loading).toBe(true);
    expect(result.current.types).toEqual([]);

    await waitForNextUpdate();

    // 加载后状态
    expect(result.current.loading).toBe(false);
    expect(result.current.types).toEqual(mockData);
  });

  test("创建子类型", async () => {
    const parentId = 1;
    const newTypeData = { name: "新子类型", count: 3 };
    const newType = {
      id: 5,
      ...newTypeData,
      parent_id: parentId,
      created_at: "2023-01-01T00:00:00Z",
      updated_at: "2023-01-01T00:00:00Z",
    };

    const mockInitialData = [
      {
        id: 1,
        name: "母类型1",
        parent_id: null,
        count: 0,
        children: [{ id: 3, name: "子类型1", parent_id: 1, count: 5 }],
        totalCount: 5,
        created_at: "2023-01-01T00:00:00Z",
        updated_at: "2023-01-01T00:00:00Z",
      },
    ];

    (api.getCourierTypeHierarchy as jest.Mock).mockResolvedValue(
      mockInitialData
    );
    (api.createCourierType as jest.Mock).mockResolvedValue(newType);

    const { result, waitForNextUpdate } = renderHook(() => useCourierTypes());

    await waitForNextUpdate();

    // 创建子类型
    await act(async () => {
      const success = await result.current.createChildType(
        parentId,
        newTypeData
      );
      expect(success).toBe(true);
    });

    // 验证状态更新
    expect(result.current.types[0].children).toContainEqual(newType);
    expect(result.current.types[0].totalCount).toBe(8); // 5 + 3

    // 验证API调用
    expect(api.createCourierType).toHaveBeenCalledWith({
      ...newTypeData,
      parent_id: parentId,
    });
  });

  // 更多测试...
});
```

## 技术备注

1. 使用 React hooks 实现状态管理逻辑
2. 在客户端保持状态同步，减少不必要的 API 请求
3. 乐观 UI 更新：先更新本地状态，再发送请求
4. 统一错误处理和加载状态管理
