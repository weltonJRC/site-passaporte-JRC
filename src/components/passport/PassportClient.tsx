"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrModal } from "@/components/passport/QrModal";
import { authClient } from "@/lib/auth/client";

interface StampData {
  id: string;
  stampedAt: string;
  event: {
    name: string;
    description: string | null;
    stampColor: string;
  };
}

interface EventData {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  location: string | null;
}

interface PassportClientProps {
  userName: string;
  passportNumber: string;
  programName: string;
  stamps: StampData[];
  upcomingEvents: EventData[];
}

export function PassportClient({
  userName,
  passportNumber,
  programName,
  stamps,
  upcomingEvents,
}: PassportClientProps) {
  const router = useRouter();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const totalSlots = Math.max(6, stamps.length + upcomingEvents.length);

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Barra superior de navegação */}
      <header className="border-b border-primary/20 bg-surface/80 px-4 py-3 backdrop-blur sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-sm font-bold text-premium">
            JRC
          </div>
          <span className="text-xs font-semibold tracking-wider text-muted uppercase">
            {programName}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-muted/30 px-3 py-1.5 text-xs text-muted hover:text-foreground transition hover:border-muted/60"
        >
          Sair
        </button>
      </header>

      <main className="mx-auto max-w-lg p-4 space-y-6">
        {/* Cartão Oficial Provisório do Passaporte Digital */}
        <section
          aria-label="Passaporte Digital"
          className="relative overflow-hidden rounded-3xl border border-premium/30 bg-gradient-to-br from-surface via-surface to-[#061421] p-6 shadow-2xl shadow-primary/10"
        >
          {/* Decoração metálica discreta */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-premium/5 blur-2xl" />
          <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-premium uppercase">
                Passaporte Digital Oficial
              </span>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">
                {userName}
              </h1>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-1 text-right">
              <span className="block text-[9px] text-muted uppercase tracking-wider">Identificador</span>
              <span className="font-mono text-xs font-bold text-secondary">{passportNumber}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-muted/10 pt-4">
            <div>
              <span className="text-xs text-muted">Presenças Confirmadas</span>
              <p className="text-2xl font-bold text-success flex items-center gap-1">
                {stamps.length}
                <span className="text-xs font-normal text-muted">/ {totalSlots} eventos</span>
              </p>
            </div>
            <button
              onClick={() => setIsQrOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-95 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
              Exibir QR Code
            </button>
          </div>
        </section>

        {/* Grade Visual de Carimbos */}
        <section aria-labelledby="stamps-heading" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="stamps-heading" className="text-sm font-bold tracking-wider text-muted uppercase">
              Seus Carimbos de Evento
            </h2>
            <span className="text-xs text-muted">{stamps.length} conquistados</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: totalSlots }).map((_, idx) => {
              const stamp = stamps[idx];
              if (stamp) {
                return (
                  <div
                    key={stamp.id}
                    className="flex flex-col items-center justify-center rounded-2xl border border-premium/40 bg-surface p-3 text-center shadow-lg animate-in zoom-in-95 duration-300"
                  >
                    <div className="relative mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-premium/10 border-2 border-premium text-premium">
                      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="line-clamp-1 text-xs font-bold text-foreground">
                      {stamp.event.name}
                    </span>
                    <span className="text-[10px] text-muted">
                      {new Date(stamp.stampedAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-${idx}`}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted/20 bg-surface/30 p-3 text-center"
                >
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-muted/20 text-muted/30">
                    <span className="text-xs font-mono">{idx + 1}</span>
                  </div>
                  <span className="text-[11px] text-muted/50">Disponível</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Próximos Eventos */}
        <section aria-labelledby="upcoming-heading" className="space-y-3">
          <h2 id="upcoming-heading" className="text-sm font-bold tracking-wider text-muted uppercase">
            Próximos Eventos do Programa
          </h2>

          {upcomingEvents.length === 0 ? (
            <div className="rounded-2xl border border-muted/10 bg-surface p-4 text-center text-sm text-muted">
              Nenhum evento futuro agendado no momento.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-center justify-between rounded-2xl border border-primary/20 bg-surface p-4 transition hover:border-primary/40"
                >
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{evt.name}</h3>
                    <p className="text-xs text-muted">
                      {evt.location || "Local corporativo JRC"} •{" "}
                      {new Date(evt.startDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-semibold text-secondary border border-secondary/30">
                    Confirmado
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal de QR Code com 5 minutos de validade */}
      <QrModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />
    </div>
  );
}
