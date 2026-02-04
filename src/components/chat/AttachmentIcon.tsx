interface AttachmentIconProps {
  className?: string;
}

export function AttachmentIcon({ className }: AttachmentIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Rotated capsule/pill shape - tilted at -45deg like reference */}
      <g transform="rotate(-45 12 12)">
        <rect
          x="8"
          y="3"
          width="8"
          height="18"
          rx="4"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        />
        {/* Two dots inside - arranged vertically */}
        <circle cx="12" cy="8" r="1.8" fill="currentColor" />
        <circle cx="12" cy="14" r="1.8" fill="currentColor" />
      </g>
      {/* Small chevron arrow at bottom right corner */}
      <path 
        d="M17 18.5L19 20.5L21 18.5" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
