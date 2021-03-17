"use strict";

const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
	"playerClass": String, 
	"playerName": String,
	"playerId": Number,
	"playerServerId" : Number
});

module.exports = mongoose.model("player", playerSchema);