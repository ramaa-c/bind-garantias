import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiArrowRight } from "react-icons/fi";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "../../../../hooks/useUsuario";
import { useObtenerSocioUsuarioPorUsuarioId } from "../../../../hooks/useSocios";
import { LoadingScreen } from "../../../../components/ui/LoadingScreen/LoadingScreen";
import styles from "./SeleccionarEmpresa.module.css";
import { useChannel } from "../../../../context/ChannelContext";

/* ─── helpers ─────────────────────────────────────────────── */
const getInitials = (nombre = "") => {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter(
      (p) =>
        p.length > 2 &&
        !["S.A.", "S.R.L.", "S.A.S.", "DE", "DEL", "LA", "LOS", "LAS"].includes(
          p.toUpperCase(),
        ),
    );
  if (palabras.length >= 2)
    return (palabras[0][0] + palabras[1][0]).toUpperCase();
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return nombre.slice(0, 2).toUpperCase();
};

const AVATAR_VARIANTS = ["azul", "verde", "amarillo", "coral"];
const getAvatarVariant = (nombre = "") => {
  const code = nombre.charCodeAt(0) || 0;
  return AVATAR_VARIANTS[code % AVATAR_VARIANTS.length];
};

/* ─── sub-componente: EmpresaCard ──────────────────────────── */

const EmpresaCard = ({ socio, socioId, index, onSelect }) => {
  const [pressed, setPressed] = useState(false);

  const nombre = socio.denominacion || socio.Denominacion || "";
  const cuit = socio.cuit || socio.Cuit || "";
  const initials = getInitials(nombre);
  const variant = getAvatarVariant(nombre);

  const handleClick = useCallback(() => {
    setPressed(true);
    setTimeout(() => onSelect(socioId), 160);
  }, [socioId, onSelect]);

  return (
    <div
      className={`${styles.empresaCard} ${pressed ? styles.empresaCardPressed : ""}`}
      style={{ animationDelay: `${0.05 + index * 0.06}s` }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Seleccionar empresa ${nombre}`}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick()}
    >
      {/* avatar */}
      <div
        className={`${styles.empresaAvatar} ${styles[`avatar--${variant}`]}`}
      >
        {initials}
      </div>

      {/* info */}
      <div className={styles.empresaInfo}>
        <h3 className={styles.empresaNombre}>{nombre}</h3>
        <div className={styles.empresaCuitRow}>
          <span className={styles.cuitLabel}>CUIT</span>
          <span className={styles.empresaCuit}>{cuit}</span>
        </div>
      </div>

      {/* acción */}
      <div className={styles.arrowWrap}>
        <FiArrowRight className={styles.iconArrow} aria-hidden="true" />
      </div>
    </div>
  );
};

/* ─── componente principal ─────────────────────────────────── */

export const SeleccionarEmpresa = () => {
  const navigate = useNavigate();
  const { channelInfo } = useChannel();
  const user = useAuthStore((state) => state.user);
  const setActiveSocioId = useAuthStore((state) => state.setActiveSocioId);

  const { data: usuarioDb, isPending: isLoadingUser } =
    useObtenerPorNombreOEmail(user?.email);

  const parsearUsuarioWebId = (db) => {
    if (!db) return null;
    if (Array.isArray(db))
      return db[0]?.usuariowebid || db[0]?.UsuarioWebID || db[0]?.id;
    if (db.items)
      return (
        db.items[0]?.usuariowebid ||
        db.items[0]?.UsuarioWebID ||
        db.items[0]?.id
      );
    if (db.data)
      return (
        db.data[0]?.usuariowebid || db.data[0]?.UsuarioWebID || db.data[0]?.id
      );
    return db.usuariowebid || db.UsuarioWebID || db.id || null;
  };

  const usuarioWebId = parsearUsuarioWebId(usuarioDb);

  const { data: socioUsuarios, isPending: isPendingSocios } =
    useObtenerSocioUsuarioPorUsuarioId(usuarioWebId || 0);

  const parsearEmpresas = (sociosData) => {
    if (!sociosData) return [];
    if (Array.isArray(sociosData)) return sociosData;
    if (sociosData.items) return sociosData.items;
    if (sociosData.data) return sociosData.data;
    if (typeof sociosData === "object" && Object.keys(sociosData).length > 0)
      return [sociosData];
    return [];
  };

  const listaEmpresasBase = parsearEmpresas(socioUsuarios);

  const isVendorMock = user?.email?.toLowerCase() === "vendorbind@yopmail.com";
  const MOCK_EMPRESAS = [
    {
      SocioID: 101,
      Socio: { Denominacion: "AGRO EMPRESA S.A.", Cuit: "30-70123456-1" },
    },
    {
      SocioID: 102,
      Socio: {
        Denominacion: "CONSTRUCTORA DEL SUR S.R.L.",
        Cuit: "30-70987654-3",
      },
    },
    {
      SocioID: 103,
      Socio: {
        Denominacion: "TECNOLOGÍA E INNOVACIÓN S.A.",
        Cuit: "30-71112223-4",
      },
    },
  ];

  const listaEmpresas = isVendorMock ? MOCK_EMPRESAS : listaEmpresasBase;

  /* — handlers — */
  const handleSelectEmpresa = useCallback(
    (socioId) => {
      setActiveSocioId(socioId);
      navigate(`/${channelInfo.id}/inicio`, { replace: true });
    },
    [setActiveSocioId, navigate, channelInfo.id],
  );

  const handleAltaEmpresa = () => {
    navigate(`/${channelInfo.id}/alta-datos-empresa`);
  };

  /* — loading state — */
  if (isLoadingUser || isPendingSocios) {
    return (
      <LoadingScreen
        title="Cargando empresas"
        message="Estamos obteniendo las empresas vinculadas..."
      />
    );
  }

  /* — render — */
  return (
    <div className={styles.pageContainer}>
      <div className={styles.formMainContainer}>
        <div className={styles.contentWrapper}>
          <div className={styles.contenedorPrincipal}>
            {/* header */}
            <div className={styles.bienvenidaHeader}>
              <span className={styles.bienvenidaBadge}>
                <span className={styles.badgeDot} aria-hidden="true" />
                Bienvenido Vendor
              </span>
              <h1 className={styles.tituloBienvenida}>Seleccioná la empresa</h1>
              <p className={styles.subtituloBienvenida}>
                Elegí la empresa con la que querés operar en esta sesión.
              </p>
            </div>

            {/* lista */}
            <div className={styles.empresasList}>
              {listaEmpresas.map((socioUsuario, index) => {
                const socio = socioUsuario.socio || socioUsuario.Socio;
                const socioId = socioUsuario.socioid || socioUsuario.SocioID;
                if (!socio) return null;

                return (
                  <EmpresaCard
                    key={socioId}
                    socio={socio}
                    socioId={socioId}
                    index={index}
                    onSelect={handleSelectEmpresa}
                  />
                );
              })}
            </div>

            {/* cta secundario */}
            <div className={styles.accionesContainer}>
              <div className={styles.dividerRow}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>
                  ¿No encontrás la empresa?
                </span>
                <span className={styles.dividerLine} />
              </div>
              <button
                className={styles.btnVincular}
                onClick={handleAltaEmpresa}
                type="button"
              >
                <FiPlus className={styles.btnVincularIcon} aria-hidden="true" />
                Vincular nueva empresa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeleccionarEmpresa;
