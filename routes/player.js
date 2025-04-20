import express from "express";
import { db } from "../firebase.js";
import { collection, doc, getDoc, getDocs, query, where, addDoc, deleteDoc } from "firebase/firestore";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("Dados recebidos:", req.body);
    let { name, displayName, thumbnail, timestamp, owner } = req.body;

    if (!name || !displayName || !thumbnail || !timestamp || !owner) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios!" });
    }

    const response = await axios.get(thumbnail);
    const imageUrl = response.data?.data?.[0]?.imageUrl;

    if (!imageUrl) {
      return res.status(400).json({ error: "Não foi possível extrair o imageUrl do thumbnail fornecido." });
    }

    thumbnail = imageUrl;

    const playersRef = collection(db, "players");
    const checkQuery = query(playersRef, where("name", "==", name));
    const checkQuery2 = query(playersRef, where("thumbnail", "==", thumbnail));

    const snapshot1 = await getDocs(checkQuery);
    const snapshot2 = await getDocs(checkQuery2);

    if (!snapshot1.empty || !snapshot2.empty) {
      return res.status(409).json({ error: "Já existe um jogador com esse nome ou thumbnail!" });
    }

    const newPlayer = {
      name,
      displayName,
      thumbnail,
      timestamp: new Date(timestamp),
      owner,
    };

    const addedPlayerRef = await addDoc(playersRef, newPlayer);

    res.json({ message: "Jogador adicionado com sucesso!", player: { id: addedPlayerRef.id, ...newPlayer } });
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
        error: "É necessário fornecer o nome ou o thumbnail do jogador para deletá-lo.",
      });
    }

    const playersRef = collection(db, "players");
    const conditions = [];

    if (name) conditions.push(where("name", "==", name));
    if (thumbnail) conditions.push(where("thumbnail", "==", thumbnail));

    const deleteQuery = query(playersRef, ...conditions);
    const snapshot = await getDocs(deleteQuery);

    if (snapshot.empty) {
      return res.status(404).json({ error: "Jogador não encontrado." });
    }

    let count = 0;
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, "players", docSnap.id));
      count++;
    }

    res.json({ message: `Foram deletados ${count} jogador(es) com os dados correspondentes.` });
  } catch (error) {
    console.error("Erro ao deletar jogador:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

router.get("/get", async (req, res) => {
  try {
    const { owner, id } = req.query;

    if (!owner || !id) {
      return res.status(400).json({ error: "Parâmetros 'owner' e 'id' são obrigatórios!" });
    }

    const userRef = doc(db, "users", id);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const userData = userSnap.data();

    if (userData.discordRole === "STANDARD") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const ownerLower = owner.toLowerCase();

    const playersQuery = query(
      collection(db, "players"),
      where("owner", "==", ownerLower)
    );

    const playersSnap = await getDocs(playersQuery);

    const players = playersSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    res.json(players);
  } catch (error) {
    console.error("Erro ao buscar jogadores:", error);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

export default router;
