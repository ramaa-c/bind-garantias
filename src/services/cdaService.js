import { cdaAdapter } from "../adapters/cdaAdapter";
import api from "../api/axios";

export const cdaService = {
  // GET api/cda/GrupoCda?Pantalla=X&CadenaValorID=Y - Grupo de CDAs para una
  // combinación Pantalla+Cadena, con su propia ExpresionAgrupacion.
  //
  // ⚠️ El backend hoy IGNORA el filtro CadenaValorID (devuelve todos los
  // grupos de la pantalla, sin importar la cadena pedida) — reportado a
  // Victor. Filtramos acá del lado del cliente para no terminar operando
  // sobre el GrupoCda de otra cadena. Sacar este filtro extra el día que el
  // backend lo resuelva de verdad.
  obtenerGrupoCda: async (pantalla, cadenaValorId) => {
    const params = { Pantalla: pantalla };
    if (cadenaValorId !== undefined && cadenaValorId !== null) {
      params.CadenaValorID = cadenaValorId;
    }
    const response = await api.get("api/cda/GrupoCda", { params });
    const data = response.data;
    if (cadenaValorId === undefined || cadenaValorId === null) return data;

    const list = Array.isArray(data) ? data : data?.items || data?.data || (data ? [data] : []);
    return list.filter((row) => String(row.cadenavalorid) === String(cadenaValorId));
  },

  crearGrupoCda: async (grupoData) => {
    const response = await api.post("api/cda/GrupoCda", cdaAdapter.adaptarGrupoCda(grupoData));
    return response.data;
  },

  actualizarGrupoCda: async (grupoData) => {
    const response = await api.put("api/cda/GrupoCda", cdaAdapter.adaptarGrupoCda(grupoData));
    return response.data;
  },

  obtenerCda: async (cdaId) => {
    const response = await api.get("api/cda/Cda", {
      params: { CdaID: cdaId },
    });
    return response.data;
  },

  // GET api/cda/PantallaGrupoCda?Pantalla=X - Devuelve { PantallaGrupoCdaID, Pantalla } (registro de la pantalla en sí; ya no lleva ExpresionAgrupacion)
  obtenerPantallaGrupoCda: async (pantalla) => {
    const response = await api.get("api/cda/PantallaGrupoCda", {
      params: { Pantalla: pantalla },
    });
    return response.data;
  },

  crearPantallaGrupoCda: async (pantallaData) => {
    const response = await api.post("api/cda/PantallaGrupoCda", cdaAdapter.adaptarPantallaGrupoCda(pantallaData));
    return response.data;
  },

  // Get-or-create: los registros de pantalla son globales (no por cadena) y
  // deberían existir de antes, pero este fallback evita romper en un
  // ambiente donde todavía no se crearon.
  obtenerOCrearPantallaGrupoCda: async (pantallaLiteral) => {
    const existing = await cdaService.obtenerPantallaGrupoCda(pantallaLiteral);
    const existingList = Array.isArray(existing) ? existing : existing?.items || existing?.data || (existing ? [existing] : []);
    const row = existingList[0];
    const id = row?.pantallagrupocdaid;
    if (id !== undefined && id !== null) return id;

    const created = await cdaService.crearPantallaGrupoCda({ pantalla: pantallaLiteral });
    return created?.pantallagrupocdaid;
  },

  ejecutarCda: async (pantallaOrObj, cuit, cadenaValorId, usuarioId) => {
    let Pantalla = pantallaOrObj;
    let Cuit = cuit;
    let CadenaValorID = cadenaValorId;
    let UsuarioID = usuarioId;
    if (typeof pantallaOrObj === "object" && pantallaOrObj !== null) {
      Pantalla = pantallaOrObj.pantalla || pantallaOrObj.Pantalla;
      Cuit = pantallaOrObj.cuit || pantallaOrObj.Cuit;
      CadenaValorID = pantallaOrObj.cadenaValorId || pantallaOrObj.CadenaValorID || pantallaOrObj.cadenavalorid || cadenaValorId;
      UsuarioID = pantallaOrObj.usuarioId || pantallaOrObj.UsuarioID || usuarioId;
    }
    const params = { Pantalla, Cuit };
    if (CadenaValorID !== undefined && CadenaValorID !== null && String(CadenaValorID).trim() !== "" && !isNaN(Number(CadenaValorID))) {
      params.CadenaValorID = Number(CadenaValorID);
    }
    if (UsuarioID !== undefined && UsuarioID !== null && String(UsuarioID).trim() !== "" && !isNaN(Number(UsuarioID))) {
      params.UsuarioID = Number(UsuarioID);
    }
    const response = await api.get("api/cda/execute", {
      params,
    });
    return response.data;
  },

  crearCda: async (cdaData) => {
    const response = await api.post("api/cda/Cda", cdaAdapter.adaptarPayload1(cdaData));
    return response.data;
  },

  actualizarCda: async (cdaData) => {
    const response = await api.put("api/cda/Cda", cdaAdapter.adaptarPayload1(cdaData));
    return response.data;
  },

  obtenerTodosCdas: async () => {
    const response = await api.get("api/cda/Cda");
    return response.data;
  },

  // GET api/cda/execute?CdaID=X&Cuit=Y - Vuelve a evaluar un CDA puntual (ej.
  // tras reactivar una integración que lo había dejado en estado Pendiente).
  // Igual que probarCda: nunca tira, devuelve { status, data } para poder
  // diferenciar 202 (aprobado) de 406 (rechazado) sin try/catch afuera.
  reejecutarCda: async ({ cdaId, cuit, usuarioId }) => {
    const params = { CdaID: cdaId, Cuit: cuit };
    if (usuarioId) params.UsuarioID = usuarioId;
    try {
      const response = await api.get("api/cda/execute", { params });
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return { status: error.response.status, data: error.response.data };
      }
      throw error;
    }
  },

  probarCda: async (cuit, expresion, expresionLog) => {
    try {
      const response = await api.post("api/cda/execute:test", {
        Cuit: cuit,
        Expresion: expresion,
        ExpresionLog: expresionLog || ""
      });
      return { status: response.status, data: response.data };
    } catch (error) {
      if (error.response) {
        return {
          status: error.response.status,
          data: error.response.data
        };
      }
      throw error;
    }
  },
};
