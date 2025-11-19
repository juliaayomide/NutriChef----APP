// =============================
// 📦 IMPORTS PRINCIPAIS
// =============================
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import path from "path";
import PagesRouter from "./routers/pagesRouter.js"; 
import favoritosRoutes from "./routers/favoritosRoutes.js"; 
import { buscarTodasReceitas } from "./DAO/script/receita.js";

// =============================
// ⚙️ CONFIGURAÇÕES INICIAIS
// =============================
dotenv.config();
const PORT = process.env.PORTA || 3001;
const app = express();

// =============================
// 🧱 MIDDLEWARES
// =============================
app.use(cors({
  origin: ["http://localhost:8081", "http://localhost:3000"], 
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve a pasta de fotos
app.use("/usuarios", express.static(path.join(process.cwd(), "public/usuarios")));
app.use("/receitas", express.static(path.join(process.cwd(), "public/receitas")));

// =============================
// 🔐 SESSÃO
// =============================
app.use(
  session({
    secret: "nutrichef_super_seguro",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// =============================
// 🏠 ROTA HOME (JSON)
// =============================
app.get("/", async (req, res) => {
  try {
    const receitas = await buscarTodasReceitas();
    res.json(receitas);
  } catch (err) {
    console.error("❌ Erro ao carregar receitas:", err);
    res.status(500).json({ error: "Erro ao carregar receitas" });
  }
});

// =============================
// 📄 ROTAS DE FAVORITOS
// =============================
app.use("/favoritos", favoritosRoutes); 


// =============================
// 📄 ROTAS DE API GERAIS
// =============================
app.use("/", PagesRouter);

// =============================
// 🚀 INICIALIZAÇÃO DO SERVIDOR
// =============================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
});
