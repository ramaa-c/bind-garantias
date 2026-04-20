import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  FiTag,
  FiBriefcase,
  FiBarChart2,
  FiAward,
  FiFileText,
} from "react-icons/fi";
import { SelectSocio } from "../../../ui";
import {
  useTipoPersona,
  useTipoActividadBCRA,
  useTipoActividadSEPYME,
  useTamanioEmpresa,
  useTipoRegimenIva,
} from "../../../../hooks/useCatalogos";

export const SeccionClasificacionSocio = () => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const { data: personaData, isLoading: l1 } = useTipoPersona();
  const { data: bcraData, isLoading: l2 } = useTipoActividadBCRA();
  const { data: sepymeData, isLoading: l3 } = useTipoActividadSEPYME();
  const { data: tamanioData, isLoading: l4 } = useTamanioEmpresa();
  const { data: ivaData, isLoading: l5 } = useTipoRegimenIva();

  const values = useWatch({
    control,
    name: [
      "tipopersonaid",
      "tiporegimenivaid",
      "tamanioempresaid",
      "tipoactividadbcraid",
      "tipoactividadsepymeid",
    ],
  });

  const esValido = (val, err) => !!val && !err;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h3
        style={{
          color: "var(--white)",
          borderBottom: "1px solid #333",
          paddingBottom: "0.5rem",
          margin: 0,
        }}
      >
        Clasificación e IVA
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <SelectSocio
          name="tipopersonaid"
          control={control}
          label="Tipo de Persona"
          icon={<FiTag />}
          options={personaData?.opciones || []}
          disabled={l1}
          esValido={esValido(values[0], errors.tipopersonaid)}
        />
        <SelectSocio
          name="tiporegimenivaid"
          control={control}
          label="Régimen IVA"
          icon={<FiFileText />}
          options={ivaData?.opciones || []}
          disabled={l5}
          esValido={esValido(values[1], errors.tiporegimenivaid)}
        />
        <SelectSocio
          name="tamanioempresaid"
          control={control}
          label="Tamaño Empresa"
          icon={<FiBarChart2 />}
          options={tamanioData?.opciones || []}
          disabled={l4}
          esValido={esValido(values[2], errors.tamanioempresaid)}
        />
        <SelectSocio
          name="tipoactividadbcraid"
          control={control}
          label="Actividad BCRA"
          icon={<FiAward />}
          options={bcraData?.opciones || []}
          disabled={l2}
          esValido={esValido(values[3], errors.tipoactividadbcraid)}
        />
        <SelectSocio
          name="tipoactividadsepymeid"
          control={control}
          label="Actividad SEPYME"
          icon={<FiBriefcase />}
          options={sepymeData?.opciones || []}
          disabled={l3}
          esValido={esValido(values[4], errors.tipoactividadsepymeid)}
        />
      </div>
    </div>
  );
};
