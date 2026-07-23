import mysql from 'mysql2/promise';

async function main() {
  const candidates = [
    { user: 'root', password: '' },
    { user: 'root', password: 'root' },
    { user: 'root', password: 'password' },
    { user: 'habitus', password: 'change-me' },
  ];

  for (const creds of candidates) {
    try {
      const conn = await mysql.createConnection({ host: '127.0.0.1', user: creds.user, password: creds.password });
      console.log('Connected with', creds);
      await conn.query('CREATE DATABASE IF NOT EXISTS habitus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('Database created or already exists.');
      await conn.end();
      return;
    } catch (error) {
      console.error('Failed with', creds, error.message);
    }
  }

  process.exit(1);
}

main();
