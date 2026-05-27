import React, { useState, useEffect, useMemo } from "react";
import {
  FiExternalLink,
  FiUsers,
  FiUser,
  FiPercent,
  FiBriefcase,
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
    category: "Socios",
    key: "accionistas",
    title: "Composición accionaria",
    info: "Administración del cuadro accionario y participaciones de socios.",
  },
  {
    category: "Socios",
    key: "representantes",
    title: "Representantes legales",
    info: "Administración de representantes legales y apoderados habilitados.",
  },
  {
    category: "Socios",
    key: "agentesBolsa",
    title: "Agentes de bolsa",
    info: "Vinculación y administración de agentes de bolsa y cuentas comitentes.",
  },
  {
    category: "Socios",
    key: "usuarios",
    title: "Vincular usuarios",
    info: "Otorgá acceso a otros usuarios para operar con esta empresa.",
  },
];

export function SociosLegajo() {
  const [activeTab, setActiveTab] = useState(ESTRUCTURA_SOCIOS[0].key);
  const { socioIdActivo } = useEmpresaActiva();

  const [accionistas, setAccionistas] = useState([]);
  const [representantes, setRepresentantes] = useState([]);
  const [agentesBolsa, setAgentesBolsa] = useState([]);
  const [loadingSocios, setLoadingSocios] = useState(true);
  const [archivosBackend, setArchivosBackend] = useState([]);
  const [dniTerceros, setDniTerceros] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const cargarSocios = async () => {
    if (!socioIdActivo) return;
    setLoadingSocios(true);
    try {
      const relaciones =
        await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
      const arr = Array.isArray(relaciones) ? relaciones : [];

      const accMap = {};
      const repMap = {};
      const bolsaMap = {};

      const now = new Date();

      for (const rel of arr) {
        const fd = rel.fechadesde || rel.FechaDesde;
        const fh = rel.fechahasta || rel.FechaHasta;
        if (fh && fh !== "") {
          const expirationDate = new Date(fh);
          const startDate = fd ? new Date(fd) : null;

          const isSameAsStart =
            startDate &&
            (expirationDate.getTime() === startDate.getTime() ||
              expirationDate.toISOString().split("T")[0] ===
                startDate.toISOString().split("T")[0]);

          if (!isSameAsStart && expirationDate < now) {
            continue;
          }
        }

        const tid =
          rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID;
        if (!tid) continue;

        try {
          let t = null;
          try {
            t = await tercerosService.obtenerTerceroPorId(tid);
          } catch (apiErr) {
            console.warn(
              `[LEGAJO] No se pudo obtener tercero ${tid} de la API estándar. Intentando SGRPlus...`,
            );
            try {
              t = await tercerosService.obtenerTerceroPorIdSGRPlus(tid);
            } catch (sgrErr) {
              console.error(
                `[LEGAJO] Error total obteniendo tercero ${tid}:`,
                sgrErr,
              );
            }
          }

          if (t) {
            const tiporel =
              rel.tiporelacionsocioid ||
              rel.TipoRelacionSocioID ||
              rel.tiporelacionsocioId;
            const tiporelNum = Number(tiporel);

            const item = {
              id: tid,
              relacionId:
                rel.sociotercerorelacionid || rel.SocioTerceroRelacionID,
              relacion: rel,
              nombre:
                t.denominacion ||
                t.Denominacion ||
                t.razonsocial ||
                t.RazonSocial ||
                t.nombre ||
                t.Nombre ||
                "Sin nombre",
              cuit:
                t.cuit ||
                t.Cuit ||
                t.nrodocumento ||
                t.numerodocumento ||
                t.NumeroDocumento ||
                t.documento ||
                "—",
              email: t.mail || t.Mail || "",
              telefono: t.telefono || t.Telefono || "",
              direccion: t.calle || t.Calle || "",
              localidad: t.contacto || t.Contacto || "",
              codpos: t.codpos || t.Codpos || "",
              participacion: Number(
                rel.porcacciones || rel.participacion || rel.Participacion || 0,
              ),
              rolId: tiporelNum,
              nrosubcuentacaja:
                rel.nrosubcuentacaja || rel.NroSubcuentaCaja || "",
              calle: t.calle || "",
              numero: t.numero || 0,
              piso: t.piso || "",
              departamento: t.departamento || "",
              ciudadid: t.ciudadid || 0,
              provinciaid:
                rel.provinciaid || rel.ProvinciaID || t.provinciaid || 0,
              tipopersonaid: t.tipopersonaid || 1,
            };

            const identifier =
              item.cuit && item.cuit !== "—" ? item.cuit : item.id;

            if (tiporelNum === 25) {
              if (!accMap[identifier]) {
                accMap[identifier] = item;
              }
            } else if (tiporelNum === 210 || tiporelNum === 230) {
              const existing = repMap[identifier];
              if (!existing) {
                repMap[identifier] = item;
              } else {
                if (item.rolId === 230 && existing.rolId !== 230) {
                  repMap[identifier] = item;
                }
              }
            } else if (tiporelNum === 21) {
              const existing = bolsaMap[identifier];
              if (!existing) {
                bolsaMap[identifier] = item;
              } else {
                if (item.nrosubcuentacaja && !existing.nrosubcuentacaja) {
                  bolsaMap[identifier] = item;
                }
              }
            }
          }
        } catch (e) {
          console.warn("Error fetching third party detail:", tid, e);
        }
      }

      setAccionistas(Object.values(accMap));
      setRepresentantes(Object.values(repMap));
      setAgentesBolsa(Object.values(bolsaMap));
    } catch (e) {
      console.error("Error loading relations:", e);
    } finally {
      setLoadingSocios(false);
    }
  };

  useEffect(() => {
    if (!socioIdActivo) {
      setLoadingSocios(false);
      return;
    }
    cargarSocios();
  }, [socioIdActivo]);

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

  const totalParticipacion = useMemo(() => {
    return accionistas.reduce((a, s) => a + Number(s.participacion || 0), 0);
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
      {ESTRUCTURA_SOCIOS.map((doc, index) => {
        const isNewCategory =
          index === 0 ||
          doc.category !== ESTRUCTURA_SOCIOS[index - 1].category;
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
              onClick={() => setActiveTab(doc.key)}
              className={`${styles.tabBtn} ${isActive ? styles.tabActive : ""}`}
            >
              {isActive && <span className={styles.activeBar} />}
              <span className={styles.tabTitle}>{doc.title}</span>
            </button>

            {isActive && (
              <section className={styles.viewer}>
                <header className={styles.viewerHeader}>
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
