"use strict";

const S = require("fluent-json-schema");
const status = require("../../enums/statuses");
const role = require("../../enums/roles");
const strings = require("../../enums/strings");

/**
 * Control routes
 * @param {import("fastify").FastifyInstance} fastify 
 * @param {*} options 
 */
async function controlReq(fastify, options) {
	const apiKeyName = "apiKey";
	const config = options.config;
	const prefix = options.prefix;
	const authHeaderKey = options.apiConfig.authCheckHeader;

	const headersSchema = (
		S.object()
			.prop(authHeaderKey, S.string().minLength(20).maxLength(50).required())
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
				.prop("runId", S.string().required())
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
		const authHeader = req.headers[authHeaderKey].trim();
		const id = req.body.runId.trim();

		const [adminCheckDbStatus, isAdmin] = await fastify.to(isRoleAdmin(authHeader));
		if (adminCheckDbStatus) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		if (!isAdmin) throw fastify.httpErrors.forbidden(strings.AUTHERRSTR);

		const [uploadCheckDbAccess, uploadData] = await fastify.to(fastify.uploadModel.getFromDbLinked(id));
		if (uploadCheckDbAccess) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		if (!uploadData) throw fastify.httpErrors.forbidden(strings.EDITERRSTR);

		// eslint-disable-next-line no-unused-vars
		const [deleteCheckDbStatus, removeData] = await fastify.to(uploadData.delete());
		if (deleteCheckDbStatus) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);

		return { status: status.OK };
	});

	fastify.post("/control/access/add", { prefix: prefix, config, schema: schemaApi }, async (req) => {
		const authHeader = req.headers[authHeaderKey].trim();
		const apiKey = req.body[apiKeyName].toString().trim();

		const [adminCheckDbStatus, isAdmin] = await fastify.to(isRoleAdmin(authHeader));
		if (adminCheckDbStatus) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		if (!isAdmin) throw fastify.httpErrors.forbidden(strings.AUTHERRSTR);

		const [apiCheckDbAccess, isApiKeyExists] = await fastify.to(fastify.apiModel.getFromDb(apiKey));
		if (apiCheckDbAccess) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		if (isApiKeyExists) throw fastify.httpErrors.forbidden(strings.EDITERRSTR);

		const newApiKeyLink = new fastify.apiModel({
			token: apiKey
		});

		// eslint-disable-next-line no-unused-vars
		const [addCheckDbStatus] = await fastify.to(newApiKeyLink.save());
		if (addCheckDbStatus) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);

		return { status: status.OK };
	});

	fastify.post("/control/access/remove", { prefix: prefix, config, schema: schemaApi }, async (req) => {
		const authHeader = req.headers[authHeaderKey].trim();
		const apiKey = req.body[apiKeyName].toString().trim();

		const [adminCheckDbStatus, isAdmin] = await fastify.to(isRoleAdmin(authHeader));
		if (adminCheckDbStatus) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		if (!isAdmin) throw fastify.httpErrors.forbidden(strings.AUTHERRSTR);

		const [userCheckDbStatus, accessKeyObj] = await fastify.to(fastify.apiModel.getFromDbLinked(apiKey));
		if (userCheckDbStatus) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);
		if (!accessKeyObj) throw fastify.httpErrors.forbidden(strings.EDITERRSTR);

		// eslint-disable-next-line no-unused-vars
		const [deleteCheckDbStatus, removeData] = await fastify.to(accessKeyObj.delete());
		if (deleteCheckDbStatus) throw fastify.httpErrors.internalServerError(strings.DBERRSTR);

		return { status: status.OK };
	});
}

module.exports = controlReq;