import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const accountNumber = 1111111111;
const cardNumber = 4111111111111111;

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

await connection.execute(
  'INSERT IGNORE INTO `User` (accno, name, ifsc, address, phoneno, age) VALUES (?, ?, ?, ?, ?, ?)',
  [accountNumber, 'Demo User', 'KCT0001', 'KCT Bankers', '0000000000', 25]
);

await connection.execute(
  'INSERT IGNORE INTO `Card` (cardno, accno, acctype, name_card, pin, bankname, expiredate, cvv, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [cardNumber, accountNumber, 'Savings', 'Demo User', '1234', 'KCT Bankers', '2030-12-31', 123, 10000]
);

console.log('Demo account ready: 1111111111 / PIN 1234');
await connection.end();
