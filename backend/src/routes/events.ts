// REST routes for tasks. Path and Prisma model remain "event" for compatibility.
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : "";
  const from = req.query.from ? new Date(String(req.query.from)) : null;
  const to = req.query.to ? new Date(String(req.query.to)) : null;

  const calendarIds = req.query.calendarIds
    ? String(req.query.calendarIds)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  const baseWhere = calendarIds?.length
    ? {
        calendarId: { in: calendarIds },
        calendar: { userId: req.user!.id },
      }
    : {
        calendar: { userId: req.user!.id },
      };

  if (q) {
    const events = await prisma.event.findMany({
      where: {
        ...baseWhere,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { calendar: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      orderBy: { startAt: "asc" },
      include: {
        calendar: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    res.json(
      events.map((e) => ({
        id: e.id,
        calendarId: e.calendarId,
        title: e.title,
        description: e.description,
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
        allDay: e.allDay,
        calendar: e.calendar,
      })),
    );
    return;
  }

  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    res.status(400).json({ error: "from and to ISO dates are required" });
    return;
  }

  const events = await prisma.event.findMany({
    where: {
      ...baseWhere,
      AND: [{ startAt: { lt: to } }, { endAt: { gt: from } }],
    },
    orderBy: { startAt: "asc" },
    include: {
      calendar: {
        select: { id: true, name: true, color: true },
      },
    },
  });

  res.json(
    events.map((e) => ({
      id: e.id,
      calendarId: e.calendarId,
      title: e.title,
      description: e.description,
      startAt: e.startAt.toISOString(),
      endAt: e.endAt.toISOString(),
      allDay: e.allDay,
      calendar: e.calendar,
    })),
  );
});

router.post("/", async (req, res) => {
  const calendarId = String(req.body?.calendarId ?? "");
  const title = String(req.body?.title ?? "").trim();
  const description =
    req.body?.description != null ? String(req.body.description) : undefined;
  const startAt = req.body?.startAt ? new Date(String(req.body.startAt)) : null;
  const endAt = req.body?.endAt ? new Date(String(req.body.endAt)) : null;
  const allDay = Boolean(req.body?.allDay ?? false);

  if (!calendarId || !title || !startAt || !endAt) {
    res.status(400).json({ error: "calendarId, title, startAt, endAt are required" });
    return;
  }
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    res.status(400).json({ error: "Invalid dates" });
    return;
  }

  const owned = await prisma.calendar.findFirst({
    where: { id: calendarId, userId: req.user!.id },
  });
  if (!owned) {
    res.status(404).json({ error: "Calendar not found" });
    return;
  }

  const event = await prisma.event.create({
    data: {
      calendarId,
      title,
      description,
      startAt,
      endAt,
      allDay,
    },
    include: {
      calendar: { select: { id: true, name: true, color: true } },
    },
  });

  res.status(201).json({
    id: event.id,
    calendarId: event.calendarId,
    title: event.title,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    allDay: event.allDay,
    calendar: event.calendar,
  });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.event.findFirst({
    where: { id, calendar: { userId: req.user!.id } },
  });
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const title = req.body?.title != null ? String(req.body.title).trim() : undefined;
  const description =
    req.body?.description !== undefined
      ? req.body.description == null
        ? null
        : String(req.body.description)
      : undefined;
  const startAt = req.body?.startAt != null ? new Date(String(req.body.startAt)) : undefined;
  const endAt = req.body?.endAt != null ? new Date(String(req.body.endAt)) : undefined;
  const allDay = req.body?.allDay != null ? Boolean(req.body.allDay) : undefined;
  const calendarId =
    req.body?.calendarId != null ? String(req.body.calendarId) : undefined;

  if (calendarId) {
    const owned = await prisma.calendar.findFirst({
      where: { id: calendarId, userId: req.user!.id },
    });
    if (!owned) {
      res.status(404).json({ error: "Calendar not found" });
      return;
    }
  }

  if (startAt !== undefined && Number.isNaN(startAt.getTime())) {
    res.status(400).json({ error: "Invalid startAt" });
    return;
  }
  if (endAt !== undefined && Number.isNaN(endAt.getTime())) {
    res.status(400).json({ error: "Invalid endAt" });
    return;
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(title !== undefined && title ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(startAt !== undefined ? { startAt } : {}),
      ...(endAt !== undefined ? { endAt } : {}),
      ...(allDay !== undefined ? { allDay } : {}),
      ...(calendarId ? { calendarId } : {}),
    },
    include: {
      calendar: { select: { id: true, name: true, color: true } },
    },
  });

  res.json({
    id: event.id,
    calendarId: event.calendarId,
    title: event.title,
    description: event.description,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    allDay: event.allDay,
    calendar: event.calendar,
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const existing = await prisma.event.findFirst({
    where: { id, calendar: { userId: req.user!.id } },
  });
  if (!existing) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  await prisma.event.delete({ where: { id } });
  res.status(204).send();
});

export default router;
