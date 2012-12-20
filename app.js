var port = process.env.PORT || 3000;
var express = require("express");
var scrapi = require('scrapi');
var MongoClient = require('mongodb').MongoClient;
var app = express();

var igManifest = {
	base: 'http://www.indiegogo.com',
	spec:{
		'*':{
			raised:{
				$query: 'span.clearfix',
				$value: '(text)'
			},
			goal:{
				$query: 'p.goal',
				$value: '(text)'
			}
		}
	}
};
var ksManifest = {
	base: 'http://www.kickstarter.com/',
	spec:{
		'*':{
			raised:{
				$query: '#pledged',
				$value: '(attr data-pledged)'
			},
			goal:{
				$query: '#pledged',
				$value: '(attr data-goal)'
			}
		}
	}
}

var indiegogo = scrapi(igManifest);
var kickstarter = scrapi(ksManifest);

var scrapeIndie = function(uri){
	indiegogo(uri).get(function(err, json){
		var amount = json.raised.replace(',','');
		amount = amount.replace(',','');
		var goal = json.goal.replace(',','');
		goal = goal.replace(',','');
		console.log( parseInt(amount.slice(amount.indexOf('$')+1)) );
		console.log( parseInt(goal.slice(goal.indexOf('$')+1)) );
	});
};

var scrapeKick = function(uri){
	kickstarter(uri).get(function(err,json){
		console.log(parseInt(json.raised));
		console.log(parseInt(json.goal));
	});
};




app.configure(function(){
	app.set('view engine', 'ejs');
});

app.use('/assets', express.static(__dirname + '/assets'));

app.get("/", function(req, res){
	res.render('index.ejs', {
		layout:false
	});
});

app.get("/rules", function(req, res){
	res.render('rules.ejs', {
		layout:false
	});
});


app.listen(port);
