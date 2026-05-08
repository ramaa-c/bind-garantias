import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiRotateCcw, FiUsers, FiX } from "react-icons/fi";
import { zodResolver } from "@hookform/resolvers/zod";
import { AltaDatosEmpresaSchema } from "../../schemas/AltaDatosEmpresaSchema";
import { BarraProgreso, BotonVolver, Button } from "../../components/ui";
import {
  Paso1Cuit,
  Paso2Datos,
  PanelDudas,
  BotonAyudaFlotante,
} from "../../components/features";
import { sociosService } from "../../services/sociosService";
import { useAuthStore } from "../../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "../../hooks/useUsuario";
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
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);

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

  const { handleSubmit, trigger, getValues, reset } = metodosFormulario;

  const handleVolver = () => {
    setPasoActual((prev) => (prev === 1 ? 1 : prev - 1));
  };

  const handleClickReiniciar = () => {
    reset();
    setPasoActual(1);
  };

  const handleVincularSocioExistente = async () => {
    setEnviandoSolicitud(true);
    try {
      if (!usuariowebidReal) {
        throw new Error("No pudimos identificar tu usuario.");
      }

      const payloadVinculo = {
        usuariowebid: usuariowebidReal,
        socioid: socioExistenteModal.socioData.socioid,
        momentocreacion: getCSharpIsoDate(),
      };

      await sociosService.vincularSocioUsuario(payloadVinculo);

      await queryClient.invalidateQueries({
        queryKey: ["socioUsuario", "listaPorUsuario", usuariowebidReal],
      });

      toast.success("Te has vinculado a la empresa correctamente");
      setSocioExistenteModal({ isOpen: false, socioData: null });
      navigate("/inicio", { replace: true });
    } catch (error) {
      console.error("Error al vincular socio existente:", error);
      toast.error("Error al vincular tu usuario a la empresa.");
    } finally {
      setEnviandoSolicitud(false);
    }
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
    } finally {
      setEnviandoSolicitud(false);
    }
  };
  const handleValidarCuitSuccess = () => {
    setPasoActual(2);
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
          <div className={styles.navegacionTop}>
            <div className={styles.botonesNavegacion}>
              {pasoActual > 1 && <BotonVolver onClick={handleVolver} />}
              <BotonVolver
                onClick={handleClickReiniciar}
                icon={FiRotateCcw}
                texto="Reiniciar operación"
              />
            </div>
          </div>

          <div className={styles.contenedorPrincipal}>
            <div className={styles.columnaFormulario}>
              <div className={styles.seccionFormulario}>
                {pasoActual === 1 && (
                  <div className={styles.bienvenidaHeader}>
                    <h1 className={styles.tituloBienvenida}>Primer Ingreso</h1>
                    <div className={styles.titleAccent}></div>
                    <p className={styles.subtituloBienvenida}>
                      Completá el CUIT de tu empresa para comenzar.
                    </p>
                  </div>
                )}

                {pasoActual > 1 && (
                  <BarraProgreso
                    hitos={["CUIT", "DATOS"]}
                    hitoActual={pasoActual - 1}
                  />
                )}

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

            <PanelDudas contexto="alta_operacion" pasoActual={pasoActual} />
            <BotonAyudaFlotante
              contexto="alta_operacion"
              pasoActual={pasoActual}
            />
          </div>
        </div>
      </div>

      {socioExistenteModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface, #1e1e1e)",
              padding: "2rem",
              borderRadius: "1rem",
              maxWidth: "28rem",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              border: "1px solid var(--color-border, #333)",
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  color: "var(--color-primary, #646cff)",
                }}
              >
                <FiUsers size={24} />
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    color: "var(--color-text, #fff)",
                  }}
                >
                  Empresa Registrada
                </h3>
              </div>
              <button
                onClick={() =>
                  setSocioExistenteModal({ isOpen: false, socioData: null })
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--color-text-muted, #aaa)",
                  cursor: "pointer",
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            <p
              style={{
                margin: 0,
                color: "var(--color-text-secondary, #ccc)",
                fontSize: "0.95rem",
                lineHeight: "1.5",
              }}
            >
              El CUIT ingresado ya se encuentra registrado en nuestra plataforma
              bajo la denominación:
            </p>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "0.5rem",
                borderLeft: "4px solid var(--color-primary, #646cff)",
              }}
            >
              <strong
                style={{ display: "block", color: "#fff", fontSize: "1.1rem" }}
              >
                {socioExistenteModal.socioData?.denominacion}
              </strong>
              <span style={{ color: "#aaa", fontSize: "0.85rem" }}>
                CUIT: {socioExistenteModal.socioData?.cuit}
              </span>
            </div>

            <p
              style={{
                margin: 0,
                color: "var(--color-text-secondary, #ccc)",
                fontSize: "0.95rem",
              }}
            >
              ¿Deseás vincular tu usuario a esta empresa para operar en su
              nombre?
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <Button
                variant="outline"
                onClick={() =>
                  setSocioExistenteModal({ isOpen: false, socioData: null })
                }
                style={{ flex: 1 }}
                disabled={enviandoSolicitud}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleVincularSocioExistente}
                style={{ flex: 1 }}
                disabled={enviandoSolicitud}
              >
                {enviandoSolicitud ? "Vinculando..." : "Sí, vincular"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AltaDatosEmpresa;
