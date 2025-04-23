require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'database.uoworld.co.jp',
  user: process.env.DB_USER || 'uostock',
  password: process.env.DB_PASSWORD || 'tYKt3zy2tsdeN7CA',
  database: process.env.DB_NAME || 'uostock',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+09:00'
}; 