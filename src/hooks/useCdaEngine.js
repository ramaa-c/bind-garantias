import { useState, useCallback } from "react";
import { cdaService } from "../services/cdaService";

const CDA_MESSAGES = {
  1: "El CUIT ingresado no se encuentra activo o vigente en los registros oficiales.",
  2: "La empresa no cumple con la antigüedad mínima requerida para operar.",
  3: "La actividad registrada pertenece a un sector excluido de la operatoria.",
  4: "La empresa no posee al menos una de las actividades económicas habilitadas.",
  5: "No se admiten clientes monotributistas para este tipo de producto.",
  6: "La empresa no se encuentra registrada como monotributista.",
  7: "La categoría de monotributo registrada no está admitida para operar.",
  8: "El tipo de persona de la empresa debe ser JURÍDICA.",
  9: "La persona declarada debe revestir carácter de Persona Física para poder avanzar.",
  10: "El socio ya se encuentra registrado como socio protector en otra SGR.",
  11: "El certificado PyME presentado ha vencido o no se encuentra vigente.",
  12: "Los accionistas de la empresa son socios protectores de otra SGR superando el límite del 50%.",
  13: "El tamaño de la empresa indicado en el certificado PyME no está dentro de los límites admitidos.",
  14: "El sector industrial de la empresa no está dentro de los admitidos para operar.",
};

export const useCdaEngine = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarValidaciones = useCallback(async (pantalla, cuit) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Obtener el grupo asociado a la pantalla
      const pantallaGrupoRes = await cdaService.obtenerPantallaGrupoCda(pantalla);
      const pantallaGrupo = Array.isArray(pantallaGrupoRes) ? pantallaGrupoRes[0] : pantallaGrupoRes;

      if (!pantallaGrupo || !pantallaGrupo.grupocdaid) {
        setLoading(false);
        return { success: true, errors: [] };
      }

      const grupoId = pantallaGrupo.grupocdaid;

      // 2. Obtener la lista de CDAs del grupo
      const cdasDelGrupoRes = await cdaService.obtenerGrupoCda(grupoId);
      const cdasDelGrupo = Array.isArray(cdasDelGrupoRes) ? cdasDelGrupoRes : [];

      if (cdasDelGrupo.length === 0) {
        setLoading(false);
        return { success: true, errors: [] };
      }

      const errorsList = [];

      // 3. Ejecutar secuencialmente cada CDA
      for (const rel of cdasDelGrupo) {
        const cdaId = rel.cdaid;
        if (!cdaId) continue;

        // Obtener detalles del CDA para saber si es invalidante
        let cdaDetail = null;
        try {
          cdaDetail = await cdaService.obtenerCda(cdaId);
        } catch (errDetail) {
          console.warn(`⚠️ [CDA ENGINE] No se pudo obtener detalles del CDA ${cdaId}:`, errDetail);
        }

        const isInvalidante = cdaDetail ? String(cdaDetail.esinvalidante) === "1" : true;
        const descripcion = cdaDetail?.descripcion || `Validación interna (CDA ${cdaId})`;

        try {
          const cuitLimpio = String(cuit).replace(/\D/g, "");
          console.log(`🚀 [CDA ENGINE] Ejecutando CDA ${cdaId} para CUIT ${cuitLimpio}`);
          
          await cdaService.ejecutarCda({
            cdaid: Number(cdaId),
            cuit: cuitLimpio,
          });
          console.log(`✅ [CDA ENGINE] CDA ${cdaId} superado con éxito (Status: 202)`);
        } catch (errPost) {
          const is406 = errPost.response?.status === 406;
          
          let apiMessage = errPost.response?.data;
          if (apiMessage && typeof apiMessage === "object") {
            apiMessage = apiMessage.message || apiMessage.error || JSON.stringify(apiMessage);
          }

          const customMessage = apiMessage || CDA_MESSAGES[cdaId] || descripcion;

          if (isInvalidante) {
            console.error(`❌ [CDA ENGINE] CDA ${cdaId} falló y es invalidante (Status: ${errPost.response?.status || 500}). Mensaje: "${customMessage}"`);
          } else {
            console.warn(`⚠️ [CDA ENGINE] CDA ${cdaId} falló pero NO es invalidante (Status: ${errPost.response?.status || 500}). Mensaje: "${customMessage}"`);
          }

          const errorObj = {
            cdaId,
            descripcion,
            isInvalidante,
            message: customMessage,
          };

          errorsList.push(errorObj);

          if (isInvalidante) {
            setError(customMessage);
            setLoading(false);
            console.log(`🛑 [CDA ENGINE] Interrumpiendo ejecución por error invalidante en CDA ${cdaId}.`);
            return { success: false, errors: errorsList };
          }
        }
      }

      const exitoGlobal = errorsList.length === 0 || !errorsList.some((e) => e.isInvalidante);
      console.log(`🎉 [CDA ENGINE] Finalizó ejecución para pantalla "${pantalla}". Éxito global: ${exitoGlobal}`);

      setLoading(false);
      return {
        success: errorsList.length === 0 || !errorsList.some((e) => e.isInvalidante),
        errors: errorsList,
      };
    } catch (errGlobal) {
      console.error("❌ [CDA ENGINE] Error crítico de ejecución:", errGlobal);
      const msgError = "Ocurrió un error inesperado al realizar las validaciones internas.";
      setError(msgError);
      setLoading(false);
      return { success: false, errors: [{ message: msgError }] };
    }
  }, []);

  return {
    loading,
    error,
    ejecutarValidaciones,
  };
};
