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

  // ⚠️ UsuarioID es requerido por el backend para resolver la ejecución del
  // grupo: sin él, cda/execute devuelve 409 "Dato Requerido Faltante" aunque
  // ninguna integración esté caída (confirmado comparando contra Swagger).
  //
  // ⚠️⚠️ NO usar valorParticularExpresion acá (sin CdaID, evaluación de
  // pantalla completa): confirmado con pruebas manuales que el backend NO lo
  // matchea contra el CDA que corresponde — evalúa esa expresión una sola
  // vez y le asigna el MISMO resultado a TODOS los CDAs del grupo, pisando
  // la evaluación real de los demás (ej. si el override da falso, rechaza
  // también criterios que en realidad se cumplían). Solo es seguro pasar
  // ValorParticularExpresion junto con CdaID (ver reejecutarCda), que sí
  // evalúa un único CDA — a costa de nunca generar una fila de cierre de
  // grupo (CdaID 0). Reportado a Victor: no hay forma de forzar un único CDA
  // y cerrar el grupo en la misma llamada.
  ejecutarCda: async (pantallaOrObj, cuit, cadenaValorId, usuarioId, valorParticularExpresion) => {
    let Pantalla = pantallaOrObj;
    let Cuit = cuit;
    let CadenaValorID = cadenaValorId;
    let UsuarioID = usuarioId;
    let ValorParticularExpresion = valorParticularExpresion;
    if (typeof pantallaOrObj === "object" && pantallaOrObj !== null) {
      Pantalla = pantallaOrObj.pantalla || pantallaOrObj.Pantalla;
      Cuit = pantallaOrObj.cuit || pantallaOrObj.Cuit;
      CadenaValorID = pantallaOrObj.cadenaValorId || pantallaOrObj.CadenaValorID || pantallaOrObj.cadenavalorid || cadenaValorId;
      UsuarioID = pantallaOrObj.usuarioId || pantallaOrObj.UsuarioID || pantallaOrObj.usuarioid || usuarioId;
      ValorParticularExpresion =
        pantallaOrObj.valorParticularExpresion || pantallaOrObj.ValorParticularExpresion || valorParticularExpresion;
    }
    const params = { Pantalla, Cuit };
    if (CadenaValorID !== undefined && CadenaValorID !== null && String(CadenaValorID).trim() !== "" && !isNaN(Number(CadenaValorID))) {
      params.CadenaValorID = Number(CadenaValorID);
    }
    if (UsuarioID !== undefined && UsuarioID !== null && String(UsuarioID).trim() !== "" && !isNaN(Number(UsuarioID))) {
      params.UsuarioID = Number(UsuarioID);
    }
    if (ValorParticularExpresion && String(ValorParticularExpresion).trim()) {
      params.ValorParticularExpresion = String(ValorParticularExpresion).trim();
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
  //
  // ⚠️ Confirmado con pruebas manuales: re-ejecutar por CdaID "pelado" (sin
  // Pantalla ni CadenaValorID) da 409 "Dato Requerido Faltante" para
  // cualquier CDA cuya expresión necesite resolver un dato anidado de Nosis
  // (ej. nosis.CDA_Valor.SCO), aunque el dato exista (el mismo CUIT resuelve
  // bien con cda/execute:test o con el execute de pantalla completa). Pasar
  // pantalla + cadenaValorId le da al backend el contexto que le falta.
  //
  // valorParticularExpresion, mandado JUNTO CON cdaId, sí aplica solo a ese
  // CDA puntual (confirmado con pruebas manuales) — a diferencia de mandarlo
  // sin CdaID (ver el aviso en ejecutarCda). El costo: nunca genera una fila
  // de cierre de grupo (CdaID 0) nueva, así que el resultado combinado de la
  // pantalla queda desactualizado hasta que se re-ejecute el grupo aparte.
  reejecutarCda: async ({ cdaId, cuit, usuarioId, pantalla, cadenaValorId, valorParticularExpresion }) => {
    const params = { CdaID: cdaId, Cuit: cuit };
    if (usuarioId) params.UsuarioID = usuarioId;
    if (pantalla) params.Pantalla = pantalla;
    if (cadenaValorId !== undefined && cadenaValorId !== null && String(cadenaValorId).trim() !== "" && !isNaN(Number(cadenaValorId))) {
      params.CadenaValorID = Number(cadenaValorId);
    }
    if (valorParticularExpresion && valorParticularExpresion.trim()) {
      params.ValorParticularExpresion = valorParticularExpresion.trim();
    }
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
