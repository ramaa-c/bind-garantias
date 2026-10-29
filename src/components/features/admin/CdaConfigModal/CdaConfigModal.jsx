import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiShield, FiLayers, FiEdit2, FiArrowRight } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { PANTALLAS_CDA, PANTALLA_LINEAS } from "../../../../utils/pantallasCda";
import { useObtenerGrupoCdaConCdas, esCdaVigenteEnGrupo } from "../../../../hooks/useCadenaValor";
import { getCdaId, getCdaProp } from "../../../../utils/cdaUtils";
import styles from "./CdaConfigModal.module.css";

const PANTALLAS = [
  { value: PANTALLAS_CDA[0].value, label: "Validación de CUIT", vacio: "la validación de CUIT" },
  { value: PANTALLAS_CDA[1].value, label: "Socios y representantes", vacio: "la validación de socios y representantes" },
  { value: PANTALLA_LINEAS, label: "Alta de línea", vacio: "el alta de línea" },
];

const cdasActivos = (data) => {
  const vistos = new Set();
  return (data?.cdas || []).filter((c) => {
    const id = getCdaId(c);
    if (!esCdaVigenteEnGrupo(c) || vistos.has(id)) return false;
    vistos.add(id);
    return true;
  });
};

const describirCombinacion = (expresion, ids) => {
  const expr = (expresion || "").trim().replace(/\s+/g, " ");
  if (!expr || expr.toLowerCase() === ids.map((id) => `cda${id}`).join(" and ")) {
    return <>Se deben cumplir <strong>todos</strong> los criterios (AND)</>;
  }
  if (expr.toLowerCase() === ids.map((id) => `cda${id}`).join(" or ")) {
    return <>Basta con que se cumpla <strong>alguno</strong> de los criterios (OR)</>;
  }
  return (
    <>
      Expresión personalizada: <code className={styles.codigo}>{expr}</code>
    </>
  );
};

// Vista de solo lectura de los CDAs de una cadena, desde Cadenas de Valor.
// La edición vive en CDAs por cadena (CadenasCda.jsx).
export const CdaConfigModal = ({ isOpen, onClose, activeItem }) => {
  const navigate = useNavigate();
  const [selectedPantalla, setSelectedPantalla] = useState(PANTALLAS[0].value);
  const cadenaId = isOpen ? activeItem?.cadenavalorid : undefined;

  const consultas = {
    [PANTALLAS[0].value]: useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS[0].value),
    [PANTALLAS[1].value]: useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS[1].value),
    [PANTALLAS[2].value]: useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS[2].value),
  };

  const consulta = consultas[selectedPantalla];
  const activos = cdasActivos(consulta.data);
  const pantallaActual = PANTALLAS.find((p) => p.value === selectedPantalla);

  const irAEditar = () => {
    onClose?.();
    navigate(`/admin/cadenas-cda?cadena=${activeItem?.cadenavalorid}&pantalla=${selectedPantalla}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CDAs configurados"
      subtitle={[activeItem?.denominacion, activeItem?.cadenavalorid && `ID ${activeItem.cadenavalorid}`]
        .filter(Boolean)
        .join(" · ")}
      icono={<FiShield />}
      maxWidth="860px"
      variant="blue"
      footer={
        <>
          <span className={styles.ayuda}>Solo lectura. Los cambios se hacen en CDAs por cadena.</span>
          <Button variant="adminNeutro" onClick={onClose}>
            Cerrar
          </Button>
          <Button variant="blue" onClick={irAEditar}>
            <FiEdit2 aria-hidden="true" /> Editar CDAs
          </Button>
        </>
      }
    >
      <div className={styles.pestanas} role="tablist" aria-label="Pantalla">
        {PANTALLAS.map((p) => {
          const c = consultas[p.value];
          const cantidad = cdasActivos(c.data).length;
          return (
            <button
              key={p.value}
              type="button"
              role="tab"
              aria-selected={selectedPantalla === p.value}
              className={`${styles.pestana} ${selectedPantalla === p.value ? styles.pestanaActiva : ""}`}
              onClick={() => setSelectedPantalla(p.value)}
            >
              {p.label}
              {c.isLoading ? (
                <span className={styles.contadorCargando} />
              ) : (
                <span className={`${styles.contador} ${cantidad > 0 ? styles.contadorOk : ""}`}>
                  {c.isError ? "!" : cantidad > 0 ? cantidad : "—"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {consulta.isLoading ? (
        <div className={styles.cargando}>
          <Skeleton height="2.25rem" radius="0.6rem" />
          <Skeleton height="8rem" radius="0.75rem" />
        </div>
      ) : consulta.isError ? (
        <div className={styles.vacio}>No se pudieron cargar los CDAs de esta pantalla. Probá de nuevo más tarde.</div>
      ) : activos.length === 0 ? (
        <div className={styles.vacio}>
          <FiShield aria-hidden="true" className={styles.vacioIcono} />
          <span>Esta cadena no tiene CDAs en {pantallaActual.vacio}.</span>
          <button type="button" className={styles.enlace} onClick={irAEditar}>
            Configurar en CDAs por cadena <FiArrowRight aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className={styles.contenido}>
          <div className={styles.combinacion}>
            <FiLayers aria-hidden="true" />
            <span>
              {describirCombinacion(
                consulta.data?.grupo?.expresionagrupacion,
                activos.map((c) => getCdaId(c)),
              )}
            </span>
          </div>

          <div className={styles.tabla}>
            <div className={`${styles.fila} ${styles.cabecera}`} aria-hidden="true">
              <span>Criterio</span>
              <span>Condición en esta cadena</span>
              <span>Mensaje de rechazo</span>
            </div>
            {activos.map((cda) => {
              const mensaje = getCdaProp(cda, "mensajerechazo");
              return (
                <div key={getCdaId(cda)} className={styles.fila}>
                  <strong className={styles.criterio}>{getCdaProp(cda, "descripcion") || `CDA ${getCdaId(cda)}`}</strong>
                  <span className={styles.condicion} title={`${getCdaProp(cda, "expresion")} ${getCdaProp(cda, "simbolocomparacion")} ${getCdaProp(cda, "valorcomparacion")}`}>
                    {getCdaProp(cda, "expresion")} {getCdaProp(cda, "simbolocomparacion")}
                    <em>{getCdaProp(cda, "valorcomparacion") || "—"}</em>
                  </span>
                  <span className={styles.mensaje} title={mensaje || undefined}>
                    {mensaje || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
};
