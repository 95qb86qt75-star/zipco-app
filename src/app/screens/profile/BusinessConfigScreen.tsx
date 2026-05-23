import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { showAppToast } from '../Toast';
import CategoryPickerModal from './business-config/CategoryPickerModal';
import CategorySelectionCard from './business-config/CategorySelectionCard';
import KeywordsCard from './business-config/KeywordsCard';
import LocalStatusCard from './business-config/LocalStatusCard';
import LocationPrivacyCard from './business-config/LocationPrivacyCard';
import PhysicalAttendanceCard from './business-config/PhysicalAttendanceCard';
import ScheduleCard from './business-config/ScheduleCard';
import { businessCategories, businessDays, emptySchedule } from './business-config/businessConfigData';

type BusinessProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  mode: 'order' | 'view';
  imageUrl: string;
};

const MIN_PRODUCT_PRICE = 100;

export default function BusinessConfigScreen({
  onBack,
  onSave
}: {
  onBack: () => void;
  onSave: (config: any) => void;
}) {
  const [category, setCategory] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [fullAddress, setFullAddress] = useState('');
  const [schedule, setSchedule] = useState(emptySchedule);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [hasLocationSearched, setHasLocationSearched] = useState(false);
  const [locationTouched, setLocationTouched] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [hasPhysicalStore, setHasPhysicalStore] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);
  const [products, setProducts] = useState<BusinessProduct[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [isUploadingProductPhoto, setIsUploadingProductPhoto] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    mode: 'order' as 'order' | 'view',
    imageUrl: ''
  });

  const markChanged = useCallback(() => setHasUnsavedChanges(true), []);

  const handleCategoryChange = (val: string) => { setCategory(val); markChanged(); };
  const handleFullAddressChange = (val: string) => { setFullAddress(val); markChanged(); };
  const handleShowFullAddressChange = (val: boolean) => { setShowFullAddress(val); markChanged(); };
  const handleScheduleChange = (val: any) => { setSchedule(val); markChanged(); };
  const handlePhysicalStoreChange = (val: boolean) => { setHasPhysicalStore(val); markChanged(); };

  const addKeyword = (value: string) => {
    const nextKeyword = value.trim();
    if (!nextKeyword) return;
    setKeywords((currentKeywords) => {
      if (currentKeywords.includes(nextKeyword)) return currentKeywords;
      markChanged();
      return [...currentKeywords, nextKeyword];
    });
    setKeywordInput('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords((currentKeywords) => {
      markChanged();
      return currentKeywords.filter((keyword) => keyword !== keywordToRemove);
    });
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      mode: 'order',
      imageUrl: ''
    });
    setEditingProductId(null);
  };

  const getProductPriceDigits = (value: string) => value.replace(/\D/g, '');

  const formatChileanPrice = (value: string) => {
    const digits = getProductPriceDigits(value);
    return digits ? `$${Number(digits).toLocaleString('es-CL')}` : '';
  };

  const handleProductPriceChange = (value: string) => {
    setProductForm({ ...productForm, price: getProductPriceDigits(value) });
  };

  const startEditingProduct = (product: BusinessProduct) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: getProductPriceDigits(product.price),
      mode: product.mode,
      imageUrl: product.imageUrl
    });
    setEditingProductId(product.id);
    setShowProductForm(true);
  };

  const addProduct = () => {
    const productName = productForm.name.trim();
    const productPrice = getProductPriceDigits(productForm.price);

    if (!productName) {
      showAppToast('Ingresa el nombre del producto o servicio', 'error');
      return;
    }

    if (productPrice && Number(productPrice) < MIN_PRODUCT_PRICE) {
      showAppToast('El precio minimo debe ser $100', 'error');
      return;
    }

    if (editingProductId) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingProductId
            ? {
                ...product,
                name: productName,
                description: productForm.description.trim(),
                price: productPrice,
                mode: productForm.mode,
                imageUrl: productForm.imageUrl
              }
            : product
        )
      );
    } else {
      setProducts((currentProducts) => [
        ...currentProducts,
        {
        id: `${Date.now()}`,
        name: productName,
        description: productForm.description.trim(),
        price: productPrice,
        mode: productForm.mode,
        imageUrl: productForm.imageUrl
        }
      ]);
    }

    resetProductForm();
    setShowProductForm(false);
    markChanged();
  };

  const removeProduct = (productId: string) => {
    setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
    if (editingProductId === productId) {
      resetProductForm();
      setShowProductForm(false);
    }
    markChanged();
  };

  const uploadProductPhoto = async (file: File) => {
    setIsUploadingProductPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'zipco_products');

      const response = await fetch('https://api.cloudinary.com/v1_1/dr6xu5xr9/image/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        showAppToast('No se pudo subir la foto del producto', 'error');
        return;
      }

      const data = await response.json();
      setProductForm((currentForm) => ({ ...currentForm, imageUrl: data.secure_url ?? data.url ?? '' }));
      showAppToast('Foto subida correctamente', 'success');
    } catch (error) {
      showAppToast('No se pudo subir la foto del producto', 'error');
    } finally {
      setIsUploadingProductPhoto(false);
    }
  };

  const handleBackPress = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      onBack();
    }
  };

  const handleToggleOpen = async () => {
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');
    if (!businessId || !token) return;

    setIsTogglingOpen(true);
    const newValue = !isOpen;

    try {
      const response = await fetch(`https://zipco-backend-production.up.railway.app/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isOpen: newValue })
      });

      if (!response.ok) {
        showAppToast('No se pudo actualizar el estado del local', 'error');
        return;
      }

      setIsOpen(newValue);
      showAppToast(
        newValue ? 'El local vuelve a usar el horario configurado' : 'Local cerrado temporalmente',
        newValue ? 'success' : 'error'
      );
    } catch {
      showAppToast('No se pudo actualizar el estado del local', 'error');
    } finally {
      setIsTogglingOpen(false);
    }
  };

  useEffect(() => {
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) return;

    const parseSchedule = (value: any) => {
      if (!value) return emptySchedule;
      try {
        const parsedSchedule = typeof value === 'string' ? JSON.parse(value) : value;
        return {
          ...emptySchedule,
          ...(parsedSchedule && typeof parsedSchedule === 'object' ? parsedSchedule : {})
        };
      } catch (error) {
        return emptySchedule;
      }
    };

    const parseProducts = (value: any): BusinessProduct[] => {
      if (!value) return [];

      try {
        const parsedProducts = typeof value === 'string' ? JSON.parse(value) : value;
        return Array.isArray(parsedProducts)
          ? parsedProducts.map((product, index) => ({
              id: String(product.id ?? `${Date.now()}-${index}`),
              name: String(product.name ?? '').trim(),
              description: String(product.description ?? '').trim(),
              price: getProductPriceDigits(String(product.price ?? '')),
              mode: product.mode === 'view' ? 'view' : 'order',
              imageUrl: String(product.imageUrl ?? product.image_url ?? '').trim()
            })).filter((product) => product.name)
          : [];
      } catch (error) {
        return [];
      }
    };

    const loadBusinessConfig = async () => {
      try {
        const response = await fetch(`https://zipco-backend-production.up.railway.app/businesses/${businessId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          showAppToast('No se pudo cargar la configuracion del negocio', 'error');
          return;
        }

        const data = await response.json();
        const business = data.business ?? data;
        const loadedKeywords = business.keywords;

        setCategory(business.category ?? '');
        setKeywords(
          Array.isArray(loadedKeywords)
            ? loadedKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
            : String(loadedKeywords ?? '').split(',').map((keyword) => keyword.trim()).filter(Boolean)
        );
        setSchedule(parseSchedule(business.schedule));
        setProducts(parseProducts(business.products));
        setFullAddress(business.address ?? '');
        const savedPhysicalStore = localStorage.getItem(`zipco-business-${businessId}-has-physical-store`);
        setHasPhysicalStore(
          savedPhysicalStore === null
            ? business.hasPhysicalStore ?? business.has_physical_store ?? true
            : savedPhysicalStore === 'true'
        );
        setIsOpen(business.isOpen !== false);
        setHasUnsavedChanges(false);
      } catch (error) {
        showAppToast('No se pudo cargar la configuracion del negocio', 'error');
      }
    };

    loadBusinessConfig();
  }, []);

  useEffect(() => {
    const query = fullAddress.trim();
    if (!locationTouched || query.length < 3) {
      setLocationSuggestions([]);
      setIsLocationLoading(false);
      setHasLocationSearched(false);
      return;
    }

    setIsLocationLoading(true);
    setHasLocationSearched(false);

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}+Chile&format=json&limit=5&countrycodes=cl`
        );
        const data = await response.json();
        setLocationSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setIsLocationLoading(false);
        setHasLocationSearched(true);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [fullAddress, locationTouched]);

  const handleSave = async (shouldExitAfterSave = false) => {
    const businessId = localStorage.getItem('zipco-business-id');
    const token = localStorage.getItem('zipco-token');

    if (!businessId || !token) {
      showAppToast('No se pudo guardar la configuracion del negocio', 'error');
      return;
    }

    try {
      const response = await fetch(`https://zipco-backend-production.up.railway.app/businesses/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category,
          keywords: keywords.join(', '),
          schedule: JSON.stringify(schedule),
          address: fullAddress,
          products: JSON.stringify(products)
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo guardar la configuracion del negocio', 'error');
        return;
      }

      onSave({ category, hashtags: keywords, showFullAddress, fullAddress, schedule, hasPhysicalStore, products });
      localStorage.setItem(`zipco-business-${businessId}-has-physical-store`, String(hasPhysicalStore));
      setHasUnsavedChanges(false);
      showAppToast('Configuracion del negocio actualizada correctamente', 'success');
      if (shouldExitAfterSave) {
        onBack();
      }
    } catch (error) {
      showAppToast('No se pudo guardar la configuracion del negocio', 'error');
    }
  };

  return (
    <div className="size-full relative flex flex-col bg-[#F0F4FF]">
      <div className="px-4 pt-6 pb-4 border-b border-white/50">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={handleBackPress} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Configuracion de Negocio</h2>
        </div>

      </div>

      <div className="flex-1 overflow-auto px-4 pt-4 pb-48">
        {hasPhysicalStore && (
          <LocalStatusCard isUsingSchedule={isOpen} isLoading={isTogglingOpen} onToggle={handleToggleOpen} />
        )}
        <PhysicalAttendanceCard hasPhysicalStore={hasPhysicalStore} onChange={handlePhysicalStoreChange} />
        <CategorySelectionCard
          category={category}
          categories={businessCategories}
          onOpenCategoryModal={() => setShowCategoryModal(true)}
        />
        <KeywordsCard
          keywords={keywords}
          keywordInput={keywordInput}
          setKeywordInput={setKeywordInput}
          addKeyword={addKeyword}
          removeKeyword={removeKeyword}
        />
        <LocationPrivacyCard
          fullAddress={fullAddress}
          setFullAddress={handleFullAddressChange}
          showFullAddress={showFullAddress}
          setShowFullAddress={handleShowFullAddressChange}
          locationSuggestions={locationSuggestions}
          isLocationLoading={isLocationLoading}
          hasLocationSearched={hasLocationSearched}
          locationTouched={locationTouched}
          setLocationTouched={setLocationTouched}
          setLocationSuggestions={setLocationSuggestions}
          setHasLocationSearched={setHasLocationSearched}
        />
        <ScheduleCard days={businessDays} schedule={schedule} setSchedule={handleScheduleChange} />
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h4 className="font-bold text-gray-900">Mis productos y servicios</h4>
            <button
              type="button"
              onClick={() => {
                if (showProductForm) {
                  resetProductForm();
                  setShowProductForm(false);
                  return;
                }
                resetProductForm();
                setShowProductForm(true);
              }}
              className="shrink-0 rounded-full bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-all"
            >
              ＋ Agregar producto
            </button>
          </div>

          {showProductForm && (
            <div className="mb-4 space-y-3 rounded-2xl border border-teal-100 bg-teal-50/40 p-4">
              <p className="text-sm font-bold text-gray-900">
                {editingProductId ? 'Editar producto' : 'Nuevo producto'}
              </p>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  placeholder="Ej: Torta de chocolate"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Descripcion</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                  rows={2}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Precio en pesos chilenos</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatChileanPrice(productForm.price)}
                  onChange={(e) => handleProductPriceChange(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  placeholder="Ej: 12000"
                />
                <p className="mt-1 text-xs text-gray-400">Minimo $100. Se mostrara como $12.000.</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Modo</p>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1">
                  {[
                    { value: 'order', label: '🛒 Se puede pedir' },
                    { value: 'view', label: '👁 Solo ver' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, mode: option.value as 'order' | 'view' })}
                      className={`rounded-xl px-2 py-2.5 text-xs font-semibold transition-all ${
                        productForm.mode === option.value
                          ? 'bg-[#00BFA5] text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Foto</p>
                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-teal-300 bg-white px-4 py-3 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-all">
                  {isUploadingProductPhoto ? 'Subiendo foto...' : productForm.imageUrl ? 'Cambiar foto' : 'Subir foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadProductPhoto(file);
                    }}
                  />
                </label>
                {productForm.imageUrl && (
                  <div className="mt-3 flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-teal-100 bg-white">
                    <img
                      src={productForm.imageUrl}
                      alt={productForm.name || 'Producto'}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetProductForm();
                    setShowProductForm(false);
                  }}
                  className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={addProduct}
                  className="rounded-xl bg-[#00BFA5] px-4 py-3 text-sm font-semibold text-white hover:bg-teal-600 transition-all"
                >
                  {editingProductId ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500">
                Agrega productos o servicios para mostrarlos en tu perfil.
              </p>
            ) : (
              products.map((product) => (
                <div key={product.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="h-16 w-16 rounded-xl object-cover" />
                  ) : (
                    <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                      Sin foto
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h5 className="truncate text-sm font-bold text-gray-900">{product.name}</h5>
                        {product.description && (
                          <p className="line-clamp-2 text-xs text-gray-500">{product.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEditingProduct(product)}
                          className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition-all"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProduct(product.id)}
                          className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-100 transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {product.price && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                          ${Number(product.price).toLocaleString('es-CL')}
                        </span>
                      )}
                      <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
                        {product.mode === 'order' ? '🛒 Se puede pedir' : '👁 Solo ver'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal cambios sin guardar */}
      {showUnsavedModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full shadow-xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">¿Salir sin guardar?</h3>
            <p className="text-sm text-gray-500 mb-5">Tienes cambios sin guardar. Si sales ahora se perderán.</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSave(true)}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl font-semibold text-white transition-all"
              >
                Guardar y salir
              </button>
              <button
                onClick={onBack}
                className="w-full py-3 bg-red-50 rounded-xl font-semibold text-red-500 transition-all"
              >
                Salir sin guardar
              </button>
              <button
                onClick={() => setShowUnsavedModal(false)}
                className="w-full py-3 bg-gray-100 rounded-xl font-semibold text-gray-700 transition-all"
              >
                Seguir editando
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <CategoryPickerModal
          category={category}
          categories={businessCategories}
          onSelectCategory={(selectedCategory) => {
            handleCategoryChange(selectedCategory);
            setShowCategoryModal(false);
          }}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {/* Botón guardar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 pt-4 pb-28 bg-gradient-to-t from-white via-white to-white">
        <button
          onClick={() => handleSave(false)}
          disabled={!hasUnsavedChanges}
          className={`w-full py-4 px-6 rounded-full font-semibold shadow-xl transition-all active:scale-[0.98] ${
            hasUnsavedChanges
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-teal-500/30 hover:shadow-2xl hover:shadow-teal-500/40'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {hasUnsavedChanges ? 'Guardar Cambios' : 'Sin cambios pendientes'}
        </button>
      </div>
    </div>
  );
}
