import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import s from './Modal.module.css'
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { const dialog = ref.current; const previous = document.activeElement as HTMLElement | null; dialog?.showModal(); const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { dialog?.close(); document.body.style.overflow = previousOverflow; previous?.focus() } }, [])
  return <dialog ref={ref} className={s.dialog} aria-labelledby="modal-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose() }}><div className={s.inner}><div className={s.heading}><h2 id="modal-title">{title}</h2><button autoFocus onClick={onClose} aria-label="Fechar painel"><X /></button></div>{children}</div></dialog>
}
