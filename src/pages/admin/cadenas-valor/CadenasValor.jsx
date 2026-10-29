import React, { useState } from "react";
import { FiSearch, FiPlus, FiEdit2, FiList, FiUsers, FiShield } from "react-icons/fi";
import styles from "./CadenasValor.module.css";
import { useObtenerTodasWebConEstado, useActualizarCadenaValor } from "../../../hooks/useCadenaValor";
import { cadenaValorService } from "../../../services/cadenaValorService";
import { lineaService } from "../../../services/lineaService";
import {
  useTipoCanalComercializacion,
  useEquipoComercial,
} from "../../../hooks/useCatalogos";
import { Spinner, Button, Skeleton, Switch, SelectSimple } from "../../../components/ui";
import { Paginacion } from "../../../components/ui/Paginacion/Paginacion";
import {
  ActivarCadenaModal,
  EditarCadenaModal,
  UsuariosRelacionadosModal,
  RequisitosConfigModal,
  CdaConfigModal,
} from "../../../components/features";
import { toast } from "sonner";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import { mensajeNegocio } from "../../../utils/mensajesError";
import { obtenerInicialesEmpresa, obtenerVarianteAvatarEmpresa } from "../../../utils/empresaAvatar";
import { simboloMoneda } from "../../../utils/monedaUtils";

// Mismo criterio que Empresas.jsx/CdasGlobales.jsx: con el alto de fila
// blindado a una sola línea (table-layout:fixed + truncado, ver
// CadenasValor.module.css/el render de la tabla más abajo), 8 es el mismo
// tamaño de página ya probado en el resto del panel. Hoy hay pocas cadenas
// (no se nota), pero paginar desde ahora evita que el día que haya muchas
// la tabla vuelva a crecer sin límite.
const ELEMENTOS_POR_PAGINA = 8;

const avisarSiNoTieneLineasActivas = async (cadena) => {
  try {
    const lineas = await lineaService.obtenerLimitesCadenaValor(cadena.cadenavalorid);
    const lista = Array.isArray(lineas) ? lineas : [];
    const tieneLineasOperables = lista.some(
      (l) => String(l.activa) === "1" && String(l.aptanuevalinea) === "1",
    );
    if (!tieneLineasOperables) {
      toast.warning(`La cadena "${cadena.denominacion}" no tiene líneas activas`, {
        description: "Los clientes no van a poder crear solicitudes hasta que actives al menos una línea.",
      });
    }
  } catch (err) {
    console.error(`Error al verificar las líneas de la cadena ${cadena.cadenavalorid}:`, err);
  }
};

// Mientras carga la lista se muestran filas fantasma con la misma forma que
// las reales (el header, buscador y tabla quedan visibles al instante), en
// vez de un spinner de página completa. Mismo patrón que Empresas/CdasGlobales.
const CadenaRowSkeleton = () => (
  <div className={styles.fila}>
    <div className={styles.celdaCadena}>
      <Skeleton width="2.4rem" height="2.4rem" radius="0.65rem" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="0.9rem" />
        <Skeleton width="40%" height="0.65rem" style={{ marginTop: "0.4rem" }} />
      </div>
    </div>
    <div className={styles.celdaCanal}>
      <Skeleton width="70%" height="0.8rem" />
      <Skeleton width="50%" height="0.65rem" style={{ marginTop: "0.35rem" }} />
    </div>
    <div className={styles.celdaCupo}>
      <Skeleton width="80%" height="0.75rem" />
      <Skeleton width="100%" height="0.35rem" style={{ marginTop: "0.45rem" }} />
    </div>
    <div className={styles.acciones}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} width="5rem" height="1.9rem" radius="0.5rem" />
      ))}
    </div>
    <div className={styles.celdaActiva}>
      <Skeleton width="2.4rem" height="1.3rem" radius="pill" />
    </div>
  </div>
);

const ESTADOS_FILTRO = [
  { value: "todas", label: "Todas" },
  { value: "activas", label: "Activas" },
  { value: "inactivas", label: "Inactivas" },
];

const OPCION_TODOS = { value: "todos", label: "Todos" };

const formatearMontoCorto = (valor) => {
  if (valor >= 1000000) {
    return `${(valor / 1000000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  }
  return valor.toLocaleString("es-AR");
};

const ACCIONES = [
  { tipo: "edit", texto: "Editar", titulo: "Editar los datos de la cadena", icono: <FiEdit2 aria-hidden="true" /> },
  { tipo: "users", texto: "Usuarios", titulo: "Usuarios autorizados de la cadena", icono: <FiUsers aria-hidden="true" /> },
  { tipo: "requisitos", texto: "Requisitos", titulo: "Requisitos por tipo de persona", icono: <FiList aria-hidden="true" /> },
  { tipo: "cda", texto: "CDA", titulo: "Criterios de aceptación activos", icono: <FiShield aria-hidden="true" /> },
];

export default function CadenasValor() {
  // Defensa en profundidad: ver useBloqueoAdminRestringido.
  const bloqueado = useBloqueoAdminRestringido();
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todas");
  const [canalFiltro, setCanalFiltro] = useState(OPCION_TODOS.value);
  const [equipoFiltro, setEquipoFiltro] = useState(OPCION_TODOS.value);
  const [pagina, setPagina] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

  // Local state for optimistic status toggle and loading
  const [toggledStates, setToggledStates] = useState({});
  const [updatingIds, setUpdatingIds] = useState(new Set());

  // Queries
  const {
    data: activeCadenas,
    isLoading: isLoadingActive,
    refetch: refetchActive,
  } = useObtenerTodasWebConEstado();

  const { data: canalesData } = useTipoCanalComercializacion();
  const { data: equiposData } = useEquipoComercial();
  const actualizarMutation = useActualizarCadenaValor();

  // Normalize Catalog Options
  const canalesOpciones = canalesData?.opciones || [];
  const equiposOpciones = equiposData?.opciones || [];

  const activeList = activeCadenas || [];

  // Interruptor manual "Activa" de la tabla web: además de estar Aprobada y
  // vigente en CORE, el admin puede optar por apagar una cadena igual.
  // Solo interactuable cuando CORE la habilita (aprobadaVigente).
  const handleToggleActiva = async (item) => {
    const currentActive = String(item.activa || "1");
    const nuevoEstado = currentActive === "0" ? "1" : "0";

    // Optimistically toggle state in UI immediately
    setToggledStates(prev => ({
      ...prev,
      [item.cadenavalorid]: nuevoEstado
    }));
    setUpdatingIds(prev => {
      const next = new Set(prev);
      next.add(item.cadenavalorid);
      return next;
    });

    let coreMontoMaximo = 100;
    if (item.montomaximo == null) {
      try {
        const coreChain = await cadenaValorService.obtenerPorId(item.cadenavalorid);
        const parseMonto = (obj) => {
          if (!obj) return 0;
          const key = Object.keys(obj).find(
            (k) =>
              k.toLowerCase() === "montomaximocv" ||
              k.toLowerCase() === "montomaximo" ||
              k.toLowerCase() === "tope" ||
              k.toLowerCase() === "monto_maximo"
          );
          return parseFloat(obj[key] || 0);
        };
        coreMontoMaximo = parseMonto(coreChain);
      } catch (err) {
        console.error(`Error al obtener cadena central ${item.cadenavalorid}:`, err);
      }
    }

    const payload = {
      cadenavalorid: Number(item.cadenavalorid),
      denominacion: item.denominacion,
      referencia: item.referencia || "",
      logo: item.logo || "",
      tipocanalcomercializacionid: Number(item.tipocanalcomercializacionid),
      equipocomercialid: Number(item.equipocomercialid),
      montomaximo: item.montomaximo != null ? Number(item.montomaximo) : coreMontoMaximo,
      porcentajemaximo: item.porcentajemaximo != null ? Number(item.porcentajemaximo) : 100,
      activa: nuevoEstado
    };

    actualizarMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          nuevoEstado === "1"
            ? `Cadena "${item.denominacion}" activada.`
            : `Cadena "${item.denominacion}" desactivada.`
        );
        if (nuevoEstado === "1") avisarSiNoTieneLineasActivas(item);
        setToggledStates(prev => {
          const next = { ...prev };
          delete next[item.cadenavalorid];
          return next;
        });
        setUpdatingIds(prev => {
          const next = new Set(prev);
          next.delete(item.cadenavalorid);
          return next;
        });
        refetchActive();
      },
      onError: (err) => {
        console.error("Error al cambiar estado de la cadena:", err);
        toast.error("Ocurrió un error al cambiar el estado de la cadena de valor", { description: mensajeNegocio(err, "") });
        setToggledStates(prev => {
          const next = { ...prev };
          delete next[item.cadenavalorid];
          return next;
        });
        setUpdatingIds(prev => {
          const next = new Set(prev);
          next.delete(item.cadenavalorid);
          return next;
        });
      }
    });
  };

  // Helper to map catalog label
  const getCatalogLabel = (catalogOptions, value) => {
    if (value === undefined || value === null || value === "") return "-";
    const option = catalogOptions.find((opt) => opt.value === String(value));
    return option ? option.label : `ID: ${value}`;
  };

  // Helper to format image source for Base64 or URL
  const getLogoSrc = (logo) => {
    if (!logo) return "";
    if (logo.startsWith("data:") || logo.startsWith("http")) return logo;
    return `data:image/png;base64,${logo}`;
  };

  // Open Modals
  const handleActionClick = (item, type) => {
    setActiveItem(item);
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleOpenActivarModal = () => {
    setModalType("activar");
    setIsModalOpen(true);
  };

  const estadoDe = (item) => {
    const manual =
      toggledStates[item.cadenavalorid] !== undefined
        ? toggledStates[item.cadenavalorid]
        : String(item.activa ?? "1");
    const isManualOff = manual === "0";
    return { isManualOff, isInactive: !item.aprobadaVigente || isManualOff };
  };

  const termino = searchTerm.toLowerCase();
  const coincideBusquedaYCatalogos = (c) =>
    (c.denominacion?.toLowerCase().includes(termino) || c.referencia?.toLowerCase().includes(termino)) &&
    (canalFiltro === OPCION_TODOS.value || String(c.tipocanalcomercializacionid) === canalFiltro) &&
    (equipoFiltro === OPCION_TODOS.value || String(c.equipocomercialid) === equipoFiltro);

  const baseFiltrada = activeList.filter(coincideBusquedaYCatalogos);
  const cantidadPorEstado = {
    todas: baseFiltrada.length,
    activas: baseFiltrada.filter((c) => !estadoDe(c).isInactive).length,
    inactivas: baseFiltrada.filter((c) => estadoDe(c).isInactive).length,
  };
  const filteredCadenas = baseFiltrada.filter((c) =>
    estadoFiltro === "todas" ? true : estadoDe(c).isInactive === (estadoFiltro === "inactivas"),
  );

  const totalPaginas = Math.max(1, Math.ceil(filteredCadenas.length / ELEMENTOS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const cadenasPagina = filteredCadenas.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA
  );

  const conReinicioDePagina = (setter) => (valor) => {
    setter(valor);
    setPagina(1);
  };
  const handleBusqueda = conReinicioDePagina(setSearchTerm);

  const hayFiltrosActivos =
    !!searchTerm ||
    estadoFiltro !== "todas" ||
    canalFiltro !== OPCION_TODOS.value ||
    equipoFiltro !== OPCION_TODOS.value;

  const limpiarFiltros = () => {
    setSearchTerm("");
    setEstadoFiltro("todas");
    setCanalFiltro(OPCION_TODOS.value);
    setEquipoFiltro(OPCION_TODOS.value);
    setPagina(1);
  };

  // Cupo disponible = Monto Máximo CV de la cadena en SGR+ menos el Monto
  // Máximo asignado en la web. La barra muestra la parte ya asignada.
  const renderCupo = (item) => {
    const cupoCore = Number(item.montoMaximoCore) || 0;
    if (cupoCore <= 0) return <span className={styles.cupoVacio}>Sin cupo en SGR+</span>;
    const asignado = Number(item.montomaximo) || 0;
    const disponible = Math.max(0, cupoCore - asignado);
    const porcentajeAsignado = Math.min(100, Math.round((asignado / cupoCore) * 100));
    const simbolo = simboloMoneda(item.monedaid);
    const nivel =
      porcentajeAsignado >= 90 ? styles.cupoPeligro : porcentajeAsignado >= 70 ? styles.cupoAlerta : "";
    return (
      <div
        className={styles.cupo}
        title={`Monto Máximo CV ${simbolo} ${cupoCore.toLocaleString("es-AR")} − Monto Máximo ${simbolo} ${asignado.toLocaleString("es-AR")}`}
      >
        <div className={styles.cupoTextos}>
          <span>
            <strong>{simbolo} {formatearMontoCorto(disponible)}</strong> de {simbolo} {formatearMontoCorto(cupoCore)}
          </span>
          <span>{100 - porcentajeAsignado}% libre</span>
        </div>
        <div className={styles.cupoBarra}>
          <span className={nivel} style={{ width: `${porcentajeAsignado}%` }} />
        </div>
      </div>
    );
  };

  if (bloqueado) return null;

  return (
    <div className={styles.container} data-ancho-completo>
      <div className={styles.header}>
        <h1>Cadenas de valor</h1>
        {!isLoadingActive && (
          <span className={styles.headerResumen}>
            {filteredCadenas.length === activeList.length
              ? `${activeList.length} cadenas`
              : `${filteredCadenas.length} de ${activeList.length} cadenas`}
          </span>
        )}
        <Button type="button" variant="blue" size="md" onClick={handleOpenActivarModal} className={styles.btnActivar} aria-label="Activar cadena">
          <FiPlus /> <span className={styles.textoBoton}>Activar cadena</span>
        </Button>
      </div>

      <div className={styles.filtros}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por denominación o referencia"
            value={searchTerm}
            onChange={(e) => handleBusqueda(e.target.value)}
            aria-label="Buscar por denominación o referencia"
          />
        </div>
        <div className={styles.estados} role="radiogroup" aria-label="Estado">
          {ESTADOS_FILTRO.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={estadoFiltro === value}
              className={`${styles.estado} ${estadoFiltro === value ? styles.estadoActivo : ""}`}
              onClick={() => conReinicioDePagina(setEstadoFiltro)(value)}
            >
              {label}
              <span className={styles.estadoCantidad}>{isLoadingActive ? "–" : cantidadPorEstado[value]}</span>
            </button>
          ))}
        </div>
        <div className={styles.filtroSelect}>
          <SelectSimple
            label="Canal"
            value={canalFiltro}
            onChange={conReinicioDePagina(setCanalFiltro)}
            options={[OPCION_TODOS, ...canalesOpciones]}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
          />
        </div>
        <div className={styles.filtroSelect}>
          <SelectSimple
            label="Equipo"
            value={equipoFiltro}
            onChange={conReinicioDePagina(setEquipoFiltro)}
            options={[OPCION_TODOS, ...equiposOpciones]}
            isSearchable={false}
            hideErrorSpace
            compact
            variant="admin"
          />
        </div>
        {hayFiltrosActivos && (
          <button type="button" className={styles.limpiar} onClick={limpiarFiltros}>
            Limpiar
          </button>
        )}
      </div>

      <div className={styles.tabla}>
        <div className={`${styles.fila} ${styles.cabecera}`} aria-hidden="true">
          <span>Cadena</span>
          <span>Canal · Equipo</span>
          <span>Cupo disponible</span>
          <span className={styles.cabeceraDerecha}>Configuración</span>
          <span className={styles.cabeceraCentro}>Activa</span>
        </div>

        {isLoadingActive && Array.from({ length: 6 }).map((_, i) => <CadenaRowSkeleton key={i} />)}

        {!isLoadingActive &&
          cadenasPagina.map((item) => {
            const puedeActivarse = item.aprobadaVigente;
            const { isManualOff, isInactive } = estadoDe(item);
            const isUpdating = updatingIds.has(item.cadenavalorid);

            return (
              <div key={item.cadenavalorid} className={`${styles.fila} ${isInactive ? styles.filaInactiva : ""}`}>
                <div className={styles.celdaCadena}>
                  {item.logo ? (
                    <img src={getLogoSrc(item.logo)} alt="" className={styles.logo} />
                  ) : (
                    <span
                      className={`${styles.logo} ${styles.logoIniciales} ${styles[`avatar_${obtenerVarianteAvatarEmpresa(item.denominacion)}`]}`}
                      aria-hidden="true"
                    >
                      {obtenerInicialesEmpresa(item.denominacion || "")}
                    </span>
                  )}
                  <div className={styles.textos}>
                    <strong title={item.denominacion}>{item.denominacion}</strong>
                    <span>
                      ID #{item.cadenavalorid}
                      {item.referencia ? ` · Ref. ${item.referencia}` : ""}
                    </span>
                  </div>
                </div>

                <div className={styles.celdaCanal}>
                  <strong>{getCatalogLabel(canalesOpciones, item.tipocanalcomercializacionid)}</strong>
                  <span>{getCatalogLabel(equiposOpciones, item.equipocomercialid)}</span>
                </div>

                <div className={styles.celdaCupo}>{renderCupo(item)}</div>

                <div className={styles.acciones}>
                  {ACCIONES.map(({ tipo, texto, titulo, icono }) => (
                    <button
                      key={tipo}
                      type="button"
                      className={styles.accion}
                      onClick={() => handleActionClick(item, tipo)}
                      disabled={isInactive}
                      title={isInactive ? "Activá la cadena para configurarla" : titulo}
                    >
                      {icono}
                      {texto}
                    </button>
                  ))}
                </div>

                <div
                  className={styles.celdaActiva}
                  title={
                    !puedeActivarse
                      ? "No está Aprobada o su vigencia venció: no se puede activar desde acá"
                      : isManualOff
                        ? "Activar cadena"
                        : "Desactivar cadena"
                  }
                >
                  {isUpdating ? (
                    <Spinner size={16} />
                  ) : (
                    <Switch
                      checked={!isInactive}
                      onChange={() => handleToggleActiva(item)}
                      disabled={!puedeActivarse}
                    />
                  )}
                </div>
              </div>
            );
          })}

        {!isLoadingActive && filteredCadenas.length === 0 && (
          <p className={styles.vacio}>
            {hayFiltrosActivos
              ? "Ninguna cadena coincide con los filtros."
              : "No hay cadenas de valor activas en la web."}
          </p>
        )}
      </div>

      {!isLoadingActive && filteredCadenas.length > 0 && (
        <Paginacion
          page={paginaActual}
          onPageChange={setPagina}
          hasMoreData={paginaActual < totalPaginas}
          isLoading={isLoadingActive}
          knownEndPage={totalPaginas}
          variant="admin"
          totalItems={filteredCadenas.length}
          pageSize={ELEMENTOS_POR_PAGINA}
          itemLabel="cadenas"
        />
      )}

      {/* Modals */}
      <ActivarCadenaModal
        isOpen={isModalOpen && modalType === "activar"}
        onClose={() => setIsModalOpen(false)}
        activeList={activeList}
        onSuccess={refetchActive}
      />

      <EditarCadenaModal
        key={`editar-${activeItem?.cadenavalorid ?? "none"}-${isModalOpen && modalType === "edit" ? "open" : "closed"}`}
        isOpen={isModalOpen && modalType === "edit"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
        onSuccess={refetchActive}
      />

      <UsuariosRelacionadosModal
        isOpen={isModalOpen && modalType === "users"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
      />

      <RequisitosConfigModal
        key={`requisitos-${activeItem?.cadenavalorid ?? "none"}-${isModalOpen && modalType === "requisitos" ? "open" : "closed"}`}
        isOpen={isModalOpen && modalType === "requisitos"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
      />

      <CdaConfigModal
        isOpen={isModalOpen && modalType === "cda"}
        onClose={() => setIsModalOpen(false)}
        activeItem={activeItem}
        isReadOnly={true}
      />
    </div>
  );
}
