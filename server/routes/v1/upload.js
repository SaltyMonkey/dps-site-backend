/* eslint-disable no-unused-vars */
"use strict";

const S = require("fluent-json-schema");

const NodeCache = require("node-cache");
const classes = require("../../enums/classes");

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
	const authHeader = options.apiConfig.authCheckHeader;

	const uploadsCache = new NodeCache({ stdTTL: 60, checkperiod: 20, useClones: false });

	const isPlacedInCache = (str) => uploadsCache.has(str);

	const schema = {
		body: (S.object()
			.id("completeUploadPostRequest")
			.additionalProperties(false)
			.prop("bossId", S.integer().minimum(0).required())
			.prop("areaId", S.integer().minimum(0).required())
			.prop("encounterUnixEpoch", S.integer().required())
			.prop("fightDuration", S.string().minLength(2).required())
			.prop("partyDps", S.string().minLength(5).required())
			.prop("debuffUptime", S.array().required().items(
				S.object()
					.additionalProperties(false)
					.prop("key", S.integer().minimum(1).required())
					.prop("value", S.integer().minimum(1).required())
			))
			.prop("uploader", S.object()
				.additionalProperties(false)
				.prop("playerClass", S.enum(Object.values(classes)).required())
				.prop("playerName", S.string().minLength(3).required())
				.prop("playerId", S.integer().minimum(1).required())
				.prop("playerServerId", S.integer().minimum(1).required())
			)
			.prop("members", S.array().required().items(
				S.object()
					.prop("playerClass", S.enum(Object.values(classes)).required())
					.prop("playerName", S.string().minLength(3).required())
					.prop("playerId", S.integer().minimum(1).required())
					.prop("playerServerId", S.integer().minimum(1).required())
					.prop("aggroPercent", S.integer().minimum(0).required())
					.prop("playerAverageCritRate", S.integer().minimum(1).required())
					.prop("playerDeathDuration", S.string().minLength(1).required())
					.prop("playerDeaths", S.integer().minimum(0).maximum(999).required())
					.prop("playerDps", S.string().required())
					.prop("playerTotalDamage", S.string().required())
					.prop("playerTotalDamagePercentage", S.integer().required())
					.prop("buffUptime", S.array().required().items(
						S.object()
							.additionalProperties(false)
							.prop("key", S.integer().minimum(1).required())
							.prop("value", S.integer().minimum(1).required())
					))
					.prop("skillLog", S.array().required().items(
						S.object()
							.additionalProperties(false)
							.prop("skillAverageCrit", S.string().required())
							.prop("skillAverageWhite", S.string().required())
							.prop("skillCritRate", S.integer().required())
							.prop("skillDamagePercent", S.integer().required())
							.prop("skillHighestCrit", S.string().required())
							.prop("skillHits", S.string().required())
							.prop("skillCasts", S.string().required())
							.prop("skillId", S.integer().required())
							.prop("skillLowestCrit", S.string().required())
							.prop("skillTotalDamage", S.string().required())
					))
			))
		)
			.valueOf(),
		headers: (
			S.object()
				.prop(authHeader, S.string().minLength(20).maxLength(50))
		)
			.valueOf(),
		response: {
			"2xx": fastify.getSchema("statusResSchema")
		}
	};

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

	const updatePlayerOrAddAndReturfRef = async (playerRaw) => {
		let ref = await fastify.playerModel.getFromDbLinked(playerRaw.playerServerId, playerRaw.playerId, playerRaw.playerClass);

		if (ref) {
			if (ref.playerName !== playerRaw.playerName) {
				ref.playerName = playerRaw.playerName;
				await ref.save();
			}
		} else if (!ref) {
			let newPlayerRef = new fastify.playerModel({
				playerClass: playerRaw.playerClass,
				playerName: playerRaw.playerName,
				playerId: playerRaw.playerId,
				playerServerId: playerRaw.playerServerId
			});

			await newPlayerRef.save();

			ref = await fastify.playerModel.getFromDbLinked(playerRaw.playerServerId, playerRaw.playerId, playerRaw.playerClass);
		}

		return ref;
	};

	// eslint-disable-next-line arrow-body-style
	const isDuplicate = async (payload) => {
		//const res = await fastify.uploadModel.getFromDb({ payload:})
		return false;
	};

	const isAuthTokenInDb = async (headers) => {
		if(!headers[authHeader]) return false;
		return !!(await fastify.apiModel.getFromDb(headers[authHeader].toString().trim()));
	};

	fastify.post("/upload", { prefix, config: options.config, schema }, async (req) => {

		if (!apiConfig.allowAnonymousUpload) {
			const [authCheckDbError, dbres] = await fastify.to(isAuthTokenInDb(req.headers));
			if (authCheckDbError) fastify.httpErrors.forbidden("Internal database error");
			if (!dbres) throw fastify.httpErrors.forbidden("Invalid auth");
		}

		//basic validation of data
		if (!prereqsCheck(req.body)) throw fastify.httpErrors.forbidden("Can't accept this upload");
		//Fast check in cache by uniq string gathered in payload without accessing database
		if (isPlacedInCache(generateUniqKey(req.body))) throw fastify.httpErrors.forbidden("Upload was already registered.");

		const [dupDbError, dres] = await fastify.to(isDuplicate(req.body));
		if (dres) throw fastify.httpErrors.forbidden("Upload was already registered.");
		if (dupDbError) throw fastify.httpErrors.forbidden("Internal database error");

		const [uploaderDbError, uploader] = await fastify.to(updatePlayerOrAddAndReturfRef(req.body.uploader));
		if (uploaderDbError) throw fastify.httpErrors.internalServerError("Internal database error");

		const analyzeRes = analyzePayload(req.body);
		//create db view
		let dbView = new fastify.uploadModel(req.body);
		dbView.uploader = uploader;
		dbView.isShame = analyzeRes.isShame;
		dbView.isMultipleTanks = analyzeRes.isMultipleTanks;
		dbView.isMultipleHeals = analyzeRes.isMultipleHeals;

		dbView.members = [];

		req.body.members.forEach(async member => {
			const [memberDbError, ref] = await fastify.to(updatePlayerOrAddAndReturfRef(member));
			if (memberDbError) throw fastify.httpErrors.internalServerError("Internal database error");
			const obj = member;
			obj.id = ref;
			dbView.members.push(obj);
		});

		const [saveUploadDbError, res] = await fastify.to(dbView.save());
		if (saveUploadDbError) throw fastify.httpErrors.internalServerError("Internal database error");

		return { "status": "OK" };
	});
}

module.exports = uploadReq;