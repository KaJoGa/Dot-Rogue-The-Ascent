#!/bin/bash
cat << 'CSS' > src/index.css
@import "tailwindcss";

@theme {
  --color-indigo-400: #7C3AED;
  --color-indigo-500: #7C3AED;
  --color-indigo-600: #7C3AED;
  --color-purple-500: #7C3AED;
  --color-purple-600: #7C3AED;
  
  --color-cyan-300: #22D3EE;
  --color-cyan-400: #22D3EE;
  --color-cyan-500: #22D3EE;
  --color-blue-400: #22D3EE;
  --color-blue-500: #22D3EE;
  --color-blue-600: #22D3EE;

  --color-slate-200: #F5F3FF;
  --color-slate-300: #F5F3FF;
  --color-white: #F5F3FF;
  --color-amber-50: #F5F3FF;
  --color-emerald-50: #F5F3FF;
  --color-cyan-50: #F5F3FF;
  
  --color-slate-400: #B4A9CC;
  --color-slate-500: #B4A9CC;
  --color-slate-600: #B4A9CC;
  --color-indigo-300: #B4A9CC;

  --color-yellow-400: #FBBF24;
  --color-yellow-500: #FBBF24;
  --color-amber-400: #FBBF24;
  --color-amber-500: #FBBF24;
  --color-amber-600: #FBBF24;
  --color-orange-400: #FBBF24;
  --color-orange-500: #FBBF24;
  
  --color-emerald-400: #34D399;
  --color-emerald-500: #34D399;
  --color-green-400: #34D399;
  --color-green-500: #34D399;

  --color-red-400: #F87171;
  --color-red-500: #F87171;
  --color-red-600: #F87171;
  --color-red-900: #F87171;

  --color-slate-700: #1F1830;
  --color-slate-800: #1F1830;
  --color-slate-900: #1F1830;
}

@layer utilities {
  @keyframes diagonalScroll {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 40px 40px;
    }
  }

  .animate-diagonal-scroll {
    animation: diagonalScroll 1s linear infinite;
  }
}
CSS
