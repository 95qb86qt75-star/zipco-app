import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Facebook, Instagram, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const mockProducts = [
  {
    id: 1,
    name: 'Pan de Pascua clásico',
    description: 'Tradicional pan de Pascua con frutos confitados, nueces y almendras',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=400&q=80',
    mode: 'order',
    isAvailable: true
  },
  {
    id: 2,
    name: 'Pan de Pascua frutos secos',
    description: 'Pan de Pascua con almendras, nueces y nueces confitadas',
    price: 14000,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
    mode: 'order',
    isAvailable: true
  },
  {
    id: 3,
    name: 'Queque navideño',
    description: 'Pan caletas de manjar con nueces y pasas',
    price: 8000,
    image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&q=80',
    mode: 'view',
    isAvailable: false
  },
  {
    id: 4,
    name: 'Galletas artesanales',
    description: 'Ricas galletas de jengibre especiadas y decoradas',
    price: 6000,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
    mode: 'order',
    isAvailable: true
  },
  {
    id: 5,
    name: 'Rollitos de canela',
    description: 'Rollitos de canela esponjosos con glaseado',
    price: 3500,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    mode: 'order',
    isAvailable: true
  }
];

function parseProducts(raw: any): any[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: any, i: number) => ({
      id: p.id ?? i + 1,
      name: p.name ?? '',
      description: p.description ?? '',
      price: parseInt(p.price ?? '0'),
      image: p.imageUrl ?? '',
      mode: p.mode ?? 'order',
      isAvailable: true
    }));
  } catch {
    return [];
  }
}

export default function BusinessProfileScreen({ business, onBack, onCheckout }: { business: any; onBack: () => void; onCheckout: (selectedProducts: any[], products: any[]) => void }) {
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [lastClickTime, setLastClickTime] = useState<{ [key: string]: number }>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        setIsScrolled(scrollContainerRef.current.scrollTop > 50);
      }
    };
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const realProducts = parseProducts(business.products);
  const products = realProducts.length > 0 ? realProducts : mockProducts;
  const isRealBusiness = realProducts.length > 0;

  const toggleProductSelection = (productId: any) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductClick = (productId: any, mode: string) => {
    if (mode === 'view') return;
    const now = Date.now();
    const lastClick = lastClickTime[productId] || 0;
    const timeDiff = now - lastClick;

    if (timeDiff < 300 && timeDiff > 0) {
      if (!isSelectionMode) setIsSelectionMode(true);
      toggleProductSelection(productId);
      setLastClickTime({ ...lastClickTime, [productId]: 0 });
    } else if (isSelectionMode) {
      toggleProductSelection(productId);
    } else {
      setLastClickTime({ ...lastClickTime, [productId]: now });
    }
  };

  return (
    <div className="size-full bg-gradient-to-b from-white via-blue-50/30 to-blue-100/40 flex flex-col relative">
      {/* Header fijo */}
      <div className="px-4 pt-6 pb-2 border-b border-white/50 bg-white/80 backdrop-blur-sm">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mb-2">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <motion.div
          animate={{ height: isScrolled ? 70 : 'auto', padding: isScrolled ? '8px' : '20px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-2"
        >
          <div className="flex gap-3 items-center">
            <motion.div animate={{ width: isScrolled ? 50 : 80, height: isScrolled ? 50 : 80 }} transition={{ duration: 0.3 }}>
              <ImageWithFallback
                src={business.image || business.photo}
                alt={business.name}
                className="w-full h-full rounded-full object-cover border-2 border-teal-500"
              />
            </motion.div>

            <div className="flex-1 min-w-0">
              <h2 className={`font-bold text-gray-900 truncate ${isScrolled ? 'text-sm' : 'text-xl mb-1'}`}>
                {business.name}
              </h2>

              {!isScrolled && (
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: isScrolled ? 0 : 1 }} className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${business.type === 'Negocio' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {business.type}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">4.8</span>
                    <span className="text-xs text-gray-500">(23 reseñas)</span>
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                {(business.instagram) && (
                  <button className={`bg-gradient-to-br from-purple-500 to-pink-500 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                    <Instagram className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  </button>
                )}
                {(business.facebook) && (
                  <button className={`bg-blue-600 rounded-full hover:scale-110 transition-all ${isScrolled ? 'p-1.5' : 'p-2'}`}>
                    <Facebook className={`text-white ${isScrolled ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {!isScrolled && (
            <motion.p
              initial={{ opacity: 1, height: 'auto' }}
              animate={{ opacity: isScrolled ? 0 : 1, height: isScrolled ? 0 : 'auto' }}
              transition={{ duration: 0.2 }}
              className="text-sm text-gray-600 leading-relaxed mt-4"
            >
              {business.description || 'Especialistas en repostería artesanal. Más de 10 años creando momentos dulces para tu familia.'}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Products Section */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto px-4 pt-4 pb-28">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {isRealBusiness ? 'Productos y servicios' : 'Productos disponibles'}
        </h3>

        {isRealBusiness && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4 flex items-start gap-2">
            <span className="text-2xl">👆</span>
            <p className="text-xs text-teal-800 leading-relaxed">
              Haz <strong>doble clic</strong> en un producto para agregarlo al pedido
            </p>
          </div>
        )}

        <div className="space-y-3">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            const canOrder = product.mode === 'order';
            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.id, product.mode)}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 border-2 transition-all ${
                  canOrder ? 'cursor-pointer' : 'cursor-default'
                } ${isSelected ? 'border-teal-500 shadow-lg shadow-teal-500/30' : 'border-white/50 shadow-md hover:shadow-lg'}`}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-teal-500/30 rounded-xl flex items-center justify-center">
                        <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900">
                        ${Number(product.price).toLocaleString('es-CL')}
                      </span>
                      {!canOrder && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Solo ver</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Button */}
      {selectedProducts.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
          <button
            onClick={() => onCheckout(selectedProducts, products)}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 px-6 rounded-full font-semibold shadow-xl shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Realizar pedido ({selectedProducts.length})</span>
          </button>
        </div>
      )}
    </div>
  );
}