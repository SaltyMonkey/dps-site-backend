"use strict";

const S = require("fluent-json-schema");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function searchReq(fastify, options) {

	const schemaRecent = {
		body: fastify.getSchema("searchPostRequestBody"),
		response: {
			"2xx": fastify.getSchema("searchResponse2xx")
		}
	};

	const schemaByTop = {
		body: fastify.getSchema("searchPostRequestBody"),
		response: {
			"2xx": fastify.getSchema("searchResponse2xx")
		}
	};

	const schemaFull = {
		body: (S.object()
			.additionalProperties(false)
			.prop("id", S.string().required()))
			.valueOf(),
		response: {
			"2xx": fastify.getSchema("completeDetails")
		}
	};

	fastify.post("/search/recent", { prefix: options.prefix, config: options.config, schema: schemaRecent }, async (req) => {
		let params = { ...req.body };
		if (params.playerClass) {
			params["members.playerClass"] = params.playerClass;
			delete params.playerClass;
		}
		await fastify.uploadModels.getLatestRuns(params, 70);
	});

	fastify.post("/search/top", { prefix: options.prefix, config: options.config, schema: schemaByTop }, async (req) => (
		await fastify.uploadModels.getTopRuns(req.body, 100)
	));

	fastify.post("/search/id", { prefix: options.prefix, config: options.config, schema: schemaFull }, async (req) => (
		await fastify.uploadModels.getCompleteRun(req.body.id)
	));
}

module.exports = searchReq;