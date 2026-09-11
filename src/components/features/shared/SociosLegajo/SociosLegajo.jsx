import React, { useState, useEffect, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { useObtenerDatosSocioLegajo } from "../../../../hooks/useTerceros";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import {
  FiExternalLink,
  FiUsers,
  FiBriefcase,
  FiChevronDown,
  FiMail,
  FiPhone,
  FiFileText,
  FiMapPin,
  FiActivity,
  FiShare2,
  FiCalendar,
  FiEdit2,
} from "react-icons/fi";
import { toast } from "sonner";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import {
  useTamanioEmpresa,
  useSituacionBCRA,
  useTipoCanalComercializacion,
  useEstadoSocio,
} from "../../../../hooks/useCatalogos";
import { tercerosService } from "../../../../services/tercerosService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import styles from "./SociosLegajo.module.css";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import { PerfilModal } from "../PerfilModal/PerfilModal";
import { AccionistasSection } from "../DocumentosLegajo/components/AccionistasSection/AccionistasSection";
import { RepresentantesSection } from "../DocumentosLegajo/components/RepresentantesSection/RepresentantesSection";
import { ApoderadosSection } from "../DocumentosLegajo/components/ApoderadosSection/ApoderadosSection";
import { AgentesBolsaSection } from "../DocumentosLegajo/components/AgentesBolsaSection/AgentesBolsaSection";
import { VincularUsuarioSection } from "../DocumentosLegajo/components/VincularUsuarioSection/VincularUsuarioSection";
import { TerceroRelacionSection } from "../DocumentosLegajo/components/TerceroRelacionSection/TerceroRelacionSection";
import { useCadenaActiva } from "../../../../hooks/useCadenaActiva";
import { useTiposRelacionSocioActivos } from "../../../../hooks/useTipoRelacionSocio";
import {
  RELACION_APODERADO_ID,
  RELACION_REPRESENTANTE_LEGAL_ID,
  RELACION_AGENTE_BOLSA_ID,
  IDS_RELACIONES_TERCEROS_BASE,
  RELACIONES_TERCEROS_BASE,
} from "../../../../constants/tiposRelacionSocio";
import {
  normalizarCatalogoActivo,
  resolverRelacionesBaseActivas,
} from "../../../../utils/relacionesTercerosUtils";

const ID_POR_CLAVE_BASE = Object.fromEntries(
  RELACIONES_TERCEROS_BASE.map((r) => [r.clave, r.tipoRelacionSocioId]),
);


export const ESTRUCTURA_SOCIOS = [
  {
    category: "Empresa",
    key: "perfil",
    title: "Perfil corporativo",
    info: "Datos identificatorios registrados en la plataforma.",
  },
  {
    category: "Legajo",
    key: "accionistas",
    title: "Composición accionaria",
    info: "Administración del cuadro accionario y participaciones de socios.",
  },
  {
    category: "Legajo",
    key: "representanteLegal",
    title: "Representantes legales",
    info: "Administración de representantes legales habilitados.",
  },
  {
    category: "Legajo",
    key: "apoderados",
    title: "Apoderados",
    info: "Administración de apoderados habilitados para operar en nombre del titular.",
  },
  {
    category: "Legajo",
    key: "agentesBolsa",
    title: "Agentes de bolsa",
    info: "Vinculación y administración de agentes de bolsa y cuentas comitentes.",
  },
  {
    category: "Legajo",
    key: "usuarios",
    title: "Vincular usuarios",
    info: "Otorgá acceso a otros usuarios para operar con esta empresa.",
  },
];

export function SociosLegajo({
  socioIdOverride,
  tipoPersonaIdOverride,
  nombreEmpresaOverride,
  adminMode = false,
  cadenaIdOverride,
} = {}) {
  const empresaActiva = useEmpresaActiva(adminMode);

  const { socioIdActivo, tipoPersonaId, nombreEmpresa } = adminMode
    ? {
        socioIdActivo: socioIdOverride,
        tipoPersonaId: tipoPersonaIdOverride,
        nombreEmpresa: nombreEmpresaOverride,
      }
    : empresaActiva;

  // Datos de la pestaña "Perfil corporativo" (ver más abajo): siempre en
  // false/null en adminMode porque esa pestaña no se muestra ahí (ver
  // exclusión en tabsDisponibles) - useEmpresaActiva(true) ya devuelve estos
  // campos vacíos de por sí, así que no hace falta un ternario como el de
  // arriba.
  const {
    cuitActivo,
    direccion,
    numero,
    piso,
    departamento,
    partido,
    codigoPostal,
    email,
    emailFacturacion,
    telefono,
    telefono2,
    fechaCierreEjercicio,
    fechaInicioActividades,
    tamanioEmpresaId,
    situacionBcraId,
    tipoCanalComercializacionId,
    socioEstadoId,
  } = empresaActiva;

  // No hay un campo CadenaValorID en Socio: en modo admin la cadena llega ya
  // detectada desde afuera (EmpresaDetalle.jsx la infiere del historial de
  // CDAs del socio, ver detectarCadenaValorId). Sin detección, useRequisitos
  // cae solo al fallback por tipo de persona/sociedad (ver mismo criterio en
  // DocumentosLegajo).
  const { cadenaSlug } = useCadenaActiva();
  const cadenaId = adminMode ? Number(cadenaIdOverride) || null : Number(cadenaSlug) || 1;
  const { requisitos } = useRequisitos(cadenaId, tipoPersonaId, nombreEmpresa);

  // Reutiliza la misma validación que ya decide si el legajo está completo,
  // para no duplicar el criterio (ver useValidacionLegajo para el manejo de
  // adminMode).
  const {
    accionistasCompletos,
    apoderadosCompletos,
    representanteLegalCompletos,
    agentesBolsaCompletos,
    completitudPorRelacionExtra,
  } = useValidacionLegajo({
    adminMode,
    socioIdActivo,
    tipoPersonaId,
    nombreEmpresa,
    cadenaId,
  });

  const completitudPorTab = {
    accionistas: accionistasCompletos,
    representanteLegal: representanteLegalCompletos,
    apoderados: apoderadosCompletos,
    agentesBolsa: agentesBolsaCompletos,
    ...completitudPorRelacionExtra,
  };

  const esPersonaFisica = Number(tipoPersonaId) === 1;
  const tituloTab = (doc) => doc.title;
  const infoTab = (doc) => doc.info;

  // Datos para el panel de "Perfil corporativo" (ver render más abajo) -
  // mismos catálogos/helpers que antes vivían en DocumentosLegajo.jsx,
  // trasladados acá junto con la pestaña.
  const { data: tamaniosEmpresa } = useTamanioEmpresa();
  const { data: situacionesBcra } = useSituacionBCRA();
  const { data: canalesComercializacion } = useTipoCanalComercializacion();
  const { data: estadosSocio } = useEstadoSocio();

  const resolverLabel = (opciones, id) => {
    if (id === undefined || id === null || Number(id) === 0) return null;
    const encontrada = (opciones || []).find((o) => o.value === String(id));
    return encontrada?.label || null;
  };

  const formatCuit = (cuit) => {
    const digitos = String(cuit || "").replace(/\D/g, "");
    if (digitos.length !== 11) return cuit || null;
    return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return null;
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(d);
  };

  const tamanioEmpresaLabel = resolverLabel(tamaniosEmpresa?.opciones, tamanioEmpresaId);
  const situacionBcraLabel = resolverLabel(situacionesBcra?.opciones, situacionBcraId);
  const canalComercializacionLabel = resolverLabel(
    canalesComercializacion?.opciones,
    tipoCanalComercializacionId,
  );
  const estadoSocioLabel = resolverLabel(estadosSocio?.opciones, socioEstadoId);

  const tipoPersonaLabel = esPersonaFisica
    ? "Persona Física"
    : Number(tipoPersonaId) === 10
      ? "Persona Jurídica"
      : null;

  const domicilioCompleto = useMemo(() => {
    const calleNumero = [direccion, numero].filter(Boolean).join(" ");
    const pisoDepto = [piso && `Piso ${piso}`, departamento && `Depto ${departamento}`]
      .filter(Boolean)
      .join(" ");
    return (
      [calleNumero, pisoDepto, partido, codigoPostal && `CP ${codigoPostal}`]
        .filter(Boolean)
        .join(", ") || null
    );
  }, [direccion, numero, piso, departamento, partido, codigoPostal]);

  // Ninguna de las 4 relaciones con pestaña propia de siempre (accionista/
  // representante legal/apoderado/agente de bolsa) se asume disponible: se
  // arman acá desde lo que el admin efectivamente activó en
  // /admin/tipos-relacion-socio (ver resolverRelacionesBaseActivas). Un
  // ambiente que todavía no cargó ninguna (ej. desa recién levantado) no
  // muestra esas pestañas - quedan vacías, no rotas. Mientras el catálogo
  // no terminó de cargar se las deja ver con el título estático de siempre
  // en vez de ocultarlas de golpe (evita el parpadeo típico de "aparece y
  // después desaparece" en el caso normal, donde sí están activadas).
  const { data: catalogoActivosData, isLoading: isLoadingCatalogoActivo } =
    useTiposRelacionSocioActivos();

  const catalogoActivo = useMemo(
    () => normalizarCatalogoActivo(catalogoActivosData),
    [catalogoActivosData],
  );

  const relacionesBaseActivas = useMemo(
    () => resolverRelacionesBaseActivas(catalogoActivo),
    [catalogoActivo],
  );
  // Ojo: `descripcionBasePorClave[clave]` puede ser `undefined` con la
  // clave igual presente (ej. Accionista sin activar en el catálogo, pero
  // siempre disponible - ver resolverRelacionesBaseActivas) - por eso la
  // disponibilidad se chequea contra este Set, nunca contra la verdad de la
  // descripción.
  const clavesBaseActivas = useMemo(
    () => new Set(relacionesBaseActivas.map((r) => r.clave)),
    [relacionesBaseActivas],
  );
  const descripcionBasePorClave = useMemo(
    () => Object.fromEntries(relacionesBaseActivas.map((r) => [r.clave, r.descripcion])),
    [relacionesBaseActivas],
  );

  // Cualquier relación que el admin haya activado más allá de las 4 de
  // siempre se agrega acá como pestaña extra con TerceroRelacionSection -
  // siempre ANTES de "Vincular usuarios" (ver el splice más abajo), que
  // tiene que quedar última pase lo que pase.
  const tabsExtra = useMemo(() => {
    return catalogoActivo
      .filter((item) => !IDS_RELACIONES_TERCEROS_BASE.includes(item.id))
      .map((item) => ({
        category: "Legajo",
        key: String(item.id),
        title: item.descripcion || `Relación #${item.id}`,
        info: `Administración de "${item.descripcion || `Relación #${item.id}`}" habilitados para esta empresa.`,
      }));
  }, [catalogoActivo]);

  const tabsDisponibles = useMemo(() => {
    const usuariosTab = ESTRUCTURA_SOCIOS.find((t) => t.key === "usuarios");
    let baseTabs = [
      ...ESTRUCTURA_SOCIOS.filter((t) => t.key !== "usuarios").map((t) => {
        const idConocido = ID_POR_CLAVE_BASE[t.key];
        if (!idConocido) return t; // "perfil" - no es una relación de terceros
        const tituloVivo = descripcionBasePorClave[t.key];
        return tituloVivo ? { ...t, title: tituloVivo } : t;
      }),
      ...tabsExtra,
      ...(usuariosTab ? [usuariosTab] : []),
    ];
    // "Perfil corporativo" es solo informativo para el cliente: en el panel
    // admin esos mismos datos ya se editan desde EmpresaDetalle.jsx.
    if (adminMode) {
      baseTabs = baseTabs.filter(t => t.key !== "perfil");
    }
    if (esPersonaFisica) {
      // Persona Física no tiene Representante Legal (230) - solo Apoderado
      // (210, ver tab "apoderados" más abajo), ni Accionistas (no puede ser
      // accionista de sí misma).
      baseTabs = baseTabs.filter(t => t.key !== "accionistas" && t.key !== "representanteLegal");
    }
    // Solo se muestra una relación base si el admin la activó en el
    // catálogo curado - mientras esa consulta sigue en curso se la deja
    // pasar (ver comentario más arriba).
    if (!isLoadingCatalogoActivo) {
      baseTabs = baseTabs.filter((t) => {
        const idConocido = ID_POR_CLAVE_BASE[t.key];
        return !idConocido || clavesBaseActivas.has(t.key);
      });
    }
    // Filtrar según los requisitos configurados
    return baseTabs.filter(t => {
      const configVal = requisitos?.relaciones?.[t.key];
      return configVal !== 0; // 0 = no mostrar
    });
  }, [esPersonaFisica, requisitos, adminMode, tabsExtra, descripcionBasePorClave, clavesBaseActivas, isLoadingCatalogoActivo]);

  const [activeTab, setActiveTab] = useState(null);
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);

  useEffect(() => {
    if (tabsDisponibles.length > 0) {
      const isMobile = window.innerWidth <= 768;
      if (!isMobile && !activeTab) {
        setActiveTab(tabsDisponibles[0].key);
      } else if (activeTab && !tabsDisponibles.some(t => t.key === activeTab)) {
        setActiveTab(isMobile ? null : tabsDisponibles[0].key);
      }
    }
  }, [tabsDisponibles, activeTab]);

  const queryClient = useQueryClient();
  const { data: socioLegajoData, isLoading: loadingQuery } = useObtenerDatosSocioLegajo(socioIdActivo);

  const accionistas = socioLegajoData?.accionistas || [];
  // socioLegajoData.representantes junta Representante Legal (230) y
  // Apoderado (210, ver useObtenerDatosSocioLegajo) - cada pestaña se
  // queda solo con lo suyo.
  const representantesYApoderados = socioLegajoData?.representantes || [];
  const representantes = representantesYApoderados.filter((r) => Number(r.rolId) === RELACION_REPRESENTANTE_LEGAL_ID);
  const apoderados = representantesYApoderados.filter((r) => Number(r.rolId) === RELACION_APODERADO_ID);
  const agentesBolsa = socioLegajoData?.agentesBolsa || [];

  // `actualizando` cubre la ventana entre "se guardó algo" y "las queries ya
  // refetchearon de verdad" — antes, la modal (SocioAccionistaModal/
  // RepresentanteModal) cerraba apenas terminaba el guardado y la card de la
  // persona seguía mostrando el estado viejo un instante (ej. recién
  // guardado seguía en "incompleto", o el DNI recién subido no aparecía al
  // reabrir "Editar") hasta que algo más disparara otro refetch. Se
  // reutiliza el mismo loader de "Cargando composición accionaria/etc." que
  // ya usan las secciones (ver loadingSocios más abajo) en vez de bloquear
  // el cierre de la modal — así, aunque el refresh tarde, siempre queda
  // claro para el usuario que algo sigue en curso.
  const [actualizando, setActualizando] = useState(false);
  const loadingSocios = loadingQuery || actualizando;

  const [archivosBackend, setArchivosBackend] = useState([]);
  const [dniTerceros] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  // Se espera (await) a que las 3 invalidaciones Y el refetch local de
  // archivos terminen de verdad, no solo a que arranquen: invalidateQueries
  // devuelve una promesa que resuelve recién cuando el refetch en curso
  // completa.
  const cargarSocios = async () => {
    setActualizando(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["socioLegajoCompleto", socioIdActivo] }),
        queryClient.invalidateQueries({ queryKey: ["socioArchivos", socioIdActivo] }),
        // Sin esto, la card de accionistas/representantes/apoderados (y el
        // gate de isValid de useValidacionLegajo) siguen mostrando el estado
        // CDA viejo hasta que algo más invalide esta query a mano — ver
        // useEstadoCdaTerceros. Coincide con el prefijo de TODAS las
        // variantes de idsKey (invalidateQueries matchea por prefijo).
        queryClient.invalidateQueries({ queryKey: ["terceros", "estadoCdaBulk"] }),
        cargarArchivosExistentes(),
      ]);
    } finally {
      setActualizando(false);
    }
  };

  const cargarArchivosExistentes = async () => {
    if (!socioIdActivo) return;
    try {
      const archivos = await socioArchivoService.obtenerArchivos(socioIdActivo);
      if (Array.isArray(archivos)) {
        setArchivosBackend(archivos);
      }
    } catch (err) {
      console.error("Error cargando archivos del legajo:", err);
    }
  };

  useEffect(() => {
    cargarArchivosExistentes();
  }, [socioIdActivo]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && !activeTab && tabsDisponibles.length > 0) {
        setActiveTab(tabsDisponibles[0]?.key);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, tabsDisponibles]);

  const totalParticipacion = useMemo(() => {
    const sum = accionistas.reduce((a, s) => a + Number(s.participacion || 0), 0);
    return Number(sum.toFixed(2));
  }, [accionistas]);

  const handleEliminarRelacion = (item) => {
    setDeleteTarget(item);
  };

  const handleConfirmEliminar = async () => {
    if (!deleteTarget) return;
    setLoadingDelete(true);
    const item = deleteTarget;
    const isBolsa = item.rolId === RELACION_AGENTE_BOLSA_ID;

    try {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = ayer.toISOString().split(".")[0];

      const payload = {
        ...item.relacion,
        fechahasta: ayerStr,
        FechaHasta: ayerStr,
      };
      await tercerosService.actualizarRelacionDeSocio(payload);
      toast.success(
        isBolsa
          ? "Agente de bolsa desvinculado exitosamente."
          : "Registro eliminado exitosamente del legajo.",
      );
      await cargarSocios();
      setDeleteTarget(null);
    } catch (err) {
      console.error("[LEGAJO] Error al eliminar relación:", err);
      toast.error("Ocurrió un error al procesar la desvinculación.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className={styles.workspace}>
      <div className={styles.sidebarBg} />
      {tabsDisponibles.map((doc, index) => {
        const isNewCategory =
          index === 0 ||
          doc.category !== tabsDisponibles[index - 1].category;
        const isActive = activeTab === doc.key;

        const isPerfil = doc.key === "perfil";
        const isAccionistas = doc.key === "accionistas";
        const isRepresentantes = doc.key === "representanteLegal";
        const isApoderados = doc.key === "apoderados";
        const isAgentesBolsa = doc.key === "agentesBolsa";
        const isUsuarios = doc.key === "usuarios";
        // Cualquier otra clave es un TipoRelacionSocioID activado
        // dinámicamente (ver tabsExtra más arriba).
        const idRelacionExtra = Number(doc.key);
        const isExtra = Number.isInteger(idRelacionExtra) && idRelacionExtra > 0;

        return (
          <React.Fragment key={doc.key}>
            {isNewCategory && (
              <p className={styles.categoryLabel}>{doc.category}</p>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setActiveTab((prev) => (prev === doc.key ? null : doc.key));
                } else {
                  setActiveTab(doc.key);
                }
              }}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
            >
              {isActive && <span className={styles.activeBar} />}
              <div className={styles.tabTitleGroup}>
                <span className={styles.tabTitle} title={tituloTab(doc)}>{tituloTab(doc)}</span>
                {!isPerfil &&
                  (requisitos?.relaciones?.[doc.key] === 1 ? (
                    <span className={`${styles.reqBadge} ${completitudPorTab[doc.key] ? styles.reqBadgeComplete : styles.reqBadgeMandatory}`}>
                      Obligatorio
                    </span>
                  ) : (
                    <span className={`${styles.reqBadge} ${styles.reqBadgeOptional}`}>Opcional</span>
                  ))}
              </div>
              <span
                className={`${styles.statusDot} ${isPerfil ? styles.dotGreen : loadingSocios ? styles.dotLoading : completitudPorTab[doc.key] ? styles.dotGreen : requisitos?.relaciones?.[doc.key] === 1 ? styles.dotYellow : styles.dotGray}`}
              />
              <FiChevronDown
                className={styles.mobileChevron}
                style={{
                  transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  color: isActive ? "var(--white)" : "var(--text-muted)",
                  fontSize: "1.1rem"
                }}
              />
            </button>

            {isActive && (
              <section className={styles.viewer}>
                {/* La categoría ("Legajo") y el nombre de la pestaña ya se ven
                    resaltados en el botón activo del sidebar, a centímetros de
                    acá: repetirlos como badge + título aparte era puro relleno
                    visual. Se deja solo el título (con la acción propia de la
                    pestaña, si la tiene, a la derecha) y la descripción. */}
                <header className={styles.viewerHeader}>
                  <div className={styles.viewerMeta}>
                    <h4 className={styles.viewerTitle} title={tituloTab(doc)}>{tituloTab(doc)}</h4>
                    <div id="socios-header-action-portal" className={styles.headerActionPortal}>
                      {isPerfil && (
                        <button
                          type="button"
                          className={styles.addButton}
                          onClick={() => setPerfilModalOpen(true)}
                        >
                          <FiEdit2 size={14} /> Editar mi perfil
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={styles.viewerInfo}>
                    {infoTab(doc)}
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.helperLink} ${adminMode ? styles.helperLinkAdmin : ""}`}
                      >
                        {doc.linkText} <FiExternalLink size={11} />
                      </a>
                    )}
                  </p>
                </header>

                {isPerfil ? (
                  <div className={styles.perfilPanel}>
                    <div className={`${styles.perfilHero} ${styles.glassCard} ${adminMode ? styles.perfilHeroAdmin : ""}`}>
                      <div className={`${styles.perfilAvatar} ${adminMode ? styles.perfilAvatarAdmin : ""}`}>
                        {(nombreEmpresa || "?").trim().charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.perfilHeroInfo}>
                        <span className={styles.perfilHeroName}>{nombreEmpresa || "—"}</span>
                        <span className={styles.perfilHeroMeta}>
                          <span className={styles.perfilCuitChip}>
                            {formatCuit(cuitActivo) || "CUIT no disponible"}
                          </span>
                          {tipoPersonaLabel && (
                            <span className={styles.perfilHeroTipo}>{tipoPersonaLabel}</span>
                          )}
                        </span>
                      </div>
                      {estadoSocioLabel && (
                        <span className={`${styles.perfilEstadoBadge} ${adminMode ? styles.perfilEstadoBadgeAdmin : ""}`}>
                          {estadoSocioLabel}
                        </span>
                      )}
                    </div>

                    {/* Antes eran 3 cards separadas (Contacto/Domicilio/Datos
                        comerciales), cada una con su propio padding y título -
                        en full HD eso forzaba scroll dentro del panel. Una
                        sola card con los 8 campos en grilla ocupa menos de la
                        mitad de alto y sigue siendo igual de escaneable
                        (cada campo ya tiene su propia etiqueta).
                        Los 3 grupos comparten una única grilla (antes cada
                        uno tenía su propio <dl> con auto-fit, así que el
                        ancho de columna se recalculaba por separado y las
                        filas no quedaban alineadas entre sí - un grupo de 3
                        campos se veía más "ancho" que uno de 5). Con una
                        sola grilla, el ancho de columna es el mismo para
                        toda la card; el rótulo de cada grupo ocupa la fila
                        completa y fuerza el corte de línea, sin perder la
                        alineación. */}
                    <section className={`${styles.perfilSection} ${styles.glassCard}`}>
                      <h5 className={styles.perfilSectionTitle}>
                        <span className={`${styles.perfilSectionIcon} ${adminMode ? styles.perfilSectionIconAdmin : ""}`}>
                          <FiBriefcase size={13} />
                        </span>
                        Información de la empresa
                      </h5>
                      <dl className={styles.perfilRowsGrid}>
                        <div className={styles.perfilGroupLabel}>Contacto</div>
                        <div className={styles.perfilContactoRow}>
                          <div className={styles.perfilCelda}>
                            <dt className={styles.dtContacto}><FiMail size={12} /> Email</dt>
                            <dd className={email ? "" : styles.perfilVacio}>{email || "—"}</dd>
                          </div>
                          <div className={styles.perfilCelda}>
                            <dt className={styles.dtContacto}><FiPhone size={12} /> Teléfono</dt>
                            <dd className={[telefono, telefono2].filter(Boolean).length ? "" : styles.perfilVacio}>
                              {[telefono, telefono2].filter(Boolean).join(" / ") || "—"}
                            </dd>
                          </div>
                          <div className={styles.perfilCelda}>
                            <dt className={styles.dtContacto}><FiFileText size={12} /> Email de facturación</dt>
                            <dd className={emailFacturacion ? "" : styles.perfilVacio}>{emailFacturacion || "—"}</dd>
                          </div>
                        </div>

                        <div className={styles.perfilGroupLabel}>Ubicación</div>
                        <div className={`${styles.perfilCelda} ${styles.perfilCeldaFull}`}>
                          <dt className={styles.dtUbicacion}><FiMapPin size={12} /> Dirección</dt>
                          <dd className={domicilioCompleto ? "" : styles.perfilVacio}>{domicilioCompleto || "—"}</dd>
                        </div>

                        <div className={styles.perfilGroupLabel}>Datos comerciales</div>
                        <div className={styles.perfilCelda}>
                          <dt className={styles.dtComercial}><FiUsers size={12} /> Tamaño de empresa</dt>
                          <dd className={tamanioEmpresaLabel ? "" : styles.perfilVacio}>{tamanioEmpresaLabel || "—"}</dd>
                        </div>
                        <div className={styles.perfilCelda}>
                          <dt className={styles.dtComercial}><FiActivity size={12} /> Situación BCRA</dt>
                          <dd className={situacionBcraLabel ? "" : styles.perfilVacio}>{situacionBcraLabel || "—"}</dd>
                        </div>
                        <div className={styles.perfilCelda}>
                          <dt className={styles.dtComercial}><FiShare2 size={12} /> Canal de comercialización</dt>
                          <dd className={canalComercializacionLabel ? "" : styles.perfilVacio}>{canalComercializacionLabel || "—"}</dd>
                        </div>
                        <div className={styles.perfilCelda}>
                          <dt className={styles.dtComercial}><FiCalendar size={12} /> Inicio de actividades</dt>
                          <dd className={formatFecha(fechaInicioActividades) ? "" : styles.perfilVacio}>
                            {formatFecha(fechaInicioActividades) || "—"}
                          </dd>
                        </div>
                        <div className={styles.perfilCelda}>
                          <dt className={styles.dtComercial}><FiCalendar size={12} /> Cierre de ejercicio</dt>
                          <dd className={formatFecha(fechaCierreEjercicio) ? "" : styles.perfilVacio}>
                            {formatFecha(fechaCierreEjercicio) || "—"}
                          </dd>
                        </div>
                      </dl>
                    </section>
                  </div>
                ) : isUsuarios ? (
                  <VincularUsuarioSection socioIdActivo={socioIdActivo} />
                ) : isAccionistas ? (
                  <AccionistasSection
                    loadingSocios={loadingSocios}
                    totalParticipacion={totalParticipacion}
                    accionistas={accionistas}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                    archivosBackend={archivosBackend}
                    dniTerceros={dniTerceros}
                  />
                ) : isRepresentantes ? (
                  <RepresentantesSection
                    loadingSocios={loadingSocios}
                    representantes={representantes}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                  />
                ) : isApoderados ? (
                  <ApoderadosSection
                    loadingSocios={loadingSocios}
                    apoderados={apoderados}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                  />
                ) : isAgentesBolsa ? (
                  <AgentesBolsaSection
                    loadingSocios={loadingSocios}
                    agentesBolsa={agentesBolsa}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                  />
                ) : isExtra ? (
                  <TerceroRelacionSection
                    loadingSocios={loadingSocios}
                    items={socioLegajoData?.porTipoRelacion?.[doc.key] || []}
                    titulo={doc.title}
                    tipoRelacionSocioId={idRelacionExtra}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                  />
                ) : null}
              </section>
            )}
          </React.Fragment>
        );
      })}
      <ConfirmacionModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmEliminar}
        titulo={
          deleteTarget?.rolId === RELACION_AGENTE_BOLSA_ID
            ? "Desvincular Agente"
            : "Eliminar del legajo"
        }
        mensaje={
          deleteTarget?.rolId === RELACION_AGENTE_BOLSA_ID
            ? `¿Está seguro de que desea desvincular al Agente de Bolsa ${deleteTarget?.nombre}?`
            : `¿Está seguro de que desea eliminar a ${deleteTarget?.nombre} del legajo?`
        }
        tone="danger"
        confirmText={deleteTarget?.rolId === RELACION_AGENTE_BOLSA_ID ? "Desvincular" : "Eliminar"}
        isLoading={loadingDelete}
      />
      <PerfilModal
        isOpen={perfilModalOpen}
        onClose={() => setPerfilModalOpen(false)}
      />
    </div>
  );
}
