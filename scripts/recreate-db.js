/**
 * 重建数据库脚本
 */
const postgres = require('postgres');

async function recreateDatabase() {
  // 连接到 postgres 默认数据库
  const sql = postgres({
    host: '192.168.40.2',
    port: 5432,
    username: 'openaigc',
    password: 'nestai123',
    database: 'postgres',
  });

  try {
    console.log('Dropping database iflow_chatbot...');
    await sql.unsafe('DROP DATABASE IF EXISTS iflow_chatbot;');
    console.log('✓ Database dropped');

    console.log('Creating database iflow_chatbot...');
    await sql.unsafe('CREATE DATABASE iflow_chatbot;');
    console.log('✓ Database created');

    console.log('\n✅ Database recreated successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

recreateDatabase();
