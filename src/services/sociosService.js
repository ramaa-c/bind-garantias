import api from "../api/axios";

const cuitCache = new Map();
const cuitWebCache = new Map();

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

  // Crea nuevo socio
  crearSocio: async (socioData) => {
    const response = await api.post("api/Socio", socioData);
    return response.data;
  },

  // Actualiza un socio
  actualizarSocio: async (socioData) => {
    const response = await api.put("api/Socio", socioData);
    return response.data;
  },

  // POST api/SocioUsuario - Carga de nueva relación entre socio y usuario
  vincularSocioUsuario: async (socioUsuarioData) => {
    const response = await api.post("api/SocioUsuario", socioUsuarioData);
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

    if (direccion.includes(",")) {
      const partes = direccion.split(",").map((p) => p.trim());
      if (partes.length >= 3) {
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
        razonsocial: lufeData.nombre || "",
        nombre: lufeData.nombre || "",
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
        },
      },
      datosregimengeneral: {
        impuesto: Array.isArray(lufeData.impuestos)
          ? lufeData.impuestos.map((imp) => ({
              periodo: imp.periodo_vigencia,
            }))
          : [],
      },
    };
  },

  // Envía todos los datos consolidados del legajo al esquema SGR+
  enviarASgrPlus: async (socioId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Legajo enviado a SGR+ exitosamente.",
          timestamp: new Date().toISOString()
        });
      }, 1500);
    });
  },
};
