module.exports = {
  plugins: [
    'react'
  ],
  parser: 'babel-eslint',
  extends: ['plugin:react/recommended', 'semistandard'],
  rules: {
    'camelcase': 0,
    'no-duplicate-imports': 0,
    'no-alert': 'error',
    'no-return-assign': 0,
    'quotes': [2, 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'jsx-quotes': [2, 'prefer-double'],
    'react/prop-types': [1, { ignore: ['children'] }]
  },
  env: {
    browser: true,
    node: true
  },
  globals: {
    describe: false,
    it: false,
    expect: false,
    fin: false
  }
};

