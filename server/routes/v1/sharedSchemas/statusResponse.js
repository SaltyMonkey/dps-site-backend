const S = require("fluent-json-schema");
const statuses = require("../../../enums/statuses");

module.exports = (S.object()
	.id("statusResSchema")
	.additionalProperties(false)
	.prop("status", S.enum(Object.values(statuses)).required())
)
	.valueOf();