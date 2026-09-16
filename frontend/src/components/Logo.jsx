export default function Logo({ size = 48, className = "" }) {
  return (
    <img
      src="/logo-nexo-radar-dark.png"
      alt="Logo NeXo Radar"
      width={size}
      height={size}
      style={{ height: size, width: size }}
      className={`object-contain ${className}`}
      draggable={false}
    />
  )
}
