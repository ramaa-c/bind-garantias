import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { tercerosService } from '../services/tercerosService';
import { calcularEstadoDesdeHistorial, normalizarHistorialTercero } from '../utils/executeCda';

export const useObtenerTerceros = (params = {}) => {
    return useQuery({
        queryKey: ['terceros', 'lista', params],
        queryFn: () => tercerosService.obtenerTerceros(params),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData
    });
};

//------- TERCEROS RELACIONADOS (SGRPlus) ---------

export const useObtenerDatosSocioLegajo = (socioId) => {
  return useQuery({
    queryKey: ["socioLegajoCompleto", socioId],
    queryFn: async () => {
      if (!socioId) return { accionistas: [], representantes: [], agentesBolsa: [] };
      const relaciones = await tercerosService.obtenerRelacionesDeSocio(socioId);
      const arr = Array.isArray(relaciones) ? relaciones : [];

      const accMap = {};
      const repMap = {};
      const bolsaMap = {};

      // Comparación por fecha calendario (sin hora) contra HOY, no contra el
      // instante exacto: una relación recién creada suele llegar con
      // FechaHasta defaulteada al mismo día que FechaDesde (hoy a las
      // 00:00hs) — comparada contra "ahora mismo" (con hora), "hoy a las
      // 00:00" siempre da en el pasado, así que sin este truncado una
      // relación recién creada desaparecería sola apenas se crea.
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Se descartan primero las relaciones vencidas o sin tercero asociado
      // (no requieren red), y recién ahí se piden los terceros. Los pedidos
      // van en paralelo (son lecturas, no escrituras: no aplica el límite
      // de pool de FireDAC que obliga a serializar las escrituras) para que
      // el refetch tras guardar/editar no tarde N veces la latencia del
      // backend por cada accionista/representante/agente de bolsa.
      //
      // ⚠️ Antes acá había una excepción "si FechaHasta === FechaDesde, no
      // contar como vencida" (pensada para el caso de arriba). El problema:
      // "eliminar" un tercero pone FechaHasta = ayer (ver SociosLegajo.jsx),
      // y si ese tercero se había creado justo el día anterior (típico en
      // los precargados de LUFE del alta, que quedan con FechaDesde = el
      // día del alta), FechaHasta(ayer) terminaba coincidiendo con
      // FechaDesde — la excepción se activaba de nuevo y la "eliminación"
      // quedaba invisible para este filtro, aunque el PUT sí se haya
      // guardado bien en el backend (confirmado en vivo el 2026-08-12,
      // reproducido contra SocioTerceroRelacionID 179 del socio 66: el PUT
      // devuelve 200 y el valor queda persistido, pero seguía apareciendo
      // en pantalla). No es un problema de LUFE en sí — pasa con cualquier
      // tercero borrado exactamente un día después de haberse creado.
      const relacionesValidas = arr.filter((rel) => {
        const fh = rel.fechahasta || rel.FechaHasta;
        if (fh && fh !== "") {
          const expirationDate = new Date(fh);
          expirationDate.setHours(0, 0, 0, 0);
          if (expirationDate < hoy) {
            return false;
          }
        }

        const tid =
          rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
        return !!tid;
      });

      const itemsResueltos = await Promise.all(
        relacionesValidas.map(async (rel) => {
          const tid =
            rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;

          try {
            let t = null;
            try {
              t = await tercerosService.obtenerTerceroPorId(tid);
            } catch {
              try {
                t = await tercerosService.obtenerTerceroPorIdSGRPlus(tid);
              } catch {
                // Ignore error
              }
            }

            if (!t) return null;

            const tiporel =
              rel.tiporelacionsocioid ||
              rel.TipoRelacionSocioID ||
              rel.tiporelacionsocioId;
            const tiporelNum = Number(tiporel);

            const item = {
              id: tid,
              relacionId:
                rel.sociotercerorelacionid || rel.SocioTerceroRelacionID,
              relacion: rel,
              nombre:
                t.denominacion ||
                t.Denominacion ||
                t.razonsocial ||
                t.RazonSocial ||
                t.nombre ||
                t.Nombre ||
                "Sin nombre",
              cuit:
                t.cuit ||
                t.Cuit ||
                t.nrodocumento ||
                t.numerodocumento ||
                t.NumeroDocumento ||
                t.documento ||
                "—",
              email: t.mail || t.Mail || "",
              telefono: t.telefono || t.Telefono || "",
              direccion: t.calle || t.Calle || "",
              localidad: t.contacto || t.Contacto || "",
              codpos: t.codpos || t.Codpos || "",
              participacion: Number(
                rel.porcacciones || rel.participacion || rel.Participacion || 0,
              ),
              rolId: tiporelNum,
              nrosubcuentacaja:
                rel.nrosubcuentacaja || rel.NroSubcuentaCaja || "",
              calle: t.calle || "",
              numero: t.numero || 0,
              piso: t.piso || "",
              departamento: t.departamento || "",
              ciudadid: t.ciudadid || t.CiudadID || t.CiudadId || 0,
              localidadid: t.localidadid || t.LocalidadID || t.LocalidadId || t.partidoid || t.PartidoID || t.PartidoId || 0,
              partidoid: t.partidoid || t.PartidoID || t.PartidoId || t.localidadid || t.LocalidadID || t.LocalidadId || 0,
              provinciaid:
                rel.provinciaid || rel.ProvinciaID || t.provinciaid || t.ProvinciaID || t.ProvinciaId || 0,
              tipopersonaid: t.tipopersonaid || t.TipoPersonaID || t.TipoPersonaId || 1,
            };

            return { rel, tiporelNum, item };
          } catch (e) {
            console.warn("Error fetching third party detail:", tid, e);
            return null;
          }
        }),
      );

      for (const resuelto of itemsResueltos) {
        if (!resuelto) continue;
        const { rel, tiporelNum, item } = resuelto;

        const identifier =
          item.cuit && item.cuit !== "—" ? item.cuit : item.id;

        if (tiporelNum === 25) {
          // LUFE puede traer accionistas con 0% de participación que no
          // sirven de nada acá — se omiten. Nuestra propia modal nunca
          // puede guardar uno en 0% (el form valida min=0.01), así que el
          // único 0% que puede aparecer es o bien esto de LUFE, o bien un
          // alta que se dejó a mitad de camino (el stub que se crea antes
          // de validar el CDA, ver SocioAccionistaModal) — en ambos casos
          // corresponde no mostrarlo hasta que tenga un % real.
          if (item.participacion === 0) continue;
          const existing = accMap[identifier];
          if (!existing) {
            accMap[identifier] = item;
          } else {
            const existingMomento = new Date(existing.relacion?.momento || existing.relacion?.Momento || 0).getTime();
            const currentMomento = new Date(rel.momento || rel.Momento || 0).getTime();
            const existingId = Number(existing.relacionId || 0);
            const currentId = Number(rel.sociotercerorelacionid || rel.SocioTerceroRelacionID || 0);

            if (currentMomento > existingMomento || (currentMomento === existingMomento && currentId > existingId)) {
              accMap[identifier] = item;
            }
          }
        } else if (tiporelNum === 210 || tiporelNum === 230) {
          const existing = repMap[identifier];
          if (!existing) {
            repMap[identifier] = item;
          } else {
            if (item.rolId === 230 && existing.rolId !== 230) {
              repMap[identifier] = item;
            }
          }
        } else if (tiporelNum === 21) {
          const existing = bolsaMap[identifier];
          if (!existing) {
            bolsaMap[identifier] = item;
          } else {
            if (item.nrosubcuentacaja && !existing.nrosubcuentacaja) {
              bolsaMap[identifier] = item;
            }
          }
        }
      }

      return {
        accionistas: Object.values(accMap),
        representantes: Object.values(repMap),
        agentesBolsa: Object.values(bolsaMap),
      };
    },
    enabled: !!socioId,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
};

// Historial de ejecuciones de CDA de un tercero puntual (accionista/
// representante/apoderado) — ver tercerosService.obtenerExecuteCda.
export const useObtenerExecuteCdaTercero = (terceroId) => {
  return useQuery({
    queryKey: ["terceros", "executeCda", terceroId],
    queryFn: () => tercerosService.obtenerExecuteCda(terceroId),
    enabled: !!terceroId,
  });
};

// Estado CDA ("aprobado"/"rechazado"/"pendiente"/null) de varios terceros a
// la vez — usado para pintar en rojo la card de un accionista/representante/
// apoderado rechazado en las listas del legajo, y para el gate de
// completitud de useValidacionLegajo. No existe un endpoint bulk confiable
// (GET api/Terceros/ExecuteCda sin TerceroID no responde en un tiempo
// razonable, probado en vivo) — se resuelve en paralelo, uno por tercero,
// igual que ya hace useObtenerDatosSocioLegajo.
export const useEstadoCdaTerceros = (terceroIds = []) => {
  const ids = [...new Set((terceroIds || []).filter(Boolean).map(Number))].sort((a, b) => a - b);
  const idsKey = ids.join(",");
  return useQuery({
    queryKey: ["terceros", "estadoCdaBulk", idsKey],
    queryFn: async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const historial = await tercerosService.obtenerExecuteCda(id);
            return [id, calcularEstadoDesdeHistorial(normalizarHistorialTercero(historial))];
          } catch (err) {
            console.warn("[useEstadoCdaTerceros] Error obteniendo historial de CDA para tercero", id, err);
            return [id, null];
          }
        }),
      );
      return new Map(entries);
    },
    enabled: ids.length > 0,
  });
};
