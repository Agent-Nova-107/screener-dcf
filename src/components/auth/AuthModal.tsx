"use client";

import { useState } from "react";
import { X, Mail, Lock, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  onSignUp: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
}

export function AuthModal({ open, onClose, onSignIn, onSignUp }: Props) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const action = mode === "signin" ? onSignIn : onSignUp;
    const { error: err } = await action(email, password);

    if (err) {
      setError(err.message);
    } else if (mode === "signup") {
      setSuccess("Compte créé. Vérifiez votre email pour confirmer.");
    } else {
      onClose();
    }
    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="card p-6 w-full max-w-sm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {mode === "signin" ? "Se connecter" : "Créer un compte"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg pl-10 pr-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg pl-10 pr-3 py-2 text-sm outline-none"
                style={{
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs rounded-lg p-2" style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)" }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs rounded-lg p-2" style={{ background: "rgba(16,185,129,0.1)", color: "var(--emerald)" }}>
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            ) : mode === "signin" ? (
              "Se connecter"
            ) : (
              "Créer le compte"
            )}
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          {mode === "signin" ? (
            <>
              Pas de compte ?{" "}
              <button
                onClick={() => { setMode("signup"); setError(null); setSuccess(null); }}
                className="underline cursor-pointer"
                style={{ color: "var(--accent)" }}
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <button
                onClick={() => { setMode("signin"); setError(null); setSuccess(null); }}
                className="underline cursor-pointer"
                style={{ color: "var(--accent)" }}
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
