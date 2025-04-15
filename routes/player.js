import express from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", async (req, res) => {
  try {
    console.log("Dados recebidos:", req.body);
    let { name, displayName, thumbnail, timestamp, owner } = req.body;

    if (!name || !displayName || !thumbnail || !timestamp || !owner) {
      return res
        .status(400)
        .json({ error: "Todos os campos são obrigatórios!" });
    }

    const response = await axios.get(thumbnail);
    const imageUrl = response.data?.data?.[0]?.imageUrl;

    if (!imageUrl) {
      return res
        .status(400)
        .json({
          error: "Não foi possível extrair o imageUrl do thumbnail fornecido.",
        });
    }

    thumbnail = imageUrl;

    const existingPlayer = await prisma.player.findFirst({
      where: {
        OR: [{ name }, { thumbnail }],
      },
    });

    if (existingPlayer) {
      return res
        .status(409)
        .json({ error: "Já existe um jogador com esse nome ou thumbnail!" });
    }

    const newPlayer = await prisma.player.create({
      data: {
        name,
        displayName,
        thumbnail,
        timestamp: new Date(timestamp),
        owner,
      },
    });

    res.json({ message: "Jogador adicionado com sucesso!", player: newPlayer });
  } catch (error) {
    console.error("Erro ao adicionar jogador:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.post("/delete", async (req, res) => {
  try {
    const { name, thumbnail } = req.body;

    if (!name && !thumbnail) {
      return res.status(400).json({
        error:
          "É necessário fornecer o nome ou o thumbnail do jogador para deletá-lo.",
      });
    }

    const whereClause = {};
    if (name) whereClause.name = name;
    if (thumbnail) whereClause.thumbnail = thumbnail;

    const duplicatedPlayers = await prisma.player.findMany({
      where: whereClause,
    });

    if (duplicatedPlayers.length === 0) {
      return res.status(404).json({ error: "Jogador não encontrado." });
    }

    const deletedPlayers = await prisma.player.deleteMany({
      where: whereClause,
    });

    res.json({
      message: `Foram deletados ${deletedPlayers.count} jogador(es) com os dados correspondentes.`,
    });
  } catch (error) {
    console.error("Erro ao deletar jogador:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.get("/get", async (req, res) => {
  try {
    let { owner, id } = req.query;

    if (!owner) {
      return res.status(400).json({ error: "O parâmetro 'owner' é obrigatório!" });
    }

    if (!id) {
      return res.status(400).json({ error: "O parâmetro 'id' é obrigatório!" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { discordRole: true }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    if (user.discordRole === "STANDARD") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    owner = owner.toLowerCase();

    const players = await prisma.player.findMany({
      where: {
        owner: { equals: owner, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        thumbnail: true,
        timestamp: true,
        owner: true,
      },
    });

    const normalizedPlayers = players.map((player) => ({
      ...player,
      name: player.name,
      owner: player.owner.toLowerCase(),
    }));

    res.json(normalizedPlayers);
  } catch (error) {
    console.error("Erro ao buscar jogadores:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default router;
