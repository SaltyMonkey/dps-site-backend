"use strict";

const S = require("fluent-json-schema");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function whitelistReq(fastify, options) {
	const prefix = options.prefix;
	const whitelist = options.whitelist;

	const schema = {
		response: {
			"2xx": S.array().items(
				S.object()
					.additionalProperties(false)
					.prop("AreaId", S.number().required())
					.prop("BossIds", S.array().items(S.number()).required())
			)
				.valueOf()
		}
	};


	fastify.get("/whitelist", { prefix, config: options.config, schema: schema }, async () => (
		whitelist
	));
}

module.exports = whitelistReq;