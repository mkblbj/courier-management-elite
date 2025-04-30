# 母子快递类型管理 - Epic 2：前端实现 - 故事 2：UI 组件更新

## 状态: 草稿

## 简介

本故事实现前端 UI 组件的更新，包括快递类型列表视图、添加子类型对话框和编辑功能，使用户能够直观地管理母子类型关系并查看统计数据。

## 验收标准

1. 快递类型列表能正确显示母子类型层级结构
2. 母类型显示子类型总和统计
3. 可通过 UI 添加子类型
4. 可编辑母类型和子类型
5. 操作有适当的反馈(成功/错误提示)
6. UI 测试通过

## 子任务

### 子任务 1: 添加子类型对话框组件

- 创建用于添加子类型的对话框组件
- 实现表单验证逻辑
- 处理提交事件

**具体实现:**

```tsx
// frontend/components/courier-type/add-sub-type-dialog.tsx
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CourierTypeHierarchy } from "@/types/courier-type";

// 表单验证模式
const formSchema = z.object({
  name: z.string().min(1, { message: "名称不能为空" }),
  count: z.coerce.number().min(0, { message: "数量不能为负数" }).default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSubTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentType: CourierTypeHierarchy;
  onAddSubType: (
    parentId: number,
    data: { name: string; count: number }
  ) => Promise<boolean>;
}

export function AddSubTypeDialog({
  open,
  onOpenChange,
  parentType,
  onAddSubType,
}: AddSubTypeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单，默认子类型名称为母类型名称
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: `${parentType.name} `,
      count: 0,
    },
  });

  // 处理表单提交
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      const success = await onAddSubType(parentType.id, values);
      if (success) {
        form.reset(); // 重置表单
        onOpenChange(false); // 关闭对话框
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加子类型 - {parentType.name}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="输入子类型名称" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数量</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" placeholder="0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "添加中..." : "添加子类型"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 子任务 2: 更新快递类型列表组件

- 更新列表视图以支持母子层级显示
- 添加子类型总和显示
- 实现添加、编辑和删除功能

**具体实现:**

```tsx
// frontend/components/courier-type/courier-type-list.tsx
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddSubTypeDialog } from "./add-sub-type-dialog";
import { useCourierTypes } from "@/hooks/use-courier-types";
import { useRouter } from "next/navigation";
import { CourierTypeHierarchy, CourierType } from "@/types/courier-type";

export function CourierTypeList() {
  const { types, loading, error, createChildType, deleteType } =
    useCourierTypes();
  const router = useRouter();

  // 状态管理
  const [openParents, setOpenParents] = useState<number[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<CourierType | null>(null);

  // 切换父类型展开/折叠
  const toggleParent = (id: number) => {
    setOpenParents((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // 处理添加子类型
  const handleAddSubType = (parentId: number) => {
    setSelectedParentId(parentId);
    setDialogOpen(true);
  };

  // 处理编辑类型
  const handleEditType = (id: number) => {
    router.push(`/courier-types/${id}/edit`);
  };

  // 处理删除类型
  const handleDeleteClick = (type: CourierType) => {
    setTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (typeToDelete) {
      await deleteType(typeToDelete.id);
      setDeleteDialogOpen(false);
      setTypeToDelete(null);
    }
  };

  // 添加子类型表单提交
  const handleAddSubTypeSubmit = async (
    parentId: number,
    data: { name: string; count: number }
  ) => {
    return await createChildType(parentId, data);
  };

  if (loading && types.length === 0) {
    return <div className="flex justify-center p-8">加载中...</div>;
  }

  if (error && types.length === 0) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-red-500 mb-4">加载失败: {error}</p>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    );
  }

  if (types.length === 0) {
    return (
      <div className="flex flex-col items-center p-8">
        <p className="text-muted-foreground mb-4">暂无快递类型</p>
        <Button onClick={() => router.push("/courier-types/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          添加快递类型
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {types.map((parentType) => (
        <Card key={parentType.id}>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{parentType.name}</CardTitle>
                <CardDescription>
                  总数量: {parentType.totalCount || 0}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditType(parentType.id)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSubType(parentType.id)}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  添加子类型
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClick(parentType)}
                  disabled={parentType.children.length > 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Collapsible
              open={openParents.includes(parentType.id)}
              onOpenChange={() => toggleParent(parentType.id)}
              className="border rounded-md"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted">
                  <span className="font-medium">
                    子类型 ({parentType.children.length})
                  </span>
                  {openParents.includes(parentType.id) ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4">
                {parentType.children.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>名称</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parentType.children.map((child) => (
                        <TableRow key={child.id}>
                          <TableCell>{child.name}</TableCell>
                          <TableCell className="text-right">
                            {child.count}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditType(child.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(child)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">
                    暂无子类型
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}

      {/* 添加子类型对话框 */}
      {selectedParentId !== null && (
        <AddSubTypeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          parentType={types.find((t) => t.id === selectedParentId)!}
          onAddSubType={handleAddSubTypeSubmit}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {typeToDelete?.parent_id === null
                ? "删除母类型将无法恢复。请确认是否继续？"
                : "删除子类型将无法恢复。请确认是否继续？"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### 子任务 3: 更新编辑表单组件

- 更新编辑表单以支持母子类型编辑
- 添加母/子类型特定的字段

**具体实现:**

```tsx
// frontend/components/courier-type/courier-type-form.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useCourierTypes } from "@/hooks/use-courier-types";
import { CourierType } from "@/types/courier-type";

// 表单验证模式
const formSchema = z.object({
  name: z.string().min(1, { message: "名称不能为空" }),
  count: z.coerce.number().min(0, { message: "数量不能为负数" }).default(0),
});

type FormValues = z.infer<typeof formSchema>;

interface CourierTypeFormProps {
  id?: number; // 编辑现有类型时提供ID，否则为新建
  initialData?: CourierType; // 编辑时的初始数据
  isSubType?: boolean; // 是否为子类型
  parentId?: number; // 创建子类型时提供父ID
}

export function CourierTypeForm({
  id,
  initialData,
  isSubType = false,
  parentId,
}: CourierTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { createParentType, createChildType, updateType } = useCourierTypes();

  // 初始化表单
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      count: initialData?.count || 0,
    },
  });

  // 当初始数据变化时更新表单
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        count: initialData.count,
      });
    }
  }, [initialData, form]);

  // 处理表单提交
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let success = false;

      if (id) {
        // 更新现有类型
        success = await updateType(id, values);
      } else if (isSubType && parentId) {
        // 创建子类型
        success = await createChildType(parentId, values);
      } else {
        // 创建母类型
        success = await createParentType(values);
      }

      if (success) {
        router.push("/courier-types");
        router.refresh();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "操作失败";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {id
            ? `编辑${isSubType ? "子" : "母"}类型`
            : isSubType
            ? "添加子类型"
            : "添加母类型"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名称</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="输入快递类型名称" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>数量</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" min="0" placeholder="0" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

### 子任务 4: 更新页面组件

- 更新类型列表页面
- 创建编辑页面

**具体实现:**

```tsx
// frontend/app/courier-types/page.tsx
import { CourierTypeList } from "@/components/courier-type/courier-type-list";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function CourierTypesPage() {
  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">快递类型管理</h1>
        <Button asChild>
          <Link href="/courier-types/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            添加母类型
          </Link>
        </Button>
      </div>

      <CourierTypeList />
    </div>
  );
}
```

```tsx
// frontend/app/courier-types/[id]/edit/page.tsx
"use client";

import { useEffect, useState } from "react";
import { CourierTypeForm } from "@/components/courier-type/courier-type-form";
import { getCourierTypeDetails } from "@/services/courier-type-api";
import { CourierType } from "@/types/courier-type";

interface EditPageProps {
  params: {
    id: string;
  };
}

export default function EditCourierTypePage({ params }: EditPageProps) {
  const [courierType, setCourierType] = useState<CourierType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = parseInt(params.id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCourierTypeDetails(id);
        setCourierType(data);
      } catch (err) {
        setError("无法加载快递类型数据");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div className="container py-8">加载中...</div>;
  }

  if (error || !courierType) {
    return (
      <div className="container py-8 text-red-500">
        {error || "未找到快递类型"}
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">编辑快递类型</h1>
      <CourierTypeForm
        id={id}
        initialData={courierType}
        isSubType={courierType.parent_id !== null}
      />
    </div>
  );
}
```

## 组件交互流程

```mermaid
sequenceDiagram
    参与者 User
    参与者 CourierTypeList
    参与者 AddSubTypeDialog
    参与者 useCourierTypes
    参与者 API

    User->>CourierTypeList: 点击"添加子类型"
    CourierTypeList->>AddSubTypeDialog: 打开对话框(parentId)
    User->>AddSubTypeDialog: 填写表单并提交
    AddSubTypeDialog->>useCourierTypes: createChildType(parentId, data)
    useCourierTypes->>API: POST /courier-types
    API-->>useCourierTypes: 返回新创建的子类型
    useCourierTypes-->>CourierTypeList: 更新状态，添加新子类型
    useCourierTypes-->>AddSubTypeDialog: 返回成功
    AddSubTypeDialog-->>User: 关闭对话框，显示成功提示
```

## 技术备注

1. 使用自顶向下组件设计方案，主要组件：
   - `CourierTypeList`: 层级显示母子类型
   - `AddSubTypeDialog`: 添加子类型的对话框
   - `CourierTypeForm`: 编辑母类型或子类型的表单
2. 使用 Shadcn UI 组件库的可折叠组件(Collapsible)实现层级视图
3. 实现乐观 UI 更新，提高用户体验流畅度
4. 表单验证使用 zod 确保数据有效性
