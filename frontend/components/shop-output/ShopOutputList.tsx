import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search,
  ArrowUpDown,
  PlusCircle,
  Upload,
  Download,
  Edit,
  Trash,
} from 'lucide-react';
import { ShopOutput, ShopOutputFilter } from '@/lib/types/output';
import { Shop, ShopCategory } from '@/lib/types/shop';
import { getShopOutputs, deleteShopOutput } from '@/lib/api/shop-output';
import { getShops } from '@/lib/api/shop';
import { getShopCategories } from '@/lib/api/shop-category';
import { useToast } from '@/components/ui/use-toast';
import { OutputDataDialog } from './OutputDataDialog';
import { ImportDataDialog } from './ImportDataDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRange } from 'react-day-picker';
import { dateToApiString } from '@/lib/date-utils';

export function ShopOutputList() {
  const [outputs, setOutputs] = useState<ShopOutput[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ShopOutputFilter>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<string>('date');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [editOutput, setEditOutput] = useState<ShopOutput | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const { toast } = useToast();

  // 页面大小
  const pageSize = 10;

  useEffect(() => {
    fetchShops();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchOutputs();
  }, [filter, currentPage, sort, order]);

  const fetchOutputs = async () => {
    setIsLoading(true);
    try {
      const data = await getShopOutputs({
        ...filter,
        sort,
        order,
      } as ShopOutputFilter);
      setOutputs(data as unknown as ShopOutput[]);
      // 模拟分页，实际应该从API获取
      setTotalPages(Math.ceil(data.length / pageSize));
    } catch (error) {
      console.error('获取出力数据失败:', error);
      toast({
        variant: 'destructive',
        title: '获取出力数据失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const data = await getShops({ isActive: true }); // 只获取活跃的店铺
      setShops(data);
    } catch (error) {
      console.error('获取店铺列表失败:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getShopCategories();
      setCategories(data);
    } catch (error) {
      console.error('获取店铺类别失败:', error);
    }
  };

  const handleSearch = () => {
    setFilter(prev => ({
      ...prev,
      date_from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      date_to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    }));
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSort(column);
      setOrder('ASC');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条出力数据吗？此操作不可撤销。')) {
      return;
    }

    try {
      await deleteShopOutput(id);
      toast({
        title: '删除成功',
        description: '出力数据已成功删除',
      });
      fetchOutputs();
    } catch (error) {
      console.error('删除出力数据失败:', error);
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : '请稍后重试',
      });
    }
  };

  const handleExport = () => {
    // 导出功能实现
  };

  const handleDialogClose = (refresh?: boolean) => {
    setIsDialogOpen(false);
    setEditOutput(null);
    if (refresh) {
      fetchOutputs();
    }
  };

  const handleImportDialogClose = (refresh?: boolean) => {
    setIsImportDialogOpen(false);
    if (refresh) {
      fetchOutputs();
    }
  };

  // 分页显示的数据
  const paginatedOutputs = outputs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="date-range" className="text-sm font-medium">日期范围</label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-[250px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="shop-category" className="text-sm font-medium">店铺类别</label>
            <Select
              onValueChange={(value) => setFilter(prev => ({ ...prev, shop_category_id: parseInt(value) || undefined }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="所有类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">所有类别</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="shop" className="text-sm font-medium">店铺</label>
            <Select
              onValueChange={(value) => setFilter(prev => ({ ...prev, shop_id: parseInt(value) || undefined }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="所有店铺" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">所有店铺</SelectItem>
                {shops.map(shop => (
                  <SelectItem key={shop.id} value={shop.id.toString()}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            添加
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <button
                  className="flex items-center space-x-1"
                  onClick={() => handleSort('date')}
                >
                  <span>日期</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead>店铺名称</TableHead>
              <TableHead className="text-right">
                <button
                  className="flex items-center space-x-1"
                  onClick={() => handleSort('output_count')}
                >
                  <span>出力件数</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button
                  className="flex items-center space-x-1"
                  onClick={() => handleSort('avg_time')}
                >
                  <span>平均制作时间</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </TableHead>
              <TableHead className="text-right">最短时间</TableHead>
              <TableHead className="text-right">最长时间</TableHead>
              <TableHead className="text-right">总时间</TableHead>
              <TableHead className="text-right w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={8}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : paginatedOutputs.length > 0 ? (
              paginatedOutputs.map((output) => (
                <TableRow key={output.id}>
                  <TableCell>{output.date}</TableCell>
                  <TableCell>{output.shop_name}</TableCell>
                  <TableCell className="text-right">{output.output_count}</TableCell>
                  <TableCell className="text-right">{output.avg_time}分钟</TableCell>
                  <TableCell className="text-right">{output.min_time}分钟</TableCell>
                  <TableCell className="text-right">{output.max_time}分钟</TableCell>
                  <TableCell className="text-right">{output.total_time}分钟</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditOutput(output);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(output.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  没有找到出力数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            第 {currentPage} 页，共 {totalPages} 页
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {isDialogOpen && (
        <OutputDataDialog
          output={editOutput}
          shops={shops}
          open={isDialogOpen}
          onClose={handleDialogClose}
        />
      )}

      {isImportDialogOpen && (
        <ImportDataDialog
          open={isImportDialogOpen}
          onClose={handleImportDialogClose}
        />
      )}
    </div>
  );
} 