import Logo from "./Logo"
import LogoLoop from "./LogoLoop"
import { site, whatsappLink } from "../data/site"
import { WhatsAppIcon, MailIcon, MapPinIcon } from "./Icons"
import {
  SiReact, SiVite, SiTailwindcss, SiJavascript, SiNodedotjs, 
  SiExpress, SiPostgresql, SiSocketdotio, SiLeaflet, SiRender, 
  SiCloudinary, SiGit, SiThreedotjs, SiGreensock, SiHtml5, SiCss
} from "react-icons/si"

const nav = [
  { label: "Inicio", href: "#inicio" },
  { label: "Misión Control", href: "#telemetria" },
  { label: "Simulador QR", href: "#ecosistema" },
  { label: "Arquitectura", href: "#arquitectura" },
  { label: "Contacto", href: "#contacto" },
]

const techLogos = [
  { node: <SiReact />, title: "React", href: "https://react.dev" },
  { node: <SiVite />, title: "Vite", href: "https://vite.dev" },
  { node: <SiTailwindcss />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
  { node: <SiJavascript />, title: "JavaScript", href: "https://developer.mozilla.org/docs/Web/JavaScript" },
  { node: <SiNodedotjs />, title: "Node.js", href: "https://nodejs.org" },
  { node: <SiExpress />, title: "Express", href: "https://expressjs.com" },
  { node: <SiPostgresql />, title: "PostgreSQL", href: "https://www.postgresql.org" },
  { node: <SiSocketdotio />, title: "Socket.io", href: "https://socket.io" },
  { node: <SiLeaflet />, title: "Leaflet", href: "https://leafletjs.com" },
  { node: <SiRender />, title: "Render", href: "https://render.com" },
  { node: <SiCloudinary />, title: "Cloudinary", href: "https://cloudinary.com" },
  { node: <SiGit />, title: "Git", href: "https://git-scm.com" },
  { node: <SiHtml5 />, title: "HTML5", href: "https://developer.mozilla.org/docs/Web/HTML" },
  { node: <SiCss />, title: "CSS3", href: "https://developer.mozilla.org/docs/Web/CSS" },
]

const services = [
  "Radar Satelital en Vivo",
  "Alertas Subsegundo",
  "Terminales Físicas QR",
  "Autenticación Zero-Trust",
  "PWA & Pantalla Bloqueada",
]

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-nexo-border bg-nexo-bg">
      {/* Línea de acento superior */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-nexo-cyan/50 to-transparent" />

      {/* Carrusel de tecnologías */}
      <div className="border-b border-nexo-border py-12">
        <p className="mb-9 text-center text-sm font-semibold uppercase tracking-[0.3em] text-nexo-muted">
          Tecnologías que usamos
        </p>
        <div className="tech-loop relative overflow-hidden">
          <LogoLoop
            logos={techLogos}
            speed={40}
            direction="left"
            logoHeight={26}
            gap={48}
            pauseOnHover
            scaleOnHover
            fadeOut
            fadeOutColor="#020617" /* Match landing-root bg color exactly */
            ariaLabel="Tecnologías que usamos"
          />
        </div>
      </div>

      <div className="landing-container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Marca */}
          <div className="lg:col-span-1">
            <a href="#inicio" className="flex items-center gap-3">
              <Logo size={42} />
              <span className="text-3xl font-bold tracking-tight">
                Ne<span className="text-gradient">X</span>o Radar
              </span>
            </a>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-nexo-muted">
              {site.slogan}
            </p>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="text-base font-semibold uppercase tracking-wider text-nexo-text">Navegación</h4>
            <ul className="mt-5 space-y-3">
              {nav.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-base text-nexo-muted transition-colors hover:text-nexo-cyan">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="text-base font-semibold uppercase tracking-wider text-nexo-text">Servicios</h4>
            <ul className="mt-5 space-y-3">
              {services.map((s) => (
                <li key={s} className="text-base text-nexo-muted">{s}</li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-base font-semibold uppercase tracking-wider text-nexo-text">Contacto</h4>
            <ul className="mt-5 space-y-4">
              <li>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="group flex items-center gap-3 text-base text-nexo-muted transition-colors hover:text-nexo-cyan">
                  <WhatsAppIcon className="h-5 w-5 text-nexo-cyan" />
                  {site.whatsappDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="group flex items-center gap-3 text-base text-nexo-muted transition-colors hover:text-nexo-cyan">
                  <MailIcon className="h-5 w-5 text-nexo-cyan" />
                  <span className="truncate">{site.email}</span>
                </a>
              </li>
              <li className="flex items-center gap-3 text-base text-nexo-muted">
                <MapPinIcon className="h-5 w-5 text-nexo-cyan" />
                {site.location}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-nexo-border">
        <div className="landing-container flex flex-col items-center justify-between gap-3 py-6 text-sm text-nexo-muted sm:flex-row">
          <p>© 2026 {site.name}. Todos los derechos reservados.</p>
          <p>
            Diseñado y desarrollado por <span className="font-medium text-nexo-text">{site.developer}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
