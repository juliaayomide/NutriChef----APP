import express from 'express';
import pool from '../database.js';

const router = express.Router();

// ============================================
// GET - Buscar favoritos do usuário
// ============================================
router.get('/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;

    try {
        const [rows] = await pool.query(
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

    if (!id_usuario || !id_receita) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }

    try {
        const [result] = await pool.query(
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

    try {
        await pool.query(
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
