import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
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
import { useVendor } from "../../../../hooks/useVendor";
import { useChannel } from "../../../../context/ChannelContext";
import styles from "./AltaDatosEmpresa.module.css";
import { toast } from "sonner";

const getCSharpIsoDate = () => {
  const date = new Date();
  return date.toISOString().split(".")[0];
};

export const AltaDatosEmpresa = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { channelInfo } = useChannel();
  const { cadenaSlug } = useParams();
  const cadenaValorId = Number(cadenaSlug);
  const { data: cadenaData } = useObtenerPorCadenaValorIdWeb(cadenaValorId);
  const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;

  const [pasoActual, setPasoActual] = useState(1);
  const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState(1);
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

  const user = useAuthStore((state) => state.user);
  const setActiveSocioId = useAuthStore((state) => state.setActiveSocioId);
  const [isNavigating, setIsNavigating] = useState(false);

  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email);
  const usuariowebidReal =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id;

  const { data: vendorData } = useVendor();

  const metodosFormulario = useForm({
    resolver: zodResolver(AltaDatosEmpresaSchema),
    mode: "onTouched",
    defaultValues: {
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

  const handleVolver = () => {
    setPasoActual((prev) => (prev === 1 ? 1 : prev - 1));
  };

  const handleClickReiniciar = () => {
    reset();
    setPasoActual(1);
    setMaxPasoAlcanzado(1);
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

      console.log("[AltaDatosEmpresa] POST a /Socio con payload:", payloadSocio);
      const socioResult = await sociosService.crearSocio(payloadSocio);
      console.log("[AltaDatosEmpresa] Respuesta de /Socio:", socioResult);
      const socioId = socioResult?.socioid || socioResult?.id;

      if (!socioId) throw new Error("No se obtuvo el ID del socio.");

      if (usuariowebidReal) {
        const payloadVinculo = {
          usuariowebid: usuariowebidReal,
          socioid: socioId,
          momentocreacion: getCSharpIsoDate(),
        };

        await sociosService.vincularSocioUsuario(payloadVinculo);

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

        await Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["socioArchivos", socioId],
            queryFn: () => socioArchivoService.obtenerArchivos(socioId),
          }),
          queryClient.prefetchQuery({
            queryKey: ["sociosWeb", "detalle", socioId],
            queryFn: () => sociosService.obtenerSocioWebPorId(socioId),
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
          navigate(`/${channelInfo?.id}/inicio`, { replace: true });
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
        />
      );
    }
    if (pasoActual === 2) {
      return (
        <Paso2Datos
          onVolver={handleVolver}
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
                onStepClick={setPasoActual}
                onVolver={pasoActual > 1 ? handleVolver : null}
                onVolverInicio={
                  pasoActual === 1
                    ? () => {
                        if (vendorData?.isVendor) {
                          navigate(`/${cadenaSlug}/seleccionar-empresa`);
                        } else {
                          navigate(`/${cadenaSlug}/inicio`);
                        }
                      }
                    : null
                }
                onReiniciar={pasoActual > 1 ? handleClickReiniciar : null}
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
