import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { FiFileText } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { SelectSimple } from "../../../ui/SelectSimple/SelectSimple";
import { useTipoDocumentoArchivoReal } from "../../../../hooks/useCatalogos";
import {
  useCrearTipoDocumentoArchivo,
  useActualizarTipoDocumentoArchivo,
} from "../../../../hooks/useTipoDocumentoArchivo";
import { mensajeNegocio } from "../../../../utils/mensajesError";
import { IDS_DOCUMENTO_SOPORTADOS } from "../../../../constants/tiposDocumentoArchivo";
import styles from "./TipoDocumentoArchivoModal.module.css";

const IDS_SOPORTADOS = new Set(IDS_DOCUMENTO_SOPORTADOS.map(String));
const LARGO_MAXIMO_DESCRIPCION = 50;

export const TipoDocumentoArchivoModal = ({ isOpen, onClose, itemEditar, idsActivos = [] }) => {
  const esEdicion = !!itemEditar;

  const [tipoDocumentoId, setTipoDocumentoId] = useState(() =>
    itemEditar ? String(itemEditar.tipodocumentoarchivoid) : "",
  );
  const [descripcion, setDescripcion] = useState(() => itemEditar?.descripcion || "");

  const { data: catalogoReal, isLoading: isLoadingCatalogo } = useTipoDocumentoArchivoReal();

  const idsActivosSet = useMemo(() => new Set(idsActivos.map((id) => String(id))), [idsActivos]);

  const opcionesCatalogo = useMemo(() => {
    const opciones = (catalogoReal?.opciones || []).map((o) => ({
      ...o,
      label: `#${o.value} · ${o.label}`,
      descripcion: o.label,
    }));
    if (esEdicion) return opciones;
    return opciones.filter((o) => IDS_SOPORTADOS.has(String(o.value)) && !idsActivosSet.has(String(o.value)));
  }, [catalogoReal, esEdicion, idsActivosSet]);

  const { mutate: crear, isPending: isCreando } = useCrearTipoDocumentoArchivo();
  const { mutate: actualizar, isPending: isActualizando } = useActualizarTipoDocumentoArchivo();
  const isGuardando = isCreando || isActualizando;

  const puedeGuardar = descripcion.trim().length > 0 && (esEdicion || !!tipoDocumentoId);

  const handleGuardar = () => {
    if (!puedeGuardar) return;

    const payload = {
      tipodocumentoarchivoid: esEdicion ? itemEditar.tipodocumentoarchivoid : Number(tipoDocumentoId),
      descripcion: descripcion.trim(),
    };

    const onSuccess = () => {
      toast.success(esEdicion ? "Documento actualizado correctamente" : "Documento habilitado correctamente");
      onClose();
    };
    const onError = (error) => {
      toast.error("Ocurrió un error al guardar el documento", { description: mensajeNegocio(error, "") });
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
      title={esEdicion ? "Editar documento" : "Habilitar documento"}
      subtitle={
        esEdicion
          ? "Solo se puede modificar el nombre que ve la web. El ID del catálogo no cambia."
          : "Elegí un tipo de documento del catálogo real de SGR+ y escribí cómo se va a mostrar en la web."
      }
      icono={<FiFileText />}
      maxWidth="520px"
      variant="blue"
      preventClose={isGuardando}
      footer={
        <>
          <Button variant="adminNeutro" onClick={onClose} disabled={isGuardando}>
            Cancelar
          </Button>
          <Button
            variant="blue"
            onClick={handleGuardar}
            isLoading={isGuardando}
            disabled={isGuardando || !puedeGuardar}
          >
            {esEdicion ? "Guardar" : "Habilitar"}
          </Button>
        </>
      }
    >
      <div className={styles.campos}>
        {esEdicion ? (
          <InputSimple label="Tipo de documento del catálogo (ID)" value={`#${itemEditar.tipodocumentoarchivoid}`} disabled />
        ) : (
          <SelectSimple
            label="Tipo de documento del catálogo real de SGR+"
            value={tipoDocumentoId}
            onChange={(value) => {
              setTipoDocumentoId(value);
              const opcion = opcionesCatalogo.find((o) => String(o.value) === String(value));
              if (opcion && !descripcion.trim()) setDescripcion(opcion.descripcion.slice(0, LARGO_MAXIMO_DESCRIPCION));
            }}
            options={opcionesCatalogo}
            isSearchable
            disabled={isLoadingCatalogo}
            placeholder={
              isLoadingCatalogo
                ? "Cargando catálogo..."
                : opcionesCatalogo.length === 0
                  ? "Todos los documentos ya están activados"
                  : "Seleccioná un documento..."
            }
            variant="admin"
          />
        )}

        <InputSimple
          label={`Nombre para la web (${descripcion.length}/${LARGO_MAXIMO_DESCRIPCION})`}
          value={descripcion}
          onChange={setDescripcion}
          maxLength={LARGO_MAXIMO_DESCRIPCION}
          variant="admin"
        />
      </div>
    </Modal>
  );
};

export default TipoDocumentoArchivoModal;
