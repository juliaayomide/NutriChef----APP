import express from 'express';
import { conexao } from '../DAO/conexao.js';

const router = express.Router();

// ============================================
// GET - Buscar favoritos do usuário
// ============================================
router.get('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    const conn = await conexao();
    
    try {
        const [rows] = await conn.query(
            `SELECT f.id_favorito, r.*
             FROM favoritos f
             INNER JOIN receitas r ON r.id_receitas = f.id_receita
             WHERE f.id_usuario = ?`,
            [id_usuario]
        );

        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ============================================
// POST /favoritos/add → Adicionar favorito
// ============================================
router.post('/add', async (req, res) => {
    const { id_usuario, id_receita } = req.body;
    const conn = await conexao();

    if (!id_usuario || !id_receita) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }

    try {
        const [result] = await conn.query(
            `INSERT INTO favoritos (id_usuario, id_receita)
             VALUES (?, ?)`,
            [id_usuario, id_receita]
        );

        res.json({ message: "Favorito adicionado!", id: result.insertId });
    } catch (error) {
        console.error('Erro ao inserir favorito:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// ============================================
// DELETE /favoritos/remove/:id_usuario/:id_receita
// ============================================
router.delete('/remove/:id_usuario/:id_receita', async (req, res) => {
    const { id_usuario, id_receita } = req.params;
    const conn = await conexao();

    try {
        await conn.query(
            `DELETE FROM favoritos WHERE id_usuario = ? AND id_receita = ?`,
            [id_usuario, id_receita]
        );

        res.json({ message: "Favorito removido!" });
    } catch (error) {
        console.error('Erro ao remover favorito:', error);
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

export default router;
