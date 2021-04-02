"use strict";

const mongoose = require("mongoose");

const upload = new mongoose.Schema({
	"runId": {
		"type": String,
		"unique": true
	},
	"encounterUnixEpoch": { "type": Number, "default": () => { Date.now(); } },
	"region": String,
	"bossId": Number,
	"huntingZoneId": Number,
	"isMultipleHeals": Boolean,
	"isMultipleTanks": Boolean,
	"fightDuration": Number,
	"partyDps": String,
	"debuffDetail": [],
	"isShame": Boolean,
	"isP2WConsums": Boolean,
	"uploader": { "type": mongoose.Schema.Types.ObjectId, "ref": "player", "autopopulate": true },
	"members": [
		{
			"userData": { "type": mongoose.Schema.Types.ObjectId, "ref": "player", "autopopulate": true },
			"aggro": Number,
			"playerAverageCritRate": Number,
			"playerDeathDuration": String,
			"playerDeaths": Number,
			"playerDps": String,
			"playerTotalDamage": String,
			"playerTotalDamagePercentage": Number,
			"buffDetail": [],
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
}, { useNestedStrict: true });

upload.plugin(require("mongoose-autopopulate"));

const simplifiedView = {
	"runId": 1,
	"huntingZoneId": 1,
	"bossId": 1,
	"encounterUnixEpoch": 1,
	"fightDuration": 1,
	"isP2WConsums": 1,
	"isMultipleTanks": 1,
	"isMultipleHeals": 1,
	"partyDps": 1,
	"members.playerClass": 1,
	"members.playerDps": 1,
	"members.playerServerId": 1,
	"members.playerId": 1,
	"members.playerName": 1
};

upload.statics.getLatestRuns = async function (searchParams, amount) {
	let runs = [];
	runs = await this.find(searchParams, simplifiedView).sort({ "$natural": -1 }).limit(amount).lean({ autopopulate: true });
	return runs || [];
};

upload.statics.getCompleteRun = async function (id) {
	return await (this.findOne({ id: id })).lean({ autopopulate: true });
};

upload.statics.getTopRuns = async function (data, limit) {
	return await this.aggregate([
		{
			"$match": {
				"region": data.region,
				"bossId": data.bossId,
				"huntingZoneId": data.huntingZoneId,
				"members.playerClass": data.class,
				"isP2WConsums": !data.excludeP2wConsums,
				"isMultipleHeals": false,
				"isMultipleTanks": false,
				"isShame": false
			}
		}, {
			"$project": {
				"runId": 1,
				"huntingZoneId": 1,
				"bossId": 1,
				"encounterUnixEpoch ": 1,
				"fightDuration": 1,
				"isP2WConsums": 1,
				"members.playerDps": 1,
				"members.playerClass": 1,
				"members.playerName": 1,
				"members.playerId": 1,
				"members.playerServerId": 1,
			}
		}, {
			"$unwind": {
				"path": "$members"
			}
		}, {
			"$match": {
				"members.playerClass": data.playerClass
			}
		}
	])
		.collation({ locale: "en_US", numericOrdering: true })
		.sort({ "members.playerDps": -1 })
		.limit(limit);
};

upload.statics.getFromDbLinked = async function (runId) {
	return await this.findOne({
		runId: runId.trim()
	});
};

upload.statics.getFromDb = async function (searchParams) {
	return await this.findOne(searchParams, { "_id": 1 }).lean();
};
module.exports = mongoose.model("upload", upload);