interface AttachmentIconProps {
  className?: string;
}

export function AttachmentIcon({ className }: AttachmentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Rotated capsule/pill shape */}
      <rect
        x="6"
        y="2"
        width="12"
        height="20"
        rx="6"
        transform="rotate(45 12 12)"
      />
      {/* Two dots inside */}
      <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" stroke="none" />
      {/* Small chevron arrow at bottom right */}
      <path d="M18 16l2 2 2-2" strokeWidth="1.5" />
    </svg>
  );
}
