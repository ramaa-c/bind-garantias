import React, { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { toast } from "sonner";

import { useTiposProducto, useObligaciones } from "../../hooks/useCatalogos";
import {
  useObtenerProductosPorLimite,
  useAsociarProductoLimite,
  useActualizarProductoLimite,
} from "../../hooks/useLinea";

import {
  Modal,
  Button,
  Spinner,
  InputSimple,
  SelectSimple,
} from "../../components/ui";
import { CadenaSelectCard } from "../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import styles from "./LineasProductos.module.css";

// --- CHILD COMPONENT: SKELETON CARD ---
const LineaSkeletonCard = () => {
  return (
    <div className={styles.lineaCard}>
      <div className={styles.cardHeader} style={{ padding: "0.75rem 1rem" }}>
        <div className={styles.headerTitleWrapper}>
          <div
            className={styles.skeletonBlock}
            style={{ height: "0.95rem", width: "140px" }}
          ></div>
          <div
            className={styles.skeletonBlock}
            style={{ height: "0.7rem", width: "80px" }}
          ></div>
        </div>
        <div className={styles.headerActions}>
          <div
            className={styles.skeletonBlock}
            style={{ height: "26px", width: "26px", borderRadius: "0.375rem" }}
          ></div>
        </div>
      </div>
      <div
        className={styles.cardBody}
        style={{
          padding: "0.75rem 1rem",
          gap: "0.75rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className={styles.detailItem} style={{ gap: "0.15rem" }}>
          <div
            className={styles.skeletonBlock}
            style={{ height: "0.65rem", width: "90px" }}
          ></div>
          <div
            className={styles.skeletonBlock}
            style={{ height: "0.85rem", width: "120px" }}
          ></div>
        </div>
        <div className={styles.detailItem} style={{ gap: "0.15rem" }}>
          <div
            className={styles.skeletonBlock}
            style={{ height: "0.65rem", width: "70px" }}
          ></div>
          <div
            className={styles.skeletonBlock}
            style={{ height: "0.85rem", width: "40px" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// --- CHILD COMPONENT: PRODUCTO CARD ---
const ProductoCard = ({ producto, allObligaciones, onEdit }) => {
  let productoNombreOriginal = "Desconocido";
  if (producto && allObligaciones) {
    const matched = allObligaciones.find(
      (o) => String(o.value) === String(producto.tipoobligacionid),
    );
    if (matched) productoNombreOriginal = matched.label;
  }

  return (
    <div className={styles.lineaCard}>
      <div className={styles.cardHeader} style={{ padding: "0.75rem 1rem" }}>
        <div className={styles.headerTitleWrapper}>
          <h3
            className={`${styles.cardTitle} ${styles.cardTitleBlue}`}
            style={{ fontSize: "0.95rem" }}
          >
            {producto.descripcion || productoNombreOriginal}
          </h3>
          <span className={styles.cardSubtitle} style={{ fontSize: "0.7rem" }}>
            ID Vinculación #{producto.tipoobligaciontipolimiteid}
          </span>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.iconBtnAction}
            style={{ padding: "0.4rem" }}
            onClick={() => onEdit(producto)}
          >
            <FiEdit size={14} />
          </button>
        </div>
      </div>

      <div
        className={styles.cardBody}
        style={{
          padding: "0.75rem 1rem",
          gap: "0.75rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className={styles.detailItem} style={{ gap: "0.15rem" }}>
          <span className={styles.detailLabel} style={{ fontSize: "0.65rem" }}>
            TIPO DE PRODUCTO
          </span>
          <span className={styles.detailValue} style={{ fontSize: "0.85rem" }}>
            {productoNombreOriginal}
          </span>
        </div>
        <div className={styles.detailItem} style={{ gap: "0.15rem" }}>
          <span className={styles.detailLabel} style={{ fontSize: "0.65rem" }}>
            ID OBLIGACIÓN
          </span>
          <span className={styles.detailValue} style={{ fontSize: "0.85rem" }}>
            #{producto.tipoobligacionid}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: CONFIG MODAL INNER ---
const ConfigModalInner = ({
  activeProducto,
  tipoLimiteId,
  allObligaciones,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    tipoobligacionid: activeProducto?.tipoobligacionid
      ? String(activeProducto.tipoobligacionid)
      : "",
    tipoobligaciontipolimiteid: activeProducto?.tipoobligaciontipolimiteid || 0,
    descripcionProducto: activeProducto?.descripcion || "",
  });

  const asociarMutation = useAsociarProductoLimite();
  const actualizarProductoMutation = useActualizarProductoLimite();

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();

    if (!formData.tipoobligacionid) {
      toast.warning("Por favor selecciona un producto financiero");
      return;
    }

    const payload = {
      tipoobligaciontipolimiteid: formData.tipoobligaciontipolimiteid || 0,
      tipoobligacionid: Number(formData.tipoobligacionid),
      tipolimiteid: Number(tipoLimiteId),
      descripcion: formData.descripcionProducto || "",
    };

    if (formData.tipoobligaciontipolimiteid) {
      actualizarProductoMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Producto actualizado correctamente");
          onClose();
        },
        onError: (err) => {
          toast.error("Error al actualizar el producto: " + err.message);
        },
      });
    } else {
      asociarMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Producto asociado correctamente");
          onClose();
        },
        onError: (err) => {
          toast.error("Error al asociar el producto: " + err.message);
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmitForm} style={{ padding: "0.5rem 0" }}>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {(asociarMutation.isPending ||
          actualizarProductoMutation.isPending) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(13, 17, 23, 0.7)",
              zIndex: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: "0.5rem",
              backdropFilter: "blur(2px)",
            }}
          >
            <Spinner size={50} />
          </div>
        )}

        <div
          style={{
            background: "rgba(76, 101, 230, 0.1)",
            border: "1px solid rgba(76, 101, 230, 0.2)",
            padding: "1rem",
            borderRadius: "0.5rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.85rem",
              color: "#a5b4fc",
              lineHeight: "1.5",
            }}
          >
            Seleccioná un producto base del catálogo del banco y asignale un
            nombre para identificarlo fácilmente dentro de esta línea.
          </p>
        </div>

        <div>
          <SelectSimple
            label="Producto Base *"
            options={allObligaciones}
            value={formData.tipoobligacionid}
            onChange={(val) => {
              handleInputChange("tipoobligacionid", val);
              const matchedOption = allObligaciones.find(
                (o) => o.value === val,
              );
              if (matchedOption && !formData.descripcionProducto) {
                handleInputChange("descripcionProducto", matchedOption.label);
              }
            }}
          />
        </div>

        <div>
          <InputSimple
            label="Nombre Comercial *"
            value={formData.descripcionProducto}
            onChange={(val) => handleInputChange("descripcionProducto", val)}
          />
        </div>

        <div
          className={styles.modalFooter}
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "1rem",
            marginTop: "1rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <Button
            type="button"
            variant="outlineBlue"
            onClick={onClose}
            disabled={
              asociarMutation.isPending || actualizarProductoMutation.isPending
            }
          >
            CANCELAR
          </Button>
          <Button
            type="submit"
            variant="blue"
            disabled={
              asociarMutation.isPending || actualizarProductoMutation.isPending
            }
          >
            {formData.tipoobligaciontipolimiteid
              ? "GUARDAR CAMBIOS"
              : "VINCULAR"}
          </Button>
        </div>
      </div>
    </form>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function LineasProducto() {
  const [selectedTipoLimiteId, setSelectedTipoLimiteId] = useState("");
  const [activeProducto, setActiveProducto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: limitTypes, isLoading: isLoadingLimitTypes } =
    useTiposProducto();
  const { data: allObligaciones } = useObligaciones();

  const { data: productosAsociados, isFetching: isFetchingProductos } =
    useObtenerProductosPorLimite(selectedTipoLimiteId);

  const listLimitTypes = limitTypes?.raw || [];
  const obligacionesOptions = allObligaciones?.opciones || [];

  const mappedLimitTypes = listLimitTypes.map((tl) => ({
    cadenavalorid: String(tl.tipolimiteid),
    denominacion: tl.descripcion || tl.label,
    referencia: "LÍNEA",
    cuittercero: null,
    logo: null,
  }));

  const handleOpenConfigModal = (producto = null) => {
    setActiveProducto(producto);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setActiveProducto(null);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Productos por Línea</h1>
          <p>
            Configurá qué productos financieros están asociados a cada Línea
            (Global)
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="primary"
            onClick={() => handleOpenConfigModal(null)}
            disabled={!selectedTipoLimiteId}
          >
            + NUEVO PRODUCTO
          </Button>
        </div>
      </div>

      <div className={styles.selectorSection}>
        {isLoadingLimitTypes ? (
          <div
            className={styles.skeletonBlock}
            style={{ height: "82px", width: "100%", borderRadius: "0.75rem" }}
          ></div>
        ) : (
          <CadenaSelectCard
            options={mappedLimitTypes}
            value={selectedTipoLimiteId}
            onChange={(val) => setSelectedTipoLimiteId(String(val))}
            placeholder="Seleccionar Línea..."
          />
        )}
      </div>

      <div className={styles.cardSection}>
        {isFetchingProductos ? (
          <div className={styles.productoCardGrid}>
            {[1, 2, 3, 4].map((i) => (
              <LineaSkeletonCard key={i} />
            ))}
          </div>
        ) : selectedTipoLimiteId &&
          (!productosAsociados || productosAsociados.length === 0) ? (
          <div className={styles.emptyMsg}>
            Esta línea global no tiene productos financieros vinculados. Hacé
            clic en "NUEVO PRODUCTO" para vincular uno.
          </div>
        ) : selectedTipoLimiteId && productosAsociados ? (
          <div className={styles.productoCardGrid}>
            {productosAsociados.map((prod) => (
              <ProductoCard
                key={prod.tipoobligaciontipolimiteid}
                producto={prod}
                onEdit={handleOpenConfigModal}
                allObligaciones={obligacionesOptions}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyMsg}>
            Seleccioná una línea en el buscador para ver sus productos.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={activeProducto ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO VINCULADO"}
        maxWidth="500px"
        variant="blue"
      >
        <ConfigModalInner
          activeProducto={activeProducto}
          tipoLimiteId={selectedTipoLimiteId}
          allObligaciones={obligacionesOptions}
          onClose={handleCloseModal}
        />
      </Modal>
    </div>
  );
}
