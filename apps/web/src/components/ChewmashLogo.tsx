export function ChewmashLogo({ className = '', decorative = false }: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <img
      className={className ? `chewmash-logo ${className}` : 'chewmash-logo'}
      src="/images/chewmash-logo.svg"
      alt={decorative ? '' : 'chewmash'}
      aria-hidden={decorative || undefined}
      draggable={false}
    />
  );
}
