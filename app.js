import express from "express";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import nameRoutes from "./routes/name.js";
import namePlayer from "./routes/player.js";

const app = express();
dotenv.config();
app.use(express.json());

const prisma = new PrismaClient();

app.use("/auth", authRoutes);

app.use("/user", userRoutes);

app.use("/name", nameRoutes);

app.use("/player", namePlayer);


app.post("/save-game", async (req, res) => {
  const data = req.body;
  console.log("📥 Dados recebidos:", data);

  const {
    id,
    name,
    creatorName,
    playing,
    visits,
    maxPlayers,
    updated,
    created,
    favoritedCount,
    universeAvatarType,
    imageUrl,
    description,
    jobId,
  } = data;

  if (!id || !name || !creatorName) {
    return res.status(400).json({ message: "Campos obrigatórios ausentes" });
  }

  const allowedAvatarTypes = ["MorphToR15", "MorphToR6", "PlayerChoice"];
  if (!allowedAvatarTypes.includes(universeAvatarType)) {
    return res.status(400).json({ message: "Tipo de avatar inválido" });
  }

  let fixedImageUrl = imageUrl;
  if (!imageUrl.includes("placeIds=")) {
    fixedImageUrl = `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${id}&size=512x512&format=Png&isCircular=false`;
  }

  let finalImageUrl = fixedImageUrl;
  try {
    const imageResponse = await axios.get(fixedImageUrl);
    if (imageResponse.data?.data?.[0]?.imageUrl) {
      finalImageUrl = imageResponse.data.data[0].imageUrl;
    }
  } catch (err) {
    console.error("❌ Erro ao buscar a imagem:", err);
  }

  let fixedUpdated = updated?.match(/^\d{4}-\d{2}-\d{2}/)
    ? updated
    : new Date().toISOString();
  let fixedCreated = created?.match(/^\d{4}-\d{2}-\d{2}/)
    ? created
    : new Date().toISOString();

  try {
    await prisma.game.upsert({
      where: { id: String(id) },
      update: {
        name,
        creatorName,
        playing,
        visits,
        maxPlayers,
        updated: new Date(fixedUpdated),
        created: new Date(fixedCreated),
        favoritedCount,
        universeAvatarType,
        imageUrl: finalImageUrl,
        description,
        jobId,
      },
      create: {
        id: String(id),
        name,
        creatorName,
        playing,
        visits,
        maxPlayers,
        updated: new Date(fixedUpdated),
        created: new Date(fixedCreated),
        favoritedCount,
        universeAvatarType,
        imageUrl: finalImageUrl,
        description,
        jobId,
      },
    });

    return res.status(200).json({ message: "✅ Dados salvos com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao salvar no banco de dados:", error);
    return res
      .status(500)
      .json({ message: "Erro ao salvar no banco", error: error.message });
  }
});

app.get("/games", async (req, res) => {
  try {
    const games = await prisma.game.findMany();

    if (!games || games.length === 0) {
      return res.status(404).json({ message: "Nenhum jogo encontrado" });
    }

    return res.status(200).json(games);
  } catch (error) {
    console.error("❌ Erro ao buscar jogos no banco de dados:", error);
    return res
      .status(500)
      .json({ message: "Erro ao buscar jogos", error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
