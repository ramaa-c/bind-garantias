import React, { useState, useEffect, useRef } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
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
import { useParams } from "react-router-dom";
import styles from "./Paso1Cuit.module.css";

import { useVendor } from "../../../../hooks/useVendor";

const getCSharpIsoDate = () => new Date().toISOString().split(".")[0];

const formatearCuit = (cuit) => {
  const limpio = String(cuit || "").replace(/\D/g, "");
  if (limpio.length !== 11) return cuit || "";
  return `${limpio.slice(0, 2)}-${limpio.slice(2, 10)}-${limpio.slice(10)}`;
};

export default function Paso1Cuit({ onValidar, onSocioExistente, onSocioCreado }) {
  const { cadenaSlug } = useParams();
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
  // el socio.
  const [thresholdCruzado, setThresholdCruzado] = useState(false);
  const socioIdCreadoRef = useRef(null);
  const cuitEnProcesoRef = useRef("");
  // Con el UMBRAL corriendo ANTES de Validar Socio (mora) y del chequeo de
  // Certificado PyME, "thresholdCruzado" ya no alcanza para decidir si al
  // cerrar el modal corresponde avanzar a Paso 2: ahora puede haber pasos
  // bloqueantes post-umbral. puedeAvanzarRef solo pasa a true una vez que se
  // llega de verdad al CDA (que nunca bloquea el acceso, pase lo que pase).
  // ultimoPasoFallidoRef indica desde dónde reintentar sin repetir
  // crearSocio/vincularSocioUsuario: "validarSocio" o "cda".
  const puedeAvanzarRef = useRef(false);
  const ultimoPasoFallidoRef = useRef(null);
  // Datos de la empresa (Nosis/AFIP/LUFE) obtenidos al mostrar el cartel de
  // confirmación de vinculación (ver handleValidar) — se guardan acá en
  // "limbo" para poder precargarlos en continuarValidacionCompleta sin
  // volver a golpear las integraciones si el usuario confirma. Si cancela,
  // se descartan (ver onClose del ConfirmacionModal más abajo).
  const datosEmpresaPrefetchRef = useRef(null);

  const [confirmVinculacion, setConfirmVinculacion] = useState({
    isOpen: false,
    cuit: "",
    nombreEmpresa: "",
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
      }

      // Nada bloqueó: antes de avisar que la decisión es irreversible,
      // buscamos los datos reales de la empresa (mismo origen que usa el
      // Paso 2: Nosis con fallback a LUFE y AFIP) para poder mostrar su
      // nombre en el cartel en vez de solo el CUIT.
      datosEmpresaPrefetchRef.current = null;
      let resultadoDatos = null;
      try {
        resultadoDatos = await obtenerDatosEmpresaPorCuit(cuit, opcionesProvincias);
      } catch (errorDatos) {
        console.warn("Error consultando datos de la empresa para el CUIT:", errorDatos);
      }

      if (!resultadoDatos || !resultadoDatos.encontrado) {
        setError("cuit", {
          type: "manual",
          message: "No pudimos verificar los datos de este CUIT. Revisá que sea correcto e intentá nuevamente.",
        });
        return;
      }

      // Un vendor no puede gestionar su propia empresa. Se chequea acá (antes
      // de pedir confirmación de vinculación) y no después del alta - antes
      // corría recién al final de todo el flujo, en AltaDatosEmpresa.jsx.
      const vendorCuitLimpio = vendorData?.vendorCuit
        ? vendorData.vendorCuit.replace(/\D/g, "")
        : null;
      if (isVendor && vendorCuitLimpio && cuit.replace(/\D/g, "") === vendorCuitLimpio) {
        setError("cuit", {
          type: "manual",
          message: "Un vendor no puede gestionar su propia empresa.",
        });
        return;
      }

      datosEmpresaPrefetchRef.current = resultadoDatos;
      cuitEnProcesoRef.current = cuit;
      setConfirmVinculacion({
        isOpen: true,
        cuit,
        nombreEmpresa: resultadoDatos.valores.razonSocial,
      });
    } finally {
      setIsValidatingSocio(false);
    }
  };

  // Corre el CDA de PANTALLA_INGRESO_CUIT y cierra el modal. Se usa tanto
  // en el camino normal (recién cruzado el umbral) como en un reintento
  // post-umbral tras un error de sistema — nunca vuelve a tocar
  // crearSocio/vincularSocioUsuario.
  const ejecutarCdaYFinalizar = async () => {
    // A partir de acá, cierre del modal siempre avanza a Paso 2 sin importar
    // el resultado del CDA (pasa, rechaza o queda pendiente): el CDA nunca
    // bloquea el acceso, solo queda registrado (ver onClose más abajo).
    puedeAvanzarRef.current = true;

    setProcesoModal((prev) => ({
      ...prev,
      hasError: false,
      isSystemError: false,
      pasos: prev.pasos.map((p) =>
        p.id === "cda" ? { ...p, estado: "cargando" } : p,
      ),
    }));

    // ── VALIDACIÓN CDA (PANTALLA_INGRESO_CUIT) — corre contra un
    // socio que ya existe con datos reales. Si no pasa (rechazo 406 o
    // pendiente 409 por integración caída), el historial ya queda
    // asociado a este SocioID sin que hagamos nada especial acá: el
    // admin puede verlo y re-ejecutarlo desde EmpresaDetalle.
    const resultCda = await ejecutarValidaciones(
      "PANTALLA_INGRESO_CUIT",
      { socioId: socioIdCreadoRef.current },
      cadenaValorIdParam,
      usuarioWebId,
    );

    if (!resultCda.success) {
      const esErrorSistema = resultCda.errors.some((e) => e.isSystemError);
      const esPendiente = resultCda.errors.some((e) => e.isPendiente);
      ultimoPasoFallidoRef.current = "cda";

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
                  "No pudimos completar la validación.",
              }
            : p,
        ),
      }));
      return;
    }

    ultimoPasoFallidoRef.current = null;

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

  // ── Validar Socio (SGRPlus Core - mora, etc.) + placeholder de Certificado
  // PyME + CDA. Corre DESPUÉS de crear y vincular el socio (ver
  // continuarValidacionCompleta): si "Validar Socio" rechaza, queda todo
  // bloqueado con el socio ya guardado (no hay rollback, es el
  // comportamiento pedido) - el usuario no puede reintentar con otro CUIT,
  // solo reintentar esta misma verificación u ver el rechazo.
  const ejecutarValidarSocioYSiguientes = async () => {
    const cuit = cuitEnProcesoRef.current;

    // ── VALIDACIÓN SGRPlus Core (mora, etc.)
    try {
      const resultSgrCore = await validarSocioCore({
        cuit,
        cadenaValorId: cadenaValorIdParam,
      });
      if (resultSgrCore?.data && resultSgrCore.data.success === false) {
        ultimoPasoFallidoRef.current = "validarSocio";
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

    ultimoPasoFallidoRef.current = null;
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

    // "Completa el Legajo" (avanzar a Paso 2) solo sigue si el backend ya
    // generó el Certificado PyME del socio (lo genera solo al procesar la
    // vinculación — ver comentario más abajo, en continuarValidacionCompleta).
    // Reemplaza por completo al viejo GET Socio/CertificadoVigente/{Cuit},
    // que ya no se usa acá. El GET nunca da 404: devuelve [] cuando todavía
    // no tiene ninguno, por eso alcanza con chequear que la lista no esté vacía.
    try {
      const certificados = await sociosService.obtenerCertificadoPyme(socioIdCreadoRef.current);
      if (!Array.isArray(certificados) || certificados.length === 0) {
        ultimoPasoFallidoRef.current = "pyme";
        setProcesoModal((prev) => ({
          ...prev,
          hasError: true,
          isSystemError: false,
          pasos: prev.pasos.map((p) =>
            p.id === "pyme"
              ? {
                  ...p,
                  estado: "error",
                  error: "La empresa todavía no tiene un Certificado PyME generado.",
                }
              : p,
          ),
        }));
        return;
      }
    } catch (pymeError) {
      console.error("[Paso1Cuit] Error consultando Socio/CertificadoPYME:", pymeError);
      ultimoPasoFallidoRef.current = "pyme";
      setProcesoModal((prev) => ({
        ...prev,
        hasError: true,
        isSystemError: true,
        pasos: prev.pasos.map((p) =>
          p.id === "pyme"
            ? { ...p, estado: "error", error: "No pudimos verificar el Certificado PyME. Intentá nuevamente." }
            : p,
        ),
      }));
      return;
    }

    ultimoPasoFallidoRef.current = null;
    setProcesoModal((prev) => ({
      ...prev,
      pasos: prev.pasos.map((p) =>
        p.id === "pyme" ? { ...p, estado: "completado" } : p,
      ),
    }));

    await ejecutarCdaYFinalizar();
  };

  // ── FASE 2: el usuario ya confirmó que este es el CUIT correcto. Orden
  // pedido: primero se guarda el socio en base (Nosis/AFIP/LUFE ya
  // aceptados) y se vincula a SocioUsuario, y RECIÉN DESPUÉS corren Validar
  // Socio y el CDA - al revés de como corría antes (esas dos validaciones
  // pasaban ANTES de crear el socio). Si thresholdCruzado ya es true
  // (reintento), no se repite crearSocio/vincularSocioUsuario: se retoma
  // desde el paso que falló (ultimoPasoFallidoRef).
  const continuarValidacionCompleta = async () => {
    const cuit = cuitEnProcesoRef.current;
    if (!cuit) return;

    const yaCruzoUmbral = thresholdCruzado;
    const pasoQueFallo = ultimoPasoFallidoRef.current;
    setIsValidatingSocio(true);

    setProcesoModal({
      isOpen: true,
      titulo: "Validando Empresa",
      pasos: [
        {
          id: "socio",
          etiqueta: "Registrando la empresa",
          estado: yaCruzoUmbral ? "completado" : "cargando",
          descripcion: "Guardando los datos de tu empresa en el sistema.",
        },
        {
          id: "sgrcore",
          etiqueta: "Verificando la empresa",
          estado: !yaCruzoUmbral
            ? "pendiente"
            : pasoQueFallo === "cda"
              ? "completado"
              : "cargando",
          descripcion: "Comprobando el estado de la empresa en nuestro sistema.",
        },
        {
          id: "pyme",
          etiqueta: "Verificando Certificado PyME",
          estado: yaCruzoUmbral && pasoQueFallo === "cda" ? "completado" : "pendiente",
          descripcion: "Comprobando la vigencia del certificado PyME.",
        },
        {
          id: "cda",
          etiqueta: "Verificando requisitos",
          estado: yaCruzoUmbral && pasoQueFallo === "cda" ? "cargando" : "pendiente",
          descripcion:
            "Comprobando políticas de riesgo y negocio para el alta.",
        },
      ],
      hasError: false,
      isSystemError: false,
    });

    try {
      if (yaCruzoUmbral) {
        if (pasoQueFallo === "cda") {
          await ejecutarCdaYFinalizar();
        } else {
          await ejecutarValidarSocioYSiguientes();
        }
        return;
      }

      // ── Datos de la empresa (Nosis con fallback a AFIP/LUFE): ya se
      // obtuvieron en handleValidar para poder mostrar el nombre real en el
      // cartel de confirmación - se reutilizan tal cual acá, sin volver a
      // golpear las integraciones.
      const resultadoDatos = datosEmpresaPrefetchRef.current;

      // Población de campos del formulario: el POST a Socio de acá abajo
      // necesita estos valores resueltos. ciudadid/localidadid siempre
      // llegan en null acá (ver datosEmpresaPorCuit.js: ninguna integración
      // resuelve un id, solo texto) - se completan recién en el Paso 2 vía
      // el select de Ciudad/Localidad. Si se validaran con el resto, el
      // requisito de "ciudad obligatoria" saltaría en rojo antes de que el
      // usuario llegue siquiera a Paso 2.
      Object.entries(resultadoDatos.valores).forEach(([campo, val]) => {
        const shouldValidate = campo !== "ciudadid" && campo !== "localidadid";
        setValue(campo, val, { shouldValidate });
      });
      if (resultadoDatos.valores.sinNumero) clearErrors("numero");

      // ── UMBRAL: acá el socio pasa a existir de verdad - ahora corre antes
      // de Validar Socio y del chequeo de Certificado PyME (antes corría
      // después de ambos). POST con los datos recién resueltos + vinculación
      // a SocioUsuario.
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
        // No existe ProvinciaID en Socio (swagger confirmado) - el backend
        // la resuelve solo a partir de CiudadID. No se manda.
        fechainicioactividades:
          valores.fechainicioactividades || getCSharpIsoDate(),
        tipoactividadglobalid: 0,
        tipocanalcomercializacionid:
          cadenaObj?.tipocanalcomercializacionid ||
          cadenaObj?.TipoCanalComercializacionID ||
          0,
        // Vacío a propósito: EmailFacturacion es obligatorio recién en el
        // Paso 2 (ver FacturacionModal/AltaDatosEmpresaSchema) — dejarlo
        // sin cargar acá permite usarlo como señal de "onboarding
        // incompleto", igual que ya se hace con `telefono` (ver
        // OnboardingGuard.jsx). Si mandáramos el email de login acá, un
        // socio recién creado ya parecería tener el Paso 2 completo.
        emailfacturacion: "",
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
            p.id === "socio"
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
      // Bloqueamos el CUIT ACÁ, antes de vincularlo o correr Validar
      // Socio/CDA - si cualquiera de esos pasos falla, ya no hay forma de
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

      // El backend genera su propio registro de SocioCertificadoPYME al
      // procesar la vinculación - no hay nada que el frontend deba escribir
      // acá (ver TODO en ejecutarValidarSocioYSiguientes para el GET).

      setProcesoModal((prev) => ({
        ...prev,
        pasos: prev.pasos.map((p) =>
          p.id === "socio"
            ? { ...p, estado: "completado" }
            : p.id === "sgrcore"
              ? { ...p, estado: "cargando" }
              : p,
        ),
      }));

      await ejecutarValidarSocioYSiguientes();
    } catch (err) {
      // Este catch envuelve todo lo que corre entre el padrón y el CDA
      // (crearSocio, vincularSocioUsuario, etc.) — sin loguear acá no hay
      // forma de saber cuál de esos pasos fue el que tiró, ni por qué.
      console.error("[Paso1Cuit] Error inesperado en continuarValidacionCompleta:", err);
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
          // Una vez que se llega de verdad al CDA (puedeAvanzarRef), cerrar
          // siempre avanza a Paso 2 sin importar su resultado (acordado con
          // el equipo el 2026-08-13, mismo criterio que OnboardingGuard): un
          // CDA rechazado/pendiente sigue bloqueando la migración a SGR+ más
          // adelante, y el socio ve un aviso permanente en el legajo — ver
          // LegajoUniversalBar. Si en cambio lo que falló fue Validar Socio
          // (mora) o el registro del socio, puedeAvanzarRef sigue en false:
          // queda todo bloqueado con el socio ya guardado, tal cual se pidió.
          setProcesoModal({
            isOpen: false,
            titulo: "",
            pasos: [],
            hasError: false,
            isSystemError: false,
          });
          if (puedeAvanzarRef.current && onValidar) {
            onValidar();
          }
        }}
        onRetry={continuarValidacionCompleta}
      />

      <ConfirmacionModal
        isOpen={confirmVinculacion.isOpen}
        onClose={() => {
          setConfirmVinculacion({ isOpen: false, cuit: "", nombreEmpresa: "" });
          datosEmpresaPrefetchRef.current = null;
        }}
        onConfirm={() => {
          setConfirmVinculacion({ isOpen: false, cuit: "", nombreEmpresa: "" });
          continuarValidacionCompleta();
        }}
        titulo="Confirmá tu empresa"
        mensaje={`Vas a vincular la empresa ${confirmVinculacion.nombreEmpresa} (CUIT ${formatearCuit(confirmVinculacion.cuit)}) a tu usuario. Una vez que confirmes, no vas a poder modificarla — asegurate de que sea la correcta antes de continuar.`}
        confirmText="Confirmar y continuar"
        cancelText="Volver a revisar"
      />
    </div>
  );
}
