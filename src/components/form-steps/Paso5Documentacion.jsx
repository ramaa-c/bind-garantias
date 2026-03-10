import React from "react";
import { useFormContext } from "react-hook-form";
import { FiCheckCircle, FiAlertCircle, FiEdit, FiHome } from "react-icons/fi";

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

  return (
    <div className="paso-5-animado">
      <h3 className="section-title-doc">Documentación</h3>

      {/* 1. Estatuto */}
      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("estatuto")}>
          <div className="accordion-header-left">
            <span className="status-icon status-check">
              <FiCheckCircle />
            </span>
            <span>Estatuto</span>
          </div>
          <span className={`chevron-icon ${docExpandido === "estatuto" ? "open" : ""}`}>
            ▼
          </span>
        </div>
        {docExpandido === "estatuto" && (
          <div className="accordion-body">
            <div className="upload-box">
              <span className="upload-icon">+</span>
              <span className="upload-text">Subir archivo</span>
              <span className="upload-subtext">
                Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB
              </span>
            </div>
            <div className="doc-info-box">
              Los estatutos son las normas por las que se regirá el funcionamiento de la entidad. En ellos se contemplan temas de vital importancia.
            </div>
          </div>
        )}
      </div>

      {/* 2. Balance */}
      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("balance")}>
          <div className="accordion-header-left">
            <span className="status-icon status-alert">
              <FiAlertCircle />
            </span>
            <span>Último Balance exigible, certificado</span>
          </div>
          <span className={`chevron-icon ${docExpandido === "balance" ? "open" : ""}`}>
            ▼
          </span>
        </div>
        {docExpandido === "balance" && (
          <div className="accordion-body">
            <div className="upload-box">
              <span className="upload-icon">+</span>
              <span className="upload-text">Subir archivo</span>
              <span className="upload-subtext">
                Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB
              </span>
            </div>
            <div className="doc-info-box">
              El estado de situación financiera se estructura a través de tres conceptos patrimoniales, el activo, el pasivo y el patrimonio neto. Este informe debe ser auditado.
            </div>
          </div>
        )}
      </div>

      {/* 3. Acta */}
      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("acta")}>
          <div className="accordion-header-left">
            <span className="status-icon status-alert">
              <FiAlertCircle />
            </span>
            <span>Acta de designación de autoridades</span>
          </div>
          <span className={`chevron-icon ${docExpandido === "acta" ? "open" : ""}`}>
            ▼
          </span>
        </div>
        {docExpandido === "acta" && (
          <div className="accordion-body">
            <div className="upload-box">
              <span className="upload-icon">+</span>
              <span className="upload-text">Subir archivo</span>
              <span className="upload-subtext">
                Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB
              </span>
            </div>
            <div className="doc-info-box">
              Copia certificada del acta de asamblea o reunión de directorio donde se efectúa la designación de las autoridades vigentes de la sociedad.
            </div>
          </div>
        )}
      </div>

      {/* 4. Poderes */}
      <div className="accordion-item">
        <div className="accordion-header" onClick={() => toggleDoc("poderes")}>
          <div className="accordion-header-left">
            <span className="status-icon status-warn">
              <FiAlertCircle />
            </span>
            <span>Poderes</span>
          </div>
          <span className={`chevron-icon ${docExpandido === "poderes" ? "open" : ""}`}>
            ▼
          </span>
        </div>
        {docExpandido === "poderes" && (
          <div className="accordion-body">
            <div className="upload-box">
              <span className="upload-icon">+</span>
              <span className="upload-text">Subir archivo</span>
              <span className="upload-subtext">
                Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB
              </span>
            </div>
            <div className="doc-info-box">
              Copia de los poderes otorgados por la empresa a los representantes legales o apoderados para operar y representar a la sociedad.
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN SOCIOS */}
      <h3 className="section-title-doc step-section-lg">SOCIOS</h3>

      {socios.length === 0 ? (
        <p className="empty-state-text">No hay socios cargados para solicitar DNI.</p>
      ) : (
        socios.map((socio, index) => {
          const socioId = `socio-${index}`;
          return (
            <div className="accordion-item" key={index}>
              <div className="accordion-header" onClick={() => toggleDoc(socioId)}>
                <div className="accordion-header-left">
                  <span className="status-icon status-alert">
                    <FiAlertCircle />
                  </span>
                  <div className="accordion-title-group">
                    <span>{socio.nombre}</span>
                    <span className="accordion-subtitle">CUIT {socio.cuit}</span>
                  </div>
                </div>

                <div className="accordion-action-group">
                  <button
                    type="button"
                    className="action-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Editar socio");
                    }}
                  >
                    <FiEdit />
                  </button>
                  <span className={`chevron-icon ${docExpandido === socioId ? "open" : ""}`}>
                    ▼
                  </span>
                </div>
              </div>

              {docExpandido === socioId && (
                <div className="accordion-body accordion-body-column">
                  <p className="socio-detail-text">
                    Socio &nbsp;&nbsp;&nbsp;&nbsp; {socio.participacion}% participación
                  </p>
                  <p className="socio-detail-address">
                    <FiHome /> Domicilio: -
                  </p>
                  <div className="dni-upload-grid">
                    <div className="upload-box upload-box-sm">
                      <span className="upload-icon">+</span>
                      <span className="upload-text">Subir DNI Frente</span>
                    </div>
                    <div className="upload-box upload-box-sm">
                      <span className="upload-icon">+</span>
                      <span className="upload-text">Subir DNI Dorso</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* BOTÓN VOLVER A SOCIOS */}
      <div className="step-section">
        <button
          type="button"
          onClick={onVolverASocios}
          className="btn-outline btn-sm"
        >
          RETORNAR A LA PANTALLA DE CARGA DE SOCIOS
        </button>
      </div>

      {/* SECCIÓN APODERADO CON ZOD */}
      <h3 className="title-apoderado">
        CARGAR UN NUEVO REPRESENTANTE LEGAL / APODERADO
      </h3>

      {faseApoderado === "ingresar" && (
        <div className="form-row-align">
          <div className="bolsa-container" style={{ position: "relative" }}>
            <label className="form-label muted">Cuit</label>
            <input
              type="text"
              className="form-input input-width-md"
              {...register("apoCuit")}
            />
            {errors.apoCuit && (
              <span className="error-text-inline">{errors.apoCuit.message}</span>
            )}
          </div>
          <button
            type="button"
            onClick={validarCuitApoderado}
            className="btn-validate step-section"
          >
            VALIDAR CUIT
          </button>
        </div>
      )}

      {faseApoderado === "completar" && (
        <div className="step-section">
          <div className="form-row">
            <div className="form-col">
              <label className="form-label muted">Cuit:</label>
              <p className="readonly-text">{apoCuitIngresado} ✓</p>
            </div>
            <div className="form-col">
              <label className="form-label muted">Nombre:</label>
              <p className="readonly-text">{apoNombre}</p>
            </div>
          </div>

          <div className="radio-group bolsa-container">
            <label className="radio-label">
              <input
                type="radio"
                name="rol"
                value="Apoderado"
                checked={apoRol === "Apoderado"}
                onChange={(e) => setApoRol(e.target.value)}
                className="radio-input"
              />
              Apoderado
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="rol"
                value="Representante Legal"
                checked={apoRol === "Representante Legal"}
                onChange={(e) => setApoRol(e.target.value)}
                className="radio-input"
              />
              Representante Legal
            </label>
          </div>

          <div className="form-row step-section">
            <div className="form-col" style={{ position: "relative" }}>
              <label className="form-label muted">Email *</label>
              <input
                type="email"
                className="form-input"
                {...register("apoEmail")}
              />
              {errors.apoEmail && (
                <span className="error-text-inline">{errors.apoEmail.message}</span>
              )}
            </div>
            <div className="form-col" style={{ position: "relative" }}>
              <label className="form-label muted">Celular *</label>
              <input
                type="text"
                className="form-input"
                {...register("apoCelular")}
              />
              {errors.apoCelular && (
                <span className="error-text-inline">{errors.apoCelular.message}</span>
              )}
            </div>
          </div>

          <div className="form-actions-flex">
            <button
              type="button"
              onClick={() => setFaseApoderado("ingresar")}
              className="btn-cancel"
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
        <div className="summary-row form-row-align">
          <span className="status-icon status-check readonly-text-highlight">
            ✓
          </span>
          <div>
            <p className="readonly-text socio-detail-text">
              {apoNombre} - {apoRol}
            </p>
            <span className="summary-label step-section">
              CUIT {apoCuitIngresado}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFaseApoderado("completar")}
            className="btn-link"
            style={{ marginLeft: "auto" }}
          >
            Editar
          </button>
        </div>
      )}

      {/* MAIL DE FACTURACIÓN CON ZOD */}
      <div className="section-divider step-section-lg" style={{ position: "relative" }}>
        <h3 className="step-subtitle highlight small">
          INDICANOS EL MAIL DONDE QUERES QUE TE LLEGUE LA FACTURA:
        </h3>
        <input
          type="email"
          className="form-input input-width-md step-section"
          {...register("emailFacturacion")}
        />
        {errors.emailFacturacion && (
          <span className="error-text-inline" style={{ bottom: "-25px" }}>
            {errors.emailFacturacion.message}
          </span>
        )}
      </div>

      <div className="form-actions-right">
        <button type="button" onClick={avanzarPaso6} className="btn-action">
          CONTINUAR
        </button>
      </div>
    </div>
  );
}