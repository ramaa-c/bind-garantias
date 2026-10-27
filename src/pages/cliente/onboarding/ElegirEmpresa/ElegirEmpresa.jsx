import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiBriefcase, FiChevronRight, FiClock, FiCheck } from "react-icons/fi";
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
          <h1 className={styles.titulo}>¿Con qué empresa querés ingresar?</h1>
          <p className={styles.subtitulo}>
            Tenés acceso a {empresas.length || "varias"} empresas. Elegí una para operar; podés cambiarla después desde el
            menú.
          </p>
        </div>
      </header>

      <ul className={styles.lista}>
        {cargando
          ? Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton height="5.25rem" radius="1rem" />
              </li>
            ))
          : ordenadas.map((empresa) => {
              const enCurso = conSolicitudEnCurso.has(String(empresa.socioId));
              const actual = String(empresa.socioId) === String(activeSocioId ?? "");
              return (
                <li key={empresa.socioId}>
                  <button
                    type="button"
                    className={`${styles.tarjeta} ${actual ? styles.tarjetaActual : ""}`}
                    onClick={() => elegir(empresa.socioId)}
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
                      <span className={styles.chips}>
                        {actual && (
                          <span className={`${styles.chip} ${styles.chipActual}`}>
                            <FiCheck aria-hidden="true" /> Empresa actual
                          </span>
                        )}
                        {enCurso && (
                          <span className={`${styles.chip} ${styles.chipEnCurso}`}>
                            <FiClock aria-hidden="true" /> Solicitud en curso
                          </span>
                        )}
                      </span>
                    </span>
                    <span className={styles.entrar}>
                      Ingresar <FiChevronRight aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
      </ul>
    </section>
  );
}
