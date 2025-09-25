import type { AwilixContainer } from "awilix";
import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";
import { registerDependencies } from "../../infrastructure/diCommon.ts";
import { resolveUserDependencies } from "./usersDiConfig.ts";

export type UsersModuleOptions = {
	diContainer: AwilixContainer;
};

const plugin: FastifyPluginCallback<UsersModuleOptions> = (
	_app,
	opts,
	done,
) => {
	const userDependencies = resolveUserDependencies();
	registerDependencies(opts.diContainer, userDependencies);

	done();
};

export const usersModulePlugin = fp(plugin, {
	fastify: ">=4.x",
	name: "users-module-plugin",
});
