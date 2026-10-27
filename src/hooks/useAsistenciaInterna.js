import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { usuarioVinculacionService } from "../services/usuarioVinculacionService";

export const ASISTENCIA_PENDIENTE = "PENDIENTE";
export const ASISTENCIA_ACTIVA = "ACTIVA";
export const ASISTENCIA_VENCIDA = "VENCIDA";

export const CLAVE_ASISTENCIAS = ["asistenciaInterna", "lista"];

export const esAsistenciaVigente = (asistencia) =>
  asistencia.estado === ASISTENCIA_PENDIENTE || asistencia.estado === ASISTENCIA_ACTIVA;

const normalizar = (item, emailPropio) => {
  const mailAsistencia = String(item.mailasistencia ?? "").trim().toLowerCase();
  return {
    id: item.asistenciainternaid,
    estado: String(item.estado ?? "").toUpperCase(),
    socioId: String(item.socioid ?? ""),
    cuit: String(item.cuit ?? ""),
    denominacion: item.denominacion || "",
    usuarioSolicitaId: item.usuariosolicitaid,
    solicitadaEl: item.momentosolicitud || null,
    vencimiento: item.vencimiento || null,
    soyAsistente: !!mailAsistencia && mailAsistencia === emailPropio,
  };
};

export const useAsistenciaInterna = ({ habilitado = true } = {}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const emailPropio = String(useAuthStore((state) => state.user?.email) || "").trim().toLowerCase();

  const { data, isPending, refetch } = useQuery({
    queryKey: CLAVE_ASISTENCIAS,
    queryFn: usuarioVinculacionService.listarAsistencias,
    enabled: habilitado && isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  const asistencias = useMemo(
    () => (data || []).map((item) => normalizar(item, emailPropio)),
    [data, emailPropio],
  );

  const asistenciasQueAtiendo = asistencias.filter((a) => a.soyAsistente);
  const vigentesQueAtiendo = asistenciasQueAtiendo.filter(esAsistenciaVigente);

  const asistenciaQueAtiendo = (socioId) =>
    asistenciasQueAtiendo.find((a) => a.socioId === String(socioId ?? "") && esAsistenciaVigente(a)) || null;

  const asistenciaPedida = (socioId) =>
    asistencias.find((a) => !a.soyAsistente && a.socioId === String(socioId ?? "") && esAsistenciaVigente(a)) || null;

  return {
    asistencias,
    cargando: habilitado && isAuthenticated && isPending,
    vigentesQueAtiendo,
    asistenciaQueAtiendo,
    asistenciaPedida,
    soloAsistenciasVencidas:
      asistenciasQueAtiendo.length > 0 && asistenciasQueAtiendo.every((a) => a.estado === ASISTENCIA_VENCIDA),
    refetch,
  };
};

export const separarEmpresasAsistidas = (socioUsuarios, vigentesQueAtiendo) => {
  const idsAsistidos = new Set(vigentesQueAtiendo.map((a) => a.socioId));
  const propias = (socioUsuarios || []).filter(
    (s) => !idsAsistidos.has(String(s?.socioid ?? s?.SocioID ?? "")),
  );
  const asistidas = vigentesQueAtiendo.map((a) => ({
    socioid: Number(a.socioId),
    denominacion: a.denominacion,
    cuit: a.cuit,
    esAsistencia: true,
    asistencia: a,
  }));
  return { propias, asistidas };
};
