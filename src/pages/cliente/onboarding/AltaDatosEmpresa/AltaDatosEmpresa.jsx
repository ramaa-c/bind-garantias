import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { AltaDatosEmpresaSchema } from "../../../../schemas/AltaDatosEmpresaSchema";
import { BarraProgreso, Button, Modal } from "../../../../components/ui";
import { LoadingScreen } from "../../../../components/ui";
import { Paso1Cuit, Paso2Datos } from "../../../../components/features";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import { sociosService } from "../../../../services/sociosService";
import { afipService } from "../../../../services/afipService";
import { tercerosService } from "../../../../services/tercerosService";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import styles from "./AltaDatosEmpresa.module.css";
import { toast } from "sonner";

const getCSharpIsoDate = () => {
  const date = new Date();
  return date.toISOString().split(".")[0];
};

export const AltaDatosEmpresa = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
  });

  const user = useAuthStore((state) => state.user);

  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email);
  const usuariowebidReal =
    usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id;

  const metodosFormulario = useForm({
    resolver: zodResolver(AltaDatosEmpresaSchema),
    mode: "onTouched",
    defaultValues: {
      cuit: "",
      razonSocial: "",
      direccion: "",
      localidad: "",
      provincia: "",
      celular: "",
    },
  });

  const { handleSubmit, trigger, reset } = metodosFormulario;

  const handleVolver = () => {
    setPasoActual((prev) => (prev === 1 ? 1 : prev - 1));
  };

  const handleClickReiniciar = () => {
    reset();
    setPasoActual(1);
    setMaxPasoAlcanzado(1);
  };

  const onSubmitFinal = async (data) => {
    setEnviandoSolicitud(true);
    try {
      const payloadSocio = {
        entidadid: 1,
        tiposocioid: 9,
        cuit: data.cuit,
        denominacion: data.razonSocial,
        calle: data.direccion,
        numero: 0,
        piso: "",
        departamento: "",
        ciudadid: 0,
        telefono: data.celular,
        fax: "",
        email: user?.email || "",
        tipopersonaid: 0,
        tipocarteraid: 0,
        sectorcontableid: 0,
        tipoactividadbcraid: 0,
        tipoactividadsepymeid: 0,
        marcavinculacion: "0",
        situacionbcraid: 0,
        fechabaja: getCSharpIsoDate(),
        motivobajaid: 0,
        socioestadoid: 9,
        codpos: "",
        tamanioempresaid: 0,
        fechacierreejercicio: getCSharpIsoDate(),
        legajo: 0,
        tiporegimenivaid: 0,
        actividadespecifica: "",
        partido: data.localidad || "",
        telefono2: "",
        telefono3: "",
        visitado: "0",
        scoringcomercial: "0",
        partidoid: 0,
        fechainicioactividades: getCSharpIsoDate(),
        tipoactividadglobalid: 0,
        tipocanalcomercializacionid: 0,
        emailfacturacion: user?.email || "",
        minapoderadosrequeridos: 0,
        tipocondicionfianzaid: 0,
        jsoncondicionfianza: "",
      };

      const socioResult = await sociosService.crearSocio(payloadSocio);
      const socioId = socioResult?.socioid || socioResult?.id;

      if (!socioId) throw new Error("No se obtuvo el ID del socio.");

      if (usuariowebidReal) {
        const payloadVinculo = {
          usuariowebid: usuariowebidReal,
          socioid: socioId,
          momentocreacion: getCSharpIsoDate(),
        };

        await sociosService.vincularSocioUsuario(payloadVinculo);

        let autoridades = null;
        try {
          console.log(`[AltaDatosEmpresa] Vinculando autoridades de LUFE para CUIT: ${data.cuit}`);
          autoridades = await sociosService.obtenerAutoridadesLufe(data.cuit, true);
        } catch (lufeError) {
          console.error("[AltaDatosEmpresa] Error al vincular autoridades de LUFE:", lufeError);
        }

        // --- ENRIQUECIMIENTO EN SEGUNDO PLANO DE ACCIONISTAS ---
        try {
          const arrAut = Array.isArray(autoridades) 
            ? autoridades 
            : autoridades?.data || autoridades?.items || [];
          
          if (arrAut.length > 0) {
            console.log(`[AltaDatosEmpresa] Iniciando enriquecimiento en background de ${arrAut.length} autoridades...`);
            
            // Procesamos asíncronamente sin bloquear la navegación
            Promise.all(
              arrAut.map(async (auth) => {
                const cuitSocio = auth.cuit || auth.Cuit;
                if (!cuitSocio) return;
                const cuitSocioLimpio = String(cuitSocio).replace(/\D/g, "");
                if (cuitSocioLimpio.length !== 11) return;

                try {
                  // 1. Obtener el tercero desde la base de datos (creado por Vincular=true)
                  const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitSocioLimpio });
                  const arrExistentes = Array.isArray(existentes) ? existentes : existentes?.data || [];
                  if (arrExistentes.length === 0) return;

                  const terceroLocal = arrExistentes[0];
                  const terceroId = terceroLocal.tercerorelacionadoid || terceroLocal.id;

                  // 2. Consultar AFIP por ese CUIT
                  let respAfip = null;
                  try {
                    respAfip = await afipService.obtenerConstanciaInscripcion(cuitSocioLimpio);
                  } catch (afipErr) {
                    console.warn(`[AltaDatosEmpresa] AFIP no disponible para CUIT ${cuitSocioLimpio}, probando fallback a LUFE Entidad:`, afipErr);
                    try {
                      const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitSocioLimpio);
                      if (lufeEntidad && lufeEntidad.success) {
                        respAfip = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
                      }
                    } catch (lufeErr) {
                      console.error(`[AltaDatosEmpresa] LUFE Entidad también falló para CUIT ${cuitSocioLimpio}:`, lufeErr);
                    }
                  }

                  if (respAfip && respAfip.datosgenerales) {
                    const dg = respAfip.datosgenerales;
                    const dom = dg.domiciliofiscal || dg.domicilio || {};

                    const payloadTercero = {
                      tercerorelacionadoid: terceroId,
                      denominacion: auth.denominacion || terceroLocal.denominacion || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Representante",
                      cuit: cuitSocioLimpio,
                      bcraid: 0,
                      tipopersonaid: cuitSocioLimpio.startsWith("30") || cuitSocioLimpio.startsWith("33") ? 2 : 1,
                      tipodocumentoid: 0,
                      numerodocumento: cuitSocioLimpio,
                      estadocivilid: 0,
                      ciudadid: 0,
                      telefono: dg.telefono || terceroLocal.telefono || "",
                      conyuge: "",
                      actividad: "",
                      contacto: dom.localidad || dom.localidadNombre || terceroLocal.contacto || "",
                      nrocuenta: "",
                      codigomercado: "",
                      calle: dom.direccion || (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "") || terceroLocal.calle || "",
                      numero: 0,
                      piso: "",
                      departamento: "",
                      codpos: dom.codpostal || dom.codpos || terceroLocal.codpos || "",
                      descripcionreducida: (auth.denominacion || terceroLocal.denominacion || "").substring(0, 20),
                      mail: dg.email || dg.emailfacturacion || terceroLocal.mail || terceroLocal.email || "",
                    };

                    await tercerosService.actualizarTercero(payloadTercero);
                    console.log(`[AltaDatosEmpresa] Accionista CUIT ${cuitSocioLimpio} enriquecido correctamente.`);
                  }
                } catch (singleErr) {
                  console.warn(`[AltaDatosEmpresa] No se pudo enriquecer CUIT ${cuitSocioLimpio}:`, singleErr);
                }
              })
            ).catch(err => console.error("[AltaDatosEmpresa] Error general en el batch de enriquecimiento:", err));
          }
        } catch (enriquecimientoError) {
          console.error("[AltaDatosEmpresa] Error al procesar enriquecimiento de autoridades:", enriquecimientoError);
        }

        try {
          console.log(`[AltaDatosEmpresa] Vinculando documentos de LUFE para CUIT: ${data.cuit}`);
          await sociosService.obtenerDocumentosLufe(data.cuit, true);
        } catch (lufeDocsError) {
          console.error("[AltaDatosEmpresa] Error al vincular documentos de LUFE:", lufeDocsError);
        }

        await queryClient.invalidateQueries({
          queryKey: ["socioUsuario", "listaPorUsuario", usuariowebidReal],
        });

        toast.success("Empresa creada y vinculada correctamente");
        navigate("/inicio", { replace: true });
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
            if (isOk) handleValidarCuitSuccess();
          }}
          onSocioExistente={(socioData) =>
            setSocioExistenteModal({ isOpen: true, socioData })
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
                  pasoActual === 1 ? () => navigate("/inicio") : null
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
          setSocioExistenteModal({ isOpen: false, socioData: null })
        }
        maxWidth="28rem"
      >
        <div className={styles.modalContent}>
          <span className={styles.modalBadge}>Atención</span>
          <h3 className={styles.modalTitle}>Empresa ya registrada</h3>

          <p className={styles.modalText}>
            El CUIT ingresado ya se encuentra registrado en la plataforma por
            otro usuario. Para operar con esta empresa, solicitale al
            administrador que te brinde acceso desde la sección "Documentación".
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
                setSocioExistenteModal({ isOpen: false, socioData: null });
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
