const express = require('express');
const app = express();
const cache = require('apicache').middleware;
const Xray = require('x-ray');
const x = Xray({
	filters: {
		trimDollar: (value) => {
			return value.slice(2);
		}
	}
});

app.use(cache('1 day'));

app.get('/', (req, res) => {
	x('https://www.drnks.com/collections/all', '.product', [{
		title: '.product-title',
		location: '.product-location',
		price: '.price',
		link: '@href'
	}]).paginate('.page.next-page > a@href').limit(10)(function (err, results) {
		results.forEach(element => {
			element.price = parseInt(element.price.trim().substring(1));
		});
		results.sort((a, b) => {
			return a.price - b.price;
        });
		res.send(results);
	});
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));