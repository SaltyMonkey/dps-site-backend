const S = require("fluent-json-schema");
module.exports = S.array()
	.id("searchResponse2xx")
	.description("Cutted upload representation with basic info")
	.items(
		S.object()
			.additionalProperties(false)
			.prop("id", S.string().required())
			.prop("areaId", S.number().required())
			.prop("bossId", S.number().required())
			.prop("uploadTime", S.string().required())
			.prop("fightDuration", S.string().required())
			.prop("isP2WConsums", S.boolean().required())
			.prop("partyDps", S.string().required())
			.prop("members", S.array().items(
				S.object()
					.additionalProperties(false)
					.prop("playerClass", S.string().required())
					.prop("playerDps", S.string().required())
			))

	)
	.valueOf();