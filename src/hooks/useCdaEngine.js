import React, { useState, useCallback } from "react";
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
      const cuitLimpio = String(cuit).replace(/\D/g, "");
      console.log(
        `[CDA ENGINE] Ejecutando validaciones para pantalla "${pantalla}" y CUIT ${cuitLimpio}`
      );

      await cdaService.ejecutarCda(pantalla, cuitLimpio);

      console.log(
        `[CDA ENGINE] Validaciones de CDAs para pantalla "${pantalla}" superadas con éxito (Status: 202)`
      );

      setLoading(false);
      return { success: true, errors: [] };
    } catch (err) {
      console.error("[CDA ENGINE] Error durante la validación del CDA:", err);
      
      const responseData = err.response?.data;
      console.log("[CDA ENGINE] Response data:", responseData);

      // Detectar errores graves de infraestructura/base de datos
      const isInfraError = 
        err.response?.status >= 500 || 
        (typeof responseData === "string" && /FireDAC|Exception|Cannot acquire item|Connection/i.test(responseData));

      // Extraer los errores crudos desde distintas estructuras de respuesta posibles
      let rawErrors = [];
      if (!isInfraError) {
        if (typeof responseData === "string") {
          // El backend mandó un string plano, quizás separado por saltos de línea
          const msgs = responseData.split(/\r?\n/).filter(line => line.trim().length > 0);
          rawErrors = msgs.map(msg => ({ descripcion: msg.trim(), bloqueante: true, cdaid: 0 }));
        } else if (Array.isArray(responseData)) {
          rawErrors = responseData;
        } else if (responseData && Array.isArray(responseData.errors)) {
          rawErrors = responseData.errors;
        } else if (responseData && typeof responseData === "object") {
          rawErrors = [responseData];
        }
      }

      // Si no hay errores devueltos por el backend, o falló el request (ej. 500 o error de red o infraestructura)
      if (rawErrors.length === 0 || !responseData || isInfraError) {
        const isSystemError = true;
        const isInvalidante = true;
        
        let msg = err.response?.data?.message || err.message || "Error de comunicación con el servicio de validación CDA.";
        if (isInfraError) {
          msg = "El servicio de validaciones no se encuentra disponible momentáneamente. Por favor, intente nuevamente.";
        }
        
        setLoading(false);
        return {
          success: false,
          errors: [{
            cdaid: 0,
            isInvalidante,
            message: msg,
            isSystemError,
          }]
        };
      }

      // Mapear cada error al formato del asistente
      const mappedErrors = rawErrors.map((raw) => {
        const cdaId = Number(raw.cdaid || raw.CdaID || raw.id || 0);
        
        // Es bloqueante por defecto si bloqueante/isInvalidante/isBlocking es true,
        // o si el backend no lo define, asumimos true para resguardar consistencia.
        const isBloqueante = raw.bloqueante ?? raw.Bloqueante ?? true;
        
        // REQUERIMIENTO DE USUARIO: El CDA ID 10 ("socio ya existe en otra SGR / SGR Plus")
        // ya no representa un impedimento para avanzar, por ende NO es invalidante.
        const isInvalidante = cdaId === 10 ? false : isBloqueante;

        const backendMessage = raw.descripcion || raw.Descripcion || raw.message || raw.Message;
        const mappedMessage = backendMessage || CDA_MESSAGES[cdaId] || "Error de validación CDA desconocido.";

        return {
          cdaid: cdaId,
          isInvalidante: isInvalidante,
          message: mappedMessage,
          isSystemError: raw.sistemico ?? raw.Sistemico ?? false,
        };
      });

      setLoading(false);
      
      // Comprobar si quedó algún error que efectivamente sea bloqueante / invalidante
      const hasBlockingErrors = mappedErrors.some((e) => e.isInvalidante);

      return {
        success: !hasBlockingErrors,
        errors: mappedErrors,
      };
    }
  }, []);

  return {
    loading,
    error,
    ejecutarValidaciones,
  };
};
