"use strict";

const S = require("fluent-json-schema");
const humanizeDuration = require("humanize-duration");

/**
 * Live route
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function statsReq(fastify, options) {

	const schema = {
		response: {
			"2xx": (S.object()
				.additionalProperties(false)
				.prop("uptime", S.number().required())
			)
				.valueOf()
		}
	};

	fastify.get("/live", { config: options.config, schema: schema }, async () => ({
		uptime: humanizeDuration(process.uptime(), { round: true }),
	}));
}

module.exports = statsReq;