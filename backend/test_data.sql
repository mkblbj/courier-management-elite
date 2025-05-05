-- 测试数据脚本
-- 清空现有数据
DELETE FROM shop_outputs;
DELETE FROM shops;
ALTER TABLE shops AUTO_INCREMENT = 1;
ALTER TABLE shop_outputs AUTO_INCREMENT = 1;

-- 插入测试店铺数据
INSERT INTO shops (name, is_active, sort_order, remark) VALUES 
('测试店铺1', 1, 1, '这是测试店铺1的备注'),
('测试店铺2', 1, 2, '这是测试店铺2的备注'),
('测试店铺3', 0, 3, '这是一个未启用的测试店铺'),
('测试店铺4', 1, 4, '这是测试店铺4的备注'),
('测试店铺5', 1, 5, NULL);

-- 确保有快递类型数据
-- 如果数据库中没有快递类型数据，请先添加
-- 这里假设已经有快递类型数据，ID为1和2

-- 插入测试出力数据
-- 使用当前日期和前几天的日期
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(1, 1, CURDATE(), 50, '今日测试数据'),
(1, 2, CURDATE(), 30, '今日测试数据'),
(2, 1, CURDATE(), 45, '今日测试数据'),
(2, 2, CURDATE(), 25, '今日测试数据'),
(3, 1, CURDATE(), 0, '未启用店铺测试数据'),
(4, 1, CURDATE(), 60, '今日测试数据'),
(5, 2, CURDATE(), 70, '今日测试数据');

-- 插入前一天的数据
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 48, '昨日测试数据'),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 28, '昨日测试数据'),
(2, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 42, '昨日测试数据'),
(2, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 22, '昨日测试数据');

-- 插入前两天的数据
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 55, '前天测试数据'),
(2, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 46, '前天测试数据'),
(4, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 38, '前天测试数据');

-- 插入前三天的数据
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(3, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 20, '三天前测试数据'),
(5, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 32, '三天前测试数据'); 