import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./Paginacion.module.css";

export const Paginacion = ({
  page,
  onPageChange,
  hasMoreData,
  isLoading,
  knownEndPage,
  variant,
  totalItems,
  pageSize,
  itemLabel = "resultados",
}) => {
  const isAdmin =
    variant === "admin" ||
    (variant !== "client" && typeof window !== "undefined" && window.location.pathname.includes("/admin"));
  const variantClass = isAdmin ? styles.admin : styles.client;

  const handlePrevious = () => {
    if (page > 1 && !isLoading) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (hasMoreData && !isLoading && (!knownEndPage || page < knownEndPage)) {
      onPageChange(page + 1);
    }
  };

  const handlePageClick = (p) => {
    if (!isLoading && p !== page) {
      onPageChange(p);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    if (page > 1) {
      pages.push(page - 1);
    }
    pages.push(page);
    if (
      (hasMoreData || (knownEndPage && page < knownEndPage)) &&
      (!knownEndPage || page < knownEndPage)
    ) {
      pages.push(page + 1);
    }

    return pages.map((p) => (
      <button type="button"
        key={p}
        onClick={() => handlePageClick(p)}
        className={`${styles.pageButton} ${variantClass} ${p === page ? styles.pageButtonActive : ""}`}
        disabled={isLoading}
      >
        {p}
      </button>
    ));
  };

  const isNextDisabled =
    isLoading ||
    (!hasMoreData && (!knownEndPage || page >= knownEndPage)) ||
    (knownEndPage && page >= knownEndPage);

  const showSummary = typeof totalItems === "number" && typeof pageSize === "number" && totalItems > 0;
  const from = showSummary ? (page - 1) * pageSize + 1 : null;
  const to = showSummary ? Math.min(page * pageSize, totalItems) : null;

  return (
    <div className={`${styles.container} ${variantClass} ${showSummary ? styles.withSummary : ""}`}>
      {showSummary && (
        <p className={styles.summary}>
          Mostrando <strong>{from}–{to}</strong> de <strong>{totalItems}</strong> {itemLabel}
        </p>
      )}
      <div className={styles.pagination}>
        <button type="button"
          className={`${styles.pageButton} ${variantClass}`}
          onClick={handlePrevious}
          disabled={page === 1 || isLoading}
        >
          <FiChevronLeft className={styles.icon} />
        </button>
        {renderPageNumbers()}
        <button type="button"
          className={`${styles.pageButton} ${variantClass}`}
          onClick={handleNext}
          disabled={isNextDisabled}
        >
          <FiChevronRight className={styles.icon} />
        </button>
      </div>
    </div>
  );
};
