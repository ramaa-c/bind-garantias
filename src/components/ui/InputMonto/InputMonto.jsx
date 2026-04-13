import React from "react";
import styles from "./InputMonto.module.css";

const formatNumber = (val) => {
  if (!val) return "";
  return new Intl.NumberFormat("es-AR").format(val);
};

const cleanNumber = (val) => val.replace(/\D/g, "");

export const InputMonto = React.forwardRef(
  (
    { label, error, currency = "$", esValido, id, onChange, value, ...props },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || props.name || generatedId;
    const inputRef = React.useRef(null);

    React.useImperativeHandle(ref, () => inputRef.current);

    const [displayValue, setDisplayValue] = React.useState(() =>
      value ? formatNumber(value) : "",
    );

    React.useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(formatNumber(value));
      }
    }, [value]);

    const handleChange = (e) => {
      const raw = e.target.value;
      const numeric = cleanNumber(raw);
      const cursorPos = e.target.selectionStart;
      const digitsBeforeCursor = cleanNumber(raw.slice(0, cursorPos)).length;

      const formatted = formatNumber(numeric);
      setDisplayValue(formatted);

      onChange?.({
        ...e,
        target: { ...e.target, value: numeric },
      });

      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;

        let digitCount = 0;
        let newPos = formatted.length;

        for (let i = 0; i < formatted.length; i++) {
          if (/\d/.test(formatted[i])) digitCount++;
          if (digitCount === digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }

        el.setSelectionRange(newPos, newPos);
      });
    };

    const handleKeyDown = (e) => {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Tab",
      ];
      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/^\d$/.test(e.key)) e.preventDefault();
    };

    const errorId = `${inputId}-error`;

    return (
      <div className={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}

        <div
          className={`${styles.container} ${esValido ? styles.valid : ""} ${error ? styles.invalid : ""}`}
        >
          <span className={styles.currency} aria-hidden="true">
            {currency}
          </span>

          <input
            id={inputId}
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="0"
            ref={inputRef}
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            {...props}
          />
        </div>

        {error && (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  },
);

InputMonto.displayName = "InputMonto";
