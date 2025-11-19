import { db } from "../db/connect.js";

export async function getReceitas(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM receitas");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getReceitaPorNome(req, res) {
  try {
    const nome = `%${req.params.nome}%`;
    const [rows] = await db.query("SELECT * FROM receitas WHERE titulo LIKE ?", [nome]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function addReceita(req, res) {
  try {
    const { titulo, ingredientes, modo_preparo, imagem, origem, categoria } = req.body;
    const [result] = await db.query(
      "INSERT INTO receitas (titulo, ingredientes, modo_preparo, imagem, origem, categoria) VALUES (?, ?, ?, ?, ?, ?)",
      [titulo, JSON.stringify(ingredientes), modo_preparo, imagem, origem, categoria]
    );
    res.status(201).json({ id: result.insertId, message: "Receita adicionada com sucesso!" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
