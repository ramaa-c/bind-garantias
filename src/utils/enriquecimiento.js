import { sociosService } from "../services/sociosService";
import { afipService } from "../services/afipService";
import { tercerosService } from "../services/tercerosService";
import { catalogosService } from "../services/catalogosService";
import { matchProvinciaAfip } from "./provinciaUtils";
import { parseAddress } from "./direccionParser";

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
  let afipFailed = false;
  let fallbackSuccess = false;

  try {
    await sociosService.obtenerAutoridadesLufe(cuit, true);
  } catch (lufeErr) {
    // Silently handle error
  }

  let relacionesSocio = [];
  try {
    relacionesSocio = await tercerosService.obtenerRelacionesDeSocio(socioId);
  } catch (err) {
    // Silently handle error
  }
  const arrRelaciones = Array.isArray(relacionesSocio) ? relacionesSocio : [];

  // Accionistas (25), Representantes Legales (230) y Apoderados (210) - los
  // 3 tipos de terceros relacionados que se completan con datos de
  // AFIP/LUFE. Antes solo se enriquecían los accionistas.
  const relacionAccionistas = arrRelaciones.filter((r) => {
    const rid =
      r.tiporelacionsocioid || r.TipoRelacionSocioID || r.tiporelacionsocioId;
    return [25, 210, 230].includes(Number(rid));
  });

  if (relacionAccionistas.length === 0) {
    return { afipFailed, fallbackSuccess };
  }

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
    // Silently handle error
  }

  for (const rel of relacionAccionistas) {
    const terceroId =
      rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
    if (!terceroId) continue;

    try {
      const terceroLocal = await tercerosService.obtenerTerceroPorId(terceroId);
      if (!terceroLocal) continue;

      const cuitSocio =
        terceroLocal.cuit ||
        terceroLocal.Cuit ||
        terceroLocal.numerodocumento ||
        terceroLocal.nrodocumento;
      if (!cuitSocio) continue;

      const cuitSocioLimpio = String(cuitSocio).replace(/\D/g, "");
      if (cuitSocioLimpio.length !== 11) continue;

      let respAfip = null;
      try {
        respAfip = await afipService.obtenerConstanciaInscripcion(cuitSocioLimpio);
      } catch (afipErr) {
        afipFailed = true;
        try {
          const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitSocioLimpio);
          if (lufeEntidad && lufeEntidad.success) {
            respAfip = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
            fallbackSuccess = true;
          }
        } catch (lufeErr) {
          // Both failed
        }
      }

      if (respAfip && respAfip.datosgenerales) {
        const dg = respAfip.datosgenerales;
        const dom = dg.domiciliofiscal || dg.domicilio || {};

        const emailVal =
          dg.email ||
          dg.emailfacturacion ||
          terceroLocal.mail ||
          terceroLocal.email ||
          "";
        const celularVal = dg.telefono || terceroLocal.telefono || "";
        const direccionVal =
          dom.direccion ||
          (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "") ||
          terceroLocal.calle ||
          "";
        // AFIP/LUFE devuelven la dirección como un solo string ("SANTIAGO
        // RUBIO 497") - parseAddress la separa en calle/numero/piso/depto,
        // igual que ya hace obtenerDatosEmpresaPorCuit para la empresa.
        // Antes esto no se parseaba: se guardaba el string completo en
        // "calle" y numero/piso/departamento quedaban siempre vacíos.
        const parsedDir = parseAddress(direccionVal);
        const localidadVal =
          dom.localidad || dom.localidadNombre || terceroLocal.contacto || "";

        const payloadTercero = {
          tercerorelacionadoid: terceroId,
          denominacion:
            terceroLocal.denominacion ||
            `${dg.nombre || ""} ${dg.apellido || ""}`.trim() ||
            "Tercero",
          cuit: cuitSocioLimpio,
          bcraid: 0,
          tipopersonaid:
            cuitSocioLimpio.startsWith("30") || cuitSocioLimpio.startsWith("33")
              ? 2
              : 1,
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
          calle: parsedDir.calle || terceroLocal.calle || "",
          numero: parsedDir.numero || Number(terceroLocal.numero) || 0,
          piso: parsedDir.piso || terceroLocal.piso || "",
          departamento: parsedDir.departamento || terceroLocal.departamento || "",
          codpos: dom.codpostal || dom.codpos || terceroLocal.codpos || "",
          descripcionreducida: (terceroLocal.denominacion || "").substring(0, 20),
          mail: emailVal,
        };

        await tercerosService.actualizarTercero(payloadTercero);

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
          sociotercerorelacionid:
            rel.sociotercerorelacionid || rel.SocioTerceroRelacionID || 0,
          porcacciones: Number(
            rel.porcacciones || rel.participacion || rel.Participacion || 0,
          ),
          provinciaid: Number(provIdVal) || 0,
          telefono: celularVal,
          momento: ahoraStr,
        };
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
      }
    } catch (singleErr) {
      // Silently catch
    }
  }

  return { afipFailed, fallbackSuccess };
};
