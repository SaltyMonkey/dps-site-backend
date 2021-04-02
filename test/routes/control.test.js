// eslint-disable-next-line node/no-unpublished-require
const t = require("tap");
const path = require("path");
const test = t.test;
const Fastify = require("fastify");

const apiModel = require("../../server/models/apiModel");
const mongoose = require("mongoose");
const enumApi = require("../../server/enums/roles");
const apiConfig = require("../../server/dpsData.json").apiConfig;
const schema = require("../../server/routes/v1/sharedSchemas/statusResponse.js");

test("API: controls", { only: true }, async t => {
	let fastify = Fastify({});
	// eslint-disable-next-line global-require
	await mongoose.connect(require("../../server/server.json").dbConnectionString, { 
		poolSize: 10,
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true
	});
	// eslint-disable-next-line global-require
	fastify.addSchema(schema);
	fastify.register(require("../../server/plugins/autoDecorator.js"), { folder: path.resolve(__dirname, "../../server/models"), excludeIfNameContains: ["_"] });

	fastify.register(require("../../server/routes/v1/control.js"), { prefix: "/v1", apiConfig: apiConfig });
	await fastify.ready();

	//manually adding api key in db
	//user
	let userRef = new apiModel({
		token: "useruseruseruseruser",
		role: enumApi.USER
	});
	await userRef.save();

	//manually adding api key in db
	//admin
	let adminRef = new apiModel({
		token: "adminadminadminadmin",
		role: enumApi.ADMIN
	});

	await adminRef.save();

	let str = apiConfig.authCheckHeader;
	const hdrs = {};
	hdrs[str] = "adminadminadminadmin2";

	//check if admin key usable and adding new entity in db
	let res = await fastify.inject({
		url: "/v1/control/access/add",
		method: "POST",
		headers: hdrs,
		body: {
			"apiKey": "useruseruseruseruseruser2"
		}
	});

	t.equal(res.statusCode, 200, "GET: Response status code must be 200");
	t.teardown(async () => {
		await mongoose.disconnect();
	});
});