import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "../components/Navbar";
import Banner from "../components/banner";
import "../styles/cheques.css";
import { FaFileArrowDown, FaLink } from "react-icons/fa6";

const pagareSchema = z.object({
  // Paso 1
  monto: z.coerce
    .number()
    .min(1000, { message: "El monto mínimo es U$D 1.000" }),
  fechaPago: z.string().min(1, { message: "Seleccione una fecha" }),

  // Paso 2
  agenteBolsa: z
    .string()
    .min(1, { message: "Debe seleccionar una sociedad de bolsa" }),

  // Paso 3
  idEpyme: z.string().min(5, { message: "Ingrese un ID válido" }),
  mensaje: z.string().optional(),
});

export default function PagareUSD() {
  const [pasoActual, setPasoActual] = useState(1);
  const [simulacionLista, setSimulacionLista] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(pagareSchema),
    mode: "onChange",
    defaultValues: {
      moneda: "Dólar",
      tipoCalculo: "monto",
    },
  });

  const montoWatch = watch("monto") || 0;

  // --- CONTROLADORES ---

  const handleCalcularSimulacion = async () => {
    const esValido = await trigger(["monto", "fechaPago"]);
    if (esValido) {
      setSimulacionLista(true);
    }
  };

  const avanzarPaso = async (camposAValidar, siguientePaso) => {
    const esValido = await trigger(camposAValidar);
    if (esValido) setPasoActual(siguientePaso);
  };

  const onSubmitFinal = (data) => {
    console.log("Operación Finalizada:", data);
    // llamada a la api
    setPasoActual(4);
  };

  return (
    <div className="cheques-page">
      <Navbar usuario="Usuario@email.com" />

      <Banner texto="Límite de crédito: U$D 40.000 - Vencimiento: 01/11/2026" />

      <div className="form-main-container">
        <div
          className="contenedor-principal"
          style={{ maxWidth: pasoActual === 4 ? "800px" : "1200px" }}
        >
          <div className="seccion-formulario">
            {pasoActual > 1 && pasoActual < 4 && (
              <div className="back-button-container">
                <button
                  type="button"
                  onClick={() => setPasoActual(pasoActual - 1)}
                  className="btn-back"
                >
                  ← Volver al paso anterior
                </button>
              </div>
            )}
            {pasoActual === 1 && (
              <div className="back-button-container">
                <button type="button" className="btn-back">
                  ← Volver a la lista
                </button>
              </div>
            )}

            {/* Títulos */}
            <h1 className="cheques-title">
              {pasoActual === 1 &&
                "Ingresás el monto del pagaré y la fecha de pago"}
              {pasoActual === 2 &&
                "Seleccioná al agente de bolsa con quien operás"}
              {pasoActual === 3 &&
                "Generá el pagaré en Epyme y completá la operación"}
              {pasoActual === 4 && "¡Felicitaciones!"}
            </h1>

            {pasoActual < 4 && (
              <div className="progress-container">
                <p className="progress-text">Avance de solicitud</p>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width:
                        pasoActual === 1
                          ? "33%"
                          : pasoActual === 2
                            ? "66%"
                            : "100%",
                    }}
                  ></div>
                </div>
              </div>
            )}

            <form
              className="form-content"
              onSubmit={handleSubmit(onSubmitFinal)}
            >
              {/* =========================================================
                                  PASO 1: SIMULADOR 
              ========================================================= */}
              {pasoActual === 1 && (
                <div className="paso-animado">
                  <div className="form-row">
                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label muted">Moneda *</label>
                      <input
                        type="text"
                        value="Dólar"
                        disabled
                        className="form-input"
                        style={{ opacity: 0.5 }}
                      />
                    </div>

                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label">Monto del Pagaré *</label>
                      <input
                        type="number"
                        placeholder="Ej: 40000"
                        className="form-input"
                        {...register("monto")}
                        disabled={simulacionLista}
                      />
                      {errors.monto && (
                        <span className="error-text-inline">
                          {errors.monto.message}
                        </span>
                      )}
                    </div>

                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label">Fecha de pago *</label>
                      <input
                        type="date"
                        className="form-input"
                        {...register("fechaPago")}
                        disabled={simulacionLista}
                      />
                      {errors.fechaPago && (
                        <span className="error-text-inline">
                          {errors.fechaPago.message}
                        </span>
                      )}
                    </div>
                  </div>

                  {!simulacionLista ? (
                    <div style={{ textAlign: "right", marginTop: "2rem" }}>
                      <button
                        type="button"
                        onClick={handleCalcularSimulacion}
                        className="btn-action"
                      >
                        CALCULAR
                      </button>
                    </div>
                  ) : (
                    <div className="breakdown-container">
                      <div className="breakdown-header">
                        <span>Neto estimado a recibir:</span>
                        <span className="text-yellow">
                          USD {montoWatch * 0.96}
                        </span>{" "}
                      </div>
                      <div className="breakdown-body">
                        <div className="breakdown-row">
                          <span>Comisión SGR</span>
                          <span>USD 811</span>
                        </div>
                        <div className="breakdown-row">
                          <span>Descuento operado</span>
                          <span>USD 446</span>
                        </div>
                        <div className="breakdown-row">
                          <span>Derecho mercado</span>
                          <span>USD 24</span>
                        </div>
                        <div className="breakdown-row">
                          <span>IVA</span>
                          <span>USD 5</span>
                        </div>
                        <div className="breakdown-row total-row">
                          <span className="text-yellow">Total de costos</span>
                          <span className="text-yellow">USD 1.286</span>
                        </div>
                      </div>

                      <div
                        className="warning-box"
                        style={{ marginTop: "20px" }}
                      >
                        <p className="warning-text">
                          <span className="warning-highlight">IMPORTANTE:</span>{" "}
                          Tasa de interés utilizada para el cálculo: % TNA
                          (cierre al día hábil cambiario anterior).
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "20px",
                          marginTop: "2rem",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setSimulacionLista(false)}
                          className="btn-outline"
                          style={{ marginTop: 0 }}
                        >
                          RECALCULAR
                        </button>
                        <button
                          type="button"
                          onClick={() => setPasoActual(2)}
                          className="btn-action"
                        >
                          CONTINUAR CON ESTA SIMULACIÓN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================
                                PASO 2: AGENTE DE BOLSA 
              ========================================================= */}
              {pasoActual === 2 && (
                <div className="paso-animado">
                  <div
                    style={{
                      position: "relative",
                      marginBottom: "3rem",
                      maxWidth: "500px",
                    }}
                  >
                    <label className="form-label">Sociedad de bolsa *</label>
                    <select
                      className="form-select"
                      {...register("agenteBolsa")}
                    >
                      <option value="">
                        Seleccione la sociedad de bolsa con la que desea
                        operar...
                      </option>
                      <option value="industrial">Industrial Valores S.A</option>
                      <option value="bullmarket">Bull Market Brokers</option>
                      <option value="balanz">Balanz Capital</option>
                    </select>
                    {errors.agenteBolsa && (
                      <span className="error-text-inline">
                        {errors.agenteBolsa.message}
                      </span>
                    )}
                  </div>

                  <div className="btn-right-container">
                    <button
                      type="button"
                      className="btn-action"
                      onClick={() => avanzarPaso(["agenteBolsa"], 3)}
                    >
                      CONTINUAR
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================
                                  PASO 3: EPYME E ID 
              ========================================================= */}
              {pasoActual === 3 && (
                <div className="paso-animado">
                  <h3
                    className="step-subtitle"
                    style={{ marginBottom: "2rem" }}
                  >
                    El emisor ha sido pre-aprobado *
                  </h3>

                  <div className="epyme-boxes-container">
                    <div className="epyme-card">
                      <div className="epyme-icon">
                        <FaLink />
                      </div>{" "}
                      <p>Primero generá el pagaré desde el siguiente link</p>
                      <a
                        href="https://epyme.cajadevalores.com.ar/login"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline epyme-btn"
                      >
                        IR A ePYME
                      </a>
                    </div>

                    <div className="epyme-card">
                      <div className="epyme-icon">
                        <FaFileArrowDown />
                      </div>{" "}
                      <p>
                        Completá la operación. Podés guiarte con este
                        instructivo.
                      </p>
                      <button type="button" className="btn-outline epyme-btn">
                        DESCARGAR INSTRUCTIVO
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      position: "relative",
                      marginBottom: "2rem",
                      marginTop: "3rem",
                    }}
                  >
                    <label className="form-label">
                      Luego ingresá el ID obtenido para finalizar la operación:
                      *
                    </label>
                    <input
                      type="text"
                      placeholder="Número identificatorio (ej: 1234789558666)"
                      className="form-input"
                      style={{ fontSize: "1.2rem", letterSpacing: "2px" }}
                      {...register("idEpyme")}
                    />
                    {errors.idEpyme && (
                      <span className="error-text-inline">
                        {errors.idEpyme.message}
                      </span>
                    )}
                  </div>

                  <div style={{ position: "relative", marginBottom: "1rem" }}>
                    <label className="form-label muted">
                      ¿Tenés algún mensaje para el equipo de Bind Garantías?
                      (Opcional)
                    </label>
                    <textarea
                      className="form-input"
                      rows="3"
                      style={{ resize: "none" }}
                      {...register("mensaje")}
                    ></textarea>
                  </div>

                  <div className="btn-right-container-pagare">
                    <p
                      className="progress-text"
                      style={{ fontSize: "0.8rem", marginTop: "1rem" }}
                    >
                      * Sujeto a confirmación en la recepción de documentación
                      física y a cambios en el score.
                    </p>
                    <button type="submit" className="btn-action">
                      FINALIZAR SOLICITUD
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================
                                  PASO 4: ÉXITO 
              ========================================================= */}
              {pasoActual === 4 && (
                <div
                  className="success-animado"
                  style={{ textAlign: "center", padding: "3rem 0" }}
                >
                  <h2
                    className="text-yellow"
                    style={{ fontSize: "3rem", marginBottom: "1rem" }}
                  >
                    ¡Solicitud Aprobada!
                  </h2>
                  <div className="success-bar">
                    <span>Solicitud N° 4362</span>
                  </div>

                  <p
                    className="card-instruction-text"
                    style={{
                      maxWidth: "600px",
                      margin: "2rem auto",
                      fontSize: "1.1rem",
                    }}
                  >
                    Has finalizado todo el proceso necesario, nosotros estaremos
                    avalando y vendiendo el pagaré. Apenas tengamos novedades
                    nos estaremos poniendo en contacto.
                  </p>
                  <p
                    className="card-instruction-text"
                    style={{
                      maxWidth: "600px",
                      margin: "0 auto",
                      opacity: 0.7,
                    }}
                  >
                    Si aún no acordaste una tasa tope para la venta o ante
                    cualquier consulta no dudes en comunicarte con nosotros.
                  </p>

                  <div style={{ marginTop: "4rem" }}>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => console.log("Volver al dashboard")}
                    >
                      VOLVER AL INICIO
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* --- Columna Derecha (Oculta en paso 4) --- */}
          {pasoActual < 4 && (
            <div className="panel-dudas">
              <h3 className="panel-dudas-title">Dudas frecuentes</h3>
              <ul className="faq-list">
                <li className="faq-item">¿Qué moneda seleccionar?</li>
                <li className="faq-item">
                  ¿Cuál es el monto máximo de la operación?
                </li>
                <li className="faq-item">¿Cómo genero mi ID en ePyme?</li>
                <li className="faq-item">
                  ¿La tasa que muestra el simulador es la tasa real?
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
