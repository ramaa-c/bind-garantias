import { useMemo } from 'react';
import { useQuery, useMutation, keepPreviousData } from '@tanstack/react-query';
import { cadenaValorService } from '../services/cadenaValorService';
import { cdaService } from '../services/cdaService';
import { esCadenaAprobadaYVigente, esCadenaOperativaParaWeb, obtenerCadenaValorId } from '../utils/cadenaValorUtils';

export const useObtenerTodas = (page = 1, pageSize = 10) => {
    return useQuery({
        queryKey: ['cadenaValor', 'todas', page, pageSize],
        queryFn: () => cadenaValorService.obtenerTodas(page, pageSize),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
    });
};

// Cadenas que cursan por plataforma (CursaPlataforma=1): incluye las que
// cursan solo por plataforma y las que además cursan por SGR+. Es la fuente
// de verdad de Estado/VigenciaHasta para determinar si una cadena está activa.
export const useObtenerCadenasCursanPlataforma = () => {
    return useQuery({
        queryKey: ['cadenaValor', 'cursanPlataforma'],
        queryFn: () => cadenaValorService.obtenerTodasPorPlataforma(1, 1, 200),
        staleTime: 1000 * 60 * 5,
    });
};

export const useObtenerPorId = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerPorId(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

export const useObtenerLineas = (cadenaValorId, page = 1, pageSize = 10) => {
    return useQuery({
        queryKey: ['cadenaValor', 'lineas', cadenaValorId, page, pageSize],
        queryFn: () => cadenaValorService.obtenerLineas(cadenaValorId, page, pageSize),
        enabled: !!cadenaValorId,
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData
    });
};

export const useObtenerUtilizado = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', 'utilizado', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerUtilizado(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

export const useObtenerPorCadenaValorIdWeb = (cadenaValorId) => {
    return useQuery({
        queryKey: ['cadenaValor', 'web', cadenaValorId],
        queryFn: () => cadenaValorService.obtenerPorCadenaValorIdWeb(cadenaValorId),
        enabled: !!cadenaValorId
    });
};

// Lectura pasiva (no crea nada): resuelve el GrupoCda de (Pantalla, Cadena) y
// trae sus CDAs vinculados. Si el grupo todavía no existe, devuelve
// { grupo: null, cdas: [] } en vez de crearlo — la creación queda para el
// momento de guardar (ver resolverGrupoCda en grupoCdaUtils), nunca como
// efecto secundario de abrir una pantalla de solo consulta/edición.
export const useObtenerGrupoCdaConCdas = (cadenaId, pantalla) => {
    return useQuery({
        queryKey: ['cadenaValor', 'grupoCdaConCdas', pantalla, cadenaId],
        queryFn: async () => {
            const grupo = await cdaService.obtenerGrupoCda(pantalla, cadenaId);
            const grupoList = Array.isArray(grupo) ? grupo : grupo?.items || grupo?.data || (grupo ? [grupo] : []);
            const grupoRow = grupoList[0] || null;
            if (!grupoRow?.grupocdaid) return { grupo: null, cdas: [] };
            const cdas = await cadenaValorService.obtenerCdasPorGrupo(grupoRow.grupocdaid);
            return { grupo: grupoRow, cdas };
        },
        enabled: !!cadenaId && !!pantalla
    });
};

export const useCrearCadenaValor = () => {
    return useMutation({
        mutationFn: cadenaValorService.crearCadenaValor
    });
};

export const useActualizarCadenaValor = () => {
    return useMutation({
        mutationFn: cadenaValorService.actualizarCadenaValor
    });
};

export const useObtenerTodasWeb = () => {
    return useQuery({
        queryKey: ['cadenaValor', 'web', 'todas_list'],
        queryFn: () => cadenaValorService.obtenerTodasWeb(),
    });
};

// Cadenas de la web (con su config de canal/equipo/logo) enriquecidas con:
// - "aprobadaVigente": el estado real según CORE (Estado=Aprobada y
//   VigenciaHasta no vencida).
// - "activaOperativa": aprobadaVigente Y no desactivada manualmente con el
//   switch "Activa" de la tabla web. Es el criterio que determina si la
//   cadena está realmente disponible para operar (selectores, acceso cliente).
export const useObtenerTodasWebConEstado = () => {
    const webQuery = useObtenerTodasWeb();
    const coreQuery = useObtenerCadenasCursanPlataforma();

    // Memoizado por referencia de dato (no por render): evita romper efectos
    // o memos de quien consuma este hook con un array nuevo en cada render.
    const data = useMemo(() => {
        const webList = Array.isArray(webQuery.data) ? webQuery.data : webQuery.data?.items || webQuery.data?.data || [];
        const coreList = Array.isArray(coreQuery.data) ? coreQuery.data : coreQuery.data?.items || coreQuery.data?.data || [];
        const coreById = new Map(coreList.map((c) => [String(obtenerCadenaValorId(c)), c]));

        return webList.map((item) => {
            const cadenaCore = coreById.get(String(item.cadenavalorid));
            return {
                ...item,
                aprobadaVigente: esCadenaAprobadaYVigente(cadenaCore),
                activaOperativa: esCadenaOperativaParaWeb(item, cadenaCore),
            };
        });
    }, [webQuery.data, coreQuery.data]);

    return {
        data,
        isLoading: webQuery.isLoading || coreQuery.isLoading,
        refetch: () => Promise.all([webQuery.refetch(), coreQuery.refetch()]),
    };
};

export const useVincularCdasAGrupo = () => {
    return useMutation({
        mutationFn: (vinculacionData) => cadenaValorService.vincularCdasAGrupo(vinculacionData),
    });
};

export const useActualizarVinculacionCda = () => {
    return useMutation({
        mutationFn: (vinculacionData) => cadenaValorService.actualizarVinculacionCda(vinculacionData),
    });
};
