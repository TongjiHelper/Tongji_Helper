module.exports = {
  root: true,
  env: {
    node: true
  },
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    "no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_"
      }
    ],
    semi: [
      "warn",
      "never",
      {
        beforeStatementContinuationChars: "any"
      }
    ],
    "no-console": [
      "warn"
    ],
    "no-debugger": [
      "warn"
    ],
    "no-useless-constructor": ["warn"]
  }
}
