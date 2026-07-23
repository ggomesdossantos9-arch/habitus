import { forwardRef, useId, useState } from 'react'; import { Eye, EyeSlash } from '@phosphor-icons/react'; import { cn } from '../../utils/cn.js';
export const Input = forwardRef(function Input({ label, error, hint, className, showPasswordToggle = false, type = 'text', ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const id = props.id || useId(), describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const inputType = showPasswordToggle && type === 'password' && visible ? 'text' : type;
  return <div className={cn('field', className)}><label htmlFor={id}>{label}</label><div className="field__control"><input ref={ref} id={id} type={inputType} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />{showPasswordToggle && type === 'password' && <button type="button" className="field__toggle" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}>{visible ? <EyeSlash size={20}/> : <Eye size={20}/>}</button>}</div>{error ? <span id={`${id}-error`} className="field__error">{error}</span> : hint ? <span id={`${id}-hint`} className="field__hint">{hint}</span> : null}</div>;
});
