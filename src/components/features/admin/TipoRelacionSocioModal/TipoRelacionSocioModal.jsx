import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import styles from "./TipoRelacionSocioModal.module.css";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { SelectSimple } from "../../../ui/SelectSimple/SelectSimple";
import { useTipoRelacionSocioReal } from "../../../../hooks/useCatalogos";
import {
  useCrearTipoRelacionSocio,
  useActualizarTipoRelacionSocio,
} from "../../../../hooks/useTipoRelacionSocio";

// Alta y edición de una relación curada (api/TipoRelacionSocio): en alta se
// elige un ID todavía no activado del catálogo real de SGR+ y se le escribe
// la Descripcion que va a usar la web; en edición el ID queda fijo (nunca se
// reasigna) y solo se puede tocar la Descripcion.
export const TipoRelacionSocioModal = ({
  isOpen,
  onClose,
  itemEditar,
  idsActivos = [],
}) => {
  const esEdicion = !!itemEditar;

  const [tipoRelacionSocioId, setTipoRelacionSocioId] = useState("");
  const [descripcion, setDescripcion] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTipoRelacionSocioId(
      itemEditar ? String(itemEditar.tiporelacionsocioid) : "",
    );
    setDescripcion(itemEditar?.descripcion || "");
  }, [isOpen, itemEditar]);

  const { data: catalogoReal, isLoading: isLoadingCatalogo } =
    useTipoRelacionSocioReal();

  const idsActivosSet = useMemo(
    () => new Set(idsActivos.map((id) => String(id))),
    [idsActivos],
  );

  const opcionesCatalogo = useMemo(() => {
    const opciones = catalogoReal?.opciones || [];
    if (esEdicion) return opciones;
    return opciones.filter((o) => !idsActivosSet.has(String(o.value)));
  }, [catalogoReal, esEdicion, idsActivosSet]);

  const { mutate: crear, isPending: isCreando } = useCrearTipoRelacionSocio();
  const { mutate: actualizar, isPending: isActualizando } =
    useActualizarTipoRelacionSocio();
  const isGuardando = isCreando || isActualizando;

  const puedeGuardar =
    descripcion.trim().length > 0 && (esEdicion || !!tipoRelacionSocioId);

  const handleGuardar = () => {
    if (!puedeGuardar) return;

    const payload = {
      tiporelacionsocioid: esEdicion
        ? itemEditar.tiporelacionsocioid
        : Number(tipoRelacionSocioId),
      descripcion: descripcion.trim(),
    };

    const onSuccess = () => {
      toast.success(
        esEdicion
          ? "Relación actualizada correctamente"
          : "Relación activada correctamente",
      );
      onClose();
    };
    const onError = (error) => {
      console.error("[TipoRelacionSocioModal] Error al guardar:", error);
      toast.error("Ocurrió un error al guardar la relación");
    };

    if (esEdicion) {
      actualizar(payload, { onSuccess, onError });
    } else {
      crear(payload, { onSuccess, onError });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? "Editar relación de terceros" : "Agregar relación de terceros"}
      subtitle={
        esEdicion
          ? "Solo se puede modificar la descripción que ve la web. El ID del catálogo no cambia."
          : "Elegí un vínculo del catálogo real de SGR+ y escribí cómo se va a mostrar en la web."
      }
      maxWidth="480px"
      variant="blue"
      preventClose={isGuardando}
      footer={
        <>
          <Button
            variant="outlineBlue"
            size="sm"
            onClick={onClose}
            disabled={isGuardando}
          >
            CANCELAR
          </Button>
          <Button
            variant="blue"
            size="sm"
            onClick={handleGuardar}
            isLoading={isGuardando}
            disabled={isGuardando || !puedeGuardar}
          >
            GUARDAR
          </Button>
        </>
      }
    >
      <div className={styles.campos}>
        {esEdicion ? (
          <InputSimple
            label="Vínculo del catálogo (ID)"
            value={`#${itemEditar.tiporelacionsocioid}`}
            disabled
          />
        ) : (
          <SelectSimple
            label="Vínculo del catálogo real de SGR+"
            value={tipoRelacionSocioId}
            onChange={(value) => {
              setTipoRelacionSocioId(value);
              const opcion = opcionesCatalogo.find((o) => String(o.value) === String(value));
              if (opcion && !descripcion.trim()) setDescripcion(opcion.label);
            }}
            options={opcionesCatalogo}
            isSearchable
            disabled={isLoadingCatalogo}
            placeholder={isLoadingCatalogo ? "Cargando catálogo..." : "Seleccioná un vínculo..."}
            variant="admin"
          />
        )}

        <InputSimple
          label="Descripción para la web"
          value={descripcion}
          onChange={setDescripcion}
          variant="admin"
        />
      </div>
    </Modal>
  );
};

export default TipoRelacionSocioModal;
