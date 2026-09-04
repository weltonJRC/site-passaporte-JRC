"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InvitationItem {
  id: string;
  status: string;
  claimedName: string | null;
  claimedEmail: string | null;
  usedByName: string | null;
  usedByEmail: string | null;
  usedAt: string | null;
  createdAt: string;
}

export function AdminConvitesClient({
  programCapacity,
  initialInvitations,
}: {
  programCapacity: number;
  initialInvitations: InvitationItem[];
}) {
  const router = useRouter();
  const [invitations] = useState<InvitationItem[]>(initialInvitations);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedTokens, setGeneratedTokens] = useState<Array<{ id: string; inviteLink: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeCount = invitations.filter((i) =>
    ["AVAILABLE", "SENT", "USED"].includes(i.status)
  ).length;

  const handleGenerateBatch = async (count: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar convites.");
      }

      setGeneratedTokens(data);
      setSuccess(`Lote de ${data.length} convite(s) gerado com sucesso!`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao gerar convites.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (invitationId: string) => {
    if (!confirm("Tem certeza que deseja revogar este convite?")) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/invitations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao revogar convite.");
      }

      setSuccess("Convite revogado com sucesso. A vaga pode ser reutilizada.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao revogar.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Convites Oficiais</h1>
          <p className="text-sm text-muted">
            Capacidade: {activeCount} / {programCapacity} convites ocupados ou disponíveis
          </p>
        </div>

        <div className="flex gap-2">
          {activeCount < programCapacity && (
            <button
              onClick={() => handleGenerateBatch(programCapacity - activeCount)}
              disabled={loading}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition disabled:opacity-50"
            >
              Completar 30 Convites ({programCapacity - activeCount} vagas)
            </button>
          )}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary">
          {success}
        </div>
      )}

      {/* Exibição dos Tokens Recém-Gerados com Links Copiáveis */}
      {generatedTokens.length > 0 && (
        <div className="rounded-2xl border border-secondary/40 bg-surface p-5 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-secondary">
            Links Exclusivos Gerados (Copie e envie aos participantes)
          </h3>
          <p className="text-xs text-muted">
            Por segurança, os tokens originais só podem ser exibidos no momento da emissão.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {generatedTokens.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl bg-background p-3 text-xs border border-muted/20"
              >
                <span className="font-mono text-muted/80 truncate max-w-xs sm:max-w-md">
                  #{idx + 1}: {item.inviteLink}
                </span>
                <button
                  onClick={() => copyToClipboard(item.inviteLink, item.id)}
                  className="rounded-lg bg-primary/20 px-3 py-1 font-semibold text-primary hover:bg-primary/30 transition shrink-0 ml-2"
                >
                  {copiedId === item.id ? "Copiado!" : "Copiar Link"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Convites */}
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-surface shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-muted/20 bg-background/50 text-muted uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Status</th>
                <th className="p-4">Destinatário Marcado</th>
                <th className="p-4">Utilizado Por</th>
                <th className="p-4">Data Utilização</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {invitations.map((inv) => {
                const isUsed = inv.status === "USED";
                const isRevoked = inv.status === "REVOKED";

                return (
                  <tr key={inv.id} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          isUsed
                            ? "bg-success/10 text-success border-success/30"
                            : isRevoked
                              ? "bg-danger/10 text-danger border-danger/30"
                              : inv.status === "SENT"
                                ? "bg-secondary/10 text-secondary border-secondary/30"
                                : "bg-primary/10 text-primary border-primary/30"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {inv.claimedName || inv.claimedEmail ? (
                        <div>
                          <p>{inv.claimedName || "—"}</p>
                          <p className="text-[10px] text-muted">{inv.claimedEmail || ""}</p>
                        </div>
                      ) : (
                        <span className="text-muted/40">Não atribuído</span>
                      )}
                    </td>
                    <td className="p-4 text-foreground">
                      {inv.usedByName ? (
                        <div>
                          <p className="font-semibold text-success">{inv.usedByName}</p>
                          <p className="text-[10px] text-muted">{inv.usedByEmail}</p>
                        </div>
                      ) : (
                        <span className="text-muted/40">—</span>
                      )}
                    </td>
                    <td className="p-4 text-muted">
                      {inv.usedAt
                        ? new Date(inv.usedAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="p-4 text-right">
                      {!isUsed && !isRevoked && (
                        <button
                          onClick={() => handleRevoke(inv.id)}
                          disabled={loading}
                          className="rounded-lg border border-danger/30 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/10 transition"
                        >
                          Revogar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
