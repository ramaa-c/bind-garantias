import React, { useState } from 'react';
import { FiX, FiSearch, FiChevronLeft, FiChevronRight, FiUser, FiCheckCircle } from 'react-icons/fi';
import { useObtenerLibradores, useObtenerLibradorPorCuit } from '../../../hooks/useCadenaValor';
import Spinner from '../../ui/Spinner/Spinner';
import { Button } from '../../ui';
import styles from './ModalLibradores.module.css';

export default function ModalLibradores({ isOpen, onClose, cadenaValorId }) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(''); // Se actualiza al darle click a buscar

  // Forzamos que el ID sea numérico por si useParams lo trae como string
  const numericId = Number(cadenaValorId);

  // Consumimos el endpoint general paginado (se pausa si hay una búsqueda exacta)
  const { 
    data: dataLibradores, 
    isLoading: isLibradoresLoading,
    isError: isListError,
    error: listError
  } = useObtenerLibradores(
    numericId, 
    page, 
    8
  );

  // Consumimos la búsqueda por CUIT (solo se activa si searchTrigger tiene valor)
  const { 
    data: cuitMatch, 
    isLoading: isCuitLoading,
    isError: isCuitError,
    error: cuitError
  } = useObtenerLibradorPorCuit(
    numericId,
    searchTrigger
  );

  if (!isOpen) return null;

  const handleSearch = () => {
    const rawCuit = searchInput.trim().replace(/-/g, ''); // Limpiamos guiones por si las dudas
    setSearchTrigger(rawCuit);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchTrigger('');
    setPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // Logica para determinar qué lista iterar
  let libradoresList = [];
  let totalServerItems = 0;
  
  const activeError = searchTrigger ? (isCuitError ? cuitError : null) : (isListError ? listError : null);
  const isLoading = searchTrigger ? isCuitLoading : isLibradoresLoading;

  // Si la búsqueda devuelve un string (ej: "Librador Autorizado") en lugar de un objeto
  const isCuitMessageOnly = searchTrigger && typeof cuitMatch === 'string';

  if (!isLoading && !activeError) {
    if (isCuitMessageOnly) {
       // No hay lista, hay mensaje
       libradoresList = [];
    } else {
       const sourceData = searchTrigger ? (cuitMatch ? [cuitMatch] : []) : dataLibradores;
       
       if (Array.isArray(sourceData)) {
         libradoresList = sourceData;
         totalServerItems = sourceData.length;
       } else if (sourceData?.items && Array.isArray(sourceData.items)) {
         libradoresList = sourceData.items;
         totalServerItems = sourceData.total || sourceData.totalCount || sourceData.items.length;
       } else if (sourceData?.data && Array.isArray(sourceData.data)) {
         libradoresList = sourceData.data;
         totalServerItems = sourceData.total || sourceData.totalCount || sourceData.data.length;
       } else if (sourceData && typeof sourceData === 'object' && Object.keys(sourceData).length > 0) {
         libradoresList = [sourceData];
         totalServerItems = 1;
       }
    }
  }

  // Si busca por CUIT, es solo 1 pág. Si no, iteramos la de backend
  const absoluteTotal = searchTrigger ? libradoresList.length : (totalServerItems || libradoresList.length);
  const totalPages = searchTrigger ? 1 : Math.ceil(absoluteTotal / 8);

  const handleOverlayClick = (e) => {
    // Solo cerramos si el click fue directamente en el fondo (overlay)
    // y no un arrastre que empezó adentro y terminó afuera.
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.modalHeader}>
          <h2>Libradores Autorizados</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className={styles.searchBar}>
          <div className={styles.inputWrapper}>
            <input 
              type="text" 
              placeholder="Buscar por CUIT exacto..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchInput && (
              <button className={styles.clearIcon} onClick={clearSearch}>
                 <FiX size={14}/>
              </button>
            )}
            <FiSearch className={styles.glassIcon}/>
          </div>
          <Button variant="primary" size="sm" onClick={handleSearch} disabled={!searchInput.trim()}>
            Buscar
          </Button>
        </div>

        <div className={styles.listContainer}>
          {isLoading ? (
            <div className={styles.loadingWrapper}>
               <Spinner center={false} size={60} />
            </div>
          ) : activeError ? (
            <div className={styles.errorState}>
               <p>No se pudo validar el CUIT</p>
               <span>Este CUIT no parece estar habilitado o hubo una intermitencia con el servidor.</span>
               <Button variant="outline" size="sm" onClick={clearSearch} style={{marginTop: '1rem'}}>
                  Intentar otra búsqueda
               </Button>
            </div>
          ) : isCuitMessageOnly ? (
            <div className={styles.successState}>
               <FiCheckCircle size={40} />
               <p>{cuitMatch}</p>
               <span>Este CUIT está habilitado para operar en esta Cadena de Valor.</span>
               <Button variant="outline" size="sm" onClick={clearSearch} style={{marginTop: '1rem'}}>
                  Volver al listado
               </Button>
            </div>
          ) : libradoresList.length === 0 ? (
            <div className={styles.emptyState}>
               No se encontraron libradores vinculados con este criterio.
            </div>
          ) : (
            <div className={styles.gridList}>
              {libradoresList.map((lib, i) => (
                <div key={i} className={styles.libradorCard}>
                   <div className={styles.libradorAvatar}>
                      <FiUser />
                   </div>
                   <div className={styles.libradorInfo}>
                      <h4>{lib.razonsocial || lib.nombre || lib.denominacion || "Empresa Vinculada"}</h4>
                      <p>CUIT: {lib.cuit || lib.cuitlibrador || lib.documento || "Desconocido"}</p>
                   </div>
                   <div className={styles.libradorStatus}>
                      <span className={`${styles.statusBadge} ${lib.estado === 'Activo' ? styles.statusActivo : ''}`}>
                         {lib.estado || 'Activo'}
                      </span>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {!isLoading && totalPages > 1 && (
          <div className={styles.paginationFooter}>
            <button 
              className={styles.pageBtn} 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <FiChevronLeft />
            </button>
            <span className={styles.pageText}>
              Página <strong>{page}</strong> de {totalPages || 1}
            </span>
            <button 
              className={styles.pageBtn} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <FiChevronRight />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
