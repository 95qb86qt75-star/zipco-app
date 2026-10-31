import * as React from 'react';


import { CalendarDays } from "lucide-react";







import OrderMomentSelector from "../../shared/OrderMomentSelector";





import type { CheckoutScreenModel } from "../application/useCheckoutScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function ScheduleSelectionPanel({model}:{model:Pick<CheckoutScreenModel,"availableHours"|"availableMinutes"|"dateOptions"|"formatDate"|"getDateValue"|"handleDateSelection"|"handleHourSelection"|"handleMomentSelection"|"needNow"|"orderMoment"|"selectedDate"|"selectedHour"|"selectedMinute"|"selectedTime"|"setSelectedHour"|"setSelectedMinute"|"setSelectedTime"|"updateSelectedTime">}){
const {availableHours,availableMinutes,dateOptions,formatDate,getDateValue,handleDateSelection,handleHourSelection,handleMomentSelection,needNow,orderMoment,selectedDate,selectedHour,selectedMinute,selectedTime,setSelectedHour,setSelectedMinute,setSelectedTime,updateSelectedTime}=model;
return (<div className="mb-4">
          <label className="mb-2 block text-sm font-bold text-gray-900">
            ¿Cuándo lo necesitas?
          </label>

          <OrderMomentSelector moment={orderMoment} onChange={handleMomentSelection}
            time={selectedTime} onTimeChange={setSelectedTime} />

          {orderMoment === 'schedule' && (
            <div className="mb-2 pt-1 animate-in">
              <div className="mb-2 flex items-center justify-between px-0.5">
                <h4 className="text-sm font-bold text-gray-900">
                  Selecciona fecha y hora
                </h4>
                {selectedTime && (
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-full">
                    {selectedTime}
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="-mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-1.5">
                  {dateOptions.map((date) => (
                    <button
                      key={date.value}
                      type="button"
                      onClick={() => handleDateSelection(date.value)}
                      className={`w-[62px] shrink-0 rounded-xl border px-2 py-2 text-center shadow-sm transition-all ${
                        selectedDate === date.value
                          ? "bg-gradient-to-b from-teal-500 to-emerald-500 text-white border-teal-500 shadow-md"
                          : "bg-white text-gray-900 border-gray-200 hover:border-teal-500"
                      }`}
                    >
                      <span className="block text-xs font-semibold capitalize">
                        {date.weekday}
                      </span>
                      <span className="block text-xl font-bold leading-tight">
                        {date.day}
                      </span>
                      <span className="block text-xs capitalize">
                        {date.month}
                      </span>
                    </button>
                  ))}
                  <label className="relative flex min-h-[68px] w-[62px] shrink-0 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-gray-200 bg-white px-2 py-2 text-center text-gray-900 shadow-sm transition-all hover:border-teal-500">
                    <CalendarDays className="h-5 w-5 text-teal-600" />
                    <span className="block text-xs font-bold">Más</span>
                    <input
                      type="date"
                      aria-label="Abrir calendario"
                      value={selectedDate}
                      onChange={(e) => handleDateSelection(e.target.value)}
                      min={getDateValue(new Date())}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                </div>
              </div>

              {selectedDate && (
                <div className="animate-in rounded-2xl border border-teal-200 bg-white/85 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900">
                      {selectedHour
                        ? `Minutos para las ${selectedHour}:00`
                        : "Hora"}
                    </p>
                    {selectedHour && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHour("");
                          setSelectedMinute("");
                          setSelectedTime("");
                        }}
                        className="text-xs font-semibold text-teal-600"
                      >
                        Cambiar hora
                      </button>
                    )}
                  </div>
                  {!selectedHour ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableHours.map((hour) => (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => handleHourSelection(hour)}
                          className="py-2 rounded-xl text-sm font-semibold transition-all bg-white text-gray-900 border border-gray-200 hover:border-teal-500"
                        >
                          {hour}:00
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {availableMinutes.map((minute) => (
                        <button
                          key={minute}
                          type="button"
                          onClick={() =>
                            updateSelectedTime(selectedHour, minute)
                          }
                          className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                            selectedMinute === minute
                              ? "bg-teal-500 text-white shadow-md"
                              : "bg-white text-gray-900 border border-gray-200 hover:border-teal-500"
                          }`}
                        >
                          {selectedHour}:{minute}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Summary Display */}
          {needNow && (
            <p className="px-2 text-xs font-semibold text-orange-700">
              ⚡ Entrega urgente · lo antes posible
            </p>
          )}

          {!needNow && (selectedDate || selectedTime) && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
              <p className="text-sm text-teal-800">
                <strong>{orderMoment === 'today' ? '📦 Entrega para hoy:' : '📦 Entrega programada:'}</strong>
                {selectedDate && ` ${formatDate(selectedDate)}`}
                {selectedDate && selectedTime && " a las"}
                {selectedTime && ` ${selectedTime}`}
                {!selectedDate && !selectedTime && " No especificada"}
              </p>
            </div>
          )}
        </div>);
}
