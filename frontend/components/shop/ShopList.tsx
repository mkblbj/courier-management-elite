import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Shop } from "@/lib/types/shop";

interface ShopListProps {
  shops: Shop[];
  onToggleActive?: (id: number, active: boolean) => void;
  onEdit?: (shop: Shop) => void;
  onDelete?: (id: number) => void;
  onSort?: () => void;
  loading?: boolean;
  searchTerm?: string;
  onSearch?: (term: string) => void;
}

export const ShopList: React.FC<ShopListProps> = ({
  shops = [],
  onToggleActive,
  onEdit,
  onDelete,
  onSort,
  loading = false,
  searchTerm = '',
  onSearch,
}) => {
  const { t } = useTranslation(['common', 'shop']);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [paginatedShops, setPaginatedShops] = useState<Shop[]>([]);

  // 当搜索词从父组件变化时，更新本地状态
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // 根据搜索词过滤店铺
  useEffect(() => {
    setFilteredShops(
      shops.filter(shop => 
        shop.name.toLowerCase().includes(localSearchTerm.toLowerCase())
      )
    );
    setCurrentPage(1); // 重置到第一页
  }, [shops, localSearchTerm]);

  // 计算分页数据
  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setPaginatedShops(filteredShops.slice(indexOfFirstItem, indexOfLastItem));
  }, [filteredShops, currentPage, itemsPerPage]);

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // 处理页面变化
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // 生成分页组件
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredShops.length / itemsPerPage);
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    // 确定要显示哪些页码
    let startPage, endPage;
    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于最大可见页数，显示所有页码
      startPage = 1;
      endPage = totalPages;
    } else {
      // 在中间显示当前页，前后各显示1个页码
      const leftOffset = Math.floor(maxVisiblePages / 2);
      const rightOffset = Math.ceil(maxVisiblePages / 2) - 1;
      
      if (currentPage <= leftOffset + 1) {
        // 当前页靠近开始
        startPage = 1;
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - rightOffset) {
        // 当前页靠近结束
        startPage = totalPages - maxVisiblePages + 1;
        endPage = totalPages;
      } else {
        // 当前页在中间
        startPage = currentPage - leftOffset;
        endPage = currentPage + rightOffset;
      }
    }
    
    // 添加页码按钮
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="mx-1 h-8 w-8 p-0"
        >
          {i}
        </Button>
      );
    }
    
    return (
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              className="mx-1 h-8 w-8 p-0"
            >
              1
            </Button>
            {startPage > 2 && <span className="mx-1">...</span>}
          </>
        )}
        {pageNumbers}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="mx-1">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              className="mx-1 h-8 w-8 p-0"
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('shop:search_shop')}
            className="pl-8"
            value={localSearchTerm}
            onChange={handleSearch}
          />
        </div>
        <Button variant="outline" onClick={onSort}>
          {t('shop:sort_shops')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('shop:shop_name')}</TableHead>
              <TableHead>{t('shop:status')}</TableHead>
              <TableHead>{t('shop:sort_order')}</TableHead>
              <TableHead>{t('shop:remark')}</TableHead>
              <TableHead className="text-right">{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {t('common:loading')}
                </TableCell>
              </TableRow>
            ) : filteredShops.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  {t('shop:no_shops_found')}
                </TableCell>
              </TableRow>
            ) : (
              paginatedShops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>
                    <Switch
                      checked={!!shop.is_active}
                      onCheckedChange={(checked) => onToggleActive?.(shop.id, checked)}
                    />
                  </TableCell>
                  <TableCell>{shop.sort_order}</TableCell>
                  <TableCell>{shop.remark}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit?.(shop)}
                    >
                      {t('common:edit')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete?.(shop.id)}
                    >
                      {t('common:delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页组件 */}
      {!loading && filteredShops.length > 0 && renderPagination()}
    </div>
  );
};

export default ShopList; 