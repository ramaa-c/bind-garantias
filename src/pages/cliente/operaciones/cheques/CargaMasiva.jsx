import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiRotateCcw } from "react-icons/fi";
import { BarraProgreso, BotonVolver } from "../../../../components/ui";
import { ConfirmacionBorradorModal } from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import {
  Paso1CargaMasiva,
  Paso2RevisionCheques,
  Paso3Confirmacion,
  Paso4ExitoEpyme,
} from "../../../../components/features";

import styles from "./CargaMasiva.module.css";

export default function CargaMasiva() {
  const navigate = useNavigate();

  const [pasoActual, setPasoActual] = useState(1);
  const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState(1);

  useEffect(() => {
    setMaxPasoAlcanzado((m) => Math.max(m, pasoActual));
  }, [pasoActual]);

  const [isModalReiniciarAbierto, setIsModalReiniciarAbierto] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const [chequesParseados, setChequesParseados] = useState([]);
  const [chequesAprobados, setChequesAprobados] = useState([]);

  const [archivoCargado, setArchivoCargado] = useState(null);

  const metodosFormulario = useForm({
    mode: "onChange",
  });

  const simularLlamadaApi = (datos) => {
    return new Promise((resolve) => setTimeout(() => resolve(datos), 1500));
  };

  const MOCK_CHEQUES_PARSADOS = [
    {
      id: "1",
      emisor: "AGRO EMPRESA S.A.",
      vencimiento: "14/12/2026",
      montoEstimado: "$405.905",
      cft: "36,01%",
      coelsaId: "XJE27G36WXON7MY",
      montoNominal: "$500.000",
      montoNumerico: 500000,
      montoEstimadoNumerico: 405905,
      cuit: "30-70123456-1",
      solicitudId: "4438",
      montoNominalFormateado: "$500.000",
    },
    {
      id: "2",
      emisor: "CONSTRUCTORA DEL SUR S.R.L.",
      vencimiento: "15/12/2026",
      montoEstimado: "$405.488",
      cft: "36,05%",
      coelsaId: "6ZO9W10D1V325GP",
      montoNominal: "$500.000",
      montoNumerico: 500000,
      montoEstimadoNumerico: 405488,
      cuit: "30-70987654-3",
      solicitudId: "4439",
      montoNominalFormateado: "$500.000",
    },
  ];

  // --- HANDLERS DE NAVEGACIÓN ---
  const handleVolver = () => {
    setPasoActual((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleResetFlujoCompleto = () => {
    setChequesParseados([]);
    setChequesAprobados([]);
    metodosFormulario.reset();
    setPasoActual(1);
    setMaxPasoAlcanzado(1);
  };

  const handleReiniciarAlta = () => setIsModalReiniciarAbierto(true);

  const confirmarReinicioAlta = () => {
    handleResetFlujoCompleto();
    setIsModalReiniciarAbierto(false);
  };

  // --- HANDLERS DE PASOS ---
  const handleProcesarArchivo = async (file) => {
    setIsProcessing(true);
    const response = await simularLlamadaApi(MOCK_CHEQUES_PARSADOS);
    setChequesParseados(response);
    setIsProcessing(false);
    setPasoActual(2);
  };

  const handleDescargarTemplate = () => {
    console.log("Descargando template...");
  };

  // PASO 2: Revisión
  const handleContinuarRevision = (chequesSeleccionados) => {
    setChequesAprobados(chequesSeleccionados);
    setPasoActual(3);
  };

  const handleDesistir = () => {
    handleResetFlujoCompleto();
  };

  // PASO 3: Confirmación Final
  const handleAceptarFinal = async () => {
    setIsProcessing(true);
    await simularLlamadaApi({ success: true });
    setIsProcessing(false);
    setPasoActual(4);
  };

  // PASO 4: Éxito
  const handleDescargarInstructivo = () => {
    console.log("Descargando PDF instructivo...");
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return { t: "Carga masiva de cheques", s: "Descargá el archivo modelo, completalo con los cheques a negociar y subilo para procesarlo." };
      case 2:
        return { t: "Carga masiva de cheques", s: "Revisá los cheques procesados antes de confirmar." };
      case 3:
        return { t: "Carga masiva de cheques", s: "Confirmá la operación final." };
      case 4:
        return { t: "¡Cheques procesados con éxito!", s: "Ya podés gestionarlos desde ePyME." };
      default:
        return { t: "Carga masiva de cheques", s: "" };
    }
  };

  return (
    <div className={styles.chequesPage}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
              {/* LÓGICA DE VOLVER */}
              {pasoActual > 1 && pasoActual < 4 ? (
                <BotonVolver onClick={handleVolver} />
              ) : (
                <BotonVolver
                  onClick={() => navigate("/inicio")}
                  texto="Volver a la lista"
                />
              )}

              <BotonVolver
                onClick={
                  pasoActual === 4
                    ? handleResetFlujoCompleto
                    : handleReiniciarAlta
                }
                icon={FiRotateCcw}
                texto={
                  pasoActual === 4 ? "Cargar nuevos cheques" : "Reiniciar carga"
                }
              />
            </div>
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              {pasoActual < 4 && (
                <nav className={styles.stepperNav}>
                  <BarraProgreso
                    hitos={["Carga", "Revisión", "Confirmación"]}
                    hitoActual={pasoActual}
                    maxHitoAlcanzado={maxPasoAlcanzado}
                    onStepClick={setPasoActual}
                  />
                </nav>
              )}

              <div className={styles.bienvenidaHeader}>
                <h1 className={styles.tituloBienvenida}>{obtenerTextosCabecera().t}</h1>
                <div className={styles.titleAccent}></div>
                {obtenerTextosCabecera().s && (
                  <p className={styles.subtituloBienvenida}>{obtenerTextosCabecera().s}</p>
                )}
              </div>

              <div className={styles.seccionFormulario}>
                <FormProvider {...metodosFormulario}>
                  <form
                    className={styles.formContent}
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div key={pasoActual} className="animacion-paso">
                      {pasoActual === 1 && (
                        <Paso1CargaMasiva
                          archivoCargado={archivoCargado}
                          setArchivoCargado={setArchivoCargado}
                          onProcesarArchivo={handleProcesarArchivo}
                          onDescargarTemplate={handleDescargarTemplate}
                          isProcessing={isProcessing}
                        />
                      )}

                      {pasoActual === 2 && (
                        <Paso2RevisionCheques
                          chequesProcesados={chequesParseados}
                          chequesYaAprobados={chequesAprobados}
                          isLoading={isProcessing}
                          onContinuar={handleContinuarRevision}
                          onDesistir={handleDesistir}
                        />
                      )}

                      {pasoActual === 3 && (
                        <Paso3Confirmacion
                          chequesAprobados={chequesAprobados}
                          onAceptar={handleAceptarFinal}
                          isSubmitting={isProcessing}
                        />
                      )}

                      {pasoActual === 4 && (
                        <Paso4ExitoEpyme
                          chequesFinales={chequesAprobados}
                          onDescargarInstructivo={handleDescargarInstructivo}
                          urlEpyme="https://epyme.cajadevalores.com.ar/"
                        />
                      )}
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>

            <HelpDrawer
              isOpen={isHelpOpen}
              onClose={() => setIsHelpOpen(false)}
              contexto="carga_masiva_cheques"
              pasoActual={pasoActual}
            />
          </div>
        </div>
      </div>

      <ConfirmacionBorradorModal
        isOpen={isModalReiniciarAbierto}
        onClose={() => setIsModalReiniciarAbierto(false)}
        onConfirm={confirmarReinicioAlta}
        onContinueBorrador={() => setIsModalReiniciarAbierto(false)}
      />
    </div>
  );
}
