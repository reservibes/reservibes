import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "coverage/**", "next-env.d.ts"],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/core/*", "@/infra/*"],
              message:
                "La capa UI (src/ui/) no puede importar de core ni de infra. Solo debe recibir datos por props.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/core/**/*.ts", "src/core/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/ui/*", "@/infra/*"],
              message:
                "La capa core no puede importar de ui ni de infra. Solo conoce las interfaces de core/ports/.",
            },
            {
              group: ["resend", "mercadopago", "@paddle/*", "@supabase/*"],
              message:
                "La capa core no puede importar librerías de proveedores. Usa los puertos de core/ports/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/infra/**/*.ts", "src/infra/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/ui/*"],
              message: "La capa infra no puede importar de ui.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/**/*.ts", "src/shared/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/core/*", "@/infra/*", "@/ui/*"],
              message:
                "La capa shared es transversal y no puede importar de core, infra ni ui.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;