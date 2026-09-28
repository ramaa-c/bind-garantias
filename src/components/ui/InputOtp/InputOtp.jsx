import React, { useRef, useState, useEffect } from "react";
import styles from "./InputOtp.module.css";

export const InputOTP = ({
  value = "",
  onChange,
  error,
  esValido = false,
  disabled = false,
  length = 6,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputsRef = useRef([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  const errorMessage =
    error?.message || (typeof error === "string" ? error : null);
  const hasError = !!error;

  useEffect(() => {
    const firstEmpty = digits.findIndex((d) => d === "");
    const target = firstEmpty === -1 ? length - 1 : firstEmpty;
    inputsRef.current[target]?.focus();
  }, []);

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        const next = value.split("");
        next[index] = "";
        onChange(next.join("").replace(/\s/g, ""));
      } else if (index > 0) {
        const next = value.split("");
        next[index - 1] = "";
        onChange(next.join("").replace(/\s/g, ""));
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }

    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
      return;
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleInput = (e, index) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) return;

    const chars = raw.slice(0, length - index).split("");
    const next = digits.slice();
    chars.forEach((c, i) => {
      if (index + i < length) next[index + i] = c;
    });
    onChange(next.join(""));

    const nextIndex = Math.min(index + chars.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted.padEnd(length, "").slice(0, length).replace(/\s/g, ""));
    const nextFocus = Math.min(pasted.length, length - 1);
    inputsRef.current[nextFocus]?.focus();
  };

  const getStatusClass = (index) => {
    if (hasError) return styles.statusError;
    if (focusedIndex === index) return styles.statusFocus;
    if (esValido) return styles.statusSuccess;
    if (digits[index]) return styles.statusFilled;
    return styles.statusDefault;
  };

  return (
    <div className={styles.group}>
      <div className={styles.grid}>
        {digits.map((digit, index) => (
          <div
            key={index}
            className={`${styles.cellWrapper} ${getStatusClass(index)}`}
          >
            <input
              ref={(el) => (inputsRef.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              className={styles.cell}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onInput={(e) => handleInput(e, index)}
              onPaste={handlePaste}
              onChange={() => {}}
              aria-label={`Dígito ${index + 1} de ${length}`}
              autoComplete="one-time-code"
            />
          </div>
        ))}
      </div>

      <div style={{ minHeight: "1.25rem" }}>
        {hasError && (
          <span className={styles.errorMsg} role="alert">
            {errorMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default InputOTP;
