import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: "O parâmetro userId é obrigatório." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        discordId: true,
        discordUsername: true,
        avatar: true,
        discordRole: true,
        robloxUsername: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

export default router;