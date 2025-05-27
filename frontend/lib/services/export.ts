import { getBaseApiUrl } from '@/services/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// 扩展jsPDF类型以支持autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// 导出格式类型
export type ExportFormat = 'excel' | 'csv' | 'pdf';

// 导出选项
export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean; // 仅PDF格式支持
  dateRange?: {
    from: string;
    to: string;
  };
}

// 订单数据接口
export interface OrderData {
  orderId: string;
  shopName: string;
  shopCategory: string;
  courierType: string;
  orderDate: string;
  amount: number;
  status: string;
  createTime: string;
  updateTime: string;
}

// 导出数据响应接口
interface ExportDataResponse {
  code: number;
  message: string;
  data: {
    orders: OrderData[];
    total: number;
    summary: {
      totalAmount: number;
      totalOrders: number;
      dateRange: {
        from: string;
        to: string;
      };
    };
  };
}

/**
 * 获取导出数据
 */
export const getExportData = async (options: {
  dateFrom?: string;
  dateTo?: string;
  shopId?: number;
  categoryId?: number;
  courierId?: number;
}): Promise<OrderData[]> => {
  const API_URL = `${getBaseApiUrl()}/api/stats/export-data`;
  
  const params = new URLSearchParams();
  if (options.dateFrom) params.append('date_from', options.dateFrom);
  if (options.dateTo) params.append('date_to', options.dateTo);
  if (options.shopId) params.append('shop_id', options.shopId.toString());
  if (options.categoryId) params.append('category_id', options.categoryId.toString());
  if (options.courierId) params.append('courier_id', options.courierId.toString());

  const url = `${API_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`获取导出数据失败: ${response.status} ${response.statusText}`);
    }

    const result: ExportDataResponse = await response.json();
    
    if (result.code === 0 && result.data) {
      return result.data.orders;
    }
    
    throw new Error(result.message || '获取导出数据失败');
  } catch (error) {
    console.error('获取导出数据失败:', error);
    throw error;
  }
};

/**
 * 生成默认文件名
 */
const generateDefaultFilename = (format: ExportFormat, dateRange?: { from: string; to: string }): string => {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
  
  let filename = `订单统计数据_${timestamp}`;
  
  if (dateRange) {
    const fromDate = dateRange.from.replace(/-/g, '');
    const toDate = dateRange.to.replace(/-/g, '');
    filename = `订单统计数据_${fromDate}_${toDate}`;
  }
  
  const extensions = {
    excel: '.xlsx',
    csv: '.csv',
    pdf: '.pdf'
  };
  
  return `${filename}${extensions[format]}`;
};

/**
 * 导出为Excel格式
 */
export const exportToExcel = async (data: OrderData[], options: ExportOptions): Promise<void> => {
  try {
    // 准备表头
    const headers = [
      '订单ID',
      '店铺名称',
      '店铺类别',
      '快递类型',
      '订单日期',
      '金额',
      '状态',
      '创建时间',
      '更新时间'
    ];

    // 准备数据
    const rows = data.map(order => [
      order.orderId,
      order.shopName,
      order.shopCategory,
      order.courierType,
      order.orderDate,
      order.amount,
      order.status,
      order.createTime,
      order.updateTime
    ]);

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    
    // 创建工作表数据
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 订单ID
      { wch: 20 }, // 店铺名称
      { wch: 15 }, // 店铺类别
      { wch: 15 }, // 快递类型
      { wch: 12 }, // 订单日期
      { wch: 10 }, // 金额
      { wch: 10 }, // 状态
      { wch: 20 }, // 创建时间
      { wch: 20 }  // 更新时间
    ];
    ws['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '订单数据');

    // 如果有日期范围，添加摘要信息
    if (options.dateRange) {
      const summaryData = [
        ['导出摘要'],
        ['导出时间', new Date().toLocaleString('zh-CN')],
        ['数据范围', `${options.dateRange.from} 至 ${options.dateRange.to}`],
        ['总订单数', data.length.toString()],
        ['总金额', data.reduce((sum, order) => sum + order.amount, 0).toFixed(2)]
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, '导出摘要');
    }

    // 生成文件名
    const filename = options.filename || generateDefaultFilename('excel', options.dateRange);

    // 导出文件
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Excel导出失败:', error);
    throw new Error('Excel导出失败');
  }
};

/**
 * 导出为CSV格式
 */
export const exportToCSV = async (data: OrderData[], options: ExportOptions): Promise<void> => {
  try {
    // 准备表头
    const headers = [
      '订单ID',
      '店铺名称',
      '店铺类别',
      '快递类型',
      '订单日期',
      '金额',
      '状态',
      '创建时间',
      '更新时间'
    ];

    // 准备CSV内容
    const csvContent = [
      headers.join(','),
      ...data.map(order => [
        `"${order.orderId}"`,
        `"${order.shopName}"`,
        `"${order.shopCategory}"`,
        `"${order.courierType}"`,
        `"${order.orderDate}"`,
        order.amount,
        `"${order.status}"`,
        `"${order.createTime}"`,
        `"${order.updateTime}"`
      ].join(','))
    ].join('\n');

    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 生成文件名
    const filename = options.filename || generateDefaultFilename('csv', options.dateRange);

    // 下载文件
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CSV导出失败:', error);
    throw new Error('CSV导出失败');
  }
};

/**
 * 导出为PDF格式
 */
export const exportToPDF = async (data: OrderData[], options: ExportOptions): Promise<void> => {
  try {
    const doc = new jsPDF();

    // 设置中文字体（需要确保项目中有中文字体支持）
    doc.setFont('helvetica');

    // 添加标题
    doc.setFontSize(16);
    doc.text('订单统计数据报告', 20, 20);

    // 添加导出信息
    doc.setFontSize(10);
    let yPosition = 35;
    
    doc.text(`导出时间: ${new Date().toLocaleString('zh-CN')}`, 20, yPosition);
    yPosition += 7;
    
    if (options.dateRange) {
      doc.text(`数据范围: ${options.dateRange.from} 至 ${options.dateRange.to}`, 20, yPosition);
      yPosition += 7;
    }
    
    doc.text(`总订单数: ${data.length}`, 20, yPosition);
    yPosition += 7;
    
    const totalAmount = data.reduce((sum, order) => sum + order.amount, 0);
    doc.text(`总金额: ¥${totalAmount.toFixed(2)}`, 20, yPosition);
    yPosition += 15;

    // 准备表格数据
    const tableHeaders = [
      '订单ID',
      '店铺名称',
      '店铺类别',
      '快递类型',
      '订单日期',
      '金额',
      '状态'
    ];

    const tableData = data.map(order => [
      order.orderId,
      order.shopName,
      order.shopCategory,
      order.courierType,
      order.orderDate,
      `¥${order.amount.toFixed(2)}`,
      order.status
    ]);

    // 添加表格
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 25 }, // 订单ID
        1: { cellWidth: 30 }, // 店铺名称
        2: { cellWidth: 25 }, // 店铺类别
        3: { cellWidth: 25 }, // 快递类型
        4: { cellWidth: 25 }, // 订单日期
        5: { cellWidth: 20 }, // 金额
        6: { cellWidth: 20 }, // 状态
      },
    });

    // 生成文件名
    const filename = options.filename || generateDefaultFilename('pdf', options.dateRange);

    // 保存PDF
    doc.save(filename);
  } catch (error) {
    console.error('PDF导出失败:', error);
    throw new Error('PDF导出失败');
  }
};

/**
 * 主导出函数
 */
export const exportData = async (
  data: OrderData[],
  options: ExportOptions,
  onProgress?: (progress: number) => void
): Promise<void> => {
  try {
    onProgress?.(10);

    if (data.length === 0) {
      throw new Error('没有可导出的数据');
    }

    onProgress?.(30);

    switch (options.format) {
      case 'excel':
        await exportToExcel(data, options);
        break;
      case 'csv':
        await exportToCSV(data, options);
        break;
      case 'pdf':
        await exportToPDF(data, options);
        break;
      default:
        throw new Error(`不支持的导出格式: ${options.format}`);
    }

    onProgress?.(100);
  } catch (error) {
    console.error('数据导出失败:', error);
    throw error;
  }
}; 