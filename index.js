const express = require('express');
const app = express();
const expressNunjucks = require('express-nunjucks');
const cache = require('apicache').middleware;
const Xray = require('x-ray');
const x = Xray({
	filters: {
		trimDollar: (value) => {
			return value.slice(2);
		}
	}
});

const isDev = app.get('env') === 'development';

app.set('views', __dirname + '/templates');

const njk = expressNunjucks(app, {
	watch: isDev,
	noCache: isDev
});

function getWines(cb) {
	x('https://www.drnks.com/collections/all', '.product', [{
		title: '.product-title',
		location: '.product-location',
		price: '.price',
		link: '@href',
		imgURL: '.lazy[data-original]@data-original'
		// Turn on for pagination
	}]).paginate('.page.next-page > a@href').limit(12)(function (err, results) {
		// }])(function (err, results) {
		results.forEach(element => {
			element.price = parseInt(element.price.trim().substring(1));
		});
		results.sort((a, b) => {
			return a.price - b.price;
		});
		cb(results);
	});
}

app.get('/', cache('1 day'), (req, res) => {
	getWines(winesResults => {
		res.render('index', {
			wines: winesResults
		});
	});
});

app.get('/api', cache('1 day'), (req, res) => {
	getWines(results => {
		res.send(results);
	});
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));