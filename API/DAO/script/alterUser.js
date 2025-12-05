import { conexao } from "../conexao.js";

export const alterUser = {
  atualizarParcial: async (id, dados) => {
    const campos = [];
    const valores = [];

    if (dados.nome) campos.push("nome = ?"), valores.push(dados.nome);
    if (dados.email) campos.push("email = ?"), valores.push(dados.email);
    if (dados.senha) campos.push("senha = ?"), valores.push(dados.senha);
    if (dados.foto) campos.push("foto = ?"), valores.push(dados.foto);

    if (campos.length === 0) throw new Error("Nenhum campo enviado para atualização");

    const sql = `UPDATE usuarios SET ${campos.join(", ")} WHERE id_usuarios = ?`;
    valores.push(id);

    const pool = await conexao(); 
    const [resultado] = await pool.query(sql, valores); 
    return resultado;
  },

  atualizarCompleto: async (id, nome, email, senha, foto) => {
    const sql = "UPDATE usuarios SET nome = ?, email = ?, senha = ?, foto = ? WHERE id_usuarios = ?";
    const pool = await conexao();
    const [resultado] = await pool.query(sql, [nome, email, senha, foto, id]);
    return resultado;
  },
};
