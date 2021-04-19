module.exports = {
    'env': {
        'browser': true,
        'es6': true
    },
    'extends': [
        'eslint:recommended',
        'plugin:react/recommended'
    ],
    'parserOptions': {
        'ecmaFeatures': {
            'jsx': true
        },
        'ecmaVersion': 2020,
        'sourceType': 'module'
    },
    'rules': {
        'indent': [
            'warn', 4,
            { 'SwitchCase': 1 }
        ],
        'no-unused-vars': 'warn',
        'linebreak-style': [
            'warn',
            'unix'
        ],
        'quotes': [
            'warn',
            'single'
        ],
        'semi': [
            'warn',
            'never'
        ],
        'eqeqeq': 'warn',
        'no-trailing-spaces': 'warn',
        'object-curly-spacing': [
            'warn', 'always'
        ],
        'arrow-spacing': [
            'warn', { 'before': true, 'after': true }
        ],
        'no-console': 0,
        'react/prop-types': 0
    }, 'globals': {
        'module': 'readonly',
        'chrome': 'readonly'
    }
}