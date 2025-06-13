import eslint from '@eslint/js';
import react from 'eslint-plugin-react';
import sortImports from 'eslint-plugin-simple-import-sort';
import sortKeys from 'eslint-plugin-sort-keys-fix';
import tseslint from 'typescript-eslint';

export default tseslint.config(eslint.configs.recommended, tseslint.configs.recommended, {
	files: ['**/*.{js,jsx,ts,tsx}'],
	languageOptions: {
		parserOptions: {
			ecmaFeatures: {
				jsx: true,
			},
		},
	},
	plugins: {
		react,
		'sort-keys-fix': sortKeys,
		'simple-import-sort': sortImports,
	},
	rules: {
		'sort-keys-fix/sort-keys-fix': 'error',
		'simple-import-sort/imports': 'error',
		'simple-import-sort/exports': 'error',
		'@typescript-eslint/no-unused-vars': 'warn',
	},
});
