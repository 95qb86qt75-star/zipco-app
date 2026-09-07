import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RegistrationFlow from './RegistrationFlow';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RegistrationFlow layout', () => {
  it('allows vertical scrolling without horizontal overflow', () => {
    vi.stubGlobal('React', React);

    const markup = renderToStaticMarkup(React.createElement(RegistrationFlow, {
      onComplete: () => undefined
    }));
    const containerClass = markup.match(/class="([^"]*max-w-md[^"]*)"/)?.[1];

    expect(containerClass).toContain('h-full');
    expect(containerClass).toContain('overflow-x-hidden');
    expect(containerClass).toContain('overflow-y-auto');
    expect(containerClass).not.toContain('overflow-hidden');
  });
});
