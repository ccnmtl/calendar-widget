import { FlatCompat } from "@eslint/eslintrc";
import eslintRecommended from "@eslint/js"; // Import the recommended config

const compat = new FlatCompat({
    baseDirectory: import.meta.url, // Required for resolving paths
    recommendedConfig: eslintRecommended.configs.recommended // Pass the recommended config
});

export default [
    ...compat.extends("eslint:recommended"),
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 2015,
            sourceType: "module"
        },
        rules: {
            "indent": ["error", 4, { "SwitchCase": 1 }],
            "linebreak-style": ["error", "unix"],
            "quotes": ["error", "single"],
            "semi": ["error", "always"]
        }
    },
    {
        ignores: ["tests/**"] // Ignore everything in the /tests folder
    }
];