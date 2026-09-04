import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { getParticipantPassport, getProgramUpcomingEvents } from "@/lib/domain/passport";
import { PassportClient } from "@/components/passport/PassportClient";
import { UserRole } from "@prisma/client";

export default async function PassportPage() {
  const session = await getServerSession();
  if (!session || !session.user) {
    redirect("/login");
  }

  // Redireciona usuários não participantes para seus devidos módulos
  if (session.user.role === UserRole.ADMIN) {
    redirect("/admin");
  } else if (session.user.role === UserRole.ATTENDANT) {
    redirect("/atendimento");
  }

  // IDOR Protection: obtém passaporte estritamente do userId da sessão validada
  const passport = await getParticipantPassport(session.user.id);
  if (!passport) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background text-foreground">
        <div className="max-w-md rounded-2xl border border-danger/30 bg-surface p-8 shadow-xl">
          <h1 className="text-xl font-bold text-danger">Passaporte Não Encontrado</h1>
          <p className="mt-2 text-sm text-muted">
            Sua conta de participante não possui um passaporte ativo vinculado. Entre em contato com a equipe de marketing ou ative seu convite oficial.
          </p>
        </div>
      </main>
    );
  }

  const upcomingEvents = await getProgramUpcomingEvents(passport.programId);

  return (
    <PassportClient
      userName={session.user.name}
      passportNumber={passport.passportNumber}
      programName={passport.program.name}
      stamps={passport.stamps.map((s) => ({
        id: s.id,
        stampedAt: s.stampedAt.toISOString(),
        event: {
          name: s.event.name,
          description: s.event.description,
          stampColor: s.event.stampColor,
        },
      }))}
      upcomingEvents={upcomingEvents.map((e) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        startDate: e.startDate.toISOString(),
        location: e.location,
      }))}
    />
  );
}
