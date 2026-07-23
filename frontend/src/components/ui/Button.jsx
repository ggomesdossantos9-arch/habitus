import { CircleNotch } from '@phosphor-icons/react'; import { cn } from '../../utils/cn.js';
export function Button({ children, variant = 'primary', isLoading = false, className, disabled, ...props }) {
  return <button className={cn('button', `button--${variant}`, className)} disabled={disabled || isLoading} {...props}>{isLoading && <CircleNotch className="spin" aria-hidden="true" />}<span>{children}</span></button>;
}
