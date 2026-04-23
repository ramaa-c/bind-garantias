import React, { useState } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiRotateCcw } from 'react-icons/fi';
import { BarraProgreso, BotonVolver } from '../../ui';
import { 
  Paso1Cuit, 
  Paso2Datos, 
  Paso3Simulador, 
  PanelDudas, 
  BotonAyudaFlotante,
  Paso4Socios, 
  Paso5Documentacion, 
  Paso6Bolsa,
  Paso7Exito 
} from '../index';
import styles from '../../../pages/cheques/SolicitudCheques.module.css'; 

export const WizardOperaciones = () => {
  const navigate = useNavigate();
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // Estados locales para Socios / Documentos
  const [socios, setSocios] = useState([]);
  const [uiState, setUiState] = useState({
    faseSocio: "ingresar_cuit",
    tempSocioCuit: "",
    tempSocioNombre: "",
    tempSocioParticipacion: "",
    docExpandido: "estatuto",
  });

  const updateUiState = (updates) => setUiState((prev) => ({ ...prev, ...updates }));

  const metodosFormulario = useForm({
    mode: 'onChange',
    defaultValues: {
      cuit: '',
      direccion: '',
      localidad: '',
      celular: '',
      smsVerificado: false,
      tipoProducto: '', 
      monto: '',
      plazo: '',
      sociedadBolsa: "",
      numeroCuentaBolsa: "",
      representantes: [],
      emailFacturacion: "",
    }
  });

  const { handleSubmit, trigger, control, setValue } = metodosFormulario;

  const tipoProducto = useWatch({ control, name: 'tipoProducto' });

  const handleVolver = () => {
    setPasoActual(prev => (prev === 1 ? 1 : prev - 1));
  };

  const handleResetFlujoCompleto = () => {
    metodosFormulario.reset();
    setPasoActual(1);
    setMostrarResultados(false);
    setSocios([]);
    updateUiState({ faseSocio: "ingresar_cuit" });
  };

  const onSubmitFinalCheques = () => {
    console.log("Payload Final Cheques:", metodosFormulario.getValues());
    setPasoActual(7); // Pantalla de éxito de cheques
  };

  const onSubmitFinalPrestamos = () => {
    console.log("Payload Final Préstamos:", metodosFormulario.getValues());
    setPasoActual(6); // Pantalla de éxito de préstamos
  };

  // ----- MÉTODOS DE SOCIOS Y DOCUMENTOS -----
  const iniciarCargaSocio = () => updateUiState({ tempSocioCuit: "", tempSocioParticipacion: "", faseSocio: "ingresar_cuit" });
  const validarCuitSocio = () => updateUiState({ tempSocioNombre: "Socio Validado (Mock)", faseSocio: "completar_datos" });
  const guardarSocio = () => {
    if (!uiState.tempSocioParticipacion) return;
    setSocios([...socios, { cuit: uiState.tempSocioCuit, nombre: uiState.tempSocioNombre, participacion: uiState.tempSocioParticipacion }]);
    updateUiState({ faseSocio: "lista" });
  };
  const editarSocio = (index) => {
    const s = socios[index];
    updateUiState({ tempSocioCuit: s.cuit, tempSocioNombre: s.nombre, tempSocioParticipacion: s.participacion, faseSocio: "completar_datos" });
    setSocios(socios.filter((_, i) => i !== index));
  };
  const eliminarSocio = (index) => {
    const nuevos = socios.filter((_, i) => i !== index);
    setSocios(nuevos);
    if (nuevos.length === 0) updateUiState({ faseSocio: "ingresar_cuit" });
  };
  const toggleDoc = (seccion) => {
    updateUiState({ docExpandido: uiState.docExpandido === seccion ? "" : seccion });
  };
  // Mockeamos la base de datos para no usar la API de socios por ahora
  const handleGuardarSocioDb = async () => true; 

  // ----- RENDERIZADO DINÁMICO DE PASOS -----
  const renderPasoDinamico = () => {
    // 1, 2, 3 SON COMPARTIDOS TOTALMENTE
    if (pasoActual === 1) return <Paso1Cuit onValidar={async () => { if (await trigger("cuit")) setPasoActual(2); }} />;
    if (pasoActual === 2) return <Paso2Datos onVolver={handleVolver} onContinuar={() => setPasoActual(3)} />;
    if (pasoActual === 3) {
      return (
        <Paso3Simulador
          mostrarResultados={mostrarResultados}
          onCalcular={async () => {
            if (await trigger(["monto", "tipoProducto"])) setMostrarResultados(true);
          }}
          onContinuar={() => setPasoActual(4)}
          onCancelar={() => setMostrarResultados(false)}
          opcionesProducto={[
            { value: "cheque", label: "Línea de Cheques" },
            { value: "prestamo", label: "Línea de Préstamo" }
          ]}
          mostrarTipoCalculo={false}
          labelFecha="Plazo estimado"
          labelMonto="Monto requerido"
        />
      );
    }

    // 4 y 5 SON COMPARTIDOS PERO CON PROPS ESPECÍFICAS
    if (pasoActual === 4) {
      return (
        <Paso4Socios
          faseSocio={uiState.faseSocio}
          setFaseSocio={(fase) => updateUiState({ faseSocio: fase })}
          tempSocioCuit={uiState.tempSocioCuit}
          setTempSocioCuit={(cuit) => updateUiState({ tempSocioCuit: cuit })}
          tempSocioNombre={uiState.tempSocioNombre}
          tempSocioParticipacion={uiState.tempSocioParticipacion}
          setTempSocioParticipacion={(part) => updateUiState({ tempSocioParticipacion: part })}
          socios={socios}
          iniciarCargaSocio={iniciarCargaSocio}
          validarCuitSocio={validarCuitSocio}
          guardarSocio={guardarSocio}
          editarSocio={editarSocio}
          eliminarSocio={eliminarSocio}
          continuarAlProximoPaso={() => setPasoActual(5)}
        />
      );
    }
    if (pasoActual === 5) {
      return (
        <Paso5Documentacion
          docExpandido={uiState.docExpandido}
          toggleDoc={toggleDoc}
          socios={socios}
          onVolverASocios={() => setPasoActual(4)}
          avanzarPaso6={async () => {
            const ok = await trigger("emailFacturacion");
            const reps = metodosFormulario.getValues("representantes");
            if (ok && reps?.length > 0) {
              if (tipoProducto === 'cheque') setPasoActual(6); // Va a Bolsa
              else handleSubmit(onSubmitFinalPrestamos)(); // Prestamos termina acá
            }
          }}
          onGuardarSocioDb={handleGuardarSocioDb}
        />
      );
    }

    // ----- BIFURCACIÓN FINAL -----
    if (tipoProducto === 'cheque') {
      if (pasoActual === 6) {
        return (
          <Paso6Bolsa
            avanzarConBolsa={async () => {
              if (await trigger(["sociedadBolsa", "numeroCuentaBolsa"])) handleSubmit(onSubmitFinalCheques)();
            }}
            avanzarSinBolsa={() => {
              setValue("sociedadBolsa", "");
              setValue("numeroCuentaBolsa", "");
              handleSubmit(onSubmitFinalCheques)();
            }}
          />
        );
      }
      if (pasoActual === 7) return <Paso7Exito onVolverInicio={handleResetFlujoCompleto} />;
    } else if (tipoProducto === 'prestamo') {
      if (pasoActual === 6) return <Paso7Exito onVolverInicio={handleResetFlujoCompleto} />;
    }

    return null;
  };

  const renderBarraProgreso = () => {
    if (pasoActual === 1) return null;
    if (pasoActual === 7 && tipoProducto === 'cheque') return null;
    if (pasoActual === 6 && tipoProducto === 'prestamo') return null;

    let hitos = ["DATOS", "SIMULADOR", "SOCIOS", "DOCUMENTOS"];
    let hitoActual = pasoActual - 1; 

    if (tipoProducto === 'cheque') {
      hitos = ["DATOS", "SIMULADOR", "SOCIOS", "DOCUMENTOS", "BOLSA"];
      // Hitos mapeo: Paso 2 -> 1, Paso 3 -> 2, Paso 4 -> 3, Paso 5 -> 4, Paso 6 -> 5
      hitoActual = pasoActual - 1;
    }

    return <BarraProgreso hitos={hitos} hitoActual={hitoActual} />;
  };

  const mostrarBotonVolver = pasoActual > 1 && !(pasoActual === 7 && tipoProducto === 'cheque') && !(pasoActual === 6 && tipoProducto === 'prestamo');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
              {mostrarBotonVolver && (
                <BotonVolver onClick={handleVolver} />
              )}
              {pasoActual === 1 && (
                <BotonVolver onClick={() => navigate("/inicio")} texto="Volver al inicio" />
              )}
              <BotonVolver onClick={handleResetFlujoCompleto} icon={FiRotateCcw} texto="Reiniciar operación" />
            </div>
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>
                
                {pasoActual === 1 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>Nueva Operación</h1>
                    <div className={styles.titleAccent}></div>
                    <p className={styles.subtituloBienvenida}>
                      Completá el CUIT de la empresa para iniciar la solicitud.
                    </p>
                  </div>
                )}

                {renderBarraProgreso()}

                <FormProvider {...metodosFormulario}>
                  <form className={styles.formContent} onSubmit={(e) => e.preventDefault()}>
                    <div key={pasoActual} className="animacion-paso">
                      {renderPasoDinamico()}
                    </div>
                  </form>
                </FormProvider>

              </div>
            </div>

            {!(pasoActual === 7 && tipoProducto === 'cheque') && !(pasoActual === 6 && tipoProducto === 'prestamo') && (
              <>
                <PanelDudas contexto="wizard_dinamico" pasoActual={pasoActual} />
                <BotonAyudaFlotante contexto="wizard_dinamico" pasoActual={pasoActual} />
              </>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};
