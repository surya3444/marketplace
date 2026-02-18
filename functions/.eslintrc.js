module.exports = {
  root: true,
  env: {
    es6: true,
    node: true, // <--- THIS LINE IS CRITICAL
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "max-len": "off", // Disable line length warnings
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "error",
    "require-jsdoc": "off", // Disable documentation requirements
    "object-curly-spacing": "off",
    "indent": "off", // Disable indentation checks
    "comma-dangle": "off"
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
};