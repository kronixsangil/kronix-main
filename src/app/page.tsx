//src\app\page.tsx
// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ShoppingBag,
  Package,
  ClipboardList,
  Store,
  Zap,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Menu,
  X,
  UserRound,
  Bike,
} from "lucide-react";

const phoneCarouselIntervalMs = 5500;

const headerLogoControls = {
  scale: "scale-[3.0]",
  translateX: "translate-x-[-40px]",
  translateY: "translate-y-10",
};

const motoLeftControls = {
  scale: "scale-[1.7]",
  translateX: "translate-x-[-150px]",
  translateY: "translate-y-[140px]",
};

const motoRightControls = {
  scale: "scale-[1.0]",
  translateX: "translate-x-[35px]",
  translateY: "translate-y-[135px]",
};

const buyerScreens = [
  "/branding/kronix/buyer-screen-1.png",
  "/branding/kronix/buyer-screen-2.png",
  "/branding/kronix/buyer-screen-3.png",
];

const services = [
  { title: "Compra", icon: ShoppingBag },
  { title: "Envíos", icon: Package },
  { title: "Recoge", icon: MapPin },
  { title: "Diligencias", icon: ClipboardList },
];

const miniHighlights = [
  { title: "RÁPIDO", description: "Entregas en minutos", icon: Zap },
  { title: "SEGURO", description: "Protegemos tus datos", icon: ShieldCheck },
  { title: "LOCAL", description: "Apoya tu ciudad", icon: MapPin },
];

const featureCards = [
  {
    title: "Rápido",
    description: "Solicita en minutos y recibe apoyo cuando lo necesites.",
    icon: Zap,
    image: "/branding/kronix/rapido.png",
  },
  {
    title: "Seguro",
    description:
      "Tus compras y datos siempre protegidos con los más altos estándares.",
    icon: ShieldCheck,
    image: "/branding/kronix/seguro.png",
  },
  {
    title: "Local",
    description: "Apoya a tiendas y emprendedores de San Gil. Juntos crecemos.",
    icon: MapPin,
    image: "/branding/kronix/local.png",
  },
];

const stats = [
  { value: "+100", label: "Tiendas aliadas", icon: Store },
  { value: "+500", label: "Productos disponibles", icon: ShoppingBag },
  { value: "En minutos", label: "Entregas rápidas", icon: Zap },
  { value: "100%", label: "Comprometidos contigo", icon: CheckCircle2 },
];

function PhoneCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % buyerScreens.length);
    }, phoneCarouselIntervalMs);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative z-20 mx-auto flex w-full max-w-[360px] justify-center xl:max-w-[385px] 2xl:max-w-[410px]">
      <div className="absolute -left-12 top-12 h-32 w-32 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="absolute -right-12 bottom-12 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full rounded-[2.8rem] border border-white/10 bg-[#050b18]/95 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="mb-3 flex items-center justify-between px-4 pt-1 text-[11px] text-white/70">
          <span>9:41</span>
          <div className="h-6 w-28 rounded-full bg-slate-900/90" />
          <span>5G</span>
        </div>

        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.2rem] bg-slate-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={buyerScreens[index]}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.015 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.55, ease: "easeInOut" }}
            >
              <Image
                src={buyerScreens[index]}
                alt={`Pantalla Buyer ${index + 1}`}
                fill
                className="bg-slate-950 object-contain"
                priority
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="absolute -bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 backdrop-blur">
        {buyerScreens.map((_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            onClick={() => setIndex(dotIndex)}
            className={`h-2.5 rounded-full transition-all ${
              dotIndex === index ? "w-8 bg-emerald-400" : "w-2.5 bg-white/30"
            }`}
            aria-label={`Ver pantalla ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function FeatureRowCard({
  title,
  description,
  image,
  icon: Icon,
}: {
  title: string;
  description: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur md:grid-cols-[0.95fr_1.05fr]">
      <div className="flex items-center gap-5 p-6 xl:p-7">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.12)]">
          <Icon className="h-7 w-7" />
        </div>

        <div>
          <h3 className="text-2xl font-extrabold text-white">{title}</h3>
          <p className="mt-2 max-w-md text-base leading-7 text-slate-300">
            {description}
          </p>
        </div>
      </div>

      <div className="relative min-h-[180px] bg-slate-950">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
    </div>
  );
}


function MobileAppSelector() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");

    const sync = () => {
      setOpen(media.matches);
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-end bg-slate-950/75 px-3 pb-3 backdrop-blur-sm md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-app-selector-title"
        >
          <motion.div
            className="relative mx-auto w-full max-w-md overflow-hidden rounded-[30px] border border-white/10 bg-[#071523] shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_38%)]" />

            <div className="relative p-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80"
                aria-label="Continuar viendo el sitio web"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="pr-12">
                <div className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300">
                  Bienvenido a KRONIX
                </div>

                <h2
                  id="mobile-app-selector-title"
                  className="mt-4 text-3xl font-black leading-tight text-white"
                >
                  ¿Qué deseas hacer?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Elige la experiencia que necesitas en este momento.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <a
                  href="https://buyer.kronix.co/instalar"
                  className="flex items-center gap-4 rounded-[22px] border border-emerald-300/20 bg-emerald-500 px-4 py-4 text-slate-950 shadow-lg shadow-emerald-500/15 transition active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/25">
                    <UserRound className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-black">Usar KRONIX</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-900/75">
                      Comprar, pedir servicios, enviar paquetes y más
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0" />
                </a>

                <a
                  href="https://driver.kronix.co/instalar"
                  className="flex items-center gap-4 rounded-[22px] border border-cyan-300/20 bg-blue-600 px-4 py-4 text-white shadow-lg shadow-blue-600/15 transition active:scale-[0.99]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <Bike className="h-6 w-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-black">Trabajar con KRONIX</div>
                    <div className="mt-0.5 text-xs font-semibold text-white/80">
                      Recibir servicios y generar ingresos
                    </div>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/85"
              >
                Continuar viendo kronix.co
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function KronixLandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <MobileAppSelector />
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.20),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.14),transparent_24%),linear-gradient(180deg,#04101d_0%,#051223_50%,#040c17_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-[1720px] flex-col px-6 py-6 sm:px-8 lg:px-10 xl:px-14">
          <header className="flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-[220px] items-center overflow-visible">
                <div
                  className={`relative h-14 w-[200px] ${headerLogoControls.scale} ${headerLogoControls.translateX} ${headerLogoControls.translateY} origin-left`}
                >
                  <Image
                    src="/branding/kronix/header-logo.png"
                    alt="KroniX"
                    fill
                    className="object-contain object-left"
                    priority
                  />
                </div>
              </div>
            </div>

            <nav className="hidden items-center gap-10 text-base font-medium text-white/90 xl:flex">
              <a href="#" className="text-emerald-400">
                Inicio
              </a>
              <a href="#services" className="hover:text-emerald-400">
                Servicios
              </a>
              <a href="#how" className="hover:text-emerald-400">
                Cómo funciona
              </a>
              <a href="#benefits" className="hover:text-emerald-400">
                Beneficios
              </a>
              <a href="#launch" className="hover:text-emerald-400">
                Próximamente
              </a>
              <a href="#contact" className="hover:text-emerald-400">
                Contacto
              </a>
            </nav>

            <a
              href="https://wa.me/573112461059"
              className="hidden items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] xl:inline-flex"
            >
              <MessageCircle className="h-5 w-5" />
              Quiero más información
            </a>

            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>

          <div className="flex flex-1 items-center">
            <div className="grid w-full items-center gap-8 py-8 xl:grid-cols-[0.95fr_0.82fr_1.05fr] 2xl:gap-10">
              <div className="flex flex-col justify-center">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Próximamente en San Gil - Santander
                </div>

                <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl 2xl:text-[84px]">
                  Todo lo que
                  <span className="block">necesitas,</span>
                  <span className="block bg-gradient-to-r from-emerald-400 via-lime-300 to-cyan-300 bg-clip-text text-transparent">
                    cuando lo necesitas.
                  </span>
                </h1>

                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-200 2xl:text-xl">
                  KroniX reúne compras, envíos, recogidas y diligencias en una sola
                  experiencia moderna, rápida y confiable.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="https://wa.me/573112461059"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]"
                  >
                    Quiero más información
                    <ArrowRight className="h-5 w-5" />
                  </a>

                  <a
                    href="#services"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
                  >
                    Ver servicios
                  </a>
                </div>

                <div className="mt-10 flex flex-wrap gap-8">
                  {miniHighlights.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
                          <Icon className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="text-2xl font-extrabold leading-none">
                            {item.title}
                          </div>
                          <div className="mt-2 text-sm text-slate-300">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex items-center justify-center overflow-visible">
                <div
                  className={`absolute bottom-[17%] left-[-16%] z-30 hidden xl:block ${motoLeftControls.scale} ${motoLeftControls.translateX} ${motoLeftControls.translateY}`}
                >
                  <div className="relative h-[170px] w-[220px]">
                    <Image
                      src="/branding/kronix/card-moto.png"
                      alt="Moto KroniX"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                <div
                  className={`absolute bottom-[12%] right-[-18%] z-30 hidden xl:block ${motoRightControls.scale} ${motoRightControls.translateX} ${motoRightControls.translateY}`}
                >
                  <div className="relative h-[235px] w-[245px]">
                    <Image
                      src="/branding/kronix/enviar-Paquete2.png"
                      alt="Enviar paquete"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                <PhoneCarousel />
              </div>

              <div className="flex flex-col justify-center">
                <div>
                  <h2 className="text-4xl font-black tracking-tight 2xl:text-5xl">
                    ¿Por qué elegir KroniX?
                  </h2>
                  <p className="mt-3 text-lg text-slate-300">
                    Tecnología que trabaja para ti y tu comunidad.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  {featureCards.map((item) => (
                    <FeatureRowCard
                      key={item.title}
                      title={item.title}
                      description={item.description}
                      image={item.image}
                      icon={item.icon}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <section
            id="benefits"
            className="grid gap-4 border-t border-white/10 pt-5 xl:grid-cols-[1.1fr_0.95fr_0.75fr]"
          >
            <div className="grid grid-cols-2 gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur xl:grid-cols-4">
              {stats.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label}>
                    <div className="flex items-center gap-3 text-emerald-400">
                      <Icon className="h-5 w-5" />
                      <span className="text-3xl font-black text-white">
                        {item.value}
                      </span>
                    </div>
                    <div className="mt-3 text-base text-slate-300">
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              id="services"
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur"
            >
              <h3 className="text-2xl font-black">
                KroniX llega para hacer tu vida más fácil.
              </h3>
              <p className="mt-2 text-lg text-slate-300">Todo en una sola app.</p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {services.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-5 text-center"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-lg font-semibold">{item.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              id="contact"
              className="rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_45%),rgba(255,255,255,0.03)] p-6 shadow-[0_10px_35px_rgba(0,0,0,0.22)]"
            >
              <div className="grid h-full gap-5 xl:grid-cols-[110px_1fr] xl:items-center">
                <div className="relative mx-auto h-[120px] w-[95px] xl:h-[150px] xl:w-[120px]">
                  <Image
                    src="/branding/kronix/check-list.png"
                    alt="Checklist KroniX"
                    fill
                    className="object-contain"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-3 text-emerald-400">
                    <Store className="h-6 w-6" />
                    <div className="text-2xl font-black text-white">
                      ¿Eres tienda o emprendedor?
                    </div>
                  </div>

                  <p className="mt-4 text-lg leading-8 text-slate-300">
                    Únete a KroniX y aumenta tus ventas.
                  </p>

                  <a
                    href="https://wa.me/573112461059"
                    className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Quiero vender en KroniX
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}