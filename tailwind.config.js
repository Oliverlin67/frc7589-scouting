module.exports = {
  content: ["./public/**/*.{html,js}"],
  important: true,
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ],
}
