module.exports = {
  content: [
    "./templates/**/*.html",
    "./apps/**/*.py",
    "./static/web/js/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Segoe UI", "Arial", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  daisyui: {
    themes: ["winter"]
  },
  plugins: [require("daisyui")]
};
