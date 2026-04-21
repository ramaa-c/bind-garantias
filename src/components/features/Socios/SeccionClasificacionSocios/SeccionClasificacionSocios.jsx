import React from "react";
import { useFormContext } from "react-hook-form";
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
import styles from "./SeccionClasificacionSocios.module.css";

export const SeccionClasificacionSocios = () => {
  const { control } = useFormContext();

  const { data: personaData, isLoading: l1 } = useTipoPersona();
  const { data: bcraData, isLoading: l2 } = useTipoActividadBCRA();
  const { data: sepymeData, isLoading: l3 } = useTipoActividadSEPYME();
  const { data: tamanioData, isLoading: l4 } = useTamanioEmpresa();
  const { data: ivaData, isLoading: l5 } = useTipoRegimenIva();

  return (
    <div>
      <h3 className={styles.sectionTitle}>Clasificación e IVA</h3>
      <div className={styles.inputRow}>
        <SelectSocio
          name="tipopersonaid"
          control={control}
          label="Tipo de Persona"
          icon={<FiTag />}
          options={personaData?.opciones || []}
          disabled={l1}
        />
        <SelectSocio
          name="tiporegimenivaid"
          control={control}
          label="Régimen IVA"
          icon={<FiFileText />}
          options={ivaData?.opciones || []}
          disabled={l5}
        />
        <SelectSocio
          name="tamanioempresaid"
          control={control}
          label="Tamaño Empresa"
          icon={<FiBarChart2 />}
          options={tamanioData?.opciones || []}
          disabled={l4}
        />
        <SelectSocio
          name="tipoactividadbcraid"
          control={control}
          label="Actividad BCRA"
          icon={<FiAward />}
          options={bcraData?.opciones || []}
          disabled={l2}
        />
        <SelectSocio
          name="tipoactividadsepymeid"
          control={control}
          label="Actividad SEPYME"
          icon={<FiBriefcase />}
          options={sepymeData?.opciones || []}
          disabled={l3}
        />
      </div>
    </div>
  );
};
