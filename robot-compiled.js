var DOMParser = require('xmldom').DOMParser;
var Botkit = require('botkit');
var http = require('http');
var request = require('request');
var Chance = require('chance');
var Secret = require('./secret.js');
var slackToken;

if (process.env.SLACK_TOKEN == null) {
	slackToken = Secret.slackToken;
} else {
	slackToken = process.env.SLACK_TOKEN;
}

var weatherToken = 'bfbb9867aa3f80a7';
var obamaToken = '60c6a10d525a7b198b73245bc2591b42';
var chance = new Chance();

var controller = Botkit.slackbot({
	debug: false,
	retry: false
	//include "log: false" to disable logging
	//or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
var bot = controller.spawn({
	token: slackToken
});

bot.startRTM(function (err) {
	if (err) {
		throw new Error('Could not connect to Slack!');
	}
});

// give the bot something to listen for.
controller.hears('hello', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
	bot.reply(message, 'Hello yourself.');
});

controller.hears('weather', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {

	var txt = message.text;
	txt = txt.toLowerCase().replace('weather', '');

	var city = txt.split(',')[0].trim().replace(' ', '_');
	var state = txt.split(',')[1].trim();

	console.log(city + ', ' + state);

	var url = '/api/' + weatherToken + '/forecast/q/state/city.json';
	url = url.replace('state', state);
	url = url.replace('city', city);

	http.get({
		host: 'api.wunderground.com',
		path: url
	}, function (response) {
		var body = '';
		response.on('data', function (d) {
			body += d;
		});
		response.on('end', function () {
			var data = JSON.parse(body);
			var days = data.forecast.simpleforecast.forecastday;

			console.log(days);

			for (var i = 0; i < days.length; i++) {
				bot.reply(message, days[i].date.weekday + ' high: ' + days[i].high.fahrenheit + ' low: ' + days[i].low.fahrenheit + ' conditions: ' + days[i].conditions);
				//bot.reply(message, days[i].icon_url);
			}
		});
	});
});

controller.hears('google', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {

	var txt = message.text;
	txt = txt.toLowerCase().replace('google', '');
	txt = txt.slice(1, txt.length);
	txt = txt.toLowerCase().replace(/ /g, '+');

	var url = 'https://www.google.com/#q=' + txt;

	bot.reply(message, url);
});

controller.hears('pugbomb', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
	bot.reply(message, 'Why do you want to look at pugs? Why not Shar-Peis?');
});

controller.hears('talkobamatome', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {

	var txt = message.text;
	txt = txt.toLowerCase().replace('talkobamatome', '');
	txt = txt.slice(1, txt.length);

	bot.reply(message, 'Processing your request, please hold.');

	request.post({
		url: 'http://talkobamato.me/synthesize.py',
		form: {
			input_text: txt
		}
	}, function (err, httpResponse, body) {
		var data = body;
		var parser = new DOMParser();
		var htmlDoc = parser.parseFromString(data, "text/html");
		var video = htmlDoc.getElementsByTagName('a');
		var address = video[0].getAttribute('href');
		var videoKey = address.split('=')[1];
		var videoLink = 'http://talkobamato.me/synth/output/' + videoKey + '/obama.mp4';

		bot.reply(message, videoLink);
	});
});

controller.hears('lorem', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
	var txt = message.text;
	var words = chance.paragraph();

	bot.reply(message, words);
});

controller.hears('xkcd', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
	var messageText = message.text;
	var splitText = message.text;
	splitText = splitText.toLowerCase().replace('xkcd', '');
	splitText = splitText.slice(1, splitText.length);

	var totalComicCount;
	var randomComic;

	if (messageText.toLowerCase() == 'xkcd' && messageText.length == 4) {
		request.post({
			url: 'http://xkcd.com/info.0.json'
		}, function (err, httpResponse, body) {
			var replyBody = JSON.parse(body);
			var title = replyBody.safe_title;
			var alt = replyBody.alt;
			var image = replyBody.img;

			bot.reply(message, '*' + title + '*');
			bot.reply(message, image + '\n' + alt);
		});
	} else if (splitText.toLowerCase().indexOf('random') > -1) {
		request.post({
			url: 'http://xkcd.com/info.0.json'
		}, function (err, httpResponse, body) {
			var replyBody = JSON.parse(body);
			totalComicCount = String(replyBody.num);
			randomComic = chance.integer({ min: 1, max: totalComicCount });

			request.post({
				url: 'http://xkcd.com/' + randomComic + '/info.0.json'
			}, function (err, httpResponse, body) {
				var replyBody = JSON.parse(body);
				var title = replyBody.safe_title;
				var alt = replyBody.alt;
				var image = replyBody.img;

				bot.reply(message, '*' + title + '*');
				bot.reply(message, image + '\n' + '*' + alt + '*');
			});
		});
	} else if (typeof Number(splitText) == "number") {
		request.post({
			url: 'http://xkcd.com/' + splitText + '/info.0.json'
		}, function (err, httpResponse, body) {
			var replyBody = JSON.parse(body);
			var title = replyBody.safe_title;
			var alt = replyBody.alt;
			var image = replyBody.img;

			bot.reply(message, '*' + title + '*');
			bot.reply(message, image + '\n' + '*' + alt + '*');
		});
	}
});

//# sourceMappingURL=robot-compiled.js.map