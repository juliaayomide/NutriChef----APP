const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
const fetch = require('node-fetch');
const session = require('express-session');
const { exec } = require("child_process");

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.use(
  "/usuarios",
  express.static(path.join(__dirname, "../API/public/usuarios"))
);

app.use(session({
  secret: 'NutriChefSecretKey', 
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, 
    sameSite: 'lax'
  }
}));

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'nutrichef'
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'DashboardADM.html')));
app.get('/cadastro', (req, res) => res.sendFile(path.join(__dirname, 'cadastro.html')));


app.post("/api/rpa", (req, res) => {
  const termo = req.body.termo;

  if (!termo || termo.trim() === "") {
    return res.status(400).json({ error: "Termo inválido" });
  }

  const scriptPath = path.resolve("../RPA/rpa/buscarReceitas.py");
  console.log("➡ Executando RPA com termo:", termo);

  const { spawn } = require("child_process");
  const processo = spawn("python", [scriptPath, termo], { windowsHide: true });

  let stdoutData = "";
  let stderrData = "";
  let responded = false;

  processo.stdout.on("data", (data) => {
    const texto = data.toString();
    stdoutData += texto;
    console.log("[PYTHON STDOUT]", texto.trim());
  });

  processo.stderr.on("data", (data) => {
    const texto = data.toString();
    stderrData += texto;
    console.log("[PYTHON STDERR]", texto.trim());
  });

  processo.on("error", (err) => {
    console.error("Erro ao iniciar processo Python:", err);
    if (!responded) {
      responded = true;
      return res.status(500).json({ success: false, error: "Falha ao iniciar processo Python" });
    }
  });

  processo.on("close", (code) => {
    console.log("✔ RPA finalizou. exit code:", code);

    const match = stdoutData.match(/TOTAL_SALVAS=(\d+)/);
    let totalReceitas = 0;
    if (match) {
      totalReceitas = Number(match[1]);
    }

    if (!match && code !== 0) {
      console.warn("Python terminou com erro e não retornou TOTAL_SALVAS.");
      if (!responded) {
        responded = true;
        return res.status(500).json({ success: false, error: "RPA finalizou com erro", details: stderrData || stdoutData });
      }
    }

    if (!responded) {
      responded = true;
      return res.json({ success: Boolean(match), totalReceitas });
    }
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { nome, senha } = req.body;
    if (!nome || !senha)
      return res.status(400).json({ error: 'Preencha todos os campos.' });

    const [rows] = await db.query('SELECT * FROM adm WHERE nome = ? AND senha = ?', [nome, senha]);

    if (rows.length > 0) {
      req.session.user = { id: rows[0].id_adm, nome: rows[0].nome, tipo: 'Admin' };
      console.log('✅ Sessão criada:', req.session.user);
      res.json({ success: true, message: 'Login realizado com sucesso!', user: req.session.user });
    } else {
      res.status(401).json({ success: false, error: 'Nome ou senha incorretos.' });
    }
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro ao processar login.' });
  }
});

app.get('/api/usuario-logado', (req, res) => {
  if (req.session?.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ error: 'Não logado' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout realizado com sucesso.' });
  });
});


app.get('/api/usuarios', async (req, res) => {
  try {
    const search = req.query.q ? `%${req.query.q}%` : '%';

    const [rows] = await db.query(`
      SELECT 
        id_usuarios,
        nome,
        email,
        foto,
        status,
        motivo_suspensao,
        DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro
      FROM usuarios
      WHERE nome LIKE ? OR email LIKE ?
      ORDER BY id_usuarios DESC
    `, [search, search]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar usuários:", err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

app.get("/api/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(`
      SELECT 
        id_usuarios,
        nome,
        email,
        foto,
        status,
        motivo_suspensao,
        DATE_FORMAT(data_cadastro, '%d/%m/%Y') AS data_cadastro
      FROM usuarios
      WHERE id_usuarios = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("❌ Erro ao buscar usuário por ID:", err);
    res.status(500).json({ error: "Erro ao buscar usuário." });
  }
});

app.put("/api/usuarios/suspender", async (req, res) => {
  try {
    const { id, motivo } = req.body;

    if (!motivo || motivo.length < 3) {
      return res.status(400).json({ error: "Motivo inválido." });
    }

    await db.query(
      "UPDATE usuarios SET status = 'suspenso', motivo_suspensao = ? WHERE id_usuarios = ?",
      [motivo, id]
    );

    res.json({ success: true, status: "suspenso" });

  } catch (err) {
    console.error("Erro ao suspender usuário:", err);
    res.status(500).json({ error: "Erro ao suspender usuário." });
  }
});

app.put("/api/usuarios/ativar", async (req, res) => {
  try {
    const { id, motivo } = req.body;

    if (!motivo || motivo.length < 3) {
      return res.status(400).json({ error: "Motivo inválido." });
    }

    await db.query(
      "UPDATE usuarios SET status = 'ativo', motivo_suspensao = ? WHERE id_usuarios = ?",
      [motivo, id]
    );

    res.json({ success: true, status: "ativo" });

  } catch (err) {
    console.error("Erro ao ativar usuário:", err);
    res.status(500).json({ error: "Erro ao ativar usuário." });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [receitas] = await db.query('SELECT COUNT(*) AS total FROM receitas');
    const [usuarios] = await db.query('SELECT COUNT(*) AS total FROM usuarios');
    const [comentarios] = await db.query('SELECT COUNT(*) AS total FROM avaliacoes');
    res.json({
      receitas: receitas[0].total,
      usuarios: usuarios[0].total,
      comentarios: comentarios[0].total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

app.get("/api/usuariosPorMes", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        DATE_FORMAT(data_cadastro, '%Y-%m') AS mes,
        COUNT(*) AS total
      FROM usuarios
      GROUP BY mes
      ORDER BY mes;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err });
  }
});

app.get("/api/graficos/ingredientes-populares", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.nome AS ingrediente, COUNT(*) AS total
      FROM receita_ingredientes ri
      JOIN ingredientes i ON i.id_ingrediente = ri.id_ingrediente
      GROUP BY i.nome
      ORDER BY total DESC;
    `);

    if (rows.length <= 10) return res.json(rows);

    const top10 = rows.slice(0, 10);
    const outrosTotal = rows.slice(10).reduce((acc, item) => acc + item.total, 0);

    return res.json([
      ...top10,

    ]);

  } catch (err) {
    console.error("Erro ao obter ingredientes populares:", err);
    res.status(500).json({ erro: err.message });
  }
});

app.get("/api/ingredientesMaisUsados", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT i.nome AS nomeIngrediente, COUNT(*) AS total
      FROM receita_ingredientes ri
      JOIN ingredientes i ON i.id_ingrediente = ri.id_ingrediente
      GROUP BY i.nome
      ORDER BY total DESC;
    `);

    if (rows.length <= 10) return res.json(rows);

    const top10 = rows.slice(0, 10);
    const outrosTotal = rows.slice(10).reduce((acc, item) => acc + item.total, 0);

    return res.json([
      ...top10,
      { nomeIngrediente: "Outros", total: outrosTotal }
    ]);

  } catch (err) {
    console.error("❌ Erro ao obter ingredientes mais usados:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/graficos/receitas-por-categoria", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        c.nome AS categoria,
        COUNT(r.id_receitas) AS total,
        ROUND((COUNT(r.id_receitas) / (SELECT COUNT(*) FROM receitas) * 100), 2) AS porcentagem
      FROM categorias c
      LEFT JOIN receitas r ON r.id_categoria = c.id_categorias
      GROUP BY c.id_categorias
      ORDER BY total DESC;
    `);

    res.json(rows);

  } catch (err) {
    console.error("Erro ao obter receitas por categoria:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/graficos/receitas-mais-acessadas", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
          r.nome AS receita,
          COUNT(a.id_acesso) AS acessos
      FROM receitas r
      LEFT JOIN acessos a ON a.id_receitas = r.id_receitas
      GROUP BY r.id_receitas
      ORDER BY acessos DESC
      LIMIT 10;
    `);

    res.json(rows);

  } catch (err) {
    console.error("❌ Erro ao obter receitas mais acessadas:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/adm/cadastro', async (req, res) => {
  try {
    const { nome, senha } = req.body;
    if (!nome || !senha) return res.status(400).json({ error: 'Nome e senha são obrigatórios.' });

    const conn = await db.getConnection();
    try {
      await conn.query('CALL spInsere_Adm(?, ?)', [nome, senha]);
      res.json({ message: 'Administrador cadastrado com sucesso!' });
    } catch (err) {
      if (err.sqlState === '45000') {
        res.status(400).json({ error: err.sqlMessage });
      } else {
        throw err;
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar administrador.' });
  }
});

app.get('/api/adm', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM adm');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar administradores' });
  }
});

app.put('/api/adm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, senha } = req.body;
    if (!nome || !senha) return res.status(400).json({ error: 'Nome e senha são obrigatórios.' });

    const [result] = await db.query('UPDATE adm SET nome = ?, senha = ? WHERE id_adm = ?', [nome, senha, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Administrador não encontrado.' });

    res.json({ message: 'Administrador atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar administrador' });
  }
});

app.delete('/api/adm/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM adm WHERE id_adm = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Administrador não encontrado.' });

    res.json({ message: 'Administrador excluído com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir administrador' });
  }
});

app.get('/api/receitas', async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q}%` : '%';

    const [rows] = await db.query(`
      SELECT 
        r.id_receitas AS id,
        r.nome,
        r.descricao,
        r.porcoes,
        r.custo_aproximado,
        d.nome AS dificuldade,
        c.nome AS categoria,
        i.nome AS ingrediente_base,
        r.tempo_preparo,
        r.imagem
      FROM receitas r
      LEFT JOIN categorias c ON r.id_categoria = c.id_categorias
      LEFT JOIN ingredientes i ON r.id_ingrediente_base = i.id_ingrediente
      LEFT JOIN dificuldade d ON r.idDificuldade = d.idDificuldade
      WHERE r.nome LIKE ?
      ORDER BY r.id_receitas DESC
    `, [q]);

    res.json(rows);
  } catch (err) {
    console.error('❌ Erro ao buscar receitas:', err);
    res.status(500).json({ error: 'Erro ao buscar receitas' });
  }
});

app.delete('/api/receitas/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const conn = await db.getConnection();
    await conn.beginTransaction();

    try {
      const tabelasDependentes = ['avaliacoes', 'receita_ingredientes', 'receita_passos', 'receita_utensilios'];
      for (const tabela of tabelasDependentes) {
        await conn.query(`DELETE FROM ${tabela} WHERE id_receitas = ?`, [id]);
      }

      const [result] = await conn.query('DELETE FROM receitas WHERE id_receitas = ?', [id]);
      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Receita não encontrada' });
      }

      await conn.commit();
      res.json({ message: 'Receita excluída com sucesso!' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('❌ Erro ao excluir receita:', err);
    res.status(500).json({ error: 'Erro ao excluir receita' });
  }
});

app.post("/api/atualizar-receita", async (req, res) => {
    try {
        const {
            id_receitas,
            nome,
            descricao,
            porcoes,
            custo_aproximado,
            idDificuldade,
            id_categoria,
            id_ingrediente_base,
            tempo_preparo
        } = req.body;

        console.log("BODY RECEBIDO:", req.body);

        if (!id_receitas) {
            return res.status(400).json({ error: "ID da receita é obrigatório." });
        }

        const safeValues = [
            nome ?? null,
            descricao ?? null,
            porcoes ?? null,
            custo_aproximado ?? null,
            idDificuldade ?? null,
            id_categoria ?? null,
            id_ingrediente_base ?? null,
            tempo_preparo ?? null,
            id_receitas
        ];

        const sql = `
            UPDATE receitas
            SET
                nome = ?,
                descricao = ?,
                porcoes = ?,
                custo_aproximado = ?,
                idDificuldade = ?,
                id_categoria = ?,
                id_ingrediente_base = ?,
                tempo_preparo = ?
            WHERE id_receitas = ?
        `;

        await db.execute(sql, safeValues);

        res.json({ success: true, message: "Receita atualizada com sucesso!" });

    } catch (error) {
        console.error("Erro ao atualizar receita:", error);
        res.status(500).json({ error: "Erro interno ao atualizar receita." });
    }
});

app.get('/api/denuncias', async (req, res) => {
  try {
    const q = req.query.q ? `%${req.query.q}%` : '%';
    const [rows] = await db.query(`
      SELECT 
        a.id_avaliacoes AS id,
        u.nome AS usuario,
        u.email,
        r.nome AS receita,
        a.nota,
        a.comentario AS motivo,
        DATE_FORMAT(a.data, '%d/%m/%Y') AS data,
        IFNULL(a.status, 'Pendente') AS status
      FROM avaliacoes a
      JOIN usuarios u ON u.id_usuarios = a.id_usuarios
      JOIN receitas r ON r.id_receitas = a.id_receitas
      WHERE u.nome LIKE ? OR r.nome LIKE ? OR a.comentario LIKE ?
      ORDER BY a.id_avaliacoes DESC
    `, [q, q, q]);
    res.json(rows);
  } catch (err) {
    console.error('❌ Erro ao buscar denúncias:', err);
    res.status(500).json({ error: 'Erro ao buscar denúncias' });
  }
});

app.put('/api/denuncias/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await db.query('UPDATE avaliacoes SET status = ? WHERE id_avaliacoes = ?', [status, id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Denúncia não encontrada.' });

    res.json({ message: 'Status atualizado com sucesso!' });
  } catch (err) {
    console.error('❌ Erro ao atualizar status:', err);
    res.status(500).json({ error: 'Erro ao atualizar status da denúncia.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
