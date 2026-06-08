import type { Dispatch, SetStateAction } from 'react';
import type { BusinessProduct, ProductForm } from './types';

type ProductManagerCardProps = {
  products: BusinessProduct[];
  productForm: ProductForm;
  showProductForm: boolean;
  isUploadingProductPhoto: boolean;
  editingProductId: string | null;
  setProductForm: Dispatch<SetStateAction<ProductForm>>;
  resetProductForm: () => void;
  setShowProductForm: (value: boolean) => void;
  formatChileanPrice: (value: string) => string;
  handleProductPriceChange: (value: string) => void;
  uploadProductPhoto: (file: File) => void;
  addProduct: () => void;
  startEditingProduct: (product: BusinessProduct) => void;
  removeProduct: (productId: string) => void;
};

export default function ProductManagerCard({
  products,
  productForm,
  showProductForm,
  isUploadingProductPhoto,
  editingProductId,
  setProductForm,
  resetProductForm,
  setShowProductForm,
  formatChileanPrice,
  handleProductPriceChange,
  uploadProductPhoto,
  addProduct,
  startEditingProduct,
  removeProduct
}: ProductManagerCardProps) {
  return (
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
          + Agregar producto
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
                { value: 'order', label: 'Se puede pedir' },
                { value: 'view', label: 'Solo ver' }
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
                    {product.mode === 'order' ? 'Se puede pedir' : 'Solo ver'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
