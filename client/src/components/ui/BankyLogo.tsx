import React from "react";

export interface BankyLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: "brand" | "monochrome" | "outline";
  glow?: boolean;
}

export const BankyLogo: React.FC<BankyLogoProps> = ({
  size = 32,
  variant = "brand",
  glow = true,
  className = "",
  ...props
}) => {
  const idPrefix = React.useId().replace(/:/g, "_");
  const coreGradId = `${idPrefix}-banky-core`;
  const highlightGradId = `${idPrefix}-banky-highlight`;
  const glowFilterId = `${idPrefix}-banky-glow`;

  if (variant === "monochrome") {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        {...props}
      >
        <path
          d="M 36 16 H 18.5 C 16.5 16 15 17.5 15 19.5 V 43"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 20.5 21.5 L 34.5 37"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 16 50 H 35"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 15 57 V 80.5 C 15 82.5 16.5 84 18.5 84 H 36"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M 20.5 78.5 L 34.5 63"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 40 16 H 64 C 76.5 16 85 24 85 33.5 C 85 41.5 78 48 68 49 C 79 50 85 57 85 66.5 C 85 76 76.5 84 64 84 H 40 V 16 Z
             M 50 25 V 41.5 H 63 C 68.5 41.5 72.5 38 72.5 33.25 C 72.5 28.5 68.5 25 63 25 H 50 Z
             M 50 58.5 V 75 H 63 C 68.5 75 72.5 71.5 72.5 66.75 C 72.5 62 68.5 58.5 63 58.5 H 50 Z"
        />
      </svg>
    );
  }

  if (variant === "outline") {
    return (
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
      >
        <path d="M 36 16 H 18.5 C 16.5 16 15 17.5 15 19.5 V 43" />
        <path d="M 20.5 21.5 L 34.5 37" />
        <path d="M 16 50 H 35" />
        <path d="M 15 57 V 80.5 C 15 82.5 16.5 84 18.5 84 H 36" />
        <path d="M 20.5 78.5 L 34.5 63" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 40 16 H 64 C 76.5 16 85 24 85 33.5 C 85 41.5 78 48 68 49 C 79 50 85 57 85 66.5 C 85 76 76.5 84 64 84 H 40 V 16 Z
             M 50 25 V 41.5 H 63 C 68.5 41.5 72.5 38 72.5 33.25 C 72.5 28.5 68.5 25 63 25 H 50 Z
             M 50 58.5 V 75 H 63 C 68.5 75 72.5 71.5 72.5 66.75 C 72.5 62 68.5 58.5 63 58.5 H 50 Z"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={coreGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#252a36" />
          <stop offset="45%" stopColor="#12141c" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </linearGradient>

        <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
        </linearGradient>

        {glow && (
          <filter id={glowFilterId} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <g
        filter={glow ? `url(#${glowFilterId})` : undefined}
        stroke="var(--color-accent, #00e5a0)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 36 16 H 18.5 C 16.5 16 15 17.5 15 19.5 V 43" />
        <path d="M 20.5 21.5 L 34.5 37" />
        <path d="M 16 50 H 35" strokeWidth="2.2" />
        <path d="M 15 57 V 80.5 C 15 82.5 16.5 84 18.5 84 H 36" />
        <path d="M 20.5 78.5 L 34.5 63" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 40 16 H 64 C 76.5 16 85 24 85 33.5 C 85 41.5 78 48 68 49 C 79 50 85 57 85 66.5 C 85 76 76.5 84 64 84 H 40 V 16 Z
             M 50 25 V 41.5 H 63 C 68.5 41.5 72.5 38 72.5 33.25 C 72.5 28.5 68.5 25 63 25 H 50 Z
             M 50 58.5 V 75 H 63 C 68.5 75 72.5 71.5 72.5 66.75 C 72.5 62 68.5 58.5 63 58.5 H 50 Z"
          fill={`url(#${coreGradId})`}
        />
      </g>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 36 16 H 18.5 C 16.5 16 15 17.5 15 19.5 V 43" stroke={`url(#${coreGradId})`} strokeWidth="4.5" />
        <path d="M 36 16 H 18.5 C 16.5 16 15 17.5 15 19.5 V 43" stroke={`url(#${highlightGradId})`} strokeWidth="2.8" />

        <path d="M 20.5 21.5 L 34.5 37" stroke={`url(#${coreGradId})`} strokeWidth="4.5" />
        <path d="M 20.5 21.5 L 34.5 37" stroke={`url(#${highlightGradId})`} strokeWidth="2.8" />

        <path d="M 16 50 H 35" stroke={`url(#${coreGradId})`} strokeWidth="5" />
        <path d="M 16 50 H 35" stroke={`url(#${highlightGradId})`} strokeWidth="3.2" />

        <path d="M 15 57 V 80.5 C 15 82.5 16.5 84 18.5 84 H 36" stroke={`url(#${coreGradId})`} strokeWidth="4.5" />
        <path d="M 15 57 V 80.5 C 15 82.5 16.5 84 18.5 84 H 36" stroke={`url(#${highlightGradId})`} strokeWidth="2.8" />

        <path d="M 20.5 78.5 L 34.5 63" stroke={`url(#${coreGradId})`} strokeWidth="4.5" />
        <path d="M 20.5 78.5 L 34.5 63" stroke={`url(#${highlightGradId})`} strokeWidth="2.8" />

        <path
          d="M 40 16 H 64 C 76.5 16 85 24 85 33.5 C 85 41.5 78 48 68 49 C 79 50 85 57 85 66.5 C 85 76 76.5 84 64 84 H 40 V 16 Z"
          fill={`url(#${highlightGradId})`}
          opacity="0.35"
        />
      </g>
    </svg>
  );
};
