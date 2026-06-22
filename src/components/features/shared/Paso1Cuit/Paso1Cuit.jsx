import React, { useState, useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { BuscadorCuit } from "../../../ui/BuscadorCuit/BuscadorCuit";
import { ProcesamientoModal } from "../../../ui/ProcesamientoModal/ProcesamientoModal";
import { sociosService } from "../../../../services/sociosService";
import { useValidarCuitAfip } from "../../../../hooks/useAfip";
import { useValidarSocioCore } from "../../../../hooks/useSgrPlusCore";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { matchProvinciaAfip } from "../../../../utils/provinciaUtils";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useParams } from "react-router-dom";
import styles from "./Paso1Cuit.module.css";

import { useVendor } from "../../../../hooks/useVendor";

export default function Paso1Cuit({ onValidar, onSocioExistente }) {
  const { cadenaSlug } = useParams();
  const cadenaValorIdParam = Number(cadenaSlug) || 0;
  const { control, getValues, setValue, setError, clearErrors } =
    useFormContext();
  const { errors, dirtyFields } = useFormState({ control });
  const { mutateAsync: validarAfip, isPending: isLoadingAfip } =
    useValidarCuitAfip();
  const { ejecutarValidaciones, loading: isLoadingCda } = useCdaEngine();
  const { mutateAsync: validarSocioCore } = useValidarSocioCore();
  const [isValidatingSocio, setIsValidatingSocio] = useState(false);
  const user = useAuthStore((state) => state.user);
  
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
        {
          id: "afip",
          etiqueta: "Consultando padrón AFIP",
          estado: "cargando",
          descripcion:
            "Obteniendo los datos de la empresa desde el padrón federal en tiempo real.",
        },
        {
          id: "sgrcore",
          etiqueta: "Validando con SGRPlus",
          estado: "pendiente",
          descripcion: "Verificando estado del socio en el sistema core.",
        },
        {
          id: "cda",
          etiqueta: "Ejecutando validaciones CDA",
          estado: "pendiente",
          descripcion:
            "Comprobando políticas de riesgo y negocio para el alta.",
        },
      ],
      hasError: false,
      isSystemError: false,
    });

    try {
      // 3. CONSULTA AFIP con Fallback a LUFE
      let afipData = null;
      try {
        afipData = await validarAfip(cuit);
      } catch (e) {
        console.warn("Error consultando AFIP, se intentará LUFE...", e);
      }

      if (!afipData || !afipData.datosgenerales) {
        // Intentamos fallback a LUFE
        setProcesoModal((prev) => ({
          ...prev,
          pasos: prev.pasos.map((p) =>
            p.id === "afip"
              ? {
                  ...p,
                  etiqueta: "Probando en LUFE...",
                  descripcion:
                    "AFIP no disponible. Consultando entidad en LUFE en su lugar.",
                }
              : p,
          ),
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

        // Marcamos AFIP/LUFE como completado y SGRCore como cargando
        setProcesoModal((prev) => ({
          ...prev,
          pasos: prev.pasos.map((p) =>
            p.id === "afip"
              ? { ...p, estado: "completado" }
              : p.id === "sgrcore"
                ? { ...p, estado: "cargando" }
                : p,
          ),
        }));

        // ── VALIDACIÓN SGRPlus Core
        try {
          const resultSgrCore = await validarSocioCore({
            cuit,
            cadenaValorId: cadenaValorIdParam,
          });
          if (resultSgrCore?.data && resultSgrCore.data.success === false) {
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

        // Avanzamos a CDA
        setProcesoModal((prev) => ({
          ...prev,
          pasos: prev.pasos.map((p) =>
            p.id === "sgrcore"
              ? { ...p, estado: "completado" }
              : p.id === "cda"
                ? { ...p, estado: "cargando" }
                : p,
          ),
        }));

        // ── VALIDACIÓN CDA (PANTALLA_INGRESO_CUIT)
        const resultCda = await ejecutarValidaciones(
          "PANTALLA_INGRESO_CUIT",
          cuit,
        );

        if (!resultCda.success) {
          setProcesoModal((prev) => ({
            ...prev,
            hasError: true,
            isSystemError: resultCda.errors.some((e) => e.isSystemError),
            pasos: prev.pasos.map((p) =>
              p.id === "cda"
                ? {
                    ...p,
                    estado: "error",
                    errores: resultCda.errors.map((e) => e.message),
                    error:
                      resultCda.errors.find((e) => e.isInvalidante)?.message ||
                      "Error en validación CDA",
                  }
                : p,
            ),
          }));
          return;
        }

        // Todo exitoso! Marcamos CDA como completado
        setProcesoModal((prev) => ({
          ...prev,
          pasos: prev.pasos.map((p) =>
            p.id === "cda" ? { ...p, estado: "completado" } : p,
          ),
        }));

        // ── NUEVA VALIDACIÓN: Existencia en base de datos (Web y SGRPlus)
        try {
          // 1. Verificamos si ya existe en la plataforma web
          const sociosWebEncontrados = await sociosService.obtenerSocios({
            Cuit: cuit,
          });
          
          if (sociosWebEncontrados && sociosWebEncontrados.length > 0) {
            const socioWebExistente = sociosWebEncontrados[0];

            setProcesoModal({
              isOpen: false,
              titulo: "",
              pasos: [],
              hasError: false,
              isSystemError: false,
            });

            if (onSocioExistente) {
              onSocioExistente(socioWebExistente, "ya_existe");
            }
            return; // Bloquea a todos (incluyendo vendors) porque ya está registrada en la web
          }

          // 2. Si no está en la web, verificamos si existe históricamente en SGRPlus Core
          const sociosSgrEncontrados = await sociosService.obtenerSociosSgrplus({
            Cuit: cuit,
          });

          if (sociosSgrEncontrados && sociosSgrEncontrados.length > 0) {
            if (!isVendor) {
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
                setProcesoModal({
                  isOpen: false,
                  titulo: "",
                  pasos: [],
                  hasError: false,
                  isSystemError: false,
                });

                if (onSocioExistente) {
                  onSocioExistente(socioSgrExistente, "email_mismatch");
                }
                return; // Bloquea al usuario normal porque el email de SGRPlus no coincide
              }
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

        const nombreCompleto =
          dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim();
        setValue("razonSocial", nombreCompleto, { shouldValidate: true });

        const dom = dg.domiciliofiscal || {};
        setValue("direccion", dom.direccion || "", { shouldValidate: true });
        setValue("localidad", dom.localidad || "", { shouldValidate: true });

        const provNombreAfip = dom.descripcionprovincia || "";
        const provMatched = matchProvinciaAfip(
          provNombreAfip,
          opcionesProvincias,
        );
        setValue(
          "provincia",
          provMatched ? provMatched.value : provNombreAfip,
          {
            shouldValidate: true,
          },
        );

        let tipoPersonaId = 0;
        const tipoPersonaStr = (dg.tipopersona || "").toUpperCase();
        if (
          tipoPersonaStr.includes("JURIDICA") ||
          tipoPersonaStr.includes("JURÍDICA")
        ) {
          tipoPersonaId = 10;
        } else if (
          tipoPersonaStr.includes("FISICA") ||
          tipoPersonaStr.includes("FÍSICA")
        ) {
          tipoPersonaId = 1;
        }
        setValue("tipopersonaid", tipoPersonaId);

        let mesCierre = null;
        if (dg.mescierre) {
          mesCierre = parseInt(dg.mescierre, 10);
        } else if (dg.mes_cierre) {
          mesCierre = parseInt(dg.mes_cierre, 10);
        }
        setValue("mescierre", mesCierre);

        // ── EXTRAER FECHA DE INICIO DE ACTIVIDADES (AFIP)
        let fechaInicioActividades = null;
        const actividades = [];

        if (Array.isArray(afipData.datosregimengeneral?.actividad)) {
          actividades.push(...afipData.datosregimengeneral.actividad);
        }
        if (Array.isArray(afipData.datosmonotributo?.actividad)) {
          actividades.push(...afipData.datosmonotributo.actividad);
        }

        let minPeriodo = null;
        for (const act of actividades) {
          if (act.periodo) {
            if (minPeriodo === null || act.periodo < minPeriodo) {
              minPeriodo = act.periodo;
            }
          }
        }

        if (minPeriodo) {
          const minPeriodoStr = minPeriodo.toString();
          if (minPeriodoStr.length === 6) {
            const year = parseInt(minPeriodoStr.substring(0, 4), 10);
            const month = parseInt(minPeriodoStr.substring(4, 6), 10);
            const lastDay = new Date(year, month, 0).getDate();
            fechaInicioActividades = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}T00:00:00`;
          }
        }
        setValue("fechainicioactividades", fechaInicioActividades);

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
      } else {
        setProcesoModal((prev) => ({
          ...prev,
          hasError: true,
          isSystemError: false,
          pasos: prev.pasos.map((p) =>
            p.id === "afip"
              ? {
                  ...p,
                  estado: "error",
                  error: "No se encontraron datos en AFIP ni LUFE.",
                }
              : p,
          ),
        }));
        return;
      }
    } catch (err) {
      setProcesoModal((prev) => ({
        ...prev,
        hasError: true,
        isSystemError: true,
      }));
    } finally {
      setIsValidatingSocio(false);
    }
  };

  const isLoading = isValidatingSocio || isLoadingAfip || isLoadingCda;

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
        onClose={() =>
          setProcesoModal({
            isOpen: false,
            titulo: "",
            pasos: [],
            hasError: false,
            isSystemError: false,
          })
        }
        onRetry={handleValidar}
      />
    </div>
  );
}
