// PostCSS wires Tailwind v4 into Next.js. No tailwind.config file needed:
// in v4, theme tokens live directly in CSS (see src/app/globals.css).
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
