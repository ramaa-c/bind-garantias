import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiSearch, FiTag } from "react-icons/fi";
import styles from "./CadenaSelectCard.module.css";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";

export const CadenaSelectCard = ({
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar Cadena de Valor...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedChain = options.find(
    (c) => String(c.cadenavalorid) === String(value),
  );

  const filteredOptions = options.filter(
    (c) =>
      (c.denominacion || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.cuittercero || "").includes(search),
  );

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearch("");
  };

  const getLogoSrc = (logoData) => {
    if (!logoData) return "";
    if (logoData.startsWith("data:") || logoData.startsWith("http"))
      return logoData;
    return `data:image/png;base64,${logoData}`;
  };

  const getInitials = (name) => {
    if (!name) return "CV";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  };

  const colorMap = React.useMemo(() => {
    const colors = [
      "#4c65e6",
      "#e64c65",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
      "#f43f5e",
      "#14b8a6",
      "#a855f7",
      "#eab308",
      "#3b82f6",
      "#ef4444",
      "#22c55e",
      "#f97316",
    ];
    const map = new Map();
    let idx = 0;
    options.forEach((opt) => {
      const name = opt.denominacion || "Unknown";
      if (!map.has(name)) {
        map.set(name, colors[idx % colors.length]);
        idx++;
      }
    });
    return map;
  }, [options]);

  const getAvatarColor = (name) => {
    return colorMap.get(name || "Unknown") || "#4c65e6";
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* Trigger Area */}
      <div
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""} ${!selectedChain ? styles.triggerEmpty : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedChain ? (
          <div
            className={styles.cardWrapper}
            style={!selectedChain.activaOperativa ? { opacity: 0.6, filter: "grayscale(100%)" } : {}}
          >
            <CadenaHeaderCard
              denominacion={selectedChain.denominacion + (!selectedChain.activaOperativa ? " (INACTIVA)" : "")}
              logo={selectedChain.logo}
              referencia={selectedChain.referencia}
              cadenavalorid={selectedChain.cadenavalorid}
              cuittercero={selectedChain.cuittercero}
              avatarColor={getAvatarColor(selectedChain.denominacion)}
            />
          </div>
        ) : (
          <div className={styles.emptyContent}>
            <div className={styles.avatarPlaceholderHollow}>?</div>
            <span className={styles.emptyText}>{placeholder}</span>
          </div>
        )}
        <div className={styles.chevronWrapper}>
          <FiChevronDown
            className={`${styles.chevron} ${isOpen ? styles.chevronUp : ""}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar por nombre o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>

          <div className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.noResults}>
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((c) => {
                const logoSrc = getLogoSrc(c.logo);
                const isSelected = String(c.cadenavalorid) === String(value);

                return (
                  <div
                    key={c.cadenavalorid}
                    className={`${styles.optionItem} ${isSelected ? styles.optionSelected : ""}`}
                    onClick={() => handleSelect(c.cadenavalorid)}
                    style={!c.activaOperativa ? { opacity: 0.6, filter: "grayscale(100%)" } : {}}
                  >
                    <div className={styles.optionLogoBox}>
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={c.denominacion}
                          className={styles.optionLogo}
                        />
                      ) : (
                        <div
                          className={styles.optionAvatar}
                          style={{
                            backgroundColor: getAvatarColor(c.denominacion),
                          }}
                        >
                          {getInitials(c.denominacion)}
                        </div>
                      )}
                    </div>
                    <div className={styles.optionInfo}>
                      <span className={styles.optionName}>
                        {c.denominacion || "Cadena sin nombre"}
                        {!c.activaOperativa && (
                          <span style={{ color: "var(--red, #ef4444)", fontSize: "0.75rem", marginLeft: "0.5rem", fontWeight: "bold" }}>
                            (INACTIVA)
                          </span>
                        )}
                      </span>
                      <div className={styles.optionMeta}>
                        <span className={styles.optionId}>
                          ID: {c.cadenavalorid}
                        </span>
                        {c.cuittercero && <span>• CUIT: {c.cuittercero}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
