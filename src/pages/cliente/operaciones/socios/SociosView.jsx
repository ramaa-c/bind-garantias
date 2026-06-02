import React, { useState, useEffect } from "react";
import { FiUsers as FiUsersIcon, FiRefreshCw } from "react-icons/fi";
import { SociosLegajo } from "../../../../components/features";
import { Button } from "../../../../components/ui";
import { HelpDrawer } from "../../../../components/layout/Client/HelpDrawer/HelpDrawer";
import styles from "./SociosView.module.css";
import { useEmpresaActiva } from "../../../../hooks/useEmpresaActiva";
import { sociosService } from "../../../../services/sociosService";
import { afipService } from "../../../../services/afipService";
import { tercerosService } from "../../../../services/tercerosService";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SociosView() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { cuitActivo } = useEmpresaActiva();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handler = () => setIsHelpOpen((prev) => !prev);
    document.addEventListener("bindHelp:toggle", handler);
    return () => document.removeEventListener("bindHelp:toggle", handler);
  }, []);

  const handleRefreshLufe = async () => {
    if (!cuitActivo) {
      toast.error("No se pudo obtener el CUIT de la empresa activa.");
      return;
    }

    setIsRefreshing(true);
    const idToast = toast.loading("Actualizando datos desde LUFE...");

    try {
      let autoridades = null;
      try {
        autoridades = await sociosService.obtenerAutoridadesLufe(cuitActivo, true);
      } catch (lufeError) {
        console.error("[SociosView] Error al vincular autoridades de LUFE:", lufeError);
      }

      try {
        const arrAut = Array.isArray(autoridades) 
          ? autoridades 
          : autoridades?.data || autoridades?.items || [];
        
        if (arrAut.length > 0) {
          await Promise.all(
            arrAut.map(async (auth) => {
              const cuitSocio = auth.cuit || auth.Cuit;
              if (!cuitSocio) return;
              const cuitSocioLimpio = String(cuitSocio).replace(/\D/g, "");
              if (cuitSocioLimpio.length !== 11) return;

              try {
                const existentes = await tercerosService.obtenerTerceros({ Cuit: cuitSocioLimpio });
                const arrExistentes = Array.isArray(existentes) ? existentes : existentes?.data || [];
                if (arrExistentes.length === 0) return;

                const terceroLocal = arrExistentes[0];
                const terceroId = terceroLocal.tercerorelacionadoid || terceroLocal.id;

                let respAfip = null;
                try {
                  respAfip = await afipService.obtenerConstanciaInscripcion(cuitSocioLimpio);
                } catch (afipErr) {
                  try {
                    const lufeEntidad = await sociosService.obtenerEntidadLufe(cuitSocioLimpio);
                    if (lufeEntidad && lufeEntidad.success) {
                      respAfip = sociosService.normalizarLufeAEstructuraAfip(lufeEntidad);
                    }
                  } catch (lufeErr) {}
                }

                if (respAfip && respAfip.datosgenerales) {
                  const dg = respAfip.datosgenerales;
                  const dom = dg.domiciliofiscal || dg.domicilio || {};

                  const payloadTercero = {
                    tercerorelacionadoid: terceroId,
                    denominacion: auth.denominacion || terceroLocal.denominacion || `${dg.nombre || ""} ${dg.apellido || ""}`.trim() || "Representante",
                    cuit: cuitSocioLimpio,
                    bcraid: 0,
                    tipopersonaid: cuitSocioLimpio.startsWith("30") || cuitSocioLimpio.startsWith("33") ? 2 : 1,
                    tipodocumentoid: 0,
                    numerodocumento: cuitSocioLimpio,
                    estadocivilid: 0,
                    ciudadid: 0,
                    telefono: dg.telefono || terceroLocal.telefono || "",
                    conyuge: "",
                    actividad: "",
                    contacto: dom.localidad || dom.localidadNombre || terceroLocal.contacto || "",
                    nrocuenta: "",
                    codigomercado: "",
                    calle: dom.direccion || (dom.calle ? `${dom.calle} ${dom.numero || ""}`.trim() : "") || terceroLocal.calle || "",
                    numero: 0,
                    piso: "",
                    departamento: "",
                    codpos: dom.codpostal || dom.codpos || terceroLocal.codpos || "",
                    descripcionreducida: (auth.denominacion || terceroLocal.denominacion || "").substring(0, 20),
                    mail: dg.email || dg.emailfacturacion || terceroLocal.mail || terceroLocal.email || "",
                  };

                  await tercerosService.actualizarTercero(payloadTercero);
                }
              } catch (singleErr) {
                console.warn(`[SociosView] No se pudo enriquecer CUIT ${cuitSocioLimpio}:`, singleErr);
              }
            })
          );
        }
      } catch (enriquecimientoError) {
        console.error("[SociosView] Error al procesar enriquecimiento de autoridades:", enriquecimientoError);
      }

      try {
        await sociosService.obtenerDocumentosLufe(cuitActivo, true);
      } catch (lufeDocsError) {
        console.error("[SociosView] Error al vincular documentos de LUFE:", lufeDocsError);
      }

      await queryClient.invalidateQueries();

      toast.success("Datos de LUFE actualizados correctamente", { id: idToast });
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al actualizar desde LUFE", { id: idToast });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <section className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircleSmall}>
            <FiUsersIcon />
          </div>
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>Legajo</h1>
            <p className={styles.subtitle}>
              Gestioná la composición accionaria, representantes y
              vinculaciones.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          className={styles.submitBtn}
          onClick={handleRefreshLufe}
          disabled={isRefreshing}
        >
          <FiRefreshCw 
            className={isRefreshing ? styles.spinIcon : ""} 
            style={{ marginRight: "0.5rem" }} 
          />
          {isRefreshing ? "Actualizando..." : "Refrescar datos LUFE"}
        </Button>
      </header>

      <div className={styles.formLayout}>
        <SociosLegajo />
      </div>

      <HelpDrawer
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contexto="inicio"
      />
    </section>
  );
}
