'use strict';

let DOMParser = require('xmldom').DOMParser;
let Botkit = require('botkit');
let http = require('http');
let request = require('request');
let Chance = require('chance');
let Secret = require('./secret.js');
let unirest = require('unirest');

let chance = new Chance();
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
bot.startRTM(err => {
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
		helpMessage += `status              - Returns a "404 - Not Found" Cat Image.\n`;
		helpMessage += `status HTTP_STATUS  - Returns a Cat Image for the HTTP Status Code.\n`;
		helpMessage += `xkcd                - Returns the most recent XKCD comic.\n`;
		helpMessage += `xkcd random         - Returns a random XKCD comic.\n`;
		helpMessage += `xkcd COMIC_NUMBER   - Returns the specified XKCD comic #.\n`;
		helpMessage += `quotes              - Returns a random quote.\n`;
		helpMessage += `quotes CATEGORY     - Returns a random quote from a specific category.\`\`\``;

		bot.reply(message, helpMessage);
	}
});

controller.hears('weather', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let weatherMessage = message.text.toLowerCase();
	weatherMessage = weatherMessage.replace('weather', '').split(',');

	let city = weatherMessage[0].trim().replace(' ', '_');
	let state = weatherMessage[1].trim();

	let weatherUri = `/api/${ weatherToken }/forecast/q/${ state }/${ city }.json`;

	http.get({
		host: 'api.wunderground.com',
		path: weatherUri
	}, response => {
		let weatherBody = '';

		response.on('data', d => {
			weatherBody += d;
		});
		response.on('end', () => {
			let weatherData = JSON.parse(weatherBody);
			let weatherDays = weatherData.forecast.simpleforecast.forecastday;

			for (let i = 0; i < weatherDays.length; i++) {
				let weatherDay = `*${ weatherDays[i].date.weekday }*`;
				let weatherHigh = `*High*: ${ weatherDays[i].high.fahrenheit }`;
				let weatherLow = `*Low*: ${ weatherDays[i].low.fahrenheit }`;
				let weatherConditions = `*Conditions*: ${ weatherDays[i].conditions }`;
				let weatherMessage = `${ weatherDay } - ${ weatherHigh } - ${ weatherLow } - ${ weatherConditions }`;

				bot.reply(message, weatherMessage);
			}
		});
	});
});

controller.hears('google', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let googleMessage = message.text.toLowerCase().replace('google', '');
	googleMessage = googleMessage.slice(1, googleMessage.length).replace(/ /g, '+');

	let googleUrl = `https://www.google.com/#q=${ googleMessage }`;

	bot.reply(message, googleUrl);
});

controller.hears('xkcd', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let xkcdMessage = message.text.toLowerCase().replace('xkcd', '');
	xkcdMessage = xkcdMessage.slice(1, xkcdMessage.length);
	let comicUrl;

	let sendMessage = url => {

		if (xkcdMessage.length == 0) {
			comicUrl = 'http://xkcd.com/info.0.json';
		} else if (typeof xkcdMessage == "number") {
			comicUrl = `http://xkcd.com/${ xkcdMessage }/info.0.json`;
		} else {
			comicUrl = url;
		}

		request.post({
			url: comicUrl
		}, (err, httpResponse, body) => {
			let replyBody = JSON.parse(body);
			let title = replyBody.safe_title;
			let alt = replyBody.alt;
			let image = replyBody.img;

			bot.reply(message, `*${ title }*`);
			bot.reply(message, `${ image } *${ alt }*`);
		});
	};

	request.post({
		url: 'http://xkcd.com/info.0.json'
	}, (err, httpResponse, body) => {
		let replyBody = JSON.parse(body);
		let totalComicCount = String(replyBody.num);

		let randomComicNumber = chance.integer({
			min: 1,
			max: Number(totalComicCount)
		});

		let randomUrl = `http://xkcd.com/${ randomComicNumber }/info.0.json`;

		sendMessage(randomUrl);
	});
});

controller.hears('ch', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let chMessage = message.text.toLowerCase().replace('ch', '');

	if (chMessage.length == 0) {
		request.post({
			url: 'http://explosm.net/comics/latest/'
		}, (err, httpResponse, body) => {
			let data = body;
			let parse = new DOMParser();
			let htmlDoc = parse.parseFromString(data, "text/html");
			let image = htmlDoc.getElementById('main-comic');
			let address = image.getAttribute('src');

			bot.reply(message, address);
		});
	}
});

controller.hears('yoda', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let yodaMessage = message.text.replace('yoda', '');
	let searchTerm = yodaMessage.slice(1, yodaMessage.length).replace(/ /g, '+');

	unirest.get(`https://yoda.p.mashape.com/yoda?sentence=${ searchTerm }.`).header("X-Mashape-Key", "LtAGmt4o8qmshfSrGpgXTSQMBggIp1Rs9SejsnaZ4AzTxqwarv").header("Accept", "text/plain").end(function (result) {
		bot.reply(message, `${ result.body }`);
	});

	bot.api.reactions.add({
		timestamp: message.ts,
		channel: message.channel,
		name: 'yoda'
	}, function (err, res) {
		if (err) {
			bot.botkit.log('Failed to add emoji reaction :(', err);
		}
	});
});

controller.hears('quotes', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let quoteMessage = message.text.replace('quotes', '');
	let categoryTerm = quoteMessage.slice(1, quoteMessage.length);

	unirest.post(`https://andruxnet-random-famous-quotes.p.mashape.com/?cat=${ categoryTerm }`).header("X-Mashape-Key", "LtAGmt4o8qmshfSrGpgXTSQMBggIp1Rs9SejsnaZ4AzTxqwarv").header("Content-Type", "application/x-www-form-urlencoded").header("Accept", "application/json").end(function (result) {
		let messageBody = JSON.parse(result.body);
		let quote = messageBody.quote;
		let author = messageBody.author;
		let fullMessage = `*"${ quote }*\n\t\t\t- ${ author } -`;
		bot.reply(message, fullMessage);
	});

	bot.api.reactions.add({
		timestamp: message.ts,
		channel: message.channel,
		name: 'smile'
	}, function (err, res) {
		if (err) {
			bot.botkit.log('Failed to add emoji reaction :(', err);
		}
	});
});

controller.hears('status', ['direct_message', 'direct_mention', 'mention'], (bot, message) => {
	let statusMessage = message.text.replace('status', '');
	let statusCode = statusMessage.slice(1, statusMessage.length);
	let validHTMLCodes = [100, 101, 200, 201, 202, 204, 206, 207, 300, 301, 303, 304, 305, 307, 400, 401, 402, 403, 404, 405, 406, 408, 409, 410, 411, 413, 414, 416, 417, 418, 422, 423, 424, 425, 426, 429, 431, 444, 450, 500, 502, 503, 506, 507, 508, 509, 599];
	let doesItMatch;

	if (statusCode == '' || statusCode == ' ') {
		statusCode = '404';
	} else {
		for (let code in validHTMLCodes) {
			if (validHTMLCodes[code] == statusCode) {
				doesItMatch = true;
				break;
			} else {
				doesItMatch = false;
			}
		}

		if (doesItMatch == false) {
			statusCode = '404';
		}
	}

	unirest.get(`https://community-http-status-cats.p.mashape.com/${ statusCode }.jpg`).header("X-Mashape-Key", "LtAGmt4o8qmshfSrGpgXTSQMBggIp1Rs9SejsnaZ4AzTxqwarv").end(function (result) {
		let mainBody = JSON.stringify(result.request);
		let parsedBody = JSON.parse(mainBody);
		bot.reply(message, parsedBody.uri.href);
	});
});

//# sourceMappingURL=robot-compiled.js.map