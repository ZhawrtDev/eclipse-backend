import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./firebase.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc 
} from "firebase/firestore";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import nameRoutes from "./routes/name.js";
import namePlayer from "./routes/player.js";

const app = express();
dotenv.config();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

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

  let finalImageUrl = imageUrl;

  const thumbApiUrl = `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${id}&size=512x512&format=Png&isCircular=false`;

  try {
    const response = await axios.get(thumbApiUrl);
    console.log("🔍 Resposta da API de thumbnails:", response.data);
    const imageData = response.data?.data?.[0];

    if (imageData?.imageUrl) {
      finalImageUrl = imageData.imageUrl;
    } else {
      console.warn("⚠️ Não foi possível obter imageUrl da API do Roblox, usando fallback.");
      finalImageUrl = thumbApiUrl;
    }
  } catch (error) {
    console.error("❌ Erro ao buscar imagem do Roblox:", error.message);
    finalImageUrl = thumbApiUrl;
  }

  let fixedCreated = created?.match(/^\d{4}-\d{2}-\d{2}/)
    ? created
    : new Date().toISOString();

  try {
    await setDoc(doc(collection(db, "games"), id.toString()), {
      id: String(id),
      name,
      creatorName,
      playing,
      visits,
      maxPlayers,
      updated: new Date(), // <-- Aqui pega o tempo atual sempre
      created: new Date(fixedCreated),
      favoritedCount,
      universeAvatarType,
      imageUrl: finalImageUrl,
      description,
      jobId,
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
    const querySnapshot = await getDocs(collection(db, "games"));
    const games = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        updated: data.updated?.toDate().toISOString(),
        created: data.created?.toDate().toISOString(),
      };
    });

    if (!games || games.length === 0) {
      return res.status(404).json({ message: "Nenhum jogo encontrado" });
    }

    return res.status(200).json(games);
  } catch (error) {
    console.error("❌ Erro ao buscar jogos:", error);
    return res
      .status(500)
      .json({ message: "Erro ao buscar jogos", error: error.message });
  }
});



app.delete("/games/delete", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "ID do jogo não fornecido" });
  }

  try {
    await deleteDoc(doc(db, "games", id.toString()));
    return res.status(200).json({ message: "✅ Jogo deletado com sucesso!" });
  } catch (error) {
    console.error("❌ Erro ao deletar jogo:", error);
    return res
      .status(500)
      .json({ message: "Erro ao deletar jogo", error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
