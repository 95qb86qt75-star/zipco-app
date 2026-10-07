import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProposalPhotoAttachment, {
  ProposalPhotoAttachmentView,
} from "./ProposalPhotoAttachment";
import { QuoteCard } from "./QuotesPanel";
import type { QuoteRequest } from "./quoteApi";

const alternativePhoto =
  "https://res.cloudinary.com/zipco/image/upload/proposal.jpg";
const referencePhoto =
  "https://res.cloudinary.com/zipco/image/upload/customer.jpg";

const quote: QuoteRequest = {
  id: 12,
  businessId: 3,
  catalogItemId: 8,
  userId: 5,
  customerName: "Cliente ZIPCO",
  customerPhone: null,
  customerPhoto: null,
  itemNameSnapshot: "Producto alternativo",
  itemDescriptionSnapshot: "Descripción",
  startingPriceClpSnapshot: 4000,
  message: "Necesito este producto",
  needNow: true,
  requestedDate: null,
  requestedTime: null,
  referencePhoto,
  status: "alternative_proposed",
  quotedPriceClp: null,
  businessMessage: null,
  closureReason: null,
  closureReasonDetail: null,
  alternativeDate: null,
  alternativeTime: null,
  alternativeItem: "Alternativa del negocio",
  alternativeQuantity: 1,
  alternativePriceClp: 4200,
  alternativeMessage: "Puedo ofrecerte esta alternativa",
  alternativePhoto,
  customerArchivedAt: null,
  businessArchivedAt: null,
  createdAt: "2026-10-07T12:00:00.000Z",
  updatedAt: "2026-10-07T12:05:00.000Z",
};

function renderQuote(owner: "customer" | "business", value = quote) {
  return renderToStaticMarkup(
    React.createElement(QuoteCard, {
      quote: value,
      owner,
      statusLabel:
        owner === "business" ? "Respuesta enviada" : "Nueva propuesta",
      unread: false,
      onOpen: vi.fn(),
      expanded: true,
      onToggle: vi.fn(),
    }),
  );
}

describe("ProposalPhotoAttachment", () => {
  beforeEach(() => vi.stubGlobal("React", React));
  afterEach(() => vi.unstubAllGlobals());

  it.each(["customer", "business"] as const)(
    "renders the business proposal photo for %s",
    (owner) => {
      const markup = renderQuote(owner);

      expect(markup).toContain("Foto de la propuesta");
      expect(markup).toContain(
        "El negocio adjuntó una imagen de su alternativa",
      );
      expect(markup).toContain("zipco-animated-photo-icon");
      expect(markup).toContain("Abrir");
    },
  );

  it("does not render without alternativePhoto", () => {
    const markup = renderQuote("customer", {
      ...quote,
      alternativePhoto: null,
      referencePhoto: null,
    });

    expect(markup).not.toContain("Foto de la propuesta");
  });

  it("keeps the customer reference and business proposal photos separate", () => {
    const markup = renderQuote("business");

    expect(markup).toContain("Foto de la propuesta");
    expect(markup).toContain("El cliente agregó una foto de referencia.");
    expect(markup.match(/zipco-animated-photo-icon/g)).toHaveLength(2);
  });

  it("renders the full image viewer in its open state", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ProposalPhotoAttachmentView, {
        photoUrl: alternativePhoto,
        isOpen: true,
        onOpen: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("Foto ampliada de la propuesta");
    expect(markup).toContain("Cerrar foto de la propuesta");
    expect(markup).toContain("proposal.jpg");
  });

  it("keeps the viewer closed initially", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ProposalPhotoAttachment, {
        photoUrl: alternativePhoto,
      }),
    );

    expect(markup).not.toContain('role="dialog"');
  });
});
