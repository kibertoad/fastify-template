import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import pino, { stdSerializers } from "pino";
import { isInternalError } from "./InternalError.ts";
import { isPublicNonRecoverableError } from "./PublicNonRecoverableError.ts";

export function isObject(
	maybeObject: unknown,
): maybeObject is Record<PropertyKey, unknown> {
	return typeof maybeObject === "object" && maybeObject !== null;
}

type ResponseObject = {
	statusCode: number;
	payload: {
		message: string;
		errorCode: string;
		details?: Record<string, unknown>;
	};
};

function resolveLogObject(error: unknown): Record<string, unknown> {
	if (isInternalError(error)) {
		return {
			msg: error.message,
			code: error.errorCode,
			details: error.details ? JSON.stringify(error.details) : undefined,
			error: pino.stdSerializers.err({
				name: error.name,
				message: error.message,
				stack: error.stack,
			}),
		};
	}

	return {
		message: isObject(error) ? error.message : JSON.stringify(error),
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		error: error instanceof Error ? pino.stdSerializers.err(error) : error,
	};
}

function resolveResponseObject(error: Error): ResponseObject {
	if (isPublicNonRecoverableError(error)) {
		return {
			statusCode: error.httpStatusCode ?? 500,
			payload: {
				message: error.message,
				errorCode: error.errorCode,
				details: error.details,
			},
		};
	}

	return {
		statusCode: 500,
		payload: {
			message: "Internal server error",
			errorCode: "INTERNAL_SERVER_ERROR",
		},
	};
}

export const errorHandler = function (
	this: FastifyInstance,
	error: Error,
	request: FastifyRequest,
	reply: FastifyReply,
): void {
	const logObject = resolveLogObject(error);

	request.log.error(logObject);

	if (isInternalError(error)) {
		this.log.error(
			{
				error: stdSerializers.err(error),
			},
			error.message,
		);
	}

	const responseObject = resolveResponseObject(error);
	void reply.status(responseObject.statusCode).send(responseObject.payload);
};
