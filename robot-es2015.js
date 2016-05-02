'use strict';

let DOMParser = require('xmldom').DOMParser;
let Botkit    = require('botkit');
let http      = require('http');
let request   = require('request');
let Chance    = require('chance');
let Secret    = require('./secret.js');

let chance       = new Chance();
let weatherToken = 'bfbb9867aa3f80a7';
let slackToken;

// Define the correct Slack Token based on environment.
if (process.env.SLACK_TOKEN == null) {
	slackToken = Secret.slackToken;
} else {
	slackToken = process.env.SLACK_TOKEN;
}

let controller = Botkit.slackbot({
	debug: false,
	retry: false
	//include "log: false" to disable logging
	//or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// Connect the bot to a stream of messages.
let bot = controller.spawn({
	token: slackToken
});

// Start the bot.
bot.startRTM((err) => {
	if (err) {
		throw new Error('Could not connect to Slack!');
	}
});

// Give the bot something to listen for.
controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	bot.reply(message, 'Hello yourself.');
});

controller.hears('help', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let slackMessage = message.text.toLowerCase();

	if (slackMessage == 'help') {
		let helpMessage = '';
		helpMessage += `\`\`\`hello               - Returns "Hello yourself".\n`;
		helpMessage += `help                - Returns a list of available commands.\n`;
		helpMessage += `weather CITY, STATE - Include CITY, STATE & you'll get the weather.\n`;
		helpMessage += `google SEARCH_TERM  - Include a SEARCH_TERM & you'll get a link to Google.\n`;
		helpMessage += `lorem               - Returns a random paragraph of Lorem Ipsum.\n`;
		helpMessage += `xkcd                - Returns the most recent XKCD comic.\n`;
		helpMessage += `xkcd random         - Returns a random XKCD comic.\n`;
		helpMessage += `xkcd COMIC_NUMBER   - Returns the specified XKCD comic #.\`\`\``;

		bot.reply(message, helpMessage);
	}
});

controller.hears('weather', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let weatherMessage = message.text.toLowerCase();
	weatherMessage = weatherMessage.replace('weather', '').split(',');

	let city = weatherMessage[0].trim().replace(' ', '_');
	let state = weatherMessage[1].trim();

	let weatherUri = `/api/${weatherToken}/forecast/q/${state}/${city}.json`;

	http.get({
		host: 'api.wunderground.com',
		path: weatherUri
	}, (response) => {
		let weatherBody = '';

		response.on('data', (d) => {
			weatherBody += d;
		});
		response.on('end', () => {
			let weatherData = JSON.parse(weatherBody);
			let weatherDays = weatherData.forecast.simpleforecast.forecastday;

			for (let i=0; i < weatherDays.length; i++) {
				let weatherDay = `*${weatherDays[i].date.weekday}*`;
				let weatherHigh = `*High*: ${weatherDays[i].high.fahrenheit}`;
				let weatherLow = `*Low*: ${weatherDays[i].low.fahrenheit}`;
				let weatherConditions = `*Conditions*: ${weatherDays[i].conditions}`;
				let weatherMessage = `${weatherDay} - ${weatherHigh} - ${weatherLow} - ${weatherConditions}`;

				bot.reply(message, weatherMessage);
			}
		});
	});
});