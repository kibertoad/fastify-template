import type { NewUser } from "../../../../db/database.ts";
import { PublicNonRecoverableError } from "../../../infrastructure/errors/PublicNonRecoverableError.ts";
import type { UsersRepository } from "../repositories/UsersRepository.ts";
import type { User } from "../schemas/userSchemas.ts";
import type { UsersModuleInjectableDependencies } from "../usersDiConfig.ts";

export class UsersService {
	private readonly usersRepository: UsersRepository;
	constructor(dependencies: UsersModuleInjectableDependencies) {
		this.usersRepository = dependencies.usersRepository;
	}

	async getUser(id: number): Promise<User> {
		const user = await this.usersRepository.getUser(id);
		if (!user) {
			throw new PublicNonRecoverableError({
				errorCode: "USER_NOT_FOUND",
				message: "User not found",
				httpStatusCode: 404,
			});
		}

		return {
			firstName: user.first_name,
			lastName: user.last_name,
		};
	}

	createUser(user: NewUser) {
		return this.usersRepository.createUser(user);
	}
}
