import React, { useState, useEffect, useMemo } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { useObtenerDatosSocioLegajo } from "../../../../hooks/useTerceros";
import { useValidacionLegajo } from "../../../../hooks/useValidacionLegajo";
import { useSocioWebPorId, useActualizarSocio } from "../../../../hooks/useSocios";
import { AltaDatosEmpresaSchema } from "../../../../schemas/AltaDatosEmpresaSchema";
import {
  FiExternalLink,
  FiUsers,
  FiChevronDown,
  FiActivity,
  FiEdit2,
  FiMail,
  FiPhone,
  FiFileText,
  FiMapPin,
  FiShare2,
  FiCalendar,
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
import FacturacionModal from "../FacturacionModal/FacturacionModal";
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
  RELACION_FIADOR_ID,
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

  // Se sube acá (antes vivía junto con el resto de socioLegajoData, más
  // abajo) porque tabsDisponibles necesita accionistas.length para decidir
  // fiadorForzado antes de armar las pestañas.
  const queryClient = useQueryClient();
  const { data: socioLegajoData, isLoading: loadingQuery } = useObtenerDatosSocioLegajo(socioIdActivo);
  const accionistas = socioLegajoData?.accionistas || [];

  // Fiador obligatorio forzado (SGRPLUSPLA-137): persona física siempre, o
  // jurídica con un único accionista (SAS/SAU/sociedad unipersonal) - en
  // ambos casos el fiador es una persona DISTINTA del titular/accionista, no
  // un dato opcional que dependa de la parametrización de la cadena. Con 2+
  // accionistas el backend ya los da de alta como fiadores automáticamente
  // (ver AltaOperacion/legajo) y ahí sí aplica la parametrización normal de
  // la cadena (Opcional/Obligatorio/No mostrar, según si el contrato es con
  // o sin fianza).
  const fiadorForzado = esPersonaFisica || accionistas.length === 1;
  const accionistaUnico = !esPersonaFisica && accionistas.length === 1 ? accionistas[0] : null;

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
    const mappedBase = ESTRUCTURA_SOCIOS.filter((t) => t.key !== "usuarios").map((t) => {
      const idConocido = ID_POR_CLAVE_BASE[t.key];
      if (!idConocido) return t; // "perfil" - no es una relación de terceros
      const tituloVivo = descripcionBasePorClave[t.key];
      return tituloVivo ? { ...t, title: tituloVivo } : t;
    });

    // Fiador (SGRPLUSPLA-137) se saca del resto de las relaciones extra y se
    // inserta pegado a "Accionistas" en vez de ir al final con las demás -
    // están directamente relacionados (el fiador es el propio accionista
    // único, o uno de los accionistas cuando son varios). El resto de las
    // relaciones activadas dinámicamente sigue yendo después de las 4 con
    // sección fija, como siempre.
    const fiadorKey = String(RELACION_FIADOR_ID);
    const fiadorTab = tabsExtra.find((t) => t.key === fiadorKey);
    const restoTabsExtra = tabsExtra.filter((t) => t.key !== fiadorKey);
    const indiceAccionistas = mappedBase.findIndex((t) => t.key === "accionistas");

    const conFiadorInsertado = [...mappedBase];
    if (fiadorTab && indiceAccionistas !== -1) {
      conFiadorInsertado.splice(indiceAccionistas + 1, 0, fiadorTab);
    }

    let baseTabs = [
      ...conFiadorInsertado,
      ...restoTabsExtra,
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
    // Filtrar según los requisitos configurados - el Fiador forzado
    // (SGRPLUSPLA-137) ignora "No mostrar": es obligatorio sin importar la
    // parametrización de la cadena.
    return baseTabs.filter(t => {
      if (fiadorForzado && t.key === String(RELACION_FIADOR_ID)) return true;
      const configVal = requisitos?.relaciones?.[t.key];
      return configVal !== 0; // 0 = no mostrar
    });
  }, [esPersonaFisica, requisitos, adminMode, tabsExtra, descripcionBasePorClave, clavesBaseActivas, isLoadingCatalogoActivo, fiadorForzado]);

  const [activeTab, setActiveTab] = useState(null);
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [facturacionModalOpen, setFacturacionModalOpen] = useState(false);

  // El email de facturación se edita acá directo (antes vivía en el Paso 2
  // del alta y en "Mi Perfil" — se sacó de los dos, ver Paso2Datos.jsx y
  // PerfilModal.jsx): reutiliza el mismo FacturacionModal, con un form
  // propio y acotado a este único campo. Nunca se monta en adminMode (la
  // pestaña "perfil" ya se filtra para admin más arriba), así que no hace
  // falta pasarle socioIdOverride acá.
  const { data: socioWebParaFacturacion } = useSocioWebPorId(
    !adminMode ? socioIdActivo : undefined,
  );
  const actualizarSocioMutation = useActualizarSocio();
  const metodosFacturacion = useForm({
    resolver: zodResolver(AltaDatosEmpresaSchema),
    mode: "onTouched",
    defaultValues: { emailfacturacion: emailFacturacion || "" },
  });

  useEffect(() => {
    metodosFacturacion.reset({ emailfacturacion: emailFacturacion || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailFacturacion]);

  const handleGuardarFacturacion = () => {
    const nuevoEmail = metodosFacturacion.getValues("emailfacturacion");
    if (socioWebParaFacturacion && socioIdActivo) {
      actualizarSocioMutation.mutate(
        {
          ...socioWebParaFacturacion,
          socioid: Number(socioIdActivo),
          emailfacturacion: nuevoEmail,
        },
        {
          onSuccess: () => {
            toast.success("Email de facturación actualizado correctamente");
            queryClient.invalidateQueries({
              queryKey: ["sociosWeb", "detalle", Number(socioIdActivo)],
            });
          },
          onError: () => {
            toast.error("No se pudo actualizar", {
              description:
                "Ocurrió un error al guardar el email de facturación. Intentá nuevamente.",
            });
          },
        },
      );
    }
    setFacturacionModalOpen(false);
  };

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
        const esObligatorio =
          requisitos?.relaciones?.[doc.key] === 1 ||
          (fiadorForzado && doc.key === String(RELACION_FIADOR_ID));

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
                  (esObligatorio ? (
                    <span className={`${styles.reqBadge} ${completitudPorTab[doc.key] ? styles.reqBadgeComplete : styles.reqBadgeMandatory}`}>
                      Obligatorio
                    </span>
                  ) : (
                    <span className={`${styles.reqBadge} ${styles.reqBadgeOptional}`}>Opcional</span>
                  ))}
              </div>
              <span
                className={`${styles.statusDot} ${isPerfil ? styles.dotGreen : loadingSocios ? styles.dotLoading : completitudPorTab[doc.key] ? styles.dotGreen : esObligatorio ? styles.dotYellow : styles.dotGray}`}
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
                    pestaña, si la tiene, a la derecha) y la descripción.
                    Perfil corporativo es la excepción: su título y botón de
                    Editar viven DENTRO de la tarjeta (.perfilTopBar, más
                    abajo) en vez de en este header genérico compartido con
                    el resto de las pestañas - separarlos en 2 piezas
                    (header flotando arriba + tarjeta abajo, con su propia
                    descripción repetida) era la pieza que más "plano y
                    desarmado" hacía sentir al panel entero. */}
                {!isPerfil && (
                  <header className={styles.viewerHeader}>
                    <div className={styles.viewerMeta}>
                      <h4 className={styles.viewerTitle} title={tituloTab(doc)}>{tituloTab(doc)}</h4>
                      <div id="socios-header-action-portal" className={styles.headerActionPortal} />
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
                )}

                {isPerfil ? (
                  <div className={styles.perfilPanel}>
                    {/* Rediseño completo (2026-09-14): antes era el header
                        genérico (título+descripción, común a todas las
                        pestañas) flotando arriba + una tarjeta abajo con
                        hero/grilla de campos con un color de etiqueta por
                        grupo (amarillo/celeste/azul) - se leía "plano y
                        sobrecargado de colores". Ahora es UNA sola pieza:
                        título+botón de Editar fusionados como cabecera de
                        la tarjeta (.perfilTopBar), identidad, un bloque de
                        2 datos clave en tiles con valor grande (mismo
                        recurso que un resumen tipo "cliente" de cualquier
                        dashboard fintech: no todo el contenido al mismo
                        peso visual) y una lista de filas simples
                        etiqueta/valor con una sola tonalidad de gris para
                        las etiquetas - el amarillo de marca queda
                        reservado para el avatar y el botón de Editar, no
                        repartido por toda la tarjeta. */}
                    <div className={styles.perfilCard}>
                      <div className={styles.perfilTopBar}>
                        <h4 className={styles.perfilCardTitle}>{tituloTab(doc)}</h4>
                        <button
                          type="button"
                          className={styles.addButton}
                          onClick={() => setPerfilModalOpen(true)}
                        >
                          <FiEdit2 size={14} /> Editar mi perfil
                        </button>
                      </div>

                      <div className={styles.perfilIdentity}>
                        <div className={styles.perfilAvatar}>
                          {(nombreEmpresa || "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.perfilIdentityInfo}>
                          <span className={styles.perfilHeroName}>{nombreEmpresa || "—"}</span>
                          <span className={styles.perfilHeroMeta}>
                            {formatCuit(cuitActivo) || "CUIT no disponible"}
                            {tipoPersonaLabel && <> · {tipoPersonaLabel}</>}
                          </span>
                        </div>
                        {estadoSocioLabel && (
                          <span className={styles.perfilEstadoBadge}>{estadoSocioLabel}</span>
                        )}
                      </div>

                      {/* Los 2 datos de contacto más importantes en tiles con
                          valor grande - el resto (teléfono, ubicación,
                          datos comerciales) baja a la lista simple de
                          abajo. El chip de Editar es una acción de esquina
                          del bloque entero (ver .perfilEditarChip en el
                          CSS), no pegado al valor de facturación - y solo
                          vive acá, no se repite en la lista de abajo. */}
                      <div className={styles.perfilStatGroup}>
                        <span className={styles.perfilStatGroupLabel}>Contacto</span>
                        <div className={styles.perfilStatTiles}>
                          {/* Acción de esquina del contenedor entero (no
                              pegada al valor adentro del tile): mismo
                              patrón que un botón de editar/menú en la
                              esquina de una card de datos - .perfilStatTiles
                              tiene el padding-top de sobra para que no
                              choque con las etiquetas de los tiles. */}
                          <button
                            type="button"
                            className={styles.perfilEditarChip}
                            onClick={() => setFacturacionModalOpen(true)}
                            aria-label="Editar email de facturación"
                          >
                            <FiEdit2 size={11} /> Editar
                          </button>
                          <div className={styles.perfilStatTile}>
                            <span className={styles.perfilStatLabel}><FiMail size={11} /> Email</span>
                            <span
                              className={`${styles.perfilStatValue} ${email ? "" : styles.perfilVacio}`}
                              title={email || undefined}
                            >
                              {email || "—"}
                            </span>
                          </div>
                          <div className={styles.perfilStatTileDivider} />
                          <div className={styles.perfilStatTile}>
                            <span className={styles.perfilStatLabel}><FiFileText size={11} /> Email de facturación</span>
                            <span
                              className={`${styles.perfilStatValue} ${emailFacturacion ? "" : styles.perfilVacio}`}
                              title={emailFacturacion || undefined}
                            >
                              {emailFacturacion || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.perfilRowsList}>
                        <span className={styles.perfilRowsGroupLabel}>Contacto</span>
                        <div className={styles.perfilRow}>
                          <span className={styles.perfilRowLabel}><FiPhone size={11} /> Teléfono</span>
                          <span className={`${styles.perfilRowValue} ${[telefono, telefono2].filter(Boolean).length ? "" : styles.perfilVacio}`}>
                            {[telefono, telefono2].filter(Boolean).join(" / ") || "—"}
                          </span>
                        </div>

                        <span className={styles.perfilRowsGroupLabel}>Ubicación</span>
                        <div className={styles.perfilRow}>
                          <span className={styles.perfilRowLabel}><FiMapPin size={11} /> Dirección</span>
                          <span className={`${styles.perfilRowValue} ${domicilioCompleto ? "" : styles.perfilVacio}`}>{domicilioCompleto || "—"}</span>
                        </div>

                        <span className={styles.perfilRowsGroupLabel}>Datos comerciales</span>
                        <div className={styles.perfilRow}>
                          <span className={styles.perfilRowLabel}><FiUsers size={11} /> Tamaño de empresa</span>
                          <span className={`${styles.perfilRowValue} ${tamanioEmpresaLabel ? "" : styles.perfilVacio}`}>{tamanioEmpresaLabel || "—"}</span>
                        </div>
                        <div className={styles.perfilRow}>
                          <span className={styles.perfilRowLabel}><FiActivity size={11} /> Situación BCRA</span>
                          <span className={`${styles.perfilRowValue} ${situacionBcraLabel ? "" : styles.perfilVacio}`}>{situacionBcraLabel || "—"}</span>
                        </div>
                        <div className={styles.perfilRow}>
                          <span className={styles.perfilRowLabel}><FiShare2 size={11} /> Canal de comercialización</span>
                          <span className={`${styles.perfilRowValue} ${canalComercializacionLabel ? "" : styles.perfilVacio}`}>{canalComercializacionLabel || "—"}</span>
                        </div>
                        <div className={styles.perfilRow}>
                          <span className={styles.perfilRowLabel}><FiCalendar size={11} /> Inicio de actividades</span>
                          <span className={`${styles.perfilRowValue} ${formatFecha(fechaInicioActividades) ? "" : styles.perfilVacio}`}>
                            {formatFecha(fechaInicioActividades) || "—"}
                          </span>
                        </div>
                        <div className={styles.perfilRow}>
                          <span className={styles.perfilRowLabel}><FiCalendar size={11} /> Cierre de ejercicio</span>
                          <span className={`${styles.perfilRowValue} ${formatFecha(fechaCierreEjercicio) ? "" : styles.perfilVacio}`}>
                            {formatFecha(fechaCierreEjercicio) || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
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
                    items={
                      idRelacionExtra === RELACION_FIADOR_ID && accionistaUnico
                        ? // El backend todavía no distingue el caso de accionista
                          // único (pendiente del lado de Victor, SGRPLUSPLA-137):
                          // sigue auto-creando la relación de Fiador apuntando
                          // al mismo tercero que el accionista, que acá no
                          // cuenta como un fiador real. Se oculta ese registro
                          // en vez de mostrarlo como si fuera válido - en
                          // cuanto se carga un fiador de verdad (persona
                          // distinta), ese pasa a ser el único que se ve.
                          (socioLegajoData?.porTipoRelacion?.[doc.key] || []).filter(
                            (p) => Number(p.id) !== Number(accionistaUnico.id),
                          )
                        : socioLegajoData?.porTipoRelacion?.[doc.key] || []
                    }
                    titulo={doc.title}
                    tipoRelacionSocioId={idRelacionExtra}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                    evitarCoincidenciaCon={
                      idRelacionExtra === RELACION_FIADOR_ID && accionistaUnico
                        ? { cuit: accionistaUnico.cuit, email: accionistaUnico.email }
                        : undefined
                    }
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
      <FormProvider {...metodosFacturacion}>
        <FacturacionModal
          isOpen={facturacionModalOpen}
          onClose={() => setFacturacionModalOpen(false)}
          onGuardar={handleGuardarFacturacion}
        />
      </FormProvider>
    </div>
  );
}
