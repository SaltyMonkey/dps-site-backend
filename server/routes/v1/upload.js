/* eslint-disable no-unused-vars */
"use strict";

const S = require("fluent-json-schema");

const NodeCache = require("node-cache");
const classes = require("../../enums/classes");
const uploadsCache = new NodeCache({ stdTTL: 60, checkperiod: 20, useClones: false });

const arraysHasIntersect = (arr1, arr2) => {
	for (const item of arr1)
		if (arr2.indexOf(item) != -1) return true;
	return false;
};

const generateUniqKey = (payload) => {
	let playersIds = (payload.members.map(player => player.playerId)).sort();
	let playersServerIds = (payload.members.map(player => player.playerServerId)).sort();

	return `${payload.bossId}${payload.areaId}${playersIds.join("")}${playersServerIds.join("")}`;
};

const isAlreadyRegistered = (str) => uploadsCache.has(str);

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function uploadReq(fastify, options) {
	const prefix = options.prefix;
	const apiConfig = options.apiConfig;
	const whitelist = options.whitelist;
	const analyze = options.analyze;

	const prereqsCheck = (payload) => {
		const currServerTimeSec = Date.now() / 1000;
		const timeDataDiff = currServerTimeSec - payload.encounterUnixEpoch;
		//allowed time diff 
		if (timeDataDiff > apiConfig.maxAllowedTimeDiffSec || timeDataDiff < 0) return false;

		//allowed area and boss
		const area = whitelist[payload.areaId];
		if (!area || area && Array.isArray(area) && area.length > 0 && !area.includes(payload.bossId)) return false;

		//compare party dps dps
		const partyDps = BigInt(payload.partyDps);
		if (partyDps > BigInt(apiConfig.maxPartyDps) || partyDps < BigInt(apiConfig.minPartyDps)) return false;

		//compare members amounts
		if (payload.members.length < apiConfig.minMembersCount || payload.members.length > apiConfig.maxMembersCount) return false;

		return true;
	};

	const analyzePayload = (payload) => {
		let tanksCounter = 0;
		let healersCounter = 0;
		let deaths = 0;

		payload.members.forEach(member => {
			const pcls = member.playerClass;
			deaths += member.playerDeaths;
			if (pcls === classes.PRIEST || pcls === classes.MYSTIC)
				healersCounter += 1;
			else if (pcls === classes.BRAWLER || pcls === classes.WARRIOR || pcls === classes.BERS) {
				const buffs = member.buffUptime.map(el => el.key);

				if (arraysHasIntersect(analyze.tankAbnormals, buffs)) tanksCounter += 1;
			}
			else if (pcls === classes.LANCER) tanksCounter += 1;
		});

		return {
			isShame: deaths >= analyze.isShameDeathsAmount,
			isMultipleTanks: tanksCounter >= analyze.minMultipleTanksTriggerAmount,
			isMultipleHeals: healersCounter >= analyze.minMultipleHealsTriggerAmount,
		};
	};

	const schema = {
		body: (S.object()
			.id("completeUploadPostRequest")
			.additionalProperties(false)
			.prop("bossId", S.number().required())
			.prop("areaId", S.number().required())
			.prop("encounterUnixEpoch", S.number().required())
			.prop("fightDuration", S.string().required())
			.prop("partyDps", S.string().required())
			.prop("debuffUptime", S.array().required().items(
				S.object()
					.additionalProperties(false)
					.prop("key", S.number().required())
					.prop("value", S.number().required())
			))
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
	};

	fastify.get("/upload", { prefix, config: options.config, schema }, async (req) => {
		let uniqKey = generateUniqKey(req.body);

		//basic validation of data
		if (!prereqsCheck(req.body)) throw fastify.httpErrors.forbidden("Can't accept this upload");
		//Fast check in cache by uniq string gathered in payload without accessign database
		if (isAlreadyRegistered(uniqKey)) throw fastify.httpErrors.forbidden("Upload was already registered.");

		const analyzeRes = analyzePayload(req.body);
	});
}

module.exports = uploadReq;