import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Frontend/backend boundary. Pages and routes in app/ are where the two
  // meet: they call backend code and pass the results to frontend
  // components as props.
  {
    // The frontend never runs backend code; it may use backend *types*
    // (the data shapes it is handed), nothing else.
    files: ["frontend/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/backend/*", "@/backend/**"],
              allowTypeImports: true,
              message:
                "Frontend code must not import backend code. Load the data in the page (app/) and pass it in as props; type imports are fine.",
            },
          ],
        },
      ],
    },
  },
  {
    // The backend (including the bot and rate worker) knows nothing about
    // the UI or the routing layer.
    files: ["backend/**/*.ts"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/frontend/*", "@/frontend/**", "@/app/*", "@/app/**"],
              message: "Backend code must not import frontend or app code.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktree copies made by the Kilo Code editor extension, not this code.
    ".kilo/**",
  ]),
]);

export default eslintConfig;
