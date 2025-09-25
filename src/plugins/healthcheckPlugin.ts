import type { FastifyPluginCallback } from "fastify";
import fp from "fastify-plugin";

const plugin: FastifyPluginCallback = (app, _opts, done) => {
	app.route({
		url: "/healthcheck",
		method: "GET",
		logLevel: "info",

		handler: (_req, reply) => {
			return reply.send({
				status: "OK",
			});
		},
	});

	done();
};

export const healthcheckPlugin = fp(plugin, {
	fastify: ">=4.x",
	name: "common-healthcheck-plugin",
});
