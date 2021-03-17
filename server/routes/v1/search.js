"use strict";

const S = require("fluent-json-schema");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function searchReq(fastify, options) {
	const dpsData = options.dpsData;

	const schemaRecent = {
		body: fastify.getSchema("searchRecentPostRequestBody"),
		response: {
			"2xx": fastify.getSchema("searchResponse2xx")
		}
	};

	const schemaByTop = {
		body: fastify.getSchema("searchTopPostRequestBody"),
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

		const [dbError, res] = await fastify.to(fastify.uploadModels.getLatestRuns(params, dpsData.apiConfig.recentRunsAmount));
		if(dbError) throw fastify.httpErrors.internalServerError("Internal database error");

		return res;
	});

	fastify.post("/search/top", { prefix: options.prefix, config: options.config, schema: schemaByTop }, async (req) => {
		let params = { ...req.body };
		if (params.playerClass) {
			params["members.playerClass"] = params.playerClass;
			delete params.playerClass;
		}

		const [dbError, res] = await fastify.to(fastify.uploadModels.getTopRuns(params, dpsData.apiConfig.topPlacesAmount));
		if(dbError) throw fastify.httpErrors.internalServerError("Internal database error");
		return res;
	});

	fastify.post("/search/id", { prefix: options.prefix, config: options.config, schema: schemaFull }, async (req) => {
		const [dbError, res] = await fastify.to(fastify.uploadModels.getCompleteRun(req.body.id));
		if(dbError) throw fastify.httpErrors.internalServerError("Internal database error");

		return res; 
	});
}

module.exports = searchReq;