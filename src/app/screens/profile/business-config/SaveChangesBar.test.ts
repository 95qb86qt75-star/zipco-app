import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { businessConfigContentPadding } from '../BusinessConfigScreen';
import SaveChangesBar from './SaveChangesBar';

describe('BusinessConfigScreen save layout', () => {
  it('does not render the save bar when there are no pending changes', () => {
    const html = renderToStaticMarkup(createElement(SaveChangesBar, {
      hasUnsavedChanges: false,
      onSave: vi.fn()
    }));

    expect(html).toBe('');
    expect(businessConfigContentPadding(false)).toBe('pb-24');
  });

  it('renders a compact save bar after general configuration changes', () => {
    const html = renderToStaticMarkup(createElement(SaveChangesBar, {
      hasUnsavedChanges: true,
      onSave: vi.fn()
    }));

    expect(html).toContain('Guardar cambios');
    expect(html).toContain('max(1rem, env(safe-area-inset-bottom))');
    expect(html).not.toContain('Sin cambios pendientes');
    expect(html).not.toContain('pb-28');
    expect(html).toContain('bottom-20');
    expect(businessConfigContentPadding(true)).toBe('pb-40');
  });

  it('keeps final content reachable without the former oversized padding', () => {
    expect(businessConfigContentPadding(false)).not.toBe('pb-48');
    expect(businessConfigContentPadding(true)).not.toBe('pb-48');
  });
});
