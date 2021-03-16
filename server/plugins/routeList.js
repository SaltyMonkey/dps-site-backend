"use strict";

const fp = require("fastify-plugin");

async function fastifyRoutes(fastify) {
	fastify.decorate("routes", []);

	fastify.addHook("onRoute", async (routeOptions) => {
		const { method, schema, url} = routeOptions;
		const _method = Array.isArray(method) ? method : [method];

		_method.forEach(method => {
			let rt = {
				method,
				url,
				schema,
			};
			fastify.routes.push(rt);
		});
	});
}

module.exports = fp(fastifyRoutes);