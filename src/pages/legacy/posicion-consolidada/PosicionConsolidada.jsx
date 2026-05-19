import React, { useState } from 'react';
import { FiSearch, FiCalendar, FiFilter } from 'react-icons/fi';
import styles from './PosicionConsolidada.module.css';
import { Button } from '../../../components/ui';
import { useObtenerContragarantiaSocio, useObtenerLimiteSocio } from '../../../hooks/usePosicionConsolidada';
import Spinner from '../../../components/ui/Spinner/Spinner';

export default function PosicionConsolidada() {
  const [searchTerm, setSearchTerm] = useState('115458'); // Por defecto para probar
  const [socioId, setSocioId] = useState(115458);

  const { data: contragarantiasData, isLoading: isLoadingContra } = useObtenerContragarantiaSocio(socioId);
  const { data: limitesData, isLoading: isLoadingLimites } = useObtenerLimiteSocio(socioId);

  const handleBuscar = () => {
    if (searchTerm) setSocioId(searchTerm);
  };

  const limites = Array.isArray(limitesData) ? limitesData : (limitesData ? [limitesData] : []);
  const contragarantias = Array.isArray(contragarantiasData) ? contragarantiasData : (contragarantiasData ? [contragarantiasData] : []);

  const productos = [];
  const cuotas = [];
  const certificados = [];

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

          <Button variant="primary" size="md" onClick={handleBuscar} disabled={isLoadingContra || isLoadingLimites}>
            {isLoadingContra || isLoadingLimites ? <Spinner size={20} color="white" /> : "Buscar"}
          </Button>
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
              <strong>-</strong>
            </div>
            <div className={styles.row}>
              <span>Vto Certificado PYME</span>
              <strong>-</strong>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.row}>
              <span>CPDS TERCEROS</span>
              <strong>-</strong>
            </div>
            <div className={styles.row}>
              <span>CPDS PROPIOS</span>
              <strong>-</strong>
            </div>
            <div className={styles.row}>
              <span>Pagarés Propios</span>
              <strong>-</strong>
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
                {isLoadingContra ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "center" }}><Spinner size={32} /></div>
                    </td>
                  </tr>
                ) : contragarantias.length > 0 ? (
                  contragarantias.map((c, i) => (
                    <tr key={i}>
                      <td>{c.descripcion}</td>
                      <td className={styles.textRight}>{c.fechavencimiento ? new Date(c.fechavencimiento).toLocaleDateString() : ''}</td>
                      <td className={styles.textRight}>{formatMonto(c.importe)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", padding: "1rem" }}>No se encontraron contragarantías</td>
                  </tr>
                )}
                <tr className={styles.spacerRow}><td colSpan="3"></td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td>
                  <td></td>
                  <td className={styles.textRight}>
                    {formatMonto(
                      contragarantias.reduce((acc, curr) => acc + (curr.importe || 0), 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* CALIFICACIÓN (Límites) */}
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
                {isLoadingLimites ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "center" }}><Spinner size={32} /></div>
                    </td>
                  </tr>
                ) : limites.length > 0 ? (
                  limites.map((c, i) => (
                    <tr key={i}>
                      <td>{c.descripcion}</td>
                      <td>{c.estadodescripcion}</td>
                      <td className={styles.textRight}>{c.fechavigenciahasta ? new Date(c.fechavigenciahasta).toLocaleDateString() : ''}</td>
                      <td className={styles.textRight}>{formatMonto(c.importelimite)}</td>
                      <td className={styles.textRight}>{formatMonto(c.importeutilizado)}</td>
                      <td className={styles.textRight}>{formatMonto(c.importedisponible)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>No se encontraron calificaciones</td>
                  </tr>
                )}
                <tr className={styles.spacerRow}><td colSpan="6"></td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3">Riesgo Total</td>
                  <td className={styles.textRight}>
                    {formatMonto(
                      limites.reduce((acc, curr) => acc + (curr.importelimite || 0), 0)
                    )}
                  </td>
                  <td className={styles.textRight}>
                    {formatMonto(
                      limites.reduce((acc, curr) => acc + (curr.importeutilizado || 0), 0)
                    )}
                  </td>
                  <td className={styles.textRight}>
                    {formatMonto(
                      limites.reduce((acc, curr) => acc + (curr.importedisponible || 0), 0)
                    )}
                  </td>
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
                {productos.length > 0 ? productos.map((p, i) => (
                  <tr key={i}>
                    <td>{p.tipo}</td>
                    <td>{p.moneda}</td>
                    <td className={styles.textRight}>{formatMonto(p.importe)}</td>
                    <td className={styles.textRight}>{formatMonto(p.importe)}</td>
                    <td className={styles.textRight}>{formatMonto(p.riesgo)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "1rem" }}>No se encontraron productos</td></tr>
                )}
                <tr className={styles.spacerRow}><td colSpan="5"></td></tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2">Total</td>
                  <td className={styles.textRight}></td>
                  <td className={styles.textRight}>{formatMonto(0)}</td>
                  <td className={styles.textRight}>{formatMonto(0)}</td>
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
                {cuotas.length > 0 ? cuotas.map((c, i) => (
                  <tr key={i}>
                    <td>{c.cuota}</td>
                    <td>{c.venc}</td>
                    <td className={styles.textRight}>{formatMonto(c.cap)}</td>
                    <td className={styles.textRight}>{formatMonto(c.int)}</td>
                    <td>{c.estado}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "1rem" }}>No se encontraron cuotas</td></tr>
                )}
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
                {certificados.length > 0 ? certificados.map((c, i) => (
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
                )) : (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "1rem" }}>No se encontraron certificados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
