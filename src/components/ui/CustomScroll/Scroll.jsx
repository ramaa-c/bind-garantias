import React from 'react';
import styles from './Scroll.module.css';

export const Scroll = ({ children, className = '', maxHeight }) => {
    return (
        <div
            className={`${styles.scrollArea} ${className}`}
            style={{ maxHeight: maxHeight || '100%' }}
        >
            {children}
        </div>
    );
};