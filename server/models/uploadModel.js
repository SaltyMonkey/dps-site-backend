"use strict";

const mongoose = require("mongoose");

const upload = new mongoose.Schema({
	runId: {
		type: String,
		unique: true
	},
	encounterUnixEpoch: Number,
	region: String,
	bossId: Number,
	huntingZoneId: Number,
	isMultipleHeals: Boolean,
	isMultipleTanks: Boolean,
	fightDuration: Number,
	partyDps: String,
	debuffDetail: [],
	isShame: Boolean,
	isP2WConsums: Boolean,
	uploader: { type: mongoose.Schema.Types.ObjectId, ref: "player"},
	members: [
		{
			userData: { type: mongoose.Schema.Types.ObjectId, ref: "player", autopopulate: true },
			aggro: Number,
			playerAverageCritRate: Number,
			playerDeathDuration: String,
			playerDeaths: Number,
			roleType: Number,
			playerDps: String,
			playerTotalDamage: String,
			playerTotalDamagePercentage: Number,
			buffDetail: [],
			skillLog: [
				{
					skillAverageCrit: String,
					skillAverageWhite: String,
					skillCritRate: Number,
					skillDamagePercent: Number,
					skillHighestCrit: String,
					skillHits: String,
					skillCasts: String,
					skillId: Number,
					skillLowestCrit: String,
					skillTotalDamage: String,
					skillTotalCritDamage: String
				}
			]
		}
	],
}, { useNestedStrict: true });

upload.plugin(require("mongoose-autopopulate"));

upload.statics.getLatestRuns = async function (searchParams, amount) {
	let runs = [];
	runs = await this.find(searchParams, {
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
		"members.playerServer": 1,
		"members.playerServerId": 1,
		"members.playerId": 1,
		"members.playerName": 1
	}).sort({ "encounterUnixEpoch": -1 }).limit(amount).lean({ autopopulate: true });
	return runs || [];
};

upload.statics.getCompleteRun = async function (id) {
	return await (this.findOne({ runId: id })).lean({ autopopulate: true });
};

upload.statics.getTopRuns = async function (data, limit) {
	let matchStage = {
		$match: {
			region: data.region,
			bossId: data.bossId,
			huntingZoneId: data.huntingZoneId,
			encounterUnixEpoch: data.encounterUnixEpoch,
			isP2WConsums: false,
			isMultipleHeals: false,
			isMultipleTanks: false,
			isShame: false
		}
	};
	if(data.roleType) {
		matchStage["$match"]["roleType"] = data.roleType;
	}

	return await this.aggregate(
		[
			{
				"$project": {
					"region": 1,
					"runId": 1,
					"bossId": 1,
					"huntingZoneId": 1,
					"encounterUnixEpoch": 1,
					"fightDuration": 1,
					"isP2WConsums": 1,
					"isMultipleHeals": 1,
					"isMultipleTanks": 1,
					"isShame": 1,
					"members.userData": 1,
					"members.playerDps": 1,
					"members.roleType": 1
				}
			}, 
			matchStage,
			{
				"$unwind": {
					"path": "$members"
				}
			}, {
				"$lookup": {
					"from": "players",
					"localField": "members.userData",
					"foreignField": "_id",
					"as": "player"
				}
			}, {
				"$project": {
					"runId": 1,
					"playerName": {
						"$arrayElemAt": [
							"$player.playerName", 0
						]
					},
					"playerClass": {
						"$arrayElemAt": [
							"$player.playerClass", 0
						]
					},
					"playerServer": {
						"$arrayElemAt": [
							"$player.playerServer", 0
						]
					},
					"playerDps": "$members.playerDps"
				}
			}, {
				$match: {
					playerClass: data.playerClass,
					playerServer: data.playerServer
				}
			}, {
				$sort: {
					playerDps: -1
				}
			}, {
				$limit: limit
			}
		],
		{ colation: { locale: "en_US", numericOrdering: true } }
	);
};

upload.statics.getFromDbLinked = async function (runId) {
	return await this.findOne({
		runId: runId
	});
};

upload.statics.getFromDb = async function (searchParams) {
	return await this.findOne(searchParams, { _id: 1 }).lean();
};
module.exports = mongoose.model("upload", upload);