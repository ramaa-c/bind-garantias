import * as z from "zod";

export const prestamosSchema = z
  .object({
    cuit: z
      .string()
      .regex(/^\d{11}$/, { message: "Debe contener 11 números sin guiones" }),
    direccion: z
      .string()
      .trim()
      .min(3, { message: "La dirección es obligatoria" }),
    provincia: z.string().min(1, { message: "La provincia es obligatoria" }),
    localidad: z.string().min(3, { message: "La localidad es obligatoria" }),
    celular: z
      .string()
      .regex(/^\d{10}$/, { message: "Debe contener 10 números" }),

    // SELECTS
    moneda: z.string().min(1, { message: "Seleccioná una moneda" }),
    tipoProducto: z.string().min(1, { message: "Seleccioná el producto" }),

    // MODIFICADO
    tipoCalculo: z.string().optional(),

    // MONTO
    monto: z.preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null) return undefined;
        const cleanValue =
          typeof val === "string" ? val.replace(/\D/g, "") : val;
        const num = Number(cleanValue);
        return isNaN(num) ? val : num;
      },
      z
        .number({
          invalid_type_error: "Ingresá un número válido",
        })
        .min(1000, { message: "El monto mínimo es $1000" })
        .optional(),
    ),

    // FECHAS
    plazo: z.string().optional(),
    fechaPago: z.string().optional(),

    // EMAIL FACTURACIÓN
    emailFacturacion: z
      .string()
      .email({ message: "Email inválido" })
      .min(1, { message: "Requerido" })
      .optional()
      .or(z.literal("")),

    // REPRESENTANTES
    representantes: z
      .array(
        z.object({
          cuit: z
            .string()
            .regex(/^\d{11}$/, { message: "Debe contener 11 números" }),
          nombre: z.string().min(1, { message: "Requerido" }),
          rol: z.string().min(1, { message: "Requerido" }),
          email: z.string().email({ message: "Email inválido" }),
          celular: z
            .string()
            .regex(/^\d{10}$/, { message: "Debe contener 10 números" }),
        }),
      )
      .optional(),

    // SOCIOS
    socios: z
      .array(
        z.object({
          email: z.string().email({ message: "Email inválido" }),
          celular: z
            .string()
            .regex(/^\d{10}$/, { message: "Debe contener 10 números" }),
          direccion: z.string().min(3, { message: "Requerido" }),
          provincia: z.string().min(1, { message: "Requerido" }),
          localidad: z.string().min(3, { message: "Requerido" }),
        }),
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipoProducto !== "prestamo_fijo") {
      if (data.monto === undefined || data.monto === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "El monto es obligatorio",
          path: ["monto"],
        });
      }

      const esFechaEspecifica =
        data.tipoCalculo === "por_monto_cheque" ||
        data.tipoCalculo === "por_monto_pagare";
      
      const campoRequerido = esFechaEspecifica ? "fechaPago" : "plazo";

      if (!data[campoRequerido] || data[campoRequerido].trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Este campo es obligatorio",
          path: [campoRequerido],
        });
      }
    }
  });
