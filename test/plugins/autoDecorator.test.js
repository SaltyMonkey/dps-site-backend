// eslint-disable-next-line node/no-unpublished-require
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");
const path = require("path");

test("auto decorator plugin", { only: true }, async t => {
	let fastify = Fastify({});

	// eslint-disable-next-line global-require
	fastify.register(require("../../server/plugins/autoDecorator.js"), { folder: path.resolve(__dirname, "../../server/enums"), excludeIfNameContains: ["_"] });
	await fastify.ready();

	t.equal(fastify.hasDecorator("statuses"), true, "statuses enums was decorated");
	t.equal(fastify.hasDecorator("regions"), true, "regions enums was decorated");
	t.equal(fastify.hasDecorator("classes"), true, "classes enums was decorated");
});