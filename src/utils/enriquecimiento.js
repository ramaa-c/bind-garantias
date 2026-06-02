import { sociosService } from "../services/sociosService";
import { afipService } from "../services/afipService";
import { tercerosService } from "../services/tercerosService";
import { catalogosService } from "../services/catalogosService";
import { matchProvinciaAfip } from "./provinciaUtils";

const getCSharpIsoDate = () => {
  const date = new Date();
  return date.toISOString().split(".")[0];
};

/**
 * Enriches the authorities/shareholders of a socio by querying AFIP/LUFE in parallel
 * and executing PUT updates in the database.
 * 
 * @param {number|string} socioId - The ID of the main socio (company)
 * @param {string} cuit - The CUIT of the main socio (company)
 */
export const enriquecerSociosLufeAfip = async (socioId, cuit) => {
  console.log(`[enriquecerSociosLufeAfip] Iniciando precarga LUFE para CUIT: ${cuit}`);
  
  // 1. Obtener autoridades de LUFE y vincularlas inicialmente (POSTs internos de la API)
  try {
    const resLufe = await sociosService.obtenerAutoridadesLufe(cuit, true);
    console.log("[enriquecerSociosLufeAfip] Respuesta de LUFE autoridades:", resLufe);
  } catch (lufeErr) {
    console.error("[enriquecerSociosLufeAfip] Error al llamar a obtenerAutoridadesLufe:", lufeErr);
  }

  // 2. Obtener todas las relaciones del socio creadas en la base de datos
  let relacionesSocio = [];
  try {
    relacionesSocio = await tercerosService.obtenerRelacionesDeSocio(socioId);
  } catch (err) {
    console.warn("[enriquecerSociosLufeAfip] No se pudieron obtener las relaciones del socio:", err);
  }
  const arrRelaciones = Array.isArray(relacionesSocio) ? relacionesSocio : [];

  // Filtrar solo las relaciones tipo accionista (25)
  const relacionAccionistas = arrRelaciones.filter((r) => {
    const rid = r.tiporelacionsocioid || r.TipoRelacionSocioID || r.tiporelacionsocioId;
    return Number(rid) === 25;
  });

  if (relacionAccionistas.length === 0) {
    console.log("[enriquecerSociosLufeAfip] No se encontraron relaciones de accionistas (tipo 25) para enriquecer.");
    return;
  }

  console.log(`[enriquecerSociosLufeAfip] Encontrados ${relacionAccionistas.length} accionistas en la base de datos. Iniciando enriquecimiento AFIP...`);

  // 3. Cargar catálogo de provincias para normalizar provincia de AFIP
  let opcionesProvincias = [];
  try {
    const provs = await catalogosService.obtenerProvincias();
    opcionesProvincias = (provs || [])
      .filter((item) => item.provinciaid !== 0)
      .map((item) => ({
        value: item.provinciaid.toString(),
        label: item.descripcion,
      }));
  } catch (err) {
    console.warn("[enriquecerSociosLufeAfip] No se pudieron cargar las provincias para el mapeo:", err);
  }

  // 4. Enriquecer de forma paralela cada accionista
  await Promise.all(
    relacionAccionistas.map(async (rel) => {
      const terceroId = rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
      if (!terceroId) return;

      try {
        // A. Obtener el tercero desde la base de datos
        const terceroLocal = await tercerosService.obtenerTerceroPorId(terceroId);
        if (!terceroLocal) {
          console.warn(`[enriquecerSociosLufeAfip] No se pudo obtener el detalle del tercero ${terceroId}`);
          return;
        }

        const cuitSocio = terceroLocal.cuit || terceroLocal.Cuit || terceroLocal.numerodocumento || terceroLocal.nrodocumento;
        if (!cuitSocio) {
          console.warn(`[enriquecerSociosLufeAfip] El tercero ${terceroId} no tiene CUIT cargado.`);
          return;
        }

        const cuitSocioLimpio = String(cuitSocio).replace(/\D/g, "");
        if (cuitSocioLimpio.length !== 11) {
          console.warn(`[enriquecerSociosLufeAfip] CUIT inválido (${cuitSocioLimpio}) para tercero ${terceroId}.`);
          return;
        }

        console.log(`[enriquecerSociosLufeAfip] Procesando accionista: ${terceroLocal.denominacion || "S/D"} CUIT: ${cuitSocioLimpio}`);

        // B. Consultar AFIP para obtener datos completos
        let respAfip = null;
        try {
          console.log(`[enriquecerSociosLufeAfip] Consultando AFIP para CUIT: ${cuitSocioLimpio}`);
          respAfip = await afipService.obtenerConstanciaInscripcion(cuitSocioLimpio);
          console.log(`[enriquecerSociosLufeAfip] Respuesta AFIP para CUIT ${cuitSocioLimpio}:`, JSON.stringify(respAfip, null, 2));
        } catch (afipErr) {
          console.warn(`[enriquecerSociosLufeAfip] AFIP no disponible para CUIT ${cuitSocioLimpio}, probando fallback LUFE Entidad:`, afipErr);
          try {
            const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitSocioLimpio);
            if (lufeEntidad && lufeEntidad.success) {
              respAfip = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
              console.log(`[enriquecerSociosLufeAfip] Fallback LUFE Entidad exitoso para CUIT ${cuitSocioLimpio}:`, JSON.stringify(respAfip, null, 2));
            }
          } catch (lufeErr) {
            console.error(`[enriquecerSociosLufeAfip] LUFE Entidad falló para CUIT ${cuitSocioLimpio}:`, lufeErr);
          }
        }

        if (respAfip && respAfip.datosgenerales) {
          const dg = respAfip.datosgenerales;
          const dom = dg.domiciliofiscal || dg.domicilio || {};

          const emailVal = dg.email || dg.emailfacturacion || terceroLocal.mail || terceroLocal.email || "";
          const celularVal = dg.telefono || terceroLocal.telefono || "";
          const direccionVal = dom.direccion || (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "") || terceroLocal.calle || "";
          const localidadVal = dom.localidad || dom.localidadNombre || terceroLocal.contacto || "";

          const payloadTercero = {
            tercerorelacionadoid: terceroId,
            denominacion: terceroLocal.denominacion || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Accionista",
            cuit: cuitSocioLimpio,
            bcraid: 0,
            tipopersonaid: cuitSocioLimpio.startsWith("30") || cuitSocioLimpio.startsWith("33") ? 2 : 1,
            tipodocumentoid: 0,
            numerodocumento: cuitSocioLimpio,
            estadocivilid: 0,
            ciudadid: 0,
            telefono: celularVal,
            conyuge: "",
            actividad: "",
            contacto: localidadVal,
            nrocuenta: "",
            codigomercado: "",
            calle: direccionVal,
            numero: 0,
            piso: "",
            departamento: "",
            codpos: dom.codpostal || dom.codpos || terceroLocal.codpos || "",
            descripcionreducida: (terceroLocal.denominacion || "").substring(0, 20),
            mail: emailVal,
          };

          console.log(`[enriquecerSociosLufeAfip] Enviando PUT Tercero para CUIT ${cuitSocioLimpio}`);
          await tercerosService.actualizarTercero(payloadTercero);

          // E. PUT de enriquecimiento de la relación (porcentaje y provincia)
          let provIdVal = rel.provinciaid || 0;
          if (!provIdVal && dom) {
            const provNombre = dom.descripcionprovincia || dom.provincia || "";
            if (provNombre) {
              const match = matchProvinciaAfip(provNombre, opcionesProvincias);
              if (match) {
                provIdVal = match.value;
              }
            }
          }

          const ahoraStr = getCSharpIsoDate();
          const payloadRel = {
            ...rel,
            sociotercerorelacionid: rel.sociotercerorelacionid || rel.SocioTerceroRelacionID || 0,
            porcacciones: Number(rel.porcacciones || rel.participacion || rel.Participacion || 0),
            provinciaid: Number(provIdVal) || 0,
            telefono: celularVal,
            momento: ahoraStr,
          };
          await tercerosService.actualizarRelacionDeSocio(payloadRel);
          console.log(`[enriquecerSociosLufeAfip] Accionista CUIT ${cuitSocioLimpio} enriquecido correctamente.`);
        }
      } catch (singleErr) {
        console.warn(`[enriquecerSociosLufeAfip] No se pudo enriquecer accionista ID ${terceroId}:`, singleErr);
      }
    })
  );
};
