import React, { useState, useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { FiBriefcase, FiCreditCard } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../../../../ui/Button/Button";
import { Modal } from "../../../../../ui/Modal/Modal";
import { SelectSocio } from "../../../../../ui/SelectSocio/SelectSocio";
import { InputSocioMasked } from "../../../../../ui/InputSocioMasked/InputSocioMasked";
import { useObtenerTerceros } from "../../../../../../hooks/useTerceros";
import { useRegistrarModalLegajo } from "../../../../../../hooks/useRegistrarModalLegajo";
import { tercerosService } from "../../../../../../services/tercerosService";
import { RELACION_AGENTE_BOLSA_ID } from "../../../../../../constants/tiposRelacionSocio";
import { mensajeNegocio } from "../../../../../../utils/mensajesError";
import { ConfirmacionModal } from "../../../ConfirmacionModal/ConfirmacionModal";
import { useDocumentosEnModal, MODO_PESTANAS, MODO_SOLO_DNI } from "../DocumentacionTercero/useDocumentosEnModal";
import {
  AvisoDocumentacionPie,
  DocumentosTerceroPanel,
  PestanasTercero,
} from "../DocumentacionTercero/DocumentosTerceroPanel";
import { propsConfirmacionSinDocumentacion } from "../DocumentacionTercero/confirmacionDocumentacion";
import styles from "./BolsaModal.module.css";

export function BolsaModal({ isOpen, onClose, onSuccess, agenteBolsa, socioIdActivo }) {
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");
  const [showConfirm, setShowConfirm] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  useRegistrarModalLegajo(isOpen);

  const [pestana, setPestana] = useState("datos");
  const [erroresDocumentos, setErroresDocumentos] = useState([]);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setShowConfirm(false);
      setPestana("datos");
      setErroresDocumentos([]);
    }
  }
  const { data: agentesData, isLoading: cargandoAgentes } = useObtenerTerceros({
    TipoTerceroRelacionadoID: 8,
  });

  const { control, setValue, reset, trigger, getValues, formState: { isDirty } } = useForm({
    defaultValues: {
      sociedadBolsa: "",
      numeroCuentaBolsa: "",
    }
  });

  // Documentación del agente (ver useDocumentosEnModal): la persona es la
  // sociedad de bolsa elegida, identificada por su CUIT.
  const rawAgentes = agentesData?.items || agentesData?.data || agentesData || [];
  const sociedadElegida = useWatch({ control, name: "sociedadBolsa" });
  const agenteElegido = Array.isArray(rawAgentes)
    ? rawAgentes.find((a) => String(a.tercerorelacionadoid || a.id) === String(sociedadElegida))
    : null;
  const personaDocumentos = {
    cuit: agenteBolsa?.cuit || agenteElegido?.cuit || "",
    nombre: agenteBolsa?.nombre || agenteElegido?.denominacion || "",
  };
  const documentos = useDocumentosEnModal({
    tipoRelacionSocioId: RELACION_AGENTE_BOLSA_ID,
    persona: personaDocumentos,
    isOpen,
  });
  const conPestanas = documentos.modo === MODO_PESTANAS;
  const elegirDocumento = (clave, archivo) => {
    documentos.elegir(clave, archivo);
    setErroresDocumentos((prev) => prev.filter((c) => c !== clave));
  };

  useEffect(() => {
    if (isOpen) {
      if (agenteBolsa) {
        reset({
          sociedadBolsa: String(agenteBolsa.id),
          numeroCuentaBolsa: agenteBolsa.nrosubcuentacaja,
        });
      } else {
        reset({
          sociedadBolsa: "",
          numeroCuentaBolsa: "",
        });
      }
    }
  }, [isOpen, agenteBolsa, reset]);

  const handlePreSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isValid = await trigger();
    if (!isValid) {
      setPestana("datos");
      return;
    }

    // Solo DNI: es parte del formulario y se pide para guardar (como en
    // Accionistas). Con pestañas, lo que falte se avisa en la confirmación.
    if (documentos.modo === MODO_SOLO_DNI) {
      const faltan = documentos.items
        .filter((i) => i.requerimiento === 1 && !i.archivo && !i.local)
        .map((i) => i.clave);
      if (faltan.length > 0) {
        setErroresDocumentos(faltan);
        return;
      }
    }

    if (!isDirty && !documentos.hayCambios) {
      onClose();
      return;
    }

    setShowConfirm(true);
  };

  const onConfirmSave = async () => {
    const formData = getValues();
    try {
      const ahora = new Date().toISOString().split(".")[0];
      const unAnioMas = new Date();
      unAnioMas.setFullYear(unAnioMas.getFullYear() + 1);
      const unAnioMasStr = unAnioMas.toISOString().split(".")[0];

      if (agenteBolsa?.relacionId) {
        const payloadRel = {
          ...agenteBolsa?.relacion,
          nrosubcuentacaja: String(formData.numeroCuentaBolsa),
          momento: ahora,
        };
        delete payloadRel.provinciaid;
        delete payloadRel.ProvinciaID;
        await tercerosService.actualizarRelacionDeSocio(payloadRel);
        toast.success("Cuenta comitente actualizada correctamente.");
      } else {
        const payloadRel = {
          socioid: socioIdActivo,
          tercerosrelacionados: [
            {
              sociotercerorelacionid: 0,
              socioid: socioIdActivo,
              terceroid: Number(formData.sociedadBolsa),
              tiporelacionsocioid: RELACION_AGENTE_BOLSA_ID,
              fechadesde: ahora,
              fechahasta: unAnioMasStr,
              porcacciones: 0,
              nroinscripcion: "",
              condicionescomerciales: "",
              cbu: "",
              nrosubcuentacaja: String(formData.numeroCuentaBolsa),
              sucursalid: 0,
              default: "1",
              subtiporelacionsocioid: 0,
              telefono: "",
              momento: ahora,
            },
          ],
        };
        await tercerosService.guardarRelacionesDeSocio(payloadRel);
        toast.success("Agente de bolsa vinculado exitosamente.");
      }

      if (documentos.hayCambios && socioIdActivo) {
        try {
          await documentos.subirPendientes({ socioIdActivo, persona: personaDocumentos });
        } catch (docErr) {
          toast.error("Los datos se guardaron, pero no se pudo subir la documentación.", {
            description: docErr?.esValidacionArchivo
              ? docErr.message
              : mensajeNegocio(docErr, "Volvé a intentarlo desde Editar."),
          });
        }
      }

      if (onSuccess) onSuccess();
      setShowConfirm(false);
      onClose();
    } catch (error) {
      setShowConfirm(false);
      if (error?.response?.status === 400 && error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          toast.error(backendErrors[key]);
        });
      } else {
        toast.error(mensajeNegocio(error, "Ocurrió un error inesperado al guardar los datos."));
      }
    }
  };

  const opcionesAgentes = Array.isArray(rawAgentes)
    ? rawAgentes.map((a) => ({
        value: String(a.tercerorelacionadoid || a.id),
        label: a.denominacion || a.Denominacion || a.razonsocial || a.nombre || "Sociedad de Bolsa",
      }))
    : [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={agenteBolsa ? "Editar Agente de Bolsa" : "Vincular Agente de Bolsa"}
        maxWidth={conPestanas ? "720px" : "500px"}
        variant={isAdmin ? "blue" : "default"}
        headerExtra={
          conPestanas ? (
            <PestanasTercero
              activa={pestana}
              onCambiar={setPestana}
              cargados={documentos.cargados}
              total={documentos.total}
              faltan={documentos.faltantes.length > 0}
            />
          ) : null
        }
        footer={
          <>
            {conPestanas && pestana === "datos" && documentos.faltantes.length > 0 && (
              <AvisoDocumentacionPie
                cantidad={documentos.faltantes.length}
                onClick={() => setPestana("documentacion")}
              />
            )}
            <Button type="button" variant={isAdmin ? "outlineBlue" : "outline"} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="bolsa-form" variant={isAdmin ? "blue" : "primary"} disabled={cargandoAgentes}>
              {agenteBolsa ? "Guardar cambios" : "Vincular agente"}
            </Button>
          </>
        }
      >
        <form id="bolsa-form" onSubmit={handlePreSubmit} className={styles.modalForm}>
          <div style={{ display: conPestanas && pestana !== "datos" ? "none" : "flex", flexDirection: "column", gap: "1rem" }}>
            <Controller
              name="sociedadBolsa"
              control={control}
              rules={{ required: "La sociedad de bolsa es obligatoria" }}
              render={({ fieldState }) => (
                <SelectSocio
                  control={control}
                  name="sociedadBolsa"
                  label={cargandoAgentes ? "Cargando sociedades..." : "Sociedad de Bolsa"}
                  icon={<FiBriefcase />}
                  options={opcionesAgentes}
                  disabled={cargandoAgentes || !!agenteBolsa}
                  isLoading={cargandoAgentes}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="numeroCuentaBolsa"
              control={control}
              rules={{ required: "El número de cuenta es obligatorio" }}
              render={({ field, fieldState }) => (
                <InputSocioMasked
                  value={field.value}
                  onChange={(val) => setValue("numeroCuentaBolsa", val, { shouldDirty: true, shouldValidate: true })}
                  onBlur={field.onBlur}
                  label="Número de Cuenta Comitente"
                  icon={<FiCreditCard />}
                  error={fieldState.error?.message}
                />
              )}
            />
            {documentos.modo === MODO_SOLO_DNI && (
              <DocumentosTerceroPanel
                items={documentos.items}
                onElegir={elegirDocumento}
                errores={erroresDocumentos}
                isAdmin={isAdmin}
                idBase="doc-agente"
              />
            )}
          </div>
          {conPestanas && pestana === "documentacion" && (
            <DocumentosTerceroPanel
              items={documentos.items}
              onElegir={elegirDocumento}
              conAvance
              isAdmin={isAdmin}
              idBase="doc-agente"
            />
          )}
        </form>
      </Modal>

      <ConfirmacionModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirmSave}
        variant={isAdmin ? "blue" : "default"}
        {...(conPestanas && documentos.faltantes.length > 0
          ? propsConfirmacionSinDocumentacion({
              faltantes: documentos.faltantes,
              onCargarAhora: () => {
                setShowConfirm(false);
                setPestana("documentacion");
              },
            })
          : {
              titulo: agenteBolsa ? "Actualizar Agente" : "Vincular Agente",
              mensaje: agenteBolsa ? "¿Estás seguro de que deseas guardar los cambios?" : "¿Estás seguro de que deseas vincular este agente de bolsa?",
            })}
      />
    </>
  );
}
