-- 测试数据脚本
-- 清空现有数据
DELETE FROM shop_outputs;
DELETE FROM shipping_records;
DELETE FROM couriers;
DELETE FROM courier_categories;
DELETE FROM shops;
DELETE FROM shop_categories;
ALTER TABLE courier_categories AUTO_INCREMENT = 1;
ALTER TABLE couriers AUTO_INCREMENT = 1;
ALTER TABLE shipping_records AUTO_INCREMENT = 1;
ALTER TABLE shop_categories AUTO_INCREMENT = 1;
ALTER TABLE shops AUTO_INCREMENT = 1;
ALTER TABLE shop_outputs AUTO_INCREMENT = 1;

-- 插入店铺类别测试数据
INSERT INTO shop_categories (name, sort_order) VALUES 
('乐天', 1),
('亚马逊', 2),
('メルカリ', 3),
('雅虎', 4),
('其他', 5);

-- 插入测试店铺数据
INSERT INTO shops (name, category_id, is_active, sort_order, remark) VALUES 
('乐天店铺1', 1, 1, 1, '这是乐天店铺1的备注'),
('乐天店铺2', 1, 1, 2, '这是乐天店铺2的备注'),
('亚马逊店铺1', 2, 1, 1, '这是亚马逊店铺的备注'),
('メルカリ店铺', 3, 0, 1, '这是一个未启用的メルカリ测试店铺'),
('雅虎店铺', 4, 1, 1, '这是雅虎店铺的备注'),
('其他店铺', 5, 1, 1, NULL);

-- 插入快递类别测试数据
INSERT INTO courier_categories (name, sort_order) VALUES 
('普通快递', 1),
('特快专递', 2),
('经济快递', 3),
('国际快递', 4),
('默认类别', 5);

-- 插入测试快递类型数据
INSERT INTO couriers (name, code, remark, is_active, sort_order, category_id) VALUES
('ゆうパケット (1CM)', 'up1', '日本邮政小包，厚度1CM以内', 1, 1, 1),
('ゆうパケット (2CM)', 'up2', '全国性快递类型，性价比高', 1, 2, 1),
('ゆうパケットパフ', 'ypp', '电商自营物流，配送稳定', 1, 3, 1),
('クリップポスト (3CM)', 'cp3', '全国连锁快递企业', 1, 4, 2),
('ゆうパック', 'upk', '全国性快递企业，服务范围广', 1, 5, 2),
('EMS', 'ems', '特快专递，速度快，价格较高', 1, 1, 3),
('DHL', 'dhl', '国际快递，全球配送', 1, 1, 4),
('Fedex', 'fedex', '国际快递，美国为主', 1, 2, 4);

-- 插入测试发货记录数据
-- 使用当前日期和前几天的日期
INSERT INTO shipping_records (date, courier_id, quantity, notes) VALUES
(CURDATE(), 1, 5, '当日测试数据1'),
(CURDATE(), 2, 3, '当日测试数据2'),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 6, '昨日测试数据'),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1, 4, '前天测试数据'),
(DATE_SUB(CURDATE(), INTERVAL 3 DAY), 3, 7, '三天前测试数据'),
(DATE_SUB(CURDATE(), INTERVAL 4 DAY), 4, 2, '四天前测试数据');

-- 插入测试出力数据
-- 使用当前日期和前几天的日期
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(1, 1, CURDATE(), 50, '今日测试数据'),
(1, 2, CURDATE(), 30, '今日测试数据'),
(2, 1, CURDATE(), 45, '今日测试数据'),
(2, 2, CURDATE(), 25, '今日测试数据'),
(3, 1, CURDATE(), 60, '今日测试数据'),
(4, 1, CURDATE(), 0, '未启用店铺测试数据'),
(5, 2, CURDATE(), 70, '今日测试数据'),
(6, 2, CURDATE(), 40, '今日测试数据');

-- 插入前一天的数据
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(1, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 48, '昨日测试数据'),
(1, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 28, '昨日测试数据'),
(2, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 42, '昨日测试数据'),
(3, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 22, '昨日测试数据');

-- 插入前两天的数据
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 55, '前天测试数据'),
(2, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 46, '前天测试数据'),
(5, 2, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 38, '前天测试数据');

-- 插入前三天的数据
INSERT INTO shop_outputs (shop_id, courier_id, output_date, quantity, notes) VALUES 
(4, 1, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 20, '三天前测试数据'),
(6, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 32, '三天前测试数据'); 