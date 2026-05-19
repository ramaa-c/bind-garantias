import React from "react";
import {
  Paso1Cuit,
  Paso2Datos,
  Paso3Simulador,
  Paso4Socios,
  Paso5Documentacion,
  Paso7Exito,
} from "../../../../components/features";

export const PrestamosFijosPasos = ({
  pasoActual,
  uiState,
  updateUiState,
  socios,
  handleValidarCuit,
  handleVolver,
  abrirModalSms,
  handleContinuarPaso2,
  handleCalcularSimulador,
  handleContinuarSimulador,
  iniciarCargaSocio,
  validarCuitSocio,
  guardarSocio,
  editarSocio,
  eliminarSocio,
  continuarAlProximoPaso,
  toggleDoc,
  avanzarAlExito,
  handleResetFlujoCompleto,
}) => {
  switch (pasoActual) {
    case 1:
      return <Paso1Cuit onValidar={handleValidarCuit} />;

    case 2:
      return (
        <Paso2Datos
          onVolver={handleVolver}
          onAbrirModalSms={abrirModalSms}
          onContinuar={handleContinuarPaso2}
        />
      );

    case 3:
      return (
        <Paso3Simulador
          mostrarResultados={uiState.mostrarResultados}
          onCalcular={handleCalcularSimulador}
          onContinuar={handleContinuarSimulador}
          onCancelar={() => updateUiState({ mostrarResultados: false })}
          opcionesProducto={[
            { value: "prestamo_fijo", label: "Préstamo Fijo" },
          ]}
          mostrarTipoCalculo={false}
          mostrarMonto={false}
          mostrarFecha={false}
          textoAccion="VER GASTOS ESTIMATIVOS"
          usarTicketPrestamoFijo={true}
        />
      );

    case 4:
      return (
        <Paso4Socios
          faseSocio={uiState.faseSocio}
          setFaseSocio={(fase) => updateUiState({ faseSocio: fase })}
          tempSocioCuit={uiState.tempSocioCuit}
          setTempSocioCuit={(val) => updateUiState({ tempSocioCuit: val })}
          tempSocioNombre={uiState.tempSocioNombre}
          tempSocioParticipacion={uiState.tempSocioParticipacion}
          setTempSocioParticipacion={(val) =>
            updateUiState({ tempSocioParticipacion: val })
          }
          socios={socios}
          iniciarCargaSocio={iniciarCargaSocio}
          validarCuitSocio={validarCuitSocio}
          guardarSocio={guardarSocio}
          editarSocio={editarSocio}
          eliminarSocio={eliminarSocio}
          continuarAlProximoPaso={continuarAlProximoPaso}
        />
      );

    case 5:
      return (
        <Paso5Documentacion
          docExpandido={uiState.docExpandido}
          toggleDoc={toggleDoc}
          socios={socios}
          onVolverASocios={handleVolver}
          avanzarPaso6={avanzarAlExito}
        />
      );

    case 7:
      return <Paso7Exito onVolverInicio={handleResetFlujoCompleto} />;

    default:
      return null;
  }
};
