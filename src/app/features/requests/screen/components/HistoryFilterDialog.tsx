import * as React from 'react';












import { Check, List, Minus, Trash2, X } from "lucide-react";



















import type { RequestsScreenModel } from "../application/useRequestsScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function HistoryFilterDialog({model}:{model:Pick<RequestsScreenModel,"historyFilter"|"historyOptions"|"setHistoryFilters"|"setShowHistoryFilter"|"viewKey">}){
const {historyFilter,historyOptions,setHistoryFilters,setShowHistoryFilter,viewKey}=model;
return (<div className="absolute inset-0 z-50 flex items-end bg-slate-950/45 p-3">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900">
                Filtrar historial
              </h3>
              <button
                onClick={() => setShowHistoryFilter(false)}
                className="rounded-full p-2 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-1">
              {historyOptions.map((option) => {
                const selected = historyFilter === option.value;
                const statusIcon =
                  option.value === "all" ? (
                    <span className="flex h-9 w-9 justify-self-center items-center justify-center rounded-full bg-teal-100 text-teal-600">
                      <List className="h-5 w-5" />
                    </span>
                  ) : option.value === "completed" ? (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-emerald-500 text-white">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </span>
                  ) : option.value === "cancelled" ? (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-red-500 text-white">
                      <X className="h-4 w-4 stroke-[3]" />
                    </span>
                  ) : option.value === "rejected" ? (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-slate-500 text-white">
                      <Minus className="h-4 w-4 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 justify-self-center items-center justify-center rounded-full bg-red-100 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </span>
                  );
                return (
                  <button
                    key={option.value}
                    onClick={() =>
                      setHistoryFilters((current) => ({
                        ...current,
                        [viewKey]: option.value,
                      }))
                    }
                    className={`grid w-full grid-cols-[24px_40px_1fr] items-center gap-3 rounded-2xl p-4 text-left transition-colors ${selected ? "bg-gradient-to-r from-teal-50 to-cyan-50" : "bg-white"}`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full border-2 ${
                        selected
                          ? "border-teal-500 bg-teal-500 shadow-[inset_0_0_0_4px_white]"
                          : "border-slate-300 bg-white"
                      }`}
                    />
                    {statusIcon}
                    <span>
                      <span className="block text-sm font-bold text-slate-900">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-4 text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowHistoryFilter(false)}
              className="mt-5 w-full rounded-xl bg-teal-600 py-3 font-bold text-white"
            >
              Aplicar filtro
            </button>
          </div>
        </div>);
}
