import { initClient } from "@ts-rest/core";
import type { FastifyInstance } from "fastify";
import { beforeEach } from "vitest";
import { cleanDatabase } from "../../../../test/dbCleaner.ts";
import { startServer } from "../../../server.ts";
import { USER_CONTRACTS } from "./UsersController.ts";

const userClient = initClient(USER_CONTRACTS, {
	baseUrl: "http://localhost:3000",
	throwOnUnknownStatus: false,
	baseHeaders: {},
});

describe("UsersController", () => {
	let app: FastifyInstance;
	beforeAll(async () => {
		app = await startServer();
	});
	beforeEach(async () => {
		await cleanDatabase(app.diContainer.cradle.database, ["user"]);
	});

	afterAll(async () => {
		await app?.close();
	});

	describe("getUsers", () => {
		it("Throws an error if user does not exist", async () => {
			const response = await userClient.getUser({
				params: {
					userId: "1",
				},
			});

			expect(response.status).toBe(404);
			expect(response.body).toMatchInlineSnapshot(`
                  {
                    "errorCode": "USER_NOT_FOUND",
                    "message": "User not found",
                  }
                `);
		});

		it("Returns existing user", async () => {
			const { usersRepository } = app.diContainer.cradle;
			const user = await usersRepository.createUser({
				first_name: "Test",
				last_name: "Test2",
				metadata: "{}",
			});

			const response = await userClient.getUser({
				params: {
					userId: user.id.toString(),
				},
			});

			expect(response.status).toBe(200);
		});
	});
});
