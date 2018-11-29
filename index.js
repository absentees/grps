const express = require('express');
const app = express();
const cors = require('cors');
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
const async = require('async');

const isDev = app.get('env') === 'development';
console.log(`isDev: ${isDev}`);
app.set("port", process.env.PORT || 5000);

const njk = expressNunjucks(app, {
	watch: isDev,
	noCache: isDev
});

let pagCount = 12;

if (isDev) {
	pagCount = 1;
	app.use(cache('12 hours'));
} else {
	app.use(cache('12 hours'));
}

function getPNVWines(cb) {
	x('https://pnvmerchants.com/collections/all', '.product-link', [{
		title: '.product__title',
		price: '.product__price',
		link: '@href',
		imgURL: '.product__img@src',
		store: "PnV"
		// Turn on for pagination
	}]).paginate('.pagination__items > span.next > a@href').limit(pagCount)(function (err, results) {
		if (err) {
			cb(err);
		}
		results.forEach(element => {
			element.price = parseInt(element.price.trim().substring(1));
		});

		cb(null, results);
	});
}

function getWines(allResults, cb) {
	x('https://www.drnks.com/collections/all', '.product', [{
		title: '.product-title',
		location: '.product-location',
		price: '.price',
		link: '@href',
		imgURL: '.lazy[data-original]@data-original',
		store: "DRNKS"
		// Turn on for pagination
	}]).paginate('.page.next-page > a@href').limit(pagCount)(function (err, results) {
		if (err) {
			cb(err);
		}
		results.forEach(element => {
			element.price = parseInt(element.price.trim().substring(1));
		});

		allResults.push(...results)
		cb(null, allResults);
	});
}

function sortWines(allResults, cb) {
	allResults.sort((a, b) => {
		return a.price - b.price;
	});

	cb(null, allResults);
}

app.get('/api', cors(), (req, res) => {
	async.waterfall([
		getPNVWines,
		getWines,
		sortWines
	], function (err, result) {
		res.send(result);
	});

});

app.listen(app.get("port"), () => console.log(`Listening on port: ${app.get("port")}`));
