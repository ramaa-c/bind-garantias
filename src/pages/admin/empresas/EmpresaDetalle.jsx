import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
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
} from "react-icons/fi";
import {
  useSocioPorId,
  useActualizarSocio,
  useObtenerExecuteCda,
} from "../../../hooks/useSocios";
import {
  useSituacionBCRA,
  useEstadoSocio,
  useTamanioEmpresa,
  useTipoCanalComercializacion,
  useEstadoExecuteCda,
} from "../../../hooks/useCatalogos";
import { useObtenerTodosCdas, useReejecutarCda } from "../../../hooks/useCda";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  ultimaEjecucionPorCda,
  ordenarEjecucionesCda,
  formatearMomentoControl,
} from "../../../utils/executeCda";
import {
  Button,
  InputSimple,
  SelectSimple,
  SelectFechaSimple,
  Spinner,
} from "../../../components/ui";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { DocumentosLegajo } from "../../../components/features/shared/DocumentosLegajo/DocumentosLegajo";
import { SociosLegajo } from "../../../components/features/shared/SociosLegajo/SociosLegajo";
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

function DocumentacionTab({ socio }) {
  const methods = useForm({ defaultValues: {} });

  return (
    <div className={styles.embeddedLegajo}>
      <FormProvider {...methods}>
        <DocumentosLegajo
          adminMode
          socioIdOverride={socio.socioid}
          empresaOverride={{
            nombreEmpresa: socio.denominacion,
            cuitActivo: socio.cuit,
            direccion: socio.calle,
            telefono: socio.telefono,
            tipoPersonaId: socio.tipopersonaid,
          }}
        />
      </FormProvider>
    </div>
  );
}

function TercerosTab({ socio }) {
  return (
    <div className={styles.embeddedLegajo}>
      <SociosLegajo
        adminMode
        socioIdOverride={socio.socioid}
        tipoPersonaIdOverride={Number(socio.tipopersonaid) || null}
        nombreEmpresaOverride={socio.denominacion}
      />
    </div>
  );
}

function CdasTab({ socio }) {
  const usuarioWebId = useAuthStore((state) => state.user?.usuarioWebId) || 0;
  const [cdaEnCurso, setCdaEnCurso] = useState(null);

  const {
    data: ejecucionesData,
    isLoading,
    isError,
  } = useObtenerExecuteCda(socio.socioid);
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

  const ultimasPorCda = useMemo(
    () => ultimaEjecucionPorCda(ejecucionesData),
    [ejecucionesData],
  );
  const historialCompleto = useMemo(
    () => ordenarEjecucionesCda(ejecucionesData),
    [ejecucionesData],
  );

  const handleReejecutar = (item) => {
    setCdaEnCurso(item.cdaid);
    reejecutar(
      { cdaId: item.cdaid, cuit: socio.cuit, usuarioId: usuarioWebId },
      {
        onSuccess: ({ status, data }) => {
          setCdaEnCurso(null);
          if (status === 202) {
            toast.success("CDA aprobado", {
              description: "El criterio se volvió a evaluar y pasó correctamente.",
            });
          } else if (status === 406) {
            // WSResponseCDA { Result, ListTest: [{ Result, Valor, Mensaje }] }.
            // El body de un error 4xx no pasa por el interceptor que baja las
            // keys a minúsculas (solo lo hace con respuestas exitosas), así
            // que puede llegar en PascalCase tal cual lo manda el backend.
            const listTest = data?.listtest ?? data?.ListTest ?? [];
            const rechazo = listTest.find((t) => (t.result ?? t.Result) === false);
            const mensaje =
              (rechazo && (rechazo.mensaje || rechazo.Mensaje)) ||
              (typeof data === "string" ? data : null) ||
              "El criterio no se cumple.";
            toast.error("CDA rechazado", { description: mensaje });
          } else if (status === 409) {
            toast.error("Falta un dato requerido para evaluar este CDA.");
          } else {
            toast.error("No se pudo re-ejecutar el CDA.");
          }
        },
        onError: () => {
          setCdaEnCurso(null);
          toast.error("No se pudo re-ejecutar el CDA.");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className={styles.cdasPlaceholderWrap}>
        <Spinner center size={60} color="#4c65e6" />
      </div>
    );
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

  return (
    <div className={styles.cdasScroll}>
      <section className={styles.cdasSection}>
        <header className={styles.sectionCardHeader}>
          <span className={styles.sectionCardIcon}>
            <FiShield size={15} />
          </span>
          <h3>Estado actual de los CDAs</h3>
        </header>
        <div className={styles.cdasList}>
          {ultimasPorCda.map((item) => {
            const estadoLabel =
              resolverLabel(estadosExecuteCda?.opciones, item.estadoexecutecdaid) || "Desconocido";
            const tono = getEstadoTono(estadoLabel);
            const descripcion =
              descripcionPorCda.get(Number(item.cdaid)) || item.expresion || `CDA #${item.cdaid}`;
            const puedeReejecutar = tono !== "success";

            return (
              <div key={item.cdaid} className={styles.cdaRow}>
                <div className={styles.cdaRowInfo}>
                  <span className={styles.cdaRowTitulo}>{descripcion}</span>
                  {item.valorresultado && (
                    <span className={styles.cdaRowResultado}>{item.valorresultado}</span>
                  )}
                </div>
                <span className={`${styles.badge} ${styles[`badge-${tono}`]}`}>
                  <span className={styles.badgeDot} /> {estadoLabel}
                </span>
                <span className={styles.cdaRowFecha}>{formatearMomentoControl(item.momentocontrol)}</span>
                {puedeReejecutar && (
                  <Button
                    variant="outlineBlue"
                    size="sm"
                    onClick={() => handleReejecutar(item)}
                    isLoading={isReejecutando && cdaEnCurso === item.cdaid}
                    disabled={isReejecutando}
                  >
                    <FiRefreshCw size={13} /> Volver a ejecutar
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.cdasSection}>
        <header className={styles.sectionCardHeader}>
          <span className={styles.sectionCardIcon}>
            <FiClock size={15} />
          </span>
          <h3>Historial completo</h3>
        </header>
        <div className={styles.cdasHistorialList}>
          {historialCompleto.map((item) => {
            const estadoLabel =
              resolverLabel(estadosExecuteCda?.opciones, item.estadoexecutecdaid) || "Desconocido";
            const tono = getEstadoTono(estadoLabel);
            const descripcion =
              descripcionPorCda.get(Number(item.cdaid)) || item.expresion || `CDA #${item.cdaid}`;

            return (
              <div key={item.socioexecutecdaid} className={styles.cdaHistorialItem}>
                <span className={`${styles.dot} ${styles[`dot-${tono}`]}`} />
                <div className={styles.cdaHistorialInfo}>
                  <span className={styles.cdaHistorialTitulo}>
                    {descripcion} · <strong>{estadoLabel}</strong>
                  </span>
                  <span className={styles.cdaHistorialMeta}>
                    {formatearMomentoControl(item.momentocontrol)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function EmpresaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("datos");

  const { data: socio, isLoading } = useSocioPorId(id);
  const { data: estadosSocio } = useEstadoSocio();

  if (isLoading || !socio) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner center size={80} color="#4c65e6" />
      </div>
    );
  }

  const tipoPersonaLabel = getTipoPersonaLabel(socio.tipopersonaid);
  const estadoSocioLabel = resolverLabel(
    estadosSocio?.opciones,
    socio.socioestadoid,
  );
  const estadoTono = getEstadoTono(estadoSocioLabel);

  return (
    <div className={styles.container}>
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
            {estadoSocioLabel && (
              <span
                className={`${styles.badge} ${styles[`badge-${estadoTono}`]}`}
              >
                <span className={styles.badgeDot} /> {estadoSocioLabel}
              </span>
            )}
            {Number(socio.legajo) > 0 && (
              <span className={`${styles.badge} ${styles["badge-neutral"]}`}>
                Legajo #{socio.legajo}
              </span>
            )}
          </div>
        </div>
      </header>

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

      <div className={styles.tabContent}>
        {activeTab === "datos" && <DatosTab socio={socio} />}
        {activeTab === "documentacion" && <DocumentacionTab socio={socio} />}
        {activeTab === "terceros" && <TercerosTab socio={socio} />}
        {activeTab === "cdas" && <CdasTab socio={socio} />}
      </div>
    </div>
  );
}
