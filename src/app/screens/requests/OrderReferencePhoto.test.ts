import * as React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hooks = vi.hoisted(() => ({ open: false, effect: null as null | (() => undefined | (() => void)),
  ref: { current: null as null | { focus: () => void } }, portal: vi.fn() }));
vi.mock('react', async (original) => ({ ...await original<typeof import('react')>(),
  useState: () => [hooks.open, (value: boolean) => { hooks.open = value; }],
  useRef: () => hooks.ref,
  useEffect: (effect: () => undefined | (() => void)) => { hooks.effect = effect; },
}));
vi.mock('react-dom', async (original) => ({ ...await original<typeof import('react-dom')>(),
  createPortal: (children: React.ReactNode, target: unknown) => { hooks.portal(target); return children; },
}));
import OrderReferencePhoto from './OrderReferencePhoto';

type Node = React.ReactElement<Record<string, unknown> & { children?: React.ReactNode }>;
const nodes = (root: React.ReactNode): Node[] => React.Children.toArray(root).flatMap((child) =>
  React.isValidElement(child) ? [child as Node, ...nodes((child as Node).props.children)] : []);
const render = (business = false) => OrderReferencePhoto({ src: 'https://example.test/reference.jpg', business });
const click = (node: Node) => { const event = { stopPropagation: vi.fn() }; (node.props.onClick as (event: unknown) => void)(event); return event; };
class FocusTarget { isConnected = true; focus = vi.fn(); }
let origin: FocusTarget;
beforeEach(() => {
  hooks.open = false; hooks.ref.current = null; hooks.effect = null; hooks.portal.mockClear();
  origin = new FocusTarget();
  vi.stubGlobal('HTMLElement', FocusTarget); vi.stubGlobal('React', React);
  vi.stubGlobal('document', { body: { style: { overflow: 'auto' } }, activeElement: origin,
    addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

describe('reference photo overlay outside clipped cards (DOM and portal simulated)', () => {
  it.each([false, true])('places the dialog on body with a visible safe-area close control (business=%s)', (business) => {
    click(nodes(render(business)).find((node) => node.type === 'button')!);
    const view = render(business);
    expect(hooks.portal).toHaveBeenLastCalledWith(document.body);
    const dialog = nodes(view).find((node) => node.props.role === 'dialog')!;
    expect(dialog.props.className).toContain('fixed inset-0 z-[1000]');
    expect(dialog.props.className).toContain('h-[100dvh]');
    expect(dialog.props.style).toMatchObject({ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' });
    const close = nodes(view).find((node) => node.props['aria-label'] === 'Cerrar imagen')!;
    expect(close.props.className).toContain('h-12 w-12');
    expect(close.props.className).toContain('bg-white text-slate-950');
    expect(close.props.type).toBe('button');
    expect(click(close).stopPropagation).toHaveBeenCalledOnce();
    expect(nodes(render(business)).some((node) => node.props.role === 'dialog')).toBe(false);
  });
  it('keeps image clicks inside and closes from the backdrop without toggling the card', () => {
    hooks.open = true; const view = render();
    const imageContainer = nodes(view).find((node) => node.props.className?.toString().includes('min-h-0 flex-1'))!;
    expect(click(imageContainer).stopPropagation).toHaveBeenCalledOnce(); expect(hooks.open).toBe(true);
    const dialog = nodes(view).find((node) => node.props.role === 'dialog')!;
    expect(click(dialog).stopPropagation).toHaveBeenCalledOnce(); expect(hooks.open).toBe(false);
  });
  it('focuses close, traps Tab, handles Escape and restores focus/scroll after closing', () => {
    hooks.open = true; render();
    const focus = vi.fn(); hooks.ref.current = { focus };
    const cleanup = hooks.effect!()!;
    expect(focus).toHaveBeenCalledOnce(); expect(document.body.style.overflow).toBe('hidden');
    const keydown = vi.mocked(document.addEventListener).mock.calls.find(([event]) => event === 'keydown')![1] as (event: unknown) => void;
    for (const shiftKey of [false, true]) {
      const event = { key: 'Tab', shiftKey, preventDefault: vi.fn(), stopPropagation: vi.fn() };
      keydown(event); expect(event.preventDefault).toHaveBeenCalledOnce(); expect(hooks.open).toBe(true);
    }
    expect(focus).toHaveBeenCalledTimes(3);
    keydown({ key: 'Escape', preventDefault: vi.fn(), stopPropagation: vi.fn() });
    expect(hooks.open).toBe(false);
    cleanup();
    expect(document.body.style.overflow).toBe('auto'); expect(origin.focus).toHaveBeenCalledOnce();
    expect(document.removeEventListener).toHaveBeenCalledWith('keydown', keydown);
  });
  it('does not install listeners or lock scrolling while closed or without a photo', () => {
    render(); expect(hooks.effect!()).toBeUndefined();
    hooks.open = true; expect(OrderReferencePhoto({ src: null })).toBeNull();
    expect(hooks.effect!()).toBeUndefined();
    expect(document.body.style.overflow).toBe('auto'); expect(document.addEventListener).not.toHaveBeenCalled();
  });
});
