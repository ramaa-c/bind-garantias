import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "../components/Navbar"; 
import logoBind from "../assets/images/Logo-BIND.webp";
import "../styles/cheques.css"; 

// --- ÍCONOS SVG PERSONALIZADOS ---
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const chequesSchema = z.object({
  cuit: z.string().regex(/^\d{11}$/, { message: "Debe contener 11 números sin guiones" }),
  direccion: z.string().min(3, { message: "La dirección es obligatoria" }),
  provincia: z.string().min(3, { message: "La provincia es obligatoria" }),
  localidad: z.string().min(3, { message: "La localidad es obligatoria" }),
  celular: z.string().regex(/^\d{10}$/, { message: "Debe contener 10 números (ej: 1122334455)" }),
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
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // --- ESTADOS PASO 4 (SOCIOS) ---
  const [socios, setSocios] = useState([]); 
  const [faseSocio, setFaseSocio] = useState("lista"); 
  const [tempSocioCuit, setTempSocioCuit] = useState("");
  const [tempSocioNombre, setTempSocioNombre] = useState("");
  const [tempSocioParticipacion, setTempSocioParticipacion] = useState("");
  
  // --- ESTADOS PASO 5 (DOCUMENTACIÓN, APODERADO, MAIL) ---
  const [docExpandido, setDocExpandido] = useState("estatuto");
  const [faseApoderado, setFaseApoderado] = useState("ingresar"); 
  const [apoCuit, setApoCuit] = useState("");
  const [apoNombre, setApoNombre] = useState("");
  const [apoRol, setApoRol] = useState("Representante Legal");
  const [apoEmail, setApoEmail] = useState("");
  const [apoCelular, setApoCelular] = useState("");
  const [emailFacturacion, setEmailFacturacion] = useState("");

  // --- ESTADOS PASO 6 (BOLSA) ---
  const [sociedadBolsa, setSociedadBolsa] = useState("");
  const [numeroCuentaBolsa, setNumeroCuentaBolsa] = useState("");

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(chequesSchema),
    mode: "onChange",
    defaultValues: { moneda: "Pesos" },
  });

  const cuitIngresado = watch("cuit", "");
  const montoIngresado = watch("monto", "");

  // --- NAVEGACIÓN ---
  const handleValidarCuit = async () => { if (await trigger("cuit")) setPasoActual(2); };
  const handleVolver = () => {
    if(pasoActual === 7) setPasoActual(1);
    else setPasoActual(pasoActual - 1);
  };
  const abrirModalSms = async () => { if (await trigger("celular")) setMostrarModal(true); };
  const confirmarSms = () => setMostrarModal(false);
  const handleContinuarPaso2 = async () => { if (await trigger(["direccion", "provincia", "localidad", "celular"])) setPasoActual(3); };
  
  const onSubmitFinal = (data) => setMostrarResultados(true);

  // --- LÓGICA PASO 4 (SOCIOS) ---
  const iniciarCargaSocio = () => {
    setTempSocioCuit("");
    setTempSocioParticipacion("");
    setFaseSocio("ingresar_cuit");
  };

  const validarCuitSocio = () => {
    setTempSocioNombre("SEOANE SUAREZ MARINA"); // Simulado
    setFaseSocio("completar_datos");
  };

  const guardarSocio = () => {
    if(!tempSocioParticipacion) return; 
    const nuevoSocio = { cuit: tempSocioCuit, nombre: tempSocioNombre, participacion: tempSocioParticipacion };
    setSocios([...socios, nuevoSocio]);
    setFaseSocio("lista");
  };

  const eliminarSocio = (index) => {
    const nuevosSocios = socios.filter((_, i) => i !== index);
    setSocios(nuevosSocios);
    if(nuevosSocios.length === 0) setFaseSocio("ingresar_cuit");
  };

  const continuarAlProximoPaso = () => setPasoActual(5);

  // --- LÓGICA PASO 5 (APODERADO) ---
  const validarCuitApoderado = () => {
    setApoNombre("GOMEZ PEREZ JUAN"); // Simulado
    setFaseApoderado("completar");
  };

  return (
    <div className="cheques-page">
      <header className="cheques-header">
        <img src={logoBind} alt="Logo BIND" className="cheques-logo" />
        <div className="cheques-user">Usuario@email.com</div>
      </header>

      {/* BANNER DINÁMICO */}
      <section className="cheques-banner">
        {pasoActual === 7 ? (
          <div className="banner-content-approved">
            <h1 className="banner-title" style={{ fontSize: '42px' }}>¡Felicitaciones!<br/>Tu solicitud está pre-aprobada</h1>
            <p className="banner-subtitle" style={{ border: 'none', color: 'var(--yellow)', fontWeight: 'bold' }}>Te contamos los pasos a seguir</p>
          </div>
        ) : pasoActual >= 4 ? (
          <div className="banner-content-approved">
            <h1 className="banner-title">
              {pasoActual === 4 ? "¡Vamos bien. Tu solicitud está pre-aprobada!" : 
               pasoActual === 5 ? "Completá el legajo digital de la empresa para continuar" :
               "¿Tiene cuenta en alguna de estas sociedades de bolsa?"}
            </h1>
            {pasoActual === 4 && <p className="banner-subtitle">Completá información de tus socios para continuar</p>}
          </div>
        ) : (
          <h2>[ Espacio para imagen de la empresa ]</h2>
        )}
      </section>

      <div className="form-main-container">
        <div className="contenedor-principal">
          <div className="seccion-formulario">
            
            {/* BOTÓN VOLVER GENERAL */}
            {(pasoActual >= 3 && pasoActual <= 6) && (
              <div className="back-button-container">
                <button type="button" onClick={() => { 
                    handleVolver(); 
                    if(pasoActual === 3) setMostrarResultados(false); 
                  }} className="btn-back">
                  ← Volver a la lista
                </button>
              </div>
            )}

            {pasoActual < 4 && (
              <>
                <h1 className="cheques-title">
                  {pasoActual === 3 ? "Ya podés seleccionar el monto y tipo de financiación que estás necesitando." : "Completá los siguientes datos básicos"}
                </h1>
                <div className="progress-container">
                  <p className="progress-text">Avance de solicitud</p>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: pasoActual === 1 ? "10%" : pasoActual === 2 ? "40%" : "80%" }}></div>
                  </div>
                </div>
              </>
            )}

            <form className="form-content" onSubmit={handleSubmit(onSubmitFinal)}>
              
              {/* === PASO 1 === */}
              {pasoActual === 1 && (
                 <div>
                 <label className="form-label">Cuit <span className="required-asterisk">*</span></label>
                 <div className="form-row-align" style={{ position: "relative" }}>
                   <div style={{ position: "relative" }}>
                     <input type="text" placeholder="Ingresá tu CUIT (11 números)" className="form-input input-width-md" {...register("cuit")} />
                     {errors.cuit && <span className="error-text-inline">{errors.cuit.message}</span>}
                   </div>
                   <button type="button" onClick={handleValidarCuit} className="btn-validate">VALIDAR CUIT</button>
                 </div>
               </div>
              )}

              {/* === PASO 2 === */}
              {pasoActual === 2 && (
                <div className="paso-2-animado">
                  <div className="summary-row">
                    <div><span className="summary-label">Cuit:</span><p className="summary-value-highlight">{cuitIngresado}</p></div>
                    <div><span className="summary-label">Razón social:</span><p className="summary-value">EMPRESA DE PRUEBA S.A.</p></div>
                    <button type="button" onClick={handleVolver} className="btn-link">Editar CUIT</button>
                  </div>
                  <h3 className="step-subtitle">Verificá y actualizá la información en caso de ser necesario</h3>
                  <div style={{ position: "relative", marginBottom: "2rem" }}>
                    <label className="form-label">Dirección *</label>
                    <input type="text" className="form-input" {...register("direccion")} />
                  </div>
                  <div className="form-row">
                    <div className="form-col" style={{ position: "relative" }}><label className="form-label">Provincia *</label><input type="text" className="form-input" {...register("provincia")} /></div>
                    <div className="form-col" style={{ position: "relative" }}><label className="form-label">Localidad *</label><input type="text" className="form-input" {...register("localidad")} /></div>
                  </div>
                  <div className="celular-row">
                    <div className="input-width-md" style={{ position: "relative" }}><label className="form-label">Celular *</label><input type="text" placeholder="Sin 15 y cód. área sin 0" className="form-input" {...register("celular")} /></div>
                    <button type="button" onClick={abrirModalSms} className="btn-outline">VERIFICAR CELULAR</button>
                  </div>
                  <div className="btn-right-container"><button type="button" className="btn-action" onClick={handleContinuarPaso2}>CONTINUAR</button></div>
                </div>
              )}

              {/* === PASO 3 (Simulador) === */}
              {pasoActual === 3 && (
                <div className="paso-3-animado">
                  <div className="warning-box"><p className="warning-text">Este cálculo es una simulación...</p></div>
                  <div className="form-row">
                    <div className="form-col"><label className="form-label muted">Moneda *</label><select className="form-select" {...register("moneda")}><option value="Pesos">Pesos</option></select></div>
                    <div className="form-col"><label className="form-label muted">Tipo de producto *</label><select className="form-select" {...register("tipoProducto")}><option value="cheque">Cheque de pago diferido</option></select></div>
                  </div>
                  <div style={{ marginBottom: "30px" }}><label className="form-label muted">Tipo de cálculo *</label><select className="form-select" {...register("tipoCalculo")}><option value="tasa-directa">Tasa Directa</option></select></div>
                  <div className="form-row" style={{ marginBottom: "40px" }}>
                    <div className="form-col"><label className="form-label muted">Monto a financiar</label><input type="number" className="form-input" {...register("monto")} /></div>
                    <div className="form-col"><label className="form-label muted">Plazo</label><select className="form-select" {...register("plazo")}><option value="30">30 días</option></select></div>
                  </div>
                  <div style={{ textAlign: "right", display: mostrarResultados ? 'none' : 'block' }}>
                    <button type="submit" className="btn-action">CALCULAR</button>
                  </div>

                  {mostrarResultados && (
                    <div className="results-container">
                      <div className="results-header"><h3 className="results-title">Neto estimado a recibir:</h3><p className="results-amount">$ 2.532.096</p></div>
                      <div className="info-box"><p>Tasa de interés estimativa.</p></div>
                      <div style={{ textAlign: "center", marginTop: "30px" }}>
                        <button type="button" className="btn-action" onClick={() => { setPasoActual(4); setFaseSocio(socios.length === 0 ? "ingresar_cuit" : "lista"); }}>CONTINUAR</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === PASO 4 (Socios) === */}
              {pasoActual === 4 && (
                <div className="paso-4-animado">
                  {faseSocio === "ingresar_cuit" && (
                    <div style={{ marginTop: '20px' }}>
                      <h3 className="step-subtitle" style={{color: 'var(--yellow)', fontWeight: 'bold'}}>CARGAR UN SOCIO</h3>
                      <label className="form-label muted">Cuit</label>
                      <div className="form-row-align">
                        <input type="text" value={tempSocioCuit} onChange={(e) => setTempSocioCuit(e.target.value)} className="form-input input-width-md" />
                        <button type="button" onClick={validarCuitSocio} className="btn-validate">VALIDAR CUIT</button>
                      </div>
                    </div>
                  )}

                  {faseSocio === "completar_datos" && (
                    <div style={{ marginTop: '20px' }}>
                      <h3 className="step-subtitle" style={{color: 'var(--yellow)', fontWeight: 'bold'}}>CARGAR UN SOCIO</h3>
                      <div className="form-row">
                        <div className="form-col"><label className="form-label muted">Cuit:</label><p className="readonly-text">{tempSocioCuit} ✓</p></div>
                        <div className="form-col"><label className="form-label muted">Nombre:</label><p className="readonly-text">{tempSocioNombre}</p></div>
                      </div>
                      <div style={{ marginTop: '30px', width: '200px' }}>
                        <label className="form-label" style={{color: 'var(--yellow)'}}>Participación</label>
                        <input type="number" value={tempSocioParticipacion} onChange={(e) => setTempSocioParticipacion(e.target.value)} className="form-input" />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", marginTop: "40px" }}>
                        <button type="button" onClick={() => socios.length === 0 ? setFaseSocio("ingresar_cuit") : setFaseSocio("lista")} className="btn-cancel">CANCELAR</button>
                        <button type="button" onClick={guardarSocio} className="btn-action">GUARDAR</button>
                      </div>
                    </div>
                  )}

                  {faseSocio === "lista" && (
                    <div style={{ marginTop: '20px' }}>
                      <h3 className="step-subtitle" style={{color: 'var(--yellow)', fontWeight: 'bold'}}>SOCIOS</h3>
                      <div className="socio-list-container">
                        {socios.map((socio, index) => (
                          <div className="socio-item" key={index}>
                            <div className="socio-info-main">
                              <span className="status-icon status-check" style={{fontSize: '20px'}}>✓</span>
                              <div><h4 className="socio-name">{socio.nombre}</h4><p className="socio-cuit">CUIT {socio.cuit}</p></div>
                            </div>
                            <div className="socio-participacion">Socio &nbsp;&nbsp;&nbsp;&nbsp; {socio.participacion}% participación</div>
                            <div className="socio-actions">
                              {/* Reemplazamos los emojis por SVG */}
                              <button type="button" className="action-icon"><EditIcon /></button>
                              <button type="button" onClick={() => eliminarSocio(index)} className="action-icon"><TrashIcon /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: '30px' }}>
                        <button type="button" onClick={iniciarCargaSocio} className="btn-outline" style={{ marginTop: 0 }}>AGREGAR SOCIO</button>
                      </div>
                      <div style={{ textAlign: "right", marginTop: "40px", borderTop: "1px solid #333", paddingTop: "30px" }}>
                        <button type="button" onClick={continuarAlProximoPaso} className="btn-action">CONTINUAR</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* === PASO 5 (Documentación / Legajo / Apoderado) === */}
              {pasoActual === 5 && (
                <div className="paso-5-animado">
                  
                  <h3 className="section-title-doc">Documentación</h3>

                  {/* 1. Estatuto */}
                  <div className="accordion-item">
                    <div className="accordion-header" onClick={() => setDocExpandido(docExpandido === "estatuto" ? "" : "estatuto")}>
                      <div className="accordion-header-left"><span className="status-icon status-check">✓</span><span>Estatuto</span></div>
                      <span className={`chevron-icon ${docExpandido === "estatuto" ? "open" : ""}`}>▼</span>
                    </div>
                    {docExpandido === "estatuto" && (
                      <div className="accordion-body">
                        <div className="upload-box"><span className="upload-icon">+</span><span className="upload-text">Subir archivo</span><span className="upload-subtext">Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB</span></div>
                        <div className="doc-info-box">Los estatutos son las normas por las que se regirá el funcionamiento de la entidad. En ellos se contemplan temas de vital importancia.</div>
                      </div>
                    )}
                  </div>

                  {/* 2. Balance */}
                  <div className="accordion-item">
                    <div className="accordion-header" onClick={() => setDocExpandido(docExpandido === "balance" ? "" : "balance")}>
                      <div className="accordion-header-left"><span className="status-icon status-alert">!</span><span>Último Balance exigible, certificado</span></div>
                      <span className={`chevron-icon ${docExpandido === "balance" ? "open" : ""}`}>▼</span>
                    </div>
                    {docExpandido === "balance" && (
                      <div className="accordion-body">
                        <div className="upload-box"><span className="upload-icon">+</span><span className="upload-text">Subir archivo</span><span className="upload-subtext">Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB</span></div>
                        <div className="doc-info-box">El estado de situación financiera se estructura a través de tres conceptos patrimoniales, el activo, el pasivo y el patrimonio neto. Este informe debe ser auditado.</div>
                      </div>
                    )}
                  </div>

                  {/* 3. Acta */}
                  <div className="accordion-item">
                    <div className="accordion-header" onClick={() => setDocExpandido(docExpandido === "acta" ? "" : "acta")}>
                      <div className="accordion-header-left"><span className="status-icon status-alert">!</span><span>Acta de designación de autoridades</span></div>
                      <span className={`chevron-icon ${docExpandido === "acta" ? "open" : ""}`}>▼</span>
                    </div>
                    {docExpandido === "acta" && (
                      <div className="accordion-body">
                        <div className="upload-box"><span className="upload-icon">+</span><span className="upload-text">Subir archivo</span><span className="upload-subtext">Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB</span></div>
                        <div className="doc-info-box">Copia certificada del acta de asamblea o reunión de directorio donde se efectúa la designación de las autoridades vigentes de la sociedad.</div>
                      </div>
                    )}
                  </div>

                  {/* 4. Poderes */}
                  <div className="accordion-item">
                    <div className="accordion-header" onClick={() => setDocExpandido(docExpandido === "poderes" ? "" : "poderes")}>
                      <div className="accordion-header-left"><span className="status-icon status-warn">!</span><span>Poderes</span></div>
                      <span className={`chevron-icon ${docExpandido === "poderes" ? "open" : ""}`}>▼</span>
                    </div>
                    {docExpandido === "poderes" && (
                      <div className="accordion-body">
                        <div className="upload-box"><span className="upload-icon">+</span><span className="upload-text">Subir archivo</span><span className="upload-subtext">Podés subir hasta 3 archivos PDF o 1 ZIP menor a 5MB</span></div>
                        <div className="doc-info-box">Copia de los poderes otorgados por la empresa a los representantes legales o apoderados para operar y representar a la sociedad.</div>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN SOCIOS */}
                  <h3 className="section-title-doc" style={{ marginTop: '50px' }}>SOCIOS</h3>
                  
                  {socios.length === 0 ? (
                     <p style={{ color: '#888', fontStyle: 'italic' }}>No hay socios cargados para solicitar DNI.</p>
                  ) : (
                    socios.map((socio, index) => (
                      <div className="accordion-item" key={index}>
                        <div className="accordion-header" onClick={() => setDocExpandido(`socio-${index}`)}>
                          <div className="accordion-header-left">
                            <span className="status-icon status-alert">!</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                               <span>{socio.nombre}</span>
                               <span style={{ fontSize: '11px', opacity: 0.6 }}>CUIT {socio.cuit}</span>
                            </div>
                          </div>
                          
                          {/* Botón Editar con SVG en lugar de Emoji */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                             <button type="button" className="action-icon" onClick={(e) => { e.stopPropagation(); console.log("Editar socio"); }}>
                                <EditIcon />
                             </button>
                             <span className={`chevron-icon ${docExpandido === `socio-${index}` ? "open" : ""}`}>▼</span>
                          </div>
                        </div>
                        
                        {docExpandido === `socio-${index}` && (
                          <div className="accordion-body" style={{ flexDirection: 'column' }}>
                             <p style={{ color: 'var(--white)', margin: 0, fontSize: '14px' }}>Socio &nbsp;&nbsp;&nbsp;&nbsp; {socio.participacion}% participación</p>
                             <p style={{ color: 'var(--white)', margin: '10px 0 0 0', fontSize: '13px' }}>🏠 Domicilio: -</p>
                             <div className="dni-upload-grid">
                                <div className="upload-box" style={{ height: '160px' }}><span className="upload-icon">+</span><span className="upload-text">Subir DNI Frente</span></div>
                                <div className="upload-box" style={{ height: '160px' }}><span className="upload-icon">+</span><span className="upload-text">Subir DNI Dorso</span></div>
                             </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* BOTÓN VOLVER A SOCIOS */}
                  <div style={{ marginTop: '20px' }}>
                    <button type="button" onClick={() => setPasoActual(4)} className="btn-outline" style={{ marginTop: 0, fontSize: '12px', padding: '8px 15px' }}>
                      RETORNAR A LA PANTALLA DE CARGA DE SOCIOS
                    </button>
                  </div>

                  {/* SECCIÓN APODERADO */}
                  <h3 className="title-apoderado">CARGAR UN NUEVO REPRESENTANTE LEGAL / APODERADO</h3>
                  
                  {faseApoderado === "ingresar" && (
                    <div className="form-row-align">
                      <div style={{ position: 'relative' }}>
                        <label className="form-label muted">Cuit</label>
                        <input type="text" value={apoCuit} onChange={(e) => setApoCuit(e.target.value)} className="form-input input-width-md" />
                      </div>
                      <button type="button" onClick={validarCuitApoderado} className="btn-validate" style={{ marginTop: '20px' }}>VALIDAR CUIT</button>
                    </div>
                  )}

                  {faseApoderado === "completar" && (
                    <div style={{ marginTop: '10px' }}>
                      <div className="form-row">
                        <div className="form-col"><label className="form-label muted">Cuit:</label><p className="readonly-text">{apoCuit} ✓</p></div>
                        <div className="form-col"><label className="form-label muted">Nombre:</label><p className="readonly-text">{apoNombre}</p></div>
                      </div>

                      <div className="radio-group" style={{ marginTop: '30px' }}>
                        <label className="radio-label">
                          <input type="radio" name="rol" value="Apoderado" checked={apoRol === "Apoderado"} onChange={(e) => setApoRol(e.target.value)} className="radio-input"/>
                          Apoderado
                        </label>
                        <label className="radio-label">
                          <input type="radio" name="rol" value="Representante Legal" checked={apoRol === "Representante Legal"} onChange={(e) => setApoRol(e.target.value)} className="radio-input"/>
                          Representante Legal
                        </label>
                      </div>

                      <div className="form-row" style={{ marginTop: '20px' }}>
                        <div className="form-col"><label className="form-label muted">Email *</label><input type="email" value={apoEmail} onChange={(e) => setApoEmail(e.target.value)} className="form-input" /></div>
                        <div className="form-col"><label className="form-label muted">Celular *</label><input type="text" value={apoCelular} onChange={(e) => setApoCelular(e.target.value)} className="form-input" /></div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "20px", marginTop: "30px" }}>
                        <button type="button" onClick={() => setFaseApoderado("ingresar")} className="btn-cancel">CANCELAR</button>
                        <button type="button" onClick={() => setFaseApoderado("guardado")} className="btn-action">GUARDAR</button>
                      </div>
                    </div>
                  )}

                  {faseApoderado === "guardado" && (
                    <div className="summary-row" style={{ alignItems: 'center' }}>
                      <span className="status-icon status-check" style={{ fontSize: '24px' }}>✓</span>
                      <div>
                        <p className="readonly-text" style={{ margin: 0 }}>{apoNombre} - {apoRol}</p>
                        <span className="summary-label" style={{ marginTop: '5px' }}>CUIT {apoCuit}</span>
                      </div>
                      <button type="button" onClick={() => setFaseApoderado("completar")} className="btn-link" style={{ marginLeft: 'auto' }}>Editar</button>
                    </div>
                  )}

                  {/* MAIL DE FACTURACIÓN */}
                  <div style={{ marginTop: '50px', borderTop: '1px solid #333', paddingTop: '40px' }}>
                    <h3 className="step-subtitle" style={{color: 'var(--yellow)', fontSize: '15px', fontWeight: 'bold'}}>INDICANOS EL MAIL DONDE QUERES QUE TE LLEGUE LA FACTURA:</h3>
                    <input type="email" value={emailFacturacion} onChange={(e) => setEmailFacturacion(e.target.value)} className="form-input input-width-md" style={{ marginTop: '10px' }} />
                  </div>

                  <div style={{ textAlign: "right", marginTop: "50px" }}>
                    <button type="button" onClick={() => setPasoActual(6)} className="btn-action">CONTINUAR</button>
                  </div>
                </div>
              )}

              {/* === PASO 6 (Sociedades de Bolsa) === */}
              {pasoActual === 6 && (
                <div className="paso-6-animado">
                  <h3 className="step-subtitle" style={{color: 'var(--white)', fontWeight: 'bold', fontSize: '18px', marginBottom: '30px'}}>
                    ¿Tiene cuenta en alguna de estas sociedades de bolsa? Si es asi seleccionala!!
                  </h3>

                  <div style={{ position: "relative", marginBottom: "30px", maxWidth: '500px' }}>
                    <label className="form-label muted">Sociedad de bolsa *</label>
                    <select value={sociedadBolsa} onChange={(e) => setSociedadBolsa(e.target.value)} className="form-select">
                      <option value="">Seleccionar...</option>
                      <option value="Tarallo S.A.">Tarallo S.A.</option>
                      <option value="Otra Sociedad">Otra Sociedad de Bolsa</option>
                    </select>
                  </div>

                  {sociedadBolsa && (
                    <div style={{ position: "relative", marginBottom: "40px", maxWidth: '500px', animation: "fadeIn 0.3s ease" }}>
                      <label className="form-label muted" style={{ color: 'var(--yellow)' }}>Número de cuenta de la sociedad de bolsa *</label>
                      <input type="text" value={numeroCuentaBolsa} onChange={(e) => setNumeroCuentaBolsa(e.target.value)} className="form-input" />
                    </div>
                  )}

                  <div style={{ maxWidth: '500px', marginTop: '50px' }}>
                    <button type="button" onClick={() => setPasoActual(7)} className="btn-large-action">CONTINUAR CON LA SOCIEDAD DE BOLSA SELECCIONADA</button>
                    <button type="button" onClick={() => setPasoActual(7)} className="btn-large-outline">NO TENGO SOCIEDAD DE BOLSA</button>
                    <p className="info-footer-text">Al continuar, se le enviará un email de bienvenida al cliente</p>
                  </div>
                </div>
              )}

              {/* === PASO 7 (Éxito Final) === */}
              {pasoActual === 7 && (
                <div className="paso-7-animado">
                  <div className="success-container">
                    <p className="success-text">
                      Se ha enviado a tu cliente un mail de bienvenida, contactate con él para que se registre en la plataforma, acepte los Términos y condiciones y valide sus datos. (Si no recibe el mail, por favor que revise su casilla de spam.)
                      <br/><br/>
                      Luego de validada la documentación ingresada, el cliente va a recibir por mail la Oferta de Contrato y fianza para firmarla en forma electrónica. Una vez registradas todas las firmas, vamos a habilitarles la línea y podrá comenzar a operar.
                    </p>
                  </div>

                  <div style={{ textAlign: "center", marginTop: "50px" }}>
                    <button type="button" onClick={() => setPasoActual(1)} className="btn-action">VOLVER A LA LISTA</button>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* PANEL DERECHO (Dudas Frecuentes) */}
          {pasoActual !== 7 && (
            <div className="panel-dudas">
              <h3 className="panel-dudas-title">Dudas frecuentes</h3>
              <ul className="faq-list">
                {pasoActual === 4 || pasoActual === 5 ? (
                  <>
                    <li className="faq-item">¿Por qué debo declarar a mis socios?</li>
                    <li className="faq-item">¿Qué pasa si un socio es extranjero?</li>
                  </>
                ) : (
                  <>
                    <li className="faq-item">¿Qué es el CUIT?</li>
                    <li className="faq-item">¿Cómo verifico mi CUIT?</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SMS */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">Ingresá el código de verificación</h3>
              <button onClick={() => setMostrarModal(false)} className="modal-close">✖</button>
            </div>
            <div className="modal-body">
              <p className="modal-text">Te enviamos un sms con un código de verificación para que valides tu celular.</p>
              <label className="modal-label">Código verificación *</label>
              <input type="text" value={codigoSms} onChange={(e) => setCodigoSms(e.target.value)} className="modal-input" />
              <div className="modal-footer">
                <button onClick={() => setMostrarModal(false)} className="btn-cancel">CANCELAR</button>
                <button onClick={confirmarSms} className="btn-action" style={{ padding: "10px 25px", borderRadius: "4px" }}>ACEPTAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}