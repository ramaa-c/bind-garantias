import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { AltaDatosEmpresaSchema } from "../../../../schemas/AltaDatosEmpresaSchema";
import { BarraProgreso, Button, Modal } from "../../../../components/ui";
import { LoadingScreen } from "../../../../components/ui";
import { Paso1Cuit, Paso2Datos } from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { sociosService } from "../../../../services/sociosService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { requisitosService } from "../../../../services/requisitosService";
import { enriquecerSociosLufeAfip } from "../../../../utils/enriquecimiento";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import { useObtenerPorCadenaValorIdWeb } from "../../../../hooks/useCadenaValor";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { obtenerDatosEmpresaPorCuit } from "../../../../utils/datosEmpresaPorCuit";
import {
  leerSocioPendiente,
  limpiarSocioPendiente,
} from "../../../../utils/altaEmpresaPendiente";
import { useVendor } from "../../../../hooks/useVendor";
import { useChannel } from "../../../../context/ChannelContext";
import styles from "./AltaDatosEmpresa.module.css";
import { toast } from "sonner";

const getCSharpIsoDate = () => {
  const date = new Date();
  return date.toISOString().split(".")[0];
};

// Cuando OnboardingGuard detecta que el socio ya cruzó el umbral (CDA
// aprobado) pero nunca completó el Paso 2, redirige acá con el socio en
// location.state — este mapeo reconstruye los valores del formulario a
// partir de ese registro (inverso de payloadSocio en onSubmitFinal).
const mapearSocioAValoresFormulario = (socio) => {
  const numero = Number(socio.numero ?? socio.Numero) || 0;
  let mescierre = null;
  const fechaCierre = socio.fechacierreejercicio || socio.FechaCierreEjercicio;
  if (fechaCierre) {
    const fecha = new Date(fechaCierre);
    if (!Number.isNaN(fecha.getTime())) mescierre = fecha.getMonth() + 1;
  }
  const calle = socio.calle || socio.Calle || "";
  const localidad = socio.partido || socio.Partido || "";

  return {
    cuit: socio.cuit || socio.Cuit || "",
    razonSocial: socio.denominacion || socio.Denominacion || "",
    direccion: `${calle} ${numero || ""}`.trim(),
    calle,
    sinNumero: !numero,
    numero: numero || "",
    piso: socio.piso || socio.Piso || "",
    departamento: socio.departamento || socio.Departamento || "",
    localidad,
    localidadid: Number(socio.partidoid ?? socio.PartidoId) || 0,
    ciudad: localidad,
    ciudadid: Number(socio.ciudadid ?? socio.CiudadID) || 0,
    provincia: "",
    provinciaid: Number(socio.provinciaid ?? socio.ProvinciaId) || 0,
    codpos: socio.codpos || socio.CodPos || "",
    celular: socio.telefono || socio.Telefono || "",
    emailfacturacion:
      socio.emailfacturacion || socio.EmailFacturacion || "",
    tipopersonaid: Number(socio.tipopersonaid ?? socio.TipoPersonaID) || 0,
    mescierre,
    fechainicioactividades:
      socio.fechainicioactividades || socio.FechaInicioActividades || null,
    tiporegimenivaid:
      Number(socio.tiporegimenivaid ?? socio.TipoRegimenIvaId) || 0,
    tipoactividadsepymeid:
      socio.tipoactividadsepymeid || socio.TipoActividadSEPYMEID || null,
  };
};

export const AltaDatosEmpresa = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { channelInfo } = useChannel();
  const { cadenaSlug } = useParams();
  const cadenaValorId = Number(cadenaSlug);
  const { data: cadenaData } = useObtenerPorCadenaValorIdWeb(cadenaValorId);
  const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;
  const user = useAuthStore((state) => state.user);

  // location.state.socioParaCompletar es lo que manda OnboardingGuard
  // cuando resuelve desde el servidor que el socio ya cruzó el umbral. Si
  // no está (ej. un F5 en Paso2: esa transición es estado local, no
  // navegación, así que no hay location.state que sobreviva) caemos al
  // respaldo guardado en sessionStorage por Paso1Cuit en el momento exacto
  // en que se cruzó el umbral — ver utils/altaEmpresaPendiente.js.
  const [socioParaCompletar] = useState(
    () =>
      location.state?.socioParaCompletar ||
      leerSocioPendiente(cadenaSlug, user?.email) ||
      null,
  );

  const [pasoActual, setPasoActual] = useState(socioParaCompletar ? 2 : 1);
  const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState(
    socioParaCompletar ? 2 : 1,
  );
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const [socioExistenteModal, setSocioExistenteModal] = useState({
    isOpen: false,
    socioData: null,
    reason: null,
  });

  // Acordado con backend: el POST a Socio (con los datos de Nosis/AFIP) y la
  // vinculación a SocioUsuario ahora se hacen en Paso1Cuit, ANTES de
  // ejecutar el CDA — no acá. Para cuando el usuario llega al Paso 2, el
  // socio ya existe; el submit acá abajo siempre completa ese mismo
  // registro (PUT), nunca crea uno nuevo.
  // Number(...): socioParaCompletar.socioid viene de GET /Socio/{id}
  // (useEmpresasCompletas), un endpoint distinto del que arma la queryKey
  // que observa OnboardingGuard (ver Number() en useEmpresasCompletas,
  // useSocios.js) — sin normalizar acá, invalidateQueries más abajo puede no
  // calzar con esa queryKey y el guard sigue viendo el socio sin teléfono.
  const [socioId, setSocioId] = useState(() => {
    const id = socioParaCompletar?.socioid ?? socioParaCompletar?.SocioID ?? null;
    return id !== null && id !== undefined ? Number(id) : null;
  });

  const setActiveSocioId = useAuthStore((state) => state.setActiveSocioId);
  const [isNavigating] = useState(false);

  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email);
  const usuariowebidReal =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id;

  // ⚠️ Única fuente de verdad del estado vendor para todo el wizard: se
  // resuelve ACÁ, se espera (isPendingVendor, ver el gate de carga más abajo)
  // ANTES de renderizar Paso1/Paso2, y se pasa ya resuelto como prop a
  // Paso1Cuit — que ya no llama a useVendor() por su cuenta. Antes cada uno
  // tenía su propio useQuery independiente: mismo cache (mismo queryKey), pero
  // nada garantizaba que Paso1Cuit ya lo tuviera resuelto al momento en que el
  // usuario clickeaba "VALIDAR CUIT" (isVendor podía leerse en false por una
  // carrera, justo el escenario que se pidió eliminar — el chequeo debe
  // resolverse siempre ANTES de Paso 1, nunca durante ni después).
  const { data: vendorData, isPending: isPendingVendor } = useVendor();
  const isVendor = vendorData?.isVendor || false;
  const vendorCuit = vendorData?.vendorCuit || null;

  const { data: provinciasData, isPending: isPendingProvincias } =
    useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

  // El mapeo desde el Socio guardado (más abajo) es un fallback inmediato:
  // Provincia no tiene columna en el backend (nunca se persiste) y
  // Localidad/Ciudad se guardan sin ID, así que en cuanto se resuelven las
  // provincias volvemos a consultar Nosis/AFIP para ese CUIT (mismo
  // utilitario que usa Paso1Cuit) y pisamos esos campos con datos frescos.
  const [cargandoDatosCompletar, setCargandoDatosCompletar] = useState(
    !!socioParaCompletar,
  );

  const metodosFormulario = useForm({
    resolver: zodResolver(AltaDatosEmpresaSchema),
    mode: "onTouched",
    defaultValues: socioParaCompletar
      ? mapearSocioAValoresFormulario(socioParaCompletar)
      : {
          cuit: "",
          razonSocial: "",
          direccion: "",
          calle: "",
          sinNumero: false,
          numero: "",
          piso: "",
          departamento: "",
          localidad: "",
          localidadid: 0,
          ciudad: "",
          ciudadid: 0,
          provincia: "",
          provinciaid: 0,
          codpos: "",
          celular: "",
          emailfacturacion: "",
          tipopersonaid: 0,
          mescierre: null,
          fechainicioactividades: null,
          tiporegimenivaid: 0,
          tipoactividadsepymeid: null,
        },
  });

  const { handleSubmit, trigger, reset, register } = metodosFormulario;

  useEffect(() => {
    // Registro de todos los campos "ocultos" que se nutren en segundo plano mediante setValue
    // para que React Hook Form garantice su paso por Zod y se mantengan en el data de onSubmit.
    register("tipopersonaid");
    register("mescierre");
    register("fechainicioactividades");
    register("tiporegimenivaid");
    register("tipoactividadsepymeid");
    register("codpos");
    register("provinciaid");
    register("localidad");
    register("ciudad");
    register("direccion");
    register("razonSocial");
  }, [register]);

  useEffect(() => {
    if (!socioParaCompletar) return;
    // Esperamos a que el catálogo de provincias esté listo: si corremos el
    // matching con la lista todavía vacía, provinciaid siempre da null y
    // perdemos la corrección que estamos buscando.
    if (isPendingProvincias) return;
    let cancelado = false;

    (async () => {
      try {
        const resultado = await obtenerDatosEmpresaPorCuit(
          socioParaCompletar.cuit || socioParaCompletar.Cuit,
          opcionesProvincias,
        );
        if (cancelado || !resultado.encontrado) return;
        // ciudadid/localidadid siempre llegan en null acá (ninguna
        // integración resuelve un id, solo texto — ver
        // datosEmpresaPorCuit.js) y se completan recién con el select de
        // Ciudad/Localidad más abajo en este mismo paso. Si se validaran
        // ya, el requisito de "ciudad obligatoria" saltaría en rojo antes
        // de que el usuario llegue a tocar el campo.
        Object.entries(resultado.valores).forEach(([campo, val]) => {
          const shouldValidate = campo !== "ciudadid" && campo !== "localidadid";
          metodosFormulario.setValue(campo, val, { shouldValidate });
        });
      } catch (e) {
        console.error(
          "[AltaDatosEmpresa] Error re-consultando datos de la empresa para completar el Paso 2:",
          e,
        );
      } finally {
        if (!cancelado) setCargandoDatosCompletar(false);
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socioParaCompletar, isPendingProvincias]);

  // ⚠️ SEGURIDAD: una vez en Paso 2 el CUIT ya está comprometido (el socio
  // existe en el backend y ya pasó el CDA, ver Paso1Cuit.jsx) — no puede
  // haber forma de volver a Paso1, reiniciar, ni editarlo desde acá. Por
  // eso no existen handlers de "volver"/"reiniciar": BarraProgreso y
  // Paso2Datos directamente no reciben esos props una vez que pasoActual
  // es 2 (ver más abajo), sin importar si se llegó por el flujo normal o
  // por el modo "completar".
  useEffect(() => {
    if (pasoActual !== 2) return;
    // Recargar/cerrar la pestaña en Paso2 tira el estado local (pasoActual
    // vuelve a 1 al remontar) — el respaldo en sessionStorage (ver
    // altaEmpresaPendiente.js) evita que eso reabra el CUIT, pero igual
    // conviene el aviso nativo del navegador antes de perder lo que el
    // usuario ya cargó en el formulario.
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pasoActual]);

  const onSubmitFinal = async (data) => {
    if (enviandoSolicitud) return;
    setEnviandoSolicitud(true);
    try {
      const payloadSocio = {
        entidadid: 1,
        tiposocioid: 9,
        cuit: data.cuit,
        denominacion: data.razonSocial,
        calle: data.calle || data.direccion,
        numero: Number(data.numero) || 0,
        piso: data.piso || "",
        departamento: data.departamento || "",
        ciudadid: data.ciudadid ? Number(data.ciudadid) : null,
        telefono: data.celular,
        fax: "",
        email: user?.email,
        tipopersonaid: data.tipopersonaid,
        tipocarteraid: 2,
        sectorcontableid: 700,
        tipoactividadbcraid: 0,
        tipoactividadsepymeid: data.tipoactividadsepymeid || null,
        // Este PUT reescribe el registro completo (no es parcial), así que
        // no se puede hardcodear "0" a ciegas: en "modo completar" el socio
        // ya existe desde antes (ver socioParaCompletar más arriba) y, aunque
        // en la práctica no debería poder haber migrado sin haber pasado por
        // acá, se preserva lo que ya tenía en vez de arriesgarse a pisarle
        // un "1" real. Recién nace en "0" cuando de verdad es la primera vez
        // (mismo default que ya pone Paso1Cuit al crear el socio).
        marcavinculacion:
          socioParaCompletar?.marcavinculacion ??
          socioParaCompletar?.MarcaVinculacion ??
          "0",
        situacionbcraid: 1,
        fechabaja: null,
        motivobajaid: null,
        socioestadoid: 9,
        codpos: data.codpos || "",
        tamanioempresaid: 0,
        fechacierreejercicio: data.mescierre
          ? `${new Date().getFullYear()}-${String(data.mescierre).padStart(2, "0")}-${String(new Date(new Date().getFullYear(), data.mescierre, 0).getDate()).padStart(2, "0")}T00:00:00`
          : getCSharpIsoDate(),
        legajo: 0,
        tiporegimenivaid: data.tiporegimenivaid,
        actividadespecifica: "",
        partido: data.localidad,
        telefono2: "",
        telefono3: "",
        visitado: "0",
        scoringcomercial: "0",
        partidoid: data.localidadid ? Number(data.localidadid) : null,
        // No existe ProvinciaID en Socio (swagger confirmado) - el backend
        // la resuelve solo a partir de CiudadID. No se manda.
        fechainicioactividades:
          data.fechainicioactividades || getCSharpIsoDate(),
        tipoactividadglobalid: 0,
        tipocanalcomercializacionid:
          cadenaObj?.tipocanalcomercializacionid ||
          cadenaObj?.TipoCanalComercializacionID ||
          0,
        emailfacturacion: data.emailfacturacion || user?.email || "",
        minapoderadosrequeridos: 0,
        tipocondicionfianzaid: 0,
        jsoncondicionfianza: "",
      };

      // El socio ya existe y ya está vinculado al usuario — eso se resolvió
      // en Paso1Cuit, antes de ejecutar el CDA. Acá solo completamos el
      // registro con lo que el usuario terminó de cargar/editar en el
      // Paso 2.
      if (!socioId) {
        throw new Error(
          "No se encontró el socio creado en el paso anterior.",
        );
      }

      console.log(
        "[AltaDatosEmpresa] PUT a /Socio con payload:",
        { ...payloadSocio, socioid: socioId },
      );
      await sociosService.actualizarSocio({ ...payloadSocio, socioid: socioId });

      // sociosService.actualizarSocio se llama acá directo (no vía
      // useActualizarSocio) porque este componente ya maneja su propio
      // try/catch y estado de envío — pero eso significa que hay que
      // invalidar a mano la cache de ["socios","detalle",socioId]. Sin esto,
      // OnboardingGuard (useEmpresasCompletas, misma queryKey) sigue leyendo
      // el socio viejo con telefono vacío al llegar a /legajo, y como
      // "aprobado && !telefono" es justo la condición que manda a este mismo
      // Paso 2, rebota para acá de nuevo apenas se termina de completar.
      await queryClient.invalidateQueries({
        queryKey: ["socios", "detalle", socioId],
      });

      if (usuariowebidReal) {
        // --- PRECARGA Y ENRIQUECIMIENTO DE ACCIONISTAS (LUFE + AFIP) ---
        try {
          await enriquecerSociosLufeAfip(socioId, data.cuit);
        } catch (enriquecimientoError) {
          console.error(
            "[AltaDatosEmpresa] Error al procesar enriquecimiento de autoridades:",
            enriquecimientoError,
          );
        }

        try {
          console.log(
            `[AltaDatosEmpresa] Vinculando documentos de LUFE para CUIT: ${data.cuit}`,
          );
          await sociosService.obtenerDocumentosLufe(data.cuit, true);
        } catch (lufeDocsError) {
          console.error(
            "[AltaDatosEmpresa] Error al vincular documentos de LUFE:",
            lufeDocsError,
          );
        }

        // enriquecerSociosLufeAfip/obtenerDocumentosLufe escriben directo
        // por afuera de las mutations de react-query (llaman al service a
        // mano), así que ninguna invalidación automática se dispara. Sin
        // esto, si ["socioLegajoCompleto", socioId] ya se había pedido una
        // vez ANTES de que termine la precarga (con 0 accionistas), queda
        // cacheado así hasta que venza su staleTime (10 min) — el usuario
        // llega a /legajo y no ve nada hasta refrescar la página a mano o
        // esperar. Confirmado en vivo (2026-07-22).
        await queryClient.invalidateQueries({
          queryKey: ["socioLegajoCompleto", socioId],
        });

        // retry: 0 explícito porque axios ya reintenta a nivel de transporte
        // (src/api/axios.js). Sin esto, un mismo fallo se reintenta dos veces
        // por acá y hasta dos veces más por axios, y las 3 queries corren en
        // paralelo justo después de los POST de alta.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["socioArchivos", socioId] }),
          queryClient.prefetchQuery({
            queryKey: ["socioArchivos", socioId],
            queryFn: () => socioArchivoService.obtenerArchivos(socioId),
            retry: 0,
          }),
          queryClient.prefetchQuery({
            queryKey: ["sociosWeb", "detalle", socioId],
            queryFn: () => sociosService.obtenerSocioWebPorId(socioId),
            retry: 0,
          }),
          queryClient.prefetchQuery({
            queryKey: [
              "requisitos",
              cadenaValorId,
              data.tipopersonaid,
              data.razonSocial,
            ],
            queryFn: () =>
              requisitosService.obtenerRequisitosPorCadenaId(
                cadenaValorId,
                data.tipopersonaid,
                data.razonSocial,
                true,
              ),
            retry: 0,
          }),
        ]);

        await queryClient.invalidateQueries({
          queryKey: ["socioUsuario", "listaPorUsuario", usuariowebidReal],
        });

        limpiarSocioPendiente(cadenaSlug, user?.email);
        toast.success("Empresa creada y vinculada correctamente");

        // Vendor o no: la empresa recién creada/vinculada queda como activa
        // y se entra directo a su legajo — es una elección tan explícita
        // como cuando el vendor la elige desde SeleccionarEmpresa.jsx (que
        // también llama a setActiveSocioId), no tiene sentido mandarlo a
        // "elegir" algo que acaba de crear él mismo.
        setActiveSocioId(socioId);
        navigate(`/${channelInfo?.id}/legajo`, { replace: true });
      } else {
        throw new Error(
          "No pudimos identificar tu usuario para vincular la empresa.",
        );
      }
    } catch (error) {
      console.error("Error en alta de empresa:", error);
      toast.error("Error al registrar la empresa.");
      setEnviandoSolicitud(false);
    }
  };

  const handleValidarCuitSuccess = () => {
    setPasoActual(2);
    setMaxPasoAlcanzado((prev) => Math.max(prev, 2));
  };

  const obtenerTextosCabecera = () => {
    switch (pasoActual) {
      case 1:
        return {
          badge: "Alta de empresa",
          t: "Necesitamos conocer los datos de tu empresa",
          s: "Completá el CUIT de tu empresa para comenzar.",
        };
      case 2:
        return {
          badge: "Alta de empresa",
          t: "Completá los datos de la empresa",
          s: "Verificá y completá la información faltante.",
        };
      default:
        return { badge: "Alta de empresa", t: "Datos de la empresa", s: "" };
    }
  };

  const renderPasoDinamico = () => {
    if (pasoActual === 1) {
      return (
        <Paso1Cuit
          // El chequeo "vendor no puede gestionar su propia empresa" corre
          // ahora dentro de Paso1Cuit.jsx (handleValidar), antes de pedir
          // confirmación de vinculación - antes vivía acá, pero onValidar
          // recién se llama al final de todo el flujo (después de crear el
          // socio y correr el CDA), demasiado tarde para bloquear nada.
          // isVendor/vendorCuit se resuelven acá arriba (ver useVendor) y se
          // pasan ya resueltos — Paso1Cuit no vuelve a consultarlo.
          isVendor={isVendor}
          vendorCuit={vendorCuit}
          onValidar={handleValidarCuitSuccess}
          onSocioExistente={(socioData, reason) =>
            setSocioExistenteModal({ isOpen: true, socioData, reason })
          }
          onSocioCreado={(id) => setSocioId(Number(id))}
        />
      );
    }
    if (pasoActual === 2) {
      return (
        <Paso2Datos
          onContinuar={async () => {
            if (
              await trigger([
                "direccion",
                "localidad",
                "celular",
                "emailfacturacion",
              ])
            ) {
              handleSubmit(onSubmitFinal)();
            }
          }}
          isSubmitting={enviandoSolicitud}
        />
      );
    }
    return null;
  };

  // Se espera a que el estado vendor esté resuelto ANTES de mostrar Paso 1:
  // sin este gate, el usuario podía llegar a interactuar con el wizard (y
  // Paso1Cuit a evaluar isVendor) mientras la consulta todavía estaba en
  // vuelo — ver comentario junto a useVendor() más arriba.
  if (isPendingVendor) {
    return (
      <LoadingScreen
        title="Preparando entorno"
        message="Verificando tu cuenta..."
      />
    );
  }

  if (isNavigating) {
    return (
      <LoadingScreen
        title="Preparando entorno"
        message="Sincronizando información del legajo..."
      />
    );
  }

  if (cargandoDatosCompletar) {
    return (
      <LoadingScreen
        title="Recuperando tus datos"
        message="Estamos actualizando la información de tu empresa..."
      />
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <BarraProgreso
                hitos={["CUIT", "DATOS"]}
                hitoActual={pasoActual}
                maxHitoAlcanzado={maxPasoAlcanzado}
                // El CUIT queda comprometido apenas se llega a Paso 2 (ver
                // Paso1Cuit.jsx): el socio ya existe en el backend y ya pasó
                // el CDA, así que no puede haber forma de volver a Paso1, ni
                // de reiniciar, sin importar cómo se llegó hasta acá (alta
                // nueva o modo "completar"). Un solo camino posible:
                // completar los datos y avanzar.
                onStepClick={pasoActual === 2 ? undefined : setPasoActual}
                onVolver={null}
                // Sin botón de "Inicio"/"Volver" en el caso general: el CUIT
                // queda comprometido apenas se llega a Paso 2 (ver comentario
                // de onStepClick arriba) y en Paso 1 tampoco tiene sentido —
                // no hay nada reversible desde ahí que amerite un atajo de
                // salida. Excepción: un vendor que todavía está en Paso 1 y
                // no cruzó el umbral (!socioId — Paso1Cuit todavía no llamó a
                // onSocioCreado) puede haber entrado por error desde
                // "Agregar nueva empresa" en SeleccionarEmpresa — se le
                // ofrece volver ahí. Deja de ofrecerse en cuanto socioId se
                // setea (el socio ya existe en el backend, mismo criterio de
                // "irreversible" que el resto de este comentario).
                onVolverInicio={
                  pasoActual === 1 && isVendor && !socioId
                    ? () => navigate(`/${channelInfo?.id}/seleccionar-empresa`)
                    : null
                }
                onReiniciar={null}
              />

              <div className={styles.bienvenidaHeader}>
                {/* La identidad de vendor (usuario/correo/plataforma) se
                    muestra en el Sidebar (ver Sidebar.jsx) — visible ahí
                    durante todo el wizard sin duplicarla acá. */}
                {obtenerTextosCabecera().badge && (
                  <span className={styles.bienvenidaBadge}>
                    {obtenerTextosCabecera().badge}
                  </span>
                )}
                <h1 className={styles.tituloBienvenida}>
                  {obtenerTextosCabecera().t}
                </h1>
                <div className={styles.titleAccent} />
                {obtenerTextosCabecera().s && (
                  <p className={styles.subtituloBienvenida}>
                    {obtenerTextosCabecera().s}
                  </p>
                )}
              </div>

              <div className={styles.seccionFormulario}>
                <FormProvider {...metodosFormulario}>
                  <form
                    className={styles.formContent}
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <div key={pasoActual} className="animacion-paso">
                      {renderPasoDinamico()}
                    </div>
                  </form>
                </FormProvider>
              </div>
            </div>
          </div>
        </div>
      </div>

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="alta_datos_empresa"
        pasoActual={pasoActual}
      />

      <Modal
        isOpen={socioExistenteModal.isOpen}
        onClose={() =>
          setSocioExistenteModal({
            isOpen: false,
            socioData: null,
            reason: null,
          })
        }
        maxWidth="28rem"
      >
        <div className={styles.modalContent}>
          <span className={styles.modalBadge}>Atención</span>
          <h3 className={styles.modalTitle}>Empresa ya registrada</h3>

          <p className={styles.modalText}>
            {socioExistenteModal.reason === "email_mismatch" ? (
              <>
                El correo electrónico con el que estás intentando registrarte no
                coincide con el registrado en SGRPlus para esta empresa. Por
                favor, contactá a{" "}
                <a
                  href="mailto:soporte@bind.com.ar"
                  className={styles.linkText || ""}
                >
                  soporte@bind.com.ar
                </a>{" "}
                para más información.
              </>
            ) : (
              'El CUIT ingresado ya se encuentra registrado en la plataforma por otro usuario. Para operar con esta empresa, solicitale al administrador que te brinde acceso desde la sección "Documentación".'
            )}
          </p>

          <div className={styles.modalHighlight}>
            <strong className={styles.modalHighlightTitle}>
              {socioExistenteModal.socioData?.denominacion}
            </strong>
            <span className={styles.modalHighlightSubtitle}>
              CUIT {socioExistenteModal.socioData?.cuit}
            </span>
          </div>

          <div className={styles.modalActionsSingle}>
            <Button
              variant="primary"
              onClick={() => {
                setSocioExistenteModal({
                  isOpen: false,
                  socioData: null,
                  reason: null,
                });
                reset();
              }}
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── PANTALLA DE CARGA ────────────────────────────────────────── */}
      {enviandoSolicitud && (
        <LoadingScreen
          title="Configurando tu entorno"
          message="Registrando los datos de tu empresa en el sistema..."
        />
      )}
    </div>
  );
};

export default AltaDatosEmpresa;
