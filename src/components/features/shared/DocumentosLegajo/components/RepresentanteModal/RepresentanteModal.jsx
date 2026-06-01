import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FiCheckCircle, FiEdit2, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { toast } from "sonner";
import { Button, Modal, SelectSocio, InputSocioMasked, BuscadorCuit } from "../../../../../ui";
import { afipService } from "../../../../../../services/afipService";
import { sociosService } from "../../../../../../services/sociosService";
import { ConfirmacionModal } from "../../../ConfirmacionModal/ConfirmacionModal";
import { tercerosService } from "../../../../../../services/tercerosService";
import styles from "./RepresentanteModal.module.css";

export function RepresentanteModal({ isOpen, onClose, onSuccess, representante, socioIdActivo }) {
  const [validando, setValidando] = useState(false);
  const [afipValidado, setAfipValidado] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, reset, setValue, watch, setError, clearErrors, trigger, getValues, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      cuit: "",
      nombre: "",
      rol: "Representante Legal",
      email: "",
      telefono: "",
    }
  });

  const cuitValue = watch("cuit");

  useEffect(() => {
    if (errors.cuit?.type === "manual") {
      clearErrors("cuit");
    }
  }, [cuitValue, clearErrors, errors.cuit]);

  useEffect(() => {
    if (isOpen) {
      if (representante) {
        reset({
          cuit: representante.cuit,
          nombre: representante.nombre,
          rol: representante.rolId === 230 ? "Representante Legal" : "Apoderado",
          email: representante.email,
          telefono: representante.telefono,
        });
        setAfipValidado(true);
      } else {
        reset({
          cuit: "",
          nombre: "",
          rol: "Representante Legal",
          email: "",
          telefono: "",
        });
        setAfipValidado(false);
      }
      setShowConfirm(false);
    }
  }, [isOpen, representante, reset]);

  const handleAfipLookup = async () => {
    const cuitLimpio = String(cuitValue || "").replace(/\D/g, "");
    if (!cuitLimpio || cuitLimpio.length !== 11) {
      setError("cuit", { type: "manual", message: "Por favor, ingrese un CUIT de 11 dígitos válido." });
      return;
    }
    setValidando(true);
    clearErrors("cuit");
    try {
      const respSgr = await sociosService.obtenerSocios({ Cuit: cuitLimpio, page: 1, page_size: 10 });
      const socioSgrDb = Array.isArray(respSgr) ? respSgr[0] : respSgr?.items?.[0] || respSgr?.data?.[0];

      if (socioSgrDb) {
        setError("cuit", { type: "manual", message: "Esta empresa ya se encuentra en gestión por SGR+" });
        return;
      }

      const res = await afipService.obtenerConstanciaInscripcion(cuitLimpio);
      if (res && res.datosgenerales) {
        const dg = res.datosgenerales;
        const nombreRep = dg.razonsocial || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Representante AFIP";
        setValue("nombre", nombreRep, { shouldValidate: true, shouldDirty: true });
        
        if (dg.email || dg.emailfacturacion) {
          setValue("email", dg.email || dg.emailfacturacion, { shouldValidate: true, shouldDirty: true });
        }
        if (dg.telefono) {
          setValue("telefono", dg.telefono, { shouldValidate: true, shouldDirty: true });
        }

        setAfipValidado(true);
      } else {
        toast.warning("CUIT no encontrado en AFIP", {
          description: "No se encontraron datos automáticos. Podés ingresarlos manualmente.",
        });
        setValue("nombre", "");
        setAfipValidado(true);
      }
    } catch (err) {
      console.error("Error validando representante en AFIP/SGR:", err);
      toast.warning("Servicio de AFIP no disponible", {
        description: "No se pudieron obtener datos automáticos. Podés ingresarlos manualmente.",
      });
      setValue("nombre", "");
      setAfipValidado(true);
    } finally {
      setValidando(false);
    }
  };

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isValid = await trigger();
    if (!isValid) return;

    if (!isDirty) {
      onClose();
      return;
    }

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
          "[MODAL - REPRESENTANTE] Error buscando tercero existente:",
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

      if (representante?.relacionId) {
        const payloadRel = {
          ...representante?.relacion,
          tiporelacionsocioid: targetRolId,
          telefono: formData.telefono || "",
          momento: ahora,
        };
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
        toast.success("Representante actualizado correctamente.");
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
              provinciaid: 0,
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
        toast.success("Representante agregado correctamente.");
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
        title={representante ? "Editar Representante" : "Agregar Representante"}
        maxWidth="600px"
      >
        <form onSubmit={handlePreSubmit} className={styles.modalForm}>
          {!afipValidado && !representante ? (
            <div className={styles.cuitSearchStep}>
              <div className={styles.cuitSearchBanner}>
                <div className={styles.cuitSearchBannerIcon}>
                  <svg width="1rem" height="1rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className={styles.cuitSearchBannerText}>
                  <p className={styles.cuitSearchBannerTitle}>Validación segura con AFIP</p>
                  <p className={styles.cuitSearchBannerSub}>Ingresá el CUIT para autocompletar los datos del representante</p>
                </div>
              </div>
              <div className={styles.cuitSearchInputWrapper}>
                <BuscadorCuit
                  name="cuit"
                  control={control}
                  label="CUIT del representante"
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
                      <FiCheckCircle size={11} /> Representante validado con AFIP
                    </span>
                    <h2 className={styles.summaryName}>{watch("nombre") || "Representante"}</h2>
                    <p className={styles.summaryCuit}>CUIT: {cuitValue}</p>
                    {!representante && (
                      <button
                        type="button"
                        className={styles.editLink}
                        onClick={() => setAfipValidado(false)}
                        style={{ position: "absolute", top: "0.75rem", right: "0.75rem" }}
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
                      label="Celular / Teléfono"
                      icon={<FiPhone />}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </>
          )}

          <div className={styles.modalFooter}>
            {(afipValidado || representante) && (
              <Button type="submit" variant="primary">
                {representante ? "Guardar Cambios" : "Agregar Representante"}
              </Button>
            )}
          </div>
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        titulo={representante ? "Actualizar Representante" : "Agregar Representante"}
        mensaje={representante ? "¿Estás seguro de que deseas guardar los cambios?" : "¿Estás seguro de que deseas agregar este representante?"}
      />
    </>
  );
}
