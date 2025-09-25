import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},
		pool: "threads",
		watch: false,
		environment: "node",
		setupFiles: ["test/envSetupHook.ts"],
		reporters: ["default"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: [
				"src/db/*",
				"src/infrastructure/coreDiConfig.ts",
				"src/infrastructure/errors/publicErrors.ts",
				"src/infrastructure/errors/internalErrors.ts",
				"src/modules/users/schemas/*.ts",
				"src/server.ts",
				"src/app.ts",
				"src/**/*.spec.ts",
				"src/**/*.test.ts",
			],
			reporter: ["text"],
			all: true,
			thresholds: {
				lines: 70,
				functions: 80,
				branches: 70,
				statements: 70,
			},
		},
	},
});
