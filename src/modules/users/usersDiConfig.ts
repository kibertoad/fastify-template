import type {
	CoreDependencies,
	MandatoryNameAndRegistrationPair,
} from "../../infrastructure/coreDiConfig.ts";
import {
	asControllerClass,
	asSingletonClass,
} from "../../infrastructure/diCommon.ts";
import { UsersController } from "./controllers/UsersController.ts";
import { UsersRepository } from "./repositories/UsersRepository.ts";
import { UsersService } from "./services/UsersService.ts";

export type UsersModuleDependencies = {
	usersController: UsersController;
	usersService: UsersService;
	usersRepository: UsersRepository;
};

export type UsersModulePublicDependencies = Pick<
	UsersModuleDependencies,
	"usersService"
>;
export type UsersModuleInjectableDependencies = UsersModuleDependencies &
	CoreDependencies;

export const resolveUserDependencies = () => {
	return {
		usersController: asControllerClass(UsersController),
		usersRepository: asSingletonClass(UsersRepository),
		usersService: asSingletonClass(UsersService),
	} satisfies MandatoryNameAndRegistrationPair<UsersModuleDependencies>;
};
