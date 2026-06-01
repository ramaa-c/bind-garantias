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

      // Invocar al nuevo endpoint GET api/cda/execute
      await cdaService.ejecutarCda(pantalla, cuitLimpio);

      console.log(
        `[CDA ENGINE] Validaciones de CDAs para pantalla "${pantalla}" superadas con éxito (Status: 202)`
      );

      setLoading(false);
      return { success: true, errors: [] };
    } catch (err) {
      console.error("[CDA ENGINE] Error durante la validación del CDA:", err);
      console.error("[CDA ENGINE] Response status:", err.response?.status);
      console.error("[CDA ENGINE] Response data:", err.response?.data);

      let apiMessage = err.response?.data;
      let isSystemError = false;

      if (apiMessage && typeof apiMessage === "object") {
        apiMessage =
          apiMessage.message ||
          apiMessage.error ||
          JSON.stringify(apiMessage);
      }
      
      if (typeof apiMessage === "string") {
        if (
          apiMessage.includes("Access violation") ||
          apiMessage.includes("Exception") ||
          apiMessage.includes("<html") ||
          err.response?.status >= 500
        ) {
          isSystemError = true;
          apiMessage = "Error de sistema. Por favor, volvé a intentarlo.";
        }
      }
      
      if (err.response?.status >= 500) {
        isSystemError = true;
      }

      let customMessage =
        apiMessage ||
        "Ocurrió un error inesperado al realizar las validaciones internas (CDA).";

      if (typeof customMessage === "string" && customMessage.includes("\n")) {
        const lineas = customMessage
          .split("\n")
          .map((linea) => linea.trim())
          .filter((linea) => linea.length > 0);

        customMessage = React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              marginTop: "0.35rem",
              fontFamily: "inherit",
            },
          },
          lineas.map((linea, index) =>
            React.createElement(
              "div",
              {
                key: index,
                style: {
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  lineHeight: "1.3",
                },
              },
              React.createElement(
                "span",
                { style: { color: "#ef4444", fontWeight: "bold" } },
                "•"
              ),
              React.createElement("span", null, linea)
            )
          )
        );
      }

      const errorObj = {
        isInvalidante: true,
        message: customMessage,
        isSystemError: isSystemError,
      };

      setError(customMessage);
      setLoading(false);

      return {
        success: false,
        errors: [errorObj],
      };
    }
  }, []);

  return {
    loading,
    error,
    ejecutarValidaciones,
  };
};
