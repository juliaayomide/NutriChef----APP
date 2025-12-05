import { conexao } from "../conexao.js";

export async function deletarUsuario(id) {
    const sql = `DELETE FROM usuarios where id_usuarios = ?`;
    const conn = await conexao();

    try {
        const [resultado] = await conn.query(sql, [id]);
        await conn.end();
        return   resultado;
    } catch (err) {
        console.error("Não foi possível deletar usuário:", err);
        return err.message;
    }
}