const S = require("fluent-json-schema");
const classes = require("../../../enums/classes");
const regions = require("../../../enums/regions");

module.exports = (S.object()
	.id("searchPostRequestBody")
	.description("All available parameters for search requests")
	.additionalProperties(false)
	.prop("region", S.enum(regions))
	.prop("areaId", S.number())
	.prop("bossId", S.number())
	.prop("isShame", S.boolean())
	.prop("playerClass", S.enum(classes))
	.prop("excludeP2wConsums", S.boolean().required())
)
	.valueOf();