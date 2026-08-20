import api from "../api/axios";
import { sociosAdapter } from "../adapters/sociosAdapter";
import { socioArchivoService } from "./socioArchivoService";

const cuitCache = new Map();
const cuitWebCache = new Map();

// LUFE a veces devuelve la razón social truncada, sin el sufijo societario
// (confirmado en vivo: "JADI PRODUCTORA AGROGANADERA S" en vez de
// "...S.A." para el CUIT 30710816480) — eso rompe tanto la Denominación
// que termina guardándose en el Socio como la detección de tipo de
// sociedad para los requisitos documentales (ver getSocTypeFromDenominacion
// en requisitosService.js, que solo mira el texto del nombre): sin "SA"
// en el string, cae en "otras" aunque la empresa sea una S.A. real.
// `forma_juridica` sí trae esa info sin truncar, simplemente nunca se
// usaba — se completa el nombre con eso antes de que se propague al resto
// del sistema.
const SUFIJOS_SOCIETARIOS_LUFE = [
  { match: /ACCION|ANONIMA/i, sufijo: "S.A." },
  { match: /RESPONSABILIDAD LIMITADA/i, sufijo: "S.R.L." },
  { match: /HECHO/i, sufijo: "S.H." },
];

const tieneSufijoSocietario = (nombre) =>
  /\bS\.?\s*A\.?\b|\bS\.?\s*R\.?\s*L\.?\b|\bS\.?\s*H\.?\b|SOCIEDAD/i.test(nombre || "");

const completarRazonSocialLufe = (nombre, formaJuridica) => {
  const nombreLimpio = (nombre || "").trim();
  if (!nombreLimpio || tieneSufijoSocietario(nombreLimpio)) return nombreLimpio;
  const sufijoEncontrado = SUFIJOS_SOCIETARIOS_LUFE.find((s) => s.match.test(formaJuridica || ""));
  return sufijoEncontrado ? `${nombreLimpio} ${sufijoEncontrado.sufijo}` : nombreLimpio;
};

export const sociosService = {
  // Trae lista de socios (SGRPlus)
  obtenerSocios: async (params = {}) => {
    const isCuitSearch = Boolean(params.Cuit);
    const cacheKey = isCuitSearch ? String(params.Cuit).trim() : null;

    if (isCuitSearch && cuitCache.has(cacheKey)) {
      return JSON.parse(JSON.stringify(cuitCache.get(cacheKey)));
    }

    try {
      const response = await api.get("api/Socios", { params });
      if (isCuitSearch && response.data) {
        cuitCache.set(cacheKey, JSON.parse(JSON.stringify(response.data)));
      }
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Trae lista de socios (SGRPlus Core)
  obtenerSociosSgrplus: async (params = {}) => {
    try {
      const response = await api.get("sgrplus/Socios", { params });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Trae lista de socios (Esquema Web / Legacy)
  obtenerSociosWeb: async (params = {}) => {
    const isCuitSearch = Boolean(params.Cuit);
    const cacheKey = isCuitSearch ? String(params.Cuit).trim() : null;

    if (isCuitSearch && cuitWebCache.has(cacheKey)) {
      return JSON.parse(JSON.stringify(cuitWebCache.get(cacheKey)));
    }

    try {
      const response = await api.get("api/Socios", { params });
      if (isCuitSearch && response.data) {
        cuitWebCache.set(cacheKey, JSON.parse(JSON.stringify(response.data)));
      }
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // Trae un socio por ID (Esquema Web)
  obtenerSocioPorId: async (socioId) => {
    const response = await api.get(`api/Socio/${socioId}`);
    return response.data;
  },

  // GET api/Socio/{SocioID} - Solicitud de un socio por su ID (Esquema Web)
  obtenerSocioWebPorId: async (socioId) => {
    const response = await api.get(`api/Socio/${socioId}`);
    return response.data;
  },

  // GET api/Socios/ExecuteCda?SocioID=X - Historial de ejecuciones de CDAs de
  // un socio (una fila por cada intento de evaluación, no solo la vigente).
  obtenerExecuteCda: async (socioId) => {
    const response = await api.get("api/Socios/ExecuteCda", {
      params: { SocioID: socioId },
    });
    return response.data;
  },

  // GET api/Socio/CertificadoVigente/{Cuit} - Valida si la empresa tiene un
  // certificado PyME vigente. 200 = vigente, 401 = no vigente — el backend
  // reutiliza el código HTTP como semántica de negocio (mismo patrón que
  // cda/execute con 202/406/409), no es un fallo de autenticación real: no
  // hay ningún header de auth en esta app. Nunca tira: devuelve
  // { status, data } para diferenciar sin try/catch afuera (mismo patrón
  // que probarCda/reejecutarCda).
  obtenerCertificadoVigente: async (cuit) => {
    const cuitLimpio = String(cuit).replace(/\D/g, "");
    try {
      const response = await api.get(
        `api/Socio/CertificadoVigente/${cuitLimpio}`,
      );
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      throw error;
    }
  },

  // GET api/Socio/CertificadoPYME?SocioID=X - Certificado(s) PyME del socio.
  // El backend los genera solo, al procesar la vinculación del socio (ver
  // Paso1Cuit.jsx) — el frontend nunca escribe acá, solo lee para confirmar
  // que ya existe alguno. Nunca da 404: devuelve [] (200) si todavía no
  // tiene ninguno, así que alcanza con chequear si la lista viene vacía.
  obtenerCertificadoPyme: async (socioId) => {
    const response = await api.get("api/Socio/CertificadoPYME", {
      params: { SocioID: socioId },
    });
    return response.data;
  },

  // Crea nuevo socio
  crearSocio: async (socioData) => {
    const response = await api.post("api/Socio", sociosAdapter.adaptarPayload1(socioData));
    return response.data;
  },

  // Actualiza un socio
  actualizarSocio: async (socioData) => {
    const response = await api.put("api/Socio", sociosAdapter.adaptarPayload2(socioData));
    return response.data;
  },

  // POST api/SocioUsuario - Carga de nueva relación entre socio y usuario
  vincularSocioUsuario: async (socioUsuarioData) => {
    const response = await api.post("api/SocioUsuario", sociosAdapter.adaptarPayload3(socioUsuarioData));
    return response.data;
  },

  // GET api/SocioUsuario/{UsuarioWebID} - Listado de relaciones por UsuarioWebID
  obtenerSocioUsuarioPorUsuarioId: async (usuarioWebId) => {
    const response = await api.get(`api/SocioUsuario/${usuarioWebId}`);
    return response.data;
  },

  // GET api/lufe/autoridades/{cuit} - Obtener autoridades de LUFE y vincularlas
  obtenerAutoridadesLufe: async (cuit, vincular = true) => {
    const cuitLimpio = String(cuit).replace(/\D/g, "");
    const response = await api.get(`api/lufe/autoridades/${cuitLimpio}`, {
      params: { Vincular: vincular },
      timeout: 8000,
      noRetry: true,
    });
    return response.data;
  },

  // GET api/lufe/documentos/{cuit} - Obtener documentos de LUFE y vincularlos
  obtenerDocumentosLufe: async (cuit, vincular = true) => {
    const cuitLimpio = String(cuit).replace(/\D/g, "");
    const response = await api.get(`api/lufe/documentos/${cuitLimpio}`, {
      params: { Vincular: vincular },
      timeout: 25000,
      noRetry: true,
    });

    const data = response.data;
    if (vincular) {
      try {
        const docs = Array.isArray(data) 
          ? data 
          : (data?.documentos && Array.isArray(data.documentos)) 
            ? data.documentos 
            : (data?.data && Array.isArray(data.data))
              ? data.data
              : [];
              
        for (const doc of docs) {
          const isAlreadyLufe = String(doc.vialufe || doc.Vialufe || "0") === "1";
          if (!isAlreadyLufe) {
            const tipoId = doc.tipodocumentoarchivoid || doc.Tipodocumentoarchivoid || doc.TipoDocumentoArchivoID || doc.tipoDocumentoArchivoId;
            const docKey = Object.keys(socioArchivoService.TIPO_DOCUMENTO_MAP).find(
              (k) => socioArchivoService.TIPO_DOCUMENTO_MAP[k] === tipoId
            ) || "otrosDocumentos";
            
            const normalizedDoc = {
              socioarchivoid: doc.socioarchivoid || doc.Socioarchivoid || doc.SocioArchivoID || doc.id || doc.Id || 0,
              socioid: doc.socioid || doc.Socioid || doc.SocioID || doc.socioId || 0,
              fcharchivo: doc.fcharchivo || doc.Fcharchivo || doc.FchArchivo || "",
              descripcion: doc.descripcion || doc.Descripcion || "",
              contenido: doc.contenido || doc.Contenido || "",
              nombrearchivo: doc.nombrearchivo || doc.Nombrearchivo || doc.NombreArchivo || "",
              tipodocumentoarchivoid: tipoId,
              azureid: doc.azureid || doc.Azureid || doc.AzureID || 0,
              vialufe: "1",
              fchreferencia: doc.fchreferencia || doc.Fchreferencia || doc.FchReferencia || null,
              referencia: doc.referencia || doc.Referencia || "",
            };

            await socioArchivoService.actualizarArchivo(
              normalizedDoc,
              null,
              docKey,
              normalizedDoc.descripcion || normalizedDoc.nombrearchivo || docKey,
              "1",
              normalizedDoc.fchreferencia,
              normalizedDoc.referencia
            );
          }
        }
      } catch (err) {
        console.error("Error al forzar el flag vialufe=1 para documentos LUFE:", err);
      }
    }

    return response.data;
  },

  // GET api/lufe/entidad/{cuit} - Obtener entidad de LUFE
  obtenerEntidadLufe: async (cuit) => {
    const cuitLimpio = String(cuit).replace(/\D/g, "");
    const response = await api.get(`api/lufe/entidad/${cuitLimpio}`, {
      timeout: 8000,
      noRetry: true,
    });
    return response.data;
  },

  // Helper para normalizar la respuesta de LUFE Entidad al formato de AFIP datosgenerales
  normalizarLufeAEstructuraAfip: (lufeData) => {
    if (!lufeData) return null;

    const razonSocialCompleta = completarRazonSocialLufe(
      lufeData.nombre,
      lufeData.forma_juridica,
    );

    let email = "";
    let telefono = "";
    if (Array.isArray(lufeData.contactos) && lufeData.contactos.length > 0) {
      const contactoPrincipal = lufeData.contactos[0];
      email = contactoPrincipal.email || "";
      telefono = contactoPrincipal.telefono || "";
    }

    let direccion = lufeData.domicilio_fiscal || "";
    let localidad = "";
    let provincia = "";
    let codpostal = "";

    // Separador puede ser "-" o ","
    const separator = direccion.includes(" - ") ? " - " : direccion.includes(",") ? "," : null;
    if (separator) {
      const partes = direccion.split(separator).map((p) => p.trim());
      if (partes.length >= 4) {
        direccion = partes[0];
        localidad = partes[1];
        provincia = partes[2];
        codpostal = partes[3];
      } else if (partes.length === 3) {
        direccion = partes[0];
        localidad = partes[1];
        provincia = partes[2];
      } else if (partes.length === 2) {
        direccion = partes[0];
        localidad = partes[1];
      }
    }

    return {
      datosgenerales: {
        razonsocial: razonSocialCompleta,
        nombre: razonSocialCompleta,
        apellido: "",
        email: email,
        emailfacturacion: email,
        telefono: telefono,
        tipopersona: lufeData.personeria || "",
        mescierre: lufeData.mes_cierre || null,
        domiciliofiscal: {
          direccion: direccion,
          localidad: localidad,
          descripcionprovincia: provincia,
          codpostal: codpostal,
        },
      },
      datosregimengeneral: {
        impuesto: Array.isArray(lufeData.impuestos)
          ? lufeData.impuestos.map((imp) => ({
              periodo: imp.periodo_vigencia,
            }))
          : [],
        actividad: Array.isArray(lufeData.actividades)
          ? lufeData.actividades.map((act) => ({
              periodo: act.periodo_vigencia,
              idactividad: act.codigo,
            }))
          : [],
      },
    };
  },

  // Envía todos los datos consolidados del legajo al esquema SGR+.
  // noRetry: true porque el interceptor global reintenta automáticamente
  // ante un 5xx (hasta 2 veces más) — para un endpoint de escritura que hoy
  // está fallando con 500 (ver LegajoUniversalBar.jsx), eso significaba 3
  // POSTs reales por cada intento en vez de 1. Si falla, tiene que quedar
  // en "pendiente" de una y listo — no insistir solo en esta llamada.
  enviarASgrPlus: async (socioId) => {
    const response = await api.post(
      "api/Socio/Migrar",
      sociosAdapter.adaptarPayload4({
        socioid: Number(socioId),
      }),
      { noRetry: true },
    );
    return {
      success: true,
      message: response.data?.message || "Legajo enviado a SGR+ exitosamente.",
      ...response.data,
    };
  },
};
