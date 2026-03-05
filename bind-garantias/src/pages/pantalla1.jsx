import { useState } from 'react';
import logoBind from '../assets/images/Logo-BIND.webp';

export default function Pantalla1() {
  const [pasoActual, setPasoActual] = useState(1);
  const [cuit, setCuit] = useState('');
  
  const [direccion, setDireccion] = useState('');
  const [provincia, setProvincia] = useState('');
  const [localidad, setLocalidad] = useState('');
  
  const [celular, setCelular] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [codigoSms, setCodigoSms] = useState('');

  // --- NUEVOS ESTADOS PARA EL SIMULADOR (PASO 3) ---
  const [moneda, setMoneda] = useState('Pesos');
  const [tipoProducto, setTipoProducto] = useState('');
  const [tipoCalculo, setTipoCalculo] = useState('');
  const [monto, setMonto] = useState('');
  const [plazo, setPlazo] = useState('');

  const handleValidarCuit = () => {
    setPasoActual(2); 
  };

  const handleVolver = () => {
    setPasoActual(1);
  };

  const abrirModalSms = () => {
    setMostrarModal(true);
  };

  const confirmarSms = () => {
    setMostrarModal(false);
    setPasoActual(3); 
  };

  const handleCalcular = () => {
    console.log("Calculando simulación...");
    // Lógica futura para enviar los datos al backend
  };

  // Estilos reutilizables para los inputs y selects
  const inputStyle = {
    padding: '10px 0',
    border: 'none',
    borderBottom: '2px solid var(--white)',
    color: 'var(--white)',
    outline: 'none',
    width: '100%',
    backgroundColor: 'transparent',
    fontSize: '14px'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* HEADER */}
      <header style={{ backgroundColor: '#1A1A1A', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <img src={logoBind} alt="Logo BIND Garantías" style={{ height: '45px', objectFit: 'contain' }} />
        <div style={{ color: 'var(--white)', fontSize: '14px' }}>Usuario@email.com</div>
      </header>

      {/* BANNER */}
      <section style={{ width: '100%', height: '200px', backgroundColor: 'var(--graphite)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--yellow)', overflow: 'hidden' }}>
        <h2 style={{ color: '#555' }}>[ Espacio para la foto del tractor ]</h2>
      </section>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="form-main-container" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <div className="contenedor-principal" style={{ maxWidth: '1200px', width: '100%', display: 'flex', gap: '60px' }}>
          
          <div className="seccion-formulario" style={{ flex: '1' }}>
            {/* Título Dinámico */}
            {pasoActual === 3 && (
               <div style={{ marginBottom: '20px' }}>
                 <button onClick={() => setPasoActual(2)} style={{ background: 'none', border: 'none', color: 'var(--yellow)', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    ← Volver a la lista
                 </button>
               </div>
            )}
            
            <h1 style={{ color: 'var(--white)', fontSize: '24px', fontWeight: 'normal' }}>
              {pasoActual === 3 ? 'Ya podés seleccionar el monto y tipo de financiación que estás necesitando.' : 'Completá los siguientes datos básicos'}
            </h1>
            
            <div style={{ marginTop: '10px' }}>
              <p style={{ color: 'var(--white)', opacity: 0.6, fontSize: '14px' }}>Avance de solicitud</p>
              <div style={{ width: '100%', backgroundColor: 'var(--graphite)', height: '4px', marginTop: '5px' }}>
                <div style={{ 
                  width: pasoActual === 1 ? '10%' : pasoActual === 2 ? '40%' : '80%', 
                  backgroundColor: 'var(--yellow)', height: '100%', transition: 'width 0.5s ease' 
                }}></div>
              </div>
            </div>

            <div style={{ marginTop: '50px' }}>
              
              {/* === PASO 1 === */}
              {pasoActual === 1 && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px' }}>
                    Cuit <span style={{ color: 'var(--yellow)' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <input type="text" value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="Ingresá tu CUIT" style={{ ...inputStyle, width: '300px' }} />
                    <button onClick={handleValidarCuit} style={{ backgroundColor: 'var(--yellow)', color: 'var(--carbon-black)', border: '2px solid var(--yellow)', padding: '10px 25px', cursor: 'pointer', fontWeight: 'bold' }}>
                      VALIDAR CUIT
                    </button>
                  </div>
                </div>
              )}

              {/* === PASO 2 === */}
              {pasoActual === 2 && (
                <div className="paso-2-animado">
                  <div style={{ display: 'flex', gap: '40px', marginBottom: '30px', opacity: 0.7 }}>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--white)' }}>Cuit:</span>
                      <p style={{ color: 'var(--yellow)', fontWeight: 'bold' }}>{cuit}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--white)' }}>Razón social:</span>
                      <p style={{ color: 'var(--white)' }}>EMPRESA DE PRUEBA S.A.</p>
                    </div>
                    <button onClick={handleVolver} style={{ background: 'none', border: 'none', color: 'var(--yellow)', cursor: 'pointer', textDecoration: 'underline' }}>Editar CUIT</button>
                  </div>

                  <h3 style={{ color: 'var(--yellow)', marginBottom: '20px', fontWeight: 'normal' }}>Verificá y actualizá la información en caso de ser necesario</h3>
                  
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px' }}>Dirección <span style={{ color: 'var(--yellow)' }}>*</span></label>
                  <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />

                  <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px' }}>Provincia <span style={{ color: 'var(--yellow)' }}>*</span></label>
                      <input type="text" value={provincia} onChange={(e) => setProvincia(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px' }}>Localidad <span style={{ color: 'var(--yellow)' }}>*</span></label>
                      <input type="text" value={localidad} onChange={(e) => setLocalidad(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {/* CELULAR CORREGIDO: Anchos fijos y proporcionados */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', borderTop: '1px solid #333', paddingTop: '30px' }}>
                    <div style={{ width: '300px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px' }}>Celular <span style={{ color: 'var(--yellow)' }}>*</span></label>
                      <input type="text" value={celular} onChange={(e) => setCelular(e.target.value)} placeholder="Sin 15 y cód. área sin 0" style={inputStyle} />
                    </div>
                    <button onClick={abrirModalSms} style={{ backgroundColor: 'transparent', color: 'var(--yellow)', border: '1px solid var(--yellow)', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', marginTop: '24px' }}>
                      VERIFICAR CELULAR
                    </button>
                  </div>

                  <div style={{ marginTop: '40px', textAlign: 'right' }}>
                    <button style={{ backgroundColor: 'var(--yellow)', color: 'var(--carbon-black)', border: 'none', padding: '12px 40px', cursor: 'pointer', fontWeight: 'bold' }}>CONTINUAR</button>
                  </div>
                </div>
              )}

              {/* === PASO 3 (Simulador) === */}
              {pasoActual === 3 && (
                <div className="paso-3-animado">
                  
                  {/* Caja de advertencia (Estilo Dark Mode) */}
                  <div style={{ backgroundColor: 'rgba(244, 245, 0, 0.05)', borderLeft: '4px solid var(--yellow)', padding: '20px', marginBottom: '30px' }}>
                    <p style={{ color: 'var(--white)', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                      Este cálculo es una simulación a efectos que puedas conocer y estimar los costos de operar con Bind Garantías con una <span style={{ color: 'var(--yellow)', fontWeight: 'bold' }}>TASA DE MERCADO ESTIMATIVA</span> en base a las últimas operaciones. Tené en cuenta que la tasa real se fija recién al momento de la venta de la operación.
                    </p>
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--white)', opacity: 0.7 }}>Razón social:</span>
                    <p style={{ color: 'var(--white)', fontSize: '16px', marginTop: '5px' }}>EMPRESA DE PRUEBA S.A.</p>
                  </div>

                  {/* Grilla de Simulador */}
                  <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px', opacity: 0.7 }}>Moneda *</label>
                      <select value={moneda} onChange={(e) => setMoneda(e.target.value)} style={{ ...inputStyle, paddingBottom: '10px' }}>
                        <option style={{ color: '#000' }} value="Pesos">Pesos</option>
                        <option style={{ color: '#000' }} value="Dolares">Dólares</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px', opacity: 0.7 }}>Tipo de producto *</label>
                      <select value={tipoProducto} onChange={(e) => setTipoProducto(e.target.value)} style={{ ...inputStyle, paddingBottom: '10px' }}>
                        <option style={{ color: '#000' }} value="">Seleccionar...</option>
                        <option style={{ color: '#000' }} value="cheque">Cheque de pago diferido</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px', opacity: 0.7 }}>Tipo de cálculo *</label>
                    <select value={tipoCalculo} onChange={(e) => setTipoCalculo(e.target.value)} style={{ ...inputStyle, paddingBottom: '10px' }}>
                      <option style={{ color: '#000' }} value="">Seleccionar...</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px', opacity: 0.7 }}>Monto a financiar</label>
                      <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', marginBottom: '8px', color: 'var(--white)', fontSize: '14px', opacity: 0.7 }}>Plazo</label>
                      <select value={plazo} onChange={(e) => setPlazo(e.target.value)} style={{ ...inputStyle, paddingBottom: '10px' }}>
                        <option style={{ color: '#000' }} value="">Seleccionar plazo...</option>
                        <option style={{ color: '#000' }} value="30">30 días</option>
                        <option style={{ color: '#000' }} value="60">60 días</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <button onClick={handleCalcular} style={{ backgroundColor: 'var(--yellow)', color: 'var(--carbon-black)', border: 'none', padding: '12px 40px', cursor: 'pointer', fontWeight: 'bold' }}>
                      CALCULAR
                    </button>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* --- Columna Derecha Dinámica --- */}
          <div className="panel-dudas" style={{ width: '280px', borderLeft: '1px solid #333', paddingLeft: '30px' }}>
            <h3 style={{ color: 'var(--yellow)', fontSize: '18px', fontWeight: 'bold', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Dudas frecuentes</h3>
            
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
              {/* Dudas para Paso 1 y 2 */}
              {pasoActual < 3 && (
                <>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid #222' }}>¿Qué es el CUIT?</li>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid #222' }}>¿Cómo verifico mi CUIT?</li>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0' }}>¿Qué pasa si mi CUIT no es válido?</li>
                </>
              )}

              {/* Dudas para Paso 3 (Simulador) */}
              {pasoActual === 3 && (
                <>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid #222' }}>¿Qué moneda seleccionar?</li>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid #222' }}>¿Cuál es el monto máximo de la operación?</li>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid #222' }}>¿Cómo obtengo el monto máximo de la operación?</li>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid #222' }}>¿Cuál es el plazo máximo que puedo solicitar?</li>
                  <li style={{ color: 'var(--white)', fontSize: '14px', padding: '10px 0' }}>¿La tasa que muestra el simulador es la tasa real?</li>
                </>
              )}
            </ul>
          </div>

        </div>
      </div>

      {/* MODAL MANTENIDO EXACTAMENTE IGUAL */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#2E2E2E', width: '500px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <div style={{ backgroundColor: 'var(--yellow)', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--carbon-black)', fontSize: '18px' }}>Ingresá el código de verificación</h3>
              <button onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--carbon-black)', cursor: 'pointer' }}>✖</button>
            </div>
            <div style={{ padding: '30px' }}>
              <p style={{ color: 'var(--white)', fontSize: '14px', marginBottom: '20px' }}>Te enviamos un sms con un código de verificación para que valides tu celular.</p>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--yellow)', fontSize: '12px' }}>Código verificación *</label>
              <input type="text" value={codigoSms} onChange={(e) => setCodigoSms(e.target.value)} style={{ width: '100%', padding: '10px 0', border: 'none', borderBottom: '2px solid var(--white)', backgroundColor: 'transparent', color: 'var(--white)', fontSize: '20px', outline: 'none', letterSpacing: '5px' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', marginTop: '30px' }}>
                <button onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', color: 'var(--yellow)', cursor: 'pointer', fontWeight: 'bold' }}>CANCELAR</button>
                <button onClick={confirmarSms} style={{ backgroundColor: 'var(--yellow)', color: 'var(--carbon-black)', border: 'none', padding: '10px 25px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}>ACEPTAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}