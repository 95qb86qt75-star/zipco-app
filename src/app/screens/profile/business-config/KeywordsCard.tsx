import { Tag } from 'lucide-react';

type KeywordsCardProps = {
  keywords: string[];
  keywordInput: string;
  setKeywordInput: (value: string) => void;
  addKeyword: (value: string) => void;
  removeKeyword: (keyword: string) => void;
};

export default function KeywordsCard({
  keywords,
  keywordInput,
  setKeywordInput,
  addKeyword,
  removeKeyword
}: KeywordsCardProps) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/50 shadow-md mb-4">
      <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Tag className="w-5 h-5 text-teal-600" />
        Palabras clave de busqueda
      </h4>
      <p className="text-xs text-gray-500 mb-3">
        Describe exactamente lo que vendes. Los clientes encontraran tu negocio cuando busquen estas palabras. No se
        muestran publicamente.
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
          placeholder="Escribe una palabra clave y presiona Enter"
          className="min-w-[12rem] flex-1 border-0 bg-transparent text-sm focus:outline-none"
        />
      </div>
      <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-900 mb-1">Ejemplos utiles:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Tortas de cumpleanos personalizadas</li>
          <li>• Galletas de Navidad artesanales</li>
          <li>• Reparacion de gasfiteria 24/7</li>
          <li>• Clases de ingles para ninos</li>
        </ul>
      </div>
      <p className="text-xs text-gray-400 mt-2">Separa cada frase con comas. Se especifico para mejores resultados.</p>
    </div>
  );
}
