"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string;
  status: string;
  orderIndex: number;
  confirmedCount: number;
}

export function AdminEventosClient({ initialEvents }: { initialEvents: EventItem[] }) {
  const router = useRouter();
  const [events] = useState<EventItem[]>(initialEvents);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          location,
          startDate,
          endDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar evento.");
      }

      setSuccess("Evento criado com sucesso!");
      setIsCreating(false);
      setName("");
      setDescription("");
      setLocation("");
      setStartDate("");
      setEndDate("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao criar evento.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar status do evento.");
      }

      setSuccess(`Status alterado para ${newStatus}.`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programação de Eventos</h1>
          <p className="text-sm text-muted">
            Somente eventos com status ACTIVE aceitam carimbos no leitor de atendimento.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition"
        >
          {isCreating ? "Cancelar" : "+ Novo Evento"}
        </button>
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

      {/* Formulário de Criação */}
      {isCreating && (
        <form
          onSubmit={handleCreateEvent}
          className="rounded-2xl border border-primary/30 bg-surface p-5 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <h2 className="text-sm font-bold text-premium uppercase tracking-wider">
            Cadastrar Novo Evento JRC
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Nome do Evento</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cerimônia de Abertura"
                className="h-10 w-full rounded-xl border border-muted/30 bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Local / Sala</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Auditório Principal JRC"
                className="h-10 w-full rounded-xl border border-muted/30 bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Data / Hora de Início</label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-muted/30 bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Data / Hora de Término</label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-muted/30 bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Detalhes opcionais da sessão ou atividade..."
              className="w-full rounded-xl border border-muted/30 bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Evento"}
          </button>
        </form>
      )}

      {/* Tabela de Eventos */}
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-surface shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-muted/20 bg-background/50 text-muted uppercase text-[10px] font-bold">
              <tr>
                <th className="p-4">Ordem</th>
                <th className="p-4">Evento</th>
                <th className="p-4">Local</th>
                <th className="p-4">Período</th>
                <th className="p-4">Presenças</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Alterar Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-white/5 transition">
                  <td className="p-4 font-mono font-bold text-muted">#{evt.orderIndex}</td>
                  <td className="p-4 font-bold text-foreground">
                    <p>{evt.name}</p>
                    {evt.description && <p className="text-[10px] text-muted font-normal line-clamp-1">{evt.description}</p>}
                  </td>
                  <td className="p-4 text-muted">{evt.location || "—"}</td>
                  <td className="p-4 text-muted text-[11px]">
                    {new Date(evt.startDate).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-success">{evt.confirmedCount}</span> carimbos
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        evt.status === "ACTIVE"
                          ? "bg-success/10 text-success border-success/30"
                          : evt.status === "ENDED"
                            ? "bg-muted/10 text-muted border-muted/30"
                            : evt.status === "CANCELLED"
                              ? "bg-danger/10 text-danger border-danger/30"
                              : "bg-primary/10 text-primary border-primary/30"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <select
                      value={evt.status}
                      disabled={loading}
                      onChange={(e) => handleStatusChange(evt.id, e.target.value)}
                      className="rounded-lg border border-muted/30 bg-background px-2 py-1 text-[11px] text-foreground focus:outline-none"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ENDED">ENDED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
