/**
 * 错误处理中间件
 * 用于统一处理应用中的错误
 */
function errorHandler(err, req, res, next) {
  console.error('错误:', err);
  
  // 检查是否是验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '请求数据验证失败',
      errors: err.errors
    });
  }
  
  // 检查是否是数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    // 尝试解析错误信息，判断是否是日期和快递类型组合重复
    if (err.message && err.message.includes('shipping_records')) {
      // 尝试从错误信息中提取日期和快递类型ID
      const dateMatch = err.message.match(/'([^']*-[^']*-[^']*)'/);
      const date = dateMatch ? dateMatch[1] : '当前日期';
      
      // 尝试提取快递类型ID
      const courierIdMatch = err.message.match(/courier_id_(.+)/);
      const courierId = courierIdMatch ? courierIdMatch[1] : '指定快递类型';
      
      return res.status(400).json({
        success: false,
        message: `${date}日期的${courierId}快递记录已存在，如需修改请使用更新功能`,
        errors: {
          courier_id: `${date}日期的快递记录已存在，如需修改请使用更新功能`
        }
      });
    }
    
    return res.status(400).json({
      success: false,
      message: '数据已存在'
    });
  }
  
  // 检查是否是404错误
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: err.message || '请求的资源不存在'
    });
  }
  
  // 默认返回500错误
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误'
  });
}

module.exports = errorHandler; 