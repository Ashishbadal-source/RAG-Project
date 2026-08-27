export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-error text-white hover:bg-red-600',
  }[variant] || 'btn-primary';
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'h-12 px-6 text-lg',
  }[size] || 'btn-md';

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
