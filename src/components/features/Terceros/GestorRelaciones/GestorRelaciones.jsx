import React, { useState } from "react";
// Asegurate de ajustar estas rutas según tu estructura final
import { Buscador } from "../Buscador/Buscador";
import { Formulario } from "../Formulario/Formulario";
import { FormularioVincular } from "../FormularioVincular/FormularioVincular";
import styles from "./GestorRelaciones.module.css";

// Constantes para no equivocarnos al tipear los nombres de los pasos
const PASO_BUSCAR = "BUSCAR";
const PASO_ALTA = "ALTA";
const PASO_VINCULAR = "VINCULAR";

export const GestorRelaciones = ({ socioId, onCompletado, onCancelar }) => {
  // 1. Memoria del flujo
  const [pasoActual, setPasoActual] = useState(PASO_BUSCAR);
  const [terceroEnMemoria, setTerceroEnMemoria] = useState(null);
  const [cuitFaltante, setCuitFaltante] = useState("");

  // 2. Transiciones desde el Buscador
  const handleTerceroEncontrado = (tercero) => {
    setTerceroEnMemoria(tercero);
    setPasoActual(PASO_VINCULAR);
  };

  const handleTerceroNoEncontrado = (cuit) => {
    setCuitFaltante(cuit);
    setPasoActual(PASO_ALTA);
  };

  // 3. Transición desde el Alta
  const handleTerceroCreado = (nuevoTercero) => {
    setTerceroEnMemoria(nuevoTercero);
    setPasoActual(PASO_VINCULAR);
  };

  // 4. Renderizado Dinámico
  return (
    <div className={styles.container}>
      {/* Indicador de pasos visual (Opcional, pero suma a la UX) */}
      <div className={styles.stepIndicator}>
        <span className={pasoActual === PASO_BUSCAR ? styles.stepBuscar : styles.stepInactive}>1. Buscar</span>
        <span>→</span>
        <span className={pasoActual === PASO_ALTA ? styles.stepAlta : styles.stepInactive}>2. Alta</span>
        <span>→</span>
        <span className={pasoActual === PASO_VINCULAR ? styles.stepVincular : styles.stepInactive}>3. Vincular</span>
      </div>

      {/* RENDERIZADO CONDICIONAL DE LOS ACTORES */}
      {pasoActual === PASO_BUSCAR && (
        <Buscador
          onEncontrado={handleTerceroEncontrado}
          onNoEncontrado={handleTerceroNoEncontrado}
          onCancelar={onCancelar} // Si cancela acá, sale del orquestador por completo
        />
      )}

      {pasoActual === PASO_ALTA && (
        <Formulario
          cuitPreCargado={cuitFaltante}
          onGuardado={handleTerceroCreado}
          onCancelar={() => setPasoActual(PASO_BUSCAR)} // Si se arrepiente, vuelve a la búsqueda
        />
      )}

      {pasoActual === PASO_VINCULAR && (
        <FormularioVincular
          socioId={socioId}
          tercero={terceroEnMemoria}
          onVinculado={onCompletado} // ¡Éxito total! Le avisa a la grilla/modal que terminó todo
          onCancelar={() => setPasoActual(PASO_BUSCAR)} // Vuelve a buscar si se equivocó de persona
        />
      )}
    </div>
  );
};