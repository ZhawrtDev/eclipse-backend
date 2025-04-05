import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.put("/", async (req, res) => {
  const { userId, newname } = req.query;

  if (!userId || !newname) {
    return res.status(400).json({ error: "userId and newname are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }, 
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        robloxUsername: newname,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An error occurred" });
  }
});

export default router;
