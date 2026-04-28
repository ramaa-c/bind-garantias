import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '../../../ui';

export const Step4Dinamico = () => {
  const { control } = useFormContext();
  
  // Observamos el valor elegido en el Paso 3 (Paso3Simulador usa el campo 'tipoProducto')
  const tipoProducto = useWatch({
    control,
    name: 'tipoProducto',
    defaultValue: ''
  });

  return (
    <div>
      <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--color-text)', fontWeight: 600 }}>
        Paso 4: Detalles Específicos del Instrumento
      </h3>
      
      {tipoProducto === 'cheque' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
            Banco Emisor del Cheque
          </label>
          <input type="text" className="input-text" placeholder="Ej: Banco Galicia" />
        </div>
      )}

      {tipoProducto === 'prestamo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
            Plazo Solicitado (Meses)
          </label>
          <input type="number" className="input-text" placeholder="Ej: 12" />
        </div>
      )}

      {tipoProducto === 'pagare' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>
            Fecha de Vencimiento del Pagaré
          </label>
          <input type="date" className="input-text" />
        </div>
      )}

      {!tipoProducto && (
        <p style={{ color: 'var(--color-danger)' }}>Error: No se seleccionó un instrumento en el paso anterior.</p>
      )}

      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
        <Button variant="primary" type="submit">
          CONFIRMAR SOLICITUD
        </Button>
      </div>
    </div>
  );
};
