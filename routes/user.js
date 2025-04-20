import express from "express";
import { db } from "../firebase.js";
import { doc, getDoc } from "firebase/firestore";

const router = express.Router();

router.get("/", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "O parâmetro userId é obrigatório." });
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const userData = userSnap.data();

    const selectedFields = {
      discordId: userData.discordId,
      discordUsername: userData.discordUsername,
      avatar: userData.avatar,
      discordRole: userData.discordRole,
      robloxUsername: userData.robloxUsername,
    };

    return res.status(200).json(selectedFields);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

export default router;
