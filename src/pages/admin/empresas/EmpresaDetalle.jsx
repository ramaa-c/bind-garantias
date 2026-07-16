import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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
} from "react-icons/fi";
import {
  useSocioPorId,
  useActualizarSocio,
  useObtenerExecuteCda,
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
import { useAuthStore } from "../../../store/useAuthStore";
import { esCdaActivo } from "../../../utils/cdaUtils";
import {
  ultimaEjecucionPorCda,
  ordenarEjecucionesCda,
  formatearMomentoControl,
  calcularEstadoEfectivo,
} from "../../../utils/executeCda";
import {
  Button,
  InputSimple,
  SelectSimple,
  SelectFechaSimple,
  Spinner,
  Modal,
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

// PANTALLA_INGRESO_CUIT es hoy la única pantalla que evalúa CDAs a nivel
// empresa (la otra, PANTALLA_SOCIOS, es para terceros relacionados) — por
// eso se puede fijar acá. CadenaValorID en cambio no queda guardado en
// ningún lado del lado del socio ni del historial, así que hasta que se le
// pida a backend que lo persista, el admin lo tiene que elegir a mano.
const PANTALLA_EMPRESA = "PANTALLA_INGRESO_CUIT";

function CdasTab({ socio }) {
  const usuarioWebId = useAuthStore((state) => state.user?.usuarioWebId) || 0;
  const queryClient = useQueryClient();
  const [cdaEnCurso, setCdaEnCurso] = useState(null);
  const [cadenaValorIdGrupo, setCadenaValorIdGrupo] = useState("");
  const [isReejecutandoGrupo, setIsReejecutandoGrupo] = useState(false);
  const hayCadenaSeleccionada = !!Number(cadenaValorIdGrupo);

  const { data: cadenasWeb } = useObtenerTodasWebConEstado();
  const opcionesCadenas = useMemo(() => {
    return (cadenasWeb || [])
      .filter((c) => c.activaOperativa)
      .map((c) => ({
        value: String(c.cadenavalorid),
        label: c.denominacion,
      }));
  }, [cadenasWeb]);

  // Definición VIGENTE del grupo (ExpresionAgrupacion + CDAs activos) para la
  // cadena elegida arriba — se usa para recalcular el estado combinado sin
  // pegarle de nuevo al backend (ver calcularEstadoEfectivo).
  const { data: grupoDataElegido, isLoading: isLoadingGrupoElegido } =
    useObtenerGrupoCdaConCdas(hayCadenaSeleccionada ? Number(cadenaValorIdGrupo) : null, PANTALLA_EMPRESA);

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
  const historialCompleto = useMemo(
    () => ordenarEjecucionesCda(ejecucionesData),
    [ejecucionesData],
  );

  // CdaID 0 es la fila sintética que el backend arma con el resultado
  // combinado del grupo (no un CDA real): no se puede re-ejecutar por
  // CdaID como el resto — reintentarlo así da 409 "Dato Requerido
  // Faltante", que es un mensaje engañoso para este caso. Se separa acá
  // para tratarlo distinto (ver barra de estado abajo).
  const grupoItem = ultimasPorCda.find((item) => Number(item.cdaid) === 0);

  // Un CDA que se saca del grupo (deshabilitado/desvinculado) deja de
  // evaluarse en las próximas corridas de pantalla, pero su última fila
  // queda en el historial para siempre — "última ejecución por CdaID" no
  // alcanza para saber si sigue vigente. Nos quedamos solo con los CdaID
  // que aparecieron en la corrida de pantalla más reciente: todo lo que se
  // logueó después del penúltimo resultado de grupo (CdaID 0). Si un CDA
  // se re-ejecuta puntual después de esa corrida, también entra (tiene un
  // SocioExecuteCdaID más alto), que es lo correcto.
  const cdasIndividuales = useMemo(() => {
    const gruposDesc = historialCompleto.filter(
      (item) => Number(item.cdaid) === 0,
    );
    const idCorteInferior = gruposDesc[1]
      ? Number(gruposDesc[1].socioexecutecdaid)
      : -Infinity;
    const cdaIdsCorridaActual = new Set(
      historialCompleto
        .filter(
          (item) =>
            Number(item.cdaid) !== 0 &&
            Number(item.socioexecutecdaid) > idCorteInferior,
        )
        .map((item) => Number(item.cdaid)),
    );
    return ultimasPorCda.filter(
      (item) =>
        Number(item.cdaid) !== 0 && cdaIdsCorridaActual.has(Number(item.cdaid)),
    );
  }, [historialCompleto, ultimasPorCda]);

  // Confirmado con pruebas manuales: cuando TODAS las integraciones que
  // necesitan los CDAs de la corrida están deshabilitadas, el backend deja
  // cada CDA individual como Pendiente pero NO genera una fila de grupo
  // nueva (no puede cerrar el AND/OR con términos sin resolver). Si hay
  // individuales más nuevos que el último grupo, ese grupo quedó
  // desactualizado — no refleja la corrida más reciente.
  const grupoDesactualizado = useMemo(() => {
    if (!grupoItem) return false;
    const grupoId = Number(grupoItem.socioexecutecdaid);
    return historialCompleto.some(
      (item) => Number(item.cdaid) !== 0 && Number(item.socioexecutecdaid) > grupoId,
    );
  }, [grupoItem, historialCompleto]);

  // Recalcula el resultado combinado de la pantalla (aprobado/rechazado/
  // pendiente) tomando la definición VIGENTE del grupo (ExpresionAgrupacion +
  // CDAs activos, elegida arriba por cadena) y la última ejecución conocida
  // de cada CDA — el mismo cálculo que usa useEstadoCdaSocio para la
  // validación de acceso del cliente. Reemplaza a grupoDesactualizado (que
  // solo detectaba "quedó sin cerrar", sin poder decir hacia qué lado) en
  // cuanto se elige una cadena; sin cadena elegida no hay forma de saber qué
  // ExpresionAgrupacion aplica, así que se sigue mostrando el crudo.
  const cdasActivosIdsGrupo = useMemo(() => {
    return (grupoDataElegido?.cdas || [])
      .filter(esCdaActivo)
      .map((c) => Number(c.cdaid ?? c.CdaId ?? c.CdaID))
      .filter((id) => !Number.isNaN(id));
  }, [grupoDataElegido]);

  const estadoEfectivo = useMemo(() => {
    if (!hayCadenaSeleccionada || isLoadingGrupoElegido) return null;
    return calcularEstadoEfectivo({
      historial: historialCompleto,
      expresionAgrupacion: grupoDataElegido?.grupo?.expresionagrupacion,
      cdasActivosIds: cdasActivosIdsGrupo,
    });
  }, [hayCadenaSeleccionada, isLoadingGrupoElegido, historialCompleto, grupoDataElegido, cdasActivosIdsGrupo]);

  const handleReejecutarGrupo = async () => {
    const cadenaValorId = Number(cadenaValorIdGrupo);
    if (!cadenaValorId) {
      toast.error("Ingresá el CadenaValorID para re-ejecutar el grupo.");
      return;
    }

    setIsReejecutandoGrupo(true);
    try {
      await cdaService.ejecutarCda(
        PANTALLA_EMPRESA,
        socio.cuit,
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
    const cadenaValorId = Number(cadenaValorIdGrupo);
    if (!cadenaValorId) {
      toast.error("Seleccioná la cadena de valor arriba para poder re-ejecutar un CDA puntual.");
      return;
    }
    setCdaEnCurso(item.cdaid);
    reejecutar(
      {
        cdaId: item.cdaid,
        cuit: socio.cuit,
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
                ? "Se evaluó con la expresión forzada y pasó correctamente. Queda registrado en el historial, pero el resultado combinado de la pantalla no se actualiza solo — puede seguir mostrando pendiente hasta la próxima corrida completa."
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
      {/* Sin fila de grupo (CdaID 0) ni cadena elegida todavía no hay dónde
          elegirla: igual hace falta para re-ejecutar un CDA puntual (ver
          handleReejecutar), así que se muestra acá suelta en ese caso. En
          cuanto hay grupoItem o una cadena elegida con CDAs para mostrar, el
          mismo selector ya vive dentro de la barra de estado de abajo. */}
      {!grupoItem && !(hayCadenaSeleccionada && cdasIndividuales.length > 0) && (
        <div className={styles.cdaCadenaPickerBar}>
          <span className={styles.forzarSectionLabel}>Cadena de valor</span>
          <div className={styles.grupoBarInputWrap}>
            <SelectSimple
              variant="admin"
              placeholder="Cadena de valor"
              options={opcionesCadenas}
              value={cadenaValorIdGrupo}
              onChange={setCadenaValorIdGrupo}
              hideErrorSpace
              compact
            />
          </div>
        </div>
      )}

      {(grupoItem || (hayCadenaSeleccionada && cdasIndividuales.length > 0)) && (() => {
        const ESTADO_LABEL_EFECTIVO = {
          aprobado: "Aprobado",
          rechazado: "Rechazado",
          pendiente: "Pendiente",
        };

        const calculando = hayCadenaSeleccionada && isLoadingGrupoElegido;
        const estadoLabel = calculando
          ? "Calculando..."
          : estadoEfectivo
            ? ESTADO_LABEL_EFECTIVO[estadoEfectivo]
            : grupoItem
              ? grupoDesactualizado
                ? "Pendiente"
                : resolverLabel(estadosExecuteCda?.opciones, grupoItem.estadoexecutecdaid) || "Desconocido"
              : "Desconocido";
        const tono = calculando ? "neutral" : getEstadoTono(estadoLabel);

        return (
          <section className={`${styles.grupoBar} ${styles[`grupoBar-${tono}`]}`}>
            <div className={styles.grupoBarInfo}>
              <span className={styles.grupoBarIcon}>
                <FiActivity size={17} />
              </span>
              <div>
                <span className={styles.grupoBarTitulo}>
                  Resultado general de la pantalla{estadoEfectivo && !calculando ? " (recalculado)" : ""}
                </span>
                <span className={styles.grupoBarExpresion}>
                  {calculando
                    ? "Calculando con la definición vigente del grupo..."
                    : estadoEfectivo
                      ? "Calculado con la última ejecución conocida de cada CDA activo — incluye forzados puntuales posteriores al cierre del grupo."
                      : grupoItem
                        ? grupoDesactualizado
                          ? "Hay evaluaciones más recientes sin resultado combinado — revisá los CDAs individuales abajo."
                          : grupoItem.expresion || "—"
                        : "Seleccioná la cadena para calcular el resultado combinado."}
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

              <div className={styles.grupoBarAction}>
                <div className={styles.grupoBarInputWrap}>
                  <SelectSimple
                    variant="admin"
                    label="Cadena"
                    placeholder="Cadena de valor"
                    options={opcionesCadenas}
                    value={cadenaValorIdGrupo}
                    onChange={setCadenaValorIdGrupo}
                    hideErrorSpace
                    compact
                  />
                </div>
                <Button
                  variant="outlineBlue"
                  size="sm"
                  onClick={handleReejecutarGrupo}
                  isLoading={isReejecutandoGrupo}
                  disabled={isReejecutandoGrupo}
                >
                  <FiRefreshCw size={13} /> Reejecutar grupo
                </Button>
              </div>
            </div>
          </section>
        );
      })()}

      <section className={styles.cdasSection}>
        <header className={styles.sectionCardHeader}>
          <span className={styles.sectionCardIcon}>
            <FiShield size={15} />
          </span>
          <h3>Estado actual de los CDAs</h3>
        </header>
        <div className={styles.cdasList}>
          {cdasIndividuales.map((item) => {
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
                  {item.valorparticularexpresion && (
                    <span className={styles.cdaRowForzado} title={item.valorparticularexpresion}>
                      <FiEdit3 size={11} /> Forzado con: {item.valorparticularexpresion}
                    </span>
                  )}
                </div>
                <span className={`${styles.badge} ${styles[`badge-${tono}`]}`}>
                  <span className={styles.badgeDot} /> {estadoLabel}
                </span>
                <span className={styles.cdaRowFecha}>{formatearMomentoControl(item.momentocontrol)}</span>
                {puedeReejecutar && (
                  <div className={styles.cdaRowActions}>
                    <Button
                      variant="outlineBlue"
                      size="sm"
                      onClick={() => handleReejecutar(item)}
                      isLoading={isReejecutando && cdaEnCurso === item.cdaid}
                      disabled={isReejecutando || !hayCadenaSeleccionada}
                      title={!hayCadenaSeleccionada ? "Seleccioná la cadena de valor arriba primero" : undefined}
                    >
                      <FiRefreshCw size={13} /> Volver a ejecutar
                    </Button>
                    <Button
                      variant="outlineBlue"
                      size="sm"
                      onClick={() => abrirForzarExpresion(item)}
                      disabled={isReejecutando || !hayCadenaSeleccionada}
                      title={!hayCadenaSeleccionada ? "Seleccioná la cadena de valor arriba primero" : undefined}
                    >
                      <FiEdit3 size={13} /> Forzar expresión
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
                registrado en el historial con la expresión utilizada. No
                actualiza el resultado combinado de la pantalla: para eso hace
                falta reejecutar el grupo aparte (con la regla original, sin
                este forzado).
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
            Esto no cierra el resultado combinado de la pantalla — para eso
            hace falta reejecutar el grupo por separado.
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
            {formatearMomentoControl(item.momentocontrol)}
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
        <Spinner center size={50} color="#4c65e6" />
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
      </div>

      <div className={styles.tabContent}>
        {activeTab === "datos" && <DatosTab socio={socio} />}
        {activeTab === "documentacion" && <DocumentacionTab socio={socio} />}
        {activeTab === "terceros" && <TercerosTab socio={socio} />}
        {activeTab === "cdas" && <CdasTab socio={socio} />}
      </div>

      <HistorialCdaModal
        isOpen={historialOpen}
        onClose={() => setHistorialOpen(false)}
        socio={socio}
      />
    </div>
  );
}
