import React, { useState } from "react";
import { FiUploadCloud, FiTrash2, FiEye, FiEyeOff, FiImage, FiPlusCircle } from "react-icons/fi";
import { toast } from "sonner";
import styles from "./AdminBanners.module.css";

const bannersBase = [
  {
    id: "banner-1",
    titulo: "Campaña Agro BIND Garantías",
    descripcion: "Promoción especial para descuento de cheques agropecuarios en la campaña fina.",
    imagenUrl: "https://images.unsplash.com/photo-1586771107585-ba51b427b0eb?auto=format&fit=crop&w=600&q=80",
    enlaceDestino: "/cheques",
    posicion: "Carrusel Principal",
    activo: true,
    fechaCarga: "15/04/2026",
  },
  {
    id: "banner-2",
    titulo: "Pagarés Bursátiles a Medida",
    descripcion: "Accedé a financiamiento en dólares con plazos extendidos para tu empresa.",
    imagenUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
    enlaceDestino: "/pagare",
    posicion: "Sidebar Lateral",
    activo: true,
    fechaCarga: "01/05/2026",
  },
  {
    id: "banner-3",
    titulo: "Líneas de Crédito Preaprobadas",
    descripcion: "Validá tu CUIT en 2 minutos y conocé tu límite preasignado sin costo de análisis.",
    imagenUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    enlaceDestino: "/solicitudes",
    posicion: "Carrusel Principal",
    activo: false,
    fechaCarga: "20/02/2026",
  },
];

export default function AdminBanners() {
  const [banners, setBanners] = useState(bannersBase);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaPosicion, setNuevaPosicion] = useState("Carrusel Principal");
  const [nuevoEnlace, setNuevoEnlace] = useState("/solicitudes");

  const handleToggleActivo = (id) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, activo: !b.activo } : b))
    );
    toast.info("Visibilidad de banner modificada en el portal");
  };

  const handleEliminar = (id) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    toast.error("Banner publicitario eliminado");
  };

  const handleSimularSubida = (e) => {
    e.preventDefault();
    if (!nuevoTitulo.trim()) {
      toast.warning("Ingresá un título descriptivo para la campaña");
      return;
    }

    const nuevoBanner = {
      id: "banner-" + Date.now(),
      titulo: nuevoTitulo,
      descripcion: "Banner subido desde consola de administración.",
      imagenUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
      enlaceDestino: nuevoEnlace,
      posicion: nuevaPosicion,
      activo: true,
      fechaCarga: "Recién",
    };

    setBanners([nuevoBanner, ...banners]);
    setNuevoTitulo("");
    toast.success("Nuevo banner insertado exitosamente", {
      description: `Publicado en "${nuevaPosicion}" con estado Activo.`,
    });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Insertar y Gestionar Banners Web</h1>
          <p>
            Administrá las piezas gráficas y anuncios promocionales mostrados en los carruseles y
            barras laterales de la aplicación cliente.
          </p>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        {/* Subida de Banners */}
        <div className={styles.uploadCol}>
          <div className={styles.cardUpload}>
            <div className={styles.cardHead}>
              <FiUploadCloud size={22} className={styles.headIcon} />
              <h3>Insertar Nuevo Banner</h3>
            </div>

            <form onSubmit={handleSimularSubida} className={styles.uploadForm}>
              <div className={styles.formGroup}>
                <label>Título de la Campaña</label>
                <input
                  type="text"
                  placeholder="Ej: Financiación PyME 2026..."
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  className={styles.inputCustom}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Posición en la Página</label>
                <select
                  value={nuevaPosicion}
                  onChange={(e) => setNuevaPosicion(e.target.value)}
                  className={styles.selectCustom}
                >
                  <option value="Carrusel Principal">Carrusel Principal (Superior)</option>
                  <option value="Sidebar Lateral">Sidebar Lateral (Derecha)</option>
                  <option value="Footer Promocional">Footer Promocional (Inferior)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Enlace de Destino al Clickear</label>
                <input
                  type="text"
                  placeholder="Ej: /cheques o /prestamos"
                  value={nuevoEnlace}
                  onChange={(e) => setNuevoEnlace(e.target.value)}
                  className={styles.inputCustom}
                />
              </div>

              {/* Mock Dropzone */}
              <div className={styles.dropzoneMock}>
                <FiImage size={36} className={styles.dropIcon} />
                <span className={styles.dropText}>Arrastrá tu archivo de imagen acá</span>
                <span className={styles.dropFormat}>Formatos permitidos: JPG, PNG, WEBP (Max 2MB)</span>
                <button
                  type="button"
                  onClick={() => toast.info("Simulador de selector de archivos nativo")}
                  className={styles.btnBrowse}
                >
                  Examinar Archivos
                </button>
              </div>

              <button type="submit" className={styles.btnSubmitUpload}>
                <FiPlusCircle /> Subir e Insertar Banner
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Banners Actuales */}
        <div className={styles.listCol}>
          <h3 className={styles.listSectionTitle}>Banners Activos y en Historial</h3>
          <div className={styles.bannersGrid}>
            {banners.map((b) => (
              <div key={b.id} className={`${styles.bannerCard} ${!b.activo ? styles.bannerInactive : ""}`}>
                <div className={styles.imgWrap}>
                  <img src={b.imagenUrl} alt={b.titulo} className={styles.bannerImg} />
                  <span className={`${styles.posBadge} ${b.posicion.includes("Sidebar") ? styles.posSide : ""}`}>
                    {b.posicion}
                  </span>
                  <span className={`${styles.stateBadge} ${b.activo ? styles.stateActive : styles.statePaused}`}>
                    {b.activo ? "Visible" : "Pausado"}
                  </span>
                </div>

                <div className={styles.cardContent}>
                  <h4>{b.titulo}</h4>
                  <p>{b.descripcion}</p>

                  <div className={styles.cardMeta}>
                    <span>Destino: <strong>{b.enlaceDestino}</strong></span>
                    <span>Subido: {b.fechaCarga}</span>
                  </div>

                  <div className={styles.bannerActions}>
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(b.id)}
                      className={`${styles.btnToggle} ${b.activo ? styles.btnToggleOff : styles.btnToggleOn}`}
                    >
                      {b.activo ? (
                        <>
                          <FiEyeOff /> Pausar Visibilidad
                        </>
                      ) : (
                        <>
                          <FiEye /> Mostrar en Portal
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEliminar(b.id)}
                      className={styles.btnDelete}
                      title="Eliminar Banner"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
