// eslint-disable-next-line node/no-unpublished-require
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");

test("API: controls", { only: true }, async t => {
	let fastify = Fastify({});

	let whitelist = [ { huntingZoneId: 69, BossIds: []}, { huntingZoneId: 70, BossIds: []} ];
	// eslint-disable-next-line global-require
	fastify.register(require("../../server/routes/v1/whitelist.js"), { prefix: "/v1", whitelist: whitelist });
	await fastify.ready();

	let res = await fastify.inject({
		url: "/v1/whitelist",
		method: "GET"
	});

	t.equal(res.statusCode, 200, "GET: Response status code must be 200");
	t.equal(Array.isArray(res.json()), true , "GET: Response body must be array");
	t.equal(res.json().length, 2 , "GET: Response array must have 2 elements");
});