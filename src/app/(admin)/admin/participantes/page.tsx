import { prisma } from "@/lib/db/prisma";
import { getOrCreateDefaultProgram } from "@/lib/domain/invitations";

export default async function AdminParticipantesPage() {
  const program = await getOrCreateDefaultProgram();

  const passports = await prisma.passport.findMany({
    where: { programId: program.id },
    include: {
      user: true,
      _count: {
        select: {
          stamps: { where: { status: "CONFIRMED" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Participantes Ativados</h1>
        <p className="text-sm text-muted">
          Lista dos participantes que ativaram seus convites oficiais e possuem passaporte emitido.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-surface shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-muted/20 bg-background/50 text-muted uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Participante</th>
                <th className="p-4">E-mail</th>
                <th className="p-4">Número Passaporte</th>
                <th className="p-4">Presenças Confirmadas</th>
                <th className="p-4">Data Ativação</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {passports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted">
                    Nenhum participante ativou convite até o momento.
                  </td>
                </tr>
              ) : (
                passports.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition">
                    <td className="p-4 font-bold text-foreground">{p.user.name}</td>
                    <td className="p-4 text-muted">{p.user.email}</td>
                    <td className="p-4 font-mono font-bold text-secondary">{p.passportNumber}</td>
                    <td className="p-4 font-bold text-success">{p._count.stamps} eventos</td>
                    <td className="p-4 text-muted">
                      {new Date(p.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <span className="inline-block rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success border border-success/30">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
