import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { buildCampaignMessage } from "@/lib/domain/campaign-message";
import { generateSecureToken, hashInvitationToken } from "@/lib/security/crypto";
import { createAuditLog } from "@/lib/domain/audit";

type Result = { id: string; name: string; phone?: string; kind: "LOGIN" | "INVITATION"; status: "PREPARED" | "FAILED" | "SKIPPED"; detail?: string; whatsappUrl?: string };

export async function POST(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }
  let cursor: string | undefined;
  try {
    const body = await req.json();
    cursor = typeof body.cursor === "string" ? body.cursor : undefined;
    if (body.mode !== "PREPARE") throw new Error("Modo inválido.");
  } catch {
    return NextResponse.json({ error: "Selecione a preparação da lista de WhatsApp." }, { status: 400 });
  }

  const program = await prisma.program.findFirst({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  if (!program) return NextResponse.json({ error: "Programa ativo não encontrado." }, { status: 404 });
  const invitations = await prisma.invitation.findMany({
    where: { programId: program.id, status: { in: ["AVAILABLE", "SENT", "USED"] } },
    include: { usedBy: { select: { name: true, phoneE164: true } } },
    orderBy: { id: "asc" },
    take: 51,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const nextCursor = invitations.length > 50 ? invitations[49].id : null;
  const baseUrl = (process.env.APP_URL || req.nextUrl.origin).replace(/\/$/, "");
  const results: Result[] = [];

  for (const invitation of invitations.slice(0, 50)) {
    const kind = invitation.status === "USED" ? "LOGIN" : "INVITATION";
    const name = invitation.usedBy?.name || invitation.claimedName || "participante";
    const phone = invitation.usedBy?.phoneE164 || invitation.recipientPhoneE164;
    if (!phone) {
      results.push({ id: invitation.id, name, kind, status: "SKIPPED", detail: "Sem WhatsApp cadastrado." });
      continue;
    }
    try {
      let url = `${baseUrl}/login`;
      if (kind === "INVITATION") {
        const rawToken = generateSecureToken(32);
        await prisma.invitationDeliveryToken.create({
          data: { invitationId: invitation.id, tokenHash: hashInvitationToken(rawToken) },
        });
        url = `${baseUrl}/convite/${rawToken}`;
      }
      const message = buildCampaignMessage({ kind, name, url });
      const whatsappUrl = phone
        ? `https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, "")}&text=${encodeURIComponent(message.text)}`
        : undefined;
      await createAuditLog({
        actorUserId: session.user.id, actorRole: "ADMIN", action: "CAMPAIGN_WHATSAPP_PREPARED",
        entity: "Invitation", entityId: invitation.id, details: { kind },
      });
      results.push({ id: invitation.id, name, phone, kind, status: "PREPARED", whatsappUrl });
    } catch {
      results.push({ id: invitation.id, name, kind, status: "FAILED", detail: "Falha no preparo ou envio. Os links anteriores permanecem válidos; tente novamente." });
    }
  }
  return NextResponse.json({ results, nextCursor });
}
