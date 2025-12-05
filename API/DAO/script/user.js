import { conexao } from "../conexao.js";

export async function buscarUsers() {
  console.log("📘 Buscando todos os usuários...");
  const sql = `SELECT * FROM usuarios;`;
  const conn = await conexao();

  try {
    const [rows] = await conn.query(sql);
    await conn.end();
    return rows;
  } catch (err) {
    console.error("❌ Erro ao buscar usuários:", err);
    await conn.end();
    return [];
  }
}

export async function incluirUser(infos) {
  console.log("🟢 Cadastro de novo usuário");
  const [email, senha, nome, foto] = infos;
  const sql = `CALL spInsere_Usuario(?, ?, ?, ?);`;
  const conn = await conexao();

  try {
    const [results] = await conn.query(sql, [email, senha, nome, foto]);
    await conn.end();
    return results;
  } catch (err) {
    console.error("❌ Erro ao incluir usuário:", err);
    await conn.end();
    throw new Error(err.sqlMessage || err.message);
  }
}

export async function buscarUserPorEmailSenha(email, senha) {
  console.log(`🔍 Verificando login de: ${email}`);
  const sql = `SELECT * FROM usuarios WHERE email = ? AND senha = ?;`;
  const conn = await conexao();

  try {
    const [rows] = await conn.query(sql, [email, senha]);
    await conn.end();

    if (rows.length === 0) {
      console.log("⚠️ Nenhum usuário encontrado com essas credenciais.");
      return null;
    }

    return rows[0];
  } catch (err) {
    console.error("❌ Erro ao buscar usuário por email e senha:", err);
    await conn.end();
    throw err;
  }
}

export async function deletarUser(id) {
  const sql = `DELETE FROM usuarios WHERE id_usuarios = ?;`;
  const conn = await conexao();

  try {
    const [resultado] = await conn.query(sql, [id]);
    await conn.end();
    return resultado;
  } catch (err) {
    console.error("❌ Erro ao deletar usuário:", err);
    await conn.end();
    throw err;
  }
}
