"use strict";

const S = require("fluent-json-schema");
const classes = require("../../enums/classes");
const roles = require("../../enums/classRoles");
const time = require("../../enums/time");
const strings = require("../../enums/strings");
const luxon = require("luxon");
const NodeCache = require("node-cache");
const hasher = require("node-object-hash")({ alg: "sha1" });

const isPlacedInCache = (cache, key) => cache.has(key);
const getPlacedInCache = (cache, key) => cache.get(key);
const setInCache = (cache, key, val) => cache.set(key, val);
const generateKeyFromRequest = (obj) => hasher.hash(obj);

/**
 * Search routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function searchReq(fastify, options) {
	const apiConfig = options.apiConfig;
	const regionsList = options.regionsList;

	const latestCache = new NodeCache({ stdTTL: apiConfig.latestCacheTimeSecs, checkperiod: apiConfig.latestCacheTimeSecs / 3, useClones: false });
	const searchCache = new NodeCache({ stdTTL: apiConfig.searchCacheTimeSecs, checkperiod: apiConfig.searchCacheTimeSecs / 3, useClones: false });
	const topCache = new NodeCache({ stdTTL: apiConfig.topCacheTimeSecs, checkperiod: apiConfig.topCacheTimeSecs / 6, useClones: false });

	const schemaRecent = {
		body: (S.object()
			.id("searchRecentPostRequestBody")
			.description("All available parameters for search in recent requests")
			.additionalProperties(false)
			.prop("region", S.string().enum(regionsList).required())
			.prop("huntingZoneId", S.integer())
			.prop("bossId", S.integer())
			.prop("isShame", S.boolean())
			.prop("timeRange", S.string().enum(Object.values(time)).required())
			.prop("playerClass", S.string().enum(Object.values(classes)))
			.prop("roleType", S.integer().enum(Object.values(roles)))
			.prop("isP2WConsums", S.boolean())
			.prop("isMultipleHeals", S.boolean())
			.prop("isMultipleTanks", S.boolean())
			//.prop("playerId", S.integer())
			//.prop("playerServerId", S.integer())
			.prop("playerServer", S.string())
			.prop("playerName", S.string())
		)
			.valueOf(),
		response: {
			"2xx": S.array()
				.id("searchResponse2xx")
				.description("Cutted upload representation with basic info")
				.items(
					S.object()
						.additionalProperties(false)
						.prop("runId", S.string().required())
						.prop("encounterUnixEpoch", S.integer().required())
						.prop("huntingZoneId", S.integer().required())
						.prop("bossId", S.integer().required())
						.prop("fightDuration", S.string().required())
						.prop("isP2WConsums", S.boolean())
						.prop("isMultipleTanks", S.boolean().required())
						.prop("isMultipleHeals", S.boolean().required())
						.prop("partyDps", S.string().required())
						.prop("members", S.array().required().items(
							S.object()
								.additionalProperties(false)
								.prop("playerClass", S.string().required())
								.prop("playerDps", S.string().required())
								.prop("playerName", S.string().required())
								.prop("playerServer", S.string().required())
								//.prop("playerServerId", S.integer().required())
								//.prop("playerId", S.integer().required())
						))
				)
				.valueOf()
		}
	};

	const schemaLatest = {
		body: (S.object()
			.id("searchLatestPostRequestBody")
			.description("Search in recent request schema")
			.additionalProperties(false)
			.prop("region", S.string().enum(regionsList).required())
		)
			.valueOf(),
		response: {
			"2xx": S.array()
				.id("searchResponse2xx")
				.description("Search in recent response schema")
				.items(
					S.object()
						.additionalProperties(false)
						.prop("runId", S.string().required())
						.prop("encounterUnixEpoch", S.integer().required())
						.prop("huntingZoneId", S.integer().required())
						.prop("bossId", S.integer().required())
						.prop("fightDuration", S.string().required())
						.prop("isP2WConsums", S.boolean())
						.prop("isMultipleTanks", S.boolean().required())
						.prop("isMultipleHeals", S.boolean().required())
						.prop("partyDps", S.string().required())
						.prop("members", S.array().required().items(
							S.object()
								.additionalProperties(false)
								.prop("playerClass", S.string().required())
								.prop("playerDps", S.string().required())
								.prop("playerName", S.string().required())
								.prop("playerServer", S.string().required())
							//	.prop("playerServerId", S.integer().required())
							//	.prop("playerId", S.integer().required())
						))
				)
				.valueOf()
		}
	};

	const schemaByTop = {
		body: (S.object()
			.id("searchTopPostRequestBody")
			.description("Search in top request schema")
			.additionalProperties(false)
			.prop("region", S.string().enum(regionsList).required())
			.prop("huntingZoneId", S.integer().minimum(0).required())
			.prop("bossId", S.integer().minimum(0).required())
			.prop("playerClass", S.string().enum(Object.values(classes)).required())
			.prop("timeRange", S.string().enum(Object.values(time)).required())
			.prop("roleType", S.integer().enum(Object.values(roles)))		
		)
			.valueOf(),
		response: {
			"2xx": S.array()
				.id("searchTopResponse2xx")
				.description("Search in top response schema")
				.items(
					S.object()
						.additionalProperties(false)
						.prop("runId", S.string().required())
						.prop("fightDuration", S.string().required())
						.prop("playerClass", S.string().required())
						.prop("playerDps", S.string().required())
						.prop("playerName", S.string().required())
						.prop("playerServer", S.string().required())
				)
				.valueOf()
		}
	};

	const schemaByTodayTop = {
		body: (S.object()
			.additionalProperties(false)
			.prop("region", S.string().enum(regionsList).required())
			.prop("huntingZoneId", S.integer().minimum(0).required())
			.prop("bossId", S.integer().minimum(0).required())
		)
			.valueOf(),
		response: {
			"2xx": S.array()
				.items(
					S.object()
						.additionalProperties(false)
						.prop("runId", S.string().required())
						.prop("fightDuration", S.string().required())
						.prop("playerClass", S.string().required())
						.prop("playerDps", S.string().required())
						.prop("playerName", S.string().required())
						.prop("playerServer", S.string().required())
				)
				.valueOf()
		}
	};

	const schemaFull = {
		body: (S.object()
			.additionalProperties(false)
			.prop("runId", S.string().required()))
			.valueOf(),
		response: {
			"2xx": (S.object()
				.id("completeUploadDbResponse")
				.additionalProperties(false)
				.prop("runId", S.string().required())
				.prop("bossId", S.integer().required())
				.prop("huntingZoneId", S.integer().required())
				.prop("region", S.string().enum(regionsList).required())
				.prop("encounterUnixEpoch", S.integer().required())
				.prop("fightDuration", S.string().required())
				.prop("partyDps", S.string().required())
				.prop("isMultipleHeals", S.boolean().required())
				.prop("isMultipleTanks", S.boolean().required())
				.prop("debuffDetail", S.array().required())
				.prop("isShame", S.boolean().required())
				.prop("isP2WConsums", S.boolean())
				.prop("uploader", S.string().required())
				.prop("members", S.array().required().items(
					S.object()
						.prop("playerClass", S.string().enum(Object.values(classes)).required())
						.prop("playerName", S.string().required())
						.prop("playerServer", S.string().required())
						.prop("playerId", S.integer().required())
						.prop("playerServerId", S.integer().required())
						.prop("aggro", S.number().required())
						.prop("playerAverageCritRate", S.number().required())
						.prop("playerDeathDuration", S.string().required())
						.prop("playerDeaths", S.integer().required())
						.prop("playerDps", S.string().required())
						.prop("playerTotalDamage", S.string().required())
						.prop("playerTotalDamagePercentage", S.number().required())
						.prop("buffDetail", S.array().required())
						.prop("skillLog", S.array().required().items(
							S.object()
								.additionalProperties(false)
								.prop("skillAverageCrit", S.string())
								.prop("skillAverageWhite", S.string())
								.prop("skillCritRate", S.number())
								.prop("skillDamagePercent", S.number())
								.prop("skillHighestCrit", S.string())
								.prop("skillHits", S.string())
								.prop("skillCasts", S.string())
								.prop("skillId", S.integer().required())
								.prop("skillLowestCrit", S.string())
								.prop("skillTotalDamage", S.string())
								.prop("skillTotalCritDamage", S.string())
						))
				))
			)
				.valueOf()
		}
	};

	const timeRangeConvert = (timeRange) => {
		let timeSelector = {};
		// eslint-disable-next-line default-case
		switch(timeRange) {
		case(time.DAY):
			timeSelector = { $gte: luxon.DateTime.local().startOf("day").toUTC().toSeconds() };
			break;
		case(time.WEEK):
			timeSelector = { $gte: luxon.DateTime.local().startOf("week").toUTC().toSeconds() };
			break;
		case(time.MONTH):
			timeSelector = { $gte: luxon.DateTime.local().startOf("month").toUTC().toSeconds() };
			break;
		}

		return timeSelector;
	};

	fastify.post("/search/latest", { prefix: options.prefix, config: options.config, schema: schemaLatest }, async (req) => {
		if(isPlacedInCache(latestCache, req.body.region)) {
			//console.log("cache hit");
			return getPlacedInCache(latestCache, req.body.region);
		}
		//console.log("fresh hit");
		let params = req.body;
	
		const [dbError, res] = await fastify.to(fastify.uploadModel.getLatestRuns(params, apiConfig.recentRunsAmount));
		if (dbError) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);

		//console.log("place in cache");
		setInCache(latestCache, params.region, res);

		return res || [];
	});

	fastify.post("/search/recent", { prefix: options.prefix, config: options.config, schema: schemaRecent }, async (req) => {
		const reqHash = generateKeyFromRequest(req.body);
		if(isPlacedInCache(searchCache, reqHash)) {
			//console.log("cache hit");
			return getPlacedInCache(searchCache, reqHash);
		}
		//console.log("fresh hit");
		let params = req.body;

		params.encounterUnixEpoch = timeRangeConvert(params.timeRange);
		delete params.timeRange;

		const [dbError, res] = await fastify.to(fastify.uploadModel.getLatestRuns(params, apiConfig.recentRunsAmount));
		if (dbError) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		
		if (res) {
			for (let j = 0; j < res.length; j++) {
				const run = res[j];
				for (let i = 0; i < run.members.length; i++) {
					run.members[i] = { ...run.members[i], ...run.members[i].userData };
				}
			}
			//console.log("place in cache");
			setInCache(searchCache, reqHash, res);
		}
		return res || [];
	});

	fastify.post("/search/top", { prefix: options.prefix, config: options.config, schema: schemaByTop }, async (req) => {
		const reqHash = generateKeyFromRequest(req.body);
		if(isPlacedInCache(topCache, reqHash)) {
			return getPlacedInCache(topCache, reqHash);
		}

		let params = req.body;

		params.encounterUnixEpoch = timeRangeConvert(params.timeRange);
		delete params.timeRange;
		
		const [dbError, res] = await fastify.to(fastify.uploadModel.getTopRuns(params, apiConfig.topPlacesAmount));
		if (dbError) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);

		setInCache(topCache, reqHash, res);

		return res;
	});

	fastify.post("/search/tt", { prefix: options.prefix, config: options.config, schema: schemaByTodayTop }, async (req) => {
		const reqHash = generateKeyFromRequest(req.body);
		if(isPlacedInCache(topCache, reqHash)) {
			return getPlacedInCache(topCache, reqHash);
		}

		let params = req.body;

		params.encounterUnixEpoch = timeRangeConvert(time.DAY);
		
		const [dbError, res] = await fastify.to(fastify.uploadModel.getTopTodayRuns(params, 10));
		if (dbError) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);

		setInCache(topCache, reqHash, res);

		return res;
	});

	fastify.post("/search/id", { prefix: options.prefix, config: options.config, schema: schemaFull }, async (req) => {
		const id = req.body.runId.trim();

		const [dbError, res] = await fastify.to(fastify.uploadModel.getCompleteRun(id));
		if (dbError) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		if(!res) throw fastify.httpErrors.notFound(strings.NOTFOUNDERRSTR);
		
		if (res) {
			res.uploader = res.uploader.playerName;
			
			for (let i = 0; i < res.members.length; i++) {
				res.members[i] = { ...res.members[i], ...res.members[i].userData };
			}
		}
		
		return res;
	});
}

module.exports = searchReq;