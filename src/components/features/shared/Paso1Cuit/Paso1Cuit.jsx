import React, { useState, useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { BuscadorCuit, ProcesamientoModal } from "../../../ui";
import { sociosService } from "../../../../services/sociosService";
import { useValidarCuitAfip } from "../../../../hooks/useAfip";
import { useValidarFormatoCuit } from "../../../../hooks/useSocios";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { matchProvinciaAfip } from "../../../../utils/provinciaUtils";
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

  const { data: provinciasData } = useProvincias();
  const opcionesProvincias = provinciasData?.opciones || [];

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
        { id: "formato", etiqueta: "Verificando formato del CUIT", estado: "cargando", descripcion: "Comprobando que el CUIT sea estructuralmente válido." },
        { id: "afip", etiqueta: "Consultando padrón AFIP", estado: "pendiente", descripcion: "Obteniendo los datos de la empresa desde el padrón federal en tiempo real." },
        { id: "cda", etiqueta: "Ejecutando validaciones CDA", estado: "pendiente", descripcion: "Comprobando políticas de riesgo y negocio para el alta." },
      ],
      hasError: false,
      isSystemError: false,
    });

    try {
      // 1. VALIDACIÓN DE FORMATO
      try {
        const respuestaFormato = await validarFormatoBackend(cuit);
        if (respuestaFormato === false || respuestaFormato?.isValid === false) {
          setError("cuit", { type: "manual", message: "Formato CUIT inválido" });
          setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
          return;
        }
      } catch (formatoError) {
        setError("cuit", { type: "manual", message: "Error en validación de formato" });
        setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
        return;
      }

      // Avanzamos el primer paso
      setProcesoModal(prev => ({
        ...prev,
        pasos: prev.pasos.map(p =>
          p.id === "formato" ? { ...p, estado: "completado" } :
          p.id === "afip" ? { ...p, estado: "cargando", etiqueta: "Consultando padrón AFIP" } : p
        )
      }));

      // 3. CONSULTA AFIP con Fallback a LUFE
      let afipData = null;
      try {
        afipData = await validarAfip(cuit);
      } catch (e) {
        console.warn("Error consultando AFIP, se intentará LUFE...", e);
      }

      if (!afipData || !afipData.datosgenerales) {
        // Intentamos fallback a LUFE
        setProcesoModal(prev => ({
          ...prev,
          pasos: prev.pasos.map(p =>
            p.id === "afip" ? { ...p, etiqueta: "Probando en LUFE...", descripcion: "AFIP no disponible. Consultando entidad en LUFE en su lugar." } : p
          )
        }));
        try {
          const lufeData = await sociosService.obtenerEntidadLufe(cuit);
          if (lufeData) {
            afipData = sociosService.normalizarLufeAEstructuraAfip(lufeData);
          }
        } catch (lufeError) {
          console.warn("Error consultando LUFE como fallback:", lufeError);
        }
      }

      if (afipData && afipData.datosgenerales) {
        const dg = afipData.datosgenerales;

        // Marcamos AFIP/LUFE como completado y CDA como cargando
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
          setProcesoModal((prev) => ({
            ...prev,
            hasError: true,
            isSystemError: resultCda.errors.some(e => e.isSystemError),
            pasos: prev.pasos.map((p) =>
              p.id === "cda" ? { 
                ...p, 
                estado: "error", 
                errores: resultCda.errors.map(e => e.message),
                error: resultCda.errors.find(e => e.isInvalidante)?.message || "Error en validación CDA" 
              } : p
            ),
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

        const provNombreAfip = dom.descripcionprovincia || "";
        const provMatched = matchProvinciaAfip(provNombreAfip, opcionesProvincias);
        setValue("provincia", provMatched ? provMatched.value : provNombreAfip, {
          shouldValidate: true,
        });

        let tipoPersonaId = 0;
        const tipoPersonaStr = (dg.tipopersona || "").toUpperCase();
        if (tipoPersonaStr.includes("JURIDICA") || tipoPersonaStr.includes("JURÍDICA")) {
          tipoPersonaId = 10;
        } else if (tipoPersonaStr.includes("FISICA") || tipoPersonaStr.includes("FÍSICA")) {
          tipoPersonaId = 1;
        }
        setValue("tipopersonaid", tipoPersonaId);

        setTimeout(() => {
          setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });
          if (onValidar) onValidar();
        }, 800);
      } else {
        setProcesoModal(prev => ({
          ...prev,
          hasError: true,
          isSystemError: false,
          pasos: prev.pasos.map((p) =>
            p.id === "afip" ? { ...p, estado: "error", error: "No se encontraron datos en AFIP ni LUFE." } : p
          ),
        }));
        return;
      }
    } catch (err) {
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        isSystemError: true,
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
