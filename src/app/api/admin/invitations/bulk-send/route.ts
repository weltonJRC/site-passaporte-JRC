import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getServerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { buildCampaignMessage } from "@/lib/domain/campaign-message";
import { generateSecureToken, hashInvitationToken } from "@/lib/security/crypto";
import { createAuditLog } from "@/lib/domain/audit";

type Result = { id: string; name: string; kind: "LOGIN" | "INVITATION"; status: "SENT" | "PREPARED" | "FAILED" | "SKIPPED"; detail?: string; whatsappUrl?: string };

export async function POST(req: NextRequest) {
  const session = await getServerSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }
  let mode: "EMAIL" | "PREPARE";
  let cursor: string | undefined;
  try {
    const body = await req.json();
    mode = body.mode;
    cursor = typeof body.cursor === "string" ? body.cursor : undefined;
    if (mode !== "EMAIL" && mode !== "PREPARE") throw new Error("Modo inválido.");
  } catch {
    return NextResponse.json({ error: "Selecione envio por e-mail ou preparação de mensagens." }, { status: 400 });
  }

  const smtpReady = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  if (mode === "EMAIL" && !smtpReady) {
    return NextResponse.json({ error: "Configure SMTP no servidor antes do envio em massa por e-mail." }, { status: 503 });
  }
  const transport = mode === "EMAIL" ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  }) : null;
  const program = await prisma.program.findFirst({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
  if (!program) return NextResponse.json({ error: "Programa ativo não encontrado." }, { status: 404 });
  const invitations = await prisma.invitation.findMany({
    where: { programId: program.id, status: { in: ["AVAILABLE", "SENT", "USED"] } },
    include: { usedBy: { select: { name: true, email: true, phoneE164: true } } },
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
    const email = invitation.usedBy?.email || invitation.claimedEmail;
    const phone = invitation.usedBy?.phoneE164 || invitation.recipientPhoneE164;
    if (mode === "EMAIL" && !email) {
      results.push({ id: invitation.id, name, kind, status: "SKIPPED", detail: "Sem e-mail cadastrado." });
      continue;
    }
    if (mode === "PREPARE" && !phone) {
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
      if (mode === "EMAIL") {
        await transport!.sendMail({
          from: process.env.SMTP_FROM || "Passaporte JRC <no-reply@jrc.com.br>",
          to: email!, subject: message.subject, text: message.text, html: message.html,
        });
        if (kind === "INVITATION") {
          await prisma.invitation.update({ where: { id: invitation.id }, data: { status: "SENT", sentAt: new Date() } });
        }
      }
      await createAuditLog({
        actorUserId: session.user.id, actorRole: "ADMIN", action: mode === "EMAIL" ? "CAMPAIGN_EMAIL_SENT" : "CAMPAIGN_WHATSAPP_PREPARED",
        entity: "Invitation", entityId: invitation.id, details: { kind },
      });
      results.push({ id: invitation.id, name, kind, status: mode === "EMAIL" ? "SENT" : "PREPARED", whatsappUrl });
    } catch {
      results.push({ id: invitation.id, name, kind, status: "FAILED", detail: "Falha no preparo ou envio. Os links anteriores permanecem válidos; tente novamente." });
    }
  }
  return NextResponse.json({ results, nextCursor });
}
