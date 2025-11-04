/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#ffffff',
        'bg-secondary': '#f6f8fa',
        'bg-tertiary': '#f0f2f5',
        'text-primary': '#1f2937',
        'text-secondary': '#6b7280',
        'text-tertiary': '#9ca3af',
        'accent-blue': '#3b82f6',
        'accent-green': '#10b981',
        'accent-yellow': '#f59e0b',
        'accent-red': '#ef4444',
        'accent-purple': '#8b5cf6',
        'border': '#e5e7eb',
        'border-focus': '#3b82f6',
      },
    },
  },
  plugins: [],
}
