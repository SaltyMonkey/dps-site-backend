"use strict";

const classes = require("../../enums/classes");

const NodeCache = require("node-cache");
const uploadsCache = new NodeCache({ stdTTL: 30, checkperiod: 15, useClones: false });
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

	fastify.get("/upload", { prefix, config: options.config, schema }, async () => {
		return "";
	});
}

module.exports = uploadReq;