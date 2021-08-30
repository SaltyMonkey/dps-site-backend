"use strict";

/**
 * Wrapper for hardcoded in shinra time check request to prevent 404 counter ticks
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {object} options 
 */
async function time(fastify, options) {
	fastify.get("/api/shinra/servertime", { config: options.config }, async () => ({ message: "hello :)" }));
}

module.exports = time;