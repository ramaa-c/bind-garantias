import { z } from "zod";

export const AltaDatosEmpresaSchema = z.object({
  cuit: z
    .string()
    .min(11, "El CUIT debe tener 11 números")
    .max(11, "El CUIT debe tener 11 números")
    .regex(/^\d+$/, "El CUIT solo debe contener números"),
  razonSocial: z.string().min(1, "La Razón Social es requerida"),
  direccion: z.string().min(5, "La dirección debe ser válida"),
  calle: z.string().trim().min(1, "La calle es requerida"),
  sinNumero: z.boolean().optional(),
  // Existen calles con altura 0 en Argentina (ver AFIP/Nosis), así que 0 es
  // un número de calle válido, no equivalente a "vacío" - z.coerce.number()
  // solo por sí mismo convierte "" a 0 (Number("") === 0), lo que confundía
  // "el usuario no completó nada" con "la calle tiene altura 0" y rechazaba
  // este último caso como si faltara. El preprocess deja "" como undefined
  // para que solo eso dispare el error de "requerido" más abajo.
  numero: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().optional(),
  ),
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
  tipoactividadsepymeid: z.string().nullable().optional(),
  codpos: z.string().optional(),
}).superRefine((data, ctx) => {
  const numeroInvalido =
    data.numero === undefined ||
    data.numero === null ||
    Number.isNaN(data.numero) ||
    data.numero < 0;
  if (!data.sinNumero && numeroInvalido) {
    ctx.addIssue({
      path: ["numero"],
      message: "El número es requerido",
      code: z.ZodIssueCode.custom,
    });
  }
});
