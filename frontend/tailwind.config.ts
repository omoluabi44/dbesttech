import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          dark: "var(--surface-dark)",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        info: "#3b82f6",

      },
      fontFamily: {
        primary: ["var(--font-comic-neue)", "cursive"],
        secondary: ["var(--font-outfit)", "sans-serif"],
        sans: ["var(--font-fredoka)", "sans-serif"],
      },
      animation: {
        'bounce-slight': 'bounce-slight 2s infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pop-in': 'pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'wiggle': 'wiggle 0.5s ease-in-out',
        'jelly': 'jelly 0.6s ease',
        'float': 'float 3s ease-in-out infinite',
        'rubber-band': 'rubber-band 0.6s ease',
        'tada': 'tada 0.8s ease',
        'squash-stretch': 'squash-stretch 0.3s ease',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'drift-right': 'drift-right 20s linear infinite',
        'float-up': 'float-up 8s ease-out infinite',
        'rainbow-shift': 'rainbow-shift 3s ease infinite',
      },
      keyframes: {
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%': { transform: 'none', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(-8deg)' },
          '30%': { transform: 'rotate(6deg)' },
          '45%': { transform: 'rotate(-4deg)' },
          '60%': { transform: 'rotate(2deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
        'jelly': {
          '0%': { transform: 'scale(1, 1)' },
          '25%': { transform: 'scale(0.9, 1.1)' },
          '50%': { transform: 'scale(1.1, 0.9)' },
          '75%': { transform: 'scale(0.95, 1.05)' },
          '100%': { transform: 'scale(1, 1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'rubber-band': {
          '0%': { transform: 'scaleX(1)' },
          '30%': { transform: 'scaleX(1.25) scaleY(0.75)' },
          '40%': { transform: 'scaleX(0.75) scaleY(1.25)' },
          '50%': { transform: 'scaleX(1.15) scaleY(0.85)' },
          '65%': { transform: 'scaleX(0.95) scaleY(1.05)' },
          '75%': { transform: 'scaleX(1.05) scaleY(0.95)' },
          '100%': { transform: 'scaleX(1) scaleY(1)' },
        },
        'tada': {
          '0%': { transform: 'scale(1) rotate(0deg)' },
          '10%, 20%': { transform: 'scale(0.9) rotate(-3deg)' },
          '30%, 50%, 70%, 90%': { transform: 'scale(1.1) rotate(3deg)' },
          '40%, 60%, 80%': { transform: 'scale(1.1) rotate(-3deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)' },
        },
        'squash-stretch': {
          '0%': { transform: 'scaleX(1) scaleY(1)' },
          '50%': { transform: 'scaleX(1.15) scaleY(0.85)' },
          '100%': { transform: 'scaleX(1) scaleY(1)' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.8) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.2) rotate(180deg)' },
        },
      },
      borderRadius: {
        'cartoon': '2rem',
        'bubble': '2.5rem',
      },
      boxShadow: {
        'cartoon': '0 4px 0 rgba(0, 0, 0, 0.1)',
        'cartoon-lg': '0 6px 0 rgba(0, 0, 0, 0.12)',
        'cartoon-pressed': '0 1px 0 rgba(0, 0, 0, 0.1)',
        'glow-gold': '0 0 20px rgba(250, 204, 21, 0.4)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-pink': '0 0 20px rgba(244, 114, 182, 0.3)',
        'glow-blue': '0 0 20px rgba(56, 189, 248, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
