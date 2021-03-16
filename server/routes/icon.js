"use strict";

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function icon(fastify, options) {
	fastify.get("/favicon.ico", { config: options.config }, async () => {
		throw fastify.httpErrors.notFound();
	});
}

module.exports = icon;