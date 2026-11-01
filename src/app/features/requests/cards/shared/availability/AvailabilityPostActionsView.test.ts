import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import AvailabilityPostActionsView from "./AvailabilityPostActionsView";
import AvailabilityPostActions from "./AvailabilityPostActions";
import PickupInstructions from "./PickupInstructions";
import { CustomerPickupDetails } from "../../customer/progress/CustomerReceiptDetails";
const harness = vi.hoisted(() => ({ model: null }));
vi.mock("./application/useAvailabilityPostActionsController", () => ({ useAvailabilityPostActionsController: () => harness.model }));
function model(overrides = {}) {
  return {
    business: false,
    order: {},
    refresh: vi.fn(),
    process: { state: "IN_PROGRESS", availability: { path: "LOCAL_PICKUP", customerMessage: "Mensaje real\nsegunda l\xEDnea", scheduleOrAddress: "Direcci\xF3n libre 19" } },
    showContactControls: true,
    hasContact: true,
    canAuthorize: false,
    canRevoke: true,
    canCancel: true,
    dialog: null,
    reason: "",
    setDialog: vi.fn(),
    setReason: vi.fn(),
    submit: vi.fn(),
    contact: { busy: false, pending: () => null, needsUpdate: false, restored: () => false, storageWarning: () => "", message: "", run: vi.fn(), retry: vi.fn(), update: vi.fn() },
    operation: { busy: false, error: "", update: vi.fn() },
    ...overrides
  };
}
const html = (value) => renderToStaticMarkup(/* @__PURE__ */ React.createElement(React.Fragment, null, value));
function capture(input) {
  let parts;
  const callback = vi.fn((value) => {
    parts = value;
    return /* @__PURE__ */ React.createElement("div", { "data-custom": true });
  });
  const output = AvailabilityPostActionsView({ model: input, render: callback });
  return { parts, callback, output };
}
describe("availability presentation compatibility and pickup slots", () => {
  it("preserves default markup order, text and classes without render", () => {
    const output = html(/* @__PURE__ */ React.createElement(AvailabilityPostActionsView, { model: model() }));
    expect(output).toContain('<section class="mt-3 space-y-2 text-xs" aria-label="Opciones de esta solicitud">');
    expect(output).toContain('<div class="rounded-xl border border-teal-300/40 p-3"><p class="font-bold">Retiro en el local</p>');
    expect(output).not.toContain("zipco-pickup-");
    expect(output).not.toContain('role="tab');
    expect(output.indexOf("Retiro en el local")).toBeLessThan(output.indexOf("Retirar mi permiso de contacto"));
    expect(output.indexOf("Retirar mi permiso de contacto")).toBeLessThan(output.indexOf("Cancelar retiro"));
  });
  it("uses a single instructions implementation and preserves free text", () => {
    const output = html(/* @__PURE__ */ React.createElement(PickupInstructions, { message: "L\xEDnea 1\nL\xEDnea 2", scheduleOrAddress: "No es una hora: local 19", notReservation: true, variant: "customer" }));
    expect(output).toContain("L\xEDnea 1\nL\xEDnea 2");
    expect(output).toContain("No es una hora: local 19");
    expect(output).toContain("No es una reserva ni un pago verificado.");
    expect(html(/* @__PURE__ */ React.createElement(PickupInstructions, { message: "Mensaje", notReservation: false }))).not.toContain("No es una reserva");
  });
  it("calls render once and reports actual empty fragments as absent", () => {
    const { parts, callback } = capture(model({ showContactControls: false, canCancel: false }));
    expect(callback).toHaveBeenCalledOnce();
    expect(parts.has).toEqual({ instructions: true, reservation: false, contact: false, cancel: false, alerts: false });
    expect(parts.contact).toBeNull();
    expect(parts.cancel).toBeNull();
    expect(parts.alerts).toBeNull();
  });
  it("keeps contact recovery and availability errors outside selectable panels", () => {
    const input = model();
    input.contact.message = "Permiso sin confirmar";
    input.contact.restored = () => true;
    input.operation.error = "Resultado de disponibilidad incierto";
    const { parts } = capture(input), alerts = html(parts.alerts), controls = html(parts.contact);
    expect(parts.has.alerts).toBe(true);
    expect(alerts).toContain("Permiso sin confirmar");
    expect(alerts).toContain("Actualizar permiso de contacto");
    expect(alerts).toContain("Resultado de disponibilidad incierto");
    expect(alerts).toContain("Actualizar estado");
    expect(controls).not.toContain("Permiso sin confirmar");
    const output = html(/* @__PURE__ */ React.createElement(CustomerPickupDetails, { summary: "Pedido", onConditions: () => {
    }, parts }));
    expect(output.indexOf("zipco-pickup-alerts")).toBeLessThan(output.indexOf('role="tablist"'));
  });
  it("does not expose payment-mode consent controls when the existing controller hides them", () => {
    const input = model({ showContactControls: false, canCancel: false });
    input.contact.message = "Not exposed by this mode";
    const { parts } = capture(input);
    expect(parts.contact).toBeNull();
    expect(parts.has.contact).toBe(false);
    expect(parts.has.cancel).toBe(false);
    expect(parts.alerts).toBeNull();
  });
  it("preserves authorization recovery disabled guards", () => {
    const input = model({ canAuthorize: true, canRevoke: false });
    input.contact.restored = () => true;
    const { parts } = capture(input);
    expect(html(parts.contact)).toContain('disabled=""');
    expect(html(parts.contact)).toContain("Autorizo compartir mi tel\xE9fono");
  });
  it("calls render(null) when the availability controller does not apply", () => {
    harness.model = null;
    const callback = vi.fn(() => /* @__PURE__ */ React.createElement("p", null, "Condiciones conservadas"));
    expect(html(/* @__PURE__ */ React.createElement(AvailabilityPostActions, { order: {}, business: false, refresh: () => {
    }, render: callback }))).toBe("<p>Condiciones conservadas</p>");
    expect(callback).toHaveBeenCalledExactlyOnceWith(null);
    expect(html(/* @__PURE__ */ React.createElement(AvailabilityPostActions, { order: {}, business: false, refresh: () => {
    } }))).toBe("");
  });
  it("renders conditions and WhatsApp even when no availability parts are available", () => {
    const output = html(/* @__PURE__ */ React.createElement(CustomerPickupDetails, { summary: "Pedido acordado", onConditions: () => {
    }, onContact: () => {
    }, parts: null }));
    expect(output).toContain("Pedido acordado");
    expect(output).toContain("Escribir al negocio");
    expect(output).not.toContain('role="tablist"');
  });
  it("keeps both tab panels mounted and hides the inactive panel", () => {
    const { parts } = capture(model()), output = html(/* @__PURE__ */ React.createElement(CustomerPickupDetails, { summary: "Pedido", onConditions: () => {
    }, onContact: () => {
    }, parts }));
    expect(output.match(/role="tabpanel"/g)).toHaveLength(2);
    expect(output).toContain('hidden=""');
    expect(output).toContain("Cancelar retiro");
    expect(output.indexOf("Mensaje real")).toBeLessThan(output.indexOf("Condiciones aceptadas"));
  });
  it("does not create a contact tab or label without visible options", () => {
    const { parts } = capture(model({ showContactControls: false, canCancel: false })), output = html(/* @__PURE__ */ React.createElement(CustomerPickupDetails, { summary: "Pedido", onConditions: () => {
    }, parts }));
    expect(output).not.toContain('role="tablist"');
    expect(output).not.toContain("CONTACTO OPCIONAL");
    expect(output).not.toContain("Escribir al negocio");
  });
});
