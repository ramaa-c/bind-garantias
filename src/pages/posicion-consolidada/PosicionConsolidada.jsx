import React, { useState } from 'react';
import { FiSearch, FiCalendar, FiFilter } from 'react-icons/fi';
import styles from './PosicionConsolidada.module.css';
import { Button } from '../../components/ui';

export default function PosicionConsolidada() {
  const [searchTerm, setSearchTerm] = useState('ZAMMITTO SRL');

  // Mocks simplificados para la maquetación
  const calificaciones = [
    { tipo: 'CHEQUES PROP Y 3ROS CON PRESTAMOS', estado: 'Vencida', venc: '31/8/2024', importe: 21000000.00, utilizado: 3416422.17, disponible: 0.00 },
    { tipo: 'RIESGO DE TERCEROS', estado: 'Propuesta A...', venc: '31/12/2031', importe: 20000000.00, utilizado: 10188888.89, disponible: 9811111.11 },
    { tipo: 'RIESGO PROPIOS', estado: 'Propuesta A...', venc: '31/12/2031', importe: 15000000.00, utilizado: 10000000.00, disponible: 5000000.00 },
  ];

  const productos = [
    { tipo: 'CPDS TERCEROS', moneda: 'Pesos Argentinos', importe: 7500000.00, riesgo: 7500000.00 },
    { tipo: 'ECHEQ TERCERO MERCADO', moneda: 'Pesos Argentinos', importe: 2688888.89, riesgo: 2688888.89 },
    { tipo: 'ECHEQ PROPIO MERCADO', moneda: 'Pesos Argentinos', importe: 10000000.00, riesgo: 10000000.00 },
    { tipo: 'PRESTAMOS', moneda: 'Pesos Argentinos', importe: 15000000.00, riesgo: 3416422.17 },
  ];

  const cuotas = [
    { cuota: 1, venc: '5/4/2023', cap: 833333.33, int: 452054.79, estado: 'Cancelada' },
    { cuota: 2, venc: '5/5/2023', cap: 833333.33, int: 414383.56, estado: 'Cancelada' },
    { cuota: 3, venc: '5/6/2023', cap: 833333.33, int: 389269.41, estado: 'Cancelada' },
    { cuota: 4, venc: '5/7/2023', cap: 833333.33, int: 339041.10, estado: 'Cancelada' },
    { cuota: 5, venc: '7/8/2023', cap: 833333.33, int: 331506.85, estado: 'Cancelada' },
  ];

  const certificados = [
    { cert: '2243', sub: '1', entidad: 'BANCO DE GALICIA Y BUENOS AIRES S A', monetizacion: '6/3/2023', venc: '5/3/2024', moneda: 'Pesos Argentinos', importe: 10000000.00, saldo: 0.00 },
    { cert: '2370', sub: '1', entidad: 'BANCO CREDICOOP COOPERATIVO LTDO', monetizacion: '27/4/2023', venc: '29/4/2024', moneda: 'Pesos Argentinos', importe: 5000000.00, saldo: 1194200.01 },
  ];

  const formatMonto = (num) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(num);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitles}>
          <h1 className={styles.title}>Consulta Consolidada de Socio Partícipe</h1>
          <p className={styles.subtitle}>Por favor, seleccione el socio que desea consultar</p>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.searchField}>
            <label>Socio</label>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
              />
              <FiSearch className={styles.inputIcon} />
            </div>
          </div>
          
          <div className={styles.searchField}>
            <label>Datos al</label>
            <div className={styles.inputWrapper}>
              <input type="text" value="21/04/2026" readOnly className={styles.inputShort} />
              <FiCalendar className={styles.inputIcon} />
            </div>
          </div>

          <label className={styles.checkboxLabel}>
            <input type="checkbox" className={styles.checkbox} />
            <span>Visualizar vencidos</span>
          </label>

          <Button variant="primary" size="md">Buscar</Button>
        </div>
      </header>

      <div className={styles.socioInfoBar}>
        <span className={styles.badge}>Socio</span>
        <h2>{searchTerm}</h2>
        <div className={styles.socioMeta}>
          <span>Legajo: <strong className={styles.textHighlight}>6326</strong></span>
          <span className={styles.separator}>|</span>
          <span>CUIT: <strong className={styles.textHighlight}>30549847834</strong></span>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        
        {/* VARIOS */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>Varios</div>
          <div className={styles.cardContent}>
            <div className={styles.row}>
              <span>Productor</span>
              <strong>Genérico</strong>
            </div>
            <div className={styles.row}>
              <span>Vto Certificado PYME</span>
              <strong>31/7/2026</strong>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.row}>
              <span>CPDS TERCEROS</span>
              <strong>100.00</strong>
            </div>
            <div className={styles.row}>
              <span>CPDS PROPIOS</span>
              <strong>100.00</strong>
            </div>
            <div className={styles.row}>
              <span>Pagarés Propios</span>
              <strong>100.00</strong>
            </div>
          </div>
        </div>

        {/* CONTRAGARANTÍAS */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>Contragarantías</div>
          <div className={styles.cardTableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th className={styles.textRight}>Vencimiento</th>
                  <th className={styles.textRight}>Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Fianza personal en $ARG</td>
                  <td className={styles.textRight}>31/12/2029</td>
                  <td className={styles.textRight}>{formatMonto(25000000)}</td>
                </tr>
                <tr className={styles.spacerRow}><td colSpan="3"></td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td></td>
                  <td className={styles.textRight}>{formatMonto(25000000)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* CALIFICACIÓN */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>Calificación</div>
          <div className={styles.cardTableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th className={styles.textRight}>Vencimiento</th>
                  <th className={styles.textRight}>Importe</th>
                  <th className={styles.textRight}>Utilizado</th>
                  <th className={styles.textRight}>Disponible</th>
                </tr>
              </thead>
              <tbody>
                {calificaciones.map((c, i) => (
                  <tr key={i}>
                    <td>{c.tipo}</td>
                    <td>{c.estado}</td>
                    <td className={styles.textRight}>{c.venc}</td>
                    <td className={styles.textRight}>{formatMonto(c.importe)}</td>
                    <td className={styles.textRight}>{formatMonto(c.utilizado)}</td>
                    <td className={styles.textRight}>{formatMonto(c.disponible)}</td>
                  </tr>
                ))}
                <tr className={styles.spacerRow}><td colSpan="6"></td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">Riesgo Total</td>
                  <td className={styles.textRight}>{formatMonto(56000000.00)}</td>
                  <td className={styles.textRight}>{formatMonto(23605311.06)}</td>
                  <td className={styles.textRight}>{formatMonto(14811111.11)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* PRODUCTOS CON LOS QUE OPERA */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>Productos con los que opera</div>
          <div className={styles.cardTableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tipo de Obligación</th>
                  <th>Moneda</th>
                  <th className={styles.textRight}>Importe</th>
                  <th className={styles.textRight}>Importe Pesos</th>
                  <th className={styles.textRight}>Riesgo Vivo</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.tipo}</td>
                    <td>{p.moneda}</td>
                    <td className={styles.textRight}>{formatMonto(p.importe)}</td>
                    <td className={styles.textRight}>{formatMonto(p.importe)}</td>
                    <td className={styles.textRight}>{formatMonto(p.riesgo)}</td>
                  </tr>
                ))}
                <tr className={styles.spacerRow}><td colSpan="5"></td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2">Total</td>
                  <td className={styles.textRight}></td>
                  <td className={styles.textRight}>{formatMonto(35188888.89)}</td>
                  <td className={styles.textRight}>{formatMonto(23605311.06)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* CUOTAS */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>Cuotas</div>
          <div className={styles.cardTableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Cuota</th>
                  <th>Vencimiento</th>
                  <th className={styles.textRight}>Amort. Capital</th>
                  <th className={styles.textRight}>Intereses</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((c, i) => (
                  <tr key={i}>
                    <td>{c.cuota}</td>
                    <td>{c.venc}</td>
                    <td className={styles.textRight}>{formatMonto(c.cap)}</td>
                    <td className={styles.textRight}>{formatMonto(c.int)}</td>
                    <td>{c.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CERTIFICADOS */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>Certificados</div>
          <div className={styles.cardTableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Certificado</th>
                  <th>Sub Nro</th>
                  <th>Entidad</th>
                  <th>Monetización</th>
                  <th>Vencimiento</th>
                  <th>Moneda</th>
                  <th className={styles.textRight}>Importe</th>
                  <th className={styles.textRight}>Saldo Actual</th>
                </tr>
              </thead>
              <tbody>
                {certificados.map((c, i) => (
                  <tr key={i} className={i === 0 ? styles.tableRowActive : ''}>
                    <td>{c.cert}</td>
                    <td>{c.sub}</td>
                    <td className={styles.truncate} title={c.entidad}>{c.entidad}</td>
                    <td>{c.monetizacion}</td>
                    <td>{c.venc}</td>
                    <td>{c.moneda}</td>
                    <td className={styles.textRight}>{formatMonto(c.importe)}</td>
                    <td className={styles.textRight}>{formatMonto(c.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
