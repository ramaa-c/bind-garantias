import React, { useState } from "react";
import { FiAward, FiRefreshCw, FiCheckCircle, FiXCircle, FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { sociosService } from "../../../../services/sociosService";
import { useCertificadoPyme } from "../../../../hooks/useSocios";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { SelectFechaSimple } from "../../../ui/SelectFechaSimple/SelectFechaSimple";
import { Modal } from "../../../ui/Modal/Modal";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./CertificadoPymeAdmin.module.css";

const FORM_INICIAL = { fchDesde: "", fchHasta: "", numero: "", observaciones: "" };

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(d);
};

// Mismo formato que getCSharpIsoDate (usado en toda la app para mandar
// fechas al backend): sin milisegundos ni "Z", así calza con
// WSSocioCertificadoPYME.fchDesde/fchHasta ("yyyy-MM-ddTHH:mm:ss").
// SelectFechaSimple entrega un ISO completo (con milisegundos y "Z").
const aFechaBackend = (isoCompleto) => {
  if (!isoCompleto) return null;
  return isoCompleto.split(".")[0];
};

// Panel admin para el Certificado PyME de un socio: NO es el documento
// (eso sigue siendo un SocioArchivo común, vía la precarga de LUFE), es la
// fila de SocioCertificadoPYME que condiciona si el socio puede migrar a
// SGR+ o no. Esa tabla no se completa sola — se carga llamando a
// Socio/CertificadoVigente con Vincular=true (botón "Reverificar", el mismo
// chequeo que ya corre una vez en Paso1Cuit), o a mano acá si CASFOG/LUFE
// no refleja la realidad. Acordado con Victor el 2026-08-21.
export function CertificadoPymeAdmin({ socioId, cuit }) {
  const queryClient = useQueryClient();
  const { data: certificados, isLoading } = useCertificadoPyme(socioId);
  const [reverificando, setReverificando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [certificadoEditando, setCertificadoEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const lista = Array.isArray(certificados) ? certificados : [];
  // Si el backend llegara a guardar más de uno, el más reciente (mayor ID)
  // es el que manda — el resto queda solo como historial, no se muestra.
  const certificadoActual = [...lista].sort(
    (a, b) =>
      (Number(b.sociocertificadopymeid ?? b.SocioCertificadoPYMEID) || 0) -
      (Number(a.sociocertificadopymeid ?? a.SocioCertificadoPYMEID) || 0),
  )[0];
  const tieneCertificado = !!certificadoActual;

  const invalidarConsulta = () =>
    queryClient.invalidateQueries({ queryKey: ["socios", "certificadoPyme", Number(socioId) || null] });

  const handleReverificar = async () => {
    if (!cuit) {
      toast.error("No se pudo detectar el CUIT del socio.");
      return;
    }
    setReverificando(true);
    try {
      const resultado = await sociosService.obtenerCertificadoVigente(cuit, true);
      await invalidarConsulta();
      if (resultado.status === 200) {
        toast.success("Certificado PyME vigente confirmado.");
      } else {
        toast.error("No se encontró un Certificado PyME vigente para este CUIT en CASFOG/LUFE.");
      }
    } catch (err) {
      toast.error("No se pudo verificar el Certificado PyME: " + err.message);
    } finally {
      setReverificando(false);
    }
  };

  const abrirAlta = () => {
    setCertificadoEditando(null);
    setForm(FORM_INICIAL);
    setModalAbierto(true);
  };

  const abrirEdicion = () => {
    if (!certificadoActual) return;
    setCertificadoEditando(certificadoActual);
    setForm({
      fchDesde: certificadoActual.fchdesde ?? certificadoActual.fchDesde ?? "",
      fchHasta: certificadoActual.fchhasta ?? certificadoActual.fchHasta ?? "",
      numero: certificadoActual.numero ?? certificadoActual.Numero ?? "",
      observaciones: certificadoActual.observaciones ?? certificadoActual.Observaciones ?? "",
    });
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const payload = {
        sociocertificadopymeid:
          certificadoEditando?.sociocertificadopymeid ?? certificadoEditando?.SocioCertificadoPYMEID ?? 0,
        socioid: socioId,
        fchdesde: aFechaBackend(form.fchDesde),
        fchhasta: aFechaBackend(form.fchHasta),
        numero: form.numero,
        observaciones: form.observaciones,
      };
      if (certificadoEditando) {
        await sociosService.actualizarCertificadoPyme(payload);
        toast.success("Certificado PyME actualizado.");
      } else {
        await sociosService.crearCertificadoPyme(payload);
        toast.success("Certificado PyME cargado.");
      }
      setModalAbierto(false);
      await invalidarConsulta();
    } catch (err) {
      toast.error("No se pudo guardar el Certificado PyME: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!certificadoActual) return;
    setEliminando(true);
    try {
      const id = certificadoActual.sociocertificadopymeid ?? certificadoActual.SocioCertificadoPYMEID;
      await sociosService.eliminarCertificadoPyme(id);
      toast.success("Certificado PyME eliminado.");
      setConfirmEliminarOpen(false);
      await invalidarConsulta();
    } catch (err) {
      toast.error("No se pudo eliminar el Certificado PyME: " + err.message);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className={styles.tabPage}>
      <div className={styles.scroll}>
        <section className={styles.sectionCard}>
          <header className={styles.sectionCardHeader}>
            <span className={styles.sectionCardIcon}>
              <FiAward size={15} />
            </span>
            <h3>Certificado PyME</h3>
            <span className={`${styles.badge} ${tieneCertificado ? styles.badgeOk : styles.badgeFalta}`}>
              {isLoading ? "Verificando..." : tieneCertificado ? <><FiCheckCircle size={12} /> Habilitado</> : <><FiXCircle size={12} /> No habilitado</>}
            </span>
          </header>

          <p className={styles.sectionCardHint}>
            Condiciona si este socio puede migrar a SGR+. No es el documento del legajo (ese sigue siendo el archivo
            precargado desde LUFE) — es el registro que confirma que tiene un certificado vigente habilitado.
          </p>

          {!isLoading && tieneCertificado && (
            <div className={styles.detalle}>
              <span>Vigencia: {formatearFecha(certificadoActual.fchdesde ?? certificadoActual.fchDesde)} — {formatearFecha(certificadoActual.fchhasta ?? certificadoActual.fchHasta)}</span>
              {(certificadoActual.numero ?? certificadoActual.Numero) && (
                <span>N°: {certificadoActual.numero ?? certificadoActual.Numero}</span>
              )}
              {(certificadoActual.observaciones ?? certificadoActual.Observaciones) && (
                <span>Obs: {certificadoActual.observaciones ?? certificadoActual.Observaciones}</span>
              )}
            </div>
          )}
          {!isLoading && !tieneCertificado && (
            <p className={styles.sinCertificadoText}>
              El socio no va a poder migrar a SGR+ hasta que tenga uno cargado.
            </p>
          )}

          <div className={styles.acciones}>
            <Button variant="outlineBlue" size="sm" onClick={handleReverificar} isLoading={reverificando}>
              <FiRefreshCw size={12} /> Reverificar (CASFOG/LUFE)
            </Button>
            {tieneCertificado ? (
              <>
                <Button variant="outlineBlue" size="sm" onClick={abrirEdicion}>
                  <FiEdit2 size={12} /> Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => setConfirmEliminarOpen(true)}>
                  <FiTrash2 size={12} /> Eliminar
                </Button>
              </>
            ) : (
              <Button variant="outlineBlue" size="sm" onClick={abrirAlta}>
                <FiPlus size={12} /> Cargar a mano
              </Button>
            )}
          </div>
        </section>
      </div>

      <Modal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        title={certificadoEditando ? "Editar Certificado PyME" : "Cargar Certificado PyME"}
        subtitle="Carga manual, sin depender de CASFOG/LUFE."
        variant="blue"
        maxWidth="480px"
      >
        <form onSubmit={handleGuardar} className={styles.form}>
          <div className={styles.formRow}>
            <SelectFechaSimple
              label="Vigente desde"
              value={form.fchDesde}
              onChange={(val) => setForm((f) => ({ ...f, fchDesde: val }))}
              variant="admin"
              hideErrorSpace
              disableFuture
            />
            <SelectFechaSimple
              label="Vigente hasta"
              value={form.fchHasta}
              onChange={(val) => setForm((f) => ({ ...f, fchHasta: val }))}
              variant="admin"
              hideErrorSpace
            />
          </div>
          <InputSimple
            label="Número de certificado"
            value={form.numero}
            onChange={(val) => setForm((f) => ({ ...f, numero: val }))}
            variant="admin"
            hideErrorSpace
          />
          <InputSimple
            label="Observaciones"
            value={form.observaciones}
            onChange={(val) => setForm((f) => ({ ...f, observaciones: val }))}
            variant="admin"
            hideErrorSpace
          />
          <div className={styles.formActions}>
            <Button type="button" variant="outlineBlue" size="sm" onClick={() => setModalAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="blue" size="sm" isLoading={guardando}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={confirmEliminarOpen}
        onClose={() => setConfirmEliminarOpen(false)}
        onConfirm={handleEliminar}
        titulo="Eliminar Certificado PyME"
        mensaje="¿Confirmás eliminar el Certificado PyME de este socio? A partir de ahí, no va a poder migrar a SGR+ hasta que se cargue uno nuevo."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="blue"
        tone="danger"
        isLoading={eliminando}
      />
    </div>
  );
}

export default CertificadoPymeAdmin;
