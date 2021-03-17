"use strict";

const mongoose = require("mongoose");
const { customAlphabet } = require("nanoid");

const alphabet = "abcdefghijklmnopqrstuvwxyz123456789";

const simplifiedView = {
	"id": 1,
	"uploadTime": 1,
	"bossId": 1,
	"areaId": 1,
	"fightDuration": 1,
	"partyDps": 1,
	"members.class": 1,
	"members.name": 1,
};

const upload = new mongoose.Schema({
	"id": {
		"type": String,
		"default": () => customAlphabet(alphabet, 25),
		"unique": true
	},
	"uploadTime": { "type": String, "default": () => { `${Date.now()}`; } },
	"region": String,
	"bossId": Number,
	"areaId": Number,
	"isDoubleHeal": Boolean,
	"fightDuration": Number,
	"partyDps": String,
	"debuffUptime": [{
		"key": Number,
		"value": Number
	}],
	"isShame": Boolean,
	"isP2WConsums": Boolean,
	"uploader": { "type": mongoose.Schema.Types.ObjectId, "ref": "player", "autopopulate": true },
	"members": [
		{
			"id": { "type": mongoose.Schema.Types.ObjectId, "ref": "player", "autopopulate": true },
			"aggroPercent": Number,
			"playerAverageCritRate": Number,
			"playerDeathDuration": String,
			"playerDeaths": Number,
			"playerDps": String,
			"playerTotalDamage": String,
			"playerTotalDamagePercentage": Number,
			"buffUptime": [{
				"key": Number,
				"value": Number
			}],
			"skillLog": [
				{
					"skillAverageCrit": String,
					"skillAverageWhite": String,
					"skillCritRate": Number,
					"skillDamagePercent": Number,
					"skillHighestCrit": String,
					"skillHits": String,
					"skillCasts": String,
					"skillId": Number,
					"skillLowestCrit": String,
					"skillTotalDamage": String
				}
			]
		}
	],
});

upload.plugin(require("mongoose-autopopulate"));

upload.statics.getLatestRuns = async function (searchParams, amount) {
	let runs = [];
	runs = await upload.find(searchParams, simplifiedView).sort({ "$natural": -1 }).limit(amount).lean();
	return runs || [];
};

upload.statics.getCompleteRun = async function (id) {
	return await upload.findOne({ id: id }).lean();
};

upload.statics.getTopRuns = async function (data, limit) {
	return await upload.aggregate([
		{
			"$match": {
				"region": data.region,
				"bossId": data.bossId,
				"areaId": data.areaId,
				"members.playerClass": data.class,
				"isP2WConsums": data.excludeP2wConsums
			}
		}, {
			"$project": {
				"id": 1,
				"areaId": 1,
				"bossId": 1,
				"uploadTime": 1,
				"fightDuration": 1,
				"isP2WConsums": 1,
				"members.playerDps": 1,
				"members.playerClass": 1,
				"members.playerName": 1
			}
		}, {
			"$unwind": {
				"path": "$members"
			}
		}, {
			"$match": {
				"members.playerClass": data.class
			}
		}
	])
		.collation({ locale: "en_US", numericOrdering: true })
		.sort({ "members.playerDps": -1 })
		.limit(limit);
};

module.exports = mongoose.model("upload", upload);