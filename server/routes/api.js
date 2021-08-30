"use strict";

/**
 * API list
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {object} options 
 */
async function listReq(fastify, options) {
	fastify.get("/api", { config: options.config }, async () => fastify.routes);
}

module.exports = listReq;