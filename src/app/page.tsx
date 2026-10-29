"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight, BriefcaseBusiness, Building2, CarFront, Check, ChevronRight,
  Handshake, Headphones, MapPin, Menu, PackageCheck, Route, ShieldCheck,
  ShoppingBag, Smartphone, Store, UsersRound, X, Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Ecosistema", href: "#ecosistema" },
  { label: "Qué hacemos", href: "#servicios" },
  { label: "Ciudades", href: "#ciudades" },
  { label: "Para negocios", href: "#aliados" },
];

const experiences = [
  {
    eyebrow: "PARA TU DÍA A DÍA", title: "KroniX",
    description: "Pide servicios locales, solicita entregas y compra en establecimientos de tu ciudad desde una sola experiencia.",
    icon: Smartphone, tone: "blue", image: "/apps/buyer.png",
    points: ["Servicios cerca de ti", "Seguimiento de solicitudes", "Soporte local"],
    cta: "Abrir KroniX", href: "https://buyer.kronix.co",
  },
  {
    eyebrow: "PARA TRABAJADORES INDEPENDIENTES", title: "KroniX Pro",
    description: "La herramienta de quienes prestan servicios, reciben oportunidades y gestionan su actividad en KroniX.",
    icon: BriefcaseBusiness, tone: "green", image: "/apps/worker.png",
    points: ["Oportunidades en tu ciudad", "Gestión desde el celular", "Trabajo independiente"],
    cta: "Quiero trabajar con KroniX", href: "#contacto",
  },
  {
    eyebrow: "VIAJES COMPARTIDOS", title: "Ruta KroniX",
    description: "Conecta conductores con puestos disponibles y personas que van hacia el mismo destino, con puntos y asientos claros.",
    icon: Route, tone: "cyan", image: null,
    points: ["Publica o busca un viaje", "Elige puntos y puestos", "Perfiles verificados"],
    cta: "Conocer Ruta KroniX", href: "#ruta-kronix",
  },
];

const capabilities = [
  { icon: Zap, title: "Servicios locales", text: "Encuentra personas disponibles para ayudarte con necesidades cotidianas en tu ciudad." },
  { icon: PackageCheck, title: "Entregas y envíos", text: "Solicita recogidas, domicilios y envíos urbanos con seguimiento del proceso." },
  { icon: Store, title: "Establecimientos", text: "Compra para domicilio, recoge en el negocio o pide directamente desde una mesa con QR." },
  { icon: CarFront, title: "Viajes compartidos", text: "Encuentra un puesto o comparte tu recorrido con Ruta KroniX." },
];

const steps = [
  { number: "01", title: "Elige lo que necesitas", text: "Abre KroniX y selecciona el servicio, negocio o viaje adecuado para ti." },
  { number: "02", title: "Cuéntanos los detalles", text: "Indica tu ubicación y la información necesaria. La app te guía en cada paso." },
  { number: "03", title: "Sigue todo desde tu celular", text: "Recibe avisos, consulta el estado y mantén el control de tu solicitud." },
];

function BrandLogo({ priority = false }: { priority?: boolean }) {
  return <Image src="/branding/kronix/header-logo.png" alt="KroniX" width={682} height={250} priority={priority} className="brand-logo" />;
}

function PhonePreview() {
  return (
    <div className="hero-visual" aria-label="Vista ilustrativa de la plataforma KroniX">
      <motion.div className="phone-shell" initial={{ opacity: 0, y: 26, rotate: 1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: .75 }}>
        <div className="phone-top"><span>9:41</span><i /><span>5G</span></div>
        <div className="phone-screen">
          <div className="phone-brand-row">
            <Image src="/branding/kronix/header-logo.png" alt="" width={682} height={250} className="phone-logo" />
            <div className="phone-avatar">K</div>
          </div>
          <div className="phone-location"><MapPin size={13} /> San Gil · Santander</div>
          <h3>¿Qué necesitas hoy?</h3><p>Soluciones locales, más cerca de ti.</p>
          <div className="phone-service-grid">
            <div className="phone-service phone-service--blue"><Zap /><b>Servicios</b><span>Ayuda local</span></div>
            <div className="phone-service phone-service--green"><PackageCheck /><b>Entregas</b><span>Recoge y lleva</span></div>
            <div className="phone-service phone-service--yellow"><ShoppingBag /><b>Negocios</b><span>Pide a tu manera</span></div>
            <div className="phone-service phone-service--cyan"><CarFront /><b>Viajes</b><span>Comparte tu ruta</span></div>
          </div>
          <div className="phone-active-card"><span className="pulse-dot" /><div><small>KRONIX EN TU CIUDAD</small><b>Conectando oportunidades</b></div><ChevronRight size={18} /></div>
        </div>
      </motion.div>
      <motion.div className="floating-card floating-card--top" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .45 }}>
        <div className="floating-icon"><MapPin size={20} /></div><div><small>YA ESTAMOS EN</small><strong>San Gil y Granada</strong></div>
      </motion.div>
      <motion.div className="floating-card floating-card--bottom" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .6 }}>
        <div className="floating-icon floating-icon--lime"><Handshake size={20} /></div><div><small>HECHO PARA CRECER</small><strong>Junto a lo local</strong></div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main>
      <header className="site-header">
        <div className="container header-inner">
          <a href="#inicio" aria-label="Ir al inicio"><BrandLogo priority /></a>
          <nav className="desktop-nav" aria-label="Navegación principal">{navItems.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
          <a className="header-cta" href="#ecosistema">Explorar KroniX <ArrowRight size={17} /></a>
          <button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú" aria-expanded={menuOpen}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}<a href="#ecosistema" onClick={() => setMenuOpen(false)}>Explorar KroniX</a></nav>}
      </header>

      <section className="hero" id="inicio">
        <div className="hero-glow hero-glow--one" /><div className="hero-glow hero-glow--two" />
        <div className="container hero-grid">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }}>
            <div className="eyebrow"><span /> Tecnología local que sí se mueve contigo</div>
            <h1>Tu ciudad.<br />Tus oportunidades.<br /><em>Una sola red.</em></h1>
            <p className="hero-lead">KroniX conecta personas, trabajadores y negocios para resolver lo cotidiano, impulsar lo local y compartir nuevos caminos.</p>
            <div className="hero-actions"><a className="button button--primary" href="https://buyer.kronix.co">Usar KroniX <ArrowRight size={19} /></a><a className="button button--ghost" href="#ecosistema">Conocer el ecosistema</a></div>
            <div className="hero-proof"><div><MapPin size={18} /><span><strong>2 ciudades</strong>San Gil y Granada</span></div><div><UsersRound size={18} /><span><strong>Hecho con la comunidad</strong>Tecnología cercana</span></div></div>
          </motion.div>
          <PhonePreview />
        </div>
      </section>

      <section className="city-ribbon" aria-label="Ciudades activas"><div className="container city-ribbon-inner"><span>KroniX ya está en movimiento</span><div><MapPin size={17} /> San Gil <small>Santander</small></div><i /><div><MapPin size={17} /> Granada <small>Meta</small></div><strong>Y seguimos creciendo</strong></div></section>

      <section className="section section--light" id="ecosistema"><div className="container">
        <div className="section-heading section-heading--center"><span className="kicker">UN ECOSISTEMA, DISTINTAS FORMAS DE AVANZAR</span><h2>KroniX se adapta a tu camino</h2><p>Elige la experiencia que necesitas. Todas nacen de la misma idea: acercar oportunidades reales a cada ciudad.</p></div>
        <div className="experience-grid">{experiences.map((experience, index) => { const Icon = experience.icon; return (
          <motion.article key={experience.title} className={`experience-card experience-card--${experience.tone}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .09 }} id={experience.title === "Ruta KroniX" ? "ruta-kronix" : undefined}>
            <div className="experience-top"><div className="experience-icon">{experience.image ? <Image src={experience.image} alt="" width={500} height={500} /> : <Icon />}</div><span>{experience.eyebrow}</span></div>
            <h3>{experience.title}</h3><p>{experience.description}</p><ul>{experience.points.map((point) => <li key={point}><Check size={15} /> {point}</li>)}</ul><a href={experience.href}>{experience.cta} <ArrowRight size={17} /></a>
          </motion.article>); })}</div>
      </div></section>

      <section className="section section--dark" id="servicios"><div className="container">
        <div className="section-heading section-heading--dark"><span className="kicker">MÁS QUE UNA APP</span><h2>Una plataforma para la vida real</h2><p>Construimos herramientas sencillas para conectar lo que necesitas con personas y negocios de tu entorno.</p></div>
        <div className="capability-grid">{capabilities.map((capability, index) => { const Icon = capability.icon; return <motion.article key={capability.title} className="capability-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .07 }}><span>0{index + 1}</span><div className="capability-icon"><Icon /></div><h3>{capability.title}</h3><p>{capability.text}</p></motion.article>; })}</div>
      </div></section>

      <section className="section section--how"><div className="container how-grid">
        <div className="how-copy"><span className="kicker">SIMPLE DESDE EL PRIMER TOQUE</span><h2>Lo local no tiene que ser complicado</h2><p>KroniX te acompaña con pasos claros, información útil y una experiencia pensada para el celular.</p><div className="trust-note"><ShieldCheck /><span><strong>Tu información importa.</strong> Usamos los datos necesarios para prestar el servicio y ofrecemos canales claros de soporte y privacidad.</span></div></div>
        <div className="steps-list">{steps.map((step) => <article key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></article>)}</div>
      </div></section>

      <section className="section section--cities" id="ciudades"><div className="container"><div className="cities-panel">
        <div className="cities-copy"><span className="kicker">NACIMOS CERCA</span><h2>Dos ciudades, una misma energía</h2><p>KroniX opera desde lo local: conoce cada territorio, acompaña a su comunidad y crece junto a ella.</p><div className="cities-list"><div><b><MapPin /> San Gil</b><span>Santander</span></div><div><b><MapPin /> Granada</b><span>Meta</span></div></div></div>
        <div className="map-art" aria-hidden="true"><span className="map-ring map-ring--one" /><span className="map-ring map-ring--two" /><div className="map-route" /><div className="map-pin map-pin--sg"><i /><b>San Gil</b></div><div className="map-pin map-pin--gr"><i /><b>Granada</b></div><strong>K</strong></div>
      </div></div></section>

      <section className="section section--partners" id="aliados"><div className="container">
        <div className="section-heading section-heading--center"><span className="kicker">CRECEMOS CONTIGO</span><h2>También hay un lugar para ti en KroniX</h2></div>
        <div className="partner-grid">
          <article><div className="partner-icon"><Building2 /></div><div><span>NEGOCIOS Y ESTABLECIMIENTOS</span><h3>Digitaliza tu atención sin perder tu esencia</h3><p>Recibe pedidos para domicilio, recoger o atender en mesa mediante QR, con una experiencia diseñada para tu negocio.</p><a href="#contacto">Quiero vincular mi negocio <ArrowRight /></a></div></article>
          <article><div className="partner-icon partner-icon--green"><BriefcaseBusiness /></div><div><span>TRABAJADORES INDEPENDIENTES</span><h3>Convierte tu experiencia en oportunidades</h3><p>Registra tu perfil, completa las verificaciones y accede a solicitudes disponibles en tu ciudad.</p><a href="#contacto">Quiero ser parte de KroniX Pro <ArrowRight /></a></div></article>
        </div>
      </div></section>

      <section className="closing" id="contacto"><div className="closing-orb closing-orb--one" /><div className="closing-orb closing-orb--two" /><div className="container closing-inner"><div><span className="kicker">EL FUTURO TAMBIÉN SE CONSTRUYE DESDE AQUÍ</span><h2>Haz parte del movimiento KroniX</h2><p>Clientes, trabajadores, conductores y negocios: hay una forma de avanzar juntos.</p></div><div className="closing-actions"><a className="button button--light" href="https://buyer.kronix.co">Empezar con KroniX <ArrowRight /></a><a className="support-link" href="mailto:soporte@kronix.co"><Headphones /> soporte@kronix.co</a></div></div></section>

      <footer><div className="container footer-top"><div className="footer-brand"><BrandLogo /><p>Tecnología local para conectar personas, oportunidades y ciudades.</p></div><div><h3>Explora</h3><a href="#ecosistema">Ecosistema</a><a href="#servicios">Qué hacemos</a><a href="#ciudades">Ciudades</a></div><div><h3>Comunidad</h3><a href="#aliados">Para negocios</a><a href="#aliados">KroniX Pro</a><a href="#ruta-kronix">Ruta KroniX</a></div><div><h3>Ayuda y legal</h3><a href="mailto:soporte@kronix.co">Soporte</a><a href="/eliminar-cuenta-ruta-kronix">Eliminar cuenta Ruta KroniX</a><a href="mailto:soporte@kronix.co?subject=Privacidad%20KroniX">Privacidad y datos</a></div></div><div className="container footer-bottom"><span>© 2026 KroniX Tecnología S.A.S.</span><span>Hecho en Colombia para nuestras ciudades.</span></div></footer>
    </main>
  );
}
