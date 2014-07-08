/* jshint node: true */
'use strict';

var charlatan = require('charlatan');
var request = require('request');
var fs = require('fs');

// load config file
var config = require('./config.json');

// generate the users
var users = [];
for (var i = 0; i < config.numberOfUsers; i++) {
	var user = {};

	// user name
	var name = charlatan.Name.name();
	user.name = name;

	// user username
	var username = charlatan.Internet.userName(name);
	username = 'auctest_' + username;
	user.username = username;

	// user email
	var email = charlatan.Internet.freeEmail(name);
	user.email = email;

	users.push(user);
}

// generate the auction slots
var auction_slots = [];
for (var i = 0; i < config.numberOfSlots; i++) {
	var slot = {};
	slot.number = i + 1;
	slot.current_bid = 0;
	auction_slots.push(slot);
}

// set timer at set rate
var now = new Date();
var endTime = new Date(now.getTime() + 1000*60*config.timeLength);
var timer = setInterval(function() {
	var currentTime = new Date();
	if (currentTime.getTime() < endTime.getTime()) { randomAuctionTiming(); }
	else { clearInterval(timer); }
}, config.timeInterval);

// random timeout to test auction
function randomAuctionTiming() {
	// find remaining time
	var currentTime = new Date();
	var timeDifference = endTime.getTime() - currentTime.getTime(); 

	// choose a random time within that window
	var random = Math.random();
	var randomTime = Math.floor(timeDifference / (random * 100));

	// set timeout for that random time
	setTimeout(testAuction, randomTime);
}

// place random bid
function testAuction() {
	// choose random user
	var user = randomUser();

	// choose random number of slots
	// this should return an array of slot numbers
	var numberOfSlots = randomSlots();
	numberOfSlots.forEach(function(slotChoice) {
		// choose random slot
		var slot = auction_slots[slotChoice];
		
		// figure out min bet for slot
		var minBid = slot.current_bid;
		
		// figure out random bid for slot
		var bid = randomBid(slot.current_bid);
		
		// set bid to auction
		auction_slots[slotChoice].current_bid = bid;
		
		// print out bid
		var output = 'User: ' + user.name + ' bid ' + minBid + "/" + bid;
		output += ' on slot number: ' + slot.number; 
		console.log(output);
	});
}

function randomUser() {
	var max = users.length - 1;
	var min = 0;
	var userChoice = Math.floor(Math.random() * (max - min + 1)) + min;
	return users[userChoice];
}

function randomSlots() {
	var slots = [];

	// choose a random number of slots positions to bid on
	var max = config.numberOfSlots; 
	var min = 1; // shift by one to guarantee one slot
	var numberOfSlots = Math.floor(Math.random() * (max - min + 1)) + min;

	// for each slot position, choose a random slot number
	for (var i = 0; i < numberOfSlots; i++) {
		var dupeCheck = true;
		var slotMax = config.numberOfSlots - 1;
		var slotMin = 0;
		var slotNumber;

		// check that the random slot generated isn't already used
		while (dupeCheck) {
			slotNumber = Math.floor(Math.random() * (slotMax - slotMin + 1)) + slotMin;

			// check that the slotNumber isn't already in the array
			var check = slots.indexOf(slotNumber);
			if (check < 0) { dupeCheck = false; }
		}

		slots.push(slotNumber);
	}

	return slots;
}

function randomBid(current_bid) {
	var bidVariation = Math.ceil(Math.random() * 10); // from 1 -10
	var bidAdjustment = bidVariation * config.btcStep;  
	var bid = current_bid + bidAdjustment;
	return bid;
}