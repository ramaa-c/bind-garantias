import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import styles from "./Paginacion.module.css";

export const Paginacion = ({
  page,
  onPageChange,
  hasMoreData,
  isLoading,
  knownEndPage,
}) => {
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
      <button
        key={p}
        onClick={() => handlePageClick(p)}
        className={`${styles.pageButton} ${p === page ? styles.pageButtonActive : ""}`}
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

  return (
    <div className={styles.container}>
      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          onClick={handlePrevious}
          disabled={page === 1 || isLoading}
        >
          <FiChevronLeft className={styles.icon} />
        </button>
        {renderPageNumbers()}
        <button
          className={styles.pageButton}
          onClick={handleNext}
          disabled={isNextDisabled}
        >
          <FiChevronRight className={styles.icon} />
        </button>
      </div>
    </div>
  );
};
