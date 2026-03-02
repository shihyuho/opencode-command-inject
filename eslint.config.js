import eslint from "@eslint/js"
import tsEslintPlugin from "@typescript-eslint/eslint-plugin"
import tsEslintParser from "@typescript-eslint/parser"

export default [
  {
    ignores: [".opencode/**", "**/*.js"]
  },
  eslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsEslintParser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tsEslintPlugin
    },
    rules: {
      ...tsEslintPlugin.configs.recommended.rules,
      "no-undef": "off",
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
]
