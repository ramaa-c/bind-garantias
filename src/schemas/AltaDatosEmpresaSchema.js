import { z } from "zod";

export const AltaDatosEmpresaSchema = z.object({
  cuit: z
    .string()
    .min(11, "El CUIT debe tener 11 números")
    .max(11, "El CUIT debe tener 11 números")
    .regex(/^\d+$/, "El CUIT solo debe contener números"),
  razonSocial: z.string().min(1, "La Razón Social es requerida"),
  direccion: z.string().min(5, "La dirección debe ser válida"),
  calle: z.string().min(3, "La calle debe tener al menos 3 caracteres"),
  sinNumero: z.boolean().optional(),
  numero: z.coerce.number().optional(),
  piso: z.string().optional().or(z.literal("")),
  departamento: z.string().optional().or(z.literal("")),
  localidad: z.string().min(1, "La localidad es requerida"),
  localidadid: z.coerce.number().optional(),
  ciudad: z.string().optional(),
  ciudadid: z.coerce.number().min(1, "La ciudad es requerida"),
  provincia: z.string().min(1, "La provincia es requerida").optional(),
  provinciaid: z.coerce.number().optional(),
  celular: z.string().min(8, "El número de contacto es inválido"),
  emailfacturacion: z
    .string()
    .min(1, "El email de facturación es requerido")
    .email("Ingresá un email válido"),
  tipopersonaid: z.coerce.number().optional(),
  mescierre: z.coerce.number().nullable().optional(),
  fechainicioactividades: z.string().nullable().optional(),
  tiporegimenivaid: z.coerce.number().optional(),
  codpos: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.sinNumero && (!data.numero || data.numero < 1)) {
    ctx.addIssue({
      path: ["numero"],
      message: "El número es requerido",
      code: z.ZodIssueCode.custom,
    });
  }
});
