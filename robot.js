'use strict';

let DOMParser = require('xmldom').DOMParser;
let Botkit    = require('botkit');
let http      = require('http');
let request   = require('request');
let Chance    = require('chance');
let unirest   = require('unirest');

let chance       = new Chance();
let weatherToken = 'bfbb9867aa3f80a7';
let slackToken;

let messageTypes = ['direct_message', 'direct_mention', 'mention'];
let memeGeneratorList = {
	"success": true,
	"result": [{
		"generatorID": 244535,
		"displayName": "Spiderman Desk",
		"urlName": "Spiderman-Desk",
		"totalVotesScore": 9,
		"imageUrl": "https://cdn.meme.am/images/400x/1823664.jpg",
		"instancesCount": 100945,
		"ranking": 108
	}, {
		"generatorID": 1204255,
		"displayName": "Correction Guy",
		"urlName": "Correction-Guy",
		"totalVotesScore": 55,
		"imageUrl": "https://cdn.meme.am/images/400x/5095879.jpg",
		"instancesCount": 93325,
		"ranking": 105
	}, {
		"generatorID": 1619317,
		"displayName": "Yeah that\u0027d be great...",
		"urlName": "Yeah-ThatD-Be-Great",
		"totalVotesScore": 12,
		"imageUrl": "https://cdn.meme.am/images/400x/6673510.jpg",
		"instancesCount": 89353,
		"ranking": 117
	}, {
		"generatorID": 60501,
		"displayName": "Office Space That Would Be Great",
		"urlName": "Office-Space-That-Would-Be-Great",
		"totalVotesScore": 6,
		"imageUrl": "https://cdn.meme.am/images/400x/1431338.jpg",
		"instancesCount": 88514,
		"ranking": 120
	}, {
		"generatorID": 3848819,
		"displayName": "Jo baka gujarati",
		"urlName": "Jo-Baka-Gujarati",
		"totalVotesScore": 0,
		"imageUrl": "https://cdn.meme.am/images/400x/12144817.jpg",
		"instancesCount": 85489,
		"ranking": 127
	}, {
		"generatorID": 1599963,
		"displayName": "san juan cholo",
		"urlName": "San-Juan-Cholo",
		"totalVotesScore": 48,
		"imageUrl": "https://cdn.meme.am/images/400x/6583377.jpg",
		"instancesCount": 84592,
		"ranking": 115
	}, {
		"generatorID": 1329714,
		"displayName": "So You\u0027re Telling me",
		"urlName": "So-YouRe-Telling-Me",
		"totalVotesScore": 78,
		"imageUrl": "https://cdn.meme.am/images/400x/5534345.jpg",
		"instancesCount": 82400,
		"ranking": 111
	}, {
		"generatorID": 18890,
		"displayName": "Toy Story Everywhere",
		"urlName": "Toy-Story-Everywhere",
		"totalVotesScore": -58,
		"imageUrl": "https://cdn.meme.am/images/400x/1153788.jpg",
		"instancesCount": 77656,
		"ranking": 158
	}, {
		"generatorID": 1143546,
		"displayName": "What if I told you / Matrix Morpheus",
		"urlName": "What-If-I-Told-You-Matrix-Morpheus",
		"totalVotesScore": 13,
		"imageUrl": "https://cdn.meme.am/images/400x/4885046.jpg",
		"instancesCount": 76517,
		"ranking": 131
	}, {
		"generatorID": 5989,
		"displayName": "Jackie Chan",
		"urlName": "Jackie-Chan",
		"totalVotesScore": 54,
		"imageUrl": "https://cdn.meme.am/images/400x/1121819.jpg",
		"instancesCount": 76408,
		"ranking": 126
	}, {
		"generatorID": 1921,
		"displayName": "Imagination",
		"urlName": "Imagination",
		"totalVotesScore": 84,
		"imageUrl": "https://cdn.meme.am/images/400x/158268.jpg",
		"instancesCount": 72905,
		"ranking": 121
	}, {
		"generatorID": 899,
		"displayName": "Waiting Skeleton",
		"urlName": "Waiting-Skeleton",
		"totalVotesScore": 8,
		"imageUrl": "https://cdn.meme.am/images/400x/188548.jpg",
		"instancesCount": 72658,
		"ranking": 142
	}]
};
let memeGeneratorImage = {
	"success": true,
	"result": {
		"generatorID": 45,
		"displayName": "Insanity Wolf",
		"urlName": "Insanity-Wolf",
		"totalVotesScore": 0,
		"imageUrl": "https://cdn.meme.am/images/400x/20.jpg",
		"instanceID": 68354641,
		"text0": "push a hipster down the stairs",
		"text1": "now look who\u0027s tumbling",
		"instanceImageUrl": "https://cdn.meme.am/instances/400x/68354641.jpg",
		"instanceUrl": "http://memegenerator.net/instance/68354641"
	}
};

// Define the correct Slack Token based on environment.
if (process.env.SLACK_TOKEN == undefined || process.env.SLACK_TOKEN == null) {
	let Secret = require('./secret.js');
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
controller.hears('help', messageTypes, (bot, message) => {
	let slackMessage = message.text.toLowerCase();

	if (slackMessage == 'help') {
		let helpMessage = '';
		helpMessage += `\`\`\`hello               - Returns "Hello yourself".\n`;
		helpMessage += `help                - Returns a list of available commands.\n`;
		helpMessage += `weather CITY, STATE - Include CITY, STATE & you'll get the weather.\n`;
		helpMessage += `google SEARCH_TERM  - Include a SEARCH_TERM & you'll get a link to Google.\n`;
		helpMessage += `status              - Returns a "404 - Not Found" Cat Image.\n`;
		helpMessage += `status HTTP_STATUS  - Returns a Cat Image for the HTTP Status Code.\n`;
		helpMessage += `status random       - Returns a random Cat Image of a HTTP Status Code.\n`;
		helpMessage += `ch                  - Returns the most recent Cyanide and Happiness comic.\n`;
		helpMessage += `ch random           - Returns a random Cyanide and Happiness comic.\n`;
		helpMessage += `oatmeal             - Returns a random Oatmeal comic strip.\n`;
		helpMessage += `xkcd                - Returns the most recent XKCD comic.\n`;
		helpMessage += `xkcd COMIC_NUMBER   - Returns the specified XKCD comic #.\n`;
		helpMessage += `xkcd random         - Returns a random XKCD comic.\n`;
		helpMessage += `ron                 - Returns a random Ron Swanson quote.\n`;
		// helpMessage += `yoda TEXT           - Returns your TEXT in Yoda Speak.\n`;
		helpMessage += `obfuscate           - Returns "Hello World" in Unicode Characters.\n`;
		helpMessage += `obfuscate TEXT      - Returns your text in Unicode Characters.\n`;
		helpMessage += `quotes              - Returns a random quote.\n`;
		helpMessage += `quotes CATEGORY     - Returns a random quote from a specific category.\`\`\``;

		bot.reply(message, helpMessage);
	}
});

controller.hears('weather', messageTypes, (bot, message) => {
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

controller.hears('google', messageTypes, (bot, message) => {
	let googleMessage = message.text.toLowerCase().replace('google', '');
	googleMessage     = googleMessage.slice(1, googleMessage.length).replace(/ /g, '+');

	let googleUrl = `https://www.google.com/#q=${googleMessage}`;

	bot.reply(message, googleUrl);
});

controller.hears('xkcd', messageTypes, (bot, message) => {
	let xkcdMessage = message.text.toLowerCase().replace('xkcd', '');
	xkcdMessage = xkcdMessage.slice(1, xkcdMessage.length);
	let comicUrl;

	let sendMessage = (url) => {

		if (xkcdMessage.length == 0) {
			comicUrl = 'http://xkcd.com/info.0.json';
		} else if (typeof xkcdMessage == "number") {
			comicUrl = `http://xkcd.com/${xkcdMessage}/info.0.json`;
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

			bot.reply(message, (`*${title}*`));
			bot.reply(message, (`${image} *${alt}*`));
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

		let randomUrl = `http://xkcd.com/${randomComicNumber}/info.0.json`;

		sendMessage(randomUrl);
	});
	
});

controller.hears('ch', messageTypes, (bot, message) => {
	let chMessage = message.text.toLowerCase().replace('ch', '');
	let chText = chMessage.slice(1, chMessage.length);

	console.log(chMessage);

	if (chMessage.length == 0) {
		request.get({
			url: 'http://explosm.net/comics/latest/'
		}, (err, httpResponse, body) => {
			let data = body;
			let parse = new DOMParser();
			let htmlDoc = parse.parseFromString(data, 'text/html');
			let mainImage = htmlDoc.getElementById('main-comic');

			if (mainImage === null) {
				bot.reply(message, 'There was an error retrieving your image.');
			} else {
				let address = mainImage.getAttribute('src');
				bot.reply(message, `http:${address}`);
			}
		});
	} else if (chText == 'random') {
		request.get({
			url: 'http://explosm.net/comics/latest/'
		}, (err, httpResponse, body) => {
			let data = body;
			let parse = new DOMParser();
			let htmlDoc = parse.parseFromString(data, 'text/html');
			let currentIssue = htmlDoc.getElementById('permalink');
			let currentIssueValue = currentIssue.getAttribute('value').replace('http://explosm.net/comics/', '').replace('/', '');
			console.log(currentIssueValue);

			let randomComic = chance.integer({ min: 1, max: currentIssueValue });
			console.log(randomComic);

			request.get({
				url: `http://explosm.net/comics/${randomComic}/`
			}, (err, httpResponse, body) => {
				let data = body;
				let parse = new DOMParser();
				let htmlDoc = parse.parseFromString(data, 'text/html');
				let mainImage = htmlDoc.getElementById('main-comic');

				if (mainImage === null) {
					bot.reply(message, 'There was an error retrieving your image.');
				} else {
					let address = mainImage.getAttribute('src');
					bot.reply(message, `http:${address}`);
				}
			});
		});
	}
});

controller.hears('yoda', messageTypes, (bot, message) => {
	let yodaMessage = message.text.replace('yoda', '');
	let searchTerm  = yodaMessage.slice(1, yodaMessage.length).replace(/ /g, '+');

	if (searchTerm == '' || searchTerm == ' ') {
		searchTerm = '';
	}

	unirest.get(`https://yoda.p.mashape.com/yoda?sentence=${searchTerm}.`)
		.header("X-Mashape-Key", "LtAGmt4o8qmshfSrGpgXTSQMBggIp1Rs9SejsnaZ4AzTxqwarv")
		.header("Accept", "text/plain")
		.end(function (result) {
			bot.reply(message, `${result.body}`);
		});

	bot.api.reactions.add({
		timestamp: message.ts,
		channel: message.channel,
		name: 'yoda'
	}, function(err, res) {
		if (err) {
			bot.botkit.log('Failed to add emoji reaction :(', err);
		}
	});
});

controller.hears('quotes', messageTypes, (bot, message) => {
	let quoteMessage = message.text.replace('quotes', '');
	let categoryTerm = quoteMessage.slice(1, quoteMessage.length);

	unirest.post(`https://andruxnet-random-famous-quotes.p.mashape.com/?cat=${categoryTerm}`)
		.header("X-Mashape-Key", "LtAGmt4o8qmshfSrGpgXTSQMBggIp1Rs9SejsnaZ4AzTxqwarv")
		.header("Content-Type", "application/x-www-form-urlencoded")
		.header("Accept", "application/json")
		.end(function (result) {
			let messageBody = JSON.parse(result.body);
			let quote = messageBody.quote;
			let author = messageBody.author;
			let fullMessage = `*"${quote}*\n\t\t\t- ${author} -`;
			bot.reply(message, fullMessage);
		});

	bot.api.reactions.add({
		timestamp: message.ts,
		channel: message.channel,
		name: 'smile'
	}, function(err, res) {
		if (err) {
			bot.botkit.log('Failed to add emoji reaction :(', err);
		}
	});
});

controller.hears('status', messageTypes, (bot, message) => {
	let statusMessage = message.text.replace('status', '');
	let statusCode = statusMessage.slice(1, statusMessage.length);
	let validHTTPCodes = [100, 101, 200, 201, 202, 204, 206, 207, 300, 301, 303, 304, 305, 307, 400, 401, 402, 403, 404, 405, 406, 408, 409, 410, 411, 413, 414, 416, 417, 418, 422, 423, 424, 425, 426, 429, 431, 444, 450, 500, 502, 503, 506, 507, 508, 509, 599];
	let randomHTTPCode = chance.pick(validHTTPCodes);
	let doesItMatch;

	if (statusCode == '' || statusCode == ' ') {
		statusCode = '404';
	} else if (statusCode == 'random') {
		statusCode = randomHTTPCode;
	} else {
		for (let code in validHTTPCodes) {
			if (validHTTPCodes[code] == statusCode) {
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

	unirest.get(`https://community-http-status-cats.p.mashape.com/${statusCode}.jpg`)
		.header("X-Mashape-Key", "LtAGmt4o8qmshfSrGpgXTSQMBggIp1Rs9SejsnaZ4AzTxqwarv")
		.end(function (result) {
			let mainBody = JSON.stringify(result.request);
			let parsedBody = JSON.parse(mainBody);
			bot.reply(message, parsedBody.uri.href);
		});
});

controller.hears('obfuscate', messageTypes, (bot, message) => {
	let obfuscateMessage = message.text.replace('obfuscate', '');
	let obfuscateWord = obfuscateMessage.slice(1, obfuscateMessage.length);

	if (obfuscateWord == '' || obfuscateWord == ' ') {
		obfuscateWord = 'Hello World';
	}

	unirest.get(`https://bheithaus-unicode-obfuscator.p.mashape.com/obfuscate?level=3&word=${obfuscateWord}`)
		.header('X-Mashape-Key', 'N6HhNVEoI1mshNub4YZLeKW1GDx0p1La1nojsnxney54j9lAo2')
		.header('Accept', 'application/json')
		.end((result) => {
			bot.reply(message, result.body.obfuscation);
		});
});

controller.hears(['hi', 'hello', 'howdy'], messageTypes, (bot, message) => {
	
	bot.api.reactions.add({
		timestamp: message.ts,
		channel: message.channel,
		name: 'robot_face'
	}, (err, res) => {
		if (err) bot.botkit.log('Failed to add emoji reaction :(', err);
	});

	controller.storage.users.get(message.user, (err, user) => {
		if (user && user.name) {
			bot.reply(message, `Hello ${user.name}!!`);
		} else {
			bot.reply(message, 'Hello there!');
		}
	});

});

controller.hears(['call me (.*)', 'my name is (.*)'], messageTypes, (bot, message) => {

	var name = message.match[1];
	controller.storage.users.get(message.user, (err, user) => {
		if (!user) {
			user = {
				id: message.user
			};
		}

		user.name = name;
		controller.storage.users.save(user, (err, id) => {
			bot.reply(message, `Got it! I will call you ${user.name} from now on!`);
		});
	});

});

controller.hears(['oatmeal', 'the oatmeal'], messageTypes, (bot, message) => {

	request.get({
		url: 'http://theoatmeal.com/feed/random',
		followAllRedirects: true
	}, (err, httpResponse, body) => {
		let data = body;
		let parse = new DOMParser();
		let htmlDoc = parse.parseFromString(data, 'text/html');
		let images = htmlDoc.getElementsByTagName('img');
		let comicImages = [];

		for (let i=0; i < images.length; i++) {
			let source = images[i].getAttribute('src');

			if (source.indexOf('comic') > -1) {
				comicImages.push(source);
			}
		}

		for (let comicImage of comicImages) {
			bot.reply(message, comicImage);
		}
	});

});

controller.hears(['meme'], messageTypes, (bot, message) => {

	let userName = 'voljohns';
	let password = 'z4zNdtrCwZqAkfut8aD^9?Bud';

	function processAPIResults(list) {
		let generators = [];
		let generatorList = ``;

		for (let i = 0; i < list.length; i++) {
			let generator = {
				id: list[i].generatorID,
				name: list[i].displayName,
				image: list[i].imageUrl
			};
			generators.push(generator);
			generatorList += `  + ${i+1} - *${generator.name}* - ${generator.image}\n`;
		}

		return [generators, generatorList];
	}

	function buildGeneratorList(reply) {
		request.get({
			url: 'http://version1.api.memegenerator.net/Generators_Select_ByPopular?pageIndex=0&pageSize=12&days=7'
		}, (err, httpResponse, body) => {
			let memeBody = JSON.parse(body);
			let memeResults = memeBody.result;
			let apiResults;

			if (memeBody.success) {
				apiResults = processAPIResults(memeResults);
			} else {
				console.log('These was an issue retrieving the MEME list from the API. Using cached list instead.');
				apiResults = processAPIResults(memeGeneratorList.result);
			}

			if (reply) {
				bot.reply(message, apiResults[1]);
			}
		});
	}

	function responseValidator(responses) {
		let initialResponses = responses;

		let supportedLang = ['en', 'es', 'he', 'ru', '--'];

		for (let i=0; i < supportedLang.length; i++) {
			if (supportedLang[i] !== initialResponses.memeLang) {
				initialResponses.memeLang = 'en';
			}
		}

		if (typeof initialResponses.memeType !== 'number' || Number(initialResponses.memeType) > 12) {
			initialResponses.memeType = '11';
		}

		console.log(initialResponses);
		return initialResponses;
	}

	function retrieveMeme(responses) {
		let validatedResponses = responseValidator(responses);

		request.get({
			url: `http://version1.api.memegenerator.net/Instance_Create?username=${userName}&password=${password}&languageCode=${validatedResponses.memeLang}&generatorID=45&imageID=20&text0=${validatedResponses.topText}&text1=${validatedResponses.bottomText}`
		}, (err, httpResponse, body) => {
			let memeBody = JSON.parse(body);
			let memeUrl;

			console.log(memeBody);

			if (memeBody.success) {
				memeUrl = memeBody.result.instanceImageUrl;
				bot.reply(message, memeUrl);
			} else {
				console.log('These was an issue retrieving the MEME from the API. Using cached image instead.');
				memeUrl = memeGeneratorImage.result.instanceImageUrl;
				bot.reply(message, memeUrl);
			}
		});
	}

	bot.startConversation(message, (err, convo) => {
		if (!err) {
			convo.say(`*Let's build a MEME together!*\n`);
			convo.ask(`*What language would you like the MEME to be in?* \n
			*en*  - English; *es*  - Spanish; *he*  - Hebrew; *ru*  - Russian; *--*  - Other`, (response, convo) => {

				bot.reply(message, `*Which of these MEMEs would you like to use?*\n`);
				buildGeneratorList(true);
				convo.next();
			}, {
				'key': 'memeLang'
			});

			convo.ask(``, (response, convo) => {
				convo.next();
			}, {
				'key': 'memeType'
			});

			convo.ask(`*What text would you like to appear on TOP of the MEME?*`, (response, convo) => {
				convo.next();
			}, {
				'key': 'topText'
			});

			convo.ask(`*What text would you like to appear on BOTTOM of the MEME?*`, (response, convo) => {
				let values = convo.extractResponses();
				retrieveMeme(values);
				convo.next();
			}, {
				'key': 'bottomText'
			});
		}
	});

});

controller.hears(['ron', 'ron swanson', 'swanson'], messageTypes, (bot, message) => {
	request.get({
		url: 'http://ron-swanson-quotes.herokuapp.com/v2/quotes'
	}, (err, httpResponse, body) => {
		let data = body.replace('[','').replace(']', '');
		let replyMessage = `*${data}* \n\t\t - Ron Swanson -`;
		bot.reply(message, replyMessage);
	});
});