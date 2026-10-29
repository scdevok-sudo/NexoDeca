/**
 * components/layout/MobileNav.tsx — Menú de navegación en mobile (drawer con hamburguesa).
 * Módulo: Setup (layout compartido).
 *
 * Reemplaza el nav horizontal con scroll que tenía Sidebar.tsx en <768px (TODO(SETUP) cerrado).
 * Mismo mecanismo que Modal.tsx (@radix-ui/react-dialog: focus trap, foco de retorno, scroll lock,
 * Esc, aria-modal) pero con aspecto de drawer que entra desde la izquierda en vez de diálogo
 * centrado. Entrada/salida: fade del overlay + slide horizontal, 120ms ease-out, sin scale ni
 * rebote (mismo timing que el resto del sistema). Con prefers-reduced-motion solo queda el fade
 * (MotionConfig reducedMotion="user").
 *
 * PERMISOS: se muestran solo los ítems que el rol puede ver (routes/navItems.ts). Ocultar un ítem
 * NO es seguridad: lo real está en RLS / Edge Functions.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { NAV_ITEMS } from '../../routes/navItems';
import logoBlanco from '../../assets/logo-deca-blanco.png';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TRANSITION = { duration: 0.12, ease: 'easeOut' } as const;

export function MobileNav({ open, onClose }: Props) {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((i) => user && i.roles.includes(user.rol));

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-slate-900/40 md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={TRANSITION}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined} className="contents">
                <motion.div
                  className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80vw] flex-col gap-1 overflow-y-auto bg-brand-900 p-4 text-sm text-white focus:outline-none md:hidden"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={TRANSITION}
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <img src={logoBlanco} alt="Deca Electromecánica" className="h-auto w-36" />
                    <Dialog.Close
                      aria-label="Cerrar menú"
                      className="rounded-md p-1 text-brand-100 transition-colors duration-100 ease-out hover:bg-brand-800 hover:text-white focus-visible:outline-2 focus-visible:outline-brand-300 motion-reduce:transition-none"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </Dialog.Close>
                  </div>
                  <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>
                  {items.map((i) => (
                    <NavLink
                      key={i.to}
                      to={i.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        'rounded-md px-3 py-2 ' +
                        (isActive ? 'bg-brand-700 font-medium' : 'text-brand-100 hover:bg-brand-800 hover:text-white')
                      }
                    >
                      {i.label}
                    </NavLink>
                  ))}
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </MotionConfig>
    </Dialog.Root>
  );
}
