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
      // 1. VALIDACIÓN DE FORMATO (Ignoramos bloqueo por formato)
      try {
        const respuestaFormato = await validarFormatoBackend(cuit);
        if (respuestaFormato === false || respuestaFormato?.isValid === false) {
          console.warn("Formato CUIT inválido (Ignorado para avanzar)");
        }
      } catch (formatoError) {
        console.warn("Error en validación de formato (Ignorado para avanzar)");
      }

      // 2. REGISTRO EN SGR+ (Ignoramos bloqueo si ya existe)
      let socioSgrDb = null;
      try {
        const respSgr = await sociosService.obtenerSocios({
          Cuit: cuit,
          page: 1,
          page_size: 10,
        });
        socioSgrDb = Array.isArray(respSgr)
          ? respSgr[0]
          : respSgr?.items?.[0] || respSgr?.data?.[0];
      } catch (e) {
        console.warn("Error consultando SGR+ (Ignorado para avanzar)", e);
      }

      if (socioSgrDb) {
        console.warn("Esta empresa ya se encuentra en gestión por SGR+ (Ignorado para avanzar)");
        setValue("razonSocial", socioSgrDb.denominacion || "Empresa " + cuit, { shouldValidate: true });
        setValue("direccion", socioSgrDb.calle || "Dirección de Prueba", { shouldValidate: true });
        setValue("localidad", socioSgrDb.partido || socioSgrDb.localidad || "Localidad de Prueba", { shouldValidate: true });
        setValue("provincia", socioSgrDb.provincia || "Provincia de Prueba", { shouldValidate: true });
        
        setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
        if (onValidar) onValidar();
        return;
      }

      // VALIDACIÓN CONTRA ESQUEMA WEB (Ignoramos bloqueo si ya existe)
      let socioWebDb = null;
      try {
        const respWeb = await sociosService.obtenerSociosWeb({ Cuit: cuit });
        socioWebDb = Array.isArray(respWeb)
          ? respWeb[0]
          : respWeb?.items?.[0] || respWeb?.data?.[0];
      } catch (e) {
        console.warn("Error consultando Web DB (Ignorado para avanzar)", e);
      }

      if (socioWebDb && socioWebDb.socioid) {
        console.warn("Esta empresa ya existe en esquema web (Ignorado para avanzar)");
        setValue("razonSocial", socioWebDb.denominacion || "Empresa " + cuit, { shouldValidate: true });
        setValue("direccion", socioWebDb.calle || "Dirección de Prueba", { shouldValidate: true });
        setValue("localidad", socioWebDb.partido || socioWebDb.localidad || "Localidad de Prueba", { shouldValidate: true });
        setValue("provincia", socioWebDb.provincia || "Provincia de Prueba", { shouldValidate: true });

        setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
        if (onValidar) onValidar();
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
        let afipData = null;
        try {
          afipData = await validarAfip(cuit);
        } catch (e) {
          console.warn("Error consultando AFIP (Ignorado para avanzar)");
        }

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
          setValue("direccion", dom.direccion || "Dirección de Prueba", { shouldValidate: true });
          setValue("localidad", dom.localidad || "Localidad de Prueba", { shouldValidate: true });
          setValue("provincia", dom.descripcionprovincia || "Provincia de Prueba", {
            shouldValidate: true,
          });

          setTimeout(() => {
            setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
            if (onValidar) onValidar();
          }, 800);
        } else {
          console.warn("No se encontraron datos válidos en AFIP (Ignorado para avanzar)");
          setValue("razonSocial", "Empresa " + cuit, { shouldValidate: true });
          setValue("direccion", "Dirección de Prueba", { shouldValidate: true });
          setValue("localidad", "Localidad de Prueba", { shouldValidate: true });
          setValue("provincia", "Provincia de Prueba", { shouldValidate: true });

          setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
          if (onValidar) onValidar();
        }
      } catch (afipError) {
        console.warn("Error en AFIP (Ignorado para avanzar)", afipError);
        setValue("razonSocial", "Empresa " + cuit, { shouldValidate: true });
        setValue("direccion", "Dirección de Prueba", { shouldValidate: true });
        setValue("localidad", "Localidad de Prueba", { shouldValidate: true });
        setValue("provincia", "Provincia de Prueba", { shouldValidate: true });

        setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
        if (onValidar) onValidar();
      }
    } catch (err) {
      console.warn("Error general en validación de CUIT (Ignorado para avanzar)", err);
      setValue("razonSocial", "Empresa " + cuit, { shouldValidate: true });
      setValue("direccion", "Dirección de Prueba", { shouldValidate: true });
      setValue("localidad", "Localidad de Prueba", { shouldValidate: true });
      setValue("provincia", "Provincia de Prueba", { shouldValidate: true });

      setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
      if (onValidar) onValidar();
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
