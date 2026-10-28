/**
 * components/ui/Modal.tsx — Diálogo modal.
 * Módulo: Setup.
 *
 * El comportamiento (focus trap, foco de retorno, scroll lock, Esc, aria-modal) lo resuelve @radix-ui/react-dialog;
 * el aspecto es nuestro (Tailwind). Entrada/salida: fade + 6px de desplazamiento vertical, 120ms ease-out, sin
 * scale ni rebote. Con prefers-reduced-motion solo queda el fade (MotionConfig reducedMotion="user").
 */

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const TRANSITION = { duration: 0.12, ease: 'easeOut' } as const;

export function Modal({ open, title, onClose, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-slate-900/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={TRANSITION}
                />
              </Dialog.Overlay>
              <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
                <Dialog.Content asChild forceMount aria-describedby={undefined}>
                  <motion.div
                    className="pointer-events-auto max-h-full w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-lg focus:outline-none"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={TRANSITION}
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{title}</Dialog.Title>
                      <Dialog.Close
                        aria-label="Cerrar"
                        className="rounded-md p-1 text-slate-500 transition-colors duration-100 ease-out hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-500 motion-reduce:transition-none"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </Dialog.Close>
                    </div>
                    {children}
                  </motion.div>
                </Dialog.Content>
              </div>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </MotionConfig>
    </Dialog.Root>
  );
}
