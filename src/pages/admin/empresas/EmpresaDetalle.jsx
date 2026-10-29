import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FiUser,
  FiFileText,
  FiUsers,
  FiShield,
  FiClock,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
  FiArrowLeft,
  FiAlertTriangle,
  FiRefreshCw,
  FiActivity,
  FiEdit3,
  FiX,
  FiEye,
  FiInfo,
  FiCheckCircle,
  FiDownload,
  FiLink,
  FiAward,
  FiBell,
  FiUserCheck,
  FiChevronDown,
  FiZap,
  FiPlay,
  FiCode,
  FiSearch,
  FiDollarSign,
} from "react-icons/fi";
import {
  useSocioPorId,
  useActualizarSocio,
  useObtenerExecuteCda,
  useUsuariosVinculadosASocio,
} from "../../../hooks/useSocios";
import { cdaService } from "../../../services/cdaService";
import {
  useObtenerTodasWebConEstado,
  useObtenerGrupoCdaConCdas,
  consultaGrupoCdaConCdas,
  idsCdasActivos,
} from "../../../hooks/useCadenaValor";
import { useObtenerDatosSocioLegajo, useEstadoCdaTerceros } from "../../../hooks/useTerceros";
import { useTiposRelacionSocioActivos } from "../../../hooks/useTipoRelacionSocio";
import { useCdaEngine } from "../../../hooks/useCdaEngine";
import { normalizarCatalogoActivo } from "../../../utils/relacionesTercerosUtils";
import {
  RELACION_REPRESENTANTE_LEGAL_ID,
  RELACION_APODERADO_ID,
} from "../../../constants/tiposRelacionSocio";
import {
  useSituacionBCRA,
  useEstadoSocio,
  useTamanioEmpresa,
  useTipoCanalComercializacion,
  useEstadoExecuteCda,
  useTiposProducto,
} from "../../../hooks/useCatalogos";
import { useObtenerTodosCdas, useReejecutarCda, useProbarCda } from "../../../hooks/useCda";
import { useObtenerLimitesPorSocio, useHistorialesCdaLineas } from "../../../hooks/useLinea";
import { PANTALLA_LINEAS } from "../../../utils/pantallasCda";
import {
  ESTADO_PENDIENTE,
  ESTADO_RECHAZADA,
  estadoTextoDesde,
  esRechazoAutomatico,
} from "../../../utils/estadoLimiteSocio";
import { importeOriginalDeLimite, simboloMoneda } from "../../../utils/monedaUtils";
import { useObtenerUsuarioPorId } from "../../../hooks/useUsuario";
import { useValidacionLegajo } from "../../../hooks/useValidacionLegajo";
import { useCadenaDelSocio } from "../../../hooks/useCadenaDelSocio";
import {
  ORIGEN_CADENA_ALTA,
  ORIGEN_CADENA_LINEA,
  ORIGEN_CADENA_MANUAL,
} from "../../../utils/cadenaDelSocio";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import { useAuthStore } from "../../../store/useAuthStore";
import { esCdaActivo } from "../../../utils/cdaUtils";
import { socioArchivoService } from "../../../services/socioArchivoService";
import { descargarLegajoCompletoZip } from "../../../utils/fileUtils";
import { useDescargaConFeedback } from "../../../hooks/useDescargaConFeedback";
import {
  ultimaEjecucionPorCda,
  ordenarEjecucionesCda,
  formatearMomentoControl,
  calcularEstadoEfectivo,
  combinarEstadoCdas,
  obtenerCdasDeLaCorridaActual,
  ultimasEjecucionesDeCadena,
  calcularEstadoConCdasVigentes,
  calcularEstadoDesdeHistorial,
} from "../../../utils/executeCda";
import {
  Button,
  InputSimple,
  SelectSimple,
  SelectFechaSimple,
  Modal,
  Skeleton,
} from "../../../components/ui";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { NotificarSocioModal } from "../../../components/features/admin/NotificarSocioModal/NotificarSocioModal";
import { DocumentosLegajo } from "../../../components/features/shared/DocumentosLegajo/DocumentosLegajo";
import { ESTRUCTURA_LEGAJO } from "../../../components/features/shared/DocumentosLegajo/DocumentosLegajo.constants";
import { SociosLegajo } from "../../../components/features/shared/SociosLegajo/SociosLegajo";
import { LegajoUniversalBar } from "../../../components/features/shared/LegajoUniversalBar/LegajoUniversalBar";
import { CertificadoPymeAdmin } from "../../../components/features/admin/CertificadoPymeAdmin/CertificadoPymeAdmin";
import {
  esUsuarioBloqueado,
  esUsuarioPendienteActivacion,
} from "../../../utils/usuarioUtils";
import styles from "./EmpresaDetalle.module.css";
import { mensajeNegocio } from "../../../utils/mensajesError";

const getTipoPersonaLabel = (tipoPersonaId) => {
  const id = Number(tipoPersonaId);
  if (id === 1) return "Persona Física";
  if (id === 10) return "Persona Jurídica";
  return null;
};

const formatCuit = (cuit) => {
  const digits = String(cuit || "").replace(/\D/g, "");
  if (digits.length !== 11) return cuit || "-";
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
};

const resolverLabel = (opciones, id) => {
  if (id === undefined || id === null || Number(id) === 0) return null;
  const encontrada = (opciones || []).find((o) => o.value === String(id));
  return encontrada?.label || null;
};

const getInitials = (denominacion) => {
  const palabras = String(denominacion || "").trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "?";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return `${palabras[0][0]}${palabras[1][0]}`.toUpperCase();
};

const ESTADO_LABEL_EFECTIVO = {
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  pendiente: "Pendiente",
};

const getEstadoTono = (label) => {
  const texto = String(label || "").toLowerCase();
  if (/rechaz|baja|inactiv|suspend/.test(texto)) return "danger";
  if (/pendient|proceso|revisi/.test(texto)) return "warning";
  if (/activ|aprob|complet/.test(texto)) return "success";
  return "neutral";
};

const FECHA_MIN = new Date(1950, 0, 1);

const TABS = [
  { key: "datos", label: "Datos", icon: FiUser },
  { key: "documentacion", label: "Documentación", icon: FiFileText },
  { key: "terceros", label: "Terceros Relacionados", icon: FiUsers },
  { key: "cdas", label: "CDAs", icon: FiShield },
  { key: "pyme", label: "Certificado PyME", icon: FiAward },
  { key: "usuarios", label: "Usuarios Vinculados", icon: FiUserCheck },
];

// Filas fantasma con la forma real del panel de CDAs (encabezado + filas de
// criterio con badge/fecha/acciones): mientras carga se ve la estructura, no
// un spinner centrado.
const CdasPanelSkeleton = () => (
  <section className={styles.cdasSection}>
    <div className={`${styles.sectionCardHeader} ${styles.cdasSectionHeaderRow}`}>
      <Skeleton width="16rem" height="1.85rem" radius="0.55rem" />
      <Skeleton width="13rem" height="1.85rem" radius="0.55rem" />
    </div>
    <div className={styles.listaCdas}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.filaCda}>
          <span className={styles.filaCdaInfo}>
            <Skeleton width="55%" height="0.85rem" />
            <Skeleton width="25%" height="0.7rem" />
          </span>
          <Skeleton width="5.5rem" height="1.35rem" radius="pill" />
          <Skeleton width="6rem" height="0.75rem" />
          <Skeleton width="4.25rem" height="1.6rem" radius="0.5rem" style={{ justifySelf: "end" }} />
        </div>
      ))}
    </div>
  </section>
);

const construirEstadoInicial = (socio) => ({
  denominacion: socio.denominacion || "",
  email: socio.email || "",
  emailfacturacion: socio.emailfacturacion || "",
  telefono: socio.telefono || "",
  telefono2: socio.telefono2 || "",
  telefono3: socio.telefono3 || "",
  calle: socio.calle || "",
  numero: socio.numero != null ? String(socio.numero) : "",
  piso: socio.piso || "",
  departamento: socio.departamento || "",
  partido: socio.partido || "",
  codpos: socio.codpos || "",
  tamanioempresaid:
    socio.tamanioempresaid != null ? String(socio.tamanioempresaid) : "",
  situacionbcraid:
    socio.situacionbcraid != null ? String(socio.situacionbcraid) : "",
  tipocanalcomercializacionid:
    socio.tipocanalcomercializacionid != null
      ? String(socio.tipocanalcomercializacionid)
      : "",
  fechainicioactividades: socio.fechainicioactividades || "",
  fechacierreejercicio: socio.fechacierreejercicio || "",
});

// Pestaña de solo lectura - muestra qué usuarios tienen acceso a esta
// empresa, algo que hasta SGRPLUSPLA-201/mejora de api/SocioUsuario no se
// podía ver desde ningún lado del panel admin. Hoy solo trae email/fecha de
// vinculación/estado de la cuenta (lo único que expone
// api/SocioUsuario/{SocioID}:PorSocio + api/usuario/{id}) - a futuro se
// puede sumar más info propia de cada usuario si hace falta.
function UsuariosVinculadosTab({ socioId }) {
  const { usuariosVinculados, isLoading } = useUsuariosVinculadosASocio(socioId);

  return (
    <div className={styles.usuariosVinculadosTab}>
      <section className={styles.sectionCard}>
        <header className={styles.sectionCardHeader}>
          <span className={styles.sectionCardIcon}>
            <FiUserCheck size={15} />
          </span>
          <h3>Usuarios vinculados</h3>
        </header>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <Skeleton width="100%" height="2.3rem" radius="0.6rem" />
            <Skeleton width="100%" height="2.3rem" radius="0.6rem" />
          </div>
        ) : usuariosVinculados.length === 0 ? (
          <p className={styles.usuariosVinculadosVacio}>
            Todavía no hay ningún usuario vinculado a esta empresa.
          </p>
        ) : (
          <ul className={styles.usuariosVinculadosLista}>
            {usuariosVinculados.map((u) => (
              <li key={u.usuarioWebId} className={styles.usuarioVinculadoRow}>
                <span className={styles.usuarioVinculadoEmail}>
                  {u.email || `Usuario #${u.usuarioWebId}`}
                </span>
                <span className={styles.usuarioVinculadoMeta}>
                  {esUsuarioPendienteActivacion(u) && (
                    <span className={`${styles.badge} ${styles["badge-warning"]}`}>
                      Pendiente de activación
                    </span>
                  )}
                  {esUsuarioBloqueado(u) && (
                    <span className={`${styles.badge} ${styles["badge-warning"]}`}>
                      Bloqueado
                    </span>
                  )}
                  {u.momentoCreacion
                    ? new Date(u.momentoCreacion).toLocaleDateString("es-AR")
                    : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DatosTab({ socio }) {
  const estadoInicial = useMemo(() => construirEstadoInicial(socio), [socio]);
  const [formState, setFormState] = useState(estadoInicial);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: situacionesBcra } = useSituacionBCRA();
  const { data: tamaniosEmpresa } = useTamanioEmpresa();
  const { data: canalesComercializacion } = useTipoCanalComercializacion();
  const actualizarMutation = useActualizarSocio();

  const hayCambios = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(estadoInicial),
    [formState, estadoInicial],
  );

  const setField = (field) => (val) =>
    setFormState((prev) => ({ ...prev, [field]: val }));

  const handleRevertir = () => {
    setFormState(estadoInicial);
    toast.info("Se descartaron los cambios sin guardar");
  };

  const handleGuardar = () => {
    if (!formState.denominacion.trim()) {
      toast.error("La denominación es obligatoria");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmarGuardar = () => {
    // Se parte del socio completo (tal como vino de la API) para no perder
    // campos que este formulario no expone, ya que el PUT reemplaza el
    // registro entero.
    const payload = {
      ...socio,
      ...formState,
      numero: formState.numero ? Number(formState.numero) : 0,
      tamanioempresaid: formState.tamanioempresaid
        ? Number(formState.tamanioempresaid)
        : null,
      situacionbcraid: formState.situacionbcraid
        ? Number(formState.situacionbcraid)
        : null,
      tipocanalcomercializacionid: formState.tipocanalcomercializacionid
        ? Number(formState.tipocanalcomercializacionid)
        : null,
    };

    actualizarMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Datos de la empresa actualizados correctamente");
        setConfirmOpen(false);
      },
      onError: (err) => {
        console.error("Error al actualizar el socio:", err);
        toast.error("Ocurrió un error al guardar los cambios", { description: mensajeNegocio(err, "") });
        setConfirmOpen(false);
      },
    });
  };

  return (
    <div className={styles.datosTab}>
      <div className={styles.datosScroll}>
        <div className={styles.sectionsGrid}>
          <section className={`${styles.sectionCard} ${styles.areaGeneral}`}>
            <header className={styles.sectionCardHeader}>
              <span className={styles.sectionCardIcon}>
                <FiBriefcase size={15} />
              </span>
              <h3>Datos generales</h3>
            </header>
            <div className={styles.sectionCardFields}>
              <div className={styles.fieldFull}>
                <InputSimple
                  label="Denominación"
                  value={formState.denominacion}
                  onChange={setField("denominacion")}
                  variant="admin"
                  hideErrorSpace
                  disabled
                  title="La razón social no se puede modificar."
                />
              </div>
              <div className={styles.fieldFull}>
                <InputSimple
                  label="Email"
                  value={formState.email}
                  onChange={setField("email")}
                  variant="admin"
                  hideErrorSpace
                />
              </div>
              <div className={styles.fieldFull}>
                <InputSimple
                  label="Email de facturación"
                  value={formState.emailfacturacion}
                  onChange={setField("emailfacturacion")}
                  variant="admin"
                  hideErrorSpace
                />
              </div>
              <div className={`${styles.fieldFull} ${styles.fieldRow}`}>
                <InputSimple
                  label="Teléfono"
                  value={formState.telefono}
                  onChange={setField("telefono")}
                  variant="admin"
                  hideErrorSpace
                />
                <InputSimple
                  label="Tel. alternativo"
                  value={formState.telefono2}
                  onChange={setField("telefono2")}
                  variant="admin"
                  hideErrorSpace
                />
                <InputSimple
                  label="Tel. alternativo 2"
                  value={formState.telefono3}
                  onChange={setField("telefono3")}
                  variant="admin"
                  hideErrorSpace
                />
              </div>
            </div>
          </section>

          <section className={`${styles.sectionCard} ${styles.areaDomicilio}`}>
            <header className={styles.sectionCardHeader}>
              <span className={styles.sectionCardIcon}>
                <FiMapPin size={15} />
              </span>
              <h3>Domicilio</h3>
            </header>
            <div className={styles.sectionCardFields}>
              <div className={styles.fieldFull}>
                <InputSimple
                  label="Calle"
                  value={formState.calle}
                  onChange={setField("calle")}
                  variant="admin"
                  hideErrorSpace
                />
              </div>
              <div className={`${styles.fieldFull} ${styles.fieldRow}`}>
                <InputSimple
                  label="Número"
                  value={formState.numero}
                  onChange={setField("numero")}
                  variant="admin"
                  hideErrorSpace
                />
                <InputSimple
                  label="Piso"
                  value={formState.piso}
                  onChange={setField("piso")}
                  variant="admin"
                  hideErrorSpace
                />
              </div>
              <div className={`${styles.fieldFull} ${styles.fieldRow}`}>
                <InputSimple
                  label="Departamento"
                  value={formState.departamento}
                  onChange={setField("departamento")}
                  variant="admin"
                  hideErrorSpace
                />
                <InputSimple
                  label="Partido"
                  value={formState.partido}
                  onChange={setField("partido")}
                  variant="admin"
                  hideErrorSpace
                />
              </div>
              <div className={styles.fieldFull}>
                <InputSimple
                  label="Código postal"
                  value={formState.codpos}
                  onChange={setField("codpos")}
                  variant="admin"
                  hideErrorSpace
                />
              </div>
            </div>
          </section>

          <section className={`${styles.sectionCard} ${styles.areaClasificacion}`}>
            <header className={styles.sectionCardHeader}>
              <span className={styles.sectionCardIcon}>
                <FiShield size={15} />
              </span>
              <h3>Clasificación</h3>
            </header>
            <div className={styles.sectionCardFields}>
              <SelectSimple
                label="Tamaño de empresa"
                options={tamaniosEmpresa?.opciones || []}
                value={formState.tamanioempresaid}
                onChange={setField("tamanioempresaid")}
                variant="admin"
                hideErrorSpace
              />
              <SelectSimple
                label="Situación BCRA"
                options={situacionesBcra?.opciones || []}
                value={formState.situacionbcraid}
                onChange={setField("situacionbcraid")}
                variant="admin"
                hideErrorSpace
              />
              <SelectSimple
                label="Canal de comercialización"
                options={canalesComercializacion?.opciones || []}
                value={formState.tipocanalcomercializacionid}
                onChange={setField("tipocanalcomercializacionid")}
                variant="admin"
                hideErrorSpace
              />
            </div>
          </section>

          <section className={`${styles.sectionCard} ${styles.areaFechas}`}>
            <header className={styles.sectionCardHeader}>
              <span className={styles.sectionCardIcon}>
                <FiCalendar size={15} />
              </span>
              <h3>Fechas</h3>
            </header>
            <div className={styles.sectionCardFields}>
              <SelectFechaSimple
                label="Inicio de actividades"
                value={formState.fechainicioactividades}
                onChange={setField("fechainicioactividades")}
                minDate={FECHA_MIN}
                variant="admin"
                placement="top"
                hideErrorSpace
              />
              <SelectFechaSimple
                label="Cierre de ejercicio"
                value={formState.fechacierreejercicio}
                onChange={setField("fechacierreejercicio")}
                minDate={FECHA_MIN}
                variant="admin"
                placement="top"
                hideErrorSpace
              />
            </div>
          </section>
        </div>
      </div>

      <div className={styles.datosFooter}>
        <Button
          variant="ghost"
          onClick={handleRevertir}
          disabled={!hayCambios || actualizarMutation.isPending}
        >
          REVERTIR CAMBIOS
        </Button>
        <Button
          variant="blue"
          onClick={handleGuardar}
          isLoading={actualizarMutation.isPending}
          disabled={!hayCambios}
        >
          GUARDAR CAMBIOS
        </Button>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarGuardar}
        titulo="Confirmar modificación"
        mensaje="¿Estás seguro de que deseas guardar los cambios en los datos de esta empresa?"
        variant="blue"
        confirmText="Guardar"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={actualizarMutation.isPending}
      />
    </div>
  );
}

// Avisa de dónde sale el filtro de requisitos que se aplica en Documentación
// y Terceros Relacionados en modo admin: no hay un campo CadenaValorID en
// Socio, así que se resuelve con useCadenaDelSocio (líneas, después alta,
// después elección del admin) — mismo dato que usa la pestaña CDAs para
// reejecutar/forzar.
const ORIGEN_CADENA_TEXTO = {
  [ORIGEN_CADENA_LINEA]: "la cadena de sus líneas",
  [ORIGEN_CADENA_ALTA]: "la cadena por la que se dio de alta (todavía no tiene líneas)",
  [ORIGEN_CADENA_MANUAL]: "elegida a mano",
};

function CadenaDetectadaAviso({ cadenaValorIdDetectada, nombreCadenaDetectada, origenCadena }) {
  return (
    <p className={styles.cadenaAviso}>
      <FiInfo size={12} />
      {cadenaValorIdDetectada ? (
        <>
          Requisitos configurados para{" "}
          <span className={styles.cadenaAvisoFuerte}>{nombreCadenaDetectada}</span>,{" "}
          {ORIGEN_CADENA_TEXTO[origenCadena] || "detectada para esta empresa"}.
        </>
      ) : (
        "Esta empresa no tiene líneas ni registro de alta con cadena: elegí una arriba para ver sus requisitos y ejecutar CDAs. Mientras tanto se muestran los requisitos por defecto según su tipo societario."
      )}
    </p>
  );
}

function DocumentacionTab({ socio, cadenaValorIdDetectada, nombreCadenaDetectada, origenCadena }) {
  const methods = useForm({ defaultValues: {} });

  return (
    <div className={styles.embeddedLegajo}>
      <CadenaDetectadaAviso
        cadenaValorIdDetectada={cadenaValorIdDetectada}
        nombreCadenaDetectada={nombreCadenaDetectada}
        origenCadena={origenCadena}
      />
      <FormProvider {...methods}>
        <DocumentosLegajo
          adminMode
          socioIdOverride={socio.socioid}
          cadenaIdOverride={cadenaValorIdDetectada}
          empresaOverride={{
            nombreEmpresa: socio.denominacion,
            cuitActivo: socio.cuit,
            direccion: socio.calle,
            numero: socio.numero,
            piso: socio.piso,
            departamento: socio.departamento,
            partido: socio.partido,
            codigoPostal: socio.codpos,
            email: socio.email,
            telefono: socio.telefono,
            telefono2: socio.telefono2,
            tipoPersonaId: socio.tipopersonaid,
            fechaCierreEjercicio: socio.fechacierreejercicio,
            fechaInicioActividades: socio.fechainicioactividades,
            tamanioEmpresaId: socio.tamanioempresaid,
            situacionBcraId: socio.situacionbcraid,
            tipoCanalComercializacionId: socio.tipocanalcomercializacionid,
            socioEstadoId: socio.socioestadoid,
          }}
        />
      </FormProvider>
    </div>
  );
}

function TercerosTab({ socio, cadenaValorIdDetectada, nombreCadenaDetectada, origenCadena }) {
  return (
    <div className={styles.embeddedLegajo}>
      <CadenaDetectadaAviso
        cadenaValorIdDetectada={cadenaValorIdDetectada}
        nombreCadenaDetectada={nombreCadenaDetectada}
        origenCadena={origenCadena}
      />
      <SociosLegajo
        adminMode
        socioIdOverride={socio.socioid}
        cadenaIdOverride={cadenaValorIdDetectada}
        tipoPersonaIdOverride={Number(socio.tipopersonaid) || null}
        nombreEmpresaOverride={socio.denominacion}
      />
    </div>
  );
}

// PANTALLA_INGRESO_CUIT es hoy la única pantalla que evalúa CDAs a nivel
// empresa (la otra, PANTALLA_SOCIOS, es para terceros relacionados) — por
// eso se puede fijar acá. CadenaValorID no queda guardado en ningún campo de
// Socio: se resuelve con useCadenaDelSocio, arriba en EmpresaDetalle.
const PANTALLA_EMPRESA = "PANTALLA_INGRESO_CUIT";

const ejecutarGrupoAlta = async (socioId, cadenaValorId) => {
  try {
    await cdaService.ejecutarCda(PANTALLA_EMPRESA, { socioId }, cadenaValorId);
    toast.success("CDAs aprobados", {
      description: "El grupo completo se evaluó y pasó correctamente.",
    });
  } catch (error) {
    const status = error.response?.status;
    if (status === 406) {
      const data = error.response?.data;
      const listTest = data?.listtest ?? data?.ListTest ?? [];
      const rechazo = listTest.find((t) => (t.result ?? t.Result) === false);
      const mensaje =
        (rechazo && (rechazo.mensaje || rechazo.Mensaje)) ||
        "El grupo de criterios no se cumple.";
      toast.error("CDAs rechazados", { description: mensaje });
    } else if (status === 409) {
      toast.error("Falta un dato requerido para evaluar el grupo.");
    } else if (status === 400) {
      toast.error("La cadena no tiene criterios de alta vigentes para evaluar.");
    } else {
      toast.error("No se pudo ejecutar el grupo de CDAs.");
    }
  }
};

function EjecutarCriteriosAlta({ socio }) {
  const queryClient = useQueryClient();
  const { data: cadenasWeb } = useObtenerTodasWebConEstado();
  const { data: limitesSocio } = useObtenerLimitesPorSocio(socio?.socioid);
  const [cadenaElegida, setCadenaElegida] = useState("");
  const [ejecutando, setEjecutando] = useState(false);

  const opcionesCadena = useMemo(
    () =>
      (cadenasWeb || [])
        .filter((c) => c.activaOperativa)
        .map((c) => ({
          value: String(c.cadenavalorid ?? c.CadenaValorID),
          label: (c.referencia || "").trim() || c.denominacion || `Cadena #${c.cadenavalorid}`,
        })),
    [cadenasWeb],
  );

  const cadenaSugerida = useMemo(() => {
    const lista = Array.isArray(limitesSocio) ? limitesSocio : [];
    const id = lista.map((l) => l.cadenavalorid ?? l.CadenaValorID).find(Boolean);
    return id ? String(id) : "";
  }, [limitesSocio]);

  const cadena = cadenaElegida || cadenaSugerida;

  const ejecutar = async () => {
    if (!cadena) return;
    setEjecutando(true);
    await ejecutarGrupoAlta(socio.socioid, Number(cadena));
    setEjecutando(false);
    queryClient.invalidateQueries({ queryKey: ["socios", "executeCda", socio.socioid] });
  };

  return (
    <div className={styles.ejecutarAlta}>
      <SelectSimple
        label="Cadena de valor"
        value={cadena}
        onChange={setCadenaElegida}
        options={opcionesCadena}
        placeholder="Elegí la cadena"
        hideErrorSpace
        compact
        variant="admin"
        className={styles.ejecutarAltaSelect}
      />
      <Button type="button" variant="blue" size="md" onClick={ejecutar} disabled={!cadena || ejecutando}>
        <FiRefreshCw className={ejecutando ? styles.spinning : ""} />
        {ejecutando ? "Ejecutando…" : "Ejecutar criterios de alta"}
      </Button>
    </div>
  );
}

// Mismo patrón que ModoOffline.jsx: UsuarioWebID viaja en cada fila del
// historial (WSSocioExecuteCda.UsuarioWebID), pero solo trae el ID — hace
// falta resolverlo para mostrar quién ejecutó o forzó un CDA.
const NombreUsuario = ({ usuarioId }) => {
  const { data } = useObtenerUsuarioPorId(usuarioId);
  if (!usuarioId) return "Sistema";
  const partes = [data?.denominacion, data?.email].filter(Boolean);
  return partes.length > 0 ? partes.join(" - ") : `Usuario #${usuarioId}`;
};

// cadenaValorIdDetectada/nombreCadenaDetectada llegan ya resueltos desde
// EmpresaDetalle (se calculan una sola vez ahí porque también los necesitan
// DocumentacionTab y TercerosTab, ver useCadenaDelSocio).
const ROL_POR_RELACION = {
  [RELACION_REPRESENTANTE_LEGAL_ID]: "Representante legal",
  [RELACION_APODERADO_ID]: "Apoderado",
};

const ESTADO_LABEL_POR_ID = { 3: "Aprobado", 2: "Rechazado" };

const formatearFechaCorta = (valor) => {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const useMapasCatalogoCdas = () => {
  const { data: todosCdas } = useObtenerTodosCdas();
  return useMemo(() => {
    const descripcionPorCda = new Map();
    const reglaGlobalPorCda = new Map();
    (Array.isArray(todosCdas) ? todosCdas : []).forEach((cda) => {
      const id = Number(cda.cdaid);
      descripcionPorCda.set(id, cda.descripcion || cda.expresion);
      reglaGlobalPorCda.set(
        id,
        [cda.expresion, cda.simbolocomparacion, cda.valorcomparacion]
          .filter((p) => p !== undefined && p !== null && String(p).trim() !== "")
          .join(" "),
      );
    });
    return { descripcionPorCda, reglaGlobalPorCda };
  }, [todosCdas]);
};

function EncabezadoPlegable({ abierta, onToggle, icono, titulo, detalle }) {
  return (
    <button
      type="button"
      className={styles.cdasSectionToggle}
      onClick={onToggle}
      aria-expanded={abierta}
      title={abierta ? "Contraer" : "Expandir"}
    >
      <FiChevronDown
        size={16}
        className={`${styles.cdasSectionChevron} ${abierta ? "" : styles.cdasSectionChevronCerrado}`}
      />
      <span className={styles.sectionCardIcon}>{icono}</span>
      <h3>{titulo}</h3>
      {detalle && <span className={styles.cdasSectionContador}>{detalle}</span>}
    </button>
  );
}

function EstadoBadge({ label, titulo, tono: tonoForzado, className = "" }) {
  const tono = tonoForzado || getEstadoTono(label);
  return (
    <span className={`${styles.badge} ${styles[`badge-${tono}`]} ${className}`} title={titulo}>
      <span className={styles.badgeDot} /> {label}
    </span>
  );
}

function AccionIcono({ icono, etiqueta, onClick, disabled = false, cargando = false, motivoDeshabilitado }) {
  return (
    <button
      type="button"
      className={styles.accionIcono}
      onClick={onClick}
      disabled={disabled || cargando}
      aria-label={etiqueta}
      aria-busy={cargando || undefined}
      title={disabled && motivoDeshabilitado ? motivoDeshabilitado : etiqueta}
    >
      {cargando ? <FiRefreshCw size={14} className={styles.accionIconoGirando} /> : icono}
    </button>
  );
}

function FilaCda({
  titulo,
  etiquetas,
  detalle,
  detalleRechazo = false,
  estadoLabel,
  fecha,
  acciones,
  desvinculada = false,
  hija = false,
  expandible,
  expandido = false,
  onToggle,
}) {
  const info = (
    <span className={styles.filaCdaInfo}>
      <span className={styles.filaCdaTitulo}>
        <span className={styles.filaCdaNombre}>{titulo}</span>
        {etiquetas}
      </span>
      {detalle && (
        <span className={`${styles.filaCdaDetalle} ${detalleRechazo ? styles.filaCdaDetalleRechazo : ""}`}>
          {detalle}
        </span>
      )}
    </span>
  );

  const clases = [styles.filaCda, hija && styles.filaCdaHija, desvinculada && styles.filaCdaDesvinculada]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={clases}>
      {expandible === undefined ? (
        info
      ) : expandible ? (
        <button type="button" className={styles.filaCdaToggle} onClick={onToggle} aria-expanded={expandido}>
          <FiChevronDown
            size={15}
            className={`${styles.cdasSectionChevron} ${expandido ? "" : styles.cdasSectionChevronCerrado}`}
          />
          {info}
        </button>
      ) : (
        <span className={styles.filaCdaToggleInactivo}>
          <span className={styles.filaCdaChevronHueco} />
          {info}
        </span>
      )}
      <EstadoBadge label={estadoLabel} className={styles.filaCdaEstado} />
      <span className={styles.filaCdaFecha} title={fecha ? formatearMomentoControl(fecha) : undefined}>
        {formatearFechaCorta(fecha)}
      </span>
      <div className={styles.filaCdaAcciones}>{acciones}</div>
    </div>
  );
}

const mensajeResultadoReejecucion = ({ status, data }) => {
  if (status === 202) return { ok: true, mensaje: "El criterio se volvió a evaluar y pasó correctamente." };
  if (status === 406) {
    const listTest = data?.listtest ?? data?.ListTest ?? [];
    const rechazo = listTest.find((t) => (t.result ?? t.Result) === false);
    return { ok: false, mensaje: (rechazo && (rechazo.mensaje || rechazo.Mensaje)) || "El criterio no se cumple." };
  }
  if (status === 409) return { ok: false, mensaje: "Falta un dato requerido para evaluar este CDA." };
  return { ok: false, mensaje: "No se pudo re-ejecutar el CDA." };
};

function CdasTercerosSection({ socio, cadenaValorId, descripcionPorCda, reglaGlobalPorCda }) {
  const queryClient = useQueryClient();
  const { ejecutarValidaciones } = useCdaEngine();
  const { mutateAsync: reejecutarCda } = useReejecutarCda();
  const [abierta, setAbierta] = useState(true);
  const [terceroEnCurso, setTerceroEnCurso] = useState(null);
  const [cdaEnCurso, setCdaEnCurso] = useState(null);
  const [terceroExpandido, setTerceroExpandido] = useState(null);
  const [confirmReejecutarTodosOpen, setConfirmReejecutarTodosOpen] = useState(false);
  const [reejecutandoTodos, setReejecutandoTodos] = useState(false);
  const [verExpresionItem, setVerExpresionItem] = useState(null);
  const cadena = Number(cadenaValorId) || null;

  const { data: legajo, isLoading: cargandoLegajo } = useObtenerDatosSocioLegajo(socio?.socioid);
  const { data: catalogoActivosData } = useTiposRelacionSocioActivos();
  const { data: grupoVigente } = useObtenerGrupoCdaConCdas(cadena, cadena ? "PANTALLA_SOCIOS" : null);

  const personas = useMemo(() => {
    const descripcionPorTipo = new Map(
      normalizarCatalogoActivo(catalogoActivosData).map((it) => [String(it.id), it.descripcion]),
    );
    const porId = new Map();
    const agregar = (items, rolDe) => {
      (items || []).forEach((p) => {
        const id = Number(p?.id);
        if (!id) return;
        const rol = rolDe(p);
        const existente = porId.get(id);
        if (existente) {
          if (!existente.roles.includes(rol)) existente.roles.push(rol);
        } else {
          porId.set(id, { id, nombre: p.nombre, cuit: p.cuit, roles: [rol] });
        }
      });
    };
    agregar(legajo?.accionistas, () => "Accionista");
    agregar(legajo?.representantes, (p) => ROL_POR_RELACION[Number(p.rolId)] || "Representante");
    Object.entries(legajo?.porTipoRelacion || {}).forEach(([tipoId, items]) =>
      agregar(items, () => descripcionPorTipo.get(String(tipoId)) || `Relación ${tipoId}`),
    );
    return [...porId.values()];
  }, [legajo, catalogoActivosData]);

  const {
    data: estadoPorTercero,
    historiales,
    isLoading: cargandoEstados,
  } = useEstadoCdaTerceros(personas.map((p) => p.id), cadena);

  const cdasActivosIds = useMemo(() => (grupoVigente ? idsCdasActivos(grupoVigente) : null), [grupoVigente]);

  const detallePorTercero = useMemo(() => {
    const mapa = new Map();
    personas.forEach((persona) => {
      const filas = historiales?.get(persona.id) || [];
      const ultimas = cadena
        ? ultimasEjecucionesDeCadena(filas, cadena)
        : ultimaEjecucionPorCda(filas).filter((f) => Number(f.cdaid ?? f.CdaID ?? -1) !== 0);
      const cdas = ultimas
        .map((f) => ({
          ...f,
          cdaid: Number(f.cdaid ?? f.CdaID),
          vinculado: !cdasActivosIds || cdasActivosIds.includes(Number(f.cdaid ?? f.CdaID)),
        }))
        .sort((a, b) => Number(b.vinculado) - Number(a.vinculado));
      const ultimaFecha = cdas
        .map((f) => f.momentocontrol ?? f.MomentoControl)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];
      const rechazos = cdas
        .filter((f) => f.vinculado && Number(f.estadoexecutecdaid ?? f.EstadoExecuteCdaID) === 2)
        .map((f) => {
          const descripcion = descripcionPorCda.get(f.cdaid) || `CDA #${f.cdaid}`;
          const valor = String(f.valorresultado ?? f.ValorResultado ?? "").trim();
          return valor ? `${descripcion} (valor: ${valor})` : `${descripcion} (sin dato de la integración)`;
        });
      mapa.set(persona.id, { ultimaFecha, rechazos, cdas });
    });
    return mapa;
  }, [personas, historiales, cadena, cdasActivosIds, descripcionPorCda]);

  const invalidarTercero = (terceroId) => {
    queryClient.invalidateQueries({ queryKey: ["terceros", "executeCda", terceroId] });
    queryClient.invalidateQueries({ queryKey: ["terceros", "estadoCdaBulk"] });
  };

  const handleReejecutarPersona = async (persona) => {
    setTerceroEnCurso(persona.id);
    const resultado = await ejecutarValidaciones("PANTALLA_SOCIOS", { terceroId: persona.id }, cadena);
    setTerceroEnCurso(null);
    if (resultado.success) {
      toast.success(`CDAs reejecutados para ${persona.nombre}.`);
    } else {
      toast.error(resultado.errors?.[0]?.message || "No se cumplieron los criterios de aceptación.");
    }
    invalidarTercero(persona.id);
  };

  const handleReejecutarCda = async (persona, item) => {
    setCdaEnCurso(`${persona.id}-${item.cdaid}`);
    try {
      const respuesta = await reejecutarCda({
        cdaId: item.cdaid,
        terceroId: persona.id,
        pantalla: "PANTALLA_SOCIOS",
        cadenaValorId: cadena,
      });
      const { ok, mensaje } = mensajeResultadoReejecucion(respuesta);
      if (ok) toast.success("CDA aprobado", { description: mensaje });
      else toast.error("CDA no aprobado", { description: mensaje });
    } catch {
      toast.error("No se pudo re-ejecutar el CDA.");
    } finally {
      setCdaEnCurso(null);
      invalidarTercero(persona.id);
    }
  };

  const handleReejecutarTodos = async () => {
    setReejecutandoTodos(true);
    let aprobados = 0;
    let noAprobados = 0;
    for (const persona of personas) {
      setTerceroEnCurso(persona.id);
      const resultado = await ejecutarValidaciones("PANTALLA_SOCIOS", { terceroId: persona.id }, cadena);
      if (resultado.success) aprobados += 1;
      else noAprobados += 1;
      invalidarTercero(persona.id);
    }
    setTerceroEnCurso(null);
    setReejecutandoTodos(false);
    setConfirmReejecutarTodosOpen(false);
    if (noAprobados === 0) {
      toast.success(`Se reejecutaron los CDAs de ${aprobados} persona${aprobados !== 1 ? "s" : ""}.`);
    } else {
      toast.warning(`${aprobados} aprobada${aprobados !== 1 ? "s" : ""}, ${noAprobados} sin aprobar.`);
    }
  };

  const cargando = cargandoLegajo || (personas.length > 0 && cargandoEstados);
  const cantidadNoAprobados = personas.filter((p) => estadoPorTercero?.get(p.id) !== "aprobado").length;
  const ocupado = terceroEnCurso !== null || cdaEnCurso !== null || reejecutandoTodos;
  const motivoSinCadena = "No se detectó la cadena de este socio";

  return (
    <section className={styles.cdasSection}>
      <header className={`${styles.sectionCardHeader} ${styles.cdasSectionHeaderRow}`}>
        <EncabezadoPlegable
          abierta={abierta}
          onToggle={() => setAbierta((v) => !v)}
          icono={<FiUsers size={15} />}
          titulo="CDAs de terceros relacionados"
          detalle={personas.length > 0 ? `${personas.length} persona${personas.length !== 1 ? "s" : ""}` : null}
        />
        <div className={styles.cdasSectionHeaderActions}>
          {!cargando && personas.length > 0 && (
            <EstadoBadge
              label={cantidadNoAprobados === 0 ? "Todos aprobados" : `${cantidadNoAprobados} sin aprobar`}
              tono={cantidadNoAprobados === 0 ? "success" : "danger"}
              titulo={
                cadena
                  ? "Evaluados con los CDAs activos de la cadena."
                  : "Sin cadena detectada: se muestra el último resultado registrado de cada persona."
              }
            />
          )}
          <Button
            variant="outlineBlue"
            size="sm"
            onClick={() => setConfirmReejecutarTodosOpen(true)}
            isLoading={reejecutandoTodos}
            disabled={ocupado || !cadena || personas.length === 0}
            title={!cadena ? motivoSinCadena : "Volver a evaluar a todas las personas"}
          >
            <FiRefreshCw size={13} /> Reejecutar todos
          </Button>
        </div>
      </header>

      {abierta &&
        (cargando ? (
          <div className={styles.listaCdas}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={styles.filaCda}>
                <span className={styles.filaCdaInfo}>
                  <Skeleton width="45%" height="0.85rem" />
                  <Skeleton width="30%" height="0.7rem" />
                </span>
                <Skeleton width="5.5rem" height="1.35rem" radius="pill" />
                <Skeleton width="6rem" height="0.75rem" />
                <span />
              </div>
            ))}
          </div>
        ) : personas.length === 0 ? (
          <p className={styles.cdasVacio}>
            Esta empresa no tiene terceros relacionados cargados. Cuando se agreguen accionistas o
            representantes en el legajo, sus CDAs van a aparecer acá.
          </p>
        ) : (
          <div className={styles.listaCdas}>
            {personas.map((persona) => {
              const estado = estadoPorTercero?.get(persona.id);
              const detalle = detallePorTercero.get(persona.id) || { cdas: [], rechazos: [] };
              const estadoLabel =
                detalle.cdas.length > 0 || estado === "aprobado"
                  ? ESTADO_LABEL_EFECTIVO[estado] || "Sin evaluar"
                  : "Sin evaluar";
              const expandido = terceroExpandido === persona.id;
              const tieneDetalle = detalle.cdas.length > 0;

              return (
                <React.Fragment key={persona.id}>
                  <FilaCda
                    titulo={persona.nombre}
                    detalle={
                      estado === "rechazado" && detalle.rechazos.length > 0
                        ? `Rechazó: ${detalle.rechazos.join("; ")}`
                        : `CUIT ${formatCuit(persona.cuit)} · ${persona.roles.join(", ")}`
                    }
                    detalleRechazo={estado === "rechazado" && detalle.rechazos.length > 0}
                    estadoLabel={estadoLabel}
                    fecha={detalle.ultimaFecha}
                    expandible={tieneDetalle}
                    expandido={expandido}
                    onToggle={() => setTerceroExpandido(expandido ? null : persona.id)}
                    acciones={
                      <AccionIcono
                        icono={<FiRefreshCw size={14} />}
                        etiqueta={`Volver a ejecutar los CDAs de ${persona.nombre}`}
                        onClick={() => handleReejecutarPersona(persona)}
                        cargando={terceroEnCurso === persona.id}
                        disabled={ocupado || !cadena}
                        motivoDeshabilitado={!cadena ? motivoSinCadena : undefined}
                      />
                    }
                  />

                  {expandido && tieneDetalle && (
                    <div className={styles.filaCdaHijos}>
                      {detalle.cdas.map((item) => {
                        const valor = String(item.valorresultado ?? item.ValorResultado ?? "").trim();
                        const motivo = !item.vinculado
                          ? "Este CDA ya no está vinculado a esta cadena: no pesa en el resultado."
                          : !cadena
                            ? motivoSinCadena
                            : undefined;
                        return (
                          <FilaCda
                            key={item.cdaid}
                            hija
                            desvinculada={!item.vinculado}
                            titulo={descripcionPorCda.get(item.cdaid) || item.expresion || `CDA #${item.cdaid}`}
                            etiquetas={
                              !item.vinculado && (
                                <span className={styles.cdaRowDesvinculadoPill} title={motivo}>
                                  <FiX size={10} /> Desvinculado
                                </span>
                              )
                            }
                            detalle={valor ? `Valor: ${valor}` : "Sin dato de la integración"}
                            estadoLabel={
                              ESTADO_LABEL_POR_ID[Number(item.estadoexecutecdaid ?? item.EstadoExecuteCdaID)] ||
                              "Pendiente"
                            }
                            fecha={item.momentocontrol ?? item.MomentoControl}
                            acciones={
                              <>
                                <AccionIcono
                                  icono={<FiEye size={14} />}
                                  etiqueta="Ver expresión evaluada"
                                  onClick={() => setVerExpresionItem(item)}
                                />
                                <AccionIcono
                                  icono={<FiRefreshCw size={14} />}
                                  etiqueta="Volver a ejecutar este CDA"
                                  onClick={() => handleReejecutarCda(persona, item)}
                                  cargando={cdaEnCurso === `${persona.id}-${item.cdaid}`}
                                  disabled={ocupado || !cadena || !item.vinculado}
                                  motivoDeshabilitado={motivo}
                                />
                              </>
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}

      <VerExpresionModal
        item={verExpresionItem}
        onClose={() => setVerExpresionItem(null)}
        descripcion={verExpresionItem ? descripcionPorCda.get(Number(verExpresionItem.cdaid)) : ""}
        reglaGlobal={verExpresionItem ? reglaGlobalPorCda.get(Number(verExpresionItem.cdaid)) : ""}
      />

      <ConfirmacionModal
        isOpen={confirmReejecutarTodosOpen}
        onClose={() => {
          if (!reejecutandoTodos) setConfirmReejecutarTodosOpen(false);
        }}
        onConfirm={handleReejecutarTodos}
        titulo="Reejecutar CDAs de todos los terceros"
        mensaje={`Se van a volver a evaluar los CDAs de las ${personas.length} personas relacionadas, una por una, con los criterios activos de la cadena. Cada evaluación vuelve a consultar las integraciones (Nosis, ARCA). ¿Confirmás que querés continuar?`}
        variant="blue"
        confirmText="Reejecutar todos"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={reejecutandoTodos}
      />
    </section>
  );
}

const AVISO_REEJECUCION_LINEA = "El resultado queda en el historial: no cambia el estado de la solicitud.";

function CdasLineasSection({ socio, descripcionPorCda, reglaGlobalPorCda }) {
  const queryClient = useQueryClient();
  const { ejecutarValidaciones } = useCdaEngine();
  const { mutateAsync: reejecutarCda } = useReejecutarCda();
  const [abierta, setAbierta] = useState(true);
  const [lineaEnCurso, setLineaEnCurso] = useState(null);
  const [cdaEnCurso, setCdaEnCurso] = useState(null);
  const [lineaExpandida, setLineaExpandida] = useState(null);
  const [confirmReejecutarTodasOpen, setConfirmReejecutarTodasOpen] = useState(false);
  const [reejecutandoTodas, setReejecutandoTodas] = useState(false);
  const [verExpresionItem, setVerExpresionItem] = useState(null);

  const { data: limitesSocio, isLoading: cargandoLineas } = useObtenerLimitesPorSocio(socio?.socioid);
  const { data: cadenasWeb } = useObtenerTodasWebConEstado();
  const { data: tiposLimite } = useTiposProducto();

  const lineas = useMemo(() => {
    const nombrePorCadena = new Map(
      (cadenasWeb || []).map((c) => [
        Number(c.cadenavalorid),
        (c.referencia || "").trim() || c.denominacion || "",
      ]),
    );
    const descripcionPorTipo = new Map(
      (tiposLimite?.raw || []).map((t) => [Number(t.tipolimiteid), t.descripcion]),
    );
    const lista = Array.isArray(limitesSocio) ? limitesSocio : limitesSocio ? [limitesSocio] : [];
    return lista
      .map((l) => {
        const tipoLimiteId = Number(l.tipolimiteid);
        const cadena = Number(l.cadenavalorid) || null;
        const estadoId = Number(l.tipolimiteestadoid ?? ESTADO_PENDIENTE);
        return {
          id: Number(l.tipolimitesocioid),
          cadena,
          cadenaNombre: (cadena && nombrePorCadena.get(cadena)) || (cadena ? `Cadena #${cadena}` : "Sin cadena"),
          nombre: descripcionPorTipo.get(tipoLimiteId) || `Línea #${tipoLimiteId}`,
          estadoTexto: estadoTextoDesde(estadoId),
          rechazoAutomatico: estadoId === ESTADO_RECHAZADA && esRechazoAutomatico(l.observaciones),
          monto: `${simboloMoneda(l.monedaid)} ${new Intl.NumberFormat("es-AR").format(importeOriginalDeLimite(l))}`,
        };
      })
      .filter((l) => l.id)
      .sort((a, b) => b.id - a.id);
  }, [limitesSocio, cadenasWeb, tiposLimite]);

  const { data: historiales, isLoading: cargandoHistoriales } = useHistorialesCdaLineas(lineas.map((l) => l.id));

  const cadenas = [...new Set(lineas.map((l) => l.cadena).filter(Boolean))];
  const grupoPorCadena = useQueries({
    queries: cadenas.map((cadena) => consultaGrupoCdaConCdas(cadena, PANTALLA_LINEAS)),
    combine: (resultados) => new Map(resultados.map((r, i) => [cadenas[i], r.data])),
  });

  const detallePorLinea = new Map(
    lineas.map((linea) => {
      const filas = historiales?.get(linea.id);
      const historial = filas || [];
      const grupo = linea.cadena ? grupoPorCadena.get(linea.cadena) : undefined;
      const cdasActivosIds = grupo ? idsCdasActivos(grupo) : null;
      const ultimas = linea.cadena
        ? ultimasEjecucionesDeCadena(historial, linea.cadena)
        : ultimaEjecucionPorCda(historial).filter((f) => Number(f.cdaid ?? f.CdaID ?? -1) !== 0);
      const cdas = ultimas
        .map((f) => ({
          ...f,
          cdaid: Number(f.cdaid ?? f.CdaID),
          vinculado: !cdasActivosIds || cdasActivosIds.includes(Number(f.cdaid ?? f.CdaID)),
        }))
        .sort((a, b) => Number(b.vinculado) - Number(a.vinculado));
      const estado =
        cdas.length === 0
          ? null
          : cdasActivosIds
            ? calcularEstadoConCdasVigentes(historial, {
                cadenaValorId: linea.cadena,
                expresionAgrupacion: grupo?.grupo?.expresionagrupacion,
                cdasActivosIds,
              })
            : calcularEstadoDesdeHistorial(historial);
      const ultimaFecha = cdas
        .map((f) => f.momentocontrol ?? f.MomentoControl)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0];
      const rechazos = cdas
        .filter((f) => f.vinculado && Number(f.estadoexecutecdaid ?? f.EstadoExecuteCdaID) === 2)
        .map((f) => {
          const descripcion = descripcionPorCda.get(f.cdaid) || `CDA #${f.cdaid}`;
          const valor = String(f.valorresultado ?? f.ValorResultado ?? "").trim();
          return valor ? `${descripcion} (valor: ${valor})` : `${descripcion} (sin dato de la integración)`;
        });
      return [linea.id, { cdas, estado, ultimaFecha, rechazos, errorHistorial: filas === null }];
    }),
  );

  const invalidarLinea = (lineaId) => {
    queryClient.invalidateQueries({ queryKey: ["linea", "executeCda", String(lineaId)] });
    queryClient.invalidateQueries({ queryKey: ["linea", "executeCdaBulk"] });
  };

  const handleReejecutarLinea = async (linea) => {
    setLineaEnCurso(linea.id);
    const resultado = await ejecutarValidaciones(PANTALLA_LINEAS, { lineaId: linea.id }, linea.cadena);
    setLineaEnCurso(null);
    if (resultado.success) {
      toast.success(`CDAs reejecutados para la línea N°${linea.id}.`, { description: AVISO_REEJECUCION_LINEA });
    } else {
      toast.error(resultado.errors?.[0]?.message || "No se cumplieron los criterios de aceptación.", {
        description: AVISO_REEJECUCION_LINEA,
      });
    }
    invalidarLinea(linea.id);
  };

  const handleReejecutarCda = async (linea, item) => {
    setCdaEnCurso(`${linea.id}-${item.cdaid}`);
    try {
      const respuesta = await reejecutarCda({
        cdaId: item.cdaid,
        lineaId: linea.id,
        pantalla: PANTALLA_LINEAS,
        cadenaValorId: linea.cadena,
      });
      const { ok, mensaje } = mensajeResultadoReejecucion(respuesta);
      if (ok) toast.success("CDA aprobado", { description: mensaje });
      else toast.error("CDA no aprobado", { description: mensaje });
    } catch {
      toast.error("No se pudo re-ejecutar el CDA.");
    } finally {
      setCdaEnCurso(null);
      invalidarLinea(linea.id);
    }
  };

  const lineasConCadena = lineas.filter((l) => l.cadena);

  const handleReejecutarTodas = async () => {
    setReejecutandoTodas(true);
    let aprobadas = 0;
    let noAprobadas = 0;
    for (const linea of lineasConCadena) {
      setLineaEnCurso(linea.id);
      const resultado = await ejecutarValidaciones(PANTALLA_LINEAS, { lineaId: linea.id }, linea.cadena);
      if (resultado.success) aprobadas += 1;
      else noAprobadas += 1;
      invalidarLinea(linea.id);
    }
    setLineaEnCurso(null);
    setReejecutandoTodas(false);
    setConfirmReejecutarTodasOpen(false);
    if (noAprobadas === 0) {
      toast.success(`Se reejecutaron los CDAs de ${aprobadas} línea${aprobadas !== 1 ? "s" : ""}.`, {
        description: AVISO_REEJECUCION_LINEA,
      });
    } else {
      toast.warning(`${aprobadas} aprobada${aprobadas !== 1 ? "s" : ""}, ${noAprobadas} sin aprobar.`, {
        description: AVISO_REEJECUCION_LINEA,
      });
    }
  };

  const cargando = cargandoLineas || (lineas.length > 0 && cargandoHistoriales);
  const evaluadas = lineas.filter((l) => detallePorLinea.get(l.id)?.estado);
  const cantidadNoAprobadas = evaluadas.filter((l) => detallePorLinea.get(l.id).estado !== "aprobado").length;
  const ocupado = lineaEnCurso !== null || cdaEnCurso !== null || reejecutandoTodas;
  const motivoSinCadena = "La línea no tiene una cadena de valor asociada";

  return (
    <section className={styles.cdasSection}>
      <header className={`${styles.sectionCardHeader} ${styles.cdasSectionHeaderRow}`}>
        <EncabezadoPlegable
          abierta={abierta}
          onToggle={() => setAbierta((v) => !v)}
          icono={<FiDollarSign size={15} />}
          titulo="CDAs de línea"
          detalle={lineas.length > 0 ? `${lineas.length} línea${lineas.length !== 1 ? "s" : ""}` : null}
        />
        <div className={styles.cdasSectionHeaderActions}>
          {!cargando && evaluadas.length > 0 && (
            <EstadoBadge
              label={cantidadNoAprobadas === 0 ? "Todas aprobadas" : `${cantidadNoAprobadas} sin aprobar`}
              tono={cantidadNoAprobadas === 0 ? "success" : "danger"}
              titulo="Último resultado de cada línea, con los CDAs de alta de línea activos en su cadena."
            />
          )}
          <Button
            variant="outlineBlue"
            size="sm"
            onClick={() => setConfirmReejecutarTodasOpen(true)}
            isLoading={reejecutandoTodas}
            disabled={ocupado || lineasConCadena.length === 0}
            title={lineasConCadena.length === 0 ? motivoSinCadena : "Volver a evaluar todas las líneas"}
          >
            <FiRefreshCw size={13} /> Reejecutar todas
          </Button>
        </div>
      </header>

      {abierta &&
        (cargando ? (
          <div className={styles.listaCdas}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className={styles.filaCda}>
                <span className={styles.filaCdaInfo}>
                  <Skeleton width="45%" height="0.85rem" />
                  <Skeleton width="30%" height="0.7rem" />
                </span>
                <Skeleton width="5.5rem" height="1.35rem" radius="pill" />
                <Skeleton width="6rem" height="0.75rem" />
                <span />
              </div>
            ))}
          </div>
        ) : lineas.length === 0 ? (
          <p className={styles.cdasVacio}>
            Esta empresa todavía no pidió ninguna línea. Cuando dé de alta una, los CDAs de alta de línea
            van a aparecer acá.
          </p>
        ) : (
          <div className={styles.listaCdas}>
            {lineas.map((linea) => {
              const detalle = detallePorLinea.get(linea.id);
              const expandida = lineaExpandida === linea.id;
              const tieneDetalle = detalle.cdas.length > 0;
              const identidad = `N°${linea.id} · ${linea.cadenaNombre} · ${linea.monto}`;
              const mostrarRechazos = detalle.estado === "rechazado" && detalle.rechazos.length > 0;

              return (
                <React.Fragment key={linea.id}>
                  <FilaCda
                    titulo={linea.nombre}
                    etiquetas={
                      <span
                        className={`${styles.lineaEstadoPill} ${styles[`lineaEstadoPill-${getEstadoTono(linea.estadoTexto)}`]}`}
                        title={
                          linea.rechazoAutomatico
                            ? "La solicitud se rechazó automáticamente al darla de alta. Reejecutar los CDAs no cambia su estado."
                            : `Estado de la solicitud: ${linea.estadoTexto}`
                        }
                      >
                        {linea.rechazoAutomatico ? "Rechazo automático" : linea.estadoTexto}
                      </span>
                    }
                    detalle={
                      detalle.errorHistorial
                        ? `${identidad} · No se pudo consultar el historial de CDAs`
                        : mostrarRechazos
                          ? `${identidad} · No superó: ${detalle.rechazos.join("; ")}`
                          : identidad
                    }
                    detalleRechazo={mostrarRechazos}
                    estadoLabel={detalle.estado ? ESTADO_LABEL_EFECTIVO[detalle.estado] : "Sin evaluar"}
                    fecha={detalle.ultimaFecha}
                    expandible={tieneDetalle}
                    expandido={expandida}
                    onToggle={() => setLineaExpandida(expandida ? null : linea.id)}
                    acciones={
                      <AccionIcono
                        icono={<FiRefreshCw size={14} />}
                        etiqueta={`Volver a ejecutar los CDAs de la línea N°${linea.id}`}
                        onClick={() => handleReejecutarLinea(linea)}
                        cargando={lineaEnCurso === linea.id}
                        disabled={ocupado || !linea.cadena}
                        motivoDeshabilitado={!linea.cadena ? motivoSinCadena : undefined}
                      />
                    }
                  />

                  {expandida && tieneDetalle && (
                    <div className={styles.filaCdaHijos}>
                      {detalle.cdas.map((item) => {
                        const valor = String(item.valorresultado ?? item.ValorResultado ?? "").trim();
                        const motivo = !item.vinculado
                          ? "Este CDA ya no está vinculado a esta cadena: no pesa en el resultado."
                          : !linea.cadena
                            ? motivoSinCadena
                            : undefined;
                        return (
                          <FilaCda
                            key={item.cdaid}
                            hija
                            desvinculada={!item.vinculado}
                            titulo={descripcionPorCda.get(item.cdaid) || item.expresion || `CDA #${item.cdaid}`}
                            etiquetas={
                              !item.vinculado && (
                                <span className={styles.cdaRowDesvinculadoPill} title={motivo}>
                                  <FiX size={10} /> Desvinculado
                                </span>
                              )
                            }
                            detalle={valor ? `Valor: ${valor}` : "Sin dato de la integración"}
                            estadoLabel={
                              ESTADO_LABEL_POR_ID[Number(item.estadoexecutecdaid ?? item.EstadoExecuteCdaID)] ||
                              "Pendiente"
                            }
                            fecha={item.momentocontrol ?? item.MomentoControl}
                            acciones={
                              <>
                                <AccionIcono
                                  icono={<FiEye size={14} />}
                                  etiqueta="Ver expresión evaluada"
                                  onClick={() => setVerExpresionItem(item)}
                                />
                                <AccionIcono
                                  icono={<FiRefreshCw size={14} />}
                                  etiqueta="Volver a ejecutar este CDA"
                                  onClick={() => handleReejecutarCda(linea, item)}
                                  cargando={cdaEnCurso === `${linea.id}-${item.cdaid}`}
                                  disabled={ocupado || !linea.cadena || !item.vinculado}
                                  motivoDeshabilitado={motivo}
                                />
                              </>
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}

      <VerExpresionModal
        item={verExpresionItem}
        onClose={() => setVerExpresionItem(null)}
        descripcion={verExpresionItem ? descripcionPorCda.get(Number(verExpresionItem.cdaid)) : ""}
        reglaGlobal={verExpresionItem ? reglaGlobalPorCda.get(Number(verExpresionItem.cdaid)) : ""}
      />

      <ConfirmacionModal
        isOpen={confirmReejecutarTodasOpen}
        onClose={() => {
          if (!reejecutandoTodas) setConfirmReejecutarTodasOpen(false);
        }}
        onConfirm={handleReejecutarTodas}
        titulo="Reejecutar CDAs de todas las líneas"
        mensaje={`Se van a volver a evaluar los CDAs de ${
          lineasConCadena.length === 1 ? "la línea" : `las ${lineasConCadena.length} líneas`
        } de esta empresa, una por una, con los criterios activos de cada cadena. Cada evaluación vuelve a consultar las integraciones (Nosis, ARCA) y el estado de las solicitudes no cambia. ¿Confirmás que querés continuar?`}
        variant="blue"
        confirmText="Reejecutar todas"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={reejecutandoTodas}
      />
    </section>
  );
}

function CdasTab({ socio, cadenaValorIdDetectada, nombreCadenaDetectada }) {
  const { descripcionPorCda, reglaGlobalPorCda } = useMapasCatalogoCdas();

  return (
    <div className={styles.cdasScroll}>
      <CdasEmpresaPanel
        socio={socio}
        cadenaValorIdDetectada={cadenaValorIdDetectada}
        nombreCadenaDetectada={nombreCadenaDetectada}
      />
      <CdasTercerosSection
        socio={socio}
        cadenaValorId={cadenaValorIdDetectada}
        descripcionPorCda={descripcionPorCda}
        reglaGlobalPorCda={reglaGlobalPorCda}
      />
      <CdasLineasSection
        socio={socio}
        descripcionPorCda={descripcionPorCda}
        reglaGlobalPorCda={reglaGlobalPorCda}
      />
    </div>
  );
}

function CdasEmpresaPanel({ socio, cadenaValorIdDetectada, nombreCadenaDetectada }) {
  const queryClient = useQueryClient();
  const [cdaEnCurso, setCdaEnCurso] = useState(null);
  const [isReejecutandoGrupo, setIsReejecutandoGrupo] = useState(false);
  const [confirmReejecutarGrupoOpen, setConfirmReejecutarGrupoOpen] = useState(false);
  const [abiertaAlta, setAbiertaAlta] = useState(true);

  const {
    data: ejecucionesData,
    isLoading,
    isError,
  } = useObtenerExecuteCda(socio.socioid);

  const hayCadenaDetectada = !!cadenaValorIdDetectada;

  // Definición VIGENTE del grupo (ExpresionAgrupacion + CDAs activos) para la
  // cadena detectada — se usa para recalcular el estado combinado sin
  // pegarle de nuevo al backend (ver calcularEstadoEfectivo).
  const { data: grupoDataElegido, isLoading: isLoadingGrupoElegido } =
    useObtenerGrupoCdaConCdas(cadenaValorIdDetectada, PANTALLA_EMPRESA);

  const { data: estadosExecuteCda } = useEstadoExecuteCda();
  const { data: todosCdas } = useObtenerTodosCdas();
  const { mutate: reejecutar, isPending: isReejecutando } = useReejecutarCda();

  const descripcionPorCda = useMemo(() => {
    const mapa = new Map();
    const lista = Array.isArray(todosCdas) ? todosCdas : [];
    lista.forEach((cda) => {
      const id = Number(cda.cdaid);
      mapa.set(id, cda.descripcion || cda.expresion);
    });
    return mapa;
  }, [todosCdas]);

  // Regla global de cada CDA (expresion + simbolocomparacion + valorcomparacion,
  // ver CdaPanel.jsx), usada como punto de partida al forzar una expresión
  // particular: el valor efectivo por cadena puede diferir (CdaCadenaValor),
  // pero acá el admin puede editarlo libremente antes de reejecutar.
  const reglaGlobalPorCda = useMemo(() => {
    const mapa = new Map();
    const lista = Array.isArray(todosCdas) ? todosCdas : [];
    lista.forEach((cda) => {
      const id = Number(cda.cdaid);
      const partes = [cda.expresion, cda.simbolocomparacion, cda.valorcomparacion]
        .filter((p) => p !== undefined && p !== null && String(p).trim() !== "");
      mapa.set(id, partes.join(" "));
    });
    return mapa;
  }, [todosCdas]);

  const [forzarItem, setForzarItem] = useState(null);
  const [expresionForzada, setExpresionForzada] = useState("");
  const [confirmForzarOpen, setConfirmForzarOpen] = useState(false);
  const [resultadoPrueba, setResultadoPrueba] = useState(null);
  const [verExpresionItem, setVerExpresionItem] = useState(null);
  const { mutateAsync: probarCda, isPending: isProbando } = useProbarCda();

  const abrirForzarExpresion = (item) => {
    setForzarItem(item);
    setExpresionForzada(reglaGlobalPorCda.get(Number(item.cdaid)) || "");
    setResultadoPrueba(null);
  };

  const cerrarForzarExpresion = () => {
    setForzarItem(null);
    setExpresionForzada("");
    setConfirmForzarOpen(false);
    setResultadoPrueba(null);
  };

  // Mismo criterio que el Laboratorio de Pruebas de CDAs Globales
  // (CdasGlobales.jsx, ver getResultadoPrueba): 202/406 son resultados de
  // negocio válidos (se cumple o no), 400/409/500 son errores de la propia
  // expresión o de datos faltantes. Se prueba contra cda/execute:test
  // (sandbox, no toca historial) antes de forzar de verdad con cda/execute
  // (que sí lo persiste).
  const interpretarResultadoPrueba = (status) => {
    switch (status) {
      case 202:
        return {
          tono: "success",
          label: "202 · VERDADERO",
          descripcion: "La expresión se cumple: el CDA pasaría con este dato.",
        };
      case 406:
        return {
          tono: "warning",
          label: "406 · FALSO",
          descripcion: "La expresión es válida, pero no se cumple para este socio.",
        };
      case 400:
        return {
          tono: "danger",
          label: "400 · CDA INEXISTENTE",
          descripcion: "El backend no encuentra un criterio para evaluar esta expresión.",
        };
      case 409:
        return {
          tono: "danger",
          label: "409 · DATO FALTANTE",
          descripcion: "Falta un dato necesario para evaluar la expresión.",
        };
      case 500:
        return {
          tono: "danger",
          label: "500 · EXPRESIÓN INVÁLIDA",
          descripcion: "Hay un error de sintaxis o formato en la expresión.",
        };
      default:
        return {
          tono: "danger",
          label: `${status} · ERROR`,
          descripcion: "Ocurrió un error inesperado al probar la expresión.",
        };
    }
  };

  const handleProbarExpresion = async () => {
    if (!expresionForzada.trim()) return;
    setResultadoPrueba(null);
    const { status, data } = await probarCda({
      cuit: socio.cuit,
      expresion: expresionForzada.trim(),
      expresionLog: "",
    });
    const mensaje = typeof data === "string" ? data : data?.mensaje || data?.Mensaje || "";
    const valorResuelto = data?.valor ?? data?.Valor ?? "";
    setResultadoPrueba({ ...interpretarResultadoPrueba(status), mensaje, valorResuelto });
  };

  const ultimasPorCda = useMemo(
    () => ultimaEjecucionPorCda(ejecucionesData),
    [ejecucionesData],
  );

  // grupoItem: última fila sintética CdaID=0 (resultado combinado del
  // grupo — no se puede re-ejecutar por CdaID como el resto, ver barra de
  // estado abajo). cdasIndividuales: CDAs de esa misma corrida (ver
  // obtenerCdasDeLaCorridaActual en utils/executeCda.js — desde que el
  // historial trae CadenaValorID/PantallaGrupoCdaID por fila, el batch se
  // scopea por ese contexto real en vez de solo por posición de ID).
  const { grupoItem, cdas: cdasIndividuales, cdaIdsDelCierre } = useMemo(
    () => obtenerCdasDeLaCorridaActual(ejecucionesData),
    [ejecucionesData],
  );

  // Recalcula el resultado combinado de la pantalla (aprobado/rechazado/
  // pendiente) tomando la definición VIGENTE del grupo (ExpresionAgrupacion +
  // CDAs activos, de la cadena detectada) y la última ejecución conocida de
  // cada CDA — el mismo cálculo que usa useEstadoCdaSocio para la validación
  // de acceso del cliente. Sin cadena detectada no hay forma de saber qué
  // ExpresionAgrupacion aplica, así que se sigue mostrando el crudo
  // (estadoSinCadena).
  const cdasActivosIdsGrupo = useMemo(() => {
    return (grupoDataElegido?.cdas || [])
      .filter(esCdaActivo)
      .map((c) => Number(c.cdaid ?? c.CdaId ?? c.CdaID))
      .filter((id) => !Number.isNaN(id));
  }, [grupoDataElegido]);

  // cdasIndividuales viene del batch histórico (obtenerCdasDeLaCorridaActual):
  // incluye todo lo que se ejecutó en la última corrida, aunque después se
  // haya desvinculado del grupo (ej. "Score alto" quedó Rechazado en un
  // cierre viejo y luego se sacó del grupo — su fila sigue en el historial
  // para siempre). Antes se ocultaban esas filas para no confundir con el
  // resultado combinado de arriba — pero eso escondía justo la información
  // que hace falta para entender un cambio de resultado (ver
  // cdaDefinicionCambio más abajo): ahora se muestran TODAS, marcando cuáles
  // ya no están vinculadas a esta cadena (ver "Desvinculado" en el render).
  // estadoEfectivo ya las ignora por completo (ver el filtro nuevo en
  // calcularEstadoEfectivo, utils/executeCda.js), así que la etiqueta es
  // solo informativa — no hay ambigüedad sobre si siguen pesando.
  const hayGrupoVigente = hayCadenaDetectada && !!grupoDataElegido?.grupo;

  // Vinculados primero, desvinculados al final — con el estado (activo vs.
  // desvinculado) mezclado en la lista sin ningún orden, era fácil pasar
  // por alto que había CDAs que ya no pesaban en el resultado combinado.
  //
  // ⚠️ Un desvinculado solo se muestra si sigue siendo parte de "la
  // ejecución vigente": si ALGÚN CDA que sigue vinculado ya se reevaluó
  // DESPUÉS del último cierre, el desvinculado quedó del lado de una
  // corrida ya superada — mostrarlo confunde (parece que recién se sacó
  // del grupo, cuando en realidad es historia vieja de antes de esas
  // reevaluaciones). Confirmado en vivo: reejecutar el único CDA que queda
  // vinculado, dos veces seguidas después del cierre, seguía mostrando a
  // los ya desvinculados como si nada hubiera pasado desde el cierre.
  const cdasIndividualesOrdenados = useMemo(() => {
    if (!hayGrupoVigente) return cdasIndividuales;
    const activos = [];
    const desvinculados = [];
    cdasIndividuales.forEach((item) => {
      (cdasActivosIdsGrupo.includes(Number(item.cdaid)) ? activos : desvinculados).push(item);
    });

    const idDeItem = (item) => Number(item?.socioexecutecdaid ?? item?.SocioExecuteCdaID) || 0;
    const grupoItemId = idDeItem(grupoItem);
    const huboReevaluacionPostCierre =
      !!grupoItem && activos.some((item) => idDeItem(item) > grupoItemId);
    const desvinculadosVigentes = huboReevaluacionPostCierre ? [] : desvinculados;

    return [...activos, ...desvinculadosVigentes];
  }, [cdasIndividuales, hayGrupoVigente, cdasActivosIdsGrupo, grupoItem]);

  const estadoEfectivo = useMemo(() => {
    if (!hayCadenaDetectada || isLoadingGrupoElegido) return null;
    return calcularEstadoEfectivo({
      cdasCorridaActual: cdasIndividuales,
      expresionAgrupacion: grupoDataElegido?.grupo?.expresionagrupacion,
      cdasActivosIds: cdasActivosIdsGrupo,
    });
  }, [hayCadenaDetectada, isLoadingGrupoElegido, cdasIndividuales, grupoDataElegido, cdasActivosIdsGrupo]);

  // Estado calculado SIN necesitar la ExpresionAgrupacion vigente: infiere
  // la combinación and/or del propio texto del último cierre
  // (grupoItem.expresion) y la combina con el estado más reciente de cada
  // CDA de esa corrida (cdasIndividuales ya toma la última ejecución de
  // cada uno, sea del batch original o de un forzado puntual posterior al
  // cierre). Es lo que permite mostrar, por ejemplo, que un CDA forzado a
  // Aprobado después de un cierre en Rechazado ya destraba el resultado
  // combinado, sin depender de esa expresión vigente.
  //
  // Sí usa cdasActivosIdsGrupo (la vinculación vigente, información que el
  // cliente a propósito no usa — ver useEstadoCdaSocio en useSocios.js)
  // para descartar CDAs desvinculados de la combinación. Además pasa
  // cdaIdsDelCierre (ver combinarEstadoCdas) para que un CDA ajeno al
  // cierre viejo (nunca fue miembro de él) decida solo el resultado en vez
  // de arrastrar a los miembros ya obsoletos — mismo mecanismo que usa el
  // cliente, con el filtro de vinculación vigente como plus admin. Solo se
  // pasa cdasActivosIdsGrupo cuando hay grupo vigente resuelto — sin
  // cadena detectada, sigue funcionando 100% desde el historial.
  const estadoSinCadena = useMemo(
    () =>
      combinarEstadoCdas(
        grupoItem,
        cdasIndividuales,
        hayGrupoVigente ? cdasActivosIdsGrupo : undefined,
        cdaIdsDelCierre,
      ),
    [grupoItem, cdasIndividuales, hayGrupoVigente, cdasActivosIdsGrupo, cdaIdsDelCierre],
  );

  // El badge principal muestra estadoSinCadena (lo que realmente se evaluó
  // la última vez) y NO estadoEfectivo (la definición vigente): mostrar acá
  // el recálculo vigente confundía más de lo que aclaraba — ej. un socio
  // Aprobado que pasaba a verse "Pendiente" solo porque se desvinculó un CDA
  // del grupo, sin que se haya ejecutado nada nuevo para él. cdaDefinicionCambio
  // (más abajo) ya avisa cuando la definición vigente difiere de lo
  // realmente evaluado, así que no hace falta que el badge también lo haga.
  // estadoEfectivo queda como fallback solo para cuando no hay ningún cierre
  // de grupo registrado (socio sin historial de grupo todavía).
  const estadoFinal = estadoSinCadena ?? estadoEfectivo;

  // El grupo de CDAs de esta cadena puede haberse modificado (activar/
  // desactivar un CDA, cambiar la ExpresionAgrupacion) DESPUÉS de la última
  // evaluación real de este socio — mismo problema que se corrigió para el
  // login del cliente (ver useEstadoCdaSocio en useSocios.js), pero acá SÍ
  // es información útil para el admin: si estadoEfectivo (definición
  // vigente) y estadoSinCadena (lo que realmente se evaluó la última vez)
  // difieren, reejecutar el grupo puede dar un resultado distinto al que se
  // ve arriba — en cualquier sentido (aprobado→rechazado, rechazado
  // →aprobado, o quedar pendiente).
  //
  // ⚠️ estadoSinCadena puede dar null (no solo "otro valor"): pasa cuando el
  // único CDA vigente no tiene NINGUNA ejecución dentro de "la corrida
  // actual" (ver obtenerCdasDeLaCorridaActual) — ej. se activó un CDA cuya
  // última ejecución quedó muy vieja, de antes de varios cierres — en ese
  // caso combinarEstadoCdas no tiene con qué combinar y devuelve null. Antes
  // esto apagaba el aviso por completo (exigía que AMBOS valores existieran
  // para comparar), justo en el caso donde más hace falta: el badge de
  // arriba termina mostrando estadoEfectivo puro (ver estadoFinal), sin
  // ningún respaldo del historial reciente, y el aviso se quedaba callado.
  const cdaDefinicionCambio =
    hayCadenaDetectada &&
    !isLoadingGrupoElegido &&
    !!estadoEfectivo &&
    (estadoSinCadena == null || estadoEfectivo !== estadoSinCadena);

  // Para el detalle del aviso: qué CDA vigente no tiene una ejecución
  // reciente para este socio (ni en "la corrida actual" — puede ser que
  // nunca se ejecutó, o que su última ejecución quedó vieja, de antes de
  // los últimos cierres) y qué aparece en gris (ver cdasIndividualesOrdenados)
  // — así el aviso no es solo "algo cambió" sino qué CDA puntual es.
  const cdaIdsEnCorridaActual = useMemo(
    () => new Set(cdasIndividuales.map((item) => Number(item.cdaid ?? item.CdaID))),
    [cdasIndividuales],
  );
  const cdasNuevosSinEvaluar = useMemo(() => {
    if (!hayGrupoVigente) return [];
    return cdasActivosIdsGrupo.filter((id) => !cdaIdsEnCorridaActual.has(id));
  }, [hayGrupoVigente, cdasActivosIdsGrupo, cdaIdsEnCorridaActual]);
  const cdasDesvinculadosVigentes = useMemo(
    () =>
      hayGrupoVigente
        ? cdasIndividualesOrdenados.filter((item) => !cdasActivosIdsGrupo.includes(Number(item.cdaid)))
        : [],
    [cdasIndividualesOrdenados, hayGrupoVigente, cdasActivosIdsGrupo],
  );

  // "Reejecutar grupo" corre sin ValorParticularExpresion (ver cdaService.js:
  // no es seguro mandarlo a nivel de pantalla completa), así que cualquier
  // CDA cuya última ejecución haya sido forzada vuelve a evaluarse con su
  // regla real y puede volver a dar rechazado — se lo advierte antes. Se
  // busca solo en cdasIndividuales (el batch de la corrida actual, ya
  // scopeado por el penúltimo cierre de grupo — ver su comentario más
  // arriba), NO en ultimasPorCda (todo el historial): un CDA forzado en una
  // corrida vieja y ajena a este grupo no se va a tocar al reejecutar, así
  // que no corresponde advertir sobre él.
  //
  // ⚠️ Tampoco corresponde advertir sobre un forzado que sigue en
  // cdasIndividuales pero ya se desvinculó del grupo (mismo criterio que
  // cdasActivosIdsGrupo usa en todos lados): "Reejecutar grupo" solo evalúa
  // los CDAs vigentes, así que un forzado desvinculado no se va a tocar.
  const cdasConExpresionForzada = useMemo(() => {
    const forzados = cdasIndividuales.filter((item) => item.valorparticularexpresion);
    return hayGrupoVigente
      ? forzados.filter((item) => cdasActivosIdsGrupo.includes(Number(item.cdaid)))
      : forzados;
  }, [cdasIndividuales, hayGrupoVigente, cdasActivosIdsGrupo]);

  const handleReejecutarGrupo = async () => {
    const cadenaValorId = cadenaValorIdDetectada;
    if (!cadenaValorId) {
      toast.error("No se detectó la cadena de este socio en el historial.");
      return;
    }

    setIsReejecutandoGrupo(true);
    try {
      await ejecutarGrupoAlta(socio.socioid, cadenaValorId);
    } finally {
      setIsReejecutandoGrupo(false);
      setConfirmReejecutarGrupoOpen(false);
      queryClient.invalidateQueries({
        queryKey: ["socios", "executeCda", socio.socioid],
      });
    }
  };

  const handleReejecutar = (item, valorParticularExpresion) => {
    // Reejecutar por CdaID "pelado" (sin Pantalla ni CadenaValorID) da 409
    // "Dato Requerido Faltante" para CDAs cuya expresión necesita resolver
    // un dato anidado de Nosis, aunque el dato exista — confirmado con
    // pruebas manuales (ver cdaService.reejecutarCda). Por eso se exige la
    // misma cadena que usa "Reejecutar grupo" (el botón ya queda deshabilitado
    // sin ella, ver disabled más abajo).
    //
    // ⚠️ ValorParticularExpresion solo es seguro acá, CON CdaID: confirmado
    // con pruebas manuales que si se manda SIN CdaID (a nivel de pantalla
    // completa, como hace "Reejecutar grupo") el backend NO lo matchea contra
    // el CDA que corresponde — evalúa esa expresión una sola vez y le asigna
    // el mismo resultado a TODOS los CDAs del grupo, pisando la evaluación
    // real de los demás. Por eso "Forzar expresión" nunca cierra una fila de
    // grupo nueva: sería inseguro en cualquier pantalla con más de un CDA
    // vinculado. Reportado al backend: no hay forma de forzar un único CDA y
    // cerrar el grupo en la misma llamada.
    const cadenaValorId = cadenaValorIdDetectada;
    if (!cadenaValorId) {
      toast.error("No se detectó la cadena de este socio en el historial.");
      return;
    }
    setCdaEnCurso(item.cdaid);
    reejecutar(
      {
        cdaId: item.cdaid,
        socioId: socio.socioid,
        pantalla: PANTALLA_EMPRESA,
        cadenaValorId,
        valorParticularExpresion,
      },
      {
        onSuccess: ({ status, data }) => {
          setCdaEnCurso(null);
          if (status === 202) {
            if (valorParticularExpresion) cerrarForzarExpresion();
            else setConfirmForzarOpen(false);
            toast.success("CDA aprobado", {
              description: valorParticularExpresion
                ? "Se evaluó con la expresión forzada y pasó correctamente. El resultado combinado de la pantalla ya lo refleja — pero es temporal: si más adelante se reejecuta el grupo completo, este CDA vuelve a evaluarse con su regla real y puede volver a fallar."
                : "El criterio se volvió a evaluar y pasó correctamente.",
            });
          } else if (status === 406) {
            // WSResponseCDA { Result, ListTest: [{ Result, Valor, Mensaje }] }.
            // El body de un error 4xx no pasa por el interceptor que baja las
            // keys a minúsculas (solo lo hace con respuestas exitosas), así
            // que puede llegar en PascalCase tal cual lo manda el backend.
            if (valorParticularExpresion) setConfirmForzarOpen(false);
            const listTest = data?.listtest ?? data?.ListTest ?? [];
            const rechazo = listTest.find((t) => (t.result ?? t.Result) === false);
            const mensaje =
              (rechazo && (rechazo.mensaje || rechazo.Mensaje)) ||
              (typeof data === "string" ? data : null) ||
              "El criterio no se cumple.";
            toast.error("CDA rechazado", { description: mensaje });
          } else if (status === 409) {
            if (valorParticularExpresion) setConfirmForzarOpen(false);
            toast.error("Falta un dato requerido para evaluar este CDA.");
          } else {
            if (valorParticularExpresion) setConfirmForzarOpen(false);
            toast.error("No se pudo re-ejecutar el CDA.");
          }
        },
        onError: () => {
          setCdaEnCurso(null);
          if (valorParticularExpresion) setConfirmForzarOpen(false);
          toast.error("No se pudo re-ejecutar el CDA.");
        },
      },
    );
  };

  if (isLoading) {
    return <CdasPanelSkeleton />;
  }

  if (isError) {
    return (
      <div className={styles.cdasPlaceholderBloque}>
        <div className={styles.cdasPlaceholder}>
          <FiAlertTriangle className={styles.cdasPlaceholderIcon} />
          <h3>No se pudo cargar el historial de CDAs</h3>
          <p>Ocurrió un error al consultar las evaluaciones de esta empresa. Probá de nuevo en unos segundos.</p>
        </div>
      </div>
    );
  }

  if (ultimasPorCda.length === 0) {
    return (
      <div className={styles.cdasPlaceholderBloque}>
        <div className={styles.cdasPlaceholder}>
          <FiShield className={styles.cdasPlaceholderIcon} />
          <h3>Sin evaluaciones de alta</h3>
          <p>
            Todavía no se ejecutaron los CDAs de alta para esta empresa. Elegí la cadena y ejecutalos
            para ver el resultado.
          </p>
          <EjecutarCriteriosAlta socio={socio} />
        </div>
      </div>
    );
  }

  // Sin esto, con el historial ya cargado pero el grupo vigente todavía no
  // (isLoadingGrupoElegido), hayGrupoVigente da false y el estado/lista se
  // arman sin el filtro de cdasActivosIdsGrupo — mostrando por un instante
  // el resultado crudo del historial (con CDAs ya desvinculados pesando
  // igual) que después "salta" al valor real apenas resuelve el grupo.
  // Confunde más que un spinner corto. Solo aplica si hay cadena detectada
  // (si no, no hay ningún grupo que esperar — useObtenerGrupoCdaConCdas
  // queda deshabilitado y esto nunca sería true).
  if (hayCadenaDetectada && isLoadingGrupoElegido) {
    return <CdasPanelSkeleton />;
  }

  const cantidadAltaNoAprobados = cdasIndividualesOrdenados.filter(
    (item) =>
      Number(item.estadoexecutecdaid) !== 3 &&
      (!hayGrupoVigente || cdasActivosIdsGrupo.includes(Number(item.cdaid))),
  ).length;

  const hayResultadoAlta = !!grupoItem || (hayCadenaDetectada && cdasIndividuales.length > 0);
  const estadoLabelAlta =
    hayResultadoAlta && estadoFinal ? ESTADO_LABEL_EFECTIVO[estadoFinal] : "Sin evaluar";
  const explicacionResultadoAlta = estadoSinCadena
    ? "Calculado con el último cierre y la última ejecución conocida de cada CDA."
    : estadoEfectivo
      ? `Sin un cierre de grupo registrado: se estima con la definición vigente de ${nombreCadenaDetectada}.`
      : "Todavía no se pudo determinar un resultado combinado para este socio.";

  return (
    <div className={styles.cdasBloque}>

      {cdaDefinicionCambio && (
        <div className={styles.avisoCambioCda} role="alert">
          <span className={styles.avisoCambioCdaIcon}>
            <FiAlertTriangle size={16} />
          </span>
          <div className={styles.avisoCambioCdaTexto}>
            <strong>Los criterios de {nombreCadenaDetectada} cambiaron</strong> desde
            la última evaluación de este socio.
            <span className={styles.avisoCambioCdaSub}>
              {estadoSinCadena == null ? (
                "No hay ninguna evaluación real reciente que respalde el estado que ves arriba — reejecutar el grupo puede cambiarlo."
              ) : (
                <>
                  El estado que ves arriba es el de la última evaluación real
                  (<strong>{ESTADO_LABEL_EFECTIVO[estadoSinCadena]}</strong>) — puede
                  cambiar si reejecutás el grupo.
                </>
              )}
              {cdasNuevosSinEvaluar.length > 0 && (
                <>
                  {" "}No {cdasNuevosSinEvaluar.length === 1 ? "tiene" : "tienen"} una
                  ejecución reciente:{" "}
                  {cdasNuevosSinEvaluar
                    .map((id) => descripcionPorCda.get(id) || `CDA #${id}`)
                    .join(", ")}.
                </>
              )}
              {cdasDesvinculadosVigentes.length > 0 && (
                <>
                  {" "}{cdasDesvinculadosVigentes.length === 1 ? "Ya no está vinculado" : "Ya no están vinculados"}:{" "}
                  {cdasDesvinculadosVigentes
                    .map((item) => descripcionPorCda.get(Number(item.cdaid)) || `CDA #${item.cdaid}`)
                    .join(", ")}{" "}
                  — reejecutar el grupo va a dejar de tenerlo
                  {cdasDesvinculadosVigentes.length === 1 ? "" : "s"} en cuenta.
                </>
              )}
            </span>
          </div>
        </div>
      )}

      <ConfirmacionModal
        isOpen={confirmReejecutarGrupoOpen}
        onClose={() => setConfirmReejecutarGrupoOpen(false)}
        onConfirm={handleReejecutarGrupo}
        titulo="Confirmar reejecución del grupo"
        mensaje={
          <>
            Se va a reevaluar toda la pantalla con las reglas definidas en
            CDAs Globales.
            {cdasConExpresionForzada.length > 0 && (
              <>
                <br />
                <br />
                Esto va a revertir{" "}
                {cdasConExpresionForzada.length === 1
                  ? "el forzado de:"
                  : "los forzados de:"}
                <br />
                <code className={styles.forzarModalExpresionPreview}>
                  {cdasConExpresionForzada
                    .map((item) => descripcionPorCda.get(Number(item.cdaid)) || `CDA #${item.cdaid}`)
                    .join(", ")}
                </code>
              </>
            )}
            <br />
            <br />
            ¿Confirmás que querés continuar?
          </>
        }
        variant="blue"
        tone="danger"
        confirmText="Reejecutar grupo"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isReejecutandoGrupo}
      />

      <section className={styles.cdasSection}>
        <header className={`${styles.sectionCardHeader} ${styles.cdasSectionHeaderRow}`}>
          <EncabezadoPlegable
            abierta={abiertaAlta}
            onToggle={() => setAbiertaAlta((v) => !v)}
            icono={<FiShield size={15} />}
            titulo="CDAs de alta de la empresa"
            detalle={`${cdasIndividualesOrdenados.length} CDA${cdasIndividualesOrdenados.length !== 1 ? "s" : ""}${
              cantidadAltaNoAprobados > 0 ? ` · ${cantidadAltaNoAprobados} sin aprobar` : ""
            }`}
          />
          <div className={styles.cdasSectionHeaderActions}>
            {grupoItem ? (
              <span className={styles.cdasSectionMeta} title={formatearMomentoControl(grupoItem.momentocontrol)}>
                Último cierre {formatearFechaCorta(grupoItem.momentocontrol)}
              </span>
            ) : !hayCadenaDetectada ? (
              <span
                className={styles.cdasSectionMeta}
                title="Este socio todavía no tiene ejecuciones con la cadena registrada: no se puede reejecutar desde acá."
              >
                Cadena no detectada
              </span>
            ) : null}
            <EstadoBadge label={`Resultado: ${estadoLabelAlta}`} titulo={explicacionResultadoAlta} />
            <Button
              variant="outlineBlue"
              size="sm"
              onClick={() => setConfirmReejecutarGrupoOpen(true)}
              isLoading={isReejecutandoGrupo}
              disabled={isReejecutandoGrupo || !hayCadenaDetectada}
              title={!hayCadenaDetectada ? "No se detectó la cadena de este socio" : "Volver a evaluar todos los CDAs de alta"}
            >
              <FiRefreshCw size={13} /> Reejecutar grupo
            </Button>
          </div>
        </header>
        {abiertaAlta && (
          <div className={styles.listaCdas}>
            {cdasIndividualesOrdenados.map((item, index) => {
              const estadoLabel =
                resolverLabel(estadosExecuteCda?.opciones, item.estadoexecutecdaid) || "Desconocido";
              const descripcion =
                descripcionPorCda.get(Number(item.cdaid)) || item.expresion || `CDA #${item.cdaid}`;
              const estaVinculado =
                !hayGrupoVigente || cdasActivosIdsGrupo.includes(Number(item.cdaid));
              const anteriorVinculado =
                index > 0 &&
                (!hayGrupoVigente ||
                  cdasActivosIdsGrupo.includes(Number(cdasIndividualesOrdenados[index - 1].cdaid)));
              const esInicioDeDesvinculados =
                hayGrupoVigente && !estaVinculado && (index === 0 || anteriorVinculado);
              const puedeForzar = getEstadoTono(estadoLabel) !== "success";
              const fueForzado = !!item.valorparticularexpresion;
              const motivo = !estaVinculado
                ? "Este CDA ya no está vinculado a esta cadena: no pesa en el resultado combinado actual."
                : !hayCadenaDetectada
                  ? "No se detectó la cadena de este socio"
                  : undefined;
              const deshabilitado = isReejecutando || !hayCadenaDetectada || !estaVinculado;

              return (
                <React.Fragment key={item.cdaid}>
                  {esInicioDeDesvinculados && (
                    <p className={styles.listaCdasSubtitulo}>Ya no vinculados a esta cadena</p>
                  )}
                  <FilaCda
                    titulo={descripcion}
                    desvinculada={!estaVinculado}
                    etiquetas={
                      <>
                        {fueForzado && (
                          <span
                            className={styles.cdaRowForzadoPill}
                            title="Este resultado se forzó con una expresión personalizada"
                          >
                            <FiEdit3 size={10} /> Forzado
                          </span>
                        )}
                        {!estaVinculado && (
                          <span className={styles.cdaRowDesvinculadoPill} title={motivo}>
                            <FiX size={10} /> Desvinculado
                          </span>
                        )}
                      </>
                    }
                    detalle={item.valorresultado ? `Valor: ${item.valorresultado}` : "Sin dato de la integración"}
                    estadoLabel={estadoLabel}
                    fecha={item.momentocontrol}
                    acciones={
                      <>
                        {puedeForzar && (
                          <AccionIcono
                            icono={<FiEdit3 size={14} />}
                            etiqueta="Forzar expresión"
                            onClick={() => abrirForzarExpresion(item)}
                            disabled={deshabilitado}
                            motivoDeshabilitado={motivo}
                          />
                        )}
                        <AccionIcono
                          icono={<FiEye size={14} />}
                          etiqueta="Ver expresión evaluada"
                          onClick={() => setVerExpresionItem(item)}
                        />
                        <AccionIcono
                          icono={<FiRefreshCw size={14} />}
                          etiqueta="Volver a ejecutar este CDA"
                          onClick={() => handleReejecutar(item)}
                          cargando={isReejecutando && cdaEnCurso === item.cdaid}
                          disabled={deshabilitado}
                          motivoDeshabilitado={motivo}
                        />
                      </>
                    }
                  />
                </React.Fragment>
              );
            })}
          </div>
        )}
      </section>

      <VerExpresionModal
        item={verExpresionItem}
        onClose={() => setVerExpresionItem(null)}
        descripcion={verExpresionItem ? descripcionPorCda.get(Number(verExpresionItem.cdaid)) : ""}
        reglaGlobal={verExpresionItem ? reglaGlobalPorCda.get(Number(verExpresionItem.cdaid)) : ""}
      />

      <Modal
        isOpen={!!forzarItem}
        onClose={cerrarForzarExpresion}
        title="Forzar evaluación"
        subtitle={forzarItem ? descripcionPorCda.get(Number(forzarItem.cdaid)) : ""}
        icono={<FiZap />}
        tono="advertencia"
        variant="blue"
        maxWidth="620px"
        preventClose={isReejecutando}
        footer={
          <>
            <span className={styles.forzarPieAyuda}>
              {resultadoPrueba ? "" : "Se habilita al probar la expresión"}
            </span>
            <Button variant="adminNeutro" onClick={cerrarForzarExpresion} disabled={isReejecutando}>
              Cancelar
            </Button>
            <Button
              variant="adminAdvertencia"
              onClick={() => setConfirmForzarOpen(true)}
              disabled={!expresionForzada.trim() || !resultadoPrueba || isReejecutando}
            >
              <FiZap aria-hidden="true" />
              Forzar evaluación
            </Button>
          </>
        }
      >
        {forzarItem && (
          <div className={styles.forzarModalBody}>
            <div className={styles.warnCallout}>
              <FiAlertTriangle className={styles.warnIcono} aria-hidden="true" />
              <p className={styles.warnText}>
                Evalúa <strong>solo este criterio</strong> con la expresión que
                escribas, en vez de la definida en CDAs Globales. Usalo cuando el
                rechazo se deba a un valor límite que consideres{" "}
                <strong>salvable</strong> para este socio: queda registrado en el
                historial. Es temporal: si se reejecuta el grupo completo, vuelve
                a evaluarse con su regla real y puede volver a fallar.
              </p>
            </div>

            <div className={styles.forzarPaso}>
              <span className={`${styles.forzarPasoNumero} ${styles.forzarPasoActivo}`}>1</span>
              <div className={styles.forzarPasoCuerpo}>
                <h4 className={styles.forzarSectionLabel}>Regla global</h4>
                <code className={styles.forzarReglaGlobal}>
                  {reglaGlobalPorCda.get(Number(forzarItem.cdaid)) || "—"}
                </code>
              </div>
            </div>

            <div className={styles.forzarPaso}>
              <span className={`${styles.forzarPasoNumero} ${styles.forzarPasoActivo}`}>2</span>
              <div className={styles.forzarPasoCuerpo}>
                <h4 className={styles.forzarSectionLabel}>Expresión a forzar</h4>
                <InputSimple
                  type="textarea"
                  label="Expresión"
                  value={expresionForzada}
                  onChange={(val) => {
                    setExpresionForzada(val);
                    setResultadoPrueba(null);
                  }}
                  variant="admin"
                  rows={3}
                  hideErrorSpace
                />
                <p className={styles.forzarHelperText}>
                  Los valores de texto van entre comillas simples (ej. 'REINA');
                  los numéricos y las fechas (AAAA-MM-DD) van sin comillas.
                </p>
              </div>
            </div>

            <div className={styles.forzarPaso}>
              <span className={`${styles.forzarPasoNumero} ${expresionForzada.trim() ? styles.forzarPasoActivo : ""}`}>3</span>
              <div className={styles.forzarPasoCuerpo}>
                <h4 className={styles.forzarSectionLabel}>Probar antes de forzar</h4>
                <div className={styles.sandboxFila}>
                  <span className={styles.sandboxCuitLabel}>
                    {expresionForzada.trim()
                      ? `Se prueba contra ${socio.denominacion || "el socio"} · CUIT ${formatCuit(socio.cuit)}`
                      : "Escribí una expresión arriba para poder probarla."}
                  </span>
                  <Button
                    type="button"
                    variant="adminSuave"
                    size="sm"
                    onClick={handleProbarExpresion}
                    isLoading={isProbando}
                    disabled={!expresionForzada.trim() || isProbando}
                  >
                    <FiPlay aria-hidden="true" />
                    Probar
                  </Button>
                </div>

                {resultadoPrueba && (
                  <div className={`${styles.testResultBox} ${styles[`testResult-${resultadoPrueba.tono}`] || ""}`}>
                    <div className={styles.testResultHeader}>
                      <span className={styles[`testBadge${resultadoPrueba.tono.charAt(0).toUpperCase()}${resultadoPrueba.tono.slice(1)}`]}>
                        {resultadoPrueba.label}
                      </span>
                      <button
                        type="button"
                        className={styles.testResultCloseBtn}
                        onClick={() => setResultadoPrueba(null)}
                        title="Cerrar resultado"
                        aria-label="Cerrar resultado"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                    <div className={styles.testResultMessage}>{resultadoPrueba.descripcion}</div>
                    {(resultadoPrueba.valorResuelto || resultadoPrueba.mensaje) && (
                      <div className={styles.testResultDatos}>
                        {resultadoPrueba.valorResuelto && (
                          <span>
                            Valor resuelto <code>{resultadoPrueba.valorResuelto}</code>
                          </span>
                        )}
                        {resultadoPrueba.mensaje && (
                          <span>
                            Mensaje del backend <code>{resultadoPrueba.mensaje}</code>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmacionModal
        isOpen={confirmForzarOpen}
        onClose={() => setConfirmForzarOpen(false)}
        onConfirm={() => handleReejecutar(forzarItem, expresionForzada)}
        titulo="Confirmar expresión forzada"
        mensaje={
          <>
            Se va a evaluar este criterio con la expresión:
            <br />
            <code className={styles.forzarModalExpresionPreview}>{expresionForzada}</code>
            <br />
            El resultado combinado de la pantalla ya lo va a reflejar apenas
            se guarde. Pero es temporal: si más adelante se reejecuta el
            grupo completo, este CDA vuelve a evaluarse con su regla real
            (sin este forzado) y puede volver a fallar.
            <br />
            ¿Confirmás que querés forzar esta evaluación?
          </>
        }
        variant="blue"
        tone="warning"
        confirmText="Forzar y reejecutar"
        cancelText="Cancelar"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isReejecutando && cdaEnCurso === forzarItem?.cdaid}
      />
    </div>
  );
}

// Muestra la regla definida en CDAs Globales y, si el resultado se forzó con
// una expresión personalizada (ver abrirForzarExpresion), también esa
// expresión y quién la ejecutó — la fila de historial ya trae UsuarioWebID,
// solo hace falta resolverlo a nombre (ver NombreUsuario).
const normalizarExpresion = (texto) => String(texto || "").replace(/\s+/g, "").toLowerCase();

function VerExpresionModal({ item, onClose, descripcion, reglaGlobal }) {
  const fueForzado = !!item?.valorparticularexpresion;
  const expresionEvaluada = String(item?.expresion ?? item?.Expresion ?? "").trim();
  const usaValorDeCadena =
    !fueForzado &&
    !!expresionEvaluada &&
    !!reglaGlobal &&
    normalizarExpresion(expresionEvaluada) !== normalizarExpresion(reglaGlobal);
  const estadoId = Number(item?.estadoexecutecdaid ?? item?.EstadoExecuteCdaID);
  const valorResuelto = String(item?.valorresultado ?? item?.ValorResultado ?? "").trim();
  const veredicto =
    estadoId === 3 ? "Cumple la regla" : estadoId === 2 ? "No cumple la regla" : "Sin resultado";

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Expresión evaluada"
      subtitle={descripcion}
      icono={<FiCode />}
      variant="blue"
      maxWidth="580px"
      footer={
        <Button variant="adminNeutro" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {item && (
        <div className={styles.forzarModalBody}>
          <div className={styles.forzarSection}>
            <h4 className={styles.forzarSectionLabel}>
              {fueForzado ? "Expresión forzada" : "Regla que se evaluó"}
              {usaValorDeCadena && (
                <span
                  className={styles.expresionCadenaPill}
                  title="Esta cadena tiene un valor de comparación propio, distinto del definido en CDAs Globales."
                >
                  Valor de la cadena
                </span>
              )}
            </h4>
            <code className={fueForzado ? styles.cdaRowForzadoCode : styles.forzarReglaGlobal}>
              {fueForzado ? item.valorparticularexpresion : expresionEvaluada || reglaGlobal || "—"}
            </code>
            {(usaValorDeCadena || fueForzado) && reglaGlobal && (
              <p className={styles.forzarHelperText}>
                Regla global en CDAs Globales: <code className={styles.expresionGlobalInline}>{reglaGlobal}</code>
              </p>
            )}
          </div>

          <div className={styles.forzarSection}>
            <h4 className={styles.forzarSectionLabel}>Resultado</h4>
            <div className={styles.expresionResultado}>
              <code className={styles.forzarReglaGlobal}>{valorResuelto || "Sin dato de la integración"}</code>
              <EstadoBadge
                label={veredicto}
                tono={estadoId === 3 ? "success" : estadoId === 2 ? "danger" : "neutral"}
              />
            </div>
          </div>

          <div className={styles.forzarSection}>
            <h4 className={styles.forzarSectionLabel}>{fueForzado ? "Forzado por" : "Ejecutado por"}</h4>
            <p className={styles.forzarHelperText}>
              <NombreUsuario usuarioId={item.usuariowebid} /> · {formatearMomentoControl(item.momentocontrol)}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}

// El historial completo vive en un modal aparte (disparado desde un botón en
// la barra de tabs, solo visible en la pestaña CDAs) para que una empresa con
// muchos CDAs y mucha actividad no sature la pestaña principal con una lista
// que puede crecer indefinidamente. Reutiliza la misma query que CdasTab
// (misma queryKey de react-query), así que no pega otra request de red.
function HistorialCdaModal({ isOpen, onClose, socio }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [abiertas, setAbiertas] = useState({});
  const { data: ejecucionesData, isLoading, isError } = useObtenerExecuteCda(socio.socioid);
  const { data: estadosExecuteCda } = useEstadoExecuteCda();
  const { data: todosCdas } = useObtenerTodosCdas();

  const descripcionPorCda = useMemo(() => {
    const mapa = new Map();
    const lista = Array.isArray(todosCdas) ? todosCdas : [];
    lista.forEach((cda) => {
      const id = Number(cda.cdaid);
      mapa.set(id, cda.descripcion || cda.expresion);
    });
    return mapa;
  }, [todosCdas]);

  const historialCompleto = useMemo(
    () => ordenarEjecucionesCda(ejecucionesData),
    [ejecucionesData],
  );

  // El CdaID 0 es la fila sintética con el resultado combinado de una corrida
  // de pantalla completa (ver nota en CdasTab). Se aprovecha acá como
  // separador visual: cada vez que aparece una, arranca una ejecución nueva y
  // los CDA puntuales que siguen (más viejos, hasta la próxima fila CdaID 0)
  // quedan agrupados bajo ella. Lo que haya más nuevo que la primera fila
  // CdaID 0 (ej. un "Volver a ejecutar" puntual sin corrida de pantalla
  // asociada todavía) queda suelto, sin agrupar.
  const { sueltos, corridas } = useMemo(() => {
    const sueltosList = [];
    const corridasList = [];
    let actual = null;
    historialCompleto.forEach((item) => {
      if (Number(item.cdaid) === 0) {
        actual = { grupo: item, items: [] };
        corridasList.push(actual);
      } else if (actual) {
        actual.items.push(item);
      } else {
        sueltosList.push(item);
      }
    });
    return { sueltos: sueltosList, corridas: corridasList };
  }, [historialCompleto]);

  const datosDe = (item) => {
    const estadoLabel =
      resolverLabel(estadosExecuteCda?.opciones, item.estadoexecutecdaid) || "Desconocido";
    const estadoId = Number(item.estadoexecutecdaid);
    const tono = estadoId === 3 ? "success" : estadoId === 2 ? "danger" : getEstadoTono(estadoLabel);
    const descripcion =
      descripcionPorCda.get(Number(item.cdaid)) || item.expresion || `CDA #${item.cdaid}`;
    return { estadoLabel, tono, descripcion };
  };

  const coincide = (item) => {
    const { tono, descripcion } = datosDe(item);
    if (filtro === "cumple" && tono !== "success") return false;
    if (filtro === "noCumple" && tono !== "danger") return false;
    if (filtro === "forzados" && !item.valorparticularexpresion) return false;
    const q = busqueda.trim().toLowerCase();
    return !q || descripcion.toLowerCase().includes(q);
  };

  const hayFiltro = filtro !== "todos" || !!busqueda.trim();
  const cantidadForzados = historialCompleto.filter((i) => i.valorparticularexpresion).length;
  const sueltosVisibles = sueltos.filter(coincide);
  const corridasVisibles = corridas
    .map((c) => ({ ...c, items: hayFiltro ? c.items.filter(coincide) : c.items }))
    .filter((c) => !hayFiltro || c.items.length > 0);

  const alternar = (id) => setAbiertas((prev) => ({ ...prev, [id]: !estaAbierta(id) }));
  const estaAbierta = (id) => (id in abiertas ? abiertas[id] : hayFiltro || id === corridas[0]?.grupo.socioexecutecdaid);

  const renderFila = (item) => {
    const { estadoLabel, tono, descripcion } = datosDe(item);
    return (
      <div key={item.socioexecutecdaid} className={styles.historialFila}>
        <span className={`${styles.dot} ${styles[`dot-${tono}`]}`} />
        <span className={styles.historialFilaTexto}>
          <span className={styles.historialFilaNombre}>{descripcion}</span>
          <span className={styles.cdaHistorialMeta}>
            {formatearMomentoControl(item.momentocontrol)} · <NombreUsuario usuarioId={item.usuariowebid} />
          </span>
        </span>
        {item.valorparticularexpresion && (
          <span className={styles.historialForzado} title={item.valorparticularexpresion}>
            <FiEdit3 size={11} /> Forzado con: {item.valorparticularexpresion}
          </span>
        )}
        <span className={`${styles.historialEstado} ${styles[`historialEstado-${tono}`]}`}>{estadoLabel}</span>
      </div>
    );
  };

  const renderCorrida = ({ grupo, items }) => {
    const { estadoLabel, tono } = datosDe(grupo);
    const id = grupo.socioexecutecdaid;
    const abierta = estaAbierta(id);
    return (
      <div key={id} className={styles.historialCorrida}>
        <button type="button" className={styles.historialCorridaCabecera} onClick={() => alternar(id)} aria-expanded={abierta}>
          <span className={`${styles.historialCorridaIcono} ${styles[`historialCorridaIcono-${tono}`]}`} aria-hidden="true">
            {tono === "success" ? <FiCheckCircle /> : tono === "danger" ? <FiX /> : <FiClock />}
          </span>
          <span className={styles.historialFilaTexto}>
            <span className={styles.historialFilaNombre}>Evaluación del {formatearMomentoControl(grupo.momentocontrol)}</span>
            <span className={styles.cdaHistorialMeta}>
              Resultado general:{" "}
              <strong className={styles[`historialTexto-${tono}`]}>{estadoLabel}</strong>
              {items.length > 0 && ` · ${items.length} ${items.length === 1 ? "criterio" : "criterios"}`}
            </span>
          </span>
          <FiChevronDown className={`${styles.historialChevron} ${abierta ? styles.historialChevronAbierto : ""}`} aria-hidden="true" />
        </button>
        {abierta && (
          <div className={styles.historialCorridaItems}>
            {items.map(renderFila)}
            {grupo.expresion && <code className={styles.historialExpresion}>{grupo.expresion}</code>}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de criterios"
      subtitle={socio?.denominacion}
      icono={<FiClock />}
      variant="blue"
      maxWidth="700px"
      footer={
        <>
          {historialCompleto.length > 0 && (
            <span className={styles.forzarPieAyuda}>
              {corridas.length + sueltos.length} evaluaciones
              {cantidadForzados > 0 && ` · ${cantidadForzados} ${cantidadForzados === 1 ? "forzada" : "forzadas"}`}
            </span>
          )}
          <Button variant="adminNeutro" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      {isLoading ? (
        <div className={styles.historialModalList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.historialCorrida}>
              <div className={styles.historialCorridaCabecera}>
                <Skeleton width="2rem" height="2rem" radius="0.55rem" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="45%" height="0.85rem" />
                  <Skeleton width="30%" height="0.7rem" style={{ marginTop: "0.4rem" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <p className={styles.historialModalMsg}>
          Ocurrió un error al consultar el historial. Probá de nuevo en unos segundos.
        </p>
      ) : historialCompleto.length === 0 ? (
        <p className={styles.historialModalMsg}>
          Todavía no se ejecutó ningún Criterio de Aceptación para esta empresa.
        </p>
      ) : (
        <div className={styles.historialModalList}>
          <div className={styles.historialFiltros}>
            <label className={styles.historialBuscador}>
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar criterio"
                aria-label="Buscar criterio"
              />
            </label>
            <div className={styles.historialSegmento} role="group" aria-label="Filtrar por resultado">
              {[
                ["todos", "Todos"],
                ["cumple", "Cumple"],
                ["noCumple", "No cumple"],
                ["forzados", "Forzados"],
              ].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  type="button"
                  className={filtro === valor ? styles.historialSegmentoActivo : ""}
                  aria-pressed={filtro === valor}
                  onClick={() => setFiltro(valor)}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>

          {corridasVisibles.map(renderCorrida)}
          {sueltosVisibles.map((item) => (
            <div key={item.socioexecutecdaid} className={`${styles.historialCorrida} ${styles.historialSuelto}`}>
              {renderFila(item)}
            </div>
          ))}
          {corridasVisibles.length === 0 && sueltosVisibles.length === 0 && (
            <p className={styles.historialModalMsg}>Ningún registro coincide con el filtro.</p>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function EmpresaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("datos");
  const [historialOpen, setHistorialOpen] = useState(false);
  const [notificarOpen, setNotificarOpen] = useState(false);
  const usuarioWebAdminId = useAuthStore((state) => state.user?.usuarioWebId) || 0;
  // Feedback del botón de descarga del legajo completo (SGRPLUSPLA-199).
  const { descargar, faseDe } = useDescargaConFeedback();

  // Defensa en profundidad: ver useBloqueoAdminRestringido — un usuario
  // vinculado solo por UsuarioCadenaValor no debería poder ver el detalle de
  // NINGUNA empresa (esta pantalla no filtra por cadena propia).
  const bloqueado = useBloqueoAdminRestringido();

  const { data: socio, isLoading } = useSocioPorId(id);
  // Mismo hook/queryKey que ya usa UsuariosVinculadosSection (ver DatosTab
  // más abajo) - react-query lo dedupea, así que esto no duplica el
  // request, solo expone la lista acá arriba para pasársela a
  // NotificarSocioModal (permitir elegir a qué usuario vinculado avisar,
  // no solo al email de la empresa).
  const { usuariosVinculados } = useUsuariosVinculadosASocio(socio?.socioid);
  const { data: estadosSocio } = useEstadoSocio();

  const {
    cadenaValorId: cadenaValorIdDetectada,
    origen: origenCadena,
    candidatas: cadenasCandidatas,
    elegirCadena,
  } = useCadenaDelSocio(socio?.socioid);
  const { data: cadenasWeb } = useObtenerTodasWebConEstado();
  const opcionesCadena = useMemo(() => {
    const etiquetaOrigen = new Map(
      cadenasCandidatas.map((c) => [c.cadenaValorId, c.origen === ORIGEN_CADENA_LINEA ? "línea" : "alta"]),
    );
    const nombrePorId = new Map(
      (cadenasWeb || []).map((c) => [Number(c.cadenavalorid), c.denominacion || `Cadena #${c.cadenavalorid}`]),
    );
    const ids = [...new Set([...etiquetaOrigen.keys(), ...nombrePorId.keys()])].filter(Boolean);
    return ids.map((id) => ({
      value: String(id),
      label: etiquetaOrigen.has(id)
        ? `${nombrePorId.get(id) || `Cadena #${id}`} · ${etiquetaOrigen.get(id)}`
        : nombrePorId.get(id),
    }));
  }, [cadenasCandidatas, cadenasWeb]);
  const nombreCadenaDetectada = useMemo(() => {
    if (!cadenaValorIdDetectada) return null;
    const fila = (cadenasWeb || []).find(
      (c) => Number(c.cadenavalorid) === cadenaValorIdDetectada,
    );
    return fila?.denominacion || `Cadena #${cadenaValorIdDetectada}`;
  }, [cadenasWeb, cadenaValorIdDetectada]);

  // Vistazo rápido del estado del legajo (documentación + terceros
  // relacionados juntos) para el badge del header — mismo criterio que ya
  // usa el badge "Obligatorio" de cada pestaña, así que nunca se contradicen.
  const { requisitosCompletados, totalRequisitos, isLoading: isLoadingLegajo } =
    useValidacionLegajo({
      adminMode: true,
      socioIdActivo: socio?.socioid,
      tipoPersonaId: socio?.tipopersonaid,
      nombreEmpresa: socio?.denominacion,
      cadenaId: cadenaValorIdDetectada,
    });

  // Vive acá (no dentro de DocumentacionTab) porque el botón se muestra en
  // la fila de tabs, junto a "Ver historial completo" de CDAs — misma
  // queryKey que ya invalida DocumentosLegajo al subir/borrar archivos.
  const { data: archivosBackend = [] } = useQuery({
    queryKey: ["socioArchivos", socio?.socioid],
    queryFn: () => socioArchivoService.obtenerArchivos(socio.socioid, true),
    enabled: !!socio?.socioid,
    staleTime: 1000 * 60 * 5,
  });

  const handleDownloadLegajoCompleto = () => {
    if (archivosBackend.length === 0) {
      toast.error("No hay archivos cargados para descargar.");
      return;
    }
    const cleanRazonSocial = (socio?.denominacion || "Empresa").replace(/\s+/g, "_");
    const zipName = `Legajo_Completo_${cleanRazonSocial}.zip`;
    descargar("zip-legajo", () =>
      descargarLegajoCompletoZip(
        archivosBackend,
        ESTRUCTURA_LEGAJO,
        socioArchivoService.TIPO_DOCUMENTO_MAP,
        zipName,
      ),
    );
  };

  if (bloqueado) return null;

  // Skeleton con la forma real del detalle (hero + tabs + contenido) en vez
  // de un spinner de página completa.
  if (isLoading || !socio) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <Skeleton width="8.5rem" height="0.8rem" />
          <div className={styles.heroRow}>
            <div className={styles.heroIdentity}>
              <Skeleton width="3rem" height="3rem" radius="0.9rem" />
              <div>
                <Skeleton width="16rem" height="1.35rem" style={{ maxWidth: "60vw" }} />
                <Skeleton width="11rem" height="0.8rem" style={{ marginTop: "0.55rem" }} />
              </div>
            </div>
            <div className={styles.headerBadges}>
              <Skeleton width="7.5rem" height="1.5rem" radius="pill" />
              <Skeleton width="6.5rem" height="1.5rem" radius="pill" />
            </div>
          </div>
        </header>

        <div className={styles.tabsRow}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {TABS.map((tab) => (
              <Skeleton key={tab.key} width="9rem" height="2.2rem" radius="0.6rem" />
            ))}
          </div>
        </div>

        <div className={styles.tabContent}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", padding: "0.5rem 0" }}>
            <Skeleton width="14rem" height="1rem" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: "1rem" }}>
                <Skeleton width="30%" height="2.4rem" radius="0.5rem" />
                <Skeleton width="30%" height="2.4rem" radius="0.5rem" />
                <Skeleton width="30%" height="2.4rem" radius="0.5rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tipoPersonaLabel = getTipoPersonaLabel(socio.tipopersonaid);
  const estadoSocioLabel = resolverLabel(
    estadosSocio?.opciones,
    socio.socioestadoid,
  );
  const estadoTono = getEstadoTono(estadoSocioLabel);
  const legajoCompleto = totalRequisitos > 0 && requisitosCompletados === totalRequisitos;
  // Única fuente de verdad: el propio MarcaVinculacion del Socio ("1" = ya
  // migró), que LegajoUniversalBar escribe recién después de confirmar la
  // migración con SGR+ - ver ese archivo.
  const estaMigrado = String(socio.marcavinculacion ?? "") === "1";

  return (
    <div className={styles.container}>
      <LegajoUniversalBar
        adminMode
        socioIdActivo={socio?.socioid}
        tipoPersonaId={socio?.tipopersonaid}
        nombreEmpresa={socio?.denominacion}
        cadenaId={cadenaValorIdDetectada}
      />
      <header className={styles.header}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/admin/empresas")}
        >
          <FiArrowLeft size={13} /> Volver a Empresas
        </button>

        <div className={styles.heroRow}>
          <div className={styles.heroIdentity}>
            <div className={styles.heroAvatar}>{getInitials(socio.denominacion)}</div>
            <div className={styles.heroText}>
              <h1>{socio.denominacion || "Empresa"}</h1>
              <p className={styles.heroMeta}>
                <span className={styles.heroCuit}>{formatCuit(socio.cuit)}</span>
                {tipoPersonaLabel && (
                  <>
                    <span className={styles.heroDot}>·</span>
                    {tipoPersonaLabel}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className={styles.heroActions}>
            <Button
              type="button"
              variant="outlineBlue"
              size="sm"
              onClick={() => setNotificarOpen(true)}
            >
              <FiBell size={13} /> Notificar
            </Button>
            <div className={styles.headerBadges}>
              {estaMigrado ? (
              <span
                className={`${styles.badge} ${styles["badge-success"]}`}
                title="El legajo ya se migró al sistema core (SGR+)."
              >
                <FiCheckCircle size={12} /> Migrado {Number(socio.legajo) > 0 ? `· Legajo #${socio.legajo}` : ""}
              </span>
            ) : (
              estadoSocioLabel && (
                <span
                  className={`${styles.badge} ${styles[`badge-${estadoTono}`]}`}
                  title="Todavía no se migró a SGR+: falta que complete el legajo."
                >
                  <span className={styles.badgeDot} /> {estadoSocioLabel}
                </span>
              )
            )}
            {!estaMigrado && !isLoadingLegajo && totalRequisitos > 0 && (
              <span
                className={`${styles.badge} ${styles[`badge-${legajoCompleto ? "success" : "warning"}`]}`}
                title="Documentación + terceros relacionados obligatorios, según los requisitos de su cadena."
              >
                <span className={styles.badgeDot} /> Legajo {requisitosCompletados}/{totalRequisitos}
              </span>
            )}
            <span
              className={styles.selectorCadena}
              title="Cadena con la que se evalúan requisitos y CDAs. Se toma de sus líneas o, si no tiene, de la cadena por la que se dio de alta; podés elegir otra."
            >
              <FiLink size={12} aria-hidden="true" />
              <SelectSimple
                options={opcionesCadena}
                value={cadenaValorIdDetectada ? String(cadenaValorIdDetectada) : ""}
                onChange={(valor) => valor && elegirCadena(valor)}
                placeholder="Elegir cadena"
                variant="admin"
                compact
                hideErrorSpace
              />
            </span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.tabsRow}>
        <nav className={styles.tabs}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === "cdas" && (
          <button
            type="button"
            className={styles.historialTrigger}
            onClick={() => setHistorialOpen(true)}
          >
            <FiClock size={14} /> Ver historial completo
          </button>
        )}

        {activeTab === "documentacion" && archivosBackend.length > 0 && (
          <Button
            type="button"
            variant="outlineBlue"
            size="sm"
            onClick={handleDownloadLegajoCompleto}
            isLoading={faseDe("zip-legajo") === "cargando"}
            disabled={faseDe("zip-legajo") !== null}
            title="Descargar legajo de documentos completo en un archivo ZIP"
          >
            {faseDe("zip-legajo") === "listo" ? (
              <>
                <FiCheckCircle size={13} /> Descargado
              </>
            ) : (
              <>
                <FiDownload size={13} /> Descargar Legajo Completo
              </>
            )}
          </Button>
        )}
      </div>

      <div className={styles.tabContent}>
        {activeTab === "datos" && <DatosTab socio={socio} />}
        {activeTab === "documentacion" && (
          <DocumentacionTab
            socio={socio}
            cadenaValorIdDetectada={cadenaValorIdDetectada}
            nombreCadenaDetectada={nombreCadenaDetectada}
            origenCadena={origenCadena}
          />
        )}
        {activeTab === "terceros" && (
          <TercerosTab
            socio={socio}
            cadenaValorIdDetectada={cadenaValorIdDetectada}
            nombreCadenaDetectada={nombreCadenaDetectada}
            origenCadena={origenCadena}
          />
        )}
        {activeTab === "cdas" && (
          <CdasTab
            socio={socio}
            cadenaValorIdDetectada={cadenaValorIdDetectada}
            nombreCadenaDetectada={nombreCadenaDetectada}
          />
        )}
        {activeTab === "pyme" && (
          <CertificadoPymeAdmin socioId={socio?.socioid} cuit={socio?.cuit} />
        )}
        {activeTab === "usuarios" && (
          <UsuariosVinculadosTab socioId={socio?.socioid} />
        )}
      </div>

      <HistorialCdaModal
        isOpen={historialOpen}
        onClose={() => setHistorialOpen(false)}
        socio={socio}
      />

      <NotificarSocioModal
        key={socio?.socioid ?? "none"}
        isOpen={notificarOpen}
        onClose={() => setNotificarOpen(false)}
        socio={socio}
        usuariosVinculados={usuariosVinculados}
        usuarioWebAdminId={usuarioWebAdminId}
      />
    </div>
  );
}
