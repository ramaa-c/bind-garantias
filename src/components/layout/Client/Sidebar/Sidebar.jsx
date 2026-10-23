import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FiFileText,
  FiClipboard,
  FiFolder,
  FiX,
  FiLogOut,
  FiUser,
  FiRepeat,
  FiLock,
  FiChevronRight,
  FiSidebar,
  FiEdit3,
} from "react-icons/fi";
import logoBind from "../../../../assets/images/bind-g-logo.svg";
import logoBindBlack from "../../../../assets/images/bind-g-logo-black.svg";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { useVendor } from "../../../../hooks/useVendor";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useNavigationStore } from "../../../../store/useNavigationStore";
import { useThemeStore } from "../../../../store/useThemeStore";
import { useSidebarStore } from "../../../../store/useSidebarStore";
import { useVersionApi } from "../../../../hooks/useSistema";
import { useSocioWebPorId } from "../../../../hooks/useSocios";
import { PerfilModal } from "../../../features/shared/PerfilModal/PerfilModal";
import { ConfirmacionModal } from "../../../features/shared/ConfirmacionModal/ConfirmacionModal";
import { useChannel } from "../../../../context/useChannel";
import { useAccesoDashboardCliente } from "../../../../hooks/useAccesoDashboardCliente";
import { obtenerInicialesEmpresa, obtenerVarianteAvatarEmpresa } from "../../../../utils/empresaAvatar";
import styles from "./Sidebar.module.css";

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { nombreEmpresa, cuitActivo, onboardingCompleto, socioIdActivo } = useEmpresaActiva();
  // En alta-datos-empresa se está dando de alta una empresa NUEVA que todavía
  // no es la "activa" del usuario (activeSocioId sigue apuntando a otra
  // empresa ya onboardeada, o a ninguna) — mostrar acá la tarjeta/nav de esa
  // otra empresa es confuso y directamente incorrecto, sin importar cuál sea.
  const enAltaDatosEmpresa = location.pathname.includes("/alta-datos-empresa");
  const isVinculado = !!nombreEmpresa && !enAltaDatosEmpresa;
  const theme = useThemeStore((state) => state.theme);
  const { data: versionApiRaw } = useVersionApi();
  // El backend devuelve un string suelto (ej. "SGRPlus API Web Version
  // 1.0"), no un objeto - se le extrae solo el número para no repetir la
  // frase completa al lado de nuestra propia versión.
  const versionApi = versionApiRaw?.match(/[\d]+(?:\.[\d]+)*\s*$/)?.[0]?.trim();

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const cambiarEmpresaStore = useAuthStore((state) => state.cambiarEmpresa);
  const isSolicitudesEnabled = useAuthStore((state) => state.isSolicitudesEnabled);
  const { legajoDesbloqueado, documentacionDesbloqueada, solicitudEnOtraPlataforma, faltanDocumentos } =
    useAccesoDashboardCliente();
  const motivoBloqueoOtraPlataforma = "Solicitud en curso en otra plataforma";
  const emailUsuario = typeof user === "string" ? user : user?.email ? String(user.email) : "Usuario";
  const { channelInfo, basePath } = useChannel();
  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;

  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false);
  const compacto = useSidebarStore((state) => state.compacto);
  const toggleCompacto = useSidebarStore((state) => state.toggleCompacto);

  const { hasUnsavedChanges, setUnsavedChanges } = useNavigationStore();
  const [pendingPath, setPendingPath] = useState(null);

  const isActive = (path) => location.pathname.startsWith(`${basePath}${path}`);

  // Punto de atención en Legajo/Documentación cuando se acaban de
  // desbloquear (flujo "con línea activa": ver useAccesoDashboardCliente) -
  // sin esto, la única señal de que algo cambió era que el candado
  // desapareciera, algo fácil de no notar entre dos visitas. Se apaga solo
  // la primera vez que el usuario entra a esa sección (localStorage, por
  // socio).
  const [legajoRecienDesbloqueado, setLegajoRecienDesbloqueado] = useState(false);
  const [documentacionRecienDesbloqueada, setDocumentacionRecienDesbloqueada] = useState(false);

  useEffect(() => {
    if (!socioIdActivo || !legajoDesbloqueado) return;
    const key = `bind_legajo_visto_${socioIdActivo}`;
    if (isActive("/legajo")) {
      localStorage.setItem(key, "1");
      setLegajoRecienDesbloqueado(false);
      return;
    }
    setLegajoRecienDesbloqueado(localStorage.getItem(key) !== "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socioIdActivo, legajoDesbloqueado, location.pathname]);

  useEffect(() => {
    if (!socioIdActivo || !documentacionDesbloqueada) return;
    const key = `bind_documentacion_vista_${socioIdActivo}`;
    if (isActive("/documentacion")) {
      localStorage.setItem(key, "1");
      setDocumentacionRecienDesbloqueada(false);
      return;
    }
    setDocumentacionRecienDesbloqueada(localStorage.getItem(key) !== "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socioIdActivo, documentacionDesbloqueada, location.pathname]);

  const handleNavigate = (path) => {
    const fullPath = `${basePath}${path.startsWith("/") ? path : "/" + path}`;
    if (hasUnsavedChanges && location.pathname !== fullPath) {
      setPendingPath(fullPath);
      return;
    }
    navigate(fullPath);
    onClose();
  };

  const confirmNavigation = () => {
    setUnsavedChanges(false);
    if (pendingPath) {
      navigate(pendingPath);
      setPendingPath(null);
      onClose();
    }
  };

  const cancelNavigation = () => {
    setPendingPath(null);
  };

  const handleLogout = () => {
    clearAuth();
    navigate(`${basePath}/login`);
  };

  // Mismo criterio que Navbar.jsx: logout "suave", solo para vendors.
  const handleCambiarEmpresa = () => {
    cambiarEmpresaStore();
    navigate(`${basePath}/seleccionar-empresa`);
    onClose();
  };

  const itemsNavegacion = [
    isSolicitudesEnabled && {
      path: "/solicitudes",
      label: "Solicitudes",
      icono: <FiFileText />,
      bloqueado: false,
      ayuda: "Tus solicitudes de línea",
    },
    {
      path: "/legajo",
      label: "Legajo",
      icono: <FiClipboard />,
      bloqueado: !legajoDesbloqueado,
      motivoBloqueo: solicitudEnOtraPlataforma
        ? motivoBloqueoOtraPlataforma
        : "Requiere una solicitud en curso",
      ayuda: "Datos de la empresa y personas",
      novedad: legajoRecienDesbloqueado,
      textoNovedad: "Recién habilitado: completá los datos de tu empresa",
    },
    {
      path: "/documentacion",
      label: "Documentación",
      icono: <FiFolder />,
      bloqueado: !documentacionDesbloqueada,
      motivoBloqueo: solicitudEnOtraPlataforma
        ? motivoBloqueoOtraPlataforma
        : "Requiere el legajo al 100 %",
      ayuda: "Subí la documentación requerida",
      novedad: documentacionRecienDesbloqueada,
      textoNovedad: "Recién habilitada: ya podés subir tu documentación",
    },
  ].filter(Boolean);

  // Hasta que se complete el Paso 2 del alta (ver AltaDatosEmpresa) y se
  // confirme el PUT, el socio ya tiene denominación pero no es una empresa
  // operable todavía — no se muestra navegación ni progreso (ni siquiera
  // bloqueados): a pedido, durante el alta no se adelanta información.
  const empresaOperable = isVinculado && onboardingCompleto;

  // "Tu alta": recorrido de 4 pasos hacia la migración del legajo
  // (empresa → solicitud → legajo completo → documentación y migración).
  // Se muestra mientras la empresa no esté migrada: es lo que el socio
  // tiene que cumplir para llegar ahí. El último paso se da por hecho
  // con la migración (marcavinculacion, mismo dato que LegajoUniversalBar).
  const esperandoRevision = documentacionDesbloqueada && !faltanDocumentos;
  const { data: socioWeb } = useSocioWebPorId(empresaOperable ? socioIdActivo : undefined, {
    refetchOnWindowFocus: esperandoRevision ? "always" : false,
  });
  const migrado = String(socioWeb?.marcavinculacion ?? "") === "1";
  const pasosHechos =
    1 + (legajoDesbloqueado ? 1 : 0) + (documentacionDesbloqueada ? 1 : 0) + (migrado ? 1 : 0);

  const claveAltaCompleta = `bind_alta_completa_vista_${socioIdActivo}`;
  const [altaCompletaYaVista] = useState(() => {
    try {
      return localStorage.getItem(claveAltaCompleta) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!migrado || !socioIdActivo) return;
    try {
      localStorage.setItem(claveAltaCompleta, "1");
    } catch {
      return;
    }
  }, [migrado, socioIdActivo, claveAltaCompleta]);

  const altaCompleta = migrado;
  const mostrarProgreso = empresaOperable && (!migrado || !altaCompletaYaVista);
  const proximoPaso = altaCompleta
    ? "¡Alta completa! Tu empresa ya está en SGR+"
    : !legajoDesbloqueado
      ? solicitudEnOtraPlataforma
        ? "Tenés una solicitud en curso en otra plataforma"
        : "Próximo: cargá una solicitud"
      : !documentacionDesbloqueada
        ? "Próximo: completá el legajo"
        : faltanDocumentos
          ? "Próximo: subí la documentación"
          : "En revisión de BIND Garantías";
  const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * 15;

  const rolUsuario = isVendor ? "Vendor" : isVinculado ? "Socio vinculado" : "Sin empresa vinculada";
  const irAlInicio = () => navigate(`${basePath}${isSolicitudesEnabled ? "/solicitudes" : "/legajo"}`);

  return (
    <aside
      className={`${styles.container} ${isOpen ? styles.open : ""} ${compacto ? styles.compacto : ""}`}
      aria-label="Navegación principal"
    >
      <div className={styles.marca}>
        <button type="button" className={styles.marcaLogos} onClick={irAlInicio} aria-label="Ir al inicio">
          <img src={theme === "light" ? logoBindBlack : logoBind} alt="Bind Garantías" className={styles.logo} />
          {channelInfo.id !== "default" && channelInfo.logo && (
            <>
              <span className={styles.logoSeparator} aria-hidden="true" />
              <img src={channelInfo.logo} alt={channelInfo.nombre} className={styles.channelLogo} />
            </>
          )}
        </button>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Cerrar menú">
          <FiX />
        </button>
      </div>

      <div className={styles.cuerpo}>
        {isVinculado && (
          <div className={styles.empresa}>
            <div
              className={`${styles.companyAvatar} ${styles[`avatar--${obtenerVarianteAvatarEmpresa(nombreEmpresa)}`]}`}
              aria-hidden="true"
            >
              {obtenerInicialesEmpresa(nombreEmpresa)}
            </div>
            <div className={styles.empresaInfo} title={nombreEmpresa}>
              <p className={styles.empresaNombre}>{nombreEmpresa}</p>
              {cuitActivo && <p className={styles.empresaCuit}>CUIT {cuitActivo}</p>}
            </div>
            {isVendor && (
              <button
                type="button"
                className={styles.empresaCambiar}
                onClick={handleCambiarEmpresa}
                aria-label="Cambiar de empresa"
                title="Cambiar de empresa"
              >
                <FiRepeat />
              </button>
            )}
          </div>
        )}

        {mostrarProgreso && (
          <div
            className={`${styles.progreso} ${altaCompleta ? styles.progresoCompleto : ""}`}
            title={`Tu alta: ${pasosHechos} de 4 · ${proximoPaso}`}
          >
            <div className={styles.progresoTexto}>
              <span className={styles.progresoLabel}>Tu alta</span>
              <span className={styles.progresoCuenta}>{pasosHechos} de 4</span>
            </div>
            <div className={styles.progresoBarra} aria-hidden="true">
              <span style={{ width: `${(pasosHechos / 4) * 100}%` }} />
            </div>
            <span className={styles.progresoProximo}>{proximoPaso}</span>
            {/* Versión compacta (solo rail de escritorio): anillo. */}
            <svg
              className={styles.progresoAnillo}
              viewBox="0 0 40 40"
              role="img"
              aria-label={`Tu alta: ${pasosHechos} de 4`}
            >
              <circle cx="20" cy="20" r="15" className={styles.anilloFondo} />
              <circle
                cx="20"
                cy="20"
                r="15"
                className={styles.anilloValor}
                strokeDasharray={`${(CIRCUNFERENCIA_ANILLO * pasosHechos) / 4} ${CIRCUNFERENCIA_ANILLO}`}
                transform="rotate(-90 20 20)"
              />
              <text x="20" y="24" textAnchor="middle" className={styles.anilloTexto}>
                {pasosHechos}/4
              </text>
            </svg>
          </div>
        )}

        {empresaOperable && (
          <nav className={styles.nav}>
            <ul className={styles.navLista}>
              {itemsNavegacion.map(({ path, label, icono, bloqueado, motivoBloqueo, ayuda, novedad, textoNovedad }) => {
                const activo = isActive(path);
                return (
                  <li key={path}>
                    <button
                      type="button"
                      className={`${styles.navItem} ${activo ? styles.navItemActivo : ""} ${bloqueado ? styles.navItemBloqueado : ""} ${novedad && !bloqueado && !activo ? styles.navItemNovedad : ""}`}
                      onClick={() => !bloqueado && handleNavigate(path)}
                      disabled={bloqueado}
                      aria-current={activo ? "page" : undefined}
                      title={bloqueado ? `${label} · ${motivoBloqueo}` : label}
                    >
                      <span className={styles.navIcono} aria-hidden="true">
                        {icono}
                      </span>
                      <span className={styles.navTexto}>
                        <span className={styles.navLabel}>{label}</span>
                        {bloqueado ? (
                          <span className={styles.navAyuda}>{motivoBloqueo}</span>
                        ) : novedad ? (
                          <span className={`${styles.navAyuda} ${styles.navAyudaNovedad}`}>{textoNovedad}</span>
                        ) : (
                          <span className={styles.navAyuda}>{ayuda}</span>
                        )}
                      </span>
                      {bloqueado && <FiLock className={styles.navEstado} aria-label="Bloqueado" />}
                      {!bloqueado && novedad && (
                        <span className={styles.novedadDot} aria-label="Recién habilitado" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>

      <div className={styles.pie}>
        <div className={styles.cuentaMovil}>
          <div className={styles.cuentaIdentidad}>
            <span className={styles.cuentaAvatar} aria-hidden="true">
              <FiUser />
            </span>
            <div className={styles.cuentaTexto}>
              <p className={styles.cuentaEmail} title={emailUsuario}>{emailUsuario}</p>
              <p className={`${styles.cuentaRol} ${!isVinculado && !isVendor ? styles.cuentaRolNeutro : ""}`}>
                {rolUsuario}
                {isVendor && channelInfo?.nombre ? ` · ${channelInfo.nombre}` : ""}
              </p>
            </div>
          </div>

          <ul className={styles.cuentaAcciones}>
            <li>
              <button type="button" className={styles.cuentaAccion} onClick={() => setIsPerfilModalOpen(true)}>
                <span className={styles.cuentaAccionIcono} aria-hidden="true"><FiUser /></span>
                Mi perfil
                <FiChevronRight className={styles.cuentaAccionFlecha} aria-hidden="true" />
              </button>
            </li>
            {/* Solo tiene sentido si ya hay una empresa activa para "cambiar"
                — sin eso ya existe el botón "Volver a Inicio" en
                Paso1Cuit/BarraProgreso. */}
            {isVendor && isVinculado && (
              <li>
                <button type="button" className={styles.cuentaAccion} onClick={handleCambiarEmpresa}>
                  <span className={styles.cuentaAccionIcono} aria-hidden="true"><FiRepeat /></span>
                  Cambiar empresa
                  <FiChevronRight className={styles.cuentaAccionFlecha} aria-hidden="true" />
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                className={`${styles.cuentaAccion} ${styles.cuentaAccionPeligro}`}
                onClick={handleLogout}
              >
                <span className={styles.cuentaAccionIcono} aria-hidden="true"><FiLogOut /></span>
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>

        {/* Solo escritorio: alterna entre sidebar expandido y compacto. */}
        <button
          type="button"
          className={styles.toggleCompacto}
          onClick={toggleCompacto}
          aria-label={compacto ? "Expandir menú" : "Contraer menú"}
          title={compacto ? "Expandir menú" : "Contraer menú"}
        >
          <FiSidebar aria-hidden="true" />
          <span className={styles.toggleTexto}>Contraer menú</span>
        </button>

        <p className={styles.versionText}>
          <span className={styles.versionCompleta}>
            Versión {__APP_VERSION__}
            {versionApi && <> · API {versionApi}</>}
          </span>
          <span className={styles.versionCorta}>v{__APP_VERSION__}</span>
        </p>
      </div>

      <PerfilModal isOpen={isPerfilModalOpen} onClose={() => setIsPerfilModalOpen(false)} />

      <ConfirmacionModal
        isOpen={!!pendingPath}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
        titulo="Cambios sin guardar"
        mensaje="Tenés archivos o información que todavía no guardaste en el legajo. Si salís ahora, se pierden."
        tone="warning"
        icono={<FiEdit3 />}
        confirmText="Descartar y salir"
        cancelText="Conservar cambios"
        maxWidth="550px"
      />
    </aside>
  );
}
