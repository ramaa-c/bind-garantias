import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars -- ESLint no rastrea el uso de "components" como tag JSX (<components.Control>)
import Select, { components } from "react-select";
import { useDebounce } from "use-debounce";
import { FiSearch } from "react-icons/fi";
import styles from "./BuscadorListado.module.css";

const Control = ({ children, ...props }) => (
  <components.Control {...props}>
    <FiSearch className={styles.searchIcon} />
    {children}
  </components.Control>
);

export const BuscadorListado = ({ valor, onChangeText, onLimpiar }) => {
  const [inputValue, setInputValue] = useState(valor || "");
  const [prevValor, setPrevValor] = useState(valor);

  if (valor !== prevValor) {
    setPrevValor(valor);
    if (valor === "") {
      setInputValue("");
    }
  }
  const [debouncedValue] = useDebounce(inputValue, 500);

  useEffect(() => {
    if (debouncedValue !== valor) {
      if (onChangeText) onChangeText(debouncedValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);



  const handleInputChange = (newVal, { action }) => {
    if (action === "input-change") {
      setInputValue(newVal);
    }
  };

  const handleChange = (selectedOption, { action }) => {
    if (action === "clear") {
      setInputValue("");
      if (onLimpiar) onLimpiar();
      if (onChangeText) onChangeText("");
    }
  };

  const classNamesConfig = {
    control: (state) =>
      state.isFocused ? styles.controlFocused : styles.control,
    input: () => styles.input,
    placeholder: () => styles.placeholder,
    valueContainer: () => styles.valueContainer,
    clearIndicator: () => styles.clearIndicator,
    indicatorSeparator: () => styles.hidden,
    dropdownIndicator: () => styles.hidden,
    menu: () => styles.hidden,
  };

  return (
    <div className={styles.container}>
      <Select
        value={null}
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onChange={handleChange}
        isClearable={inputValue.length > 0}
        placeholder="Buscar por Denominación o CUIT..."
        classNames={classNamesConfig}
        components={{ Control }}
        aria-label="Buscador avanzado listado"
      />
    </div>
  );
};
