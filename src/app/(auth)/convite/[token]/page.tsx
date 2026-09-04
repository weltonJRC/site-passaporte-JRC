"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/invitation/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao solicitar código de ativação.");
      }

      setStep("OTP");
      setSuccess("Código de verificação enviado para o seu e-mail.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao processar convite.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/invitation/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Código inválido ou expirado.");
      }

      setSuccess("Passaporte digital emitido com sucesso! Redirecionando...");
      setTimeout(() => {
        router.push("/passaporte");
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao confirmar código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-surface p-8 shadow-2xl shadow-primary/10">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-2xl font-bold tracking-wider text-premium">
            JRC
          </div>
          <span className="mt-3 inline-block rounded-full bg-premium/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-premium border border-premium/30">
            Convite Exclusivo
          </span>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground text-center">
            Ativação do Passaporte
          </h1>
          <p className="mt-1 text-sm text-muted text-center">
            Programa de Participantes Convidados JRC 2026
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger text-center"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary text-center"
          >
            {success}
          </div>
        )}

        {step === "FORM" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="h-12 w-full rounded-xl border border-muted/30 bg-background px-4 text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Seu E-mail Corporativo ou Pessoal
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.nome@empresa.com.br"
                className="h-12 w-full rounded-xl border border-muted/30 bg-background px-4 text-foreground placeholder:text-muted/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-medium text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Validando..." : "Receber Código de Ativação"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirmOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-1">
                Código de 6 dígitos enviado ao e-mail
              </label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="h-12 w-full text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-muted/30 bg-background px-4 text-foreground placeholder:text-muted/30 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-medium text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "Criando Passaporte..." : "Confirmar e Ativar Passaporte"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
