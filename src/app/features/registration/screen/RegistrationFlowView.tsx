import * as React from 'react';
import { Suspense } from 'react';
import { ArrowLeft, MapPin } from 'lucide-react';










import type {RegistrationFlowModel} from './application/useRegistrationFlowController';
export default function RegistrationFlowView({model}:{model:RegistrationFlowModel}){
const {DevAccessPanel,QaAccessPanel,handleBack,onComplete,progress,renderStep,step,totalSteps}=model;
return (
    <div className="size-full bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="w-full max-w-md h-full flex flex-col relative overflow-x-hidden overflow-y-auto bg-white">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-teal-500/20 to-transparent" />

        <div className="relative z-10 px-6 pt-8">
          <div className="relative flex items-center justify-center gap-2 mb-8">
            {step !== 'welcome' && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Volver al paso anterior"
                className="absolute left-0 rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <MapPin className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
            <h1 className="text-3xl font-bold tracking-tight text-teal-700">ZIPCO</h1>
          </div>

          {step !== 'welcome' && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
                <span>Paso {progress} de {totalSteps}</span>
                <span>{Math.round((progress / totalSteps) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00BFA5] rounded-full transition-all duration-300"
                  style={{ width: `${(progress / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 px-6 pb-8 flex flex-col justify-center">
          {renderStep()}
          {step === 'welcome' && DevAccessPanel && (
            <Suspense fallback={null}>
              <DevAccessPanel onAuthenticated={onComplete} />
            </Suspense>
          )}
          {step === 'welcome' && QaAccessPanel && (
            <Suspense fallback={null}>
              <QaAccessPanel onAuthenticated={onComplete} />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );

}
