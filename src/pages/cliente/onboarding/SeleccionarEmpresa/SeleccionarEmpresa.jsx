import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  FiArchive,
  FiFileText,
  FiPlus,
  FiSearch,
  FiUsers,
  FiXCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { Paginacion, SelectSimple, Skeleton } from "../../../../components/ui";
import { DetalleSolicitudModal } from "../../../../components/features";
import { ConfirmacionModal } from "../../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useChannel } from "../../../../context/useChannel";
import { useEmpresasVendor, useSolicitudesVendor } from "../../../../hooks/useEmpresasVendor";
import { useTiposProducto } from "../../../../hooks/useCatalogos";
import { useActualizarLimiteSocio } from "../../../../hooks/useLinea";
import { solicitudesService } from "../../../../services/solicitudesService";
import { etiquetaFamiliaDeLinea } from "../../../../utils/familiaLinea";
import { importeOriginalDeLimite, simboloMoneda } from "../../../../utils/monedaUtils";
import { mensajeNegocio } from "../../../../utils/mensajesError";
import {
  ESTADO_PENDIENTE,
  ESTADO_CANCELADA,
  estadoTextoDesde,
  esEstadoEnCurso,
  MOTIVO_CANCELACION_SOCIO,
} from "../../../../utils/estadoLimiteSocio";
import { FilaSolicitudVendor, FilaEmpresaVendor } from "./FilasPanelVendor";
import { SelectorEmpresaVendor } from "../../../../components/layout/Client/Sidebar/VendorSidebar";
import styles from "./SeleccionarEmpresa.module.css";

const POR_PAGINA = 10;

const FILTROS_ESTADO = [
  { clave: "todas", label: "Todas" },
  { clave: "encurso", label: "En evaluación" },
  { clave: "aprobada", label: "Aprobadas" },
  { clave: "rechazada", label: "Rechazadas" },
  { clave: "cancelada", label: "Canceladas" },
];

const FILTROS_EMPRESA = [
  { clave: "sin", label: "Sin solicitud en curso" },
  { clave: "con", label: "Con solicitud en curso" },
  { clave: "todas", label: "Todas" },
];

const opcionesOrdenSolicitudes = [
  { value: "desc", label: "Más recientes" },
  { value: "asc", label: "Más antiguas" },
];

const opcionesOrdenEmpresas = [
  { value: "az", label: "A–Z" },
  { value: "za", label: "Z–A" },
];

const soloDigitos = (s) => String(s || "").replace(/\D/g, "");
const idNumerico = (item) => parseInt(String(item.id), 10) || 0;

const claveEstado = (item) => {
  if (item.enCurso) return "encurso";
  const e = (item.estado || "").toLowerCase();
  if (e.includes("aprob")) return "aprobada";
  if (e.includes("rechaz")) return "rechazada";
  return "cancelada";
};

const coincideTexto = (texto, ...campos) => {
  if (!texto) return true;
  const digitos = soloDigitos(texto);
  return campos.some((c) => {
    const valor = String(c || "");
    return valor.toLowerCase().includes(texto) || (digitos.length >= 3 && soloDigitos(valor).includes(digitos));
  });
};

const Chips = ({ opciones, activa, conteos, onCambiar, etiqueta }) => (
  <div className={styles.chips} role="group" aria-label={etiqueta}>
    {opciones.map(({ clave, label }) => (
      <button
        key={clave}
        type="button"
        className={`${styles.chip} ${activa === clave ? styles.chipActivo : ""}`}
        aria-pressed={activa === clave}
        onClick={() => onCambiar(clave)}
      >
        {label}
        <span className={styles.chipCuenta}>{conteos[clave] ?? 0}</span>
      </button>
    ))}
  </div>
);

const FilasCargando = () => (
  <div className={styles.lista} aria-busy="true">
    {[0, 1, 2, 3].map((i) => (
      <Skeleton key={i} height="4.25rem" radius="1rem" />
    ))}
  </div>
);

/* ─── Panel del vendor: solicitudes y empresas de todas sus empresas ─── */

export const SeleccionarEmpresa = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { basePath } = useChannel();
  const setActiveSocioId = useAuthStore((state) => state.setActiveSocioId);
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);

  const vista = new URLSearchParams(location.search).get("vista") === "empresas" ? "empresas" : "solicitudes";
  const irAVista = (v) => navigate(`${basePath}/seleccionar-empresa${v === "empresas" ? "?vista=empresas" : ""}`);

  const { empresas, cargando: cargandoEmpresas } = useEmpresasVendor();
  const { porEmpresa, cargando: cargandoSolicitudes, hayErrores } = useSolicitudesVendor(empresas);
  const { data: tiposLimiteGlobal } = useTiposProducto();

  const { control, register } = useForm({
    defaultValues: { busqueda: "", ordenSolicitudes: "desc", ordenEmpresas: "az" },
  });
  const filtros = useWatch({ control });
  const texto = (filtros.busqueda || "").trim().toLowerCase();

  const [estadoFiltro, setEstadoFiltro] = useState("todas");
  const [empresaFiltro, setEmpresaFiltro] = useState("sin");
  // La página vuelve a 1 cada vez que cambian la vista o los filtros.
  const claveFiltros = [
    vista,
    texto,
    estadoFiltro,
    empresaFiltro,
    filtros.ordenSolicitudes,
    filtros.ordenEmpresas,
  ].join("|");
  const [paginacion, setPaginacion] = useState({ clave: claveFiltros, pagina: 1 });
  const pagina = paginacion.clave === claveFiltros ? paginacion.pagina : 1;
  const setPagina = (p) => setPaginacion({ clave: claveFiltros, pagina: p });
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [solicitudACancelar, setSolicitudACancelar] = useState(null);

  /* — datos — */
  const solicitudes = useMemo(
    () =>
      porEmpresa.flatMap(({ empresa, solicitudes: lista }) =>
        lista.map((s) => {
          const tipoLimiteEstadoId = Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE);
          return {
            id: s.tipolimitesocioid?.toString() || "",
            tipo: etiquetaFamiliaDeLinea(tiposLimiteGlobal, s.tipolimiteid),
            lineaNombre:
              tiposLimiteGlobal?.raw?.find((t) => Number(t.tipolimiteid) === Number(s.tipolimiteid))
                ?.descripcion || "",
            monto: new Intl.NumberFormat("es-AR").format(importeOriginalDeLimite(s)),
            moneda: simboloMoneda(s.monedaid),
            estado: estadoTextoDesde(tipoLimiteEstadoId),
            enCurso: esEstadoEnCurso(tipoLimiteEstadoId),
            fecha: s.fchvigenciadesde ? new Date(s.fchvigenciadesde).toLocaleDateString("es-AR") : "-",
            socioid: empresa.socioId,
            cuit: empresa.cuit,
            empresaNombre: empresa.nombre,
            raw: s,
          };
        }),
      ),
    [porEmpresa, tiposLimiteGlobal],
  );

  const resumenPorEmpresa = useMemo(() => {
    const mapa = new Map();
    porEmpresa.forEach(({ empresa, solicitudes: lista }) => {
      const enCurso = lista.filter((s) => esEstadoEnCurso(Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE))).length;
      mapa.set(String(empresa.socioId), { enCurso, total: lista.length });
    });
    return mapa;
  }, [porEmpresa]);

  /* — vista Solicitudes — */
  const solicitudesPorTexto = useMemo(
    () => solicitudes.filter((s) => coincideTexto(texto, s.empresaNombre, s.cuit, s.id, s.tipo)),
    [solicitudes, texto],
  );

  const conteosEstado = useMemo(() => {
    const c = { todas: solicitudesPorTexto.length, encurso: 0, aprobada: 0, rechazada: 0, cancelada: 0 };
    solicitudesPorTexto.forEach((s) => {
      c[claveEstado(s)] += 1;
    });
    return c;
  }, [solicitudesPorTexto]);

  // En curso primero (es lo que necesita atención), después el resto; dentro
  // de cada grupo, por número de solicitud según el orden elegido.
  const solicitudesOrdenadas = useMemo(() => {
    const filtradas =
      estadoFiltro === "todas"
        ? solicitudesPorTexto
        : solicitudesPorTexto.filter((s) => claveEstado(s) === estadoFiltro);
    const signo = filtros.ordenSolicitudes === "asc" ? -1 : 1;
    return [...filtradas].sort((a, b) => {
      if (a.enCurso !== b.enCurso) return a.enCurso ? -1 : 1;
      return signo * (idNumerico(b) - idNumerico(a));
    });
  }, [solicitudesPorTexto, estadoFiltro, filtros.ordenSolicitudes]);

  /* — vista Empresas — */
  const empresasPorTexto = useMemo(
    () => empresas.filter((e) => coincideTexto(texto, e.nombre, e.cuit)),
    [empresas, texto],
  );

  const conteosEmpresa = useMemo(() => {
    const c = { todas: empresasPorTexto.length, sin: 0, con: 0 };
    empresasPorTexto.forEach((e) => {
      if ((resumenPorEmpresa.get(String(e.socioId))?.enCurso || 0) > 0) c.con += 1;
      else c.sin += 1;
    });
    return c;
  }, [empresasPorTexto, resumenPorEmpresa]);

  const empresasOrdenadas = useMemo(() => {
    const filtradas = empresasPorTexto.filter((e) => {
      if (empresaFiltro === "todas") return true;
      const enCurso = resumenPorEmpresa.get(String(e.socioId))?.enCurso || 0;
      return empresaFiltro === "con" ? enCurso > 0 : enCurso === 0;
    });
    const signo = filtros.ordenEmpresas === "za" ? -1 : 1;
    return [...filtradas].sort((a, b) => signo * a.nombre.localeCompare(b.nombre, "es"));
  }, [empresasPorTexto, empresaFiltro, resumenPorEmpresa, filtros.ordenEmpresas]);

  /* — paginación — */
  const lista = vista === "empresas" ? empresasOrdenadas : solicitudesOrdenadas;
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = lista.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  /* — acciones — */
  const entrarAEmpresa = (empresa, estado) => {
    cambiarEmpresa();
    setActiveSocioId(empresa.socioId);
    navigate(`${basePath}/solicitudes`, estado ? { state: estado } : undefined);
  };
  // Las validaciones de "Nueva operación" (solicitud pendiente, borrador,
  // habilitación) viven en Solicitudes: se entra a la empresa y se dispara
  // desde ahí.
  const iniciarOperacion = (empresa) => entrarAEmpresa(empresa, { iniciarOperacion: true });

  const actualizarLimiteMutation = useActualizarLimiteSocio();
  const handleConfirmarCancelacion = async () => {
    const s = solicitudACancelar;
    if (!s?.raw) return;
    try {
      await actualizarLimiteMutation.mutateAsync({
        ...s.raw,
        tipolimiteestadoid: ESTADO_CANCELADA,
        observaciones: MOTIVO_CANCELACION_SOCIO,
      });
      // Mismo criterio que Solicitudes.jsx: se refleja también en
      // SolicitudEnProceso, sin bloquear la cancelación si falla.
      const tipoLimiteId = s.raw?.tipolimiteid ?? s.raw?.TipoLimiteID;
      const cadenaValorId = s.raw?.cadenavalorid ?? s.raw?.CadenaValorID;
      if (tipoLimiteId && cadenaValorId && s.cuit) {
        solicitudesService
          .sincronizarEstadoSolicitudEnProcesoPorClave(s.cuit, tipoLimiteId, cadenaValorId, ESTADO_CANCELADA)
          .catch((syncErr) => {
            console.error(
              `[PanelVendor] No se pudo sincronizar SolicitudEnProceso para la solicitud N°${s.id}:`,
              syncErr,
            );
          })
          .finally(() => {
            queryClient.invalidateQueries({ queryKey: ["solicitudes", "en-proceso"] });
          });
      }
      toast.success(`Solicitud N°${s.id} cancelada`, { description: s.empresaNombre });
      setSolicitudACancelar(null);
    } catch (err) {
      toast.error("No se pudo cancelar la solicitud: " + mensajeNegocio(err, err.message));
    }
  };

  /* — render — */
  const enCursoVisibles = visibles.filter((s) => s.enCurso);
  const resueltasVisibles = visibles.filter((s) => !s.enCurso);
  const totalEnCurso = solicitudesOrdenadas.filter((s) => s.enCurso).length;
  const totalResueltas = solicitudesOrdenadas.length - totalEnCurso;
  const cargandoLista = cargandoEmpresas || (vista === "solicitudes" && cargandoSolicitudes);

  const renderFilaSolicitud = (s) => (
    <FilaSolicitudVendor
      key={`${s.socioid}-${s.id}`}
      solicitud={s}
      onVerDetalle={setSolicitudSeleccionada}
      onCancelar={s.enCurso && s.raw ? setSolicitudACancelar : undefined}
    />
  );

  const sinEmpresas = !cargandoEmpresas && empresas.length === 0;

  return (
    <div className={styles.pageContainer}>
      {/* Mobile: selector de empresa y las dos vistas como pestañas (en
          escritorio los dos están en el sidebar). */}
      {!sinEmpresas && (
        <div className={styles.selectorMovil}>
          <SelectorEmpresaVendor
            empresas={empresas}
            socioIdActivo={null}
            empresaActiva={null}
            onElegir={(socioId) => {
              const empresa = empresas.find((e) => String(e.socioId) === String(socioId));
              if (empresa) entrarAEmpresa(empresa);
            }}
            onVerTodas={() => irAVista("empresas")}
          />
        </div>
      )}
      <div className={styles.tabsMovil} role="tablist" aria-label="Vistas">
        <button
          type="button"
          role="tab"
          aria-selected={vista === "solicitudes"}
          className={`${styles.tabMovil} ${vista === "solicitudes" ? styles.tabMovilActiva : ""}`}
          onClick={() => irAVista("solicitudes")}
        >
          Solicitudes{conteosEstado.encurso > 0 ? ` · ${conteosEstado.encurso}` : ""}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={vista === "empresas"}
          className={`${styles.tabMovil} ${vista === "empresas" ? styles.tabMovilActiva : ""}`}
          onClick={() => irAVista("empresas")}
        >
          Empresas
        </button>
      </div>

      <header className={styles.header}>
        <div className={styles.headerIzq}>
          <span className={styles.headerIcono} aria-hidden="true">
            {vista === "empresas" ? <FiUsers /> : <FiFileText />}
          </span>
          <div className={styles.headerTextos}>
            <h1 className={styles.titulo}>{vista === "empresas" ? "Empresas" : "Solicitudes"}</h1>
            <p className={styles.subtitulo}>
              {vista === "empresas"
                ? "Arrancamos por las que no tienen una solicitud en curso."
                : "Las de todas tus empresas, lo que está en evaluación primero."}
            </p>
          </div>
        </div>
        {vista === "empresas" && (
          <button
            type="button"
            className={`${styles.btnSecundario} ${styles.soloAncho}`}
            onClick={() => navigate(`${basePath}/alta-datos-empresa`)}
          >
            <FiPlus aria-hidden="true" /> Vincular empresa
          </button>
        )}
      </header>

      {sinEmpresas ? (
        <div className={styles.vacio}>
          <span className={styles.vacioIcono} aria-hidden="true">
            <FiArchive />
          </span>
          <h3 className={styles.vacioTitulo}>Aún no tenés empresas vinculadas</h3>
          <p className={styles.vacioTexto}>Para comenzar a operar, vinculá tu primera empresa.</p>
          <button
            type="button"
            className={styles.btnPrimario}
            onClick={() => navigate(`${basePath}/alta-datos-empresa`)}
          >
            <FiPlus aria-hidden="true" /> Vincular empresa
          </button>
        </div>
      ) : (
        <>
          <div className={styles.filtros}>
            <label className={styles.buscador}>
              <FiSearch className={styles.buscadorIcono} aria-hidden="true" />
              <input
                type="text"
                className={styles.buscadorInput}
                placeholder={vista === "empresas" ? "Razón social o CUIT" : "Empresa, CUIT o N°"}
                {...register("busqueda")}
              />
            </label>
            <div className={styles.filtroOrden}>
              {vista === "empresas" ? (
                <SelectSimple
                  key="ordenEmpresas"
                  name="ordenEmpresas"
                  control={control}
                  label="Orden"
                  options={opcionesOrdenEmpresas}
                  variant="client"
                  compact
                  hideErrorSpace
                />
              ) : (
                <SelectSimple
                  key="ordenSolicitudes"
                  name="ordenSolicitudes"
                  control={control}
                  label="Orden"
                  options={opcionesOrdenSolicitudes}
                  variant="client"
                  compact
                  hideErrorSpace
                />
              )}
            </div>
          </div>

          {vista === "empresas" ? (
            <Chips
              opciones={FILTROS_EMPRESA}
              activa={empresaFiltro}
              conteos={conteosEmpresa}
              onCambiar={setEmpresaFiltro}
              etiqueta="Filtrar empresas"
            />
          ) : (
            <Chips
              opciones={FILTROS_ESTADO}
              activa={estadoFiltro}
              conteos={conteosEstado}
              onCambiar={setEstadoFiltro}
              etiqueta="Filtrar por estado"
            />
          )}

          {vista === "solicitudes" && hayErrores && !cargandoSolicitudes && (
            <p className={styles.aviso} role="status">
              <FiAlertTriangle aria-hidden="true" />
              No pudimos traer las solicitudes de algunas empresas. Probá actualizar en unos minutos.
            </p>
          )}

          {cargandoLista ? (
            <FilasCargando />
          ) : lista.length === 0 ? (
            <div className={styles.vacio}>
              <p className={styles.vacioTexto}>
                {vista === "empresas"
                  ? texto || empresaFiltro !== "todas"
                    ? "No hay empresas con esos filtros."
                    : "No hay empresas para mostrar."
                  : solicitudes.length > 0
                    ? "No encontramos solicitudes con esos filtros."
                    : "Tus empresas todavía no tienen solicitudes."}
              </p>
            </div>
          ) : vista === "empresas" ? (
            <div className={styles.lista}>
              {visibles.map((e) => {
                const resumen = resumenPorEmpresa.get(String(e.socioId));
                return (
                  <FilaEmpresaVendor
                    key={e.socioId}
                    empresa={e}
                    cantidadEnCurso={resumen?.enCurso || 0}
                    cantidadTotal={resumen?.total || 0}
                    onAbrir={(emp) => entrarAEmpresa(emp)}
                    onIniciarOperacion={iniciarOperacion}
                  />
                );
              })}
            </div>
          ) : (
            <div className={styles.secciones}>
              {enCursoVisibles.length > 0 && (
                <section className={styles.seccion} aria-label="En evaluación">
                  <h2 className={styles.seccionTitulo}>
                    En evaluación <span className={styles.seccionCuenta}>{totalEnCurso}</span>
                  </h2>
                  <div className={styles.lista}>{enCursoVisibles.map(renderFilaSolicitud)}</div>
                </section>
              )}
              {resueltasVisibles.length > 0 && (
                <section className={styles.seccion} aria-label="Resueltas">
                  <h2 className={styles.seccionTitulo}>
                    Resueltas <span className={styles.seccionCuenta}>{totalResueltas}</span>
                  </h2>
                  <div className={styles.lista}>{resueltasVisibles.map(renderFilaSolicitud)}</div>
                </section>
              )}
            </div>
          )}

          {!cargandoLista && lista.length > POR_PAGINA && (
            <Paginacion
              page={paginaSegura}
              onPageChange={setPagina}
              hasMoreData={paginaSegura < totalPaginas}
              knownEndPage={totalPaginas}
              totalItems={lista.length}
              pageSize={POR_PAGINA}
              itemLabel={vista === "empresas" ? "empresas" : "solicitudes"}
              variant="client"
            />
          )}

          {vista === "empresas" && (
            <p className={styles.vincularPie}>
              ¿Falta una?{" "}
              <button type="button" className={styles.link} onClick={() => navigate(`${basePath}/alta-datos-empresa`)}>
                Vincular empresa
              </button>
            </p>
          )}
        </>
      )}


      <DetalleSolicitudModal
        isOpen={!!solicitudSeleccionada}
        onClose={() => setSolicitudSeleccionada(null)}
        solicitud={solicitudSeleccionada}
        nombreEmpresa={solicitudSeleccionada?.empresaNombre}
      />

      <ConfirmacionModal
        isOpen={!!solicitudACancelar}
        onClose={() => setSolicitudACancelar(null)}
        onConfirm={handleConfirmarCancelacion}
        isLoading={actualizarLimiteMutation.isPending}
        tone="danger"
        titulo={`¿Cancelar la Solicitud N° ${solicitudACancelar?.id ?? ""}?`}
        mensaje={`Es de ${solicitudACancelar?.empresaNombre || "la empresa"}. La solicitud se cierra y no se puede retomar.`}
        icono={<FiXCircle />}
        confirmText="Sí, cancelar"
        cancelText="Volver"
      />
    </div>
  );
};

export default SeleccionarEmpresa;
