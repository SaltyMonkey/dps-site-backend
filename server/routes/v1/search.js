"use strict";

const S = require("fluent-json-schema");
const classes = require("../../enums/classes");
const regions = require("../../enums/regions");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function searchReq(fastify, options) {
	const apiConfig = options.apiConfig;

	const responseSchema = S.array()
		.id("searchResponse2xx")
		.description("Cutted upload representation with basic info")
		.items(
			S.object()
				.additionalProperties(false)
				.prop("id", S.string().required())
				.prop("areaId", S.number().required())
				.prop("bossId", S.number().required())
				.prop("uploadTime", S.string().required())
				.prop("fightDuration", S.string().required())
				.prop("isP2WConsums", S.boolean().required())
				.prop("isMultipleTanks", S.boolean().required())
				.prop("isMultipleHeals", S.boolean().required())
				.prop("partyDps", S.string().required())
				.prop("members", S.array().required().items(
					S.object()
						.additionalProperties(false)
						.prop("playerClass", S.string().required())
						.prop("playerDps", S.string().required())
				))

		)
		.valueOf();

	const schemaRecent = {
		body: (S.object()
			.id("searchRecentPostRequestBody")
			.description("All available parameters for search in recent requests")
			.additionalProperties(false)
			.prop("region", S.enum(regions))
			.prop("areaId", S.number())
			.prop("bossId", S.number())
			.prop("isShame", S.boolean())
			.prop("playerClass", S.enum(Object.values(classes)))
			.prop("excludeP2wConsums", S.boolean())
		)
			.valueOf(),
		response: {
			"2xx": responseSchema
		}
	};

	const schemaByTop = {
		body: (S.object()
			.id("searchTopPostRequestBody")
			.description("All available parameters to search in top runs")
			.additionalProperties(false)
			.prop("region", S.enum(regions).required())
			.prop("areaId", S.number().required())
			.prop("bossId", S.number().required())
			.prop("playerClass", S.enum(Object.values(classes)).required())
			.prop("excludeP2wConsums", S.boolean().required())
		)
			.valueOf(),
		response: {
			"2xx": responseSchema
		}
	};

	const schemaFull = {
		body: (S.object()
			.additionalProperties(false)
			.prop("id", S.string().required()))
			.valueOf(),
		response: {
			"2xx": (S.object()
				.id("completeUploadDbResponse")
				.additionalProperties(false)
				.prop("bossId", S.number().required())
				.prop("areaId", S.number().required())
				.prop("region", S.string().required())
				.prop("encounterUnixEpoch", S.number().required())
				.prop("fightDuration", S.string().required())
				.prop("partyDps", S.string().required())
				.prop("isMultipleHeals", S.boolean().required())
				.prop("isMultipleTanks", S.boolean().required())
				.prop("debuffUptime", S.array().required().items(
					S.object()
						.additionalProperties(false)
						.prop("key", S.number().required())
						.prop("value", S.number().required())
				))
				.prop("isShame", S.boolean().required())
				.prop("isP2WConsums", S.boolean().required())
				.prop("uploader", S.object()
					.additionalProperties(false)
					.prop("playerClass", S.enum(Object.values(classes)).required())
					.prop("playerName", S.string().required())
					.prop("playerId", S.number().required())
					.prop("playerServerId", S.number().required())
				)
				.prop("members", S.array().required().items(
					S.object()
						.prop("playerClass", S.enum(Object.values(classes)).required())
						.prop("playerName", S.string().required())
						.prop("playerId", S.number().required())
						.prop("playerServerId", S.number().required())
						.prop("aggroPercent", S.number().required())
						.prop("playerAverageCritRate", S.number().required())
						.prop("playerDeathDuration", S.string().required())
						.prop("playerDeaths", S.number().required())
						.prop("playerDps", S.string().required())
						.prop("playerTotalDamage", S.string().required())
						.prop("playerTotalDamagePercentage", S.number().required())
						.prop("buffUptime", S.array().required().items(
							S.object()
								.additionalProperties(false)
								.prop("key", S.number().required())
								.prop("value", S.number().required())
						))
						.prop("skillLog", S.array().required().items(
							S.object()
								.additionalProperties(false)
								.prop("skillAverageCrit", S.string().required())
								.prop("skillAverageWhite", S.string().required())
								.prop("skillCritRate", S.number().required())
								.prop("skillDamagePercent", S.number().required())
								.prop("skillHighestCrit", S.string().required())
								.prop("skillHits", S.string().required())
								.prop("skillCasts", S.string().required())
								.prop("skillId", S.number().required())
								.prop("skillLowestCrit", S.string().required())
								.prop("skillTotalDamage", S.string().required())
						))
				))
			)
				.valueOf()
		}
	};

	fastify.post("/search/recent", { prefix: options.prefix, config: options.config, schema: schemaRecent }, async (req) => {
		let params = { ...req.body };
		if (params.playerClass) {
			params["members.playerClass"] = params.playerClass;
			delete params.playerClass;
		}

		const [dbError, res] = await fastify.to(fastify.uploadModels.getLatestRuns(params, apiConfig.recentRunsAmount));
		if (dbError) throw fastify.httpErrors.internalServerError("Internal database error");

		return res;
	});

	fastify.post("/search/top", { prefix: options.prefix, config: options.config, schema: schemaByTop }, async (req) => {
		let params = { ...req.body };
		if (params.playerClass) {
			params["members.playerClass"] = params.playerClass;
			delete params.playerClass;
		}

		const [dbError, res] = await fastify.to(fastify.uploadModels.getTopRuns(params, apiConfig.topPlacesAmount));
		if (dbError) throw fastify.httpErrors.internalServerError("Internal database error");
		return res;
	});

	fastify.post("/search/id", { prefix: options.prefix, config: options.config, schema: schemaFull }, async (req) => {
		const [dbError, res] = await fastify.to(fastify.uploadModels.getCompleteRun(req.body.id));
		if (dbError) throw fastify.httpErrors.internalServerError("Internal database error");

		return res;
	});
}

module.exports = searchReq;