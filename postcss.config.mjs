/** Tailwind v4 is configured entirely in CSS (globals.css @theme); the PostCSS
 * plugin is the only build wiring. No autoprefixer/postcss-import — built into v4. */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
