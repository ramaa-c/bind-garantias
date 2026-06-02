import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { tercerosService } from '../services/tercerosService';

export const useObtenerTerceros = (params = {}) => {
    return useQuery({
        queryKey: ['terceros', 'lista', params],
        queryFn: () => tercerosService.obtenerTerceros(params),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData
    });
};

export const useObtenerTerceroPorId = (terceroId) => {
    return useQuery({
        queryKey: ['terceros', 'detalle', terceroId],
        queryFn: () => tercerosService.obtenerTerceroPorId(terceroId),
        enabled: !!terceroId,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
    });
};

export const useCrearTercero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.crearTercero,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["terceros", "lista"] }),
        queryClient.invalidateQueries({ queryKey: ["socioLegajoCompleto"] }),
      ]);
    },
    onError: (error) => {
      console.error("Error al crear el tercero:", error);
    },
  });
};

export const useObtenerTiposHabilitados = (terceroId) => {
  return useQuery({
    queryKey: ["terceros", "tiposHabilitados", terceroId],
    queryFn: () => tercerosService.obtenerTiposHabilitados(terceroId),
    enabled: !!terceroId,
  });
};

export const useObtenerRelacionesDeSocio = (socioId) => {
  return useQuery({
    queryKey: ["socioTerceroRelacion", socioId],
    queryFn: () => tercerosService.obtenerRelacionesDeSocio(socioId),
    enabled: !!socioId,
  });
};

export const useGuardarRelacionesDeSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.guardarRelacionesDeSocio,
    onSuccess: (data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["relacionesSocio", variables.socioid],
        }),
        queryClient.invalidateQueries({
          queryKey: ["socioLegajoCompleto"],
        }),
      ]);
    },
    onError: (error) => {
      console.error("Error al guardar las relaciones del socio:", error);
    },
  });
};

export const useBuscarTerceroPorCuit = () => {
  return useMutation({
    mutationFn: (cuit) => tercerosService.obtenerTerceros({ Cuit: cuit }),
  });
};

export const useActualizarTercero = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.actualizarTercero,
    onSuccess: (data, variables) => {
      return Promise.all(
        [
          queryClient.invalidateQueries({ queryKey: ["terceros", "lista"] }),
          queryClient.invalidateQueries({ queryKey: ["socioLegajoCompleto"] }),
          variables.tercerorelacionadoid &&
            queryClient
              .invalidateQueries({
                queryKey: [
                  "terceros",
                  "detalle",
                  variables.tercerorelacionadoid,
                ],
              })
              .catch(() => {}),
        ].filter(Boolean),
      );
    },
    onError: (error) => {
      console.error("Error al actualizar el tercero:", error);
    },
  });
};

export const useActualizarRelacionSocio = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tercerosService.actualizarRelacionDeSocio,
    onSuccess: (data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["relacionesSocio", variables.socioid],
        }),
        queryClient.invalidateQueries({
          queryKey: ["socioLegajoCompleto"],
        }),
      ]);
    },
    onError: (error) => {
      console.error("Error al actualizar la relación del socio:", error);
    },
  });
};

//------- TERCEROS RELACIONADOS (SGRPlus) ---------

export const useObtenerTercerosSGRPlus = (params = {}) => {
    return useQuery({
        queryKey: ['tercerosSGRPlus', 'lista', params],
        queryFn: () => tercerosService.obtenerTercerosSGRPlus(params),
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData
    });
};

export const useObtenerTerceroPorIdSGRPlus = (terceroId) => {
    return useQuery({
        queryKey: ['tercerosSGRPlus', 'detalle', terceroId],
        queryFn: () => tercerosService.obtenerTerceroPorIdSGRPlus(terceroId),
        enabled: !!terceroId,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
    });
};

export const useObtenerRelacionesDeSocioSGRPlus = (socioId) => {
  return useQuery({
    queryKey: ["socioTerceroRelacionSGRPlus", socioId],
    queryFn: () => tercerosService.obtenerRelacionesDeSocioSGRPlus(socioId),
    enabled: !!socioId,
  });
};

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

      const now = new Date();

      await Promise.all(
        arr.map(async (rel) => {
          const fd = rel.fechadesde || rel.FechaDesde;
          const fh = rel.fechahasta || rel.FechaHasta;
          if (fh && fh !== "") {
            const expirationDate = new Date(fh);
            const startDate = fd ? new Date(fd) : null;

            const isSameAsStart =
              startDate &&
              (expirationDate.getTime() === startDate.getTime() ||
                expirationDate.toISOString().split("T")[0] ===
                  startDate.toISOString().split("T")[0]);

            if (!isSameAsStart && expirationDate < now) {
              return;
            }
          }

          const tid =
            rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
          if (!tid) return;

          try {
            let t = null;
            try {
              t = await tercerosService.obtenerTerceroPorId(tid);
            } catch (apiErr) {
              console.warn(
                `[LEGAJO] No se pudo obtener tercero ${tid} de la API estándar. Intentando SGRPlus...`,
              );
              try {
                t = await tercerosService.obtenerTerceroPorIdSGRPlus(tid);
              } catch (sgrErr) {
                console.error(
                  `[LEGAJO] Error total obteniendo tercero ${tid}:`,
                  sgrErr,
                );
              }
            }

            if (t) {
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
                ciudadid: t.ciudadid || 0,
                provinciaid:
                  rel.provinciaid || rel.ProvinciaID || t.provinciaid || 0,
                tipopersonaid: t.tipopersonaid || 1,
              };

              const identifier =
                item.cuit && item.cuit !== "—" ? item.cuit : item.id;

              if (tiporelNum === 25) {
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
          } catch (e) {
            console.warn("Error fetching third party detail:", tid, e);
          }
        })
      );

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
