const S = require("fluent-json-schema");
const classes = require("../../../enums/classes");
const regions = require("../../../enums/regions");

module.exports = (S.object()
	.id("searchRecentPostRequestBody")
	.description("All available parameters for search in recent requests")
	.additionalProperties(false)
	.prop("region", S.enum(regions))
	.prop("areaId", S.number())
	.prop("bossId", S.number())
	.prop("isShame", S.boolean())
	.prop("playerClass", S.enum(Object.values(classes)))
	.prop("excludeP2wConsums", S.boolean())
)
	.valueOf();