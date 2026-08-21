import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
} from "react-icons/fi";
import {
  useSocioPorId,
  useActualizarSocio,
  useObtenerExecuteCda,
  useEstaMigradoEnSgrPlus,
} from "../../../hooks/useSocios";
import { cdaService } from "../../../services/cdaService";
import { useObtenerTodasWebConEstado, useObtenerGrupoCdaConCdas } from "../../../hooks/useCadenaValor";
import {
  useSituacionBCRA,
  useEstadoSocio,
  useTamanioEmpresa,
  useTipoCanalComercializacion,
  useEstadoExecuteCda,
} from "../../../hooks/useCatalogos";
import { useObtenerTodosCdas, useReejecutarCda, useProbarCda } from "../../../hooks/useCda";
import { useObtenerUsuarioPorId } from "../../../hooks/useUsuario";
import { useValidacionLegajo } from "../../../hooks/useValidacionLegajo";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import { useAuthStore } from "../../../store/useAuthStore";
import { esCdaActivo } from "../../../utils/cdaUtils";
import { socioArchivoService } from "../../../services/socioArchivoService";
import { descargarLegajoCompletoZip } from "../../../utils/fileUtils";
import {
  ultimaEjecucionPorCda,
  ordenarEjecucionesCda,
  formatearMomentoControl,
  calcularEstadoEfectivo,
  combinarEstadoCdas,
  obtenerCdasDeLaCorridaActual,
  detectarCadenaValorId,
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
import { DocumentosLegajo, ESTRUCTURA_LEGAJO } from "../../../components/features/shared/DocumentosLegajo/DocumentosLegajo";
import { SociosLegajo } from "../../../components/features/shared/SociosLegajo/SociosLegajo";
import { LegajoUniversalBar } from "../../../components/features/shared/LegajoUniversalBar/LegajoUniversalBar";
import styles from "./EmpresaDetalle.module.css";

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
];

// Filas fantasma con la forma real del panel de CDAs (barra de resultado
// general + filas de criterio con badge/fecha/acciones): mientras carga se
// ve la estructura, no un spinner centrado.
const CdasPanelSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
    <Skeleton width="100%" height="3.6rem" radius="0.75rem" />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className={styles.cdaRow}>
        <div style={{ flex: 1, minWidth: "12rem" }}>
          <Skeleton width="55%" height="0.9rem" />
          <Skeleton width="30%" height="0.7rem" style={{ marginTop: "0.45rem" }} />
        </div>
        <Skeleton width="6rem" height="1.4rem" radius="pill" />
        <Skeleton width="7rem" height="0.75rem" />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Skeleton width="7.5rem" height="1.9rem" radius="0.5rem" />
          <Skeleton width="8.5rem" height="1.9rem" radius="0.5rem" />
        </div>
      </div>
    ))}
  </div>
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
        toast.error("Ocurrió un error al guardar los cambios");
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
        confirmText="GUARDAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={actualizarMutation.isPending}
      />
    </div>
  );
}

// Avisa de dónde sale el filtro de requisitos que se aplica en Documentación
// y Terceros Relacionados en modo admin: no hay un campo CadenaValorID en
// Socio, así que se infiere de la ejecución más reciente del historial de
// CDAs que traiga uno (ver detectarCadenaValorId, mismo dato que usa la
// pestaña CDAs para reejecutar/forzar).
function CadenaDetectadaAviso({ cadenaValorIdDetectada, nombreCadenaDetectada }) {
  return (
    <p className={styles.cadenaAviso}>
      <FiInfo size={12} />
      {cadenaValorIdDetectada ? (
        <>
          Requisitos configurados para{" "}
          <span className={styles.cadenaAvisoFuerte}>{nombreCadenaDetectada}</span>,
          detectada del historial de CDAs de esta empresa.
        </>
      ) : (
        "No se detectó la cadena de esta empresa en su historial de CDAs: se muestran los requisitos por defecto según su tipo societario."
      )}
    </p>
  );
}

function DocumentacionTab({ socio, cadenaValorIdDetectada, nombreCadenaDetectada }) {
  const methods = useForm({ defaultValues: {} });

  return (
    <div className={styles.embeddedLegajo}>
      <CadenaDetectadaAviso
        cadenaValorIdDetectada={cadenaValorIdDetectada}
        nombreCadenaDetectada={nombreCadenaDetectada}
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

function TercerosTab({ socio, cadenaValorIdDetectada, nombreCadenaDetectada }) {
  return (
    <div className={styles.embeddedLegajo}>
      <CadenaDetectadaAviso
        cadenaValorIdDetectada={cadenaValorIdDetectada}
        nombreCadenaDetectada={nombreCadenaDetectada}
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
// Socio, pero sí viaja en cada fila del historial de CDAs desde que se
// arregló el bug del INSERT que lo dejaba en 0 — se detecta desde ahí (ver
// detectarCadenaValorId, arriba en EmpresaDetalle).
const PANTALLA_EMPRESA = "PANTALLA_INGRESO_CUIT";

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
// DocumentacionTab y TercerosTab, ver detectarCadenaValorId en
// utils/executeCda.js).
function CdasTab({ socio, cadenaValorIdDetectada, nombreCadenaDetectada }) {
  const usuarioWebId = useAuthStore((state) => state.user?.usuarioWebId) || 0;
  const queryClient = useQueryClient();
  const [cdaEnCurso, setCdaEnCurso] = useState(null);
  const [isReejecutandoGrupo, setIsReejecutandoGrupo] = useState(false);
  const [confirmReejecutarGrupoOpen, setConfirmReejecutarGrupoOpen] = useState(false);

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
      await cdaService.ejecutarCda(
        PANTALLA_EMPRESA,
        { socioId: socio.socioid },
        cadenaValorId,
        usuarioWebId,
      );
      toast.success("CDAs aprobados", {
        description: "El grupo completo se volvió a evaluar y pasó correctamente.",
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
      } else {
        toast.error("No se pudo re-ejecutar el grupo de CDAs.");
      }
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
    // vinculado. Reportado a Victor: no hay forma de forzar un único CDA y
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
        usuarioId: usuarioWebId,
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
      <div className={styles.cdasPlaceholderWrap}>
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
      <div className={styles.cdasPlaceholderWrap}>
        <div className={styles.cdasPlaceholder}>
          <FiShield className={styles.cdasPlaceholderIcon} />
          <h3>Sin evaluaciones registradas</h3>
          <p>Todavía no se ejecutó ningún Criterio de Aceptación para esta empresa.</p>
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

  return (
    <div className={styles.cdasScroll}>
      {(grupoItem || (hayCadenaDetectada && cdasIndividuales.length > 0)) && (() => {
        // Para cuando se llega hasta acá, isLoadingGrupoElegido ya resolvió
        // (ver el gate de carga más arriba) — no hace falta un estado
        // intermedio de "Calculando...".
        const estadoLabel = estadoFinal ? ESTADO_LABEL_EFECTIVO[estadoFinal] : "Sin evaluar";
        const tono = getEstadoTono(estadoLabel);

        return (
          <section className={`${styles.grupoBar} ${styles[`grupoBar-${tono}`]}`}>
            <div className={styles.grupoBarInfo}>
              <span className={styles.grupoBarIcon}>
                <FiActivity size={17} />
              </span>
              <div className={styles.grupoBarTexto}>
                <span className={styles.grupoBarTitulo}>Resultado general de la pantalla</span>
                <span className={styles.grupoBarExpresion}>
                  {estadoSinCadena
                    ? "Calculado con el último cierre y la última ejecución conocida de cada CDA."
                    : estadoEfectivo
                      ? `Sin un cierre de grupo registrado: se estima con la definición vigente de ${nombreCadenaDetectada}.`
                      : "Todavía no se pudo determinar un resultado combinado para este socio."}
                </span>
              </div>
            </div>

            <div className={styles.grupoBarRight}>
              <span className={`${styles.badge} ${styles[`badge-${tono}`]}`}>
                <span className={styles.badgeDot} /> {estadoLabel}
              </span>
              {grupoItem && (
                <span className={styles.cdaRowFecha}>
                  Último cierre: {formatearMomentoControl(grupoItem.momentocontrol)}
                </span>
              )}
            </div>
          </section>
        );
      })()}

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
        confirmText="REEJECUTAR GRUPO"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isReejecutandoGrupo}
      />

      <section className={styles.cdasSection}>
        <header className={`${styles.sectionCardHeader} ${styles.cdasSectionHeaderRow}`}>
          <div className={styles.cdasSectionHeaderLeft}>
            <span className={styles.sectionCardIcon}>
              <FiShield size={15} />
            </span>
            <h3>Estado actual de los CDAs</h3>
          </div>
          <div className={styles.cdasSectionHeaderActions}>
            <span
              className={styles.cdaRowFecha}
              title={
                hayCadenaDetectada
                  ? "Detectada del historial de ejecuciones de este socio."
                  : "Este socio todavía no tiene ejecuciones con la cadena registrada — no se puede reejecutar desde acá."
              }
            >
              {hayCadenaDetectada ? `Cadena: ${nombreCadenaDetectada}` : "Cadena no detectada"}
            </span>
            <Button
              variant="outlineBlue"
              size="sm"
              onClick={() => setConfirmReejecutarGrupoOpen(true)}
              isLoading={isReejecutandoGrupo}
              disabled={isReejecutandoGrupo || !hayCadenaDetectada}
              title={!hayCadenaDetectada ? "No se detectó la cadena de este socio" : undefined}
            >
              <FiRefreshCw size={13} /> Reejecutar grupo
            </Button>
          </div>
        </header>
        <div className={styles.cdasList}>
          {cdasIndividualesOrdenados.map((item, index) => {
            const estadoLabel =
              resolverLabel(estadosExecuteCda?.opciones, item.estadoexecutecdaid) || "Desconocido";
            const tono = getEstadoTono(estadoLabel);
            const descripcion =
              descripcionPorCda.get(Number(item.cdaid)) || item.expresion || `CDA #${item.cdaid}`;
            // Si no hay grupo vigente resuelto (cadena no detectada, o el
            // grupo no existe) no hay forma de saber si sigue vinculado —
            // se asume que sí para no marcar de más (mismo criterio que
            // calcularEstadoEfectivo cuando no recibe cdasActivosIds).
            const estaVinculado =
              !hayGrupoVigente || cdasActivosIdsGrupo.includes(Number(item.cdaid));
            const anteriorVinculado =
              index > 0 &&
              (!hayGrupoVigente || cdasActivosIdsGrupo.includes(Number(cdasIndividualesOrdenados[index - 1].cdaid)));
            const esInicioDeDesvinculados = hayGrupoVigente && !estaVinculado && (index === 0 || anteriorVinculado);
            // Se muestran deshabilitados (no ocultos) para un CDA desvinculado:
            // así el admin ve que la acción existe pero no aplica, en vez de
            // que desaparezca sin explicación.
            const muestraAcciones = tono !== "success";
            const fueForzado = !!item.valorparticularexpresion;
            const tituloAccionDeshabilitada = !estaVinculado
              ? "Este CDA ya no está vinculado a esta cadena: no pesa en el resultado combinado actual."
              : !hayCadenaDetectada
                ? "No se detectó la cadena de este socio"
                : undefined;

            return (
              <React.Fragment key={item.cdaid}>
                {esInicioDeDesvinculados && (
                  <p className={styles.cdaListDivider}>Ya no vinculados a esta cadena</p>
                )}
                <div className={`${styles.cdaRow} ${!estaVinculado ? styles.cdaRowDesvinculada : ""}`}>
                <div className={styles.cdaRowInfo}>
                  <span className={styles.cdaRowTitulo}>
                    {descripcion}
                    {fueForzado && (
                      <span className={styles.cdaRowForzadoPill} title="Este resultado se forzó con una expresión personalizada">
                        <FiEdit3 size={10} /> Forzado
                      </span>
                    )}
                    {!estaVinculado && (
                      <span
                        className={styles.cdaRowDesvinculadoPill}
                        title="Este CDA ya no está vinculado a esta cadena: se muestra su última ejecución, pero no pesa en el resultado combinado actual."
                      >
                        <FiX size={10} /> Desvinculado
                      </span>
                    )}
                  </span>
                  {item.valorresultado && (
                    <span className={styles.cdaRowResultado}>{item.valorresultado}</span>
                  )}
                </div>
                <span className={`${styles.badge} ${styles[`badge-${tono}`]}`}>
                  <span className={styles.badgeDot} /> {estadoLabel}
                </span>
                <span className={styles.cdaRowFecha}>{formatearMomentoControl(item.momentocontrol)}</span>
                <div className={styles.cdaRowActions}>
                  <Button
                    variant="outlineBlue"
                    size="sm"
                    onClick={() => setVerExpresionItem(item)}
                    title="Ver expresión evaluada"
                  >
                    <FiEye size={13} /> Ver expresión
                  </Button>
                  {muestraAcciones && (
                    <>
                      <Button
                        variant="outlineBlue"
                        size="sm"
                        onClick={() => handleReejecutar(item)}
                        isLoading={isReejecutando && cdaEnCurso === item.cdaid}
                        disabled={isReejecutando || !hayCadenaDetectada || !estaVinculado}
                        title={tituloAccionDeshabilitada}
                      >
                        <FiRefreshCw size={13} /> Volver a ejecutar
                      </Button>
                      <Button
                        variant="outlineBlue"
                        size="sm"
                        onClick={() => abrirForzarExpresion(item)}
                        disabled={isReejecutando || !hayCadenaDetectada || !estaVinculado}
                        title={tituloAccionDeshabilitada}
                      >
                        <FiEdit3 size={13} /> Forzar expresión
                      </Button>
                    </>
                  )}
                </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
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
        title="Forzar evaluación con expresión personalizada"
        subtitle={forzarItem ? descripcionPorCda.get(Number(forzarItem.cdaid)) : ""}
        variant="blue"
        maxWidth="580px"
        preventClose={isReejecutando}
      >
        {forzarItem && (
          <div className={styles.forzarModalBody}>
            <div className={styles.warnCallout}>
              <span className={styles.warnIconWrap}>
                <FiAlertTriangle size={14} />
              </span>
              <p className={styles.warnText}>
                Esto evalúa <strong>solo este CDA</strong> con la expresión que
                definas acá en vez de la definida en CDAs Globales. Usalo solo
                cuando el rechazo se deba a un valor límite que consideres{" "}
                <strong>salvable</strong> para este socio en particular — queda
                registrado en el historial con la expresión utilizada y el
                resultado combinado de la pantalla ya lo refleja. Es
                temporal: si más adelante se reejecuta el grupo completo, este
                CDA vuelve a evaluarse con su regla real (sin este forzado) y
                puede volver a fallar.
              </p>
            </div>

            <div className={styles.forzarSection}>
              <h4 className={styles.forzarSectionLabel}>Regla definida en CDAs Globales</h4>
              <code className={styles.forzarReglaGlobal}>
                {reglaGlobalPorCda.get(Number(forzarItem.cdaid)) || "—"}
              </code>
            </div>

            <div className={styles.forzarSection}>
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

            <div className={styles.sandboxContainer}>
              <h3 className={styles.sandboxTitle}>Laboratorio de Pruebas</h3>

              <div className={styles.sandboxBody}>
                {expresionForzada.trim() ? (
                  <p className={styles.sandboxRulePreview}>
                    La expresión que vas a forzar es: <code>{expresionForzada}</code>
                  </p>
                ) : (
                  <p className={styles.sandboxRulePreview}>
                    Escribí una expresión arriba para poder probarla acá.
                  </p>
                )}

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={styles.sandboxCuitLabel}>CUIT: {formatCuit(socio.cuit)}</span>
                  <Button
                    type="button"
                    variant="outlineBlue"
                    size="md"
                    onClick={handleProbarExpresion}
                    isLoading={isProbando}
                    disabled={!expresionForzada.trim() || isProbando}
                  >
                    Probar
                  </Button>
                </div>
              </div>

              {resultadoPrueba && (
                <div className={styles.testResultBox}>
                  <div className={styles.testResultHeader}>
                    <span>Resultado:</span>
                    <div className={styles.testResultHeaderRight}>
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
                  </div>
                  <div className={styles.testResultMessage}>{resultadoPrueba.descripcion}</div>
                  {resultadoPrueba.mensaje && (
                    <div className={styles.testResultLog}>
                      <span className={styles.testResultLogLabel}>Mensaje devuelto por el backend</span>
                      <code className={styles.testResultLogValue}>{resultadoPrueba.mensaje}</code>
                    </div>
                  )}
                  {resultadoPrueba.valorResuelto && (
                    <div className={styles.testResultLog}>
                      <span className={styles.testResultLogLabel}>Valor resuelto</span>
                      <code className={styles.testResultLogValue}>{resultadoPrueba.valorResuelto}</code>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.forzarModalFooter}>
              <Button variant="ghost" onClick={cerrarForzarExpresion} disabled={isReejecutando}>
                CANCELAR
              </Button>
              <Button
                variant="blue"
                onClick={() => setConfirmForzarOpen(true)}
                disabled={!expresionForzada.trim() || isReejecutando}
              >
                CONTINUAR
              </Button>
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
        tone="danger"
        confirmText="FORZAR Y REEJECUTAR"
        cancelText="CANCELAR"
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
function VerExpresionModal({ item, onClose, descripcion, reglaGlobal }) {
  const fueForzado = !!item?.valorparticularexpresion;

  return (
    <Modal
      isOpen={!!item}
      onClose={onClose}
      title="Expresión evaluada"
      subtitle={descripcion}
      variant="blue"
      maxWidth="560px"
    >
      {item && (
        <div className={styles.forzarModalBody}>
          <div className={styles.forzarSection}>
            <h4 className={styles.forzarSectionLabel}>Regla definida en CDAs Globales</h4>
            <code className={styles.forzarReglaGlobal}>{reglaGlobal || "—"}</code>
          </div>

          {fueForzado && (
            <div className={styles.forzarSection}>
              <h4 className={styles.forzarSectionLabel}>Expresión forzada</h4>
              <code className={styles.cdaRowForzadoCode}>{item.valorparticularexpresion}</code>
            </div>
          )}

          {item.valorresultado && (
            <div className={styles.forzarSection}>
              <h4 className={styles.forzarSectionLabel}>Valor resuelto</h4>
              <code className={styles.forzarReglaGlobal}>{item.valorresultado}</code>
            </div>
          )}

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

  const renderFila = (item, key) => {
    const estadoLabel =
      resolverLabel(estadosExecuteCda?.opciones, item.estadoexecutecdaid) || "Desconocido";
    const tono = getEstadoTono(estadoLabel);
    const descripcion =
      descripcionPorCda.get(Number(item.cdaid)) || item.expresion || `CDA #${item.cdaid}`;

    return (
      <div key={key} className={styles.cdaHistorialItem}>
        <span className={`${styles.dot} ${styles[`dot-${tono}`]}`} />
        <div className={styles.cdaHistorialInfo}>
          <span className={styles.cdaHistorialTitulo}>
            {descripcion} · <strong>{estadoLabel}</strong>
          </span>
          {item.valorparticularexpresion && (
            <span className={styles.cdaRowForzado} title={item.valorparticularexpresion}>
              <FiEdit3 size={11} /> Forzado con: {item.valorparticularexpresion}
            </span>
          )}
          <span className={styles.cdaHistorialMeta}>
            {formatearMomentoControl(item.momentocontrol)} · <NombreUsuario usuarioId={item.usuariowebid} />
          </span>
        </div>
      </div>
    );
  };

  const renderFilaGrupo = (item) => {
    const estadoLabel =
      resolverLabel(estadosExecuteCda?.opciones, item.estadoexecutecdaid) || "Desconocido";
    const tono = getEstadoTono(estadoLabel);

    return (
      <div className={`${styles.cdaHistorialItem} ${styles.cdaHistorialItemGrupo}`}>
        <span className={`${styles.dot} ${styles[`dot-${tono}`]}`} />
        <div className={styles.cdaHistorialInfo}>
          <span className={styles.cdaHistorialTitulo}>
            Resultado general de la pantalla · <strong>{estadoLabel}</strong>
          </span>
          {item.expresion && (
            <span className={styles.cdaHistorialExpresion}>{item.expresion}</span>
          )}
          <span className={styles.cdaHistorialMeta}>
            {formatearMomentoControl(item.momentocontrol)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Historial completo de CDAs"
      subtitle={socio?.denominacion}
      variant="blue"
      maxWidth="640px"
    >
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={styles.cdaRow}>
              <div style={{ flex: 1 }}>
                <Skeleton width="60%" height="0.85rem" />
                <Skeleton width="35%" height="0.7rem" style={{ marginTop: "0.4rem" }} />
              </div>
              <Skeleton width="5.5rem" height="1.3rem" radius="pill" />
              <Skeleton width="6.5rem" height="0.75rem" />
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
          {sueltos.length > 0 && (
            <div className={styles.historialSueltos}>
              {sueltos.map((item) => renderFila(item, item.socioexecutecdaid))}
            </div>
          )}
          {corridas.map(({ grupo, items }) => (
            <div key={grupo.socioexecutecdaid} className={styles.historialCorrida}>
              {renderFilaGrupo(grupo)}
              {items.length > 0 && (
                <div className={styles.historialCorridaItems}>
                  {items.map((item) => renderFila(item, item.socioexecutecdaid))}
                </div>
              )}
            </div>
          ))}
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

  // Defensa en profundidad: ver useBloqueoAdminRestringido — un usuario
  // vinculado solo por UsuarioCadenaValor no debería poder ver el detalle de
  // NINGUNA empresa (esta pantalla no filtra por cadena propia).
  const bloqueado = useBloqueoAdminRestringido();

  const { data: socio, isLoading } = useSocioPorId(id);
  const { data: estadosSocio } = useEstadoSocio();

  // Se calcula una sola vez acá (no hay CadenaValorID en Socio, se infiere
  // del historial de CDAs — ver detectarCadenaValorId) porque lo necesitan
  // tanto CdasTab como Documentación y Terceros Relacionados, para filtrar
  // por los requisitos configurados en esa cadena.
  const { data: ejecucionesCda } = useObtenerExecuteCda(socio?.socioid);
  const cadenaValorIdDetectada = useMemo(
    () => detectarCadenaValorId(ejecucionesCda),
    [ejecucionesCda],
  );
  const { data: cadenasWeb } = useObtenerTodasWebConEstado();
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

  // Confirmación real de migración: si el CUIT aparece en sgrplus/Socios es
  // porque efectivamente vive en el core. Antes "Migrado" también se daba
  // por tener el legajo 100% completo en la web (legajoCompleto) sin haber
  // migrado nunca — confirmado en vivo (2026-08-11) con un socio (ALESSO SA,
  // CUIT 30711671206) cuya migración había fallado con 500 y que igual
  // aparecía como "Migrado" en este header.
  const { data: migradoEnSgrPlus } = useEstaMigradoEnSgrPlus(socio?.cuit);

  // Vive acá (no dentro de DocumentacionTab) porque el botón se muestra en
  // la fila de tabs, junto a "Ver historial completo" de CDAs — misma
  // queryKey que ya invalida DocumentosLegajo al subir/borrar archivos.
  const { data: archivosBackend = [] } = useQuery({
    queryKey: ["socioArchivos", socio?.socioid],
    queryFn: () => socioArchivoService.obtenerArchivos(socio.socioid),
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
    descargarLegajoCompletoZip(
      archivosBackend,
      ESTRUCTURA_LEGAJO,
      socioArchivoService.TIPO_DOCUMENTO_MAP,
      zipName,
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
  const estaMigrado = Number(socio.legajo) > 0 || !!migradoEnSgrPlus;

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
            {cadenaValorIdDetectada && (
              <span
                className={`${styles.badge} ${styles["badge-neutral"]}`}
                title="Cadena detectada del historial de CDAs de esta empresa. Como el socio no está atado a una única cadena, puede ingresar y verse distinto desde el slug de otra cadena."
              >
                <FiLink size={12} /> {nombreCadenaDetectada}
              </span>
            )}
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
            title="Descargar legajo de documentos completo en un archivo ZIP"
          >
            <FiDownload size={13} /> Descargar Legajo Completo
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
          />
        )}
        {activeTab === "terceros" && (
          <TercerosTab
            socio={socio}
            cadenaValorIdDetectada={cadenaValorIdDetectada}
            nombreCadenaDetectada={nombreCadenaDetectada}
          />
        )}
        {activeTab === "cdas" && (
          <CdasTab
            socio={socio}
            cadenaValorIdDetectada={cadenaValorIdDetectada}
            nombreCadenaDetectada={nombreCadenaDetectada}
          />
        )}
      </div>

      <HistorialCdaModal
        isOpen={historialOpen}
        onClose={() => setHistorialOpen(false)}
        socio={socio}
      />
    </div>
  );
}
