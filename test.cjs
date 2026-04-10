const z = require("zod");

const schema = z.object({
  tipoCalculo: z.string().optional(),
  fechaPago: z.string().optional(),
  plazo: z.string().optional()
}).superRefine((data, ctx) => {
  const esFechaEspecifica = data.tipoCalculo === "por_monto_cheque";
  if (esFechaEspecifica) {
    if (!data.fechaPago || data.fechaPago.trim() === "") {
      ctx.addIssue({ path: ["fechaPago"], code: "custom", message: "La fecha de pago es req" });
    }
  } else {
    if (!data.plazo || data.plazo.trim() === "") {
      ctx.addIssue({ path: ["plazo"], code: "custom", message: "El plazo es req" });
    }
  }
});

const result = schema.safeParse({});
console.log(JSON.stringify(result, null, 2));
