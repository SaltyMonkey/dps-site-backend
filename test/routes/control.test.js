// eslint-disable-next-line node/no-unpublished-require
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");

test("API: controls", { only: true }, async t => {
	let fastify = Fastify({});
	// eslint-disable-next-line global-require
	fastify.register(require("../../server/routes/stats"));
	await fastify.ready();

	let res = await fastify.inject({
		url: "/live",
		method: "GET"
	});

	t.equal(res.statusCode, 200, "GET: Response status code must be 200");
});