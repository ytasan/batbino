import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const list = await prisma.calendar.findMany({
    where: { userId: req.user!.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      color: true,
      isVisibleDefault: true,
    },
  });
  res.json(list);
});

router.post("/", async (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const color = String(req.body?.color ?? "#8ab4f8").trim();
  const isVisibleDefault = Boolean(req.body?.isVisibleDefault ?? true);

  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const cal = await prisma.calendar.create({
    data: {
      userId: req.user!.id,
      name,
      color,
      isVisibleDefault,
    },
    select: {
      id: true,
      name: true,
      color: true,
      isVisibleDefault: true,
    },
  });
  res.status(201).json(cal);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;

  const owned = await prisma.calendar.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!owned) {
    res.status(404).json({ error: "Calendar not found" });
    return;
  }

  const name = req.body?.name != null ? String(req.body.name).trim() : undefined;
  const color = req.body?.color != null ? String(req.body.color).trim() : undefined;
  const isVisibleDefault =
    req.body?.isVisibleDefault != null ? Boolean(req.body.isVisibleDefault) : undefined;

  const cal = await prisma.calendar.update({
    where: { id },
    data: {
      ...(name !== undefined && name ? { name } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(isVisibleDefault !== undefined ? { isVisibleDefault } : {}),
    },
    select: {
      id: true,
      name: true,
      color: true,
      isVisibleDefault: true,
    },
  });
  res.json(cal);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const owned = await prisma.calendar.findFirst({
    where: { id, userId: req.user!.id },
  });
  if (!owned) {
    res.status(404).json({ error: "Calendar not found" });
    return;
  }

  await prisma.calendar.delete({ where: { id } });
  res.status(204).send();
});

export default router;
