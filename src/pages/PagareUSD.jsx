import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FaFileArrowDown, FaLink } from "react-icons/fa6";
import "../styles/cheques.css";
import "../styles/pagare.css";

const pagareSchema = z.object({
  monto: z.coerce
    .number()
    .min(1000, { message: "El monto mínimo es U$D 1.000" }),
  fechaPago: z.string().min(1, { message: "Seleccione una fecha" }),
  agenteBolsa: z
    .string()
    .min(1, { message: "Debe seleccionar una sociedad de bolsa" }),
  idEpyme: z.string().min(5, { message: "Ingrese un ID válido" }),
  mensaje: z.string().optional(),
});

export default function PagareUSD() {
  const navigate = useNavigate();
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
    setPasoActual(4);
  };

  return (
    <div className="pagare-page">

      <div className="pagare-main-container">
        <div
          className={`pagare-contenedor-principal ${pasoActual === 4 ? "is-success" : ""}`}
        >
          <div className="pagare-seccion-formulario">
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
                <button
                  type="button"
                  onClick={() => navigate("/inicio")}
                  className="btn-back"
                >
                  ← Volver a la lista
                </button>
              </div>
            )}

            {/* Títulos */}
            <h1 className="pagare-title">
              {pasoActual === 1 &&
                "Ingresás el monto del pagaré y la fecha de pago"}
              {pasoActual === 2 &&
                "Seleccioná al agente de bolsa con quien operás"}
              {pasoActual === 3 &&
                "Generá el pagaré en Epyme y completá la operación"}
              {pasoActual === 4 && "¡Felicitaciones!"}
            </h1>

            {/* Progreso */}
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
              className="pagare-form-content"
              onSubmit={handleSubmit(onSubmitFinal)}
            >
              {/* === PASO 1: SIMULADOR === */}
              {pasoActual === 1 && (
                <div className="pagare-paso-animado">
                  <div className="form-row">
                    <div className="form-col">
                      <label className="form-label muted">Moneda *</label>
                      <input
                        type="text"
                        value="Dólar"
                        disabled
                        className="form-input"
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
                    <div className="pagare-actions-right">
                      <button
                        type="button"
                        onClick={handleCalcularSimulacion}
                        className="btn-action"
                      >
                        CALCULAR
                      </button>
                    </div>
                  ) : (
                    <div className="pagare-breakdown-container">
                      <div className="pagare-breakdown-header">
                        <span>Neto estimado a recibir:</span>
                        <span className="text-yellow">
                          USD {montoWatch * 0.96}
                        </span>
                      </div>
                      <div className="pagare-breakdown-body">
                        <div className="pagare-breakdown-row">
                          <span>Comisión SGR</span>
                          <span>USD 811</span>
                        </div>
                        <div className="pagare-breakdown-row">
                          <span>Descuento operado</span>
                          <span>USD 446</span>
                        </div>
                        <div className="pagare-breakdown-row">
                          <span>Derecho mercado</span>
                          <span>USD 24</span>
                        </div>
                        <div className="pagare-breakdown-row">
                          <span>IVA</span>
                          <span>USD 5</span>
                        </div>
                        <div className="pagare-breakdown-row pagare-total-row">
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

                      <div className="pagare-actions-right">
                        <button
                          type="button"
                          onClick={() => setSimulacionLista(false)}
                          className="btn-outline"
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

              {/* === PASO 2: AGENTE DE BOLSA === */}
              {pasoActual === 2 && (
                <div className="pagare-paso-animado">
                  <div className="pagare-input-group-md">
                    <label className="form-label">Sociedad de bolsa *</label>
                    <select
                      className="form-select"
                      {...register("agenteBolsa")}
                    >
                      <option value="">
                        Seleccione la sociedad de bolsa...
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

                  <div className="pagare-actions-right">
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

              {/* === PASO 3: EPYME E ID === */}
              {pasoActual === 3 && (
                <div className="pagare-paso-animado">
                  <h3 className="pagare-subtitle">
                    El emisor ha sido pre-aprobado *
                  </h3>

                  <div className="pagare-epyme-container">
                    <div className="pagare-epyme-card">
                      <div className="pagare-epyme-icon">
                        <FaLink />
                      </div>
                      <p>Primero generá el pagaré desde el siguiente link</p>
                      <a
                        href="https://epyme.cajadevalores.com.ar/login"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-outline pagare-epyme-btn"
                      >
                        IR A ePYME
                      </a>
                    </div>

                    <div className="pagare-epyme-card">
                      <div className="pagare-epyme-icon">
                        <FaFileArrowDown />
                      </div>
                      <p>
                        Completá la operación. Podés guiarte con este
                        instructivo.
                      </p>
                      <button
                        type="button"
                        className="btn-outline pagare-epyme-btn"
                      >
                        DESCARGAR INSTRUCTIVO
                      </button>
                    </div>
                  </div>

                  <div
                    className="pagare-input-group-md"
                    style={{ marginTop: "3rem", maxWidth: "100%" }}
                  >
                    <label className="form-label">
                      Luego ingresá el ID obtenido para finalizar la operación:
                      *
                    </label>
                    <input
                      type="text"
                      placeholder="Número identificatorio (ej: 1234789558666)"
                      className="form-input pagare-input-id"
                      {...register("idEpyme")}
                    />
                    {errors.idEpyme && (
                      <span className="error-text-inline">
                        {errors.idEpyme.message}
                      </span>
                    )}
                  </div>

                  <div
                    className="pagare-input-group-md"
                    style={{ maxWidth: "100%", marginBottom: "1rem" }}
                  >
                    <label className="form-label muted">
                      ¿Tenés algún mensaje para el equipo de Bind Garantías?
                      (Opcional)
                    </label>
                    <textarea
                      className="form-input pagare-textarea"
                      rows="3"
                      {...register("mensaje")}
                    ></textarea>
                  </div>

                  <div className="pagare-actions-flex">
                    <p className="pagare-disclaimer-text">
                      * Sujeto a confirmación en la recepción de documentación
                      física y a cambios en el score.
                    </p>
                    <button
                      type="submit"
                      className="btn-action"
                      style={{ marginTop: "1rem" }}
                    >
                      FINALIZAR SOLICITUD
                    </button>
                  </div>
                </div>
              )}

              {/* === PASO 4: ÉXITO === */}
              {pasoActual === 4 && (
                <div className="pagare-success-animado">
                  <h2 className="pagare-success-title">¡Solicitud Aprobada!</h2>
                  <div className="pagare-success-bar">
                    <span>Solicitud N° 4362</span>
                  </div>

                  <p className="pagare-success-text">
                    Has finalizado todo el proceso necesario, nosotros estaremos
                    avalando y vendiendo el pagaré. Apenas tengamos novedades
                    nos estaremos poniendo en contacto.
                  </p>
                  <p className="pagare-success-subtext">
                    Si aún no acordaste una tasa tope para la venta o ante
                    cualquier consulta no dudes en comunicarte con nosotros.
                  </p>

                  <div className="pagare-success-actions">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => navigate("/solicitudes")}
                    >
                      VOLVER A LA LISTA
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Columna Derecha */}
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
