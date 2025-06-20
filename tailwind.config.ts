import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				DEFAULT: '#2563eb',
  				foreground: '#ffffff',
  			},
  			accent: {
  				DEFAULT: '#e0e7ff',
  				foreground: '#2563eb',
  			},
  			background: '#f8fafc',
  			foreground: '#1e293b',
  			border: '#e5e7eb',
  			card: {
  				DEFAULT: '#ffffff',
  				foreground: '#1e293b',
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: '#f1f5f9',
  				foreground: '#1e293b',
  				primary: '#2563eb',
  				'primary-foreground': '#ffffff',
  				accent: '#e0e7ff',
  				'accent-foreground': '#2563eb',
  				border: '#e5e7eb',
  				ring: '#2563eb',
  			}
  		},
  		borderRadius: {
  			lg: '1rem',
  			md: '0.75rem',
  			sm: '0.5rem',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		boxShadow: {
  			card: '0 2px 8px 0 rgba(16, 30, 54, 0.06)',
  			button: '0 1px 3px 0 rgba(16, 30, 54, 0.08)',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
