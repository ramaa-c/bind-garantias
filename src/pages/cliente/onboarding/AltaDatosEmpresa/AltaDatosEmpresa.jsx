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
import { afipService } from "../../../../services/afipService";
import { tercerosService } from "../../../../services/tercerosService";
import { socioArchivoService } from "../../../../services/socioArchivoService";
import { requisitosService } from "../../../../services/requisitosService";
import { catalogosService } from "../../../../services/catalogosService";
import { matchProvinciaAfip } from "../../../../utils/provinciaUtils";
import { enriquecerSociosLufeAfip } from "../../../../utils/enriquecimiento";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import { useObtenerPorCadenaValorIdWeb } from "../../../../hooks/useCadenaValor";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { obtenerDatosEmpresaPorCuit } from "../../../../utils/datosEmpresaPorCuit";
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
    numero,
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
    tipopersonaid: Number(socio.tipopersonaid ?? socio.TipoPersonaID) || 0,
    mescierre,
    fechainicioactividades:
      socio.fechainicioactividades || socio.FechaInicioActividades || null,
    tiporegimenivaid:
      Number(socio.tiporegimenivaid ?? socio.TipoRegimenIvaId) || 0,
  };
};

export const AltaDatosEmpresa = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const socioParaCompletar = location.state?.socioParaCompletar || null;
  const { channelInfo } = useChannel();
  const { cadenaSlug } = useParams();
  const cadenaValorId = Number(cadenaSlug);
  const { data: cadenaData } = useObtenerPorCadenaValorIdWeb(cadenaValorId);
  const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;

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
  const [socioId, setSocioId] = useState(
    socioParaCompletar?.socioid ?? socioParaCompletar?.SocioID ?? null,
  );

  const user = useAuthStore((state) => state.user);
  const setActiveSocioId = useAuthStore((state) => state.setActiveSocioId);
  const [isNavigating, setIsNavigating] = useState(false);

  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email);
  const usuariowebidReal =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id;

  const { data: vendorData } = useVendor();

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
          numero: 0,
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
          tipopersonaid: 0,
          mescierre: null,
          fechainicioactividades: null,
          tiporegimenivaid: 0,
        },
  });

  const { handleSubmit, trigger, reset, getValues, register } = metodosFormulario;

  useEffect(() => {
    // Registro de todos los campos "ocultos" que se nutren en segundo plano mediante setValue
    // para que React Hook Form garantice su paso por Zod y se mantengan en el data de onSubmit.
    register("tipopersonaid");
    register("mescierre");
    register("fechainicioactividades");
    register("tiporegimenivaid");
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
        Object.entries(resultado.valores).forEach(([campo, val]) => {
          metodosFormulario.setValue(campo, val, { shouldValidate: true });
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

  const handleVolver = () => {
    setPasoActual((prev) => (prev === 1 ? 1 : prev - 1));
  };

  const handleClickReiniciar = () => {
    reset();
    setPasoActual(1);
    setMaxPasoAlcanzado(1);
    setSocioId(null);
  };

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
        tipoactividadsepymeid: null,
        marcavinculacion: "",
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
        provinciaid: data.provinciaid ? Number(data.provinciaid) : null,
        fechainicioactividades:
          data.fechainicioactividades || getCSharpIsoDate(),
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

        // retry: 0 explícito porque axios ya reintenta a nivel de transporte
        // (src/api/axios.js). Sin esto, un mismo fallo se reintenta dos veces
        // por acá y hasta dos veces más por axios, y las 3 queries corren en
        // paralelo justo después de los POST de alta.
        await Promise.all([
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

        toast.success("Empresa creada y vinculada correctamente");

        if (vendorData?.isVendor) {
          navigate(`/${channelInfo?.id}/seleccionar-empresa`, {
            replace: true,
          });
        } else {
          setActiveSocioId(socioId);
          navigate(`/${channelInfo?.id}/legajo`, { replace: true });
        }
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
          onValidar={async () => {
            const isOk = await trigger("cuit");
            if (isOk) {
              const cuitValue = metodosFormulario
                .getValues("cuit")
                .replace(/\D/g, "");
              const vendorCuitLimpio = vendorData?.vendorCuit
                ? vendorData.vendorCuit.replace(/\D/g, "")
                : null;

              if (vendorData?.isVendor && cuitValue === vendorCuitLimpio) {
                metodosFormulario.setError("cuit", {
                  type: "manual",
                  message: "Un vendor no puede gestionar su propia empresa.",
                });
                return;
              }
              handleValidarCuitSuccess();
            }
          }}
          onSocioExistente={(socioData, reason) =>
            setSocioExistenteModal({ isOpen: true, socioData, reason })
          }
          onSocioCreado={setSocioId}
        />
      );
    }
    if (pasoActual === 2) {
      return (
        <Paso2Datos
          // En modo "completar" no hay Paso 1 al que volver (ver
          // BarraProgreso más abajo, mismo motivo): omitimos onVolver para
          // que Paso2Datos oculte el lápiz de "Editar CUIT".
          onVolver={socioParaCompletar ? null : handleVolver}
          onContinuar={async () => {
            if (await trigger(["direccion", "localidad", "celular"])) {
              handleSubmit(onSubmitFinal)();
            }
          }}
          isSubmitting={enviandoSolicitud}
        />
      );
    }
    return null;
  };

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
                // En modo "completar" (socio ya existente, solo falta el
                // Paso 2) no hay Paso 1 al que volver: si el usuario
                // re-ingresara su propio CUIT ahí, el chequeo de "socio
                // existente" lo bloquearía. Deshabilitamos toda navegación
                // hacia atrás en ese caso.
                onStepClick={socioParaCompletar ? undefined : setPasoActual}
                onVolver={
                  pasoActual > 1 && !socioParaCompletar ? handleVolver : null
                }
                onVolverInicio={
                  pasoActual === 1
                    ? () => {
                        if (vendorData?.isVendor) {
                          navigate(`/${cadenaSlug}/seleccionar-empresa`);
                        } else {
                          navigate(`/${cadenaSlug}/legajo`);
                        }
                      }
                    : null
                }
                onReiniciar={
                  pasoActual > 1 && !socioParaCompletar
                    ? handleClickReiniciar
                    : null
                }
              />

              <div className={styles.bienvenidaHeader}>
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
