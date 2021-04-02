"use strict";

const S = require("fluent-json-schema");
const status = require("../../enums/statuses");
const role = require("../../enums/roles");

/**
 * setup some routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function controlReq(fastify, options) {
	const apiKeyName = "apiKey";
	const config = options.config;
	const prefix = options.prefix;
	const authHeader = options.apiConfig.authCheckHeader;

	const headersSchema = (
		S.object()
			.prop(authHeader, S.string().minLength(20).maxLength(50).required())
	)
		.valueOf();

	const schemaApi = {
		body: (
			S.object()
				.additionalProperties(false)
				.prop(apiKeyName, S.string().minLength(20).maxLength(50).required())
		)
			.valueOf(),
		headers: headersSchema,
		response: {
			"2xx": fastify.getSchema("statusResSchema")
		}
	};

	const schemaUploads = {
		body: (
			S.object()
				.additionalProperties(false)
				.prop("runId", S.string().minLength(20).maxLength(50).required())
		)
			.valueOf(),
		headers: headersSchema,
		response: {
			"2xx": fastify.getSchema("statusResSchema")
		}
	};

	const isRoleAdmin = async (token) => {
		const dbLink = await fastify.apiModel.getFromDb(token);

		if (!dbLink) return false;

		if (dbLink.role !== role.ADMIN) return false;

		return true;
	};

	fastify.post("/control/uploads/remove", { prefix: prefix, config, schema: schemaUploads }, async (req) => {
		let uploadData = false;
		let isAdmin = false;
		let removeData = false;

		let adminCheckDbStatus = false;
		let uploadCheckDbAccess = false;
		let deleteCheckDbStatus = false;

		[adminCheckDbStatus, isAdmin] = await fastify.to(isRoleAdmin(req.headers[authHeader]));
		[uploadCheckDbAccess, uploadData] = await fastify.to(fastify.uploadModel.getFromDbLinked(req.body["runId"]));
		if (adminCheckDbStatus || uploadCheckDbAccess) throw fastify.httpErrors.internalServerError("Internal database error");
		if (!isAdmin || !uploadData) throw fastify.httpErrors.forbidden("Access denied!");

		// eslint-disable-next-line no-unused-vars
		[deleteCheckDbStatus, removeData] = await fastify.to(uploadData.delete());
		if (deleteCheckDbStatus) throw fastify.httpErrors.internalServerError("Internal database error");

		return { status: status.OK };
	});

	fastify.post("/control/access/add", { prefix: prefix, config, schema: schemaApi }, async (req) => {
		let isApiKeyExists = false;
		let isAdmin = false;

		let adminCheckDbStatus = false;
		let apiCheckDbAccess = false;
		let addCheckDbStatus = false;

		[adminCheckDbStatus, isAdmin] = await fastify.to(isRoleAdmin(req.headers[authHeader]));
		[apiCheckDbAccess, isApiKeyExists] = await fastify.to(fastify.apiModel.getFromDb(req.body[apiKeyName]));
		if (adminCheckDbStatus || apiCheckDbAccess) throw fastify.httpErrors.internalServerError("Internal database error");
		if (!isAdmin || isApiKeyExists) throw fastify.httpErrors.forbidden("Access denied!");


		const newApiKeyLink = new fastify.apiModel({
			token: req.body[apiKeyName].toString()
		});

		// eslint-disable-next-line no-unused-vars
		[addCheckDbStatus] = await fastify.to(newApiKeyLink.save());
		if (addCheckDbStatus) throw fastify.httpErrors.internalServerError("Internal database error");

		return { status: status.OK };
	});

	fastify.post("/control/access/remove", { prefix: prefix, config, schema: schemaApi }, async (req) => {
		let isAdmin = false;
		let accessKeyObj = false;
		let removeData = false;

		let adminCheckdbStatus = false;
		let userCheckDbStatus = false;
		let deleteCheckDbStatus = false;

		[adminCheckdbStatus, isAdmin] = await fastify.to(isRoleAdmin(req.headers[authHeader]));
		[userCheckDbStatus, accessKeyObj] = await fastify.to(fastify.apiModel.getFromDbLinked(req.body[apiKeyName]));

		if (adminCheckdbStatus || userCheckDbStatus) throw fastify.httpErrors.internalServerError("Internal database error");
		if (!isAdmin || !accessKeyObj) throw fastify.httpErrors.forbidden("Access denied!");

		// eslint-disable-next-line no-unused-vars
		[deleteCheckDbStatus, removeData] = await fastify.to(accessKeyObj.delete());
		if (deleteCheckDbStatus) throw fastify.httpErrors.internalServerError("Internal database error");

		return { status: status.OK };
	});
}

module.exports = controlReq;