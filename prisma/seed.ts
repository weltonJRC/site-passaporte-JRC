import { PrismaClient, UserRole, UserStatus, ProgramStatus, EventStatus } from "@prisma/client";
import { generateInvitationBatch } from "../src/lib/domain/invitations";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de homologação com dados fictícios...");

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

  // 2. Administrador Fictício
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin.homolog@exemplo-jrc.local";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail.toLowerCase().trim() },
    create: {
      email: adminEmail.toLowerCase().trim(),
      name: "Administrador Homologação",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    update: {},
  });

  // 3. Atendente Fictício
  const attendantEmail = "atendente.homolog@exemplo-jrc.local";
  await prisma.user.upsert({
    where: { email: attendantEmail },
    create: {
      email: attendantEmail,
      name: "Atendente Homologação",
      role: UserRole.ATTENDANT,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
    update: {},
  });

  // 4. Eventos Fictícios
  const now = new Date();
  const event1 = await prisma.event.upsert({
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

  // 5. 30 Convites Fictícios
  const currentInvites = await prisma.invitation.count({
    where: { programId: program.id },
  });

  if (currentInvites === 0) {
    const batch = await generateInvitationBatch({
      count: 30,
      adminUserId: admin.id,
      baseUrl: process.env.APP_URL || "http://localhost:3000",
    });
    console.log(`Gerados ${batch.length} convites para o programa.`);
  }

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
