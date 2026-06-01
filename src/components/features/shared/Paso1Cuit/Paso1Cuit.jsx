import React, { useState, useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { BuscadorCuit, ProcesamientoModal } from "../../../ui";
import { sociosService } from "../../../../services/sociosService";
import { useValidarCuitAfip } from "../../../../hooks/useAfip";
import { useValidarFormatoCuit } from "../../../../hooks/useSocios";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import styles from "./Paso1Cuit.module.css";

export default function Paso1Cuit({ onValidar, onSocioExistente }) {
  const { control, getValues, setValue, setError, clearErrors } =
    useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const { mutateAsync: validarAfip, isPending: isLoadingAfip } =
    useValidarCuitAfip();
  const { mutateAsync: validarFormatoBackend, isPending: isLoadingFormato } =
    useValidarFormatoCuit();
  const { ejecutarValidaciones, loading: isLoadingCda } = useCdaEngine();
  const [isValidatingSocio, setIsValidatingSocio] = useState(false);

  const [procesoModal, setProcesoModal] = useState({
    isOpen: false,
    titulo: "",
    pasos: [],
    hasError: false,
    isSystemError: false,
  });

  const cuitValue = useWatch({ control, name: "cuit" });

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
  }, [cuitValue, clearErrors]);

  const isCuitValid = !errors.cuit && dirtyFields.cuit;

  const handleValidar = async () => {
    const cuit = getValues("cuit");
    if (!cuit) return;

    clearErrors("cuit");
    setIsValidatingSocio(true);

    // Abrimos el ProcesamientoModal
    setProcesoModal({
      isOpen: true,
      titulo: "Validando Empresa",
      pasos: [
        { id: "formato_sgr", etiqueta: "Verificando formato y registro SGR+", estado: "cargando", descripcion: "Comprobando que la empresa no esté ya registrada y su CUIT sea estructuralmente válido." },
        { id: "afip", etiqueta: "Consultando padrón AFIP", estado: "pendiente", descripcion: "Obteniendo los datos de la empresa desde el padrón federal en tiempo real." },
        { id: "cda", etiqueta: "Ejecutando validaciones internas", estado: "pendiente", descripcion: "Comprobando políticas de riesgo y negocio para el alta." },
      ],
      hasError: false,
      isSystemError: false,
    });

    try {
      // 1. VALIDACIÓN DE FORMATO
      try {
        const respuestaFormato = await validarFormatoBackend(cuit);
        if (respuestaFormato === false || respuestaFormato?.isValid === false) {
          const errorMsg = respuestaFormato?.message || "El formato del CUIT es inválido.";
          setError("cuit", {
            type: "manual",
            message: errorMsg,
          });
          setProcesoModal(prev => ({
            ...prev,
            hasError: true,
            pasos: prev.pasos.map(p =>
              p.id === "formato_sgr" ? { ...p, estado: "error", descripcion: errorMsg } : p
            )
          }));
          return;
        }
      } catch (formatoError) {
        const errorMsg =
          formatoError?.response?.data?.message ||
          formatoError?.response?.data ||
          "El CUIT ingresado no es válido.";
        setError("cuit", {
          type: "manual",
          message: errorMsg,
        });
        setProcesoModal(prev => ({
          ...prev,
          hasError: true,
          pasos: prev.pasos.map(p =>
            p.id === "formato_sgr" ? { ...p, estado: "error", descripcion: errorMsg } : p
          )
        }));
        return;
      }

      // 2. REGISTRO EN SGR+
      const respSgr = await sociosService.obtenerSocios({
        Cuit: cuit,
        page: 1,
        page_size: 10,
      });

      const socioSgrDb = Array.isArray(respSgr)
        ? respSgr[0]
        : respSgr?.items?.[0] || respSgr?.data?.[0];

      if (socioSgrDb) {
        const errorMsg = "Esta empresa ya se encuentra en gestión por SGR+";
        setError("cuit", {
          type: "manual",
          message: errorMsg,
        });
        setProcesoModal(prev => ({
          ...prev,
          hasError: true,
          pasos: prev.pasos.map(p =>
            p.id === "formato_sgr" ? { ...p, estado: "error", descripcion: errorMsg } : p
          )
        }));
        return;
      }

      // VALIDACIÓN CONTRA ESQUEMA WEB
      const respWeb = await sociosService.obtenerSociosWeb({ Cuit: cuit });
      const socioWebDb = Array.isArray(respWeb)
        ? respWeb[0]
        : respWeb?.items?.[0] || respWeb?.data?.[0];

      if (socioWebDb && socioWebDb.socioid) {
        setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
        if (onSocioExistente) onSocioExistente(socioWebDb);
        return;
      }

      // Avanzamos el primer paso
      setProcesoModal(prev => ({
        ...prev,
        pasos: prev.pasos.map(p =>
          p.id === "formato_sgr" ? { ...p, estado: "completado" } :
          p.id === "afip" ? { ...p, estado: "cargando" } : p
        )
      }));

      // 3. CONSULTA AFIP
      try {
        const afipData = await validarAfip(cuit);

        if (afipData && afipData.datosgenerales) {
          const dg = afipData.datosgenerales;

          // Marcamos AFIP como completado y CDA como cargando
          setProcesoModal(prev => ({
            ...prev,
            pasos: prev.pasos.map(p =>
              p.id === "afip" ? { ...p, estado: "completado" } :
              p.id === "cda" ? { ...p, estado: "cargando" } : p
            )
          }));

          // ── VALIDACIÓN CDA (PANTALLA_INGRESO_CUIT)
          const resultCda = await ejecutarValidaciones("PANTALLA_INGRESO_CUIT", cuit);
          if (!resultCda.success) {
            const errorCda = resultCda.errors.find((e) => e.isInvalidante);
            console.error("[Paso1Cuit] Validación CDA fallida. Deteniendo avance de paso:", errorCda);

            const errorMsg = errorCda?.message || "La validación interna (CDA) ha fallado.";
            if (!errorCda?.isSystemError) {
              setError("cuit", {
                type: "manual",
                message: errorMsg,
              });
            }
            setProcesoModal(prev => ({
              ...prev,
              hasError: true,
              isSystemError: errorCda?.isSystemError || false,
              pasos: prev.pasos.map(p =>
                p.id === "cda" ? { ...p, estado: "error", descripcion: errorMsg } : p
              )
            }));
            return;
          }

          // Todo exitoso! Marcamos CDA como completado
          setProcesoModal(prev => ({
            ...prev,
            pasos: prev.pasos.map(p =>
              p.id === "cda" ? { ...p, estado: "completado" } : p
            )
          }));

          const nombreCompleto =
            dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim();
          setValue("razonSocial", nombreCompleto, { shouldValidate: true });

          const dom = dg.domiciliofiscal || {};
          setValue("direccion", dom.direccion || "", { shouldValidate: true });
          setValue("localidad", dom.localidad || "", { shouldValidate: true });
          setValue("provincia", dom.descripcionprovincia || "", {
            shouldValidate: true,
          });

          setTimeout(() => {
            setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
            if (onValidar) onValidar();
          }, 800);
        } else {
          const errorMsg = "No se encontraron datos válidos en AFIP";
          setError("cuit", {
            type: "manual",
            message: errorMsg,
          });
          setProcesoModal(prev => ({
            ...prev,
            hasError: true,
            pasos: prev.pasos.map(p =>
              p.id === "afip" ? { ...p, estado: "error", descripcion: errorMsg } :
              p.id === "cda" ? { ...p, estado: "error", descripcion: "Proceso interrumpido." } : p
            )
          }));
        }
      } catch (afipError) {
        console.error(
          "Error devuelto por la API de AFIP o Servidor:",
          afipError,
        );

        const errorMsg = "El padrón de AFIP está experimentando problemas o se encuentra caído de origen. Por favor, reintentá en unos minutos.";
        setProcesoModal(prev => ({
          ...prev,
          hasError: true,
          isSystemError: true,
          pasos: prev.pasos.map(p =>
            p.id === "afip" ? { ...p, estado: "error", descripcion: errorMsg } :
            p.id === "cda" ? { ...p, estado: "error", descripcion: "Proceso interrumpido." } : p
          )
        }));
      }
    } catch (err) {
      console.error("Error general en el flujo de validación de CUIT:", err);
      const errorMsg = "Error al procesar la validación del CUIT";
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        isSystemError: true,
        pasos: prev.pasos.map(p =>
          p.estado === "cargando" || p.estado === "pendiente" ? { ...p, estado: "error", descripcion: errorMsg } : p
        )
      }));
    } finally {
      setIsValidatingSocio(false);
    }
  };

  const isLoading = isValidatingSocio || isLoadingAfip || isLoadingFormato || isLoadingCda;

  return (
    <div className={styles.pasoContainer}>
      <div className={styles.decorativeBanner} style={{ minHeight: "3.75rem" }}>
        <div className={styles.bannerIcon}>
          <svg
            width="1rem"
            height="1rem"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className={styles.bannerText}>
          <p className={styles.bannerTitle}>Proceso 100% seguro y online</p>
          <p className={styles.bannerSub}>
            Tu información es validada en tiempo real contra AFIP
          </p>
        </div>
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
        />
      </div>

      <ProcesamientoModal
        isOpen={procesoModal.isOpen}
        titulo={procesoModal.titulo}
        pasos={procesoModal.pasos}
        hasError={procesoModal.hasError}
        isSystemError={procesoModal.isSystemError}
        onClose={() => setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false })}
        onRetry={handleValidar}
      />
    </div>
  );
}
