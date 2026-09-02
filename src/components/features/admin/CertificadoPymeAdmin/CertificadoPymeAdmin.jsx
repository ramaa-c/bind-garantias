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

const MS_POR_DIA = 1000 * 60 * 60 * 24;

// Días restantes de vigencia (o vencidos) + un tono para el pill. Sin fecha
// de vencimiento válida no hay nada que mostrar - el llamador decide si
// renderiza el pill o no.
const calcularVigencia = (hasta) => {
  const hastaDate = hasta ? new Date(hasta) : null;
  if (!hastaDate || Number.isNaN(hastaDate.getTime())) return null;
  const diasRestantes = Math.ceil((hastaDate.getTime() - Date.now()) / MS_POR_DIA);
  let tono = "ok";
  if (diasRestantes < 0) tono = "vencido";
  else if (diasRestantes <= 30) tono = "porVencer";
  return { diasRestantes, tono };
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

  const numeroActual = certificadoActual?.numero ?? certificadoActual?.Numero;
  const observacionesActuales = certificadoActual?.observaciones ?? certificadoActual?.Observaciones;
  const fchDesdeActual = certificadoActual?.fchdesde ?? certificadoActual?.fchDesde;
  const fchHastaActual = certificadoActual?.fchhasta ?? certificadoActual?.fchHasta;
  const vigencia = tieneCertificado ? calcularVigencia(fchHastaActual) : null;

  return (
    <div className={styles.tabPage}>
      <div className={styles.scroll}>
        {/* Antes esto era una tarjeta angosta (max-width 42rem) centrada
            sobre un contenedor mucho más ancho, dejando aire vacío a los
            costados sin motivo — un solo registro (no una lista) igual
            necesita usar el ancho real para no verse como que "falta
            contenido". El hero ocupa todo el ancho, y los datos pasan de
            líneas sueltas a una grilla de fichas (mismo lenguaje que ya usa
            la pestaña "Datos" de esta misma página). */}
        <section className={styles.hero}>
          <span className={styles.heroIcon}>
            <FiAward size={20} />
          </span>
          <div className={styles.heroInfo}>
            <h3>Certificado PyME</h3>
            <p className={styles.heroHint}>
              Condiciona si este socio puede migrar a SGR+. No es el documento del legajo (ese sigue siendo el
              archivo precargado desde LUFE) — es el registro que confirma que tiene un certificado vigente
              habilitado.
            </p>
          </div>
          <span className={`${styles.badge} ${tieneCertificado ? styles.badgeOk : styles.badgeFalta}`}>
            {isLoading ? "Verificando..." : tieneCertificado ? <><FiCheckCircle size={13} /> Habilitado</> : <><FiXCircle size={13} /> No habilitado</>}
          </span>
        </section>

        {!isLoading && tieneCertificado && (
          <>
            <section className={styles.vigenciaCard}>
              <div>
                <span className={styles.factLabel}>Vigencia</span>
                <span className={styles.vigenciaFechas}>
                  {formatearFecha(fchDesdeActual)} — {formatearFecha(fchHastaActual)}
                </span>
              </div>
              {vigencia && (
                <span className={`${styles.vigenciaPill} ${styles[`vigenciaPill-${vigencia.tono}`]}`}>
                  {vigencia.tono === "vencido"
                    ? `Venció hace ${Math.abs(vigencia.diasRestantes)} días`
                    : `Vence en ${vigencia.diasRestantes} días`}
                </span>
              )}
            </section>

            <section className={styles.factsGrid}>
              <div className={styles.factCell}>
                <span className={styles.factLabel}>N° de certificado</span>
                <span className={styles.factValue}>{numeroActual || "—"}</span>
              </div>
              <div className={styles.factCell}>
                <span className={styles.factLabel}>Observaciones</span>
                <span className={styles.factValue}>{observacionesActuales || "—"}</span>
              </div>
            </section>
          </>
        )}

        {!isLoading && !tieneCertificado && (
          <section className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <FiXCircle size={26} />
            </span>
            <h4>Sin Certificado PyME cargado</h4>
            <p>
              El socio no va a poder migrar a SGR+ hasta que tenga uno cargado. Reverificá contra CASFOG/LUFE o
              cargalo a mano con los botones de abajo.
            </p>
          </section>
        )}
      </div>

      {/* Dos grupos (reverificar vs. editar/eliminar) en vez de todos los
          botones sueltos en una fila: con espacio, quedan separados
          (space-between); en un contenedor angosto, la @container query de
          abajo los apila cada uno a ancho completo - se adapta al ancho
          real del panel, no al del viewport. */}
      <div className={styles.footer}>
        <div className={styles.footerGroup}>
          <Button variant="outlineBlue" size="sm" onClick={handleReverificar} isLoading={reverificando}>
            <FiRefreshCw size={12} /> Reverificar (CASFOG/LUFE)
          </Button>
        </div>
        <div className={styles.footerGroup}>
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
