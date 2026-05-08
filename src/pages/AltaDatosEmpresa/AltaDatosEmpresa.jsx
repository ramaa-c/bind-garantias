import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { FiRotateCcw } from "react-icons/fi";
import { zodResolver } from "@hookform/resolvers/zod";
import { AltaDatosEmpresaSchema } from "../../schemas/AltaDatosEmpresaSchema";
import { BarraProgreso, BotonVolver } from "../../components/ui";
import {
  Paso1Cuit,
  Paso2Datos,
  PanelDudas,
  BotonAyudaFlotante,
} from "../../components/features";
import { sociosService } from "../../services/sociosService";
import { useAuthStore } from "../../store/useAuthStore";
import styles from "./AltaDatosEmpresa.module.css";
import { toast } from "sonner";

export const AltaDatosEmpresa = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pasoActual, setPasoActual] = useState(1);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const user = useAuthStore((state) => state.user);

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
        tipopersonaid: 10,
        tipocarteraid: 2,
        sectorcontableid: 700,
        tipoactividadbcraid: 0,
        tipoactividadsepymeid: 466932,
        marcavinculacion: "0",
        situacionbcraid: 1,
        fechabaja: null,
        motivobajaid: 0,
        socioestadoid: 9,
        codpos: "",
        tamanioempresaid: 2,
        fechacierreejercicio: null,
        legajo: 0,
        tiporegimenivaid: 1,
        actividadespecifica: "",
        partido: data.localidad || "",
        telefono2: "",
        telefono3: "",
        visitado: "0",
        scoringcomercial: "0",
        partidoid: 0,
        fechainicioactividades: null,
        tipoactividadglobalid: 4,
        tipocanalcomercializacionid: 30,
        emailfacturacion: user?.email || "",
        minapoderadosrequeridos: 0,
        tipocondicionfianzaid: 0,
        jsoncondicionfianza: "",
      };

      const socioResult = await sociosService.crearSocio(payloadSocio);
      const socioId = socioResult?.socioid || socioResult?.id;

      if (!socioId) throw new Error("No se obtuvo el ID del socio.");

      if (user?.usuariowebid) {
        const payloadVinculo = {
          usuariowebid: user.usuariowebid,
          socioid: socioId,
          momentocreacion: new Date().toISOString(),
        };

        await sociosService.vincularSocioUsuario(payloadVinculo);

        await queryClient.invalidateQueries({
          queryKey: ["socioUsuario", "listaPorUsuario", user.usuariowebid],
        });

        toast.success("Empresa vinculada correctamente");
        navigate("/inicio", { replace: true });
      }
    } catch (error) {
      console.error("Error en alta de empresa:", error);
      toast.error("Error al vincular la empresa con tu usuario.");
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
          isLoading={false}
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
    </div>
  );
};

export default AltaDatosEmpresa;
