import { nosisService } from "../services/nosisService";
import { sociosService } from "../services/sociosService";
import { afipService } from "../services/afipService";
import { matchProvinciaAfip } from "./provinciaUtils";
import { decodeHtmlEntities, parseAddress } from "./direccionParser";

export const obtenerDatosEmpresaPorCuit = async (
  cuit,
  opcionesProvincias,
  { onProgress } = {},
) => {
  let nosisData = null;
  let afipData = null;

  try {
    nosisData = await nosisService.obtenerDatosNormalizados(cuit);
  } catch (e) {
    console.warn("Error consultando Nosis, se intentará AFIP...", e);
  }

  if (!nosisData) {
    onProgress?.("lufe");
  }

  try {
    const lufeData = await sociosService.obtenerEntidadLufe(cuit);
    if (lufeData && lufeData.success) {
      afipData = sociosService.normalizarLufeAEstructuraAfip(lufeData);
    }
  } catch (lufeError) {
    console.warn("Error consultando LUFE:", lufeError);
  }

  if (!afipData || !afipData.datosgenerales) {
    if (!nosisData) {
      onProgress?.("afip");
    }
    try {
      afipData = await afipService.obtenerConstanciaInscripcion(cuit);
    } catch (e) {
      console.warn("Error consultando AFIP como fallback...", e);
    }
  }

  if (!nosisData && !(afipData && afipData.datosgenerales)) {
    return {
      encontrado: false,
      nosisData: null,
      afipData: null,
      valores: null,
    };
  }

  // Cascada Nosis -> LUFE -> AFIP, mismo orden que el resto de esta
  // función. LUFE ya llega con tipoactividadsepymeid embebido en
  // datosgenerales (ver normalizarLufeAEstructuraAfip en sociosService.js);
  // para AFIP real hay que buscar la actividad de Orden 1 dentro del
  // arreglo (siempre es la principal).
  const deducirTipoActividadSepymeId = () => {
    if (nosisData?.VI_Act01_Cod) {
      return String(nosisData.VI_Act01_Cod);
    }
    if (afipData?.datosgenerales?.tipoactividadsepymeid != null) {
      return String(afipData.datosgenerales.tipoactividadsepymeid);
    }
    const actividades = afipData?.datosregimengeneral?.actividad;
    if (Array.isArray(actividades)) {
      const principal = actividades.find((act) => Number(act.orden) === 1);
      if (principal?.idactividad != null) {
        return String(principal.idactividad);
      }
    }
    return null;
  };

  const cuitLimpio = String(cuit).replace(/\D/g, "");
  const deducirTipoPersonaPorPrefijo = () => {
    const prefix = cuitLimpio.substring(0, 2);
    if (
      ["20", "23", "24", "27", "25", "26"].includes(prefix) ||
      cuitLimpio.startsWith("2")
    ) {
      return 1;
    }
    if (["30", "33", "34"].includes(prefix) || cuitLimpio.startsWith("3")) {
      return 10;
    }
    return 0;
  };

  let valores;

  if (nosisData) {
    const nombreCompleto = decodeHtmlEntities(
      nosisData.VI_RazonSocial ||
        `${nosisData.VI_Nombre || ""} ${nosisData.VI_Apellido || ""}`.trim(),
    );
    const fullDireccion = decodeHtmlEntities(
      `${nosisData.VI_DomAF_Calle || ""} ${nosisData.VI_DomAF_Nro || ""}`.trim(),
    );
    const hasNumber = !!nosisData.VI_DomAF_Nro;
    const localidadStr = decodeHtmlEntities(nosisData.VI_DomAF_Loc || "");
    const provNombre = decodeHtmlEntities(nosisData.VI_DomAF_Prov || "");
    const provMatched = matchProvinciaAfip(provNombre, opcionesProvincias);
    const matchedProvId = provMatched ? Number(provMatched.value) : null;

    let tipoPersonaId = 0;
    if (nosisData.VI_TipoPersona === "1") {
      tipoPersonaId = 10;
    } else if (nosisData.VI_TipoPersona === "2") {
      tipoPersonaId = 1;
    } else if (afipData && afipData.datosgenerales) {
      const tipoPersonaStr = (
        afipData.datosgenerales.tipopersona || ""
      ).toUpperCase();
      if (
        tipoPersonaStr.includes("JURIDICA") ||
        tipoPersonaStr.includes("JURÍDICA")
      ) {
        tipoPersonaId = 10;
      } else if (
        tipoPersonaStr.includes("FISICA") ||
        tipoPersonaStr.includes("FÍSICA") ||
        tipoPersonaStr.includes("HUMANA")
      ) {
        tipoPersonaId = 1;
      }
    }
    if (!tipoPersonaId) {
      tipoPersonaId = deducirTipoPersonaPorPrefijo();
    }

    let mesCierre = null;
    if (afipData && afipData.datosgenerales) {
      const dgLocal = afipData.datosgenerales;
      if (dgLocal.mescierre) mesCierre = parseInt(dgLocal.mescierre, 10);
      else if (dgLocal.mes_cierre) mesCierre = parseInt(dgLocal.mes_cierre, 10);
    }

    let fechaInicioActividades = null;
    if (nosisData.VI_Act01_FecInicio) {
      fechaInicioActividades = `${nosisData.VI_Act01_FecInicio}T00:00:00`;
    }

    let tipoRegimenIvaId = 1;
    if (
      nosisData.VI_Inscrip_Monotributo === "Si" ||
      nosisData.VI_Inscrip_Monotributo_Es === "Si" ||
      nosisData.VI_Inscrip_Monotributo
    ) {
      tipoRegimenIvaId = 2;
    }

    valores = {
      razonSocial: nombreCompleto,
      direccion: fullDireccion,
      codpos: nosisData.VI_DomAF_CP || "",
      calle: nosisData.VI_DomAF_Calle || "",
      sinNumero: !hasNumber,
      numero: hasNumber ? nosisData.VI_DomAF_Nro : "",
      piso: nosisData.VI_DomAF_Piso || "",
      departamento: nosisData.VI_DomAF_Dto || "",
      localidad: localidadStr,
      localidadid: null,
      ciudad: nosisData.VI_DomAF_Loc || "",
      ciudadid: null,
      provinciaid: matchedProvId,
      provincia: provMatched ? provMatched.value : provNombre,
      tipopersonaid: tipoPersonaId,
      mescierre: mesCierre,
      fechainicioactividades: fechaInicioActividades,
      tiporegimenivaid: tipoRegimenIvaId,
      tipoactividadsepymeid: deducirTipoActividadSepymeId(),
    };
  } else {
    const dg = afipData.datosgenerales;
    const nombreCompleto = decodeHtmlEntities(
      dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim(),
    );
    const dom = dg.domiciliofiscal || {};
    const fullDireccion = decodeHtmlEntities(dom.direccion || "");
    const parsedDir = parseAddress(fullDireccion);
    const localidadStr = decodeHtmlEntities(dom.localidad || "");
    const provNombreAfip = decodeHtmlEntities(dom.descripcionprovincia || "");
    const provMatched = matchProvinciaAfip(provNombreAfip, opcionesProvincias);
    const matchedProvId = provMatched ? Number(provMatched.value) : null;

    let tipoPersonaId = 0;
    const tipoPersonaStr = (dg.tipopersona || "").toUpperCase();
    if (
      tipoPersonaStr.includes("JURIDICA") ||
      tipoPersonaStr.includes("JURÍDICA")
    ) {
      tipoPersonaId = 10;
    } else if (
      tipoPersonaStr.includes("FISICA") ||
      tipoPersonaStr.includes("FÍSICA") ||
      tipoPersonaStr.includes("HUMANA")
    ) {
      tipoPersonaId = 1;
    } else {
      tipoPersonaId = deducirTipoPersonaPorPrefijo();
    }

    let mesCierre = null;
    if (dg.mescierre) mesCierre = parseInt(dg.mescierre, 10);
    else if (dg.mes_cierre) mesCierre = parseInt(dg.mes_cierre, 10);

    let fechaInicioActividades = null;
    const actividades = [];
    if (Array.isArray(afipData.datosregimengeneral?.actividad)) {
      actividades.push(...afipData.datosregimengeneral.actividad);
    }
    if (Array.isArray(afipData.datosmonotributo?.actividad)) {
      actividades.push(...afipData.datosmonotributo.actividad);
    }
    let minPeriodo = null;
    for (const act of actividades) {
      if (act.periodo) {
        if (minPeriodo === null || act.periodo < minPeriodo) {
          minPeriodo = act.periodo;
        }
      }
    }
    if (minPeriodo) {
      const minPeriodoStr = minPeriodo.toString();
      if (minPeriodoStr.length === 6) {
        const year = parseInt(minPeriodoStr.substring(0, 4), 10);
        const month = parseInt(minPeriodoStr.substring(4, 6), 10);
        const lastDay = new Date(year, month, 0).getDate();
        fechaInicioActividades = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T00:00:00`;
      }
    }

    let tipoRegimenIvaId = 1;
    const monotributo = afipData.datosmonotributo;
    if (monotributo) {
      const tieneDatosMonotributo = Object.values(monotributo).some((val) => {
        if (val === null || val === undefined) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object") return Object.keys(val).length > 0;
        return val !== "";
      });
      if (tieneDatosMonotributo) tipoRegimenIvaId = 2;
    }

    valores = {
      razonSocial: nombreCompleto,
      direccion: fullDireccion,
      codpos: dom.codpostal || "",
      calle: parsedDir.calle,
      sinNumero: parsedDir.numero === 0,
      numero: parsedDir.numero || "",
      piso: parsedDir.piso,
      departamento: parsedDir.departamento,
      localidad: localidadStr,
      localidadid: null,
      ciudad: dom.localidad || "",
      ciudadid: null,
      provinciaid: matchedProvId,
      provincia: provMatched ? provMatched.value : provNombreAfip,
      tipopersonaid: tipoPersonaId,
      mescierre: mesCierre,
      fechainicioactividades: fechaInicioActividades,
      tiporegimenivaid: tipoRegimenIvaId,
      tipoactividadsepymeid: deducirTipoActividadSepymeId(),
    };
  }

  return { encontrado: true, nosisData, afipData, valores };
};
