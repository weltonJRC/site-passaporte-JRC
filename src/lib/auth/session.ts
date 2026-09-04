import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "../db/prisma";
import { UserRole, UserStatus } from "@prisma/client";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
}

export async function getServerSession(): Promise<{ user: CurrentUser } | null> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !session.user) {
    return null;
  }

  // Consulta atualizada do banco para garantir status e papel em tempo real
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      emailVerified: true,
    },
  });

  if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
    return null;
  }

  return { user: dbUser };
}

export async function requireUser(): Promise<CurrentUser> {
  const session = await getServerSession();
  if (!session) {
    throw new Error("Não autenticado ou conta inativa.");
  }
  return session.user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Acesso não autorizado para este perfil.");
  }
  return user;
}

export async function requireParticipant(): Promise<CurrentUser> {
  return requireRole([UserRole.PARTICIPANT]);
}

export async function requireAttendant(): Promise<CurrentUser> {
  return requireRole([UserRole.ATTENDANT, UserRole.ADMIN]);
}

export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole([UserRole.ADMIN]);
}
