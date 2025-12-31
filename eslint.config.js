import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
    { ignores: ['dist', 'node_modules', 'vendor', 'public'] },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
                project: './tsconfig.json',
                tsconfigRootDir: '.',
            },
            globals: {
                ...globals.browser,
                ...globals.es2021,
                route: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            react: reactPlugin,
            'react-refresh': reactRefreshPlugin,
            'react-hooks': reactHooksPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
                alias: {
                    map: [
                        ['@', './resources/js'],
                        ['@types', './resources/js/types'],
                    ],
                    extensions: ['.ts', '.tsx', '.js', '.jsx'],
                },
            },
            react: {
                version: 'detect',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_' },
            ],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
        },
    },
];
