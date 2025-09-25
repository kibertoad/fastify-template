import { initContract } from "@ts-rest/core";
import type { RouterImplementation } from "@ts-rest/fastify";
import { AbstractController } from "../../../infrastructure/AbstractController.ts";
import type { TSRestServer } from "../../../infrastructure/coreDiConfig.ts";
import type { User } from "../schemas/userSchemas.ts";
import type { UsersService } from "../services/UsersService.ts";
import type { UsersModuleInjectableDependencies } from "../usersDiConfig.ts";

const c = initContract();

export const USER_CONTRACTS = c.router({
	getUser: {
		method: "GET",
		path: "/users/:userId",
		responses: {
			200: c.type<User>(),
		},
	},
});

type UserContracts = typeof USER_CONTRACTS;

export class UsersController extends AbstractController<UserContracts> {
	public contract = USER_CONTRACTS;
	private readonly userService: UsersService;
	private readonly tsRestServer: TSRestServer;

	constructor(dependencies: UsersModuleInjectableDependencies) {
		super();
		this.userService = dependencies.usersService;
		this.tsRestServer = dependencies.tsRestServer;
	}

	override resolveRouter(): RouterImplementation<UserContracts> {
		return this.tsRestServer.router(this.contract, {
			getUser: async ({ params }) => {
				const user = await this.userService.getUser(
					Number.parseInt(params.userId, 10),
				);
				return {
					status: 200,
					body: user,
				};
			},
		});
	}
}
