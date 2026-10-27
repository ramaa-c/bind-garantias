import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiChevronRight, FiClock, FiCheck, FiSearch } from "react-icons/fi";
import { useAuthStore } from "../../../../store/useAuthStore";
import { useChannel } from "../../../../context/useChannel";
import { useEmpresasDelUsuario } from "../../../../hooks/useEmpresasDelUsuario";
import { useSolicitudesVendor } from "../../../../hooks/useEmpresasVendor";
import { obtenerInicialesEmpresa, obtenerVarianteAvatarEmpresa } from "../../../../utils/empresaAvatar";
import { esEstadoEnCurso, ESTADO_PENDIENTE } from "../../../../utils/estadoLimiteSocio";
import { Skeleton } from "../../../../components/ui";
import styles from "./ElegirEmpresa.module.css";

export default function ElegirEmpresa() {
  const navigate = useNavigate();
  const { basePath } = useChannel();
  const activeSocioId = useAuthStore((state) => state.activeSocioId);
  const cambiarEmpresa = useAuthStore((state) => state.cambiarEmpresa);
  const setActiveSocioId = useAuthStore((state) => state.setActiveSocioId);
  const isSolicitudesEnabled = useAuthStore((state) => state.isSolicitudesEnabled);

  const { empresas, cargando } = useEmpresasDelUsuario();
  const { porEmpresa } = useSolicitudesVendor(empresas);

  const conSolicitudEnCurso = useMemo(() => {
    const ids = new Set();
    porEmpresa.forEach(({ empresa, solicitudes }) => {
      if (solicitudes.some((s) => esEstadoEnCurso(Number(s.tipolimiteestadoid ?? ESTADO_PENDIENTE)))) {
        ids.add(String(empresa.socioId));
      }
    });
    return ids;
  }, [porEmpresa]);

  const ordenadas = useMemo(
    () => [...empresas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [empresas],
  );

  const [busqueda, setBusqueda] = useState("");
  const texto = busqueda.trim().toLowerCase();
  const digitos = texto.replace(/\D/g, "");
  const visibles = ordenadas.filter(
    (e) =>
      !texto ||
      e.nombre.toLowerCase().includes(texto) ||
      (digitos.length > 0 && String(e.cuit).replace(/\D/g, "").includes(digitos)),
  );
  const cambiando = !!activeSocioId;

  const inicio = `${basePath}${isSolicitudesEnabled ? "/solicitudes" : "/legajo"}`;

  const elegir = (socioId) => {
    if (String(socioId) !== String(activeSocioId ?? "")) {
      cambiarEmpresa();
      setActiveSocioId(socioId);
    }
    navigate(inicio);
  };

  return (
    <section className={styles.pagina}>
      <header className={styles.cabecera}>
        <span className={styles.cabeceraIcono} aria-hidden="true">
          <FiBriefcase />
        </span>
        <div>
          <h1 className={styles.titulo}>{cambiando ? "Elegí una empresa" : "¿Con qué empresa querés ingresar?"}</h1>
          <p className={styles.subtitulo}>
            Tenés acceso a {empresas.length || "varias"} empresas. Podés cambiarla cuando quieras desde el menú.
          </p>
        </div>
      </header>

      <label className={styles.buscador}>
        <FiSearch className={styles.buscadorIcono} aria-hidden="true" />
        <input
          type="text"
          className={styles.buscadorInput}
          placeholder="Buscar por razón social o CUIT"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          aria-label="Buscar empresa"
        />
      </label>

      <ul className={styles.lista}>
        {cargando
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton height="4.25rem" radius="1rem" />
              </li>
            ))
          : visibles.map((empresa) => {
              const enCurso = conSolicitudEnCurso.has(String(empresa.socioId));
              const actual = String(empresa.socioId) === String(activeSocioId ?? "");
              return (
                <li key={empresa.socioId}>
                  <button
                    type="button"
                    className={`${styles.fila} ${actual ? styles.filaActual : ""}`}
                    onClick={() => elegir(empresa.socioId)}
                    aria-current={actual ? "true" : undefined}
                    aria-label={`Ingresar a ${empresa.nombre || "la empresa"}${actual ? " (empresa actual)" : ""}`}
                  >
                    <span
                      className={`${styles.avatar} ${styles[`avatar_${obtenerVarianteAvatarEmpresa(empresa.nombre)}`] || ""}`}
                      aria-hidden="true"
                    >
                      {obtenerInicialesEmpresa(empresa.nombre)}
                    </span>
                    <span className={styles.info}>
                      <span className={styles.nombre}>{empresa.nombre || "Empresa sin nombre"}</span>
                      {empresa.cuit && <span className={styles.cuit}>CUIT {empresa.cuit}</span>}
                    </span>
                    {(enCurso || actual) && (
                      <span className={styles.chips}>
                        {enCurso && (
                          <span className={`${styles.chip} ${styles.chipEnCurso}`}>
                            <FiClock aria-hidden="true" /> Solicitud en curso
                          </span>
                        )}
                        {actual && (
                          <span className={`${styles.chip} ${styles.chipActual}`}>
                            <FiCheck aria-hidden="true" /> Actual
                          </span>
                        )}
                      </span>
                    )}
                    <FiChevronRight className={styles.chevron} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
        {!cargando && visibles.length === 0 && <li className={styles.vacio}>No encontramos esa empresa.</li>}
      </ul>
    </section>
  );
}
