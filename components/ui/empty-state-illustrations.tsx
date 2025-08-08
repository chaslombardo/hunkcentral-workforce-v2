"use client"

import * as React from "react"

// College Hunks brand colors
const HUNKS_GREEN = "#026937"
const HUNKS_ORANGE = "#ea7200"

export function LogsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty logs illustration"
    >
      {/* Clipboard background */}
      <rect x="25" y="15" width="70" height="90" rx="4" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="2"/>
      
      {/* Clipboard clip */}
      <rect x="45" y="10" width="30" height="12" rx="6" fill={HUNKS_GREEN}/>
      
      {/* Document lines */}
      <line x1="35" y1="35" x2="75" y2="35" stroke="#dee2e6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="35" y1="45" x2="85" y2="45" stroke="#dee2e6" strokeWidth="2" strokeLinecap="round"/>
      <line x1="35" y1="55" x2="70" y2="55" stroke="#dee2e6" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Plus icon */}
      <circle cx="75" cy="75" r="15" fill={HUNKS_ORANGE} opacity="0.1"/>
      <path d="M75 67v16M67 75h16" stroke={HUNKS_ORANGE} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function CommissionIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty commissions illustration"
    >
      {/* Dollar sign background circle */}
      <circle cx="60" cy="60" r="35" fill={HUNKS_GREEN} opacity="0.1"/>
      <circle cx="60" cy="60" r="35" stroke={HUNKS_GREEN} strokeWidth="2" strokeDasharray="5,5"/>
      
      {/* Dollar sign */}
      <path 
        d="M60 40v5m0 30v5m-8-25h16a8 8 0 0 1 0 16H52m16 0H52a8 8 0 0 1 0-16h16z" 
        stroke={HUNKS_GREEN} 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Floating coins */}
      <circle cx="85" cy="35" r="6" fill={HUNKS_ORANGE} opacity="0.6"/>
      <circle cx="35" cy="85" r="4" fill={HUNKS_ORANGE} opacity="0.4"/>
      <circle cx="90" cy="85" r="5" fill={HUNKS_ORANGE} opacity="0.5"/>
    </svg>
  )
}

export function ReportsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty reports illustration"
    >
      {/* Chart background */}
      <rect x="20" y="20" width="80" height="80" rx="8" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="2"/>
      
      {/* Chart bars */}
      <rect x="30" y="70" width="8" height="20" rx="2" fill={HUNKS_GREEN} opacity="0.3"/>
      <rect x="45" y="60" width="8" height="30" rx="2" fill={HUNKS_GREEN} opacity="0.5"/>
      <rect x="60" y="50" width="8" height="40" rx="2" fill={HUNKS_GREEN} opacity="0.7"/>
      <rect x="75" y="65" width="8" height="25" rx="2" fill={HUNKS_GREEN} opacity="0.4"/>
      
      {/* Trend line */}
      <path 
        d="M30 75 L45 65 L60 55 L75 70 L90 60" 
        stroke={HUNKS_ORANGE} 
        strokeWidth="2" 
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Data points */}
      <circle cx="30" cy="75" r="2" fill={HUNKS_ORANGE}/>
      <circle cx="45" cy="65" r="2" fill={HUNKS_ORANGE}/>
      <circle cx="60" cy="55" r="2" fill={HUNKS_ORANGE}/>
      <circle cx="75" cy="70" r="2" fill={HUNKS_ORANGE}/>
      <circle cx="90" cy="60" r="2" fill={HUNKS_ORANGE}/>
    </svg>
  )
}

export function UsersIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty users illustration"
    >
      {/* User avatars */}
      <circle cx="45" cy="45" r="15" fill={HUNKS_GREEN} opacity="0.2"/>
      <circle cx="75" cy="45" r="15" fill={HUNKS_ORANGE} opacity="0.2"/>
      <circle cx="60" cy="75" r="15" fill={HUNKS_GREEN} opacity="0.3"/>
      
      {/* User icons */}
      <circle cx="45" cy="40" r="5" fill={HUNKS_GREEN} opacity="0.6"/>
      <path d="M35 55c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke={HUNKS_GREEN} strokeWidth="2" fill="none" opacity="0.6"/>
      
      <circle cx="75" cy="40" r="5" fill={HUNKS_ORANGE} opacity="0.6"/>
      <path d="M65 55c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke={HUNKS_ORANGE} strokeWidth="2" fill="none" opacity="0.6"/>
      
      <circle cx="60" cy="70" r="5" fill={HUNKS_GREEN} opacity="0.8"/>
      <path d="M50 85c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke={HUNKS_GREEN} strokeWidth="2" fill="none" opacity="0.8"/>
      
      {/* Plus icon */}
      <circle cx="85" cy="25" r="12" fill={HUNKS_ORANGE} opacity="0.1"/>
      <path d="M85 19v12M79 25h12" stroke={HUNKS_ORANGE} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function SearchIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="No search results illustration"
    >
      {/* Magnifying glass */}
      <circle cx="50" cy="50" r="20" stroke={HUNKS_GREEN} strokeWidth="3" fill="none"/>
      <path d="M66 66l20 20" stroke={HUNKS_GREEN} strokeWidth="3" strokeLinecap="round"/>
      
      {/* Question mark inside */}
      <path 
        d="M45 42c0-3 2-5 5-5s5 2 5 5c0 2-1 3-2 4l-1 2M50 56h.01" 
        stroke={HUNKS_ORANGE} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Welcome illustration"
    >
      {/* Sun/star burst */}
      <circle cx="60" cy="60" r="25" fill={HUNKS_ORANGE} opacity="0.1"/>
      <path d="M60 35v50M35 60h50M45 45l30 30M75 45L45 75" stroke={HUNKS_ORANGE} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      
      {/* Center circle */}
      <circle cx="60" cy="60" r="8" fill={HUNKS_GREEN}/>
      
      {/* Welcome gesture - hand wave */}
      <path 
        d="M85 40c2-2 5-2 7 0s2 5 0 7l-5 5c-1 1-2 1-3 0M87 42l3-3M90 45l3-3" 
        stroke={HUNKS_GREEN} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  )
}