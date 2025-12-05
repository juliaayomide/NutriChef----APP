import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export async function conexao() {
  const pool = mysql.createPool({
    host: process.env.HOST_DATABASE,
    port: process.env.PORTA_BD,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATA_BASE,
  });
  return pool;
}

export async function closeConexao(pool) {
  if (pool) {
    console.log("Fechando a conexão com o banco de dados");
    await pool.end();
  } else {
    console.log("Conexão já fechada");
  }
}

export async function testarConexao() {
  try {
    const pool = await conexao();
    const conn = await pool.getConnection();
    await conn.ping();
    console.log("✅ Conexão com o MySQL bem-sucedida!");
    conn.release();
  } catch (erro) {
    console.error("❌ Falha ao conectar com o MySQL:", erro.message);
  }
}
