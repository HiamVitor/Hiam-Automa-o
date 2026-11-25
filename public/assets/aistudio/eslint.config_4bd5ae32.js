import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'public/**/*', 'ABRIR_DIRETO.html'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
