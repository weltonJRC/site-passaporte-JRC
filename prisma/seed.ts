import { UserRole, UserStatus, ProgramStatus, EventStatus, InvitationStatus } from "@prisma/client";
import { prisma } from "../src/lib/db/prisma";
import { hashInvitationToken } from "../src/lib/security/crypto";

async function main() {
  console.log("Iniciando seed de homologação com dados para teste...");

  // 1. Programa JRC 2026
  const program = await prisma.program.upsert({
    where: { slug: "passaporte-jrc-2026" },
    create: {
      name: "Passaporte JRC 2026",
      slug: "passaporte-jrc-2026",
      capacity: 30,
      status: ProgramStatus.ACTIVE,
    },
    update: {},
  });

  // 2. Administradores Fictícios para Teste
  const admins = [
    { email: "admin@jrc.com.br", name: "Administrador JRC" },
    { email: "admin.homolog@exemplo-jrc.local", name: "Administrador Homologação" },
  ];

  for (const adm of admins) {
    await prisma.user.upsert({
      where: { email: adm.email },
      create: {
        email: adm.email,
        name: adm.name,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
      update: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
  }

  // 3. Atendentes Fictícios para Teste
  const attendants = [
    { email: "atendente@jrc.com.br", name: "Atendente Recepção JRC" },
    { email: "atendente.homolog@exemplo-jrc.local", name: "Atendente Homologação" },
  ];

  for (const att of attendants) {
    await prisma.user.upsert({
      where: { email: att.email },
      create: {
        email: att.email,
        name: att.name,
        role: UserRole.ATTENDANT,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
      update: {
        role: UserRole.ATTENDANT,
        status: UserStatus.ACTIVE,
      },
    });
  }

  // 4. Eventos Fictícios
  const now = new Date();
  await prisma.event.upsert({
    where: { id: "event-abertura-2026" },
    create: {
      id: "event-abertura-2026",
      programId: program.id,
      name: "Abertura Oficial JRC 2026",
      description: "Cerimônia de abertura e boas-vindas aos participantes",
      location: "Auditório Principal JRC",
      startDate: new Date(now.getTime() - 2 * 3600000),
      endDate: new Date(now.getTime() + 24 * 3600000),
      status: EventStatus.ACTIVE,
      orderIndex: 1,
      stampIcon: "standard",
      stampColor: "#cdaa63",
    },
    update: {},
  });

  await prisma.event.upsert({
    where: { id: "event-workshop-tech" },
    create: {
      id: "event-workshop-tech",
      programId: program.id,
      name: "Workshop de Tecnologia e Inovação",
      description: "Apresentação dos projetos estratégicos de IA e automação",
      location: "Sala de Treinamento 1",
      startDate: new Date(now.getTime() + 48 * 3600000),
      endDate: new Date(now.getTime() + 54 * 3600000),
      status: EventStatus.ACTIVE,
      orderIndex: 2,
      stampIcon: "standard",
      stampColor: "#19b8c4",
    },
    update: {},
  });

  await prisma.event.upsert({
    where: { id: "event-encerramento-2026" },
    create: {
      id: "event-encerramento-2026",
      programId: program.id,
      name: "Painel de Encerramento e Premiação",
      description: "Conclusão das atividades, contagem de carimbos e premiação",
      location: "Espaço Lounge VIP",
      startDate: new Date(now.getTime() + 72 * 3600000),
      endDate: new Date(now.getTime() + 78 * 3600000),
      status: EventStatus.ACTIVE,
      orderIndex: 3,
      stampIcon: "standard",
      stampColor: "#e5a93b",
    },
    update: {},
  });

  // 5. 30 Convites com Tokens Previsíveis para Homologação e Testes
  console.log("Semeando os 30 convites de participantes...");
  for (let i = 1; i <= 30; i++) {
    const num = i.toString().padStart(2, "0");
    const token = `convite-participante-${num}`;
    const tokenHash = hashInvitationToken(token);

    await prisma.invitation.upsert({
      where: { id: `invitation-participante-${num}` },
      create: {
        id: `invitation-participante-${num}`,
        programId: program.id,
        tokenHash,
        status: InvitationStatus.AVAILABLE,
      },
      update: {
        tokenHash,
        status: InvitationStatus.AVAILABLE,
      },
    });
  }

  console.log("\n========================================================");
  console.log("✅ Seed concluído com sucesso!");
  console.log("========================================================");
  console.log("🛡️ ADMIN: admin@jrc.com.br (Login em /login)");
  console.log("📱 ATENDENTE: atendente@jrc.com.br (Login em /login)");
  console.log("🎟️ CONVITE 01: http://localhost:3000/convite/convite-participante-01");
  console.log("🎟️ CONVITE 02: http://localhost:3000/convite/convite-participante-02");
  console.log("... até convite-participante-30");
  console.log("========================================================\n");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
