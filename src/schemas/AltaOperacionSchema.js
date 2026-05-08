import { z } from "zod";

export const AltaOperacionSchema = z
  .object({
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
    monto: z.coerce
      .number({
        required_error: "El monto es obligatorio",
        invalid_type_error: "Ingresa un monto válido",
      })
      .positive({ message: "El monto debe ser mayor a 0" }),
    plazo: z.string().min(1, "El plazo es obligatorio"),
    sociedadBolsa: z.string().optional(),
    numeroCuentaBolsa: z.string().optional(),
    representantes: z.array(z.any()).optional(),
    emailFacturacion: z
      .string()
      .min(1, "El email es obligatorio")
      .email("Debe ser un email válido"),
    socios: z
      .array(
        z.object({
          cuit: z.string().min(11, "CUIT inválido"),
          nombre: z.string().min(1, "Nombre obligatorio"),
          participacion: z.number().or(z.string()).transform(Number),
          dataOriginal: z.any().optional(),
          tercerorelacionadoid: z.number().optional().nullable(),
          preloadedFromDb: z.boolean().optional(),
          email: z.string().email("Email inválido").optional().or(z.literal("")),
          celular: z.string().optional().or(z.literal("")),
          direccion: z.string().optional().or(z.literal("")),
          provincia: z.string().optional().or(z.literal("")),
          localidad: z.string().optional().or(z.literal("")),
        }),
      )
      .optional(),
    faseSocio: z.string().optional(),
    tempSocioCuit: z.string().optional(),
    tempSocioNombre: z.string().optional(),
    tempSocioParticipacion: z.string().optional(),
    tempSocioData: z.any().optional(),
    docExpandido: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.socios && data.socios.length > 0) {
      const total = data.socios.reduce(
        (acc, curr) => acc + Number(curr.participacion),
        0,
      );
      if (total > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La participación de los socios no puede exceder el 100%",
          path: ["socios"],
        });
      }
    }

    if (
      data.tipoProducto === "cheque" &&
      data.sociedadBolsa &&
      !data.numeroCuentaBolsa
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "La cuenta comitente es requerida si selecciona sociedad de bolsa",
        path: ["numeroCuentaBolsa"],
      });
    }
  });
