import * as z from "zod";

export const solicitudChequesSchema = z
  .object({
    // PASO 1 - Simulador
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
          .number({
            invalid_type_error: "Ingresá un número válido",
          })
          .min(1000, { message: "El monto mínimo es $1000" })
          .optional()
      )
      .refine((val) => val !== undefined, {
        message: "El monto es obligatorio",
      }),

    plazo: z.string().optional(),
    fechaPago: z.string().optional(),

    // PASO 2 - Emisor
    emisorCuit: z
      .string()
      .regex(/^\d{11}$/, { message: "Debe contener 11 números sin guiones" }),

    // PASO 3 - Bolsa
    sociedadBolsa: z.string().optional().or(z.literal("")),
    numeroCuentaBolsa: z.string().optional().or(z.literal("")),

    // PASO 4 - Detalles
    tipoCheque: z.enum(["fisico", "echeck"], {
      required_error: "Debes seleccionar el tipo de cheque",
    }),
    cmc7: z.string().optional(),
    idCoelsa: z.string().optional(),
    mensaje: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validar cuenta bolsa si seleccionó bolsa
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

    // Validar CMC7 si es fisico
    if (
      data.tipoCheque === "fisico" &&
      (!data.cmc7 || data.cmc7.trim() === "")
    ) {
      ctx.addIssue({
        path: ["cmc7"],
        message: "El CMC7 es obligatorio para cheques físicos",
        code: z.ZodIssueCode.custom,
      });
    }

    // Validar ID Coelsa si es echeck
    if (
      data.tipoCheque === "echeck" &&
      (!data.idCoelsa || data.idCoelsa.trim() === "")
    ) {
      ctx.addIssue({
        path: ["idCoelsa"],
        message: "El ID Coelsa es obligatorio para eChecks",
        code: z.ZodIssueCode.custom,
      });
    }
  });
