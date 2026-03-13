const { hairlineWidth } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    screens: {
      'tablet': '768px',
      'tablet-lg': '1024px',
      'desktop': '1280px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        gray: {
          background: 'hsl(var(--gray-background))',
          card: 'hsl(var(--gray-card))',
          surface: 'hsl(var(--gray-surface))',
          border: 'hsl(var(--gray-border))',
        },
        status: {
          success: 'hsl(var(--status-success))',
          failed: 'hsl(var(--status-failed))',
          executing: 'hsl(var(--status-executing))',
          queued: 'hsl(var(--status-queued))',
          canceled: 'hsl(var(--status-canceled))',
          reattempting: 'hsl(var(--status-reattempting))',
        },
      },
      fontSize: {
        'mobile-title': ['22px', '28px'],
        'mobile-body': ['15px', '22px'],
        'mobile-secondary': ['14px', '22px'],
        'mobile-caption': ['13px', '18px'],
        'mobile-tab': ['11px', '14px'],
        'tablet-title': ['26px', '32px'],
        'tablet-body': ['17px', '24px'],
        'tablet-secondary': ['16px', '24px'],
        'tablet-caption': ['14px', '20px'],
      },
      borderRadius: {
        sheet: '16px',
      },
      boxShadow: {
        'md-mobile': '0 4px 12px rgba(0,0,0,0.2)',
        'lg-mobile': '0 8px 24px rgba(0,0,0,0.3)',
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};
