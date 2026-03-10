import * as z from "zod";

export const pagareSchema = z.object({
  monto: z.coerce.number().min(1000, { message: "El monto mínimo es U$D 1.000" }),
  fechaPago: z.string().min(1, { message: "Seleccione una fecha" }),
  agenteBolsa: z.string().min(1, { message: "Debe seleccionar una sociedad de bolsa" }),
  idEpyme: z.string().min(5, { message: "Ingrese un ID válido" }),
  mensaje: z.string().optional(),
});