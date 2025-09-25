import type { AppRouter } from "@ts-rest/core";
import type { RouterImplementation } from "@ts-rest/fastify";

export const CONTROLLER_TAG = "controller";

export abstract class AbstractController<TContract_1 extends AppRouter> {
	public abstract contract: TContract_1;
	public abstract resolveRouter(): RouterImplementation<TContract_1>;
}
