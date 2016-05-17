'use strict';

let DOMParser = require('xmldom').DOMParser;
let Botkit    = require('botkit');
let http      = require('http');
let request   = require('request');
let Chance    = require('chance');
let unirest   = require('unirest');

let chance         = new Chance();
const weatherToken = 'bfbb9867aa3f80a7';
let slackToken;

const messageTypes     = ['direct_message', 'direct_mention', 'mention'];
let memeGeneratorList  = {
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

// Helpful Functions.
function sendEmoji(bot, message, emoji) {
	bot.api.reactions.add({
		timestamp: message.ts,
		channel: message.channel,
		name: `${emoji}`
	}, function(err, res) {
		if (err) {
			bot.botkit.log('Failed to add emoji reaction :(', err);
		}
	});
}

// Give the bot something to listen for.
controller.hears('help', messageTypes, (bot, message) => {
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
	helpMessage += `cat bomb            - Returns a random number of Cat images.\n`;
	helpMessage += `cat bomb NUM_OF_IMG - Returns the number of Cat images you request.\n`;
	helpMessage += `obfuscate           - Returns "Hello World" in Unicode Characters.\n`;
	helpMessage += `obfuscate TEXT      - Returns your text in Unicode Characters.\n`;
	helpMessage += `bingo               - Returns a random BINGO card.\n`;
	helpMessage += `quotes              - Returns a random quote.\n`;
	helpMessage += `quotes CATEGORY     - Returns a random quote from a specific category.\`\`\``;

	// helpMessage += `yoda TEXT           - Returns your TEXT in Yoda Speak.\n`;

	bot.reply(message, {
		text: helpMessage,
		username: 'Help Bot',
		icon_emoji: ':help:'
	});
});

controller.hears('weather', messageTypes, (bot, message) => {
	let weatherMessage = message.text.toLowerCase();
	weatherMessage = weatherMessage.replace('weather', '').split(',');

	sendEmoji(bot, message, 'cloud');

	if (weatherMessage == undefined || weatherMessage == '' || weatherMessage == ' ') {
		bot.reply(message, {
			text: 'You need to supply the CITY, STATE in order to retrieve the weather.',
			username: 'Weather Bot',
			icon_emoji: ':cloud:'
		});
	} else {
		let city = weatherMessage[0].trim().replace(' ', '_');
		let state = weatherMessage[1].trim();

		http.get({
			host: 'api.wunderground.com',
			path: `/api/${weatherToken}/forecast/q/${state}/${city}.json`
		}, (response) => {
			let weatherBody = '';

			response.on('data', (d) => {
				weatherBody += d;
			});
			response.on('end', () => {
				let weatherData = JSON.parse(weatherBody);
				let weatherDays = weatherData.forecast.simpleforecast.forecastday;

				for (let i = 0; i < weatherDays.length; i++) {
					let weatherDay = `*${weatherDays[i].date.weekday}*`;
					let weatherHigh = `*High*: ${weatherDays[i].high.fahrenheit}`;
					let weatherLow = `*Low*: ${weatherDays[i].low.fahrenheit}`;
					let weatherConditions = `*Conditions*: ${weatherDays[i].conditions}`;
					let weatherMessage = `${weatherDay} - ${weatherHigh} - ${weatherLow} - ${weatherConditions}`;

					bot.reply(message, {
						text: weatherMessage,
						username: 'Weather Bot',
						icon_emoji: ':cloud:'
					});
				}
			});
		});
	}
});

controller.hears('google', messageTypes, (bot, message) => {
	let googleMessage = message.text.toLowerCase().replace('google', '');
	googleMessage     = googleMessage.slice(1, googleMessage.length).replace(/ /g, '+');

	sendEmoji(bot, message, 'google');

	bot.reply(message, {
		text: `https://www.google.com/#q=${googleMessage}`,
		username: 'Google Bot',
		icon_emoji: 'google'
	});
});

controller.hears('xkcd', messageTypes, (bot, message) => {
	let xkcdMessage = message.text.toLowerCase().replace('xkcd', '');
	xkcdMessage = xkcdMessage.slice(1, xkcdMessage.length);
	let comicUrl;

	sendEmoji(bot, message, 'computer');

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

			bot.reply(message, {
				text: `*${title}*`,
				username: 'XKCD Bot',
				icon_emoji: ':computer:'
			});
			bot.reply(message, {
				text: `${image} *${alt}*`,
				username: 'XKCD Bot',
				icon_emoji: ':computer:'
			});
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

		if (err) {
			bot.reply(message, {
				text: 'There appears to be an issue, please try again.',
				username: 'XKCD Bot',
				icon_emoji: ':computer:'
			});
		} else {
			sendMessage(randomUrl);
		}
	});
	
});

controller.hears('ch', messageTypes, (bot, message) => {
	let chMessage = message.text.toLowerCase().replace('ch', '');
	let chText = chMessage.slice(1, chMessage.length);

	sendEmoji(bot, message, 'happytobecake');

	if (chMessage.length == 0) {
		request.get({
			url: 'http://explosm.net/comics/latest/'
		}, (err, httpResponse, body) => {
			let data = body;
			let parse = new DOMParser();
			let htmlDoc = parse.parseFromString(data, 'text/html');
			let mainImage = htmlDoc.getElementById('main-comic');

			if (mainImage === null) {
				bot.reply(message, {
					text: 'There was an error retrieving your image.',
					username: 'Cyanide and Happiness Bot',
					icon_emoji: ':happytobecake:'
				});
			} else {
				let address = mainImage.getAttribute('src');
				bot.reply(message, {
					text: `http:${address}`,
					username: 'Cyanide and Happiness Bot',
					icon_emoji: ':happytobecake:'
				});
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
			let randomComic = chance.integer({ min: 1, max: currentIssueValue });

			request.get({
				url: `http://explosm.net/comics/${randomComic}/`
			}, (err, httpResponse, body) => {
				let data = body;
				let parse = new DOMParser();
				let htmlDoc = parse.parseFromString(data, 'text/html');
				let mainImage = htmlDoc.getElementById('main-comic');

				if (mainImage === null) {
					bot.reply(message, {
						text: 'There was an error retrieving your image.',
						username: 'Cyanide and Happiness Bot',
						icon_emoji: ':happytobecake:'
					});
				} else {
					let address = mainImage.getAttribute('src');
					bot.reply(message, {
						text: `http:${address}`,
						username: 'Cyanide and Happiness Bot',
						icon_emoji: ':happytobecake:'
					});
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

	sendEmoji(bot, message, 'yoda');
});

controller.hears('quotes', messageTypes, (bot, message) => {
	let quoteMessage = message.text.replace('quotes', '');
	let categoryTerm = quoteMessage.slice(1, quoteMessage.length);

	sendEmoji(bot, message, 'grumpycat');

	unirest.post(`https://andruxnet-random-famous-quotes.p.mashape.com/?cat=${categoryTerm}`)
		.header("X-Mashape-Key", "LtAGmt4o8qmshfSrGpgXTSQMBggIp1Rs9SejsnaZ4AzTxqwarv")
		.header("Content-Type", "application/x-www-form-urlencoded")
		.header("Accept", "application/json")
		.end(function (result) {
			let messageBody = JSON.parse(result.body);
			let quote = messageBody.quote;
			let author = messageBody.author;
			let fullMessage = `*"${quote}"*\n\t\t\t- ${author} -`;
			bot.reply(message, {
				text: fullMessage,
				username: 'Random Quotes Bot',
				icon_emoji: ':grumpycat:'
			});
		});
});

controller.hears('status', messageTypes, (bot, message) => {
	let statusMessage = message.text.replace('status', '');
	let statusCode = statusMessage.slice(1, statusMessage.length);
	let validHTTPCodes = [100, 101, 200, 201, 202, 204, 206, 207, 300, 301, 303, 304, 305, 307, 400,
						  401, 402, 403, 404, 405, 406, 408, 409, 410, 411, 413, 414, 416, 417, 418,
						  422, 423, 424, 425, 426, 429, 431, 444, 450, 500, 502, 503, 506, 507, 508, 509, 599];
	let randomHTTPCode = chance.pick(validHTTPCodes);
	let doesItMatch;

	sendEmoji(bot, message, 'cat');

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
			bot.reply(message, {
				text: parsedBody.uri.href,
				username: 'Status Cat Bot',
				icon_emoji: ':cat:'
			});
		});
});

controller.hears('obfuscate', messageTypes, (bot, message) => {
	let obfuscateMessage = message.text.replace('obfuscate', '');
	let obfuscateWord = obfuscateMessage.slice(1, obfuscateMessage.length);

	sendEmoji(bot, message, 'radioactive_sign');

	if (obfuscateWord == '' || obfuscateWord == ' ') {
		obfuscateWord = 'Hello World';
	}

	unirest.get(`https://bheithaus-unicode-obfuscator.p.mashape.com/obfuscate?level=3&word=${obfuscateWord}`)
		.header('X-Mashape-Key', 'N6HhNVEoI1mshNub4YZLeKW1GDx0p1La1nojsnxney54j9lAo2')
		.header('Accept', 'application/json')
		.end((result) => {
			bot.reply(message, {
				text: result.body.obfuscation,
				username: 'Obfuscate Bot',
				icon_emoji: ':radioactive_sign:'
			});
		});
});

controller.hears(['hi', 'hello', 'howdy'], messageTypes, (bot, message) => {
	sendEmoji(bot, message, 'robot_face');

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
	sendEmoji(bot, message, 'smiling_imp');

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

		if (comicImages.length > 0) {
			for (let comicImage of comicImages) {
				bot.reply(message, {
					text: comicImage,
					username: 'The Oatmeal Bot',
					icon_emoji: ':smiling_imp:'
				});
			}
		} else {
			bot.reply(message, {
				text: 'There appears to be an issue, please try again.',
				username: 'The Oatmeal Bot',
				icon_emoji: ':smiling_imp:'
			});
		}
	});
});

controller.hears(['meme'], messageTypes, (bot, message) => {
	const userName = 'voljohns';
	const password = 'z4zNdtrCwZqAkfut8aD^9?Bud';

	sendEmoji(bot, message, 'dandd');

	function processAPIResults(list) {
		let generators = [];
		let generatorList = ``;

		for (let i = 0; i < list.length; i++) {
			let generator = {
				id: list[i].generatorID,
				name: list[i].displayName,
				image: list[i].imageUrl,
				imageID: list[i].imageUrl.replace('https://cdn.meme.am/images/400x/', '').replace('.jpg', '')
			};

			generators.push(generator);
			generatorList += `  + ${i+1} - *${generator.name}* - ${generator.image}\n`;
		}

		return [generators, generatorList];
	}

	function buildGeneratorList(reply) {
		return request.get({
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

			return apiResults[0];
		});
	}

	function responseValidator(responses) {
		let initialResponses = responses;
		let breakOut = true;

		let supportedLang = ['en', 'es', 'he', 'ru', '--'];

		for (let i=0; i < supportedLang.length; i++) {
			if (supportedLang[i] == initialResponses.memeLang) {
				breakOut = false;
				break;
			}
		}

		if (breakOut) {
			initialResponses.memeLang = 'en';
		}

		if (Number(initialResponses.memeType) >= 12) {
			initialResponses.memeType = '11';
		}

		return initialResponses;
	}

	function retrieveMeme(responses, list) {
		let validatedResponses = responseValidator(responses);
		let imageList = JSON.parse(list.req.res.body).result;
		let imageID, generatorID;

		for (let i=0; i < imageList.length; i++) {
			if (i == validatedResponses.memeType) {
				generatorID = imageList[i].generatorID;
				imageID = imageList[i].imageUrl.replace('https://cdn.meme.am/images/400x/', '').replace('.jpg', '');
				break;
			}
		}

		request.get({
			url: `http://version1.api.memegenerator.net/Instance_Create?username=${userName}&password=${password}&languageCode=${validatedResponses.memeLang}&generatorID=${generatorID}&imageID=${imageID}&text0=${validatedResponses.topText}&text1=${validatedResponses.bottomText}`
		}, (err, httpResponse, body) => {
			let memeBody = JSON.parse(body);
			let memeUrl;

			if (memeBody.success) {
				memeUrl = memeBody.result.instanceImageUrl;
				bot.reply(message, {
					text: memeUrl,
					username: 'Meme Bot',
					icon_emoji: ':dandd:'
				});
			} else {
				console.log('These was an issue retrieving the MEME from the API. Using cached image instead.');
				memeUrl = memeGeneratorImage.result.instanceImageUrl;
				bot.reply(message, {
					text: memeUrl,
					username: 'Meme Bot',
					icon_emoji: ':dandd:'
				});
			}
		});
	}

	bot.startConversation(message, (err, convo) => {
		if (!err) {
			let list = [];

			convo.say(`*Let's build a MEME together!*\n`);
			convo.ask(`*What language would you like the MEME to be in?* \n
			*en*  - English; *es*  - Spanish; *he*  - Hebrew; *ru*  - Russian; *--*  - Other`, (response, convo) => {

				bot.reply(message, `*Which of these MEMEs would you like to use?*\n`);
				list = buildGeneratorList(true);
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

				retrieveMeme(values, list);
				convo.next();
			}, {
				'key': 'bottomText'
			});
		}
	});
});

controller.hears(['ron', 'ron swanson', 'swanson'], messageTypes, (bot, message) => {
	sendEmoji(bot, message, 'realdeadpool');

	request.get({
		url: 'http://ron-swanson-quotes.herokuapp.com/v2/quotes'
	}, (err, httpResponse, body) => {
		let data = body.replace('[','').replace(']', '');
		let replyMessage = `*${data}* \n\t\t - Ron Swanson -`;
		bot.reply(message, {
			text: replyMessage,
			username: 'Ron Swanson',
			icon_emoji: ':realdeadpool:'
		});
	});
});

controller.hears(['cat bomb'], messageTypes, (bot, message) => {
	let catMessage   = message.text.toLowerCase().replace('cat bomb', '');
	let catCommand   = catMessage.slice(1, catMessage.length);
	let chance       = new Chance();
	let numberOfCats = chance.integer({ min: 1, max: 5 });
	let imageType    = 'jpg';

	if (catMessage.indexOf('gif') > -1) {
		imageType = 'gif';
		catCommand = catCommand.replace('gif', '');
	} else if (catMessage.indexOf('png') > -1) {
		imageType = 'png';
		catCommand = catCommand.replace('png', '');
	} else {
		imageType = 'jpg';
		catCommand = catCommand.replace('jpg', '');
	}

	if (catMessage.length > 0) {
		numberOfCats = catCommand.replace(' ', '');
	}

	sendEmoji(bot, message, 'cat2');

	request.get({
		url: `http://thecatapi.com/api/images/get?format=html&results_per_page=${numberOfCats}`
	}, (err, httpResponse, body) => {
		let data = body;
		let parse = new DOMParser();
		let xmlDoc = parse.parseFromString(data, 'text/html');
		let imageList = xmlDoc.getElementsByTagName('img');
		let imageSrcs = [];

		if (imageList.length > 0) {
			for (let i=0; i < imageList.length; i++) {
				imageSrcs.push(imageList[i].getAttribute('src'));
			}

			for (let i=0; i < imageSrcs.length; i++) {
				bot.reply(message, {
					text: imageSrcs[i],
					username: 'Cat Bot',
					icon_emoji: ':cat2:'
				});
			}
		} else {
			bot.reply(message, {
				text: 'There appears to be an issue, please try again.',
				username: 'Cat Bot',
				icon_emoji: ':cat2:'
			});
		}
	});
});

controller.hears('test', messageTypes, (bot, message) => {
	bot.reply(message, {
		text: '/msg @margaret_petersen tests',
		username: 'margaret_petersen',
		icon_emoji: ':dash:'
	});
});

controller.hears('bingo', messageTypes, (bot, message) => {
	function numberGenerator () {
		let cards = [];

		sendEmoji(bot, message, 'game_die');

		let bNumberList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', 10, 11, 12, 13, 14, 15];
		let iNumberList = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
		let nNumberList = [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45];
		let gNumberList = [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
		let oNumberList = [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75];

		for (let k=0; k < 5; k++) {
			let chance = new Chance();
			let randomNumberB = chance.pickone(bNumberList);
			let randomNumberI = chance.pickone(iNumberList);
			let randomNumberN = chance.pickone(nNumberList);
			let randomNumberG = chance.pickone(gNumberList);
			let randomNumberO = chance.pickone(oNumberList);

			for (let j = 0; j < bNumberList.length; j++) {
				if (randomNumberB == bNumberList[j]) {
					bNumberList.splice(j, 1);
					break;
				}
			}

			for (let j = 0; j < iNumberList.length; j++) {
				if (randomNumberI == iNumberList[j]) {
					iNumberList.splice(j, 1);
					break;
				}
			}

			for (let j = 0; j < nNumberList.length; j++) {
				if (randomNumberN == nNumberList[j]) {
					nNumberList.splice(j, 1);
					break;
				}
			}

			for (let j = 0; j < gNumberList.length; j++) {
				if (randomNumberG == gNumberList[j]) {
					gNumberList.splice(j, 1);
					break;
				}
			}

			for (let j = 0; j < oNumberList.length; j++) {
				if (randomNumberO == oNumberList[j]) {
					oNumberList.splice(j, 1);
					break;
				}
			}

			cards.push({
				b: randomNumberB,
				i: randomNumberI,
				n: randomNumberN,
				g: randomNumberG,
				o: randomNumberO
			});
		}

		return cards;
	}
	
	function cardGenerator(cards) {
		let cardDesign = `\`\`\`--------------------------\n| B  | I  | N  | G  | O  |\n--------------------------\n`;

		for (let i=0; i<cards.length; i++) {
			if (cards[2].n) {
				cards[2].n = 'XX';
			}

			cardDesign += `| ${cards[i].b} | ${cards[i].i} | ${cards[i].n} | ${cards[i].g} | ${cards[i].o} |\n`;
		}

		cardDesign += `--------------------------\`\`\``;
		bot.reply(message, {
			text: cardDesign,
			username: 'Bingo Bot',
			icon_emoji: ':game_die:'
		});
	}

	cardGenerator(numberGenerator());
});