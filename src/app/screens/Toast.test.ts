import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Toast, { createToastNotification, mergeToastNotification } from './Toast';

describe('Toast', () => {
  it('keeps legacy message notifications compatible', () => {
    const notification = createToastNotification('Cambios guardados');
    const markup = renderToStaticMarkup(React.createElement(Toast, { notification, onClose: () => undefined }));

    expect(markup).toContain('Cambios guardados');
    expect(markup).toContain('Cerrar notificación');
    expect(markup).toContain('role="status"');
    expect(notification.durationMs).toBe(3000);
  });

  it('renders the enriched accessible notification and close control', () => {
    const notification = createToastNotification('', 'success', {
      title: 'Cotizaciones: próximamente',
      description: 'Pronto podrás solicitar cotizaciones desde ZIPCO.'
    });
    const markup = renderToStaticMarkup(React.createElement(Toast, { notification, onClose: () => undefined }));

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('Cotizaciones: próximamente');
    expect(markup).toContain('Pronto podrás solicitar cotizaciones desde ZIPCO.');
    expect(markup).toContain('aria-label="Cerrar notificación"');
    expect(notification.durationMs).toBe(5000);
  });

  it('does not replace an active notification with an identical duplicate', () => {
    const current = createToastNotification('', 'success', {
      title: 'Cotizaciones: próximamente',
      dedupeKey: 'quote-soon'
    });
    const duplicate = createToastNotification('', 'success', {
      title: 'Cotizaciones: próximamente',
      dedupeKey: 'quote-soon'
    });

    expect(mergeToastNotification(current, duplicate)).toBe(current);
  });

  it('allows a different notification to replace the current one', () => {
    const current = createToastNotification('Guardado', 'success');
    const next = createToastNotification('No se pudo guardar', 'error');

    expect(mergeToastNotification(current, next)).toBe(next);
  });

  it.each([
    ['success', 'bg-teal-400'],
    ['error', 'bg-red-500'],
    ['warning', 'bg-amber-500'],
    ['info', 'bg-sky-500']
  ] as const)('renders the %s notification with its corresponding tone', (type, toneClass) => {
    const notification = createToastNotification(`Mensaje ${type}`, type);
    const markup = renderToStaticMarkup(React.createElement(Toast, { notification, onClose: () => undefined }));

    expect(markup).toContain(`Mensaje ${type}`);
    expect(markup).toContain(toneClass);
  });
});
