import { stdSerializers } from "pino";
import { startApp } from "./app.ts";

export async function startServer() {
	const app = await startApp();

	try {
		await app.listen({
			host: "0.0.0.0",
			port: 3000,
			listenTextResolver: (address: string) => {
				return `template app listening at ${address}`;
			},
		});
		return app;
	} catch (err) {
		app.log.error(
			{ error: stdSerializers.err(err as Error) },
			"Error while starting server: ",
		);
		process.exit(1);
	}
}
