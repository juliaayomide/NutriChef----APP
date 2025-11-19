import express from "express";
import { getReceitas, getReceitaPorNome, addReceita } from "../controllers/receitasController.js";

const router = express.Router();

router.get("/", getReceitas);
router.get("/:nome", getReceitaPorNome);
router.post("/", addReceita);

export default router;
