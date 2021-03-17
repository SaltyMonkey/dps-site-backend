const S = require("fluent-json-schema");
const classes = require("../../../enums/classes");
const regions = require("../../../enums/regions");

module.exports = (S.object()
	.id("searchTopPostRequestBody")
	.description("All available parameters to search in top runs")
	.additionalProperties(false)
	.prop("region", S.enum(regions).required())
	.prop("areaId", S.number().required())
	.prop("bossId", S.number().required())
	.prop("playerClass", S.enum(Object.values(classes)).required())
	.prop("excludeP2wConsums", S.boolean().required())
)
	.valueOf();