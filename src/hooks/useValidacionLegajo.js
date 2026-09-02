import { useQuery } from "@tanstack/react-query";

import { useEmpresaActiva } from "./useEmpresaActiva";
import { useRequisitos } from "./useRequisitos";
import { useObtenerDatosSocioLegajo, useEstadoCdaTerceros } from "./useTerceros";
import { socioArchivoService } from "../services/socioArchivoService";
import { useCadenaActiva } from "./useCadenaActiva";


const DOCUMENT_TITLES = {
  estatuto: "Estatuto Social",
  balance: "Balance de Sumas y Saldos",
  ddjjIva: "DDJJ de IVA",
  cartasDocumento: "Cartas Documento",
  poderes: "Poderes",
  certificadoPyme: "Certificado de PyME",
  otrosDocumentos: "Otros documentos",
  eecc: "Estados Contables (EECC)",
  actaDesignacion: "Acta de Designación de Autoridades",
  actaSocios: "Acta de Reunión de Socios",
  f1272: "Formulario F1272",
  ddjjGanancias: "DDJJ de Ganancias",
  manifestacionBienes: "Manifestación de Bienes",
  constanciaMonotributo: "Constancia de Monotributo",
};

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

// Criterio de contacto + domicilio + CUIT valido, compartido por las 3
// personas del legajo (accionista, representante legal, apoderado).
// `etiqueta` solo cambia el texto del error. El DNI frente/dorso queda
// aparte (ver requiereDni): solo Accionista lo pide, porque es el unico de
// los tres cuyo modal (SocioAccionistaModal) tiene forma de cargarlo -
// Representante Legal y Apoderado no tienen esa seccion, asi que pedirselo
// era un requisito imposible de cumplir.
const validarContactoDomicilioYDni = (persona, archivosBackend, etiqueta, { requiereDni = true } = {}) => {
  const errores = [];
  const sEmail = persona.email || persona.mail || persona.Mail || "";
  const sCel = persona.celular || persona.telefono || persona.Telefono || "";
  const sDir = persona.direccion || persona.calle || "";
  const sProv = persona.provincia || persona.provinciaid || "";

  if (!sEmail || !sCel || !sDir || !sProv) {
    errores.push(`El ${etiqueta} ${persona.nombre} tiene datos de contacto o domicilio incompletos.`);
  }

  const cuitLimpio = String(persona.cuit || "").replace(/\D/g, "");
  if (!cuitLimpio) {
    errores.push(`El ${etiqueta} ${persona.nombre} no posee CUIT válido.`);
  } else if (requiereDni) {
    const nombreNorm = normalizarTexto(persona.nombre);

    const tieneDniFrente = archivosBackend.some((a) => {
      if (a.tipodocumentoarchivoid !== 8) return false;
      const descNorm = normalizarTexto(a.descripcion);
      return descNorm.includes(cuitLimpio) || (nombreNorm && descNorm.includes(nombreNorm));
    });

    const tieneDniDorso = archivosBackend.some((a) => {
      if (a.tipodocumentoarchivoid !== 9) return false;
      const descNorm = normalizarTexto(a.descripcion);
      return descNorm.includes(cuitLimpio) || (nombreNorm && descNorm.includes(nombreNorm));
    });

    if (!tieneDniFrente || !tieneDniDorso) {
      const faltantes = [];
      if (!tieneDniFrente) faltantes.push("DNI Frente");
      if (!tieneDniDorso) faltantes.push("DNI Dorso");
      errores.push(`El ${etiqueta} ${persona.nombre} no tiene cargado: ${faltantes.join(" y ")}.`);
    }
  }

  return errores;
};

// En modo admin (EmpresaDetalle.jsx) no hay ni usuario logueado como cliente
// ni :cadenaSlug en la ruta, así que socioIdActivo/tipoPersonaId/nombreEmpresa
// y la cadena de valor se reciben ya resueltos (la cadena se detecta del
// historial de CDAs del socio, ver detectarCadenaValorId en utils/executeCda.js)
// en vez de salir de useEmpresaActiva/useParams.
export const useValidacionLegajo = ({
  adminMode = false,
  socioIdActivo: socioIdOverride,
  tipoPersonaId: tipoPersonaIdOverride,
  nombreEmpresa: nombreEmpresaOverride,
  cadenaId: cadenaIdOverride,
} = {}) => {
  const empresaActiva = useEmpresaActiva(adminMode);
  const { cadenaSlug } = useCadenaActiva();

  const socioIdActivo = adminMode ? socioIdOverride : empresaActiva.socioIdActivo;
  const tipoPersonaId = adminMode ? tipoPersonaIdOverride : empresaActiva.tipoPersonaId;
  const nombreEmpresa = adminMode ? nombreEmpresaOverride : empresaActiva.nombreEmpresa;
  const cadenaId = adminMode ? Number(cadenaIdOverride) || null : Number(cadenaSlug) || 1;

  const { requisitos, isLoading: loadingRequisitos } = useRequisitos(
    cadenaId,
    tipoPersonaId,
    nombreEmpresa
  );

  const { data: socioLegajoData, isLoading: loadingLegajo } =
    useObtenerDatosSocioLegajo(socioIdActivo);

  // Un accionista/representante/apoderado con el CDA rechazado no cuenta
  // como completo (ver más abajo) — el legajo queda inválido hasta que se
  // reejecute y pase, momento en el cual LegajoUniversalBar migra solo.
  const { data: estadoCdaMap, isLoading: loadingEstadoCda } = useEstadoCdaTerceros([
    ...(socioLegajoData?.accionistas || []).map((a) => a.id),
    ...(socioLegajoData?.representantes || []).map((r) => r.id),
  ]);

  const { data: archivosBackend = [], isLoading: loadingArchivos } = useQuery({
    queryKey: ["socioArchivos", socioIdActivo],
    queryFn: () => socioArchivoService.obtenerArchivos(socioIdActivo),
    enabled: !!socioIdActivo,
    staleTime: 1000 * 60 * 5,
  });

  // ⚠️ loadingEstadoCda tiene que estar acá: si no, cuando socioLegajoData
  // refresca (ej. se acaba de agregar un accionista) pero el estado CDA de
  // ese tercero todavía no llegó, isValid puede computar en `true` con un
  // mapa incompleto (el nuevo tercero no figura como "rechazado" porque
  // todavía no se sabe nada de él) — eso alcanzó a disparar la migración
  // automática de LegajoUniversalBar antes de que la card se pintara de
  // rojo. Confirmado en vivo (2026-08-07).
  const isLoading = loadingRequisitos || loadingLegajo || loadingArchivos || loadingEstadoCda;

  if (isLoading || !requisitos) {
    return {
      isValid: false,
      errores: [],
      totalRequisitos: 0,
      requisitosCompletados: 0,
      isLoading: true,
      cadenaId,
    };
  }

  const errores = [];
  const erroresDocumentos = [];
  const erroresLegajo = [];
  let totalRequisitos = 0;
  let totalDocumentosObligatorios = 0;
  let totalLegajoObligatorios = 0;
  let requisitosCompletados = 0;

  // 1. Validar documentos obligatorios (valor === 1)
  if (requisitos.documentos) {
    Object.entries(requisitos.documentos).forEach(([key, val]) => {
      if (val === 1) {
        totalRequisitos++;
        totalDocumentosObligatorios++;
        const tipoId = socioArchivoService.TIPO_DOCUMENTO_MAP[key];
        const tieneDoc = archivosBackend.some(
          (a) => a.tipodocumentoarchivoid === tipoId
        );

        if (tieneDoc) {
          requisitosCompletados++;
        } else {
          const docTitle = DOCUMENT_TITLES[key] || key;
          const msg = `Falta subir el documento obligatorio: ${docTitle}.`;
          errores.push(msg);
          erroresDocumentos.push(msg);
        }
      }
    });
  }

  // Completitud por sección de relaciones, expuesta para que el badge
  // "Obligatorio" de SociosLegajo pase a verde cuando ya no falta nada
  // (mismo criterio que el badge de documentos en DocumentosLegajo).
  let accionistasCompletos = false;
  let apoderadosCompletos = false;
  let representanteLegalCompletos = false;
  let agentesBolsaCompletos = false;

  // 2. Validar relaciones obligatorias (valor === 1)
  if (requisitos.relaciones) {
    const accionistas = socioLegajoData?.accionistas || [];
    const representantes = socioLegajoData?.representantes || [];
    const agentesBolsa = socioLegajoData?.agentesBolsa || [];

    // Accionistas: no aplica estructuralmente a Persona Física (una persona
    // no puede ser accionista de sí misma). Se ignora este requisito para
    // tipoPersonaId=1 sin importar lo que diga la configuración de la
    // cadena — evita que un dato mal guardado (Requerimiento=1 para
    // TipoPersonaID=1) deje a una persona física bloqueada pidiendo un dato
    // que ni siquiera tiene dónde completar (la pestaña de accionistas no
    // se muestra para física, ver tabsDisponibles en SociosLegajo).
    if (requisitos.relaciones.accionistas === 1 && Number(tipoPersonaId) !== 1) {
      totalRequisitos++;
      totalLegajoObligatorios++;
      let accionistasValidos = true;
      const erroresAccionistas = [];

      if (accionistas.length === 0) {
        accionistasValidos = false;
        erroresAccionistas.push("Debe registrar la composición accionaria (Accionistas).");
      } else {
        // Un accionista con el CDA rechazado no cuenta para la sumatoria
        // (queda "afuera" hasta que se reejecute y pase) — ver
        // AccionistasSection, que lo muestra en rojo.
        const accionistasRechazados = accionistas.filter(
          (s) => estadoCdaMap?.get(Number(s.id)) === "rechazado"
        );

        // Validar participación = 100%
        const totalParticipacion = Number(
          accionistas
            .filter((s) => estadoCdaMap?.get(Number(s.id)) !== "rechazado")
            .reduce((acc, s) => acc + Number(s.participacion || 0), 0)
            .toFixed(2)
        );

        if (totalParticipacion !== 100) {
          accionistasValidos = false;
          erroresAccionistas.push(
            `La sumatoria de las participaciones de los accionistas debe ser exactamente 100% (actual: ${totalParticipacion}%).`
          );
        }

        if (accionistasRechazados.length > 0) {
          accionistasValidos = false;
          accionistasRechazados.forEach((s) => {
            erroresAccionistas.push(
              `El accionista ${s.nombre} no pasó los Criterios de Aceptación — un administrador debe reintentarlo.`
            );
          });
        }

        // Validar datos de contacto, domicilio, CUIT y DNI para cada accionista
        accionistas.forEach((socio) => {
          const erroresSocio = validarContactoDomicilioYDni(socio, archivosBackend, "accionista");
          if (erroresSocio.length > 0) {
            accionistasValidos = false;
            erroresAccionistas.push(...erroresSocio);
          }
        });
      }

      accionistasCompletos = accionistasValidos;
      if (accionistasValidos) {
        requisitosCompletados++;
      } else {
        errores.push(...erroresAccionistas);
        erroresLegajo.push(...erroresAccionistas);
      }
    }

    // Apoderado (TipoRelacionSocioID 210) - aplica tanto a Persona Física
    // como Jurídica. Antes se validaba junto con Representante Legal bajo
    // una sola clave "representantes"; ahora son requisitos independientes
    // (ver requisitosService.js).
    const esFisica = Number(tipoPersonaId) === 1;
    const apoderados = representantes.filter((r) => Number(r.rolId) === 210);
    if (requisitos.relaciones.apoderados === 1) {
      totalRequisitos++;
      totalLegajoObligatorios++;
      let apoderadosValidos = true;
      const erroresApoderados = [];

      if (apoderados.length === 0) {
        apoderadosValidos = false;
        erroresApoderados.push("Debe registrar al menos un Apoderado.");
      } else {
        apoderados.forEach((rep) => {
          const erroresRep = validarContactoDomicilioYDni(rep, archivosBackend, "apoderado", { requiereDni: false });
          if (erroresRep.length > 0) {
            apoderadosValidos = false;
            erroresApoderados.push(...erroresRep);
          }
          if (estadoCdaMap?.get(Number(rep.id)) === "rechazado") {
            apoderadosValidos = false;
            erroresApoderados.push(
              `El apoderado ${rep.nombre} no pasó los Criterios de Aceptación — un administrador debe reintentarlo.`
            );
          }
        });
      }

      apoderadosCompletos = apoderadosValidos;
      if (apoderadosValidos) {
        requisitosCompletados++;
      } else {
        errores.push(...erroresApoderados);
        erroresLegajo.push(...erroresApoderados);
      }
    }

    // Representante Legal (TipoRelacionSocioID 230) - no aplica a Persona
    // Física (no tiene "representante legal", solo apoderado). Se ignora
    // este requisito para tipoPersonaId=1 sin importar lo que diga la
    // configuración, mismo criterio que ya se usa para Accionistas.
    const representantesLegales = representantes.filter((r) => Number(r.rolId) === 230);
    if (requisitos.relaciones.representanteLegal === 1 && !esFisica) {
      totalRequisitos++;
      totalLegajoObligatorios++;
      let repLegalValidos = true;
      const erroresRepLegal = [];

      if (representantesLegales.length === 0) {
        repLegalValidos = false;
        erroresRepLegal.push("Debe registrar al menos un Representante Legal.");
      } else {
        representantesLegales.forEach((rep) => {
          const erroresRep = validarContactoDomicilioYDni(rep, archivosBackend, "representante legal", { requiereDni: false });
          if (erroresRep.length > 0) {
            repLegalValidos = false;
            erroresRepLegal.push(...erroresRep);
          }
          if (estadoCdaMap?.get(Number(rep.id)) === "rechazado") {
            repLegalValidos = false;
            erroresRepLegal.push(
              `El representante legal ${rep.nombre} no pasó los Criterios de Aceptación — un administrador debe reintentarlo.`
            );
          }
        });
      }

      representanteLegalCompletos = repLegalValidos;
      if (repLegalValidos) {
        requisitosCompletados++;
      } else {
        errores.push(...erroresRepLegal);
        erroresLegajo.push(...erroresRepLegal);
      }
    }

    // Agentes de Bolsa
    if (requisitos.relaciones.agentesBolsa === 1) {
      totalRequisitos++;
      totalLegajoObligatorios++;
      let agentesBolsaValidos = true;
      const erroresAgentes = [];

      if (agentesBolsa.length === 0) {
        agentesBolsaValidos = false;
        erroresAgentes.push("Debe registrar al menos un Agente de Bolsa.");
      } else {
        agentesBolsa.forEach((agente) => {
          if (!agente.nrosubcuentacaja) {
            agentesBolsaValidos = false;
            erroresAgentes.push(
              `El agente de bolsa ${agente.nombre} no tiene cargada la Cuenta Comitente (Nro Subcuenta Caja).`
            );
          }
        });
      }

      agentesBolsaCompletos = agentesBolsaValidos;
      if (agentesBolsaValidos) {
        requisitosCompletados++;
      } else {
        errores.push(...erroresAgentes);
        erroresLegajo.push(...erroresAgentes);
      }
    }
  }

  const isValid = errores.length === 0;

  return {
    isValid,
    errores,
    totalRequisitos,
    totalDocumentosObligatorios,
    totalLegajoObligatorios,
    requisitosCompletados,
    tipoPersonaId,
    accionistasCompletos,
    apoderadosCompletos,
    representanteLegalCompletos,
    agentesBolsaCompletos,
    isLoading: false,
    faltanDocumentos: erroresDocumentos.length > 0,
    faltanLegajo: erroresLegajo.length > 0,
    archivosBackend,
    socioLegajoData,
    requisitos,
    cadenaId,
  };
};

export default useValidacionLegajo;
