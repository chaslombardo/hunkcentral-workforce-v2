import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'hunks-green': {
          DEFAULT: '#026937',
          50: '#f0f9f4',
          100: '#dcf2e4',
          200: '#bce5cd',
          300: '#8dd1a8',
          400: '#57b67c',
          500: '#339b5a',
          600: '#026937',
          700: '#1e5a32',
          800: '#1a4a2a',
          900: '#163d24',
          950: '#0b2214',
        },
        'hunks-orange': {
          DEFAULT: '#ea7200',
          50: '#fef7ed',
          100: '#fdecd4',
          200: '#fbd5a8',
          300: '#f8b871',
          400: '#f59338',
          500: '#ea7200',
          600: '#dc5f02',
          700: '#b64906',
          800: '#92390c',
          900: '#78300d',
          950: '#411703',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        brand: {
          primary: {
            DEFAULT: 'hsl(var(--brand-primary))',
            foreground: 'hsl(var(--brand-primary-foreground))',
            light: 'hsl(var(--brand-primary-light))',
            dark: 'hsl(var(--brand-primary-dark))',
          },
          secondary: {
            DEFAULT: 'hsl(var(--brand-secondary))',
            foreground: 'hsl(var(--brand-secondary-foreground))',
            light: 'hsl(var(--brand-secondary-light))',
            dark: 'hsl(var(--brand-secondary-dark))',
          },
          success: {
            DEFAULT: 'hsl(var(--brand-success))',
            foreground: 'hsl(var(--brand-success-foreground))',
          },
          warning: {
            DEFAULT: 'hsl(var(--brand-warning))',
            foreground: 'hsl(var(--brand-warning-foreground))',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'gentle-bounce': {
          '0%, 20%, 53%, 80%, 100%': {
            'animation-timing-function': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
            transform: 'translate3d(0, 0, 0)',
          },
          '40%, 43%': {
            'animation-timing-function':
              'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
            transform: 'translate3d(0, -8px, 0)',
          },
          '70%': {
            'animation-timing-function':
              'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
            transform: 'translate3d(0, -4px, 0)',
          },
          '90%': {
            transform: 'translate3d(0, -2px, 0)',
          },
        },
        'subtle-pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.02)',
          },
        },
        'smooth-fade-in': {
          from: {
            opacity: '0',
            transform: 'translateY(8px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'success-celebration': {
          '0%': { transform: 'scale(1)' },
          '15%': { transform: 'scale(1.1)' },
          '30%': { transform: 'scale(0.95)' },
          '45%': { transform: 'scale(1.05)' },
          '60%': { transform: 'scale(0.98)' },
          '75%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        'loading-dots': {
          '0%, 80%, 100%': {
            transform: 'scale(0.8)',
            opacity: '0.5',
          },
          '40%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'gentle-bounce': 'gentle-bounce 0.6s ease-out',
        'subtle-pulse': 'subtle-pulse 2s ease-in-out infinite',
        'smooth-fade-in': 'smooth-fade-in 0.3s ease-out',
        'success-celebration':
          'success-celebration 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'loading-dots': 'loading-dots 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
