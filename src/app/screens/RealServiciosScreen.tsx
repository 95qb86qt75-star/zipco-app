import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Search, Wrench } from 'lucide-react';
import { API_BASE_URL } from '../api/apiConfig';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import BottomNav from './BottomNav';

const distanceKm = (a: number, b: number, c: number, d: number) => { const r = Math.PI / 180; const x = Math.sin((c-a)*r/2) ** 2 + Math.cos(a*r)*Math.cos(c*r)*Math.sin((d-b)*r/2) ** 2; return 6371*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x)); };

export default function RealServiciosScreen({ onBack, onSelectService, activeTab, setActiveTab, initialQuery, onQueryChange, initialFilter, onFilterChange, initialMaxDistance, onMaxDistanceChange, currentLocation, initialScrollTop, onScrollTopChange }: any) {
  const [query, setQuery] = useState(initialQuery); const [filter, setFilter] = useState(initialFilter); const [radius, setRadius] = useState(initialMaxDistance);
  const [results, setResults] = useState<any[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const list = useRef<HTMLDivElement>(null);
  useEffect(() => { if (list.current) list.current.scrollTop = initialScrollTop; }, []);
  useEffect(() => {
    const lat = Number(currentLocation?.lat); const lng = Number(currentLocation?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) { setResults([]); return; }
    const controller = new AbortController(); const timer = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius), catalogKind: 'service' });
        if (query.trim().length >= 3) params.set('search', query.trim());
        const response = await fetch(`${API_BASE_URL}/businesses/nearby?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const body = await response.json(); setResults(Array.isArray(body) ? body : []);
      } catch { if (!controller.signal.aborted) setError('No se pudieron cargar los servicios.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [currentLocation?.lat, currentLocation?.lng, query, radius]);
  const shown = results.filter((item) => filter === 'todos' || (filter === 'particular' ? String(item.type).toLowerCase() === 'particular' : String(item.type).toLowerCase() !== 'particular'));
  return <div className="size-full min-h-0 overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col">
    <header className="px-4 pb-2" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}><div className="flex items-center gap-3"><button onClick={onBack} className="p-2"><ArrowLeft className="h-5 w-5" /></button><div className="relative flex-1"><Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => { setQuery(e.target.value); onQueryChange(e.target.value); }} placeholder="Ej: gasfiter, clases, masajes..." className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none focus:border-teal-500" /></div></div>
      <div className="mt-3 flex gap-2">{[['todos','Todos'],['servicios','Empresas'],['particular','Particulares']].map(([id,label]) => <button key={id} onClick={() => { setFilter(id); onFilterChange(id); }} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === id ? 'bg-teal-500 text-white' : 'bg-white text-slate-700'}`}>{label}</button>)}<button onClick={() => { const next = radius === 10 ? 25 : radius === 25 ? 50 : 10; setRadius(next); onMaxDistanceChange(next); }} className="rounded-full bg-blue-500 px-3 py-1.5 text-xs font-bold text-white">{radius} km</button></div></header>
    <main ref={list} onScroll={(e) => onScrollTopChange(e.currentTarget.scrollTop)} className="min-h-0 flex-1 overflow-y-auto px-4 pt-5 pb-24"><p className="mb-4 text-sm text-slate-600">{loading ? 'Buscando servicios…' : `${shown.length} servicios cerca de ti`}</p>{error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{!loading && !error && !currentLocation?.name && <p className="rounded-xl bg-white p-4 text-sm text-slate-600">Selecciona una ubicación para encontrar servicios reales.</p>}<div className="space-y-3">{shown.map((item) => { const km = distanceKm(Number(currentLocation.lat), Number(currentLocation.lng), Number(item.latitude), Number(item.longitude)); const service = { ...item, image: item.photo, distance: km, category: 'servicios' }; return <button key={item.id} onClick={() => onSelectService(service)} className="flex w-full gap-3 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 text-left shadow-md"><div className="relative"><ImageWithFallback src={service.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" /><span className="absolute -right-1 -top-1 rounded-full bg-purple-500 p-1.5"><Wrench className="h-4 w-4 text-white" /></span></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><strong className="text-sm text-slate-950">{item.name}</strong><span className="rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold text-white">Servicio</span></div><p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.description}</p><div className="mt-2 flex gap-2 text-xs"><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{km < 1 ? `${Math.round(km*1000)} m` : `${km.toFixed(1)} km`}</span><span className="rounded-full bg-green-100 px-2 text-green-700">{item.isOpen ? 'Disponible' : 'Cerrado'}</span></div></div></button>; })}</div></main><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
  </div>;
}
