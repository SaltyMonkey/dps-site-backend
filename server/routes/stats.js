"use strict";

const S = require("fluent-json-schema");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function statsReq(fastify, options) {

	const schema = {
		response: {
			"2xx": (S.object()
				.additionalProperties(false)
				.prop("uptime", S.number().required())
				.prop("dbStatus", S.number().required())
				.prop("serverTime", S.string().required())
			)
				.valueOf()
		}
	};

	fastify.get("/live", { config: options.config, schema: schema }, async () => ({
		uptime: process.uptime(),
		dbStatus: fastify.mongoose.connection.readyState,
		serverTime: new Date().toISOString()
	}));
}

module.exports = statsReq;