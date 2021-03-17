"use strict";

const classes = require("../../enums/classes");

const NodeCache = require("node-cache");
const uploadsCache = new NodeCache({ stdTTL: 60, checkperiod: 20, useClones: false });

const generateUniqKey = (payload) => {
	let playersIds = (payload.members.map(player => player.playerId)).sort();
	let playersServerIds = (payload.members.map(player => player.playerServerId)).sort();

	return `${payload.bossId}${payload.areaId}${playersIds.join("")}${playersServerIds.join("")}`;
};

const isAlreadyRegistered = (str) => uploadsCache.has(str);

const checkPartyComposition = (payload)
const isDoubleHeal = (payload) => {
	let playersClasses = (payload.members.map(player => player.playerClass)).sort();

	return (playersClasses.includes(classes.PRIEST) && playersClasses.includes(classes.MYSTIC));
};

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function uploadReq(fastify, options) {
	const prefix = options.prefix;

	const schema = {
		body: fastify.getSchema("completeDetails")
	};

	fastify.get("/upload", { prefix, config: options.config, schema }, async (req) => {
		let uniqKey = generateUniqKey(req.body);
		//Fast check in cache by uniq string gathered in payload without accessign database
		if(isAlreadyRegistered(uniqKey)) throw fastify.httpErrors.forbidden("Upload was already registered.");

	});
}

module.exports = uploadReq;