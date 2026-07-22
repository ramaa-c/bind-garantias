import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { FiCheckCircle, FiEdit2, FiMail, FiPhone, FiUser, FiShield } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../ui/Button/Button";
import { Modal } from "../../../ui/Modal/Modal";
import { SelectSocio } from "../../../ui/SelectSocio/SelectSocio";
import { InputSocioMasked } from "../../../ui/InputSocioMasked/InputSocioMasked";
import { BuscadorCuit } from "../../../ui/BuscadorCuit/BuscadorCuit";
import { ProcesamientoModal } from "../../../ui/ProcesamientoModal/ProcesamientoModal";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { useCdaEngine } from "../../../../hooks/useCdaEngine";
import { useRegistrarModalLegajo } from "../../../../hooks/useRegistrarModalLegajo";
import { useUsuarioWebIdActual } from "../../../../hooks/useUsuario";
import { afipService } from "../../../../services/afipService";
import { sociosService } from "../../../../services/sociosService";
import { nosisService } from "../../../../services/nosisService";
import { ConfirmacionModal } from "../ConfirmacionModal/ConfirmacionModal";
import { tercerosService } from "../../../../services/tercerosService";
import { useParams } from "react-router-dom";
import styles from "./RepresentanteModal.module.css";

export function RepresentanteModal({
  isOpen,
  onClose,
  onSuccess,              // Legajo mode: callback after database save
  representante,          // Legajo mode: DB representation of the representative
  socioIdActivo,          // Both: active partner ID to link the relation
  representanteInicial,   // Form mode: initial representative data for edit
  onGuardar,              // Form mode: callback to update parent React Hook Form state
  tipoPersonaId,          // Solo lo pasa RepresentantesSection (zona de legajo): si no viene, se
                          // preserva el comportamiento anterior ("Representante" en todos lados).
}) {
  const { cadenaSlug } = useParams();
  const cadenaValorIdParam = Number(cadenaSlug) || 0;
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");
  // Persona Física no tiene "Representante Legal" (eso es de una persona
  // jurídica): el rol equivalente es "Apoderado". Mismo dato/flujo, solo
  // cambia la etiqueta que ve el usuario.
  const esPersonaFisica = Number(tipoPersonaId) === 1;
  const etiquetaRol = esPersonaFisica ? "Apoderado" : "Representante";
  const rolPorDefecto = esPersonaFisica ? "Apoderado" : "Representante Legal";
  const [validando, setValidando] = useState(false);
  const [enriqueciendoAuto, setEnriqueciendoAuto] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);
  const [cdaRechazado, setCdaRechazado] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [prevProps, setPrevProps] = useState({ isOpen, representante, representanteInicial });
  if (isOpen !== prevProps.isOpen || representante !== prevProps.representante || representanteInicial !== prevProps.representanteInicial) {
    setPrevProps({ isOpen, representante, representanteInicial });
    if (isOpen) {
      setAfipValidado(!!(representante || representanteInicial));
      setCdaRechazado(false);
      setShowConfirm(false);
    }
  }
  const [procesoModal, setProcesoModal] = useState({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });

  const { ejecutarValidaciones } = useCdaEngine();
  const usuarioWebIdActual = useUsuarioWebIdActual();
  useRegistrarModalLegajo(isOpen);

  const { control, reset, setValue, setError, clearErrors, trigger, getValues, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      rol: rolPorDefecto,
      email: "",
      telefono: "",
    }
  });

  const cuitValue = useWatch({ control, name: "cuit" });
  const nombreValue = useWatch({ control, name: "nombre" });

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuitValue, clearErrors]);

  useEffect(() => {
    if (isOpen) {
      if (representante) {
        // Legajo mode edit
        reset({
          cuit: representante.cuit || "",
          nombre: representante.nombre || "",
          rol: representante.rolId === 230 ? "Representante Legal" : "Apoderado",
          email: representante.email || "",
          telefono: representante.telefono || "",
        });

      } else if (representanteInicial) {
        // Form mode edit
        reset({
          cuit: representanteInicial.cuit || "",
          nombre: representanteInicial.nombre || "",
          rol: representanteInicial.rol || "Representante Legal",
          email: representanteInicial.email || "",
          telefono: representanteInicial.celular || representanteInicial.telefono || "",
        });

      } else {
        // Create mode (both)
        reset({
          cuit: "",
          nombre: "",
          rol: rolPorDefecto,
          email: "",
          telefono: "",
        });
      }
    }
  }, [isOpen, representante, representanteInicial, reset, rolPorDefecto]);


  const handleAfipLookup = async () => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      setError("cuit", { type: "manual", message: "Por favor, ingrese un CUIT de 11 dígitos válido." });
      return;
    }
    
    setValidando(true);
    clearErrors("cuit");
    
    setProcesoModal({
      isOpen: true,
      titulo: `Validando ${etiquetaRol}`,
      pasos: [
        { id: "sgr", etiqueta: "Conectando con SGR+", estado: "cargando", descripcion: "Validando situación e historial societario." },
      ],
      hasError: false,
      isSystemError: false
    });

    // El motor de CDAs para PANTALLA_SOCIOS necesita que la relación
    // tercero<->socio ya exista para resolver el contexto — si no, el
    // backend responde 500 (EAccessViolation, confirmado en vivo). Se crea
    // un stub (participación no aplica acá, pero sí porcacciones=0) ANTES
    // de validar, igual que en SocioAccionistaModal. Solo aplica al alta
    // nueva en modo legajo: si es edición (representante/representanteInicial)
    // la relación ya existe; si no hay socioIdActivo (modo formulario del
    // wizard de Alta de Operación) tampoco corresponde crear nada en la
    // base todavía. `onConfirmSave` ya busca la relación existente por
    // terceroId+socio antes de decidir crear o actualizar, así que no hace
    // falta guardar el ID acá: la va a encontrar sola.
    if (socioIdActivo && !representante && !representanteInicial) {
      try {
        // Denominacion y descripcionreducida van VACÍAS a propósito para el
        // caso de que haya que crearlo: la precarga de más abajo hace
        // `terceroEncontrado?.denominacion || nosisData...`, y un
        // placeholder no vacío gana esa cadena de ORs, pisando el nombre
        // real que devuelva NOSIS/AFIP. `buscarOCrearTercero` busca primero
        // por CUIT y reutiliza el existente si lo hay (evitando duplicarlo).
        const terceroResuelto = await tercerosService.buscarOCrearTercero(cuitLimpio, {
          tercerorelacionadoid: 0,
          denominacion: "",
          cuit: cuitLimpio,
          bcraid: 0,
          tipopersonaid: 1,
          tipodocumentoid: 0,
          numerodocumento: cuitLimpio,
          estadocivilid: 0,
          ciudadid: 0,
          telefono: "",
          conyuge: "",
          actividad: "",
          contacto: "",
          nrocuenta: "",
          codigomercado: "",
          calle: "",
          numero: 0,
          piso: "",
          departamento: "",
          codpos: "",
          descripcionreducida: "",
          mail: "",
        });
        const stubTerceroId =
          terceroResuelto.tercerorelacionadoid ||
          terceroResuelto.TerceroRelacionadoID ||
          terceroResuelto.id;

        const relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
        const arrRel = Array.isArray(relaciones) ? relaciones : relaciones?.data || [];
        const relacionExistente = arrRel.find(
          (r) =>
            Number(r.terceroid ?? r.tercerorelacionadoid ?? r.TerceroRelacionadoID) === Number(stubTerceroId) &&
            [210, 230].includes(Number(r.tiporelacionsocioid ?? r.TipoRelacionSocioID ?? r.tiporelacionsocioId)),
        );

        if (!relacionExistente) {
          const ahoraStub = new Date().toISOString().split(".")[0];
          const unAnioMasStub = new Date();
          unAnioMasStub.setFullYear(unAnioMasStub.getFullYear() + 1);
          const rolActual = getValues("rol");
          const targetRolIdStub = rolActual === "Apoderado" ? 210 : 230;
          await tercerosService.guardarRelacionesDeSocio({
            socioid: socioIdActivo,
            tercerosrelacionados: [
              {
                sociotercerorelacionid: 0,
                socioid: socioIdActivo,
                terceroid: stubTerceroId,
                tiporelacionsocioid: targetRolIdStub,
                fechadesde: ahoraStub,
                fechahasta: unAnioMasStub.toISOString().split(".")[0],
                porcacciones: 0,
                nroinscripcion: "",
                condicionescomerciales: "",
                cbu: "",
                nrosubcuentacaja: "",
                sucursalid: 0,
                default: "0",
                subtiporelacionsocioid: 0,
                telefono: "",
                momento: ahoraStub,
              },
            ],
          });
        }
        // La relación ya quedó creada en la base en este punto (aunque
        // todavía falte completar el formulario y guardar) — se avisa ya
        // para que la lista de representantes/apoderados se refresque y lo
        // muestre, en vez de esperar a que se cierre/guarde la modal.
        if (onSuccess) onSuccess();
      } catch (stubErr) {
        // No bloqueamos la validación por esto: si falla, seguimos igual
        // (en el peor caso, el CDA va a fallar con el mismo error que ya
        // conocíamos antes de este cambio).
        console.error("[RepresentanteModal] Error creando la relación previa a validar CDA:", stubErr);
      }
    }

    const result = await ejecutarValidaciones("PANTALLA_SOCIOS", cuitLimpio, cadenaValorIdParam, usuarioWebIdActual);

    if (!result.success) {
      setCdaRechazado(true);
      setProcesoModal(prev => ({
        ...prev,
        hasError: true,
        isSystemError: result.errors.some((e) => e.isSystemError),
        pasos: prev.pasos.map(p =>
          p.id === "sgr" ? {
              ...p,
              estado: "error",
              descripcion: `Falló la validación del ${etiquetaRol.toLowerCase()}:`,
              errores: result.errors.map(e => e.message)
          } : p
        )
      }));
      setValidando(false);
      return;
    }

    setCdaRechazado(false);
    setProcesoModal({ isOpen: false, titulo: "", pasos: [], hasError: false, isSystemError: false });

    try {
      // 1. Buscar primero en la base de datos de terceros
      let terceroEncontrado = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitLimpio });
        const arr = Array.isArray(existentes) ? existentes : existentes?.data || [];
        if (arr.length > 0) {
          terceroEncontrado = arr[0];
        }
      } catch (dbErr) {
        console.warn("[RepresentanteModal] Error buscando tercero en base de datos local:", dbErr);
      }

      // Si existe en la BD y tiene los datos mínimos, los usamos directamente si no estamos editando
      const tieneDatosCompletos = terceroEncontrado && 
        (terceroEncontrado.mail || terceroEncontrado.email || terceroEncontrado.Mail);

      if (terceroEncontrado && tieneDatosCompletos && !representante && !representanteInicial) {
        const nombreRep = terceroEncontrado.denominacion || terceroEncontrado.razonsocial || terceroEncontrado.nombre || "Representante del Sistema";
        setValue("nombre", nombreRep, { shouldValidate: true, shouldDirty: true });
        setValue("email", terceroEncontrado.mail || terceroEncontrado.email || terceroEncontrado.Mail || "", { shouldValidate: true, shouldDirty: true });
        setValue("telefono", terceroEncontrado.telefono || terceroEncontrado.Telefono || "", { shouldValidate: true, shouldDirty: true });

        setAfipValidado(true);
        toast.success(`Datos del ${etiquetaRol.toLowerCase()} recuperados del sistema.`);
        setValidando(false);
        return;
      }

      // 2. Si no tiene datos completos o es modo edición, consultamos NOSIS/AFIP/LUFE
      let nosisData = null;
      let res = null;
      try {
        nosisData = await nosisService.obtenerDatosNormalizados(cuitLimpio);
      } catch (nosisErr) {
        console.warn("[RepresentanteModal] Nosis no disponible, probando fallback a AFIP:", nosisErr);
      }

      if (!nosisData) {
        try {
          res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
        } catch (afipErr) {
          console.warn("[RepresentanteModal] AFIP no disponible, probando fallback a LUFE Entidad:", afipErr);
          try {
            const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitLimpio);
            if (lufeEntidad && lufeEntidad.success) {
              res = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
            }
          } catch (lufeErr) {
            console.error("[RepresentanteModal] LUFE Entidad también falló:", lufeErr);
          }
        }
      }

      if (nosisData || (res && res.datosgenerales)) {
        let nombreRep = "";
        let emailVal = "";
        let telVal = "";

        if (nosisData) {
          nombreRep = terceroEncontrado?.denominacion || terceroEncontrado?.razonsocial || terceroEncontrado?.nombre ||
                      nosisData.VI_RazonSocial || `${nosisData.VI_Nombre || ""} ${nosisData.VI_Apellido || ""}`.trim() || "Representante";
          emailVal = (terceroEncontrado?.mail || terceroEncontrado?.email || terceroEncontrado?.Mail) || "";
          telVal = (terceroEncontrado?.telefono || terceroEncontrado?.Telefono) || "";
        } else {
          const dg = res.datosgenerales;
          nombreRep = terceroEncontrado?.denominacion || terceroEncontrado?.razonsocial || terceroEncontrado?.nombre ||
                      dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Representante AFIP";
          emailVal = (terceroEncontrado?.mail || terceroEncontrado?.email || terceroEncontrado?.Mail) || dg.email || dg.emailfacturacion || "";
          telVal = (terceroEncontrado?.telefono || terceroEncontrado?.Telefono) || dg.telefono || "";
        }

        setValue("nombre", nombreRep, { shouldValidate: true, shouldDirty: true });
        setValue("email", emailVal, { shouldValidate: true, shouldDirty: true });
        setValue("telefono", telVal, { shouldValidate: true, shouldDirty: true });

        // Se persiste YA lo que trajo AFIP/NOSIS: si el usuario cierra sin
        // guardar y vuelve más tarde, no se pierde (antes quedaba solo en
        // el formulario en memoria, y el tercero en la base seguía con
        // denominacion="" del stub). `terceroEncontrado` acá ya es el stub
        // recién creado (se buscó por el mismo CUIT más arriba). Lo que
        // falta (rol definitivo, o ediciones manuales) se guarda en
        // onConfirmSave.
        const idParaPersistir = terceroEncontrado?.tercerorelacionadoid || terceroEncontrado?.TerceroRelacionadoID || terceroEncontrado?.id;
        if (idParaPersistir && !representante && !representanteInicial) {
          try {
            await tercerosService.actualizarTercero({
              tercerorelacionadoid: idParaPersistir,
              denominacion: nombreRep,
              cuit: cuitLimpio,
              bcraid: 0,
              tipopersonaid: 1,
              tipodocumentoid: 0,
              numerodocumento: cuitLimpio,
              estadocivilid: 0,
              ciudadid: 0,
              telefono: telVal,
              conyuge: "",
              actividad: "",
              contacto: "",
              nrocuenta: "",
              codigomercado: "",
              calle: "",
              numero: 0,
              piso: "",
              departamento: "",
              codpos: "",
              descripcionreducida: nombreRep.substring(0, 20),
              mail: emailVal,
            });
            // La tarjeta ya se mostraba "sin nombre" desde que se creó el
            // stub — se refresca de nuevo para que pase a mostrar el
            // nombre real sin esperar al guardado final.
            if (onSuccess) onSuccess();
          } catch (persistErr) {
            console.warn("[RepresentanteModal] No se pudo persistir la precarga de AFIP/NOSIS:", persistErr);
          }
        }

        setAfipValidado(true);
        toast.success(representante || representanteInicial ? "Datos actualizados desde Nosis/AFIP/LUFE." : `Datos del ${etiquetaRol.toLowerCase()} recuperados.`);
      } else {
        setError("cuit", { type: "manual", message: "CUIT no encontrado en padrón de Nosis ni AFIP." });
        setAfipValidado(false);
      }
    } catch (err) {
      console.error("Error validando representante en AFIP/SGR:", err);
      toast.error("Servicio de AFIP/LUFE no disponible", {
        description: "No se pudieron obtener datos automáticos.",
      });
      setError("cuit", { type: "manual", message: "Servicios de AFIP/LUFE caídos. Intente más tarde." });
      setAfipValidado(false);
    } finally {
      setValidando(false);
    }
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isValid = await trigger();
    if (!isValid) return;

    if (cdaRechazado) {
      toast.error("No se puede guardar: no pasó la validación de Criterios de Aceptación.", {
        description: "Volvé a consultar el CUIT para reintentar la validación.",
      });
      return;
    }

    if (!isDirty) {
      onClose();
      return;
    }

    // Both direct DB save modes will show the confirmation modal
    setShowConfirm(true);
  };

  const onConfirmSave = async () => {
    const formData = getValues();
    try {
      const cuitLimpio = String(formData.cuit).replace(/\D/g, "");

      let terceroId = null;
      try {
        const existentes = await tercerosService.obtenerTerceros({
          Cuit: cuitLimpio,
        });
        const arr = Array.isArray(existentes)
          ? existentes
          : existentes?.data || [];
        if (arr.length > 0) {
          terceroId =
            arr[0].tercerorelacionadoid ||
            arr[0].TerceroRelacionadoID ||
            arr[0].id;
        }
      } catch (err) {
        console.warn(
          "[RepresentanteModal] Error buscando tercero existente:",
          err,
        );
      }

      const payloadTercero = {
        tercerorelacionadoid: terceroId || 0,
        denominacion: formData.nombre,
        cuit: cuitLimpio,
        bcraid: 0,
        tipopersonaid: 1,
        tipodocumentoid: 0,
        numerodocumento: cuitLimpio,
        estadocivilid: 0,
        ciudadid: 0,
        telefono: formData.telefono || "",
        conyuge: "",
        actividad: "",
        contacto: "",
        nrocuenta: "",
        codigomercado: "",
        calle: "",
        numero: 0,
        piso: "",
        departamento: "",
        codpos: "",
        descripcionreducida: formData.nombre.substring(0, 20),
        mail: formData.email || "",
      };

      if (terceroId) {
        await tercerosService.actualizarTercero(payloadTercero);
      } else {
        const res = await tercerosService.crearTercero(payloadTercero);
        terceroId = res.tercerorelacionadoid || res.id;
      }

      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];
      const targetRolId = formData.rol === "Apoderado" ? 210 : 230;

      // Direct Save to DB if socioIdActivo is present
      if (socioIdActivo) {
        // Check if a relationship already exists in DB for this partner and representative to avoid duplicates
        let relacionExistente = null;
        try {
          const relaciones = await tercerosService.obtenerRelacionesDeSocio(socioIdActivo);
          const arrRel = Array.isArray(relaciones) ? relaciones : relaciones?.data || [];
          relacionExistente = arrRel.find(
            (r) =>
              Number(r.terceroid || r.tercerorelacionadoid || r.TerceroRelacionadoID) === Number(terceroId) &&
              [210, 230].includes(Number(r.tiporelacionsocioid || r.TipoRelacionSocioID || r.tiporelacionsocioId))
          );
        } catch (relErr) {
          console.warn("[RepresentanteModal] Error consultando relaciones del socio:", relErr);
        }

        const activeRel = representante || (representanteInicial?.preloadedFromDb ? representanteInicial : null) || relacionExistente;

        if (activeRel?.relacionId || activeRel?.relacion?.sociotercerorelacionid || activeRel?.sociotercerorelacionid) {
          const payloadRel = {
            ...(activeRel?.relacion || activeRel),
            tiporelacionsocioid: targetRolId,
            telefono: formData.telefono || "",
            momento: ahora,
          };
          delete payloadRel.provinciaid;
          delete payloadRel.ProvinciaID;
          await tercerosService.actualizarRelacionDeSocio(payloadRel);
          toast.success(`${etiquetaRol} actualizado correctamente.`);
        } else {
          const payloadRel = {
            socioid: socioIdActivo,
            tercerosrelacionados: [
              {
                sociotercerorelacionid: 0,
                socioid: socioIdActivo,
                terceroid: terceroId,
                tiporelacionsocioid: targetRolId,
                fechadesde: ahora,
                fechahasta: unAnioMasStr,
                porcacciones: 0,
                nroinscripcion: "",
                condicionescomerciales: "",
                cbu: "",
                nrosubcuentacaja: "",
                sucursalid: 0,
                default: "0",
                subtiporelacionsocioid: 0,
                telefono: formData.telefono || "",
                momento: ahora,
              },
            ],
          };
          await tercerosService.guardarRelacionesDeSocio(payloadRel);
          toast.success(`${etiquetaRol} agregado correctamente.`);
        }
      }

      // If we are in Form Mode (Wizard), propagate to react-hook-form state
      if (onGuardar) {
        onGuardar({
          cuit: cuitLimpio,
          nombre: formData.nombre,
          rol: formData.rol,
          email: formData.email,
          celular: formData.telefono,
          preloadedFromDb: true,
        });
      }

      if (onSuccess) onSuccess();
      setShowConfirm(false);
      onClose();
    } catch (error) {
      setShowConfirm(false);
      if (error?.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          setError(key, { type: "server", message: backendErrors[key] });
        });
        toast.error("Por favor, revisá los errores en el formulario.");
      } else {
        toast.error("Ocurrió un error inesperado al guardar los datos.");
      }
    }
  };

  const opcionesRoles = [
    { value: "Representante Legal", label: "Representante Legal" },
    { value: "Apoderado", label: "Apoderado" },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={representante || representanteInicial ? `Editar ${etiquetaRol}` : `Agregar ${etiquetaRol}`}
        maxWidth="600px"
        variant={isAdmin ? "blue" : "default"}
      >
        <form onSubmit={handlePreSubmit} className={styles.modalForm}>
          {!afipValidado && !representante && !representanteInicial ? (
            <div className={styles.cuitSearchStep}>
              <div className={`${styles.cuitSearchBanner} ${isAdmin ? styles.cuitSearchBannerAdmin : ""}`}>
                <div className={`${styles.cuitSearchBannerIcon} ${isAdmin ? styles.cuitSearchBannerIconAdmin : ""}`}>
                  <FiShield />
                </div>
                <div className={styles.cuitSearchBannerText}>
                  <p className={styles.cuitSearchBannerTitle}>Validación segura con AFIP</p>
                  <p className={styles.cuitSearchBannerSub}>Ingresá el CUIT para autocompletar los datos del {etiquetaRol.toLowerCase()}</p>
                </div>
              </div>
              <div className={styles.cuitSearchInputWrapper}>
                <BuscadorCuit
                  name="cuit"
                  control={control}
                  label={`CUIT del ${etiquetaRol.toLowerCase()}`}
                  onValidar={handleAfipLookup}
                  error={errors.cuit?.message}
                  esValido={String(cuitValue || "").replace(/\D/g, "").length === 11}
                  buttonText="VALIDAR CUIT"
                  isLoading={validando}
                />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <div className={styles.summaryLeft}>
                    <span className={styles.summaryStatus}>
                      {enriqueciendoAuto ? (
                        <>
                          <Spinner size={10} style={{ marginRight: "0.25rem", display: "inline-block", verticalAlign: "middle" }} />
                          Enriqueciendo datos...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={11} /> {etiquetaRol} validado con AFIP
                        </>
                      )}
                    </span>
                    <h2 className={styles.summaryName}>{nombreValue || etiquetaRol}</h2>
                    <p className={styles.summaryCuit}>CUIT: {cuitValue}</p>
                    {representante || representanteInicial ? (
                      <button
                        type="button"
                        className={styles.editLink}
                        onClick={handleAfipLookup}
                        disabled={validando || enriqueciendoAuto}
                      >
                        <FiEdit2 size={12} /> {validando ? "Buscando..." : "Consultar AFIP"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={styles.editLink}
                        onClick={() => setAfipValidado(false)}
                      >
                        <FiEdit2 size={12} /> Cambiar CUIT
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalRow}>
                <Controller
                  name="nombre"
                  control={control}
                  rules={{ required: "El nombre es obligatorio" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("nombre", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Nombre Completo"
                      icon={<FiUser />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow2}>
                <Controller
                  name="rol"
                  control={control}
                  rules={{ required: "El rol es obligatorio" }}
                  render={({ fieldState }) => (
                    <SelectSocio
                      control={control}
                      name="rol"
                      label="Rol / Tipo Relación"
                      icon={<FiUser />}
                      options={opcionesRoles}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "El email es obligatorio",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido",
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("email", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Correo Electrónico"
                      icon={<FiMail />}
                      error={fieldState.error?.message}
                      tooltip="Email personal del representante. Se utilizará para el envío y firma digital de contratos y documentos legales."
                    />
                  )}
                />
              </div>

              <div className={styles.modalRow2}>
                <Controller
                  name="telefono"
                  control={control}
                  rules={{ required: "El teléfono es obligatorio" }}
                  render={({ field, fieldState }) => (
                    <InputSocioMasked
                      value={field.value}
                      onChange={(val) => setValue("telefono", val, { shouldDirty: true, shouldValidate: true })}
                      onBlur={field.onBlur}
                      label="Celular / Teléfono (Sin 0 ni 15)"
                      mask={[{ mask: "00 0000-0000" }, { mask: "000 000-0000" }]}
                      icon={<FiPhone />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </>
          )}

          <div className={styles.modalFooter}>
            {(afipValidado || representante || representanteInicial) && (
              <Button type="submit" variant={isAdmin ? "blue" : "primary"}>
                {representante || representanteInicial ? "Guardar Cambios" : `Agregar ${etiquetaRol}`}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        titulo={representante || representanteInicial ? `Actualizar ${etiquetaRol}` : `Agregar ${etiquetaRol}`}
        mensaje={representante || representanteInicial ? "¿Estás seguro de que deseas guardar los cambios?" : `¿Estás seguro de que deseas agregar este ${etiquetaRol.toLowerCase()}?`}
      />

      <ProcesamientoModal
        isOpen={procesoModal.isOpen}
        onClose={() => setProcesoModal(prev => ({ ...prev, isOpen: false }))}
        titulo={procesoModal.titulo}
        pasos={procesoModal.pasos}
        hasError={procesoModal.hasError}
        isSystemError={procesoModal.isSystemError}
        onRetry={handleAfipLookup}
      />
    </>
  );
}
