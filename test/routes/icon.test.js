// eslint-disable-next-line node/no-unpublished-require
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");

test("API: favicon access", { only: true }, async t => {
	let fastify = Fastify({});
	// eslint-disable-next-line global-require
	fastify.register(require("fastify-sensible"));
	// eslint-disable-next-line global-require
	fastify.register(require("../../server/routes/icon"));
	await fastify.ready();

	let res = await fastify.inject({
		url: "/favicon.ico",
		method: "GET"
	});

	t.strictEqual(res.statusCode, 404, "GET: Response status code must be 404");
});