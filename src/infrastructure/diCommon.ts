import {
	type AwilixContainer,
	asClass,
	asFunction,
	type BuildResolver,
	type BuildResolverOptions,
	type Constructor,
	type DisposableResolver,
	type FunctionReturning,
	type Resolver,
} from "awilix";
import { CONTROLLER_TAG } from "./AbstractController.ts";
import type { MandatoryNameAndRegistrationPair } from "./coreDiConfig.ts";

export function asSingletonClass<T = object>(
	Type: Constructor<T>,
	opts?: BuildResolverOptions<T>,
): BuildResolver<T> & DisposableResolver<T> {
	return asClass(Type, {
		...opts,
		lifetime: "SINGLETON",
	});
}

export function asControllerClass<T = object>(
	Type: Constructor<T>,
	opts?: BuildResolverOptions<T>,
): BuildResolver<T> & DisposableResolver<T> {
	return asClass(Type, {
		...opts,
		tags: [CONTROLLER_TAG],
		lifetime: "SINGLETON",
	});
}

export function asSingletonFunction<T>(
	fn: FunctionReturning<T>,
	opts?: BuildResolverOptions<T>,
): BuildResolver<T> & DisposableResolver<T> {
	return asFunction(fn, {
		...opts,
		lifetime: "SINGLETON",
	});
}

export function registerDependencies(
	diContainer: AwilixContainer,
	resolvers: MandatoryNameAndRegistrationPair<unknown>,
) {
	for (const [dependencyKey, _dependencyValue] of Object.entries(resolvers)) {
		const dependencyValue = { ...(_dependencyValue as Resolver<unknown>) };
		diContainer.register(dependencyKey, dependencyValue);
	}
}
