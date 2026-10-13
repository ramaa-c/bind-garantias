import { useMutation } from "@tanstack/react-query";
import { smsService } from "../services/smsService";

export const useValidarNumero = () => {
  return useMutation({
    mutationFn: ({ nroTelefono, codigo }) =>
      smsService.validarNumero(nroTelefono, codigo),
  });
};
