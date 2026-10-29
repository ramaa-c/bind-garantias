import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiSearch, FiFileText, FiUsers, FiDollarSign, FiLayers, FiAlertTriangle, FiChevronLeft, FiInbox } from "react-icons/fi";
import styles from "./CadenasCda.module.css";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { CdaPanel } from "../../../components/features/admin/CdaPanel/CdaPanel";
import { PANTALLAS_CDA, PANTALLA_LINEAS } from "../../../utils/pantallasCda";
import { useObtenerTodasWebConEstado, useObtenerGrupoCdaConCdas } from "../../../hooks/useCadenaValor";
import { useObtenerLimitesCadenaValor } from "../../../hooks/useLinea";
import { useTiposProducto } from "../../../hooks/useCatalogos";
import { esCdaActivo } from "../../../utils/cdaUtils";
import { obtenerInicialesEmpresa, obtenerVarianteAvatarEmpresa } from "../../../utils/empresaAvatar";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";

const PANTALLAS = [
  { value: PANTALLAS_CDA[0].value, label: "Validación de CUIT", icono: <FiFileText aria-hidden="true" /> },
  { value: PANTALLAS_CDA[1].value, label: "Socios y representantes", icono: <FiUsers aria-hidden="true" /> },
  { value: PANTALLA_LINEAS, label: "Alta de línea", icono: <FiDollarSign aria-hidden="true" /> },
];

const DESCRIPCION_LINEAS =
  "Se validan al pedir una línea y aplican a todas las líneas activas.";

const contarCdasActivos = (data) => {
  const cdas = Array.isArray(data?.cdas) ? data.cdas : data?.cdas?.items || data?.cdas?.data || [];
  return cdas.filter(esCdaActivo).length;
};

const logoSrc = (logo) => {
  if (!logo) return "";
  if (logo.startsWith("data:") || logo.startsWith("http")) return logo;
  return `data:image/png;base64,${logo}`;
};

const LogoCadena = ({ cadena, grande = false }) =>
  cadena.logo ? (
    <img src={logoSrc(cadena.logo)} alt="" className={`${styles.logo} ${grande ? styles.logoGrande : ""}`} />
  ) : (
    <span
      className={`${styles.logo} ${styles.logoIniciales} ${grande ? styles.logoGrande : ""} ${styles[`avatar_${obtenerVarianteAvatarEmpresa(cadena.denominacion)}`]}`}
      aria-hidden="true"
    >
      {obtenerInicialesEmpresa(cadena.denominacion || "")}
    </span>
  );

export default function CadenasCda() {
  // Defensa en profundidad: ver useBloqueoAdminRestringido.
  const bloqueado = useBloqueoAdminRestringido();
  const [searchParams] = useSearchParams();
  const pantallaInicial = PANTALLAS.some((p) => p.value === searchParams.get("pantalla"))
    ? searchParams.get("pantalla")
    : PANTALLAS[0].value;

  const [busqueda, setBusqueda] = useState("");
  const [selectedCadenaId, setSelectedCadenaId] = useState(() => searchParams.get("cadena") || "");
  const [selectedPantalla, setSelectedPantalla] = useState(pantallaInicial);
  const [verDetalleMovil, setVerDetalleMovil] = useState(() => !!searchParams.get("cadena"));
  const [contenedorPie, setContenedorPie] = useState(null);

  const { data: activeCadenas, isLoading: isLoadingActive } = useObtenerTodasWebConEstado();

  // Solo cadenas activas: no tiene sentido configurarle CDAs a una cadena inactiva.
  const activeList = (activeCadenas || []).filter((c) => c.activaOperativa);
  const termino = busqueda.trim().toLowerCase();
  const filtradas = activeList.filter(
    (c) =>
      !termino ||
      c.denominacion?.toLowerCase().includes(termino) ||
      c.referencia?.toLowerCase().includes(termino) ||
      String(c.cadenavalorid).includes(termino),
  );

  const activeItem =
    activeList.find((c) => String(c.cadenavalorid) === String(selectedCadenaId)) || activeList[0];
  const cadenaId = activeItem?.cadenavalorid;

  const grupoCuit = useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS[0].value);
  const grupoSocios = useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS[1].value);
  const grupoLineas = useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS[2].value);
  const estados = {
    [PANTALLAS[0].value]: grupoCuit,
    [PANTALLAS[1].value]: grupoSocios,
    [PANTALLAS[2].value]: grupoLineas,
  };

  // El backend no tiene "CDA por línea": los CDAs de alta de línea se
  // vinculan a la cadena entera y aplican a todas sus líneas activas.
  const esLineas = selectedPantalla === PANTALLA_LINEAS;
  const { data: lineasCadena, isLoading: isLoadingLineas } = useObtenerLimitesCadenaValor(
    esLineas ? cadenaId : undefined,
  );
  const { data: tiposLimite } = useTiposProducto();
  const nombresLineasActivas = (lineasCadena || [])
    .filter((l) => String(l.activa) === "1")
    .map((l) => {
      const tipo = tiposLimite?.raw?.find((t) => String(t.tipolimiteid) === String(l.tipolimiteid));
      return l.descripcion || tipo?.descripcion || `Línea #${l.tipolimiteid}`;
    });

  const elegirCadena = (id) => {
    setSelectedCadenaId(String(id));
    setVerDetalleMovil(true);
  };

  const renderEstadoPantalla = (valor) => {
    const estado = estados[valor];
    if (estado.isLoading) return <span className={styles.estadoCargando} />;
    if (estado.isError) return <span className={`${styles.estado} ${styles.estadoError}`}>Error</span>;
    const cantidad = contarCdasActivos(estado.data);
    return cantidad > 0 ? (
      <span className={`${styles.estado} ${styles.estadoOk}`}>
        {cantidad} activo{cantidad !== 1 ? "s" : ""}
      </span>
    ) : (
      <span className={styles.estado}>Sin CDAs</span>
    );
  };

  if (bloqueado) return null;

  return (
    <div className={styles.container} data-ancho-completo>
      <div className={styles.header}>
        <h1>CDAs por cadena</h1>
        <span className={styles.headerResumen}>Qué criterios se validan en cada cadena, por pantalla</span>
      </div>

      <div className={`${styles.layout} ${verDetalleMovil ? styles.layoutDetalle : ""}`}>
        <aside className={styles.lista} aria-label="Cadenas de valor">
          <div className={styles.buscador}>
            <FiSearch className={styles.buscadorIcono} aria-hidden="true" />
            <input
              type="text"
              placeholder="Buscar cadena"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar cadena por nombre, referencia o ID"
            />
          </div>

          <div className={styles.items}>
            {isLoadingActive &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.item}>
                  <Skeleton width="2rem" height="2rem" radius="0.55rem" />
                  <div style={{ flex: 1 }}>
                    <Skeleton width="70%" height="0.8rem" />
                    <Skeleton width="45%" height="0.65rem" style={{ marginTop: "0.35rem" }} />
                  </div>
                </div>
              ))}

            {!isLoadingActive &&
              filtradas.map((c) => {
                const seleccionada = String(c.cadenavalorid) === String(cadenaId);
                return (
                  <button
                    key={c.cadenavalorid}
                    type="button"
                    className={`${styles.item} ${seleccionada ? styles.itemActivo : ""}`}
                    onClick={() => elegirCadena(c.cadenavalorid)}
                    aria-current={seleccionada ? "true" : undefined}
                  >
                    <LogoCadena cadena={c} />
                    <span className={styles.itemTextos}>
                      <strong title={c.denominacion}>{c.denominacion}</strong>
                      <span>
                        ID #{c.cadenavalorid}
                        {c.referencia ? ` · Ref. ${c.referencia}` : ""}
                      </span>
                    </span>
                  </button>
                );
              })}

            {!isLoadingActive && filtradas.length === 0 && (
              <p className={styles.vacioLista}>
                {activeList.length === 0 ? "No hay cadenas activas." : "Ninguna cadena coincide con la búsqueda."}
              </p>
            )}
          </div>
        </aside>

        <section className={styles.detalle}>
          {!activeItem ? (
            !isLoadingActive && (
              <div className={styles.vacio}>
                <FiInbox aria-hidden="true" />
                Activá una cadena de valor para configurar sus CDAs.
              </div>
            )
          ) : (
            <>
              <button type="button" className={styles.volver} onClick={() => setVerDetalleMovil(false)}>
                <FiChevronLeft aria-hidden="true" /> Cadenas
              </button>

              <div className={styles.cadena}>
                <LogoCadena cadena={activeItem} grande />
                <strong>{activeItem.denominacion}</strong>
                <span>
                  ID #{activeItem.cadenavalorid}
                  {activeItem.referencia ? ` · Ref. ${activeItem.referencia}` : ""}
                </span>
              </div>

              <div className={styles.pantallas} role="tablist" aria-label="Pantalla">
                {PANTALLAS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="tab"
                    aria-selected={selectedPantalla === p.value}
                    className={`${styles.pantalla} ${selectedPantalla === p.value ? styles.pantallaActiva : ""}`}
                    onClick={() => setSelectedPantalla(p.value)}
                  >
                    {p.icono}
                    {p.label}
                    {renderEstadoPantalla(p.value)}
                  </button>
                ))}
              </div>

              {esLineas && (
                <div className={styles.alcance}>
                  <FiLayers aria-hidden="true" className={styles.alcanceIcono} />
                  {isLoadingLineas ? (
                    <Skeleton height="1.2rem" width="50%" radius="1rem" />
                  ) : nombresLineasActivas.length === 0 ? (
                    <span className={styles.alcanceVacio}>
                      <FiAlertTriangle aria-hidden="true" />
                      La cadena no tiene líneas activas: esta configuración no tiene efecto hasta que tenga alguna.
                    </span>
                  ) : (
                    <>
                      <span>
                        Aplica a {nombresLineasActivas.length === 1 ? "la" : "las"}{" "}
                        <strong>
                          {nombresLineasActivas.length} línea{nombresLineasActivas.length !== 1 ? "s" : ""} activa
                          {nombresLineasActivas.length !== 1 ? "s" : ""}
                        </strong>
                        :
                      </span>
                      {nombresLineasActivas.map((nombre, i) => (
                        <span key={i} className={styles.alcanceLinea}>
                          {nombre}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              )}

              <div className={styles.panel}>
                <div className={styles.panelCuerpo}>
                  <CdaPanel
                    activeItem={activeItem}
                    pantalla={selectedPantalla}
                    hideHeader
                    hideUnchecked={false}
                    description={esLineas ? DESCRIPCION_LINEAS : undefined}
                    enModal
                    enPagina
                    contenedorPie={contenedorPie}
                    key={`${activeItem.cadenavalorid}-${selectedPantalla}`}
                  />
                </div>
                <div ref={setContenedorPie} className={styles.panelPie} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
