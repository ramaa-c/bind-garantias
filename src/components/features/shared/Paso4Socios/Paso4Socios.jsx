import React, { useState } from "react";
import {
  FiUserPlus,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
  FiTrash2,
} from "react-icons/fi";
import {
  Button,
  Badge,
} from "../../../ui";
import { SocioTaskCard } from "../SocioTaskCard/SocioTaskCard";
import { SocioAccionistaModal } from "../DocumentosLegajo/components/SocioAccionistaModal/SocioAccionistaModal";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import styles from "./Paso4Socios.module.css";

const isAccionistaCompleto = (socio, archivosBackend = []) => {
  if (!socio) return false;
  const sEmail = socio.email || socio.mail || socio.Mail || "";
  const sCel = socio.celular || socio.telefono || socio.Telefono || "";
  const sDir = socio.direccion || socio.calle || "";
  const sProv = socio.provincia || socio.provinciaid || "";
  const sLoc = socio.localidad || "";

  if (!sEmail || !sCel || !sDir || !sProv || !sLoc) return false;

  const cuitLimpio = String(socio.cuit || "").replace(/\D/g, "");
  if (!cuitLimpio) return false;

  const normalizarTexto = (str) =>
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase();

  const nombreNorm = normalizarTexto(socio.nombre);

  const tieneDniFrente = archivosBackend.some((a) => {
    if (a.tipodocumentoarchivoid !== 8) return false;
    const descNorm = normalizarTexto(a.descripcion);
    return descNorm.includes(cuitLimpio) || (nombreNorm && descNorm.includes(nombreNorm));
  });

  const tieneDniDorso = archivosBackend.some((a) => {
    if (a.tipodocumentoarchivoid !== 9) return false;
    const descNorm = normalizarTexto(a.descripcion);
    return descNorm.includes(cuitLimpio) || (nombreNorm && descNorm.includes(nombreNorm));
  });

  return !!(tieneDniFrente && tieneDniDorso);
};

export default function Paso4Socios({
  socios = [],
  eliminarSocio,
  continuarAlProximoPaso,
  socioIdActivo,
  archivosBackend = [],
  cargarSociosDesdeDB,
  isLoading,
}) {
  const [modalAccionistaOpen, setModalAccionistaOpen] = useState(false);
  const [editAccionista, setEditAccionista] = useState(null);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState(null);
  const [intentoAvanzar, setIntentoAvanzar] = useState(false);
  const [eliminandoSocio, setEliminandoSocio] = useState(false);

  const totalGuardado = Number(
    socios.reduce(
      (acc, s) => acc + Number(s.participacion || 0),
      0
    ).toFixed(2)
  );

  const todosCompletos = socios.length > 0 && socios.every((s) => isAccionistaCompleto(s, archivosBackend));

  const handleEditSocio = (index) => {
    setEditAccionista(socios[index]);
    setModalAccionistaOpen(true);
  };

  const handleOpenAddSocio = () => {
    setEditAccionista(null);
    setModalAccionistaOpen(true);
  };

  const handleConfirmEliminar = async () => {
    if (deleteTargetIndex === null) return;
    setEliminandoSocio(true);
    try {
      await eliminarSocio(deleteTargetIndex);
      if (cargarSociosDesdeDB) {
        await cargarSociosDesdeDB(true);
      }
    } finally {
      setEliminandoSocio(false);
      setDeleteTargetIndex(null);
    }
  };

  const handleContinuarClick = () => {
    setIntentoAvanzar(true);
    if (totalGuardado === 100 && todosCompletos) {
      continuarAlProximoPaso();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.listHeader}>
          <div className={styles.statsGroup}>
            <Badge>
              {socios.length} socio{socios.length > 1 ? "s" : ""}
            </Badge>
            <span
              className={`${styles.totalText} ${totalGuardado === 100 ? styles.totalTextSuccess : ""
                }`}
            >
              Total: {totalGuardado}% / 100%
            </span>
          </div>

          <div className={styles.warningsContainer}>
            {totalGuardado !== 100 && (
              <span className={styles.warningText} style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#ff9800" }}>
                <FiAlertCircle size={14} />
                {totalGuardado < 100
                  ? `La sumatoria debe ser exactamente 100% para continuar (actual: ${totalGuardado}%)`
                  : `La sumatoria de las participaciones excede el 100% (actual: ${totalGuardado}%)`}
              </span>
            )}
            {!todosCompletos && socios.length > 0 && (
              <span className={styles.warningText} style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#ff9800" }}>
                <FiAlertCircle size={14} />
                Completá los datos de contacto y cargá el DNI de todos los socios para continuar.
              </span>
            )}
          </div>
        </div>

        {socios.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem 1.5rem",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px dashed rgba(255, 255, 255, 0.1)",
              borderRadius: "0.75rem",
              textAlign: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <FiAlertCircle size={32} style={{ color: "rgba(255, 255, 255, 0.3)" }} />
            <p style={{ color: "#fff", fontWeight: 600, margin: 0, fontSize: "0.9375rem" }}>
              Sin socios registrados
            </p>
            <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "0.78rem" }}>
              Haga click en "Agregar Socio" para dar de alta.
            </span>
          </div>
        ) : (
          <div className={styles.listContainer}>
            {socios.map((socio, index) => {
              const completo = isAccionistaCompleto(socio, archivosBackend);
              return (
                <SocioTaskCard
                  key={socio.cuit || index}
                  socio={socio}
                  index={index}
                  isCompleto={completo}
                  intentoAvanzar={intentoAvanzar}
                  onEdit={handleEditSocio}
                  onDelete={(idx) => setDeleteTargetIndex(idx)}
                />
              );
            })}
          </div>
        )}

        <div className={styles.actionFooterBorder}>
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenAddSocio}
            disabled={totalGuardado >= 100 || isLoading}
            className={styles.secundaryBtn}
          >
            <FiUserPlus className={styles.iconMarginRight} /> AGREGAR SOCIO
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleContinuarClick}
            disabled={totalGuardado !== 100 || !todosCompletos || isLoading}
            className={styles.continueBtn}
          >
            {isLoading ? "VALIDANDO..." : "CONTINUAR"}
          </Button>
        </div>
      </div>

      {/* MODALS */}
      <SocioAccionistaModal
        isOpen={modalAccionistaOpen}
        onClose={() => {
          setModalAccionistaOpen(false);
          setEditAccionista(null);
        }}
        onSuccess={async () => {
          if (cargarSociosDesdeDB) {
            await cargarSociosDesdeDB(true);
          }
        }}
        socio={editAccionista}
        socioIdActivo={socioIdActivo}
        archivosBackend={archivosBackend}
        accionistas={socios}
      />

      <ConfirmacionModal
        isOpen={deleteTargetIndex !== null}
        onClose={() => setDeleteTargetIndex(null)}
        onConfirm={handleConfirmEliminar}
        titulo="Eliminar del legajo"
        mensaje={`¿Está seguro de que desea desvincular a ${deleteTargetIndex !== null ? socios[deleteTargetIndex]?.nombre : ""
          } de la operación?`}
        isLoading={eliminandoSocio}
      />
    </div>
  );
}
