/* eslint-disable node/no-unpublished-require */
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");

test("route list plugin", { only: true }, async t => {
	let fastify = Fastify({});

	// eslint-disable-next-line global-require
	fastify.register(require("../../server/plugins/routeList"));

	fastify.get("/", async () => "hello!");
	fastify.get("/url", async () => "hello!");
	await fastify.ready();

	t.equal(fastify.hasDecorator("routes"), true, "Decorated property was installed by plugin");
	t.equal(fastify.routes.length, 2, "Decorated property got proper length");

	const urls = fastify.routes.map(e => e.url);
	t.equal(urls.includes("/"), true, "Decorated property contains test route 1");
	t.equal(urls.includes("/url"), true, "Decorated property contains test route 2");

});