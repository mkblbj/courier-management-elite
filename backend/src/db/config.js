require('dotenv').config();

module.exports = {
  host: process.env.DB_HOST || 'database.uoworld.co.jp',
  user: process.env.DB_USER || 'uomain',
  password: process.env.DB_PASSWORD || '8YnRckz2mw7p8FBj',
  database: process.env.DB_NAME || 'uomain',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}; 