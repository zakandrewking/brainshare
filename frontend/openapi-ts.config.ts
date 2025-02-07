import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "openapi.json",
  output: "src/client",
  plugins: [
    {
      name: "@hey-api/client-next",
      runtimeConfigPath: "./src/hey-api.ts",
    },
  ],
});
