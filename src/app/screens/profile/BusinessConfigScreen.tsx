import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { showAppToast } from '../Toast';
import CategoryPickerModal from './business-config/CategoryPickerModal';
import CategorySelectionCard from './business-config/CategorySelectionCard';
import KeywordsCard from './business-config/KeywordsCard';
import LocalStatusCard from './business-config/LocalStatusCard';
import LocationPrivacyCard from './business-config/LocationPrivacyCard';
import PhysicalAttendanceCard from './business-config/PhysicalAttendanceCard';
import ProductManagerCard from './business-config/ProductManagerCard';
import SaveChangesBar from './business-config/SaveChangesBar';
import ScheduleCard from './business-config/ScheduleCard';
import UnsavedChangesModal from './business-config/UnsavedChangesModal';
import { businessCategories, businessDays, emptySchedule } from './business-config/businessConfigData';
import type { BusinessProduct } from './business-config/types';
import useLocationSuggestions from './business-config/useLocationSuggestions';

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
  const {
    locationSuggestions,
    isLocationLoading,
    hasLocationSearched,
    locationTouched,
    latitude,
    longitude,
    setLocationTouched,
    setLocationSuggestions,
    setHasLocationSearched,
    setCoordinates,
    clearCoordinates,
    selectLocationSuggestion
  } = useLocationSuggestions(fullAddress);

  const markChanged = useCallback(() => setHasUnsavedChanges(true), []);

  const handleCategoryChange = (val: string) => { setCategory(val); markChanged(); };
  const handleFullAddressChange = (val: string) => { setFullAddress(val); clearCoordinates(); markChanged(); };
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
        setCoordinates(
          business.latitude ?? business.lat,
          business.longitude ?? business.lng ?? business.lon
        );
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
          latitude,
          longitude,
          products: JSON.stringify(products)
        })
      });

      if (!response.ok) {
        showAppToast('No se pudo guardar la configuracion del negocio', 'error');
        return;
      }

      onSave({ category, hashtags: keywords, showFullAddress, fullAddress, latitude, longitude, schedule, hasPhysicalStore, products });
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
          onSelectLocationSuggestion={selectLocationSuggestion}
        />
        <ScheduleCard days={businessDays} schedule={schedule} setSchedule={handleScheduleChange} />
        <ProductManagerCard
          products={products}
          productForm={productForm}
          showProductForm={showProductForm}
          isUploadingProductPhoto={isUploadingProductPhoto}
          editingProductId={editingProductId}
          setProductForm={setProductForm}
          resetProductForm={resetProductForm}
          setShowProductForm={setShowProductForm}
          formatChileanPrice={formatChileanPrice}
          handleProductPriceChange={handleProductPriceChange}
          uploadProductPhoto={uploadProductPhoto}
          addProduct={addProduct}
          startEditingProduct={startEditingProduct}
          removeProduct={removeProduct}
        />
      </div>

      {/* Modal cambios sin guardar */}
      {showUnsavedModal && (
        <UnsavedChangesModal
          onSaveAndExit={() => handleSave(true)}
          onExitWithoutSaving={onBack}
          onContinueEditing={() => setShowUnsavedModal(false)}
        />
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

      <SaveChangesBar hasUnsavedChanges={hasUnsavedChanges} onSave={() => handleSave(false)} />
    </div>
  );
}
