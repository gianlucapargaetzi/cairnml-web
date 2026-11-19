// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    // generated from the server's schema (python -m apiserver.client_generator generate --target web): not edited by hand
    ignores: ["node_modules/*", "build/*", "dist/*", "electron/*",
      "src/app/business-logic/model/**", "src/app/business-logic/api-services/*.service.ts", "src/app/business-logic/api-services/api.ts",
      "src/app/business-logic/configuration.ts", "src/app/business-logic/variables.ts", "src/app/business-logic/encoder.ts"],
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
        "no-console": "error",
        "no-debugger": "error",
        "quotes": ["error", "single", {
          "allowTemplateLiterals": true
        }],
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "sm",
            "style": "camelCase"
          }
        ],
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "sm",
            "style": "kebab-case"
          }
        ],
        "@ngrx/prefer-effect-callback-in-block-statement": "off"
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/template/use-track-by-function": "warn"
    },
  }
);
