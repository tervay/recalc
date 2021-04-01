module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true,
    jest: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: "module",
  },
  plugins: ["react", "prettier", "simple-import-sort"],
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
    "react-hooks/exhaustive-deps": "off",
    "no-unused-vars": "warn",
    "import/no-webpack-loader-syntax": "off",
    "import/no-unresolved": "off",
  },
  settings: {
    react: {
      version: "detect",
    },
  },
  globals: {
    useStateMock: "readonly",
  },
};
