import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBriefcase, FiDollarSign, FiClock, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useObtenerPorId, useObtenerUtilizado, useObtenerLineas } from '../../../hooks/useCadenaValor';
import Spinner from '../../../components/ui/Spinner/Spinner';
import ModalLibradores from '../../../components/features/ModalLibradores/ModalLibradores';
import { ModalHistorialEstado } from '../../../components/features';
import styles from './CadenaDetalle.module.css';
import { Button, BotonVolver } from '../../../components/ui';

export default function CadenaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados de Modales
  const [isLibradoresModalOpen, setIsLibradoresModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [selectedLinea, setSelectedLinea] = useState(null);

  // --- PAGINACIÓN HÍBRIDA (Server-Side por lotes + Local por página) ---
  const [currentPage, setCurrentPage] = useState(1);
  const visualItemsPerPage = 8; // Lo que ve el usuario por clic
  const chunkFactor = 3; // Traemos 3 páginas juntas de Delphi
  const serverItemsPerPage = visualItemsPerPage * chunkFactor; // 24 registros por request

  // Si estoy en la página 1, 2, o 3 visual, es la página 1 del servidor.
  const serverPage = Math.ceil(currentPage / chunkFactor);

  // Consumimos los 3 endpoints de detalle
  const { data: cadena, isLoading: isCadenaLoading } = useObtenerPorId(id);
  const { data: utilizado, isLoading: isUtilizadoLoading } = useObtenerUtilizado(id);
  const { data: lineas, isLoading: isLineasLoading } = useObtenerLineas(id, serverPage, serverItemsPerPage);

  if (isCadenaLoading || isUtilizadoLoading || isLineasLoading) {
    return <Spinner center size={100} />;
  }

  // Fallbacks si la API no devuelve los objetos exactamente como esperamos
  const cadenaData = cadena || {};

  // Si el backend responde paginado, suele venir envuelto en { items: [] } o { data: [] }
  let lineasList = [];
  let totalServerItems = 0;
  if (Array.isArray(lineas)) {
    lineasList = lineas;
    totalServerItems = lineas.length;
  } else if (lineas && Array.isArray(lineas.items)) {
    lineasList = lineas.items;
    totalServerItems = lineas.total || lineas.totalCount || lineas.items.length;
  } else if (lineas && Array.isArray(lineas.data)) {
    lineasList = lineas.data;
    totalServerItems = lineas.total || lineas.totalCount || lineas.data.length;
  }

  // Paginación visual
  // Si Delphi nos envía totalCount o ignoró el límite y mandó los 321 juntos
  const isServerPaginated = totalServerItems !== lineasList.length;
  // Si está paginado en backend, el "total verdadero" se saca de ahí. Si mando 321 de prepo, el len es 321.
  const absoluteTotalItems = isServerPaginated ? totalServerItems : lineasList.length;
  const totalPages = Math.ceil(absoluteTotalItems / visualItemsPerPage);

  // Slicing local:
  // Si Delphi devolvió 321, paginamos sobre el array entero: .slice((currentPage-1)*8, currentPage*8)
  // Si Delphi devolvió 24 (paginado), paginamos sobre el array pequeño relativo a la page del server
  const relativeVisualPage = isServerPaginated ? (currentPage - 1) % chunkFactor : (currentPage - 1);

  const currentLines = lineasList.slice(
    relativeVisualPage * visualItemsPerPage,
    (relativeVisualPage + 1) * visualItemsPerPage
  );

  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleVerHistorial = (linea) => {
    setSelectedLinea(linea);
    setIsHistorialModalOpen(true);
  };

  // Utilizado y Monto Máximo
  // Intentamos todas las variaciones posibles de mayúsculas que suele devolver Delphi
  const parseMonto = (obj) => {
    if (!obj) return 0;
    const key = Object.keys(obj).find(k => k.toLowerCase() === 'montomaximocv' || k.toLowerCase() === 'montomaximo' || k.toLowerCase() === 'tope' || k.toLowerCase() === 'monto_maximo');
    return parseFloat(obj[key] || 0);
  };

  const montoMaximo = utilizado?.montomaximocv || parseMonto(cadenaData) || 0;
  const montoUtilizado = utilizado?.utilizado !== undefined ? utilizado.utilizado : 0;
  const saldoDisponible = utilizado?.disponible !== undefined ? utilizado.disponible : Math.max(0, montoMaximo - montoUtilizado);

  const formatMonto = (num) => {
    const val = parseFloat(num);
    if (isNaN(val)) return '-';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div style={{ alignSelf: 'flex-start' }}>
          <BotonVolver onClick={() => navigate(-1)} texto="Volver" />
        </div>
        <div className={styles.headerTitles}>
          <div className={styles.titleBadgeWrapper}>
            <h1 className={styles.title}>{cadenaData.denominacion || 'Detalle de Cadena'}</h1>
            <span className={`${styles.badge} ${cadenaData.estado?.toLowerCase() === 'aprobada' ? styles.badgeSuccess : styles.badgeWarning}`}>
              {cadenaData.estado || 'Desconocido'}
            </span>
          </div>
          <p className={styles.subtitle}>
            {cadenaData.descripcion || 'Sin descripción'}
            <span className={styles.separator}>|</span>
            CUIT: {cadenaData.cuittercero || 'No disponible'}
          </p>
        </div>
      </header>

      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><FiDollarSign /></div>
          <div>
            <p className={styles.kpiLabel}>Monto Máximo Aprobado</p>
            <h2 className={styles.kpiValue}>{formatMonto(montoMaximo)}</h2>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiHighlight}`}>
          <div className={styles.kpiIconWrapper}><FiCheckCircle /></div>
          <div>
            <p className={styles.kpiLabel}>Saldo Disponible Recomendado</p>
            <h2 className={styles.kpiValueHighlight}>{formatMonto(saldoDisponible)}</h2>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><FiClock /></div>
          <div>
            <p className={styles.kpiLabel}>Vigencia</p>
            <h2 className={styles.kpiValueDate}>
              Hasta {cadenaData.vigenciahasta ? new Date(cadenaData.vigenciahasta).toLocaleDateString() : 'N/A'}
            </h2>
          </div>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.mainBlock}>
          <div className={styles.sectionHeader}>
            <h3>Líneas de Financiamiento Asociadas</h3>
            <span className={styles.badgeCount}>{lineasList.length} encontradas</span>
          </div>

          <div className={styles.listContainer}>
            {currentLines.length === 0 ? (
              <p className={styles.emptyMsg}>No hay líneas específicas devueltas para esta cadena aún.</p>
            ) : (
              currentLines.map((l, index) => {
                const globalIndex = ((currentPage - 1) * visualItemsPerPage) + index + 1;
                // Intento de adivinar las llaves si no tiene dominacion ni descripcion:
                const fallbackSub = Object.keys(l).filter(k => typeof l[k] === 'string' && l[k].length < 30).slice(0, 3).map(k => `${k}: ${l[k]}`).join(' | ');

                return (
                  <div
                    key={index}
                    className={`${styles.listItem} ${styles.interactiveListItem}`}
                    onClick={() => handleVerHistorial(l)}
                  >
                    <div className={styles.listIcon}><FiBriefcase /></div>
                    <div className={styles.listContent}>
                      <h4>{l.tipolimite || l.denominacion || l.nombre || `Línea #${globalIndex}`}</h4>
                      <p>
                        {l.vigenciadesde && l.vigenciahasta
                          ? `Vigencia: ${new Date(l.vigenciadesde).toLocaleDateString()} - ${new Date(l.vigenciahasta).toLocaleDateString()}`
                          : (l.descripcion || fallbackSub || 'Línea de crédito habilitada')}
                      </p>
                    </div>
                    <div className={styles.listAction}>
                      <span className={styles.montoLabel}>Límite</span>
                      <strong className={styles.listMonto}>{formatMonto(l.importe || l.montomaximo || l.monto)}</strong>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.paginationPanel}>
              <button onClick={prevPage} disabled={currentPage === 1} className={styles.pageBtn}>
                <FiChevronLeft />
              </button>
              <span className={styles.pageInfo}>
                Página <strong>{currentPage}</strong> de {totalPages}
              </span>
              <button onClick={nextPage} disabled={currentPage === totalPages} className={styles.pageBtn}>
                <FiChevronRight />
              </button>
            </div>
          )}
        </section>

        <aside className={styles.sideBlock}>
          <div className={styles.cardInfo}>
            <h3>Estado Operativo</h3>
            <ul className={styles.infoList}>
              <li>
                <span>Moneda Base:</span>
                <strong>{cadenaData.moneda || 'Pesos Argentinos'}</strong>
              </li>
              <li>
                <span>Utilizado a la fecha:</span>
                <strong>{formatMonto(montoUtilizado)}</strong>
              </li>
              <li>
                <span>ID Cadena:</span>
                <strong>#{cadenaData.cadenavalorid || id}</strong>
              </li>
            </ul>
            <div className={styles.actionContainer}>
              <Button variant="primary" size="md" onClick={() => setIsLibradoresModalOpen(true)}>
                Ver Libradores
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <ModalLibradores
        isOpen={isLibradoresModalOpen}
        onClose={() => setIsLibradoresModalOpen(false)}
        cadenaValorId={id}
      />

      <ModalHistorialEstado
        isOpen={isHistorialModalOpen}
        onClose={() => setIsHistorialModalOpen(false)}
        lineaId={selectedLinea?.tipolimitesocioid || selectedLinea?.id}
        lineaNombre={selectedLinea?.tipolimite || selectedLinea?.denominacion}
      />

    </div>
  );
}
