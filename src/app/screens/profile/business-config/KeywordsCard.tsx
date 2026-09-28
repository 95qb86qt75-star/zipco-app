import { Tag } from 'lucide-react';

type KeywordsCardProps = {
  providerType: 'Negocio' | 'Servicio';
  keywords: string[];
  keywordInput: string;
  setKeywordInput: (value: string) => void;
  addKeyword: (value: string) => void;
  removeKeyword: (keyword: string) => void;
};

export default function KeywordsCard({
  providerType,
  keywords,
  keywordInput,
  setKeywordInput,
  addKeyword,
  removeKeyword
}: KeywordsCardProps) {
  const isService = providerType === 'Servicio';
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-2">
      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Tag className="w-5 h-5 text-teal-600" />
        Palabras clave de busqueda
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        {isService
          ? 'Describe mediante palabras clave específicas los servicios que ofreces. Los clientes encontrarán tu servicio cuando busquen estas palabras. No se muestran públicamente.'
          : 'Describe mediante palabras clave específicas los productos que vendes. Los clientes encontrarán tu negocio cuando busquen estas palabras. No se muestran públicamente.'}
        {' '}Primero escribe una palabra o frase y luego toca Intro/Enter en el teclado.
      </p>
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-3 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
        {keywords.map((keyword) => (
          <span key={keyword} className="bg-teal-100 text-teal-800 rounded-full px-3 py-1 text-sm flex items-center gap-1">
            {keyword}
            <button
              type="button"
              onClick={() => removeKeyword(keyword)}
              className="font-bold leading-none text-teal-700 hover:text-teal-900"
              aria-label={`Eliminar ${keyword}`}
            >
              X
            </button>
          </span>
        ))}
        <input
          type="text"
          value={keywordInput}
          onChange={(e) => {
            const value = e.target.value;
            if (value.includes(',')) {
              value.split(',').forEach(addKeyword);
              return;
            }
            setKeywordInput(value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addKeyword(keywordInput);
            }
          }}
          placeholder="Escribe y toca Intro/Enter"
          className="min-w-[12rem] flex-1 border-0 bg-transparent text-sm focus:outline-none"
        />
      </div>
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-900 mb-1">Ejemplos utiles:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          {(isService
            ? ['Gasfitería', 'Reparación de tubos', 'Calefont', 'Soldadura']
            : ['Tortas personalizadas', 'Ropa infantil', 'Comida preparada', 'Artículos de ferretería']
          ).map((example) => <li key={example}>• {example}</li>)}
        </ul>
      </div>
      <p className="text-xs text-gray-400 mt-2">También puedes separar cada frase con comas. Sé específico para obtener mejores resultados.</p>
    </div>
  );
}
