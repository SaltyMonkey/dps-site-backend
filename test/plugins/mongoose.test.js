/* eslint-disable node/no-unpublished-require */
const t = require("tap");
const test = t.test;
const Fastify = require("fastify");

test("mongoose plugin", { only: true }, async t => {
	let fastify = Fastify({});

	// eslint-disable-next-line global-require
	fastify.register(require("../../server/plugins/mongoose"), { connectionString: "mongodb://localhost/test", poolSize: 5 });
	await fastify.ready();
	
	t.strictEqual(fastify.hasDecorator("mongoose"), true, "Decorated plugin");
	t.strictEqual(fastify.mongoose.connection.readyState, 1, "Mongoose connected");

	t.tearDown(async () => {
		await fastify.mongoose.disconnect();
	});
});