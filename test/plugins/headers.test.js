/* eslint-disable node/no-unpublished-require */
/* eslint-disable global-require */
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");

test("headers plugin", { only: true }, async t => {
	let fastify = Fastify({});

	fastify.register(require("../../server/plugins/headers"), {
		changeTo:
			[
				{
					header: "test",
					value: "Hamsters"
				},
				{
					header: "second-header",
					value: "Test-Value"
				}
			]
	});

	fastify.get("/", async () => "hello!");

	let res = await fastify.inject({
		url: "/",
		method: "GET"
	});

	t.strictEqual(res.statusCode, 200, "GET: Response status code");
	t.strictEqual(res.headers["test"], "Hamsters", "GET: test header check");
	t.strictEqual(res.headers["second-header"], "Test-Value", "GET: test header 2 check");
});