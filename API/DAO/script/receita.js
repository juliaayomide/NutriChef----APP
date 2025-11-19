import Fuse from "fuse.js";
import { conexao } from "../conexao.js";

// ===============================
// 🍳 BUSCAR TODAS AS RECEITAS (Resumo)
// ===============================
export async function buscarTodasReceitas() {
  const conn = await conexao();
  try {
    const [rows] = await conn.execute(
      "SELECT id_receitas, nome, tempo_preparo, imagem FROM receitas"
    );
    await conn.end();
    return rows;
  } catch (err) {
    console.error("Erro ao buscar todas as receitas:", err);
    await conn.end();
    return [];
  }
}

// ===============================
// 🔎 BUSCAR RECEITAS PELOS TERMOS (vários ingredientes)
// ===============================
// Função para normalizar texto (tira acentos e coloca minúsculo)
function normalize(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Distância de Levenshtein (mede erro de digitação)
function levenshtein(a, b) {
  const matriz = Array.from({ length: a.length + 1 }, () => []);

  for (let i = 0; i <= a.length; i++) matriz[i][0] = i;
  for (let j = 0; j <= b.length; j++) matriz[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1,
        matriz[i][j - 1] + 1,
        matriz[i - 1][j - 1] + custo
      );
    }
  }

  return matriz[a.length][b.length];
}

export async function buscarReceitas(termo = "") {
  const conn = await conexao();

  try {
    const [rows] = await conn.execute(`
      SELECT id_receitas, nome, descricao 
      FROM receitas
    `);

    await conn.end();

    if (!termo.trim()) return rows;

    // Divide termos
    const termos = termo
      .split(",")
      .map((t) => normalize(t.trim()))
      .filter(Boolean);

    const resultados = rows
      .map((receita) => {
        const texto = normalize(`${receita.nome} ${receita.descricao}`);
        const palavras = texto.split(/\s+/);

        let matchCount = 0;

        termos.forEach((t) => {
          let encontrou = false;

          // 1️⃣ Checa se o termo aparece direto
          if (texto.includes(t)) {
            encontrou = true;
          } else {
            // 2️⃣ Se não encontrou, tenta fuzzy
            for (const palavra of palavras) {
              if (levenshtein(t, palavra) <= 2) {
                encontrou = true;
                break;
              }
            }
          }

          if (encontrou) matchCount++;
        });

        return { ...receita, matchCount };
      })
      .filter((r) => r.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount);

    return resultados;

  } catch (err) {
    console.error("Erro ao buscar receitas:", err);
    await conn.end();
    return [];
  }
}


// ===============================
// 📂 BUSCAR RECEITAS POR CATEGORIA
// ===============================
export async function buscarReceitasPorCategoria(nomeCategoria) {
  const sql = `
    SELECT r.* 
    FROM receitas r
    INNER JOIN categorias c ON r.id_categoria = c.id_categorias
    WHERE c.nome = ?
  `;
  const conn = await conexao();
  try {
    const [rows] = await conn.execute(sql, [nomeCategoria]);
    await conn.end();
    return rows;
  } catch (err) {
    console.error("Erro ao buscar receitas por categoria:", err);
    await conn.end();
    return [];
  }
}

// ===============================
// 📌 BUSCAR RECEITA COMPLETA PELO ID + TABELA NUTRICIONAL
// ===============================
export async function buscarReceitaPorId(id) {
  const conn = await conexao();
  try {
    const [receitas] = await conn.execute(
      "SELECT * FROM receitas WHERE id_receitas = ?",
      [id]
    );
    if (receitas.length === 0) return null;

    // ===== INGREDIENTES =====
    const [ingredientesRaw] = await conn.execute(
      `SELECT i.nome, ri.quantidade, ri.unidade 
       FROM receita_ingredientes ri 
       JOIN ingredientes i ON i.id_ingrediente = ri.id_ingrediente 
       WHERE ri.id_receitas = ?`,
      [id]
    );

    const ingredientes = Array.isArray(ingredientesRaw) ? ingredientesRaw : [];

    // ===== UTENSÍLIOS =====
    const [utensiliosRaw] = await conn.execute(
      `SELECT u.nome 
       FROM receita_utensilios ru 
       JOIN utensilios u ON u.id_utensilio = ru.id_utensilio 
       WHERE ru.id_receitas = ?`,
      [id]
    );

    const utensilios = Array.isArray(utensiliosRaw) ? utensiliosRaw : [];

    // ===== PASSOS =====
    const [passosRaw] = await conn.execute(
      "SELECT descricao FROM receita_passos WHERE id_receitas = ? ORDER BY ordem",
      [id]
    );

    const passos = Array.isArray(passosRaw) ? passosRaw : [];

    await conn.end();

    const autor = receitas[0].autor || "NutriChef";

    // ============================
    // 🔹 Referência nutricional média (Guia Alimentar)
    // valores aproximados por 100g
    // ============================
    const tabelaBase = {
      arroz: { kcal: 130, proteina: 2.7, gordura: 0.3, carboidrato: 28 },
      feijao: { kcal: 140, proteina: 9.0, gordura: 0.5, carboidrato: 25 },
      frango: { kcal: 165, proteina: 31, gordura: 3.6, carboidrato: 0 },
      ovo: { kcal: 155, proteina: 13, gordura: 11, carboidrato: 1.1 },
      leite: { kcal: 42, proteina: 3.4, gordura: 1, carboidrato: 5 },
      cenoura: { kcal: 41, proteina: 0.9, gordura: 0.2, carboidrato: 10 },
      farinha: { kcal: 364, proteina: 10, gordura: 1, carboidrato: 76 },
      acucar: { kcal: 387, proteina: 0, gordura: 0, carboidrato: 100 },
      oleo: { kcal: 884, proteina: 0, gordura: 100, carboidrato: 0 },
      manteiga: { kcal: 717, proteina: 0.9, gordura: 81, carboidrato: 0.1 },
      batata: { kcal: 77, proteina: 2, gordura: 0.1, carboidrato: 17 },
      carne: { kcal: 250, proteina: 26, gordura: 15, carboidrato: 0 },
      tomate: { kcal: 18, proteina: 0.9, gordura: 0.2, carboidrato: 3.9 },
      massa: { kcal: 131, proteina: 5, gordura: 1.1, carboidrato: 25 },
    };

    // ============================
    // 🔹 Cálculo nutricional aproximado
    // ============================
    let total = { kcal: 0, proteina: 0, gordura: 0, carboidrato: 0 };

    ingredientes.forEach(i => {
      const nome = i.nome.toLowerCase();
      const ref = Object.keys(tabelaBase).find(k => nome.includes(k));
      const qtd = i.quantidade && !isNaN(i.quantidade) ? parseFloat(i.quantidade) : 100; // default 100g

      if (ref) {
        const fator = qtd / 100; // converte para porção proporcional
        total.kcal += tabelaBase[ref].kcal * fator;
        total.proteina += tabelaBase[ref].proteina * fator;
        total.gordura += tabelaBase[ref].gordura * fator;
        total.carboidrato += tabelaBase[ref].carboidrato * fator;
      }
    });

    // Normaliza por porção (ex: receita serve 4)
    const porcoes = receitas[0].porcoes || 4;
    const tabelaNutricional = {
      porcoes,
      calorias: (total.kcal / porcoes).toFixed(0),
      proteinas: (total.proteina / porcoes).toFixed(1),
      gorduras: (total.gordura / porcoes).toFixed(1),
      carboidratos: (total.carboidrato / porcoes).toFixed(1),
    };

    // ===== AJUSTE FINAL =====
    return {
      ...receitas[0],
      autor,
      ingredientes: ingredientes.map(i => {
        const qtdValida = i.quantidade !== null && i.quantidade !== 0 && !isNaN(i.quantidade);
        const unidadeValida = i.unidade && i.unidade.trim() !== "";
        let texto = "";

        if (qtdValida) {
          const qtd = Number.isInteger(i.quantidade)
            ? i.quantidade
            : parseFloat(i.quantidade).toFixed(2);
          texto += `${qtd}`;
        }

        if (unidadeValida) {
          texto += (texto ? " " : "") + i.unidade.trim();
        }

        texto += (texto ? " " : "") + i.nome.trim();
        return texto.trim();
      }),
      utensilios: utensilios.map(u => u.nome),
      passos: passos.map(p => p.descricao),
      tabelaNutricional
    };
  } catch (err) {
    console.error("Erro ao buscar receita por ID:", err);
    await conn.end();
    return null;
  }
}

// ===============================
// 📋 BUSCAR CATEGORIAS (Formulário)
// ===============================
export async function buscarCategoriasForm() {
  const conn = await conexao();
  try {
    const [rows] = await conn.execute("SELECT id_categorias, nome FROM categorias");
    await conn.end();
    return rows;
  } catch (err) {
    console.error("Erro ao buscar categorias:", err);
    await conn.end();
    return [];
  }
}

// ===============================
// 📋 BUSCAR INGREDIENTES (Formulário)
// ===============================
export async function buscarIngredientesForm() {
  const conn = await conexao();
  try {
    const [rows] = await conn.execute("SELECT id_ingrediente, nome FROM ingredientes");
    await conn.end();
    return rows;
  } catch (err) {
    console.error("Erro ao buscar ingredientes:", err);
    await conn.end();
    return [];
  }
}

// ===============================
// 🍳 INCLUIR RECEITA
// ===============================
export async function incluirReceita(dados) {
  const {
    nome,
    descricao,
    porcoes = 1,
    custo_aproximado = 0,
    dificuldade = 1,
    idCategoria = 1,
    idIngredienteBase = null,
    tempoPreparo = 30,
    imagem = "default.jpg",
  } = dados;

  const conn = await conexao();
  try {
    const sql = `INSERT INTO receitas 
      (nome, descricao, porcoes, custo_aproximado, idDificuldade, id_categoria, id_ingrediente_base, tempo_preparo, imagem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await conn.execute(sql, [
      nome, descricao, porcoes, custo_aproximado, dificuldade,
      idCategoria, idIngredienteBase, tempoPreparo, imagem
    ]);

    await conn.end();
    return result.insertId;
  } catch (err) {
    await conn.end();
    throw new Error(err.sqlMessage || err.message);
  }
}

// Inserir ingredientes
export async function inserirIngredientes(idReceita, ingredientes) {
  const conn = await conexao();
  try {
    const listaIngredientes = Array.isArray(ingredientes) ? ingredientes : [];
    for (const item of listaIngredientes.filter(i => i && i.id_ingrediente)) {
      const quantidadeNum = parseFloat(item.quantidade) || 0;
      await conn.execute(
        `INSERT INTO receita_ingredientes (id_receitas, id_ingrediente, quantidade, unidade) 
         VALUES (?, ?, ?, ?)`,
        [idReceita, item.id_ingrediente, quantidadeNum, item.unidade || null]
      );
    }
    await conn.end();
  } catch (err) {
    await conn.end();
    throw err;
  }
}

// Inserir utensílios
export async function inserirUtensilios(idReceita, utensilios) {
  const conn = await conexao();
  try {
    const listaUtensilios = Array.isArray(utensilios) ? utensilios : [];
    for (const u of listaUtensilios) {
      await conn.execute(
        `INSERT INTO receita_utensilios (id_receitas, id_utensilio) VALUES (?, ?)`,
        [idReceita, u]
      );
    }
    await conn.end();
  } catch (err) {
    await conn.end();
    throw err;
  }
}

// Inserir passos
export async function inserirPassos(idReceita, passos) {
  const conn = await conexao();
  try {
    const listaPassos = Array.isArray(passos) ? passos : [];
    for (let i = 0; i < listaPassos.length; i++) {
      await conn.execute(
        `INSERT INTO receita_passos (id_receitas, descricao, ordem) VALUES (?, ?, ?)`,
        [idReceita, listaPassos[i], i + 1]
      );
    }
    await conn.end();
  } catch (err) {
    await conn.end();
    throw err;
  }
}
