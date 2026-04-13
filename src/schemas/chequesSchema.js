import * as z from "zod";

export const chequesSchema = z
  .object({
    cuit: z
      .string()
      .regex(/^\d{11}$/, { message: "Debe contener 11 números sin guiones" }),

    direccion: z
      .string()
      .trim()
      .min(3, { message: "La dirección es obligatoria" }),
    provincia: z.string().min(3, { message: "La provincia es obligatoria" }),
    localidad: z.string().min(3, { message: "La localidad es obligatoria" }),

    celular: z
      .string()
      .regex(/^\d{10}$/, { message: "Debe contener 10 números" }),

    moneda: z.string().min(1, { message: "Seleccioná una moneda" }),
    tipoProducto: z.string().min(1, { message: "Seleccioná el producto" }),
    tipoCalculo: z
      .string()
      .min(1, { message: "Seleccioná el tipo de cálculo" }),

    monto: z
      .preprocess(
        (val) => {
          if (val === "" || val === undefined || val === null) return undefined;
          const cleanValue =
            typeof val === "string"
              ? val.replace(/\./g, "").replace(",", ".")
              : val;
          const num = Number(cleanValue);
          return isNaN(num) ? val : num;
        },
        z
          .number({ invalid_type_error: "Ingresá un número válido" })
          .min(1000, { message: "El monto mínimo es $1000" })
          .optional(),
      )
      .refine((val) => val !== undefined, {
        message: "El monto es obligatorio",
      }),

    plazo: z.string().optional(),
    fechaPago: z.string().optional(),

    emailFacturacion: z
      .string()
      .email({ message: "Email inválido" })
      .min(1, { message: "Requerido" })
      .optional()
      .or(z.literal("")),

    sociedadBolsa: z.string().optional().or(z.literal("")),
    numeroCuentaBolsa: z.string().optional().or(z.literal("")),

    socios: z
      .array(
        z.object({
          email: z.string().email({ message: "Email inválido" }),
          celular: z
            .string()
            .regex(/^\d{10}$/, { message: "Debe contener 10 números" }),
          direccion: z.string().min(3, { message: "Requerido" }),
          provincia: z.string().min(3, { message: "Requerido" }),
          localidad: z.string().min(3, { message: "Requerido" }),
        }),
      )
      .optional(),

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
  })
  .superRefine((data, ctx) => {
    if (
      data.sociedadBolsa &&
      data.sociedadBolsa !== "" &&
      (!data.numeroCuentaBolsa || data.numeroCuentaBolsa.trim() === "")
    ) {
      ctx.addIssue({
        path: ["numeroCuentaBolsa"],
        message:
          "El número de cuenta es obligatorio si seleccionaste una bolsa",
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.tipoProducto !== "prestamo_fijo") {
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
