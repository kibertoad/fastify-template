import { envvar, type InferEnv, parseEnv } from "envase";
import { z } from "zod";

const CONFIG_SCHEMA = {
	db: {
		database: envvar("DB_DATABASE", z.string().min(1)),
		host: envvar("DB_HOST", z.string().min(1)),
		user: envvar("DB_USER", z.string().min(1)),
		password: envvar("DB_PASSWORD", z.string().min(1)),
		port: envvar("DB_PORT", z.coerce.number().min(1)),
		max: envvar("DB_MAX_CONNECTIONS", z.coerce.number().min(1)),
	},
} as const;

export const generateConfig = () => {
	return parseEnv(process.env, CONFIG_SCHEMA);
};

export type Config = InferEnv<typeof CONFIG_SCHEMA>;
