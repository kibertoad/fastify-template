import { fastifyAwilixPlugin } from "@fastify/awilix";
import { initServer } from "@ts-rest/fastify";
import { type AwilixContainer, createContainer } from "awilix";
import fastify from "fastify";
import { stdSerializers } from "pino";
import {
	type AbstractController,
	CONTROLLER_TAG,
} from "./infrastructure/AbstractController.ts";
import {
	type AllDependencies,
	resolveCoreDependencies,
} from "./infrastructure/coreDiConfig.ts";
import { registerDependencies } from "./infrastructure/diCommon.ts";
import { errorHandler } from "./infrastructure/errors/errorHandler.ts";
import { usersModulePlugin } from "./modules/users/usersModulePlugin.ts";
import { healthcheckPlugin } from "./plugins/healthcheckPlugin.ts";

export const startApp = async () => {
	const app = fastify();
	await app.register(healthcheckPlugin);

	app.setErrorHandler(errorHandler);
	const diContainer: AwilixContainer<AllDependencies> = createContainer({
		injectionMode: "PROXY",
	});

	await app.register(fastifyAwilixPlugin, {
		container: diContainer,
		disposeOnClose: true,
		disposeOnResponse: false,
		asyncInit: true,
		asyncDispose: true,
		eagerInject: true,
	});

	const coreResolvers = resolveCoreDependencies(app);
	registerDependencies(diContainer, coreResolvers);

	await app.register(usersModulePlugin, {
		diContainer,
	});

	app.after(() => {
		const { awilixManager } = app;
		const allControllers: Record<
			string,
			// biome-ignore lint/suspicious/noExplicitAny: We accept any controller here
			AbstractController<any>
		> = awilixManager.getWithTags(diContainer, [CONTROLLER_TAG]);

		const s = initServer();
		for (const controller of Object.values(allControllers)) {
			s.registerRouter(controller.contract, controller.resolveRouter(), app, {
				logInitialization: true,
			});
		}
	});

	try {
		await app.ready();
	} catch (err) {
		app.log.error(
			{ error: stdSerializers.err(err as Error) },
			"Error while initializing app: ",
		);
		throw err;
	}

	return app;
};
