import express from "express";
import cors from "cors";
import receitasRoutes from "./routes/receitasRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/receitas", receitasRoutes);

export default app;
