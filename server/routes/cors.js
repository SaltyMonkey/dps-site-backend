"use strict";

/**
 * CORS
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {object} options 
 */
async function corsReqs(fastify, options) {
	fastify.options("*", { config: options.config }, async (req, res) => {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "*");
		res.header("Access-Control-Allow-Methods", "POST, GET");
		res.header("Access-Control-Max-Age", "86400");
		res.status(204);
	});
}

module.exports = corsReqs;