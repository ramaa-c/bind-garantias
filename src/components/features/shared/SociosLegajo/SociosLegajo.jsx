import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useRequisitos } from "../../../../hooks/useRequisitos";
import { useObtenerDatosSocioLegajo } from "../../../../hooks/useTerceros";
import {
  FiExternalLink,
  FiUsers,
  FiUser,
  FiPercent,
  FiBriefcase,
  FiChevronDown,
} from "react-icons/fi";
import { toast } from "sonner";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { tercerosService } from "../../../../services/tercerosService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import styles from "./SociosLegajo.module.css";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import { AccionistasSection } from "../DocumentosLegajo/components/AccionistasSection/AccionistasSection";
import { RepresentantesSection } from "../DocumentosLegajo/components/RepresentantesSection/RepresentantesSection";
import { AgentesBolsaSection } from "../DocumentosLegajo/components/AgentesBolsaSection/AgentesBolsaSection";
import { VincularUsuarioSection } from "../DocumentosLegajo/components/VincularUsuarioSection/VincularUsuarioSection";

const ESTRUCTURA_SOCIOS = [
  {
    category: "Legajo",
    key: "accionistas",
    title: "Composición accionaria",
    info: "Administración del cuadro accionario y participaciones de socios.",
  },
  {
    category: "Legajo",
    key: "representantes",
    title: "Representantes legales",
    info: "Administración de representantes legales y apoderados habilitados.",
  },
  {
    category: "Legajo",
    key: "agentesBolsa",
    title: "Agentes de bolsa",
    info: "Vinculación y administración de agentes de bolsa y cuentas comitentes.",
  },
  {
    category: "Legajo",
    key: "usuarios",
    title: "Vincular usuarios",
    info: "Otorgá acceso a otros usuarios para operar con esta empresa.",
  },
];

export function SociosLegajo() {
  const { socioIdActivo, tipoPersonaId, nombreEmpresa } = useEmpresaActiva();

  const { cadenaSlug } = useParams();
  const cadenaId = Number(cadenaSlug) || 1;
  const { requisitos } = useRequisitos(cadenaId, tipoPersonaId, nombreEmpresa);

  const tabsDisponibles = useMemo(() => {
    let baseTabs = ESTRUCTURA_SOCIOS;
    if (tipoPersonaId === 1) {
      baseTabs = ESTRUCTURA_SOCIOS.filter(t => t.key !== "accionistas");
    }
    // Filtrar según los requisitos configurados
    return baseTabs.filter(t => {
      const configVal = requisitos?.relaciones?.[t.key];
      return configVal !== 0; // 0 = no mostrar
    });
  }, [tipoPersonaId, requisitos]);

  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    if (tabsDisponibles.length > 0 && (!activeTab || !tabsDisponibles.some(t => t.key === activeTab))) {
      setActiveTab(tabsDisponibles[0].key);
    }
  }, [tabsDisponibles, activeTab]);

  const queryClient = useQueryClient();
  const { data: socioLegajoData, isLoading: loadingQuery } = useObtenerDatosSocioLegajo(socioIdActivo);

  const accionistas = socioLegajoData?.accionistas || [];
  const representantes = socioLegajoData?.representantes || [];
  const agentesBolsa = socioLegajoData?.agentesBolsa || [];
  const loadingSocios = loadingQuery;

  const [archivosBackend, setArchivosBackend] = useState([]);
  const [dniTerceros, setDniTerceros] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const cargarSocios = () => {
    queryClient.invalidateQueries({ queryKey: ["socioLegajoCompleto", socioIdActivo] });
    queryClient.invalidateQueries({ queryKey: ["socioArchivos", socioIdActivo] });
    cargarArchivosExistentes();
  };

  const cargarArchivosExistentes = async () => {
    if (!socioIdActivo) return;
    try {
      const archivos = await socioArchivoService.obtenerArchivos(socioIdActivo);
      if (Array.isArray(archivos)) {
        setArchivosBackend(archivos);
      }
    } catch (err) {
      console.error("Error cargando archivos del legajo:", err);
    }
  };

  useEffect(() => {
    cargarArchivosExistentes();
  }, [socioIdActivo]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && !activeTab && tabsDisponibles.length > 0) {
        setActiveTab(tabsDisponibles[0]?.key);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTab, tabsDisponibles]);

  const totalParticipacion = useMemo(() => {
    const sum = accionistas.reduce((a, s) => a + Number(s.participacion || 0), 0);
    return Number(sum.toFixed(2));
  }, [accionistas]);

  const handleEliminarRelacion = (item) => {
    setDeleteTarget(item);
  };

  const handleConfirmEliminar = async () => {
    if (!deleteTarget) return;
    setLoadingDelete(true);
    const item = deleteTarget;
    const isBolsa = item.rolId === 21;

    try {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      const ayerStr = ayer.toISOString().split(".")[0];

      const payload = {
        ...item.relacion,
        fechahasta: ayerStr,
        FechaHasta: ayerStr,
      };
      await tercerosService.actualizarRelacionDeSocio(payload);
      toast.success(
        isBolsa
          ? "Agente de bolsa desvinculado exitosamente."
          : "Registro eliminado exitosamente del legajo.",
      );
      cargarSocios();
      setDeleteTarget(null);
    } catch (err) {
      console.error("[LEGAJO] Error al eliminar relación:", err);
      toast.error("Ocurrió un error al procesar la desvinculación.");
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className={styles.workspace}>
      <div className={styles.sidebarBg} />
      {tabsDisponibles.map((doc, index) => {
        const isNewCategory =
          index === 0 ||
          doc.category !== tabsDisponibles[index - 1].category;
        const isActive = activeTab === doc.key;

        const isAccionistas = doc.key === "accionistas";
        const isRepresentantes = doc.key === "representantes";
        const isAgentesBolsa = doc.key === "agentesBolsa";
        const isUsuarios = doc.key === "usuarios";

        return (
          <React.Fragment key={doc.key}>
            {isNewCategory && (
              <p className={styles.categoryLabel}>{doc.category}</p>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  setActiveTab((prev) => (prev === doc.key ? null : doc.key));
                } else {
                  setActiveTab(doc.key);
                }
              }}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
            >
              {isActive && <span className={styles.activeBar} />}
              <div className={styles.tabTitleGroup}>
                <span className={styles.tabTitle}>{doc.title}</span>
                {requisitos?.relaciones?.[doc.key] === 1 ? (
                  <span className={`${styles.reqBadge} ${styles.reqBadgeMandatory}`}>Obligatorio</span>
                ) : (
                  <span className={`${styles.reqBadge} ${styles.reqBadgeOptional}`}>Opcional</span>
                )}
              </div>
              <FiChevronDown
                className={styles.mobileChevron}
                style={{
                  transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                  color: isActive ? "#fff" : "#aaa",
                  fontSize: "1.1rem"
                }}
              />
            </button>

            {isActive && (
              <section className={styles.viewer}>
                <header className={styles.viewerHeader}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: "1 1 200px" }}>
                      <div className={styles.viewerMeta}>
                        <span className={styles.viewerBadge}>{doc.category}</span>
                      </div>
                      <h4 className={styles.viewerTitle}>{doc.title}</h4>
                      <p className={styles.viewerInfo}>
                        {doc.info}
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.helperLink}
                          >
                            {doc.linkText} <FiExternalLink size={11} />
                          </a>
                        )}
                      </p>
                    </div>
                    <div id="socios-header-action-portal" className={styles.headerActionPortal} />
                  </div>
                </header>

                {isUsuarios ? (
                  <VincularUsuarioSection socioIdActivo={socioIdActivo} />
                ) : isAccionistas ? (
                  <AccionistasSection
                    loadingSocios={loadingSocios}
                    totalParticipacion={totalParticipacion}
                    accionistas={accionistas}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                    archivosBackend={archivosBackend}
                    dniTerceros={dniTerceros}
                  />
                ) : isRepresentantes ? (
                  <RepresentantesSection
                    loadingSocios={loadingSocios}
                    representantes={representantes}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                  />
                ) : isAgentesBolsa ? (
                  <AgentesBolsaSection
                    loadingSocios={loadingSocios}
                    agentesBolsa={agentesBolsa}
                    handleEliminarRelacion={handleEliminarRelacion}
                    cargarSocios={cargarSocios}
                    socioIdActivo={socioIdActivo}
                  />
                ) : null}
              </section>
            )}
          </React.Fragment>
        );
      })}
      <ConfirmacionModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmEliminar}
        titulo={
          deleteTarget?.rolId === 21
            ? "Desvincular Agente"
            : "Eliminar del legajo"
        }
        mensaje={
          deleteTarget?.rolId === 21
            ? `¿Está seguro de que desea desvincular al Agente de Bolsa ${deleteTarget?.nombre}?`
            : `¿Está seguro de que desea eliminar a ${deleteTarget?.nombre} del legajo?`
        }
        isLoading={loadingDelete}
      />
    </div>
  );
}
