"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      // Proteção contra enumeração de contas: sempre mostra mensagem genérica
      await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "sign-in",
      });

      setStep("OTP");
      setMessage("Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos em sua caixa de entrada.");
    } catch {
      setStep("OTP");
      setMessage("Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos em sua caixa de entrada.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.emailOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      if (res.error) {
        setError(res.error.message || "Código inválido ou expirado.");
        return;
      }

      // Redirecionamento dinâmico baseado no perfil do usuário
      const session = await authClient.getSession();
      const role = (session?.data?.user as { role?: string })?.role;

      if (role === "ADMIN") {
        router.push("/admin");
      } else if (role === "ATTENDANT") {
        router.push("/atendimento");
      } else {
        router.push("/passaporte");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao validar código.");
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
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Acesso ao Passaporte
          </h1>
          <p className="mt-1 text-sm text-muted text-center">
            {step === "EMAIL"
              ? "Informe seu e-mail para receber o código de uso único."
              : `Código enviado para ${email}`}
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

        {message && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-secondary/30 bg-secondary/10 p-3 text-sm text-secondary text-center"
          >
            {message}
          </div>
        )}

        {step === "EMAIL" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                E-mail cadastrado
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
              {loading ? "Enviando código..." : "Receber Código OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-foreground mb-1">
                Código de 6 dígitos
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
              {loading ? "Validando..." : "Entrar no Passaporte"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("EMAIL");
                setOtp("");
                setError(null);
                setMessage(null);
              }}
              className="w-full text-center text-xs text-muted hover:text-foreground transition pt-2"
            >
              Informar outro e-mail
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
