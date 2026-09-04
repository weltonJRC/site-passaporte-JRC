import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getOrCreateDefaultProgram } from "@/lib/domain/invitations";
import { prisma } from "@/lib/db/prisma";
import { UserRole, EventStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      orderBy: { orderIndex: "asc" },
      include: {
        _count: {
          select: { stamps: { where: { status: "CONFIRMED" } } },
        },
      },
    });

    return NextResponse.json(events, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao listar eventos." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, location, startDate, endDate, stampIcon, stampColor } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: "Nome, data inicial e final são obrigatórios." }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json({ error: "A data final deve ser posterior à data inicial." }, { status: 400 });
    }

    const program = await getOrCreateDefaultProgram();
    const lastEvent = await prisma.event.findFirst({
      where: { programId: program.id },
      orderBy: { orderIndex: "desc" },
    });
    const orderIndex = (lastEvent?.orderIndex ?? 0) + 1;

    const event = await prisma.event.create({
      data: {
        programId: program.id,
        name: name.trim(),
        description: description?.trim() || null,
        location: location?.trim() || null,
        startDate: start,
        endDate: end,
        status: EventStatus.ACTIVE,
        orderIndex,
        stampIcon: stampIcon || "standard",
        stampColor: stampColor || "#cdaa63",
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao criar evento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const body = await req.json();
    const { eventId, status } = body;

    if (!eventId || !status) {
      return NextResponse.json({ error: "ID e novo status do evento são obrigatórios." }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status },
    });

    return NextResponse.json(event, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao atualizar evento.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
