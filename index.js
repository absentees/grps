const express = require('express');
const app = express();
const expressNunjucks = require('express-nunjucks');
const apicache = require('apicache');
const cache = apicache.middleware;
const Xray = require('x-ray');
const x = Xray({
	filters: {
		trimDollar: (value) => {
			return value.slice(2);
		}
	}
});

const isDev = app.get('env') === 'development';
console.log(`isDev: ${isDev}`);

app.set('views', __dirname + '/templates');

const njk = expressNunjucks(app, {
	watch: isDev,
	noCache: isDev
});

let pagCount = 12;

if (isDev) {
	pagCount = 1;
} else {
	app.use(cache('1 day'));
}

function getWines(cb) {
	x('https://www.drnks.com/collections/all', '.product', [{
		title: '.product-title',
		location: '.product-location',
		price: '.price',
		link: '@href',
		imgURL: '.lazy[data-original]@data-original'
		// Turn on for pagination
	}]).paginate('.page.next-page > a@href').limit(pagCount)(function (err, results) {
		results.forEach(element => {
			element.price = parseInt(element.price.trim().substring(1));
		});
		results.sort((a, b) => {
			return a.price - b.price;
		});
		cb(results);
	});
}

app.get('/', (req, res) => {
	getWines(winesResults => {
		res.render('index', {
			wines: winesResults
		});
	});
});

app.get('/vue', (req, res) => {
	res.sendFile(__dirname + '/templates/vue.html');
});

app.get('/api', (req, res) => {
	getWines(results => {
		res.send(results);
	});
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));