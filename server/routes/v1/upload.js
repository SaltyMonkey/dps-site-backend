/* eslint-disable no-unused-vars */
"use strict";

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
		body: fastify.getSchema("completeUploadPostRequest")
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