import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { generateInvitationBatch, revokeInvitation, markInvitationAsSent } from "@/lib/domain/invitations";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      include: {
        usedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invitations, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erro ao listar convites." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const body = await req.json();
    const count = parseInt(body.count || "1", 10);
    const baseUrl = process.env.APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

    const batch = await generateInvitationBatch({
      count,
      adminUserId: session.user.id,
      baseUrl,
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao gerar convites.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
    }

    const body = await req.json();
    const { invitationId } = body;

    const revoked = await revokeInvitation({
      invitationId,
      adminUserId: session.user.id,
    });

    return NextResponse.json(revoked, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao revogar convite.";
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
    const { invitationId, recipientEmail, recipientName } = body;

    const updated = await markInvitationAsSent({
      invitationId,
      recipientEmail,
      recipientName,
      adminUserId: session.user.id,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao marcar convite como enviado.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
