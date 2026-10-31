import * as React from 'react';











import { AnimatePresence, motion } from "motion/react";
import { Archive, PackageCheck } from "lucide-react";



















import type { RequestsScreenModel } from "../application/useRequestsScreenController";
/** Canonical visual section; data and commands come from its screen controller. */
export default function HistoryTransferOverlay({model}:{model:Pick<RequestsScreenModel,"historyTransfer"|"prefersReducedMotion">}){
const {historyTransfer,prefersReducedMotion}=model;
return (<AnimatePresence>
        {historyTransfer !== null && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/55 px-6 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative flex w-[210px] flex-col items-center overflow-hidden rounded-[28px] border border-cyan-200/80 bg-white/95 px-5 py-6 shadow-[0_24px_70px_rgba(8,145,178,0.28)] dark:border-cyan-300/70 dark:bg-slate-50/95 dark:shadow-[0_24px_70px_rgba(34,211,238,0.22)]"
              initial={{ y: 14, scale: 0.94 }}
              animate={{ y: 0, scale: 1 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { x: 120, y: -260, scale: 0.28, opacity: 0 }
              }
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-100/65 via-transparent to-emerald-100/70"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: [0.45, 0.9, 0.45] }
                }
                transition={{ duration: 1.1, repeat: Infinity }}
              />
              <div className="relative h-[92px] w-[122px]">
                <motion.div
                  className="absolute left-1/2 top-0 flex h-10 w-20 -translate-x-1/2 items-center gap-2 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-100 px-2 shadow-md"
                  animate={
                    prefersReducedMotion
                      ? { y: 24, scale: 0.82 }
                      : {
                          y: [0, 8, 35],
                          scale: [1, 0.92, 0.72],
                          opacity: [1, 1, 0],
                        }
                  }
                  transition={{ duration: 0.85, ease: "easeInOut" }}
                >
                  <PackageCheck className="h-4 w-4 text-teal-600" />
                  <span className="h-2 w-8 rounded-full bg-slate-300" />
                </motion.div>
                <motion.div
                  className="absolute bottom-0 left-1/2 flex h-12 w-[106px] -translate-x-1/2 items-center justify-center rounded-[16px] border border-teal-300 bg-gradient-to-b from-cyan-100/90 to-emerald-200/90 text-teal-700 shadow-[0_0_24px_rgba(20,184,166,0.34)]"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : {
                          boxShadow: [
                            "0 0 12px rgba(20,184,166,.20)",
                            "0 0 30px rgba(20,184,166,.50)",
                            "0 0 12px rgba(20,184,166,.20)",
                          ],
                        }
                  }
                  transition={{ duration: 1.1, repeat: Infinity }}
                >
                  <Archive className="h-7 w-7" />
                </motion.div>
              </div>
              <motion.p
                className="relative mt-3 text-sm font-black text-slate-900"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Guardando en Historial
              </motion.p>
              <p className="relative mt-1 text-center text-[11px] font-semibold text-slate-500">
                {historyTransfer.label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>);
}
