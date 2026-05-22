import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const DEFAULT_CALENDAR_COLOR = "#8ab4f8";

router.post("/register", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const name = String(req.body?.name ?? "").trim();

  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      calendars: {
        create: [
          { name: "technical", color: "#fa903e", isVisibleDefault: false },
          { name: "general", color: DEFAULT_CALENDAR_COLOR, isVisibleDefault: true },
          { name: "trivia", color: "#4285f4", isVisibleDefault: true },
        ],
      },
    },
  });

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "14d" });

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

router.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");

  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "14d" });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

export default router;
