import { z } from "zod";

// Representantes/apoderados, accionistas, agente de bolsa y email de
// facturación se sacaron de este schema (cambio de flujo 2026-09-14): ya no
// son datos que se cargan desde este wizard, se gestionan enteramente en el
// Legajo antes de llegar a pedir la línea (ver AltaOperacion.jsx).
export const AltaOperacionSchema = z.object({
  cuit: z.string().optional(),
  razonSocial: z.string().optional(),
  esSocioExistente: z.boolean().optional(),
  ubicacionConfirmada: z.boolean().optional(),
  direccion: z.string().optional(),
  localidad: z.string().optional(),
  celular: z.string().optional(),
  smsVerificado: z.boolean().optional(),
  moneda: z.string({
    required_error: "Debes seleccionar una moneda",
    invalid_type_error: "Debes seleccionar una moneda",
  }).min(1, { message: "Debes seleccionar una moneda" }),
  tipoProducto: z.string({
    required_error: "Selecciona un tipo de producto",
    invalid_type_error: "Selecciona un tipo de producto",
  }).min(1, { message: "Selecciona un tipo de producto" }),
  familiaProducto: z.string().optional(),
  monto: z.coerce
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "Ingresa un monto válido",
    })
    .positive({ message: "El monto debe ser mayor a 0" }),
  plazo: z.string().min(1, "El plazo es obligatorio"),
});
