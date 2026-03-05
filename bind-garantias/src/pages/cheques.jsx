import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "../components/Navbar";
import "../styles/cheques.css";

const chequesSchema = z.object({
  cuit: z
    .string()
    .regex(/^\d{11}$/, { message: "Debe contener 11 números sin guiones" }),

  direccion: z.string().min(3, { message: "La dirección es obligatoria" }),
  provincia: z.string().min(3, { message: "La provincia es obligatoria" }),
  localidad: z.string().min(3, { message: "La localidad es obligatoria" }),
  celular: z.string().regex(/^\d{10}$/, {
    message: "Debe contener 10 números (ej: 1122334455)",
  }),

  moneda: z.string().min(1, { message: "Requerido" }),
  tipoProducto: z.string().min(1, { message: "Requerido" }),
  tipoCalculo: z.string().min(1, { message: "Requerido" }),
  monto: z.coerce.number().min(1000, { message: "El monto mínimo es $1000" }),
  plazo: z.string().min(1, { message: "Requerido" }),
});

export default function Cheques() {
  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigoSms, setCodigoSms] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(chequesSchema),
    mode: "onChange",
    defaultValues: {
      moneda: "Pesos",
    },
  });

  const cuitIngresado = watch("cuit", "");

  const handleValidarCuit = async () => {
    const esValido = await trigger("cuit");
    if (esValido) setPasoActual(2);
  };

  const handleVolver = () => setPasoActual(1);

  const abrirModalSms = async () => {
    const esValido = await trigger("celular");
    if (esValido) setMostrarModal(true);
  };

  const confirmarSms = () => {
    setMostrarModal(false);
  };

  const handleContinuarPaso2 = async () => {
    const esValido = await trigger([
      "direccion",
      "provincia",
      "localidad",
      "celular",
    ]);

    if (esValido) {
      setPasoActual(3);
    }
  };

  const onSubmitFinal = (data) => {
    // envio de datos
  };

  return (
    <div className="cheques-page">
      <Navbar usuario="Usuario@email.com" />

      <section className="cheques-banner">
        <h2>[ Espacio para la foto del tractor ]</h2>
      </section>

      <div className="form-main-container">
        <div className="contenedor-principal">
          <div className="seccion-formulario">
            {pasoActual === 3 && (
              <div className="back-button-container">
                <button
                  type="button"
                  onClick={() => setPasoActual(2)}
                  className="btn-back"
                >
                  ← Volver a la lista
                </button>
              </div>
            )}

            <h1 className="cheques-title">
              {pasoActual === 3
                ? "Ya podés seleccionar el monto y tipo de financiación que estás necesitando."
                : "Completá los siguientes datos básicos"}
            </h1>

            <div className="progress-container">
              <p className="progress-text">Avance de solicitud</p>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width:
                      pasoActual === 1
                        ? "10%"
                        : pasoActual === 2
                          ? "40%"
                          : "80%",
                  }}
                ></div>
              </div>
            </div>

            {/* 4. Envolvemos todo en la etiqueta <form> */}
            <form
              className="form-content"
              onSubmit={handleSubmit(onSubmitFinal)}
            >
              {/* === PASO 1 === */}
              {pasoActual === 1 && (
                <div>
                  <label className="form-label">
                    Cuit <span className="required-asterisk">*</span>
                  </label>
                  <div
                    className="form-row-align"
                    style={{ position: "relative" }}
                  >
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        placeholder="Ingresá tu CUIT (11 números)"
                        className="form-input input-width-md"
                        {...register("cuit")}
                      />
                      {errors.cuit && (
                        <span className="error-text-inline">
                          {errors.cuit.message}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleValidarCuit}
                      className="btn-validate"
                    >
                      VALIDAR CUIT
                    </button>
                  </div>
                </div>
              )}

              {/* === PASO 2 === */}
              {pasoActual === 2 && (
                <div className="paso-2-animado">
                  <div className="summary-row">
                    <div>
                      <span className="summary-label">Cuit:</span>
                      <p className="summary-value-highlight">{cuitIngresado}</p>
                    </div>
                    <div>
                      <span className="summary-label">Razón social:</span>
                      <p className="summary-value">EMPRESA DE PRUEBA S.A.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleVolver}
                      className="btn-link"
                    >
                      Editar CUIT
                    </button>
                  </div>

                  <h3 className="step-subtitle">
                    Verificá y actualizá la información en caso de ser necesario
                  </h3>

                  <div style={{ position: "relative", marginBottom: "2rem" }}>
                    <label className="form-label">
                      Dirección <span className="required-asterisk">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      {...register("direccion")}
                    />
                    {errors.direccion && (
                      <span className="error-text-inline">
                        {errors.direccion.message}
                      </span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label">
                        Provincia <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        {...register("provincia")}
                      />
                      {errors.provincia && (
                        <span className="error-text-inline">
                          {errors.provincia.message}
                        </span>
                      )}
                    </div>
                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label">
                        Localidad <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        {...register("localidad")}
                      />
                      {errors.localidad && (
                        <span className="error-text-inline">
                          {errors.localidad.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="celular-row">
                    <div
                      className="input-width-md"
                      style={{ position: "relative" }}
                    >
                      <label className="form-label">
                        Celular <span className="required-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Sin 15 y cód. área sin 0"
                        className="form-input"
                        {...register("celular")}
                      />
                      {errors.celular && (
                        <span className="error-text-inline">
                          {errors.celular.message}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={abrirModalSms}
                      className="btn-outline"
                    >
                      VERIFICAR CELULAR
                    </button>
                  </div>

                  <div className="btn-right-container">
                    <button
                      type="button"
                      className="btn-action"
                      onClick={handleContinuarPaso2}
                    >
                      CONTINUAR
                    </button>
                  </div>
                </div>
              )}

              {/* === PASO 3 === */}
              {pasoActual === 3 && (
                <div className="paso-3-animado">
                  <div className="warning-box">
                    <p className="warning-text">
                      Este cálculo es una simulación a efectos que puedas
                      conocer y estimar los costos de operar con Bind Garantías
                      con una{" "}
                      <span className="warning-highlight">
                        TASA DE MERCADO ESTIMATIVA
                      </span>
                    </p>
                  </div>

                  <div style={{ marginBottom: "30px" }}>
                    <span className="summary-label">Razón social:</span>
                    <p
                      className="summary-value"
                      style={{ fontSize: "16px", marginTop: "5px" }}
                    >
                      EMPRESA DE PRUEBA S.A.
                    </p>
                  </div>

                  <div className="form-row">
                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label muted">Moneda *</label>
                      <select className="form-select" {...register("moneda")}>
                        <option value="Pesos">Pesos</option>
                        <option value="Dolares">Dólares</option>
                      </select>
                      {errors.moneda && (
                        <span className="error-text-inline">
                          {errors.moneda.message}
                        </span>
                      )}
                    </div>
                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label muted">
                        Tipo de producto *
                      </label>
                      <select
                        className="form-select"
                        {...register("tipoProducto")}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="cheque">Cheque de pago diferido</option>
                      </select>
                      {errors.tipoProducto && (
                        <span className="error-text-inline">
                          {errors.tipoProducto.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: "30px", position: "relative" }}>
                    <label className="form-label muted">
                      Tipo de cálculo *
                    </label>
                    <select
                      className="form-select"
                      {...register("tipoCalculo")}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="tasa-directa">Tasa Directa</option>
                    </select>
                    {errors.tipoCalculo && (
                      <span className="error-text-inline">
                        {errors.tipoCalculo.message}
                      </span>
                    )}
                  </div>

                  <div className="form-row" style={{ marginBottom: "40px" }}>
                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label muted">
                        Monto a financiar
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        {...register("monto")}
                      />
                      {errors.monto && (
                        <span className="error-text-inline">
                          {errors.monto.message}
                        </span>
                      )}
                    </div>
                    <div className="form-col" style={{ position: "relative" }}>
                      <label className="form-label muted">Plazo</label>
                      <select className="form-select" {...register("plazo")}>
                        <option value="">Seleccionar plazo...</option>
                        <option value="30">30 días</option>
                        <option value="60">60 días</option>
                      </select>
                      {errors.plazo && (
                        <span className="error-text-inline">
                          {errors.plazo.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <button type="submit" className="btn-action">
                      CALCULAR
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* --- Columna Derecha Dinámica --- */}
          <div className="panel-dudas">
            <h3 className="panel-dudas-title">Dudas frecuentes</h3>

            <ul className="faq-list">
              {pasoActual < 3 && (
                <>
                  <li className="faq-item">¿Qué es el CUIT?</li>
                  <li className="faq-item">¿Cómo verifico mi CUIT?</li>
                  <li className="faq-item">
                    ¿Qué pasa si mi CUIT no es válido?
                  </li>
                </>
              )}

              {pasoActual === 3 && (
                <>
                  <li className="faq-item">¿Qué moneda seleccionar?</li>
                  <li className="faq-item">
                    ¿Cuál es el monto máximo de la operación?
                  </li>
                  <li className="faq-item">
                    ¿Cómo obtengo el monto máximo de la operación?
                  </li>
                  <li className="faq-item">
                    ¿Cuál es el plazo máximo que puedo solicitar?
                  </li>
                  <li className="faq-item">
                    ¿La tasa que muestra el simulador es la tasa real?
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL SMS */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Ingresá el código de verificación</h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="modal-close"
              >
                ✖
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-text">
                Te enviamos un sms con un código de verificación para que
                valides tu celular.
              </p>
              <label className="modal-label">Código verificación *</label>
              <input
                type="text"
                value={codigoSms}
                onChange={(e) => setCodigoSms(e.target.value)}
                className="modal-input"
              />
              <div className="modal-footer">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="btn-cancel"
                >
                  CANCELAR
                </button>
                <button
                  onClick={confirmarSms}
                  className="btn-action"
                  style={{ padding: "10px 25px", borderRadius: "4px" }}
                >
                  ACEPTAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
