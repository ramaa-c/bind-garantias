import React, { useState, useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { FiBriefcase, FiShield, FiZap, FiCheckCircle } from "react-icons/fi";
import { BuscadorCuit } from "../../../ui/BuscadorCuit/BuscadorCuit";
import { ProcesamientoModal } from "../../../ui/ProcesamientoModal/ProcesamientoModal";
import { sociosService } from "../../../../services/sociosService";
import { nosisService } from "../../../../services/nosisService";
import { useValidarCuitAfip } from "../../../../hooks/useAfip";
import { useValidarSocioCore } from "../../../../hooks/useSgrPlusCore";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import { useProvincias } from "../../../../hooks/useCatalogos";
import { matchProvinciaAfip } from "../../../../utils/provinciaUtils";
import {
  parseAddress,
  decodeHtmlEntities,
} from "../../../../utils/direccionParser";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useParams } from "react-router-dom";
import styles from "./Paso1Cuit.module.css";

import { useVendor } from "../../../../hooks/useVendor";

export default function Paso1Cuit({ onValidar, onSocioExistente, onSocioParcialPropio }) {
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
  const { data: usuarioDb } = useObtenerPorNombreOEmail(user?.email);
  const usuarioWebId = usuarioDb?.usuariowebid || usuarioDb?.UsuarioWebID || usuarioDb?.id;

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

  // El backend no expone forma de preguntar "¿este socio tiene algún usuario
  // vinculado?" (SocioUsuario solo se puede filtrar por UsuarioWebID, nunca
  // por SocioID). Por eso, para saber si un CUIT ya existente es "mío"
  // (retomable) o "de otro" (bloqueante), consultamos al revés: si el
  // usuario actual ya está vinculado a ese SocioID.
  const esSocioPropio = async (socioId) => {
    if (!usuarioWebId || !socioId) return false;
    try {
      const vinculos =
        await sociosService.obtenerSocioUsuarioPorUsuarioId(usuarioWebId);
      const lista = Array.isArray(vinculos)
        ? vinculos
        : vinculos?.items || vinculos?.data || [];
      return lista.some(
        (v) => Number(v.socioid ?? v.SocioID ?? v.SocioId) === Number(socioId),
      );
    } catch (e) {
      console.warn("[Paso1Cuit] No se pudo verificar vinculación previa:", e);
      return false;
    }
  };

  // Cuando el CDA de PANTALLA_INGRESO_CUIT queda "pendiente" (409, ver
  // useCdaEngine), no queda ningún Socio creado y por lo tanto el admin no
  // tiene forma de ver ni re-ejecutar ese CDA desde EmpresaDetalle (el
  // historial se consulta por SocioID). Creamos un socio parcial —con lo
  // mínimo que ya tenemos de Nosis/AFIP— y lo vinculamos al usuario actual
  // ahí mismo, para poder trackear el pendiente y para que, si el usuario
  // reintenta más tarde y el CDA ya pasa, podamos reconocer el CUIT como
  // "propio" (ver esSocioPropio) y completar ese mismo registro en vez de
  // bloquear el flujo con el modal de "empresa ya registrada".
  const asegurarSocioParcial = async (cuit, nosisData, afipData) => {
    if (!usuarioWebId) return;
    try {
      const existentes = await sociosService.obtenerSocios({ Cuit: cuit });
      if (existentes && existentes.length > 0) return; // ya hay un socio (propio o ajeno); no duplicar

      const cuitLimpio = String(cuit).replace(/\D/g, "");
      const prefix = cuitLimpio.substring(0, 2);
      const tipopersonaid = ["30", "33", "34"].includes(prefix) ? 10 : 1;
      const dg = afipData?.datosgenerales;
      const denominacion =
        decodeHtmlEntities(
          nosisData?.VI_RazonSocial ||
            `${nosisData?.VI_Nombre || ""} ${nosisData?.VI_Apellido || ""}`.trim() ||
            dg?.razonsocial ||
            `${dg?.nombre || ""} ${dg?.apellido || ""}`.trim(),
        ) || cuitLimpio;

      const nuevoSocio = await sociosService.crearSocio({
        entidadid: 1,
        tiposocioid: 9,
        cuit: cuitLimpio,
        denominacion,
        calle: "",
        numero: 0,
        piso: "",
        departamento: "",
        ciudadid: null,
        telefono: "",
        fax: "",
        email: user?.email || "",
        tipopersonaid,
        tipocarteraid: 2,
        sectorcontableid: 700,
        tipoactividadbcraid: 0,
        tipoactividadsepymeid: null,
        marcavinculacion: "",
        situacionbcraid: 1,
        fechabaja: null,
        motivobajaid: null,
        socioestadoid: 9,
        codpos: "",
        tamanioempresaid: 0,
        fechacierreejercicio: new Date().toISOString().split(".")[0],
        legajo: 0,
        tiporegimenivaid: 1,
        actividadespecifica: "",
        partido: "",
        telefono2: "",
        telefono3: "",
        visitado: "0",
        scoringcomercial: "0",
        partidoid: null,
        provinciaid: null,
        fechainicioactividades: new Date().toISOString().split(".")[0],
        tipoactividadglobalid: 0,
        tipocanalcomercializacionid: 0,
        emailfacturacion: user?.email || "",
        minapoderadosrequeridos: 0,
        tipocondicionfianzaid: 0,
        jsoncondicionfianza: "",
      });

      const nuevoSocioId = nuevoSocio?.socioid || nuevoSocio?.id;
      if (!nuevoSocioId) return;

      await sociosService.vincularSocioUsuario({
        usuariowebid: usuarioWebId,
        socioid: nuevoSocioId,
        momentocreacion: new Date().toISOString().split(".")[0],
      });
    } catch (e) {
      console.error(
        "[Paso1Cuit] No se pudo crear el socio parcial para trackear el CDA pendiente:",
        e,
      );
    }
  };

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
          etiqueta: "Consultando padrón",
          estado: "cargando",
          descripcion:
            "Obteniendo los datos de la empresa desde el padrón federal/bureau en tiempo real.",
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
      // 3. CONSULTA NOSIS con Fallback a AFIP/LUFE
      let nosisData = null;
      let afipData = null;

      try {
        nosisData = await nosisService.obtenerDatosNormalizados(cuit);
      } catch (e) {
        console.warn("Error consultando Nosis, se intentará AFIP...", e);
      }

      if (!nosisData) {
        setProcesoModal((prev) => ({
          ...prev,
          pasos: prev.pasos.map((p) =>
            p.id === "afip"
              ? {
                  ...p,
                  etiqueta: "Probando en LUFE...",
                  descripcion:
                    "Nosis no disponible. Consultando entidad en LUFE en su lugar.",
                }
              : p,
          ),
        }));
      }

      // SIEMPRE consultamos LUFE/AFIP porque necesitamos mescierre y tipopersona (a pedido del usuario)
      try {
        const lufeData = await sociosService.obtenerEntidadLufe(cuit);
        if (lufeData && lufeData.success) {
          afipData = sociosService.normalizarLufeAEstructuraAfip(lufeData);
        }
      } catch (lufeError) {
        console.warn("Error consultando LUFE:", lufeError);
      }

      if (!afipData || !afipData.datosgenerales) {
        if (!nosisData) {
          setProcesoModal((prev) => ({
            ...prev,
            pasos: prev.pasos.map((p) =>
              p.id === "afip"
                ? {
                    ...p,
                    etiqueta: "Probando en AFIP...",
                    descripcion:
                      "LUFE no disponible. Consultando padrón AFIP en su lugar.",
                  }
                : p,
            ),
          }));
        }
        try {
          afipData = await validarAfip(cuit);
        } catch (e) {
          console.warn("Error consultando AFIP como fallback...", e);
        }
      }

      if (nosisData || (afipData && afipData.datosgenerales)) {
        const dg = afipData ? afipData.datosgenerales : null;

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
          cadenaValorIdParam,
          usuarioWebId,
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

          if (resultCda.errors.some((e) => e.isPendiente)) {
            await asegurarSocioParcial(cuit, nosisData, afipData);
          }
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

            // Puede ser un socio "parcial" creado por nosotros mismos en un
            // intento anterior cuyo CDA quedó pendiente (ver
            // asegurarSocioParcial). Si el usuario actual ya está vinculado
            // a ese socio, lo tratamos como propio y dejamos retomar el
            // registro en vez de bloquear con "empresa ya registrada".
            const esPropio = await esSocioPropio(socioWebExistente.socioid);
            if (!esPropio) {
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

            if (onSocioParcialPropio) {
              onSocioParcialPropio(socioWebExistente.socioid);
            }
          }

          // 2. Si no está en la web, verificamos si existe históricamente en SGRPlus Core
          const sociosSgrEncontrados = await sociosService.obtenerSociosSgrplus(
            {
              Cuit: cuit,
            },
          );

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

        if (nosisData) {
          const nombreCompleto = decodeHtmlEntities(
            nosisData.VI_RazonSocial ||
              `${nosisData.VI_Nombre || ""} ${nosisData.VI_Apellido || ""}`.trim(),
          );
          setValue("razonSocial", nombreCompleto, { shouldValidate: true });

          const fullDireccion = decodeHtmlEntities(
            `${nosisData.VI_DomAF_Calle || ""} ${nosisData.VI_DomAF_Nro || ""}`.trim(),
          );
          setValue("direccion", fullDireccion, { shouldValidate: true });
          setValue("codpos", nosisData.VI_DomAF_CP || "", {
            shouldValidate: true,
          });

          setValue("calle", nosisData.VI_DomAF_Calle || "", {
            shouldValidate: true,
          });
          const hasNumber = !!nosisData.VI_DomAF_Nro;
          setValue("sinNumero", !hasNumber, { shouldValidate: true });
          setValue("numero", hasNumber ? nosisData.VI_DomAF_Nro : 0, {
            shouldValidate: true,
          });
          if (!hasNumber) clearErrors("numero");
          setValue("piso", nosisData.VI_DomAF_Piso || "", {
            shouldValidate: true,
          });
          setValue("departamento", nosisData.VI_DomAF_Dto || "", {
            shouldValidate: true,
          });

          const localidadStr = decodeHtmlEntities(nosisData.VI_DomAF_Loc || "");
          setValue("localidad", localidadStr, { shouldValidate: true });
          setValue("localidadid", null);

          const provNombre = decodeHtmlEntities(nosisData.VI_DomAF_Prov || "");
          const provMatched = matchProvinciaAfip(
            provNombre,
            opcionesProvincias,
          );
          const matchedProvId = provMatched ? Number(provMatched.value) : null;
          setValue("provinciaid", matchedProvId, { shouldValidate: true });
          setValue("provincia", provMatched ? provMatched.value : provNombre, {
            shouldValidate: true,
          });

          setValue("ciudad", nosisData.VI_DomAF_Loc || "", {
            shouldValidate: true,
          });
          setValue("ciudadid", null);

          let tipoPersonaId = 0;
          let mesCierre = null;

          if (nosisData.VI_TipoPersona === "1") {
            tipoPersonaId = 10;
          } else if (nosisData.VI_TipoPersona === "2") {
            tipoPersonaId = 1;
          } else if (afipData && afipData.datosgenerales) {
            const dg = afipData.datosgenerales;
            const tipoPersonaStr = (dg.tipopersona || "").toUpperCase();
            if (
              tipoPersonaStr.includes("JURIDICA") ||
              tipoPersonaStr.includes("JURÍDICA")
            ) {
              tipoPersonaId = 10;
            } else if (
              tipoPersonaStr.includes("FISICA") ||
              tipoPersonaStr.includes("FÍSICA") ||
              tipoPersonaStr.includes("HUMANA")
            ) {
              tipoPersonaId = 1;
            }
          }

          if (!tipoPersonaId) {
            const cleanCuit = String(cuit).replace(/\D/g, "");
            const prefix = cleanCuit.substring(0, 2);
            if (
              ["20", "23", "24", "27", "25", "26"].includes(prefix) ||
              cleanCuit.startsWith("2")
            ) {
              tipoPersonaId = 1;
            } else if (
              ["30", "33", "34"].includes(prefix) ||
              cleanCuit.startsWith("3")
            ) {
              tipoPersonaId = 10;
            }
          }
          setValue("tipopersonaid", tipoPersonaId);

          if (afipData && afipData.datosgenerales) {
            const dg = afipData.datosgenerales;
            if (dg.mescierre) {
              mesCierre = parseInt(dg.mescierre, 10);
            } else if (dg.mes_cierre) {
              mesCierre = parseInt(dg.mes_cierre, 10);
            }
          }
          setValue("mescierre", mesCierre);

          let fechaInicioActividades = null;
          if (nosisData.VI_Act01_FecInicio) {
            fechaInicioActividades = `${nosisData.VI_Act01_FecInicio}T00:00:00`;
          }
          setValue("fechainicioactividades", fechaInicioActividades);

          let tipoRegimenIvaId = 1;
          if (
            nosisData.VI_Inscrip_Monotributo === "Si" ||
            nosisData.VI_Inscrip_Monotributo_Es === "Si" ||
            nosisData.VI_Inscrip_Monotributo
          ) {
            tipoRegimenIvaId = 2;
          }
          setValue("tiporegimenivaid", tipoRegimenIvaId);
        } else {
          const nombreCompleto = decodeHtmlEntities(
            dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim(),
          );
          setValue("razonSocial", nombreCompleto, { shouldValidate: true });

          const dom = dg.domiciliofiscal || {};
          const fullDireccion = decodeHtmlEntities(dom.direccion || "");
          setValue("direccion", fullDireccion, { shouldValidate: true });
          setValue("codpos", dom.codpostal || "", { shouldValidate: true });

          const parsedDir = parseAddress(fullDireccion);
          setValue("calle", parsedDir.calle, { shouldValidate: true });
          setValue("sinNumero", parsedDir.numero === 0, {
            shouldValidate: true,
          });
          setValue("numero", parsedDir.numero, { shouldValidate: true });
          if (parsedDir.numero === 0) {
            clearErrors("numero");
          }
          setValue("piso", parsedDir.piso, { shouldValidate: true });
          setValue("departamento", parsedDir.departamento, {
            shouldValidate: true,
          });

          const localidadStr = decodeHtmlEntities(dom.localidad || "");
          setValue("localidad", localidadStr, { shouldValidate: true });
          setValue("localidadid", null);

          const provNombreAfip = decodeHtmlEntities(
            dom.descripcionprovincia || "",
          );
          const provMatched = matchProvinciaAfip(
            provNombreAfip,
            opcionesProvincias,
          );
          const matchedProvId = provMatched ? Number(provMatched.value) : null;
          setValue("provinciaid", matchedProvId, { shouldValidate: true });
          setValue(
            "provincia",
            provMatched ? provMatched.value : provNombreAfip,
            {
              shouldValidate: true,
            },
          );

          setValue("ciudad", dom.localidad || "", { shouldValidate: true });
          setValue("ciudadid", null);

          let tipoPersonaId = 0;
          const tipoPersonaStr = (dg.tipopersona || "").toUpperCase();
          if (
            tipoPersonaStr.includes("JURIDICA") ||
            tipoPersonaStr.includes("JURÍDICA")
          ) {
            tipoPersonaId = 10;
          } else if (
            tipoPersonaStr.includes("FISICA") ||
            tipoPersonaStr.includes("FÍSICA") ||
            tipoPersonaStr.includes("HUMANA")
          ) {
            tipoPersonaId = 1;
          } else {
            // Fallback basado en prefijo de CUIT
            const cleanCuit = String(cuit).replace(/\D/g, "");
            const prefix = cleanCuit.substring(0, 2);
            if (
              ["20", "23", "24", "27", "25", "26"].includes(prefix) ||
              cleanCuit.startsWith("2")
            ) {
              tipoPersonaId = 1;
            } else if (
              ["30", "33", "34"].includes(prefix) ||
              cleanCuit.startsWith("3")
            ) {
              tipoPersonaId = 10;
            }
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

          // ── DETERMINAR TIPO REGIMEN IVA
          let tipoRegimenIvaId = 1;
          const monotributo = afipData.datosmonotributo;
          if (monotributo) {
            const tieneDatosMonotributo = Object.values(monotributo).some(
              (val) => {
                if (val === null || val === undefined) return false;
                if (Array.isArray(val)) return val.length > 0;
                if (typeof val === "object") return Object.keys(val).length > 0;
                return val !== "";
              },
            );

            if (tieneDatosMonotributo) {
              tipoRegimenIvaId = 2;
            }
          }
          setValue("tiporegimenivaid", tipoRegimenIvaId);
        }

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
                  error: "No se encontraron datos en Nosis, AFIP ni LUFE.",
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
      <div className={styles.heroIcon}>
        <FiBriefcase />
      </div>

      <div className={styles.heroCopy}>
        <h2 className={styles.heroTitle}>¿Cuál es el CUIT de tu empresa?</h2>
        <p className={styles.heroSub}>
          Validamos tu información fiscal y crediticia en tiempo real para
          agilizar el registro de tu empresa.
        </p>
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

      <div className={styles.trustRow}>
        <span className={styles.trustChip}>
          <FiShield /> Datos encriptados
        </span>
        <span className={styles.trustChip}>
          <FiZap /> Validación en segundos
        </span>
        <span className={styles.trustChip}>
          <FiCheckCircle /> Sin costo
        </span>
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
