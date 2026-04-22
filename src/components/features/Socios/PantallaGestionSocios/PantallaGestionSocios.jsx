import React, { useState, useEffect } from "react";
import { FiPlus, FiUsers } from "react-icons/fi";
import { useDebounce } from "use-debounce";
import { Button, BuscadorListado, Paginacion, Modal } from "../../../ui";
import { TablaSocios, FormularioSocios } from "../../../features";
import { useSocios } from "../../../../hooks/useSocios";
import styles from "./PantallaGestionSocios.module.css";

export const PantallaGestionSocios = () => {
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  // Aplicamos debounce de 400ms al término para no saturar al servidor mientras se escribe
  const [debouncedBusqueda] = useDebounce(terminoBusqueda, 400);

  const esBusquedaNumerica = /^\d+$/.test(debouncedBusqueda);
  const [paginaActual, setPaginaActual] = useState(1);
  const [knownEndPage, setKnownEndPage] = useState(null);
  const elementosPorPagina = 10;

  const [modalAbierto, setModalAbierto] = useState(false);
  const [socioAEditar, setSocioAEditar] = useState(null);

  const filtros = {
    page: paginaActual,
    page_size: elementosPorPagina,
    Denominacion:
      debouncedBusqueda && !esBusquedaNumerica ? debouncedBusqueda : undefined,
    Cuit: debouncedBusqueda && esBusquedaNumerica ? debouncedBusqueda : undefined,
  };

  const { data: sociosBackend, isLoading } = useSocios(filtros);

  const rawSocios =
    sociosBackend?.items ||
    sociosBackend?.data ||
    sociosBackend?.resultados ||
    sociosBackend;
  const sociosPaginados = Array.isArray(rawSocios) ? rawSocios : [];

  const hasMoreData = sociosPaginados.length === elementosPorPagina;

  useEffect(() => {
    if (!isLoading) {
      if (
        sociosPaginados.length > 0 &&
        sociosPaginados.length < elementosPorPagina
      ) {
        setKnownEndPage(paginaActual);
      } else if (sociosPaginados.length === 0 && paginaActual > 1) {
        setKnownEndPage(paginaActual - 1);
      }
    }
  }, [isLoading, sociosPaginados.length, paginaActual, elementosPorPagina]);

  useEffect(() => {
    setKnownEndPage(null);
  }, [terminoBusqueda]);

  const abrirModalNuevo = () => {
    setSocioAEditar(null);
    setModalAbierto(true);
  };

  const abrirModalEdicion = (socio) => {
    setSocioAEditar(socio);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSocioAEditar(null);
  };

  const handleGuardadoExitoso = () => {
    cerrarModal();
  };

  return (
    <div className={styles.container}>
      {/* HEADER DE LA PANTALLA */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconContainer}>
            <FiUsers />
          </div>
          <div>
            <h1 className={styles.title}>Directorio de Socios</h1>
            <p className={styles.subtitle}>
              Gestioná las entidades y empresas vinculadas a la cartera.
            </p>
          </div>
        </div>

        <Button variant="primary" onClick={abrirModalNuevo}>
          <FiPlus style={{ marginRight: "0.5rem" }} /> NUEVO SOCIO
        </Button>
      </header>

      {/* BARRA DE HERRAMIENTAS (BUSCADOR) */}
      <div className={styles.toolbar}>
        <BuscadorListado
          valor={terminoBusqueda}
          onChangeText={(texto) => {
            setTerminoBusqueda(texto);
            setPaginaActual(1);
          }}
          onLimpiar={() => {
            setTerminoBusqueda("");
            setPaginaActual(1);
          }}
        />
      </div>

      {/* GRILLA DE DATOS */}
      <TablaSocios
        socios={sociosPaginados}
        isLoading={isLoading}
        onEditarSocio={abrirModalEdicion}
      />

      {/* PAGINADOR */}
      {(sociosPaginados.length > 0 || paginaActual > 1) && (
        <Paginacion
          page={paginaActual}
          onPageChange={setPaginaActual}
          hasMoreData={hasMoreData}
          isLoading={isLoading}
          knownEndPage={knownEndPage}
        />
      )}

      {/* MODAL DE ALTA / EDICIÓN */}
      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        titulo={
          socioAEditar
            ? `Editando Socio #${socioAEditar.socioid}`
            : "Alta de Socio"
        }
        ancho="800px"
      >
        {modalAbierto && (
          <FormularioSocios
            socioExistente={socioAEditar}
            onGuardado={handleGuardadoExitoso}
            onCancelar={cerrarModal}
          />
        )}
      </Modal>
    </div>
  );
};
