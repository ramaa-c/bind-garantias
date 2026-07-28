import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useEmpresaActiva } from "./useEmpresaActiva";
import { useRequisitos } from "./useRequisitos";
import { useObtenerDatosSocioLegajo } from "./useTerceros";
import { socioArchivoService } from "../services/socioArchivoService";

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
  const { cadenaSlug } = useParams();

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

  const { data: archivosBackend = [], isLoading: loadingArchivos } = useQuery({
    queryKey: ["socioArchivos", socioIdActivo],
    queryFn: () => socioArchivoService.obtenerArchivos(socioIdActivo),
    enabled: !!socioIdActivo,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = loadingRequisitos || loadingLegajo || loadingArchivos;

  if (isLoading || !requisitos) {
    return {
      isValid: false,
      errores: [],
      totalRequisitos: 0,
      requisitosCompletados: 0,
      isLoading: true,
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
        // Validar participación = 100%
        const totalParticipacion = Number(
          accionistas.reduce((acc, s) => acc + Number(s.participacion || 0), 0).toFixed(2)
        );

        if (totalParticipacion !== 100) {
          accionistasValidos = false;
          erroresAccionistas.push(
            `La sumatoria de las participaciones de los accionistas debe ser exactamente 100% (actual: ${totalParticipacion}%).`
          );
        }

        // Validar datos de contacto y DNI para cada accionista
        accionistas.forEach((socio) => {
          const sEmail = socio.email || socio.mail || socio.Mail || "";
          const sCel = socio.celular || socio.telefono || socio.Telefono || "";
          const sDir = socio.direccion || socio.calle || "";
          const sProv = socio.provincia || socio.provinciaid || "";

          if (!sEmail || !sCel || !sDir || !sProv) {
            accionistasValidos = false;
            erroresAccionistas.push(
              `El accionista ${socio.nombre} tiene datos de contacto o domicilio incompletos.`
            );
          }

          const cuitLimpio = String(socio.cuit || "").replace(/\D/g, "");
          if (!cuitLimpio) {
            accionistasValidos = false;
            erroresAccionistas.push(`El accionista ${socio.nombre} no posee CUIT válido.`);
          } else {
            const nombreNorm = normalizarTexto(socio.nombre);

            const tieneDniFrente = archivosBackend.some((a) => {
              if (a.tipodocumentoarchivoid !== 8) return false;
              const descNorm = normalizarTexto(a.descripcion);
              return (
                descNorm.includes(cuitLimpio) ||
                (nombreNorm && descNorm.includes(nombreNorm))
              );
            });

            const tieneDniDorso = archivosBackend.some((a) => {
              if (a.tipodocumentoarchivoid !== 9) return false;
              const descNorm = normalizarTexto(a.descripcion);
              return (
                descNorm.includes(cuitLimpio) ||
                (nombreNorm && descNorm.includes(nombreNorm))
              );
            });

            if (!tieneDniFrente || !tieneDniDorso) {
              accionistasValidos = false;
              const faltantes = [];
              if (!tieneDniFrente) faltantes.push("DNI Frente");
              if (!tieneDniDorso) faltantes.push("DNI Dorso");
              erroresAccionistas.push(
                `El accionista ${socio.nombre} no tiene cargado: ${faltantes.join(" y ")}.`
              );
            }
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
          const sEmail = rep.email || rep.mail || rep.Mail || "";
          const sCel = rep.celular || rep.telefono || rep.Telefono || "";

          if (!sEmail || !sCel) {
            apoderadosValidos = false;
            erroresApoderados.push(
              `El apoderado ${rep.nombre} tiene datos de contacto incompletos.`
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
          const sEmail = rep.email || rep.mail || rep.Mail || "";
          const sCel = rep.celular || rep.telefono || rep.Telefono || "";

          if (!sEmail || !sCel) {
            repLegalValidos = false;
            erroresRepLegal.push(
              `El representante legal ${rep.nombre} tiene datos de contacto incompletos.`
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
  };
};

export default useValidacionLegajo;
