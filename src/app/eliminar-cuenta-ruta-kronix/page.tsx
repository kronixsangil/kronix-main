"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://kronix-api-production.up.railway.app";

export default function DeleteRutaKronixAccountPage() {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Ingresa el celular asociado a Ruta KroniX.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/auth/ruta-kronix/account-deletion-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-ct-app": "ruta-kronix" },
        body: JSON.stringify({ phone: digits }),
      });
      if (!response.ok) throw new Error("No pudimos registrar la solicitud.");
      setSent(true);
    } catch {
      setError("No pudimos enviar la solicitud. También puedes escribir a soporte@kronix.co.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e8fff4_0,#f6f9ff_42%,#eef4fb_100%)] px-4 py-8 text-slate-950 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold text-slate-700 shadow-sm">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <Image src="/branding/kronix/header-logo.png" alt="KroniX" width={190} height={72} className="h-auto w-40 object-contain" />
        </div>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="bg-[#06162f] px-6 py-8 text-white sm:px-10">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
              <Trash2 className="h-7 w-7" />
            </div>
            <p className="font-black uppercase tracking-[0.18em] text-emerald-400">Ruta KroniX</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Eliminar mi cuenta y datos</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Puedes eliminarla inmediatamente desde Perfil → Seguridad y privacidad en la app. Si no puedes ingresar, inicia aquí la solicitud externa.
            </p>
          </div>

          <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_0.95fr]">
            <div>
              <h2 className="text-xl font-black">¿Qué eliminaremos?</h2>
              <ul className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
                <li className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500" /> Perfil de compañero y conductor, documentos, fotografías y vehículos activos de Ruta KroniX.</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500" /> Mensajes, ubicaciones, avisos, soportes cerrados y contenido personal asociado.</li>
                <li className="flex gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-blue-500" /> Se conservará únicamente el mínimo exigible para pagos, aceptaciones legales, prevención de fraude o seguridad.</li>
              </ul>
              <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                Esta solicitud elimina solamente Ruta KroniX. No elimina una cuenta que uses en KroniX o KroniX Pro.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
              {sent ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                  <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                  <h2 className="mt-4 text-2xl font-black">Solicitud recibida</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Si encontramos una cuenta asociada, soporte verificará tu identidad antes de ejecutar el borrado.</p>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm"><LockKeyhole /></div>
                  <h2 className="text-xl font-black">Solicitar sin ingresar</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Escribe el número celular vinculado a tu cuenta.</p>
                  <label htmlFor="phone" className="mt-5 block text-sm font-extrabold">Número de celular</label>
                  <input
                    id="phone"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Ej. 311 386 8898"
                    className="mt-2 h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-lg font-bold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                  {error ? <p className="mt-3 text-sm font-bold text-red-600">{error}</p> : null}
                  <button disabled={busy} className="mt-5 h-14 w-full rounded-2xl bg-red-500 px-5 font-black text-white transition hover:bg-red-600 disabled:opacity-60">
                    {busy ? "Enviando…" : "Solicitar eliminación"}
                  </button>
                  <p className="mt-4 text-center text-xs leading-5 text-slate-500">Nunca te pediremos contraseña ni código OTP por este formulario.</p>
                </form>
              )}
            </div>
          </div>
        </section>
        <p className="mt-6 text-center text-sm text-slate-600">¿Necesitas ayuda? <a className="font-bold text-blue-700" href="mailto:soporte@kronix.co">soporte@kronix.co</a></p>
      </div>
    </main>
  );
}
