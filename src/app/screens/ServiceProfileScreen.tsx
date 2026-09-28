import { useEffect, useState } from 'react';
import { Eye, ArrowLeft, Facebook, Heart, Instagram } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import BottomNav from './BottomNav';
import { getCatalogItemAction, getCatalogPricingCounts, getPublicCatalogPriceLabel } from './catalogItemPresentation';
import { showAppToast } from './Toast';
import type { CatalogItem, CatalogItemPricingMode } from './profile/business-config/types';
import { getPublicCatalog } from './profile/business-config/catalogApi';
import QuoteRequestModal from './quotes/QuoteRequestModal';

const PRICING_MODES: CatalogItemPricingMode[] = ['fixed_price', 'quote', 'view'];

function getServiceCatalog(service: any): CatalogItem[] {
  const source = Array.isArray(service.catalogItems)
    ? service.catalogItems
    : Array.isArray(service.services)
      ? service.services
      : [];

  return source.map((item: any, index: number) => {
    const pricingMode = PRICING_MODES.includes(item.pricingMode) ? item.pricingMode : 'quote';
    return {
      id: Number(item.id ?? index + 1),
      businessId: Number(service.id) || 0,
      name: String(item.name ?? 'Servicio'),
      description: String(item.description ?? ''),
      kind: 'service',
      pricingMode,
      priceClp: pricingMode === 'fixed_price' && item.priceClp != null && Number.isFinite(Number(item.priceClp)) ? Number(item.priceClp) : null,
      startingPriceClp: pricingMode === 'quote' && item.startingPriceClp != null && Number.isFinite(Number(item.startingPriceClp)) ? Number(item.startingPriceClp) : null,
      imageUrl: String(item.imageUrl ?? item.image ?? service.image ?? ''),
      isActive: true,
      displayOrder: Number(item.displayOrder ?? index),
      createdAt: String(item.createdAt ?? ''),
      updatedAt: String(item.updatedAt ?? '')
    };
  });
}

export default function ServiceProfileScreen({ service, isFavorite, onToggleFavorite, onBack, onRequestService, onSessionExpired, activeTab, setActiveTab }: { service: any; isFavorite?: boolean; onToggleFavorite?: () => void; onBack: () => void; onRequestService: (selectedService: any) => void; onSessionExpired?: () => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() => getServiceCatalog(service));
  const [quoteItem, setQuoteItem] = useState<CatalogItem | null>(null);
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => {
    let active = true; setCatalogError('');
    getPublicCatalog(Number(service.id)).then((items) => { if (active) setCatalogItems(items.filter((item) => item.kind === 'service')); }).catch(() => { if (active) { setCatalogItems([]); setCatalogError('No se pudo cargar el catálogo del servicio.'); } });
    return () => { active = false; };
  }, [service.id]);
  const pricingCounts = getCatalogPricingCounts(catalogItems);

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
      {/* Header */}
      <div
        className="px-4 pb-4 border-b border-white/50"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Perfil del Servicio</h2>
          <button type="button" onClick={onToggleFavorite} className="ml-auto rounded-full bg-white p-2 shadow-sm ring-1 ring-slate-100" aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
            <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-28">
        {/* Profile Card */}
        <div className="bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 rounded-3xl overflow-hidden shadow-2xl mb-4 border border-white/20">
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <ImageWithFallback
                src={service.image}
                alt={service.name}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{service.name}</h3>
                <p className="text-sm text-white/90 mb-2">{service.description}</p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                    {service.type === 'Negocio' ? 'Empresa' : 'Independiente'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    service.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {service.isOpen ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="flex gap-3">
              <a
                href={`https://instagram.com/${service.instagram?.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
              >
                <Instagram className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Instagram</span>
              </a>
              <a
                href={`https://facebook.com/${service.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
              >
                <Facebook className="w-5 h-5 text-white" />
                <span className="text-sm font-semibold text-white">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* Services catalog */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-md">
          <h4 className="font-bold text-gray-900 mb-3">Productos y servicios</h4>
          <div className="mb-3 grid grid-cols-3 items-stretch gap-1 rounded-2xl border border-teal-100 bg-white/80 p-2 shadow-sm">
            <div className="flex min-w-0 items-center justify-center rounded-full bg-teal-50 px-1.5 py-1.5 text-teal-700">
              <span className="truncate text-[10px] font-bold">Precio fijo <span className="text-slate-400">({pricingCounts.fixed_price})</span></span>
            </div>
            <div className="flex min-w-0 items-center justify-center rounded-full bg-violet-50 px-1.5 py-1.5 text-violet-700">
              <span className="truncate text-[10px] font-bold">Cotizar <span className="text-slate-400">({pricingCounts.quote})</span></span>
            </div>
            <div className="flex min-w-0 items-center justify-center rounded-full bg-slate-50 px-1.5 py-1.5 text-slate-700">
              <span className="truncate text-[10px] font-bold">Solo ver <span className="text-slate-400">({pricingCounts.view})</span></span>
            </div>
          </div>
          <div className="space-y-3">
            {catalogError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{catalogError}</p>}
            {catalogItems.map((item) => {
              const action = getCatalogItemAction(item);
              const priceLabel = getPublicCatalogPriceLabel(item);
              return (
              <div
                key={item.id}
                className="w-full rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h5 className="mb-1 font-bold text-purple-900">{item.name}</h5>
                    <p className="text-sm text-purple-700">{item.description}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {priceLabel && <span className="text-sm font-bold text-purple-700">{priceLabel}</span>}
                    {action === 'quote-soon' ? (
                      <button type="button" onClick={() => setQuoteItem(item)} className="rounded-lg border border-violet-400 bg-white px-3 py-1.5 text-xs font-bold text-violet-600">Cotizar</button>
                    ) : action === 'view' ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600"><Eye className="h-3.5 w-3.5" /> Ver</span>
                    ) : (
                      <button type="button" onClick={() => onRequestService(item)} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white">Solicitar</button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      {quoteItem && <QuoteRequestModal businessId={Number(service.id)} item={quoteItem} onClose={() => setQuoteItem(null)} onCreated={() => undefined} onSessionExpired={onSessionExpired} />}
    </div>
  );
}

