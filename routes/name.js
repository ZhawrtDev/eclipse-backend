import express from "express";
import { db } from "../firebase.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const router = express.Router();

router.put("/", async (req, res) => {
  const { userId, newname } = req.query;

  if (!userId || !newname) {
    return res.status(400).json({ error: "userId and newname are required" });
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    await updateDoc(userRef, { robloxUsername: newname });

    const updatedUserSnap = await getDoc(userRef);
    return res.status(200).json({ id: userId, ...updatedUserSnap.data() });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

export default router;
