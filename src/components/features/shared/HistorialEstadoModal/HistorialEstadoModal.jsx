import React from "react";
import { FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiChevronRight } from "react-icons/fi";
import { useObtenerCambiosEstadoLinea } from "../../../../hooks/useLinea";
import { Modal } from "../../../ui";
import Spinner from "../../../ui/Spinner/Spinner";
import styles from "./HistorialEstadoModal.module.css";

const getStatusIcon = (estado) => {
    const e = String(estado || "").toLowerCase();
    if (e === "1" || e.includes("aprob") || e.includes("activ")) return <FiCheckCircle className={styles.iconSuccess} />;
    if (e === "2" || e.includes("rechaz") || e.includes("cancel")) return <FiXCircle className={styles.iconDanger} />;
    if (e === "0" || e.includes("pend") || e.includes("esper")) return <FiClock className={styles.iconWarning} />;
    return <FiInfo className={styles.iconInfo} />;
};

export const HistorialEstadoModal = ({ isOpen, onClose, lineaId, lineaNombre }) => {
    const { data: historial, isLoading } = useObtenerCambiosEstadoLinea(lineaId);

    const formatFecha = (fechaStr) => {
        if (!fechaStr) return "N/A";
        const date = new Date(fechaStr);
        return date.toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const listaHistorial = Array.isArray(historial) ? historial : [];

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Historial de Estados: ${lineaNombre || "Línea de Crédito"}`}
            maxWidth="600px"
            variant="blue"
        >
            <div className={styles.container}>
                {isLoading ? (
                    <div className={styles.loadingWrapper}>
                        <Spinner size={60} />
                        <p>Consultando historial de auditoría...</p>
                    </div>
                ) : listaHistorial.length === 0 ? (
                    <div className={styles.emptyState}>
                        <FiAlertCircle size={48} />
                        <p>No se encontraron registros de cambios para esta línea.</p>
                        <span>El estado actual es el inicial o el sistema no registró eventos previos.</span>
                    </div>
                ) : (
                    <div className={styles.timeline}>
                        {listaHistorial.map((item, index) => (
                            <div key={index} className={styles.timelineItem}>
                                <div className={styles.timelineIcon}>
                                    {getStatusIcon(item.estadonew || item.estado)}
                                    {index !== listaHistorial.length - 1 && <div className={styles.line}></div>}
                                </div>
                                <div className={styles.timelineContent}>
                                    <div className={styles.timelineHeader}>
                                        <span className={styles.statusName}>
                                            Condición/Estado N° {item.estadonew !== undefined ? item.estadonew : "Desconocido"}
                                        </span>
                                        <span className={styles.date}>{formatFecha(item.momento || item.fecha)}</span>
                                    </div>
                                    <div className={styles.timelineBody}>
                                        <p className={styles.observation}>
                                            {item.comentario || item.observaciones || item.descripcion || "Sin comentarios adicionales."}
                                        </p>
                                        {(item.usuarioid || item.usuario || item.operador) && (
                                            <span className={styles.user}>
                                                Operado por (ID): <strong>{item.usuarioid || item.usuario || item.operador}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};
