import { z } from "zod";

export const AltaDatosEmpresaSchema = z.object({
  cuit: z
    .string()
    .min(11, "El CUIT debe tener 11 números")
    .max(11, "El CUIT debe tener 11 números")
    .regex(/^\d+$/, "El CUIT solo debe contener números"),
  razonSocial: z.string().min(1, "La Razón Social es requerida"),
  direccion: z.string().min(5, "La dirección debe ser válida"),
  localidad: z.string().min(1, "La localidad es requerida"),
  provincia: z.string().min(1, "La provincia es requerida").optional(),
  celular: z.string().min(8, "El número de contacto es inválido"),
});
