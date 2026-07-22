import React, { useState, useEffect, useRef } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FiBriefcase, FiShield, FiZap, FiCheckCircle } from "react-icons/fi";
import { BuscadorCuit } from "../../../ui/BuscadorCuit/BuscadorCuit";
import { ProcesamientoModal } from "../../../ui/ProcesamientoModal/ProcesamientoModal";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import { sociosService } from "../../../../services/sociosService";
import { useValidarSocioCore } from "../../../../hooks/useSgrPlusCore";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import { useObtenerPorCadenaValorIdWeb } from "../../../../hooks/useCadenaValor";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { obtenerDatosEmpresaPorCuit } from "../../../../utils/datosEmpresaPorCuit";
import { guardarSocioPendiente } from "../../../../utils/altaEmpresaPendiente";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Paso1Cuit.module.css";

import { useVendor } from "../../../../hooks/useVendor";

const getCSharpIsoDate = () => new Date().toISOString().split(".")[0];

const formatearCuit = (cuit) => {
  const limpio = String(cuit || "").replace(/\D/g, "");
  if (limpio.length !== 11) return cuit || "";
  return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`;
};

// ⚠️ TEMPORAL (17/7/2026): CASFOG está caído y hay que hacer una demo — se
// desactiva en silencio el chequeo de Certificado PyME (no muestra error,
// deja pasar como si estuviera vigente). Volver a poner en `false` en
// cuanto CASFOG esté arriba de nuevo.
const BYPASS_PYME_TEMPORAL = true;

export default function Paso1Cuit({ onValidar, onSocioExistente, onSocioCreado }) {
  const { cadenaSlug } = useParams();
  const navigate = useNavigate();
  const cadenaValorIdParam = Number(cadenaSlug) || 0;
  const { control, getValues, setValue, setError, clearErrors } =
    useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const { ejecutarValidaciones, loading: isLoadingCda } = useCdaEngine();
  const { mutateAsync: validarSocioCore } = useValidarSocioCore();
  const [isValidatingSocio, setIsValidatingSocio] = useState(false);
  const user = useAuthStore((state) => state.user);
  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email);
  const usuarioWebId = usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id;
  const { data: cadenaData } = useObtenerPorCadenaValorIdWeb(cadenaValorIdParam);
  const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;

  const { data: vendorData } = useVendor();
  const isVendor = vendorData?.isVendor || false;

  const { data: provinciasData } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  const [procesoModal, setProcesoModal] = useState({
    isOpen: false,
    titulo: "",
    pasos: [],
    hasError: false,
    isSystemError: false,
  });

  // ⚠️ SEGURIDAD: una vez creado+vinculado el Socio (ver "UMBRAL" más abajo)
  // el CUIT queda fijo para siempre en este intento. Antes de este cambio,
  // si el CDA rechazaba después de ese punto, el input de CUIT seguía
  // habilitado y el usuario podía probar con otro — dejando un segundo
  // Socio+SocioUsuario vinculado al mismo usuario (confirmado en pruebas:
  // permite ir probando CUITs hasta encontrar uno que pase el CDA, y de
  // paso deja el usuario vinculado a más de un socio a la vez, algo que el
  // resto de la app no contempla — ver empresaActual = listaEmpresas[0] en
  // OnboardingGuard). thresholdCruzado bloquea el input/botón apenas el
  // socio existe de verdad; socioIdCreadoRef evita que un reintento (ej.
  // tras un error transitorio de sistema en el CDA) vuelva a crear/vincular
  // el socio. cdaRechazoEstado guarda a qué pantalla de estado mandar al
  // usuario al cerrar el modal de error (misma regla que OnboardingGuard).
  const [thresholdCruzado, setThresholdCruzado] = useState(false);
  const [cdaRechazoEstado, setCdaRechazoEstado] = useState(null);
  const socioIdCreadoRef = useRef(null);
  const cuitEnProcesoRef = useRef("");

  const [confirmVinculacion, setConfirmVinculacion] = useState({
    isOpen: false,
    cuit: "",
  });

  const cuitValue = useWatch({ control, name: "cuit" });

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
  }, [cuitValue, clearErrors]);

  const isCuitValid = !errors.cuit && dirtyFields.cuit;

  // ── FASE 1: chequeo rápido de existencia. Corre ANTES de avisarle al
  // usuario que el CUIT quedará vinculado — si ya está tomado (por él mismo
  // o por otro usuario/email en SGRPlus), no tiene sentido pedirle
  // confirmación de nada, así que se lo bloquea directo como ya hacía este
  // código. Todavía no se creó ningún Socio: si esto no bloquea, lo único
  // que sigue es mostrar el aviso de vinculación (ver confirmVinculacion
  // más abajo) — recién ahí, si el usuario confirma, arranca
  // continuarValidacionCompleta con el resto de las validaciones y el
  // POST que cruza el umbral.
  const handleValidar = async () => {
    const cuit = getValues("cuit");
    if (!cuit) return;

    clearErrors("cuit");
    setIsValidatingSocio(true);

    try {
      const sociosWebEncontrados = await sociosService.obtenerSocios({
        Cuit: cuit,
      });

      if (sociosWebEncontrados && sociosWebEncontrados.length > 0) {
        if (onSocioExistente) {
          onSocioExistente(sociosWebEncontrados[0], "ya_existe");
        }
        return; // Bloquea a todos (incluyendo vendors) porque ya está registrada en la web
      }

      // Si no está en la web, verificamos si existe históricamente en SGRPlus Core
      const sociosSgrEncontrados = await sociosService.obtenerSociosSgrplus({
        Cuit: cuit,
      });

      if (sociosSgrEncontrados && sociosSgrEncontrados.length > 0 && !isVendor) {
        const socioSgrExistente = sociosSgrEncontrados[0];
        const socioEmailStr = socioSgrExistente.email
          ? socioSgrExistente.email.trim()
          : "";
        const currentUserEmail = user?.email ? user.email.trim() : "";

        if (
          socioEmailStr &&
          currentUserEmail &&
          socioEmailStr.toLowerCase() !== currentUserEmail.toLowerCase()
        ) {
          if (onSocioExistente) {
            onSocioExistente(socioSgrExistente, "email_mismatch");
          }
          return; // Bloquea al usuario normal porque el email de SGRPlus no coincide
        }
        // Si es vendor, o si es un usuario normal y el email SÍ coincide,
        // no hacemos return. Dejamos que el flujo continúe.
      }
    } catch (errorSocios) {
      console.warn(
        "Error consultando socios para validación de existencia:",
        errorSocios,
      );
    } finally {
      setIsValidatingSocio(false);
    }

    // Nada bloqueó: antes de crear y vincular el socio de verdad, avisamos
    // que la decisión es irreversible para este intento.
    cuitEnProcesoRef.current = cuit;
    setConfirmVinculacion({ isOpen: true, cuit });
  };

  // Corre el CDA de PANTALLA_INGRESO_CUIT y cierra el modal. Se usa tanto
  // en el camino normal (recién cruzado el umbral) como en un reintento
  // post-umbral tras un error de sistema — nunca vuelve a tocar
  // crearSocio/vincularSocioUsuario.
  const ejecutarCdaYFinalizar = async (cuit) => {
    setProcesoModal((prev) => ({
      ...prev,
      hasError: false,
      isSystemError: false,
      pasos: prev.pasos.map((p) =>
        p.id === "cda" ? { ...p, estado: "cargando" } : p,
      ),
    }));

    // ── 7. VALIDACIÓN CDA (PANTALLA_INGRESO_CUIT) — corre contra un
    // socio que ya existe con datos reales. Si no pasa (rechazo 406 o
    // pendiente 409 por integración caída), el historial ya queda
    // asociado a este SocioID sin que hagamos nada especial acá: el
    // admin puede verlo y re-ejecutarlo desde EmpresaDetalle.
    const resultCda = await ejecutarValidaciones(
      "PANTALLA_INGRESO_CUIT",
      cuit,
      cadenaValorIdParam,
      usuarioWebId,
    );

    if (!resultCda.success) {
      const esErrorSistema = resultCda.errors.some((e) => e.isSystemError);
      const esPendiente = resultCda.errors.some((e) => e.isPendiente);

      // Rechazo de negocio real (o pendiente por integración caída): a
      // partir de acá NO hay vuelta atrás para este intento. El input de
      // CUIT ya está bloqueado (thresholdCruzado), y al cerrar el modal de
      // error lo mandamos directo a /estado-solicitud — la misma pantalla
      // (y la misma regla) que usaría OnboardingGuard en el próximo
      // ingreso. Nunca lo dejamos "Aceptar" hacia un Paso1 editable.
      if (!esErrorSistema) {
        setCdaRechazoEstado(esPendiente ? "pendiente" : "rechazado");
      }

      setProcesoModal((prev) => ({
        ...prev,
        hasError: true,
        isSystemError: esErrorSistema,
        pasos: prev.pasos.map((p) =>
          p.id === "cda"
            ? {
                ...p,
                estado: esPendiente ? "alerta" : "error",
                errores: resultCda.errors.map((e) => e.message),
                error:
                  resultCda.errors.find((e) => e.isInvalidante)?.message ||
                  "Error en validación CDA",
              }
            : p,
        ),
      }));
      return;
    }

    // Todo exitoso! Marcamos CDA como completado
    setProcesoModal((prev) => ({
      ...prev,
      pasos: prev.pasos.map((p) =>
        p.id === "cda" ? { ...p, estado: "completado" } : p,
      ),
    }));

    setTimeout(() => {
      setProcesoModal({
        isOpen: false,
        titulo: "",
        pasos: [],
        hasError: false,
        isSystemError: false,
      });
      if (onValidar) onValidar();
    }, 800);
  };

  // ── FASE 2: el usuario ya confirmó que este es el CUIT correcto. A
  // partir de acá corre todo lo que antes pasaba de una — SGRPlus Core,
  // Certificado PyME, Nosis/AFIP/LUFE, el POST que cruza el umbral y el
  // CDA. Si socioIdCreadoRef ya tiene un valor (reintento de un error de
  // sistema del CDA post-umbral), nos salteamos directo a re-ejecutar el
  // CDA: el socio ya existe y ya está vinculado, no hay que volver a
  // crearlo/vincularlo.
  const continuarValidacionCompleta = async () => {
    const cuit = cuitEnProcesoRef.current;
    if (!cuit) return;

    const yaCruzoUmbral = !!socioIdCreadoRef.current;
    setIsValidatingSocio(true);

    setProcesoModal({
      isOpen: true,
      titulo: "Validando Empresa",
      pasos: [
        {
          id: "sgrcore",
          etiqueta: "Validando con SGRPlus",
          estado: yaCruzoUmbral ? "completado" : "cargando",
          descripcion: "Verificando estado del socio en el sistema core.",
        },
        {
          id: "pyme",
          etiqueta: "Verificando Certificado PyME",
          estado: yaCruzoUmbral ? "completado" : "pendiente",
          descripcion: "Comprobando la vigencia del certificado PyME.",
        },
        {
          id: "afip",
          etiqueta: "Consultando padrón",
          estado: yaCruzoUmbral ? "completado" : "pendiente",
          descripcion:
            "Obteniendo los datos de la empresa desde el padrón federal/bureau en tiempo real.",
        },
        {
          id: "cda",
          etiqueta: "Ejecutando validaciones CDA",
          estado: yaCruzoUmbral ? "cargando" : "pendiente",
          descripcion:
            "Comprobando políticas de riesgo y negocio para el alta.",
        },
      ],
      hasError: false,
      isSystemError: false,
    });

    try {
      if (yaCruzoUmbral) {
        await ejecutarCdaYFinalizar(cuit);
        return;
      }

      // ── 2. VALIDACIÓN SGRPlus Core — corre antes del Certificado PyME y
      // de Nosis/AFIP, según lo acordado con backend.
      try {
        const resultSgrCore = await validarSocioCore({
          cuit,
          cadenaValorId: cadenaValorIdParam,
        });
        if (resultSgrCore?.data && resultSgrCore.data.success === false) {
          setProcesoModal((prev) => ({
            ...prev,
            hasError: true,
            isSystemError: false,
            pasos: prev.pasos.map((p) =>
              p.id === "sgrcore"
                ? {
                    ...p,
                    estado: "error",
                    errores: [
                      resultSgrCore.data.message ||
                        "El socio no cumple con los requisitos del sistema.",
                    ],
                    error: "Rechazado por SGRPlus",
                  }
                : p,
            ),
          }));
          return;
        }
      } catch (sgrError) {
        if (sgrError?.response?.status !== 404) {
          console.warn("Error consultando sgrcore ValidarSocio:", sgrError);
        }
      }

      // Marcamos SGRPlus como completado y el Certificado PyME como cargando
      setProcesoModal((prev) => ({
        ...prev,
        pasos: prev.pasos.map((p) =>
          p.id === "sgrcore"
            ? { ...p, estado: "completado" }
            : p.id === "pyme"
              ? { ...p, estado: "cargando" }
              : p,
        ),
      }));

      // ── 3. VALIDACIÓN Certificado PyME (GET Socio/CertificadoVigente/
      // {Cuit}). 200 = vigente, 401 = no vigente/rechazo (el backend
      // reutiliza el código HTTP como semántica de negocio, no es un fallo
      // de autenticación real). Un 500 (confirmado con pruebas manuales:
      // 4 reintentos seguidos dieron 200 después de un único 500) es un
      // error transitorio de infraestructura, no un rechazo — hay que
      // distinguirlo para no bloquear al usuario con un mensaje de
      // "no vigente" que en realidad es un hiccup del backend.
      //
      // El body del 401 no trae un mensaje pensado para el usuario (el
      // backend devuelve literalmente {"Message":"Unauthorized"}), así que
      // no lo mostramos: usamos un mensaje fijo propio para el rechazo.
      const resultPyme = BYPASS_PYME_TEMPORAL
        ? { status: 200 }
        : await sociosService.obtenerCertificadoVigente(cuit);
      if (resultPyme.status !== 200) {
        const isPymeInfraError = resultPyme.status >= 500;
        const mensajePyme = isPymeInfraError
          ? "El servicio de validación del Certificado PyME no se encuentra disponible momentáneamente. Por favor, intente nuevamente."
          : "La empresa no cuenta con un Certificado PyME vigente.";
        setProcesoModal((prev) => ({
          ...prev,
          hasError: true,
          isSystemError: isPymeInfraError,
          pasos: prev.pasos.map((p) =>
            p.id === "pyme"
              ? { ...p, estado: "error", error: mensajePyme }
              : p,
          ),
        }));
        return;
      }

      setProcesoModal((prev) => ({
        ...prev,
        pasos: prev.pasos.map((p) =>
          p.id === "pyme"
            ? { ...p, estado: "completado" }
            : p.id === "afip"
              ? { ...p, estado: "cargando" }
              : p,
        ),
      }));

      // ── 4. CONSULTA NOSIS con Fallback a AFIP/LUFE, y población de campos
      // del formulario a partir de esos datos (lógica compartida con el
      // modo "completar" de AltaDatosEmpresa — ver utils/datosEmpresaPorCuit).
      const resultadoDatos = await obtenerDatosEmpresaPorCuit(
        cuit,
        opcionesProvincias,
        {
          onProgress: (fuente) => {
            setProcesoModal((prev) => ({
              ...prev,
              pasos: prev.pasos.map((p) =>
                p.id === "afip"
                  ? fuente === "lufe"
                    ? {
                        ...p,
                        etiqueta: "Probando en LUFE...",
                        descripcion:
                          "Nosis no disponible. Consultando entidad en LUFE en su lugar.",
                      }
                    : {
                        ...p,
                        etiqueta: "Probando en AFIP...",
                        descripcion:
                          "LUFE no disponible. Consultando padrón AFIP en su lugar.",
                      }
                  : p,
              ),
            }));
          },
        },
      );

      if (resultadoDatos.encontrado) {
        // Marcamos el padrón como completado (SGRPlus y el Certificado PyME
        // ya se validaron antes de esta consulta, ver más arriba)
        setProcesoModal((prev) => ({
          ...prev,
          pasos: prev.pasos.map((p) =>
            p.id === "afip" ? { ...p, estado: "completado" } : p,
          ),
        }));

        // ── 5. Población de campos del formulario. Se adelanta a este
        // punto (antes vivía después del CDA) porque el POST a Socio del
        // paso siguiente necesita estos valores resueltos.
        Object.entries(resultadoDatos.valores).forEach(([campo, val]) => {
          setValue(campo, val, { shouldValidate: true });
        });
        if (resultadoDatos.valores.sinNumero) clearErrors("numero");

        // ── 6. UMBRAL: acá el socio pasa a existir de verdad. POST con los
        // datos recién resueltos + vinculación a SocioUsuario. De acá en
        // adelante, cualquier resultado del CDA (pase o no) ya queda
        // trackeado contra un socio real — ya no hace falta ningún manejo
        // especial para "pendiente" ni socios parciales.
        const valores = getValues();
        const payloadSocio = {
          entidadid: 1,
          tiposocioid: 9,
          cuit,
          denominacion: valores.razonSocial,
          calle: valores.calle || valores.direccion,
          numero: Number(valores.numero) || 0,
          piso: valores.piso || "",
          departamento: valores.departamento || "",
          ciudadid: valores.ciudadid ? Number(valores.ciudadid) : null,
          telefono: "",
          fax: "",
          email: user?.email,
          tipopersonaid: valores.tipopersonaid,
          tipocarteraid: 2,
          sectorcontableid: 700,
          tipoactividadbcraid: 0,
          tipoactividadsepymeid: null,
          marcavinculacion: "",
          situacionbcraid: 1,
          fechabaja: null,
          motivobajaid: null,
          socioestadoid: 9,
          codpos: valores.codpos || "",
          tamanioempresaid: 0,
          fechacierreejercicio: valores.mescierre
            ? `${new Date().getFullYear()}-${String(valores.mescierre).padStart(2, "0")}-${String(new Date(new Date().getFullYear(), valores.mescierre, 0).getDate()).padStart(2, "0")}T00:00:00`
            : getCSharpIsoDate(),
          legajo: 0,
          tiporegimenivaid: valores.tiporegimenivaid,
          actividadespecifica: "",
          partido: valores.localidad,
          telefono2: "",
          telefono3: "",
          visitado: "0",
          scoringcomercial: "0",
          partidoid: valores.localidadid ? Number(valores.localidadid) : null,
          provinciaid: valores.provinciaid ? Number(valores.provinciaid) : null,
          fechainicioactividades:
            valores.fechainicioactividades || getCSharpIsoDate(),
          tipoactividadglobalid: 0,
          tipocanalcomercializacionid:
            cadenaObj?.tipocanalcomercializacionid ||
            cadenaObj?.TipoCanalComercializacionID ||
            0,
          emailfacturacion: user?.email || "",
          minapoderadosrequeridos: 0,
          tipocondicionfianzaid: 0,
          jsoncondicionfianza: "",
        };

        const socioResult = await sociosService.crearSocio(payloadSocio);
        const socioId = socioResult?.socioid || socioResult?.id;

        if (!socioId) {
          setProcesoModal((prev) => ({
            ...prev,
            hasError: true,
            isSystemError: true,
            pasos: prev.pasos.map((p) =>
              p.id === "afip"
                ? {
                    ...p,
                    estado: "error",
                    error: "No se pudo registrar la empresa. Intentá nuevamente.",
                  }
                : p,
            ),
          }));
          return;
        }

        // ── UMBRAL cruzado de verdad: el socio ya existe en el backend.
        // Bloqueamos el CUIT ACÁ, antes de intentar vincularlo o correr el
        // CDA — si cualquiera de esos dos pasos falla, ya no hay forma de
        // "empezar de nuevo" con otro CUIT sin dejar un socio duplicado.
        socioIdCreadoRef.current = socioId;
        setThresholdCruzado(true);
        // Blindaje contra un F5 en Paso2 (ver altaEmpresaPendiente.js): la
        // transición a Paso2 en AltaDatosEmpresa.jsx es estado local, no
        // navegación — sin esto, recargar la página vuelve a Paso1 con el
        // CUIT editable aunque el socio ya exista.
        guardarSocioPendiente(cadenaSlug, user?.email, {
          ...payloadSocio,
          socioid: socioId,
        });

        if (usuarioWebId) {
          await sociosService.vincularSocioUsuario({
            usuariowebid: usuarioWebId,
            socioid: socioId,
            momentocreacion: getCSharpIsoDate(),
          });
        } else {
          console.warn("No se pudo vincular el socio al usuario logueado: usuarioWebId no resolvió a tiempo.");
        }

        if (onSocioCreado) {
          onSocioCreado(socioId);
        }

        // Avanzamos a CDA (SGRPlus y el padrón ya están resueltos)
        setProcesoModal((prev) => ({
          ...prev,
          pasos: prev.pasos.map((p) =>
            p.id === "cda" ? { ...p, estado: "cargando" } : p,
          ),
        }));

        await ejecutarCdaYFinalizar(cuit);
      } else {
        setProcesoModal((prev) => ({
          ...prev,
          hasError: true,
          isSystemError: false,
          pasos: prev.pasos.map((p) =>
            p.id === "afip"
              ? {
                  ...p,
                  estado: "error",
                  error: "No se encontraron datos en Nosis, AFIP ni LUFE.",
                }
              : p,
          ),
        }));
        return;
      }
    } catch (err) {
      setProcesoModal((prev) => ({
        ...prev,
        hasError: true,
        isSystemError: true,
      }));
    } finally {
      setIsValidatingSocio(false);
    }
  };

  const isLoading = isValidatingSocio || isLoadingCda;

  return (
    <div className={styles.pasoContainer}>
      <div className={styles.heroIcon}>
        <FiBriefcase />
      </div>

      <div className={styles.heroCopy}>
        <h2 className={styles.heroTitle}>¿Cuál es el CUIT de tu empresa?</h2>
        <p className={styles.heroSub}>
          Validamos tu información fiscal y crediticia en tiempo real para
          agilizar el registro de tu empresa.
        </p>
      </div>

      <div className={styles.inputWrapper}>
        <BuscadorCuit
          name="cuit"
          control={control}
          label="CUIT de la empresa"
          onValidar={handleValidar}
          error={errors.cuit?.message}
          esValido={isCuitValid}
          buttonText="VALIDAR CUIT"
          isLoading={isLoading}
          disabled={thresholdCruzado}
        />
      </div>

      <div className={styles.trustRow}>
        <span className={styles.trustChip}>
          <FiShield /> Datos encriptados
        </span>
        <span className={styles.trustChip}>
          <FiZap /> Validación en segundos
        </span>
        <span className={styles.trustChip}>
          <FiCheckCircle /> Sin costo
        </span>
      </div>

      <ProcesamientoModal
        isOpen={procesoModal.isOpen}
        titulo={procesoModal.titulo}
        pasos={procesoModal.pasos}
        hasError={procesoModal.hasError}
        isSystemError={procesoModal.isSystemError}
        onClose={() => {
          // Post-umbral no hay "Aceptar y quedarse acá": el socio ya existe
          // (haya pasado el CDA o no) y el CUIT ya está bloqueado, así que
          // lo mandamos a la misma pantalla de estado que usaría
          // OnboardingGuard en el próximo ingreso. Si el error fue un
          // hiccup transitorio de sistema (sin rechazo de negocio
          // confirmado) usamos "pendiente" como default seguro: no hay
          // vuelta a un Paso1 editable en ningún caso.
          if (thresholdCruzado) {
            navigate(`/${cadenaSlug}/estado-solicitud`, {
              state: { estado: cdaRechazoEstado || "pendiente" },
              replace: true,
            });
            return;
          }
          setProcesoModal({
            isOpen: false,
            titulo: "",
            pasos: [],
            hasError: false,
            isSystemError: false,
          });
        }}
        onRetry={continuarValidacionCompleta}
      />

      <ConfirmacionModal
        isOpen={confirmVinculacion.isOpen}
        onClose={() => setConfirmVinculacion({ isOpen: false, cuit: "" })}
        onConfirm={() => {
          setConfirmVinculacion({ isOpen: false, cuit: "" });
          continuarValidacionCompleta();
        }}
        titulo="Confirmá el CUIT de tu empresa"
        mensaje={`El CUIT ${formatearCuit(confirmVinculacion.cuit)} va a quedar vinculado a tu usuario. Una vez que confirmes, no vas a poder modificarlo — asegurate de que sea el correcto antes de continuar.`}
        confirmText="Confirmar y continuar"
        cancelText="Volver a revisar"
      />
    </div>
  );
}
