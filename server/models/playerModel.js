"use strict";

const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
	"playerClass": String, 
	"playerName": String,
	"playerId": Number,
	"playerServerId" : Number,
	"playerServer": String
});

playerSchema.statics.getFromDbLinked = async function (serverId, playerId, playerClass) {
	return await this.findOne({
		playerId: playerId,
		playerServerId: serverId,
		playerClass: playerClass.trim()
	});
};

module.exports = mongoose.model("player", playerSchema);