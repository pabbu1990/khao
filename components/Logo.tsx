export default function Logo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <path d="M5.5 15 h21" stroke="#E0922F" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5.5 15 a10.5 10.5 0 0 0 21 0" stroke="#E0922F" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 11.5 c2.6 -2 -2.6 -3.6 0 -6.2" stroke="#E0922F" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
