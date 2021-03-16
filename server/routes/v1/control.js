"use strict";

const S = require("fluent-json-schema");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function controlReq(fastify, options) {
	const adminKeyName = "adminApiKey";
	const apiKeyName = "apiKey";
	const config = options.config;
	const prefix = options.prefix;

	const schema = {
		body: (
			S.object()
				.additionalProperties(false)
				.prop(apiKeyName, S.string().minLength(20).maxLength(50).required())
				.prop(adminKeyName, S.string().minLength(20).maxLength(50).required())
		)
			.valueOf(),
		response: {
			"2xx": S.array().items(
				S.object()
					.additionalProperties(false)
					.prop("status", S.string().minLength(10).maxLength(35).required())
			)
				.valueOf()
		}
	};

	fastify.post("/control/access/add", { prefix: prefix, config, schema: schema }, async (req) => {
		let isApiKeyExists = false;
		let isAdmin = false;

		let adminCheckDbStatus = false;
		let apiCheckDbAccess = false;
		let addCheckDbStatus = false;

		[adminCheckDbStatus, isAdmin] = await fastify.to(fastify.apiModel.isRoleAdmin(req.body[adminKeyName]));
		[apiCheckDbAccess, isApiKeyExists] = await fastify.to(fastify.apiModel.getFromDb(req.body[apiKeyName]));

		if (adminCheckDbStatus || apiCheckDbAccess) throw fastify.httpErrors.internalServerError("Internal database error");
		if (!isAdmin || isApiKeyExists) throw fastify.httpErrors.forbidden("Access denied!");

		
		const newApiKeyLink = new fastify.apiModel({
			token: req.body[apiKeyName].toString()
		});

		// eslint-disable-next-line no-unused-vars
		[addCheckDbStatus] = await fastify.to(newApiKeyLink.save());
		if (addCheckDbStatus) throw fastify.httpErrors.internalServerError("Internal database error");

		return { status: "OK" };
	});

	fastify.post("/control/access/remove", { prefix: prefix, config, schema: schema }, async (req) => {
		let isAdmin = false;
		let accessKeyObj = false;
		let removeData = false;

		let adminCheckdbStatus = false;
		let userCheckDbStatus = false;
		let deleteCheckDbStatus = false;

		[adminCheckdbStatus, isAdmin] = await fastify.to(fastify.apiModel.isRoleAdmin(req.body[adminKeyName]));
		[userCheckDbStatus, accessKeyObj] = await fastify.to(fastify.apiModel.getFromDbLinked(req.body[apiKeyName]));

		if (adminCheckdbStatus || userCheckDbStatus) throw fastify.httpErrors.internalServerError("Internal database error");
		if (!isAdmin || !accessKeyObj) throw fastify.httpErrors.forbidden("Access denied!");
		
		// eslint-disable-next-line no-unused-vars
		[deleteCheckDbStatus, removeData] = await fastify.to(accessKeyObj.delete());
		if (deleteCheckDbStatus) throw fastify.httpErrors.internalServerError("Internal database error");

		return { status: "OK" };
	});
}

module.exports = controlReq;