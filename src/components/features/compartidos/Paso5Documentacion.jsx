import React, { useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiUploadCloud,
  FiFileText,
  FiTrash2,
} from "react-icons/fi";

const DropzoneCard = ({
  label = "Subir archivo",
  subtext = "PDF o ZIP menor a 5MB",
  accept = ".pdf,.zip",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (file) {
    return (
      <div className="upload-box loaded anim-fade-in">
        <div className="loaded-info">
          <FiFileText className="loaded-icon" />
          <div className="loaded-text-group">
            <span className="loaded-filename">{file.name}</span>
            <span className="loaded-filesize">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={clearFile}
          className="btn-icon-ghost danger"
          title="Eliminar archivo"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`upload-box ${isDragging ? "dragging" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        hidden
        onChange={handleFileChange}
        accept={accept}
      />
      <FiUploadCloud className="upload-icon-modern" />
      <span className="upload-text">{label}</span>
      <span className="upload-subtext">{subtext}</span>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function Paso5Documentacion({
  docExpandido,
  toggleDoc,
  socios,
  onVolverASocios,
  faseApoderado,
  setFaseApoderado,
  apoNombre,
  apoRol,
  setApoRol,
  validarCuitApoderado,
  guardarApoderado,
  avanzarPaso6,
}) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const apoCuitIngresado = watch("apoCuit", "");

  const [editModes, setEditModes] = useState({});

  const handleEditSocio = (e, socioId) => {
    e.stopPropagation();
    setEditModes((prev) => ({ ...prev, [socioId]: true }));
    if (docExpandido !== socioId) {
      toggleDoc(socioId);
    }
  };

  const handleGuardarDatosSocio = (socioId) => {
    setEditModes((prev) => ({ ...prev, [socioId]: false }));
  };

  return (
    <div className="paso-5-animado">
      <h3 className="step-subtitle white" style={{ marginBottom: "2rem" }}>
        Documentación requerida
      </h3>

      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("estatuto")}>
          <div className="accordion-header-left">
            <span className="status-icon status-check">
              <FiCheckCircle />
            </span>
            <span>Estatuto</span>
          </div>
          <span
            className={`chevron-icon ${docExpandido === "estatuto" ? "open" : ""}`}
          >
            ▼
          </span>
        </div>
        {docExpandido === "estatuto" && (
          <div className="accordion-body">
            <DropzoneCard />
            <div className="doc-info-box">
              Los estatutos son las normas por las que se regirá el
              funcionamiento de la entidad. En ellas se contemplan temas de
              vital importancia.
            </div>
          </div>
        )}
      </div>

      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("balance")}>
          <div className="accordion-header-left">
            <span className="status-icon status-alert">
              <FiAlertCircle />
            </span>
            <span>Último Balance exigible, certificado</span>
          </div>
          <span
            className={`chevron-icon ${docExpandido === "balance" ? "open" : ""}`}
          >
            ▼
          </span>
        </div>
        {docExpandido === "balance" && (
          <div className="accordion-body">
            <DropzoneCard />
            <div className="doc-info-box">
              El estado de situación financiera se estructura a través de tres
              conceptos patrimoniales. Este informe debe ser auditado por un
              contador.
            </div>
          </div>
        )}
      </div>

      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("acta")}>
          <div className="accordion-header-left">
            <span className="status-icon status-alert">
              <FiAlertCircle />
            </span>
            <span>Acta de designación de autoridades</span>
          </div>
          <span
            className={`chevron-icon ${docExpandido === "acta" ? "open" : ""}`}
          >
            ▼
          </span>
        </div>
        {docExpandido === "acta" && (
          <div className="accordion-body">
            <DropzoneCard />
            <div className="doc-info-box">
              Copia certificada del acta de asamblea donde se designan las
              autoridades vigentes.
            </div>
          </div>
        )}
      </div>

      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("poderes")}>
          <div className="accordion-header-left">
            <span className="status-icon status-warn">
              <FiAlertCircle />
            </span>
            <span>Poderes</span>
          </div>
          <span
            className={`chevron-icon ${docExpandido === "poderes" ? "open" : ""}`}
          >
            ▼
          </span>
        </div>
        {docExpandido === "poderes" && (
          <div className="accordion-body">
            <DropzoneCard />
            <div className="doc-info-box">
              Copia de los poderes otorgados para operar y representar a la
              sociedad.
            </div>
          </div>
        )}
      </div>

      <hr className="section-divider" style={{ margin: "3rem 0" }} />

      <h3 className="step-subtitle white" style={{ marginBottom: "5px" }}>
        Completá la información y documentación de cada socio.
      </h3>
      <p className="form-label muted" style={{ marginBottom: "2rem" }}>
        La dirección de mail tiene que ser personal (no de un sector de la
        empresa).
      </p>

      {socios.length === 0 ? (
        <div className="warning-box-modern">
          <FiAlertCircle className="warning-icon" />
          <p className="warning-text">
            No hay socios cargados para completar información.
          </p>
        </div>
      ) : (
        socios.map((socio, index) => {
          const socioId = `socio-${index}`;
          const isEditing = editModes[socioId];

          return (
            <div className="accordion-item" key={index}>
              <div
                className="accordion-header"
                onClick={() => {
                  setEditModes((prev) => ({ ...prev, [socioId]: false }));
                  toggleDoc(socioId);
                }}
              >
                <div className="accordion-header-left">
                  <span className="status-icon status-alert">
                    <FiAlertCircle />
                  </span>
                  <div className="accordion-title-group">
                    <span style={{ fontSize: "1.1rem" }}>
                      CUIT {socio.cuit}
                    </span>
                  </div>
                </div>

                <div
                  className="accordion-action-group"
                  style={{ display: "flex", alignItems: "center", gap: "15px" }}
                >
                  <button
                    type="button"
                    className="btn-icon-ghost"
                    style={{ color: "var(--yellow)" }}
                    onClick={(e) => handleEditSocio(e, socioId)}
                    title="Editar datos de contacto"
                  >
                    <FiEdit size={20} />
                  </button>
                  <span
                    className={`chevron-icon ${docExpandido === socioId ? "open" : ""}`}
                  >
                    ▼
                  </span>
                </div>
              </div>

              {docExpandido === socioId && (
                <div className="accordion-body accordion-body-column anim-fade-in">
                  {isEditing ? (
                    <div className="anim-fade-in">
                      <div
                        className="verified-summary-card"
                        style={{
                          padding: "15px",
                          marginBottom: "20px",
                          backgroundColor: "rgba(255, 255, 255, 0.05)",
                          border: "1px dashed #555",
                        }}
                      >
                        <p
                          className="summary-value-business"
                          style={{ margin: 0, color: "#aaa" }}
                        >
                          Editando datos de:{" "}
                          <strong style={{ color: "var(--white)" }}>
                            {socio.nombre}
                          </strong>
                        </p>
                      </div>

                      <div className="form-row">
                        <div className="form-col form-group-spaced">
                          <label className="form-label">Email *</label>
                          <input
                            type="email"
                            className="form-input"
                            {...register(`socios.${index}.email`)}
                          />
                        </div>
                        <div className="form-col form-group-spaced">
                          <label className="form-label">Celular *</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register(`socios.${index}.celular`)}
                          />
                        </div>
                      </div>

                      <div className="form-group-spaced">
                        <label className="form-label">Dirección *</label>
                        <input
                          type="text"
                          className="form-input"
                          {...register(`socios.${index}.direccion`)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-col form-group-spaced">
                          <label className="form-label">Provincia *</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register(`socios.${index}.provincia`)}
                          />
                        </div>
                        <div className="form-col form-group-spaced">
                          <label className="form-label">Localidad *</label>
                          <input
                            type="text"
                            className="form-input"
                            {...register(`socios.${index}.localidad`)}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          marginTop: "1rem",
                          borderTop: "1px dashed #333",
                          paddingTop: "1rem",
                        }}
                      >
                        <button
                          type="button"
                          className="btn-action"
                          onClick={() => handleGuardarDatosSocio(socioId)}
                        >
                          GUARDAR DATOS
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="anim-fade-in">
                      <div
                        className="verified-summary-card"
                        style={{ padding: "15px", marginBottom: "20px" }}
                      >
                        <p
                          className="summary-value-business"
                          style={{ margin: 0 }}
                        >
                          Participación:{" "}
                          <strong style={{ color: "var(--yellow)" }}>
                            {socio.participacion}%
                          </strong>
                          <span
                            style={{
                              color: "#888",
                              marginLeft: "10px",
                              fontSize: "0.9rem",
                            }}
                          >
                            | {socio.nombre}
                          </span>
                        </p>
                      </div>

                      <div
                        className="dynamic-inputs-row"
                        style={{ gap: "20px" }}
                      >
                        <div style={{ flex: 1 }}>
                          <DropzoneCard
                            label="DNI Frente"
                            subtext="Imagen clara"
                            accept=".jpg,.png,.pdf"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <DropzoneCard
                            label="DNI Dorso"
                            subtext="Imagen clara"
                            accept=".jpg,.png,.pdf"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <button
          type="button"
          onClick={onVolverASocios}
          className="btn-link action-secondary"
        >
          Editar lista general de socios
        </button>
      </div>

      <hr className="section-divider" style={{ margin: "3rem 0" }} />

      <h3 className="step-subtitle white" style={{ marginBottom: "2rem" }}>
        Representante Legal / Apoderado
      </h3>

      {faseApoderado === "ingresar" && (
        <div className="search-cuit-container form-group-spaced">
          <div className="input-with-icon flex-1">
            <input
              type="text"
              placeholder="Ingresar CUIT del apoderado"
              className="form-input form-input-pl"
              style={{ marginBottom: 0 }}
              {...register("apoCuit")}
            />
          </div>
          <button
            type="button"
            onClick={validarCuitApoderado}
            className="btn-action"
            style={{ height: "42px" }}
          >
            VALIDAR
          </button>
          {errors.apoCuit && (
            <span className="error-text-absolute">
              {errors.apoCuit.message}
            </span>
          )}
        </div>
      )}

      {faseApoderado === "completar" && (
        <div className="step-section anim-fade-in">
          <div className="form-row" style={{ alignItems: "flex-start" }}>
            <div className="form-col">
              <label className="form-label muted">Cuit</label>
              <div
                className="input-with-icon"
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{
                    marginBottom: 0,
                    backgroundColor: "rgba(255,255,255,0.02)",
                    color: "#aaa",
                    borderColor: "#444",
                  }}
                  value={apoCuitIngresado}
                  readOnly
                />
                <button
                  type="button"
                  className="btn-icon-ghost"
                  onClick={() => setFaseApoderado("ingresar")}
                  title="Cambiar CUIT"
                >
                  <FiEdit size={18} />
                </button>
              </div>
            </div>
            <div className="form-col">
              <label className="form-label muted">Nombre y Apellido</label>
              <input
                type="text"
                className="form-input"
                style={{
                  marginBottom: 0,
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "#aaa",
                  borderColor: "#444",
                }}
                value={apoNombre}
                readOnly
              />
            </div>
          </div>

          <div
            className="radio-group form-group-spaced"
            style={{
              display: "flex",
              gap: "30px",
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <label
              className="radio-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                color: "var(--white)",
              }}
            >
              <input
                type="radio"
                name="rol"
                value="Apoderado"
                checked={apoRol === "Apoderado"}
                onChange={(e) => setApoRol(e.target.value)}
                className="radio-input"
                style={{
                  accentColor: "var(--yellow)",
                  width: "18px",
                  height: "18px",
                }}
              />
              Apoderado
            </label>
            <label
              className="radio-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                color: "var(--white)",
              }}
            >
              <input
                type="radio"
                name="rol"
                value="Representante Legal"
                checked={apoRol === "Representante Legal"}
                onChange={(e) => setApoRol(e.target.value)}
                className="radio-input"
                style={{
                  accentColor: "var(--yellow)",
                  width: "18px",
                  height: "18px",
                }}
              />
              Representante Legal
            </label>
          </div>

          <div className="form-row step-section">
            <div className="form-col form-group-spaced">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-input"
                {...register("apoEmail")}
              />
              {errors.apoEmail && (
                <span className="error-text-absolute">
                  {errors.apoEmail.message}
                </span>
              )}
            </div>
            <div className="form-col form-group-spaced">
              <label className="form-label">Celular *</label>
              <input
                type="text"
                className="form-input"
                {...register("apoCelular")}
              />
              {errors.apoCelular && (
                <span className="error-text-absolute">
                  {errors.apoCelular.message}
                </span>
              )}
            </div>
          </div>

          <div className="form-actions-flex">
            <button
              type="button"
              onClick={() => setFaseApoderado("ingresar")}
              className="btn-outline action-secondary"
              style={{ border: "none" }}
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={guardarApoderado}
              className="btn-action btn-rounded"
            >
              GUARDAR
            </button>
          </div>
        </div>
      )}

      {faseApoderado === "guardado" && (
        <div className="verified-summary-card anim-fade-in">
          <div className="summary-info-group">
            <div className="summary-status">
              <FiCheckCircle className="status-icon-check" />
              <span className="summary-label-modern">IDENTIDAD VALIDADA</span>
            </div>
            <p
              className="summary-value-highlight"
              style={{ fontSize: "1.2rem" }}
            >
              {apoNombre} - {apoRol}
            </p>
            <p className="summary-value-business">CUIT: {apoCuitIngresado}</p>
          </div>
          <button
            type="button"
            onClick={() => setFaseApoderado("completar")}
            className="btn-edit-ghost"
          >
            <FiEdit size={14} /> Editar
          </button>
        </div>
      )}

      {/* MAIL DE FACTURACIÓN */}
      <hr className="section-divider" style={{ margin: "3rem 0" }} />
      <div className="step-section-lg" style={{ position: "relative" }}>
        <h3
          className="step-subtitle white small"
          style={{ marginBottom: "1.5rem" }}
        >
          INDICANOS EL MAIL DONDE QUERES QUE TE LLEGUE LA FACTURA:
        </h3>
        <div className="form-group-spaced input-width-md">
          <input
            type="email"
            placeholder="Ej: facturacion@empresa.com"
            className="form-input"
            style={{ marginBottom: 0 }}
            {...register("emailFacturacion")}
          />
          {errors.emailFacturacion && (
            <span className="error-text-absolute">
              {errors.emailFacturacion.message}
            </span>
          )}
        </div>
      </div>

      <div className="form-actions-right" style={{ marginTop: "2rem" }}>
        <button type="button" onClick={avanzarPaso6} className="btn-action">
          CONTINUAR
        </button>
      </div>
    </div>
  );
}
