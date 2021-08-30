"use strict";

/**
 * Icon path
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {object} options 
 */
async function icon(fastify, options) {
	fastify.get("/favicon.ico", { config: options.config }, async () => {
		throw fastify.httpErrors.notFound();
	});
}

module.exports = icon;