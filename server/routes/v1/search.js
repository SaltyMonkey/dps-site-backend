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

	const schemaRecent = {
		body: (S.object()
			.additionalProperties(false)
			.prop("region", S.enum(regions))
			.prop("areaId", S.number())
			.prop("bossId", S.number())
			.prop("isShame", S.boolean())
			.prop("class", S.enum(classes)))
			.valueOf(),
		response: {
			"2xx": S.array().items(
				S.object()
					.additionalProperties(false)
					.prop("uploadTime", S.string().required())
					.prop("fightDuration", S.string().required())
					.prop("partyDps", S.string().required())
					.prop("id", S.string().required())
					.prop("areaId", S.number().required())
					.prop("bossIds", S.number().required())
					.prop("members", S.array().items(
						S.object()
							.additionalProperties(false)
							.prop("class", S.number().required())
							.prop("name", S.number().required())
					))

			)
				.valueOf()
		}
	};

	const schemaByPlayer = {
		body: (S.object()
			.additionalProperties(false)
			.prop("region", S.enum(regions))
			.prop("areaId", S.number())
			.prop("bossId", S.number())
			.prop("playerId", S.number())
			.prop("playerServer", S.string())
		)
			.valueOf(),
		response: {
			"2xx": S.array().items(
				S.object()
					.additionalProperties(false)
					.prop("uploadTime", S.string().required())
					.prop("fightDuration", S.string().required())
					.prop("partyDps", S.string().required())
					.prop("id", S.string().required())
					.prop("areaId", S.number().required())
					.prop("bossIds", S.number().required())
					.prop("members", S.array().items(
						S.object()
							.additionalProperties(false)
							.prop("class", S.number().required())
							.prop("name", S.number().required())
					))

			)
				.valueOf()
		}
	};

	const schemaFull = {
		body: (S.object()
			.additionalProperties(false)
			.prop("id", S.string().required()))
			.valueOf()
	};

	fastify.post("/search/recent", { prefix: options.prefix, config: options.config, schema: schemaRecent }, async (req) => (
		await fastify.uploadModels.getLatestRuns(req.body, 70)
	));

	fastify.post("/search/player", { prefix: options.prefix, config: options.config, schema: schemaByPlayer }, async (req) => (
		await fastify.uploadModels.getLatestRuns(req.body, 70)
	));

	fastify.post("/search/id", { prefix: options.prefix, config: options.config, schema: schemaFull }, async (req) => (
		await fastify.uploadModels.getCompleteRun({ "id": req.body.id.toString().trim() })
	));
}

module.exports = searchReq;