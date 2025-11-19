import mongoose from "mongoose";

const receitaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  ingredientes: [String],
  modo_preparo: String,
  imagem: String,
  origem: String,
  categoria: String,
  data_coleta: { type: Date, default: Date.now }
});

export const Receita = mongoose.model("Receita", receitaSchema);
