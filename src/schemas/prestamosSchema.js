import * as z from "zod";

export const prestamosSchema = z.object({
  cuit: z.string().regex(/^\d{11}$/, { message: "Debe contener 11 números sin guiones" }),
  direccion: z.string().min(3, { message: "La dirección es obligatoria" }),
  provincia: z.string().min(3, { message: "La provincia es obligatoria" }),
  localidad: z.string().min(3, { message: "La localidad es obligatoria" }),
  celular: z.string().regex(/^\d{10}$/, { message: "Debe contener 10 números" }),
  moneda: z.string().min(1, { message: "Requerido" }),
  tipoProducto: z.string().min(1, { message: "Requerido" }),
  tipoCalculo: z.string().min(1, { message: "Requerido" }),
  monto: z.coerce.number().min(1000, { message: "El monto mínimo es $1000" }),
  plazo: z.string().min(1, { message: "Requerido" }),
  apoCuit: z.string().regex(/^\d{11}$/, { message: "Debe contener 11 números" }).optional().or(z.literal("")),
  apoEmail: z.string().email({ message: "Email inválido" }).optional().or(z.literal("")),
  apoCelular: z.string().regex(/^\d{10}$/, { message: "Debe contener 10 números" }).optional().or(z.literal("")),
  emailFacturacion: z.string().email({ message: "Email inválido" }).min(1, { message: "Requerido" }),
});