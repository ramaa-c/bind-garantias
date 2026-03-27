import * as z from "zod";

export const pagareSchema = z.object({
  monto: z
    .preprocess(
      (val) => {
        if (val === "" || val === undefined || val === null) return undefined;
        const num = Number(val);
        return isNaN(num) ? val : num;
      },
      z
        .number({
          invalid_type_error: "Ingresá un monto válido",
        })
        .min(1000, { message: "El monto mínimo es U$D 1.000" })
        .optional(),
    )
    .refine((val) => val !== undefined, {
      message: "El monto es obligatorio",
    }),

  fechaPago: z.string().min(1, { message: "Seleccioná una fecha de pago" }),

  agenteBolsa: z
    .string()
    .min(1, { message: "Seleccioná una sociedad de bolsa" }),

  idEpyme: z
    .string()
    .min(1, { message: "El ID es obligatorio" })
    .min(5, { message: "El ID debe tener al menos 5 caracteres" }),

  mensaje: z.string().optional(),
});
