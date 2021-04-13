"use strict";

/**
 * CORS
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function corsReqs(fastify, options) {
	fastify.options("*", { config: options.config }, async (req, res) => {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Methods", "POST, GET");
		res.status(204);
	});
}

module.exports = corsReqs;