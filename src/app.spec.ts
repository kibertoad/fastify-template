import type { FastifyInstance } from "fastify";
import { startApp } from "./app.ts";

describe("App", () => {
	let app: FastifyInstance | undefined;
	beforeAll(async () => {});

	afterAll(async () => {
		await app?.close();
	});

	describe("healthcheck", () => {
		it("Returns OK when healthcheck passes", async () => {
			app = await startApp();

			const response = await app.inject({
				method: "GET",
				url: "/healthcheck",
			});

			expect(response.json()).toMatchInlineSnapshot(`
				{
				  "status": "OK",
				}
			`);
		});
	});
});
