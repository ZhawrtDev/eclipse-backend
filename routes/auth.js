import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();
const router = express.Router();

const {
  DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_URI,
  DISCORD_GUILD_ID,
  DISCORD_ROLE_IDS,
  DISCORD_BOT_TOKEN,
  JWT_SECRET,
} = process.env;

const ALLOWED_ROLES = DISCORD_ROLE_IDS.split(",");

router.get("/discord", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Código não fornecido!" });

  try {
    const tokenResponse = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { id, global_name, email, avatar } = userResponse.data;
    const avatarUrl = avatar
    ? `https://cdn.discordapp.com/avatars/${id}/${avatar}${avatar.startsWith("a_")
      ? ".gif"
      : avatar.endsWith(".webp")
      ? ".webp"
      : ".png"}?size=512`
    : `https://cdn.discordapp.com/embed/avatars/${id % 5}.png`;
  

    try {
      const guildMembersResponse = await axios.get(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members?limit=1000`,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
      );

      const isMember = guildMembersResponse.data.some((member) => member.user.id === id);
      if (!isMember) {
        return res.redirect("http://localhost:5173/error?msg=not_in_guild");
      }
    } catch (error) {
      console.error("Erro ao verificar membros da guilda:", error);
      return res.redirect("http://localhost:5173/error?msg=guild_check_failed");
    }

    let userRoles = [];
    try {
      const guildMemberResponse = await axios.get(
        `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/members/${id}`,
        { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
      );

      const roles = guildMemberResponse.data.roles || [];
      userRoles = roles.filter((role) => ALLOWED_ROLES.includes(role));

      if (userRoles.length === 0) {
        return res.redirect("http://localhost:5173/error?msg=no_role_permission");
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.redirect("http://localhost:5173/error?msg=not_in_guild");
      }
      console.error("Erro ao buscar cargos do usuário:", error);
      return res.redirect("http://localhost:5173/error?msg=role_fetch_failed");
    }

    const roleDetailsResponse = await axios.get(
      `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/roles`,
      { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
    );

    const roleMap = roleDetailsResponse.data.reduce((acc, role) => {
      acc[role.id] = role;
      return acc;
    }, {});

    const highestRole = userRoles
      .map((roleId) => roleMap[roleId])
      .sort((a, b) => b.position - a.position)[0]?.name;

    let user = await prisma.user.findUnique({ where: { discordId: id } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId: id,
          discordUsername: global_name,
          email,
          avatar: avatarUrl,
          discordRole: highestRole,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { discordId: id },
        data: {
          discordUsername: global_name,
          email,
          avatar: avatarUrl,
          discordRole: highestRole,
        },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.redirect(
      `http://localhost:5173/auth/?token=${token}&userId=${user.id}&discordId=${id}`
    );
  } catch (error) {
    res.redirect("http://localhost:5173/error");
    console.error("Erro ao autenticar com Discord:", error);
    res.status(500).json({ error: "Erro ao autenticar" });
  }
});

export default router;
