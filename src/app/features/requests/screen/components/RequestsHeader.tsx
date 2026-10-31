import * as React from 'react';












import { ArrowLeft, ShoppingBag, Store } from "lucide-react";



















import type { RequestsScreenModel } from "../application/useRequestsScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function RequestsHeader({model}:{model:Pick<RequestsScreenModel,"businessRoleBadge"|"customerRoleBadge"|"hasBusiness"|"onBack"|"setAttentionFilter"|"setSelectedBusinessActivity"|"setSubTab"|"subTab">}){
const {businessRoleBadge,customerRoleBadge,hasBusiness,onBack,setAttentionFilter,setSelectedBusinessActivity,setSubTab,subTab}=model;
return (<div className="zipco-safe-header border-b border-slate-200/60 px-4 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Solicitudes</h2>
          </div>
          {import.meta.env.QA_LOAD_DIAGNOSTICS && <span aria-label="Versión QA" className="text-[10px] font-mono text-slate-500">
            QA {import.meta.env.QA_LOAD_DIAGNOSTICS_VERSION.slice(0, 7)}
          </span>}
        </div>

        <div
          className={`flex gap-2 ${!hasBusiness ? "rounded-2xl border border-teal-400/20 bg-teal-500/10 p-2" : ""}`}
        >
          <button
            onClick={() => {
              setSubTab("my-orders");
              setAttentionFilter(null);
              setSelectedBusinessActivity(null);
            }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
              subTab === "my-orders"
                ? hasBusiness
                  ? "bg-gradient-to-r from-cyan-600 to-teal-500 text-white shadow-lg shadow-cyan-500/20"
                  : "bg-transparent text-teal-600"
                : "bg-white/60 text-gray-600 hover:bg-white/80"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="flex flex-col items-start leading-tight">
              <span>Mis Pedidos</span>
              {!hasBusiness && (
                <span className="mt-0.5 text-[10px] font-medium opacity-75">
                  Revisa y gestiona tus solicitudes
                </span>
              )}
            </span>
            {customerRoleBadge > 0 && (
              <span className="zipco-role-badge">
                {customerRoleBadge > 9 ? "9+" : customerRoleBadge}
              </span>
            )}
          </button>
          {hasBusiness && (
            <button
              onClick={() => {
                setSubTab("my-business");
                setAttentionFilter(null);
                setSelectedBusinessActivity(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                subTab === "my-business"
                  ? "bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-emerald-500/20"
                  : "bg-white/60 text-gray-600 hover:bg-white/80"
              }`}
            >
              <Store className="h-4 w-4" />
              Mi Negocio
              {businessRoleBadge > 0 && (
                <span className="zipco-role-badge">
                  {businessRoleBadge > 9 ? "9+" : businessRoleBadge}
                </span>
              )}
            </button>
          )}
        </div>
      </div>);
}
