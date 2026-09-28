import api from "../api/axios";

export const smsService = {
  // POST api/ValidarNumero
  // noRetry: este endpoint dispara un SMS real (cupo de pruebas limitado):
  // no queremos que el interceptor lo reintente solo ante un 5xx/red caído.
  validarNumero: async (nroTelefono, codigo = "") =>
    (
      await api.post(
        "api/ValidarNumero",
        { NroTelefono: nroTelefono, Codigo: codigo },
        { noRetry: true },
      )
    ).data,
};
