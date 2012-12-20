var port = process.env.PORT || 3000;
var express = require("express");
var scrapi = require('scrapi');
var MongoClient = require('mongodb').MongoClient;
var app = express();

var igManifest = {
	base: 'http://www.indiegogo.com/',
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


MongoClient.connect("mongodb://test:prod_test@ds045637.mongolab.com:45637/heroku_app10224439", function(err, db) {
  if(err) { return console.dir(err); }

  var collection = db.collection('contestants');


	/*
	  collection.insert(docs, {w:1}, function(err, result) {
	    var stream = collection.find({mykey:{$ne:2}}).streamRecords();
	    stream.on("data", function(item) {});
	    stream.on("end", function() {});
	    collection.findOne({mykey:1}, function(err, item) {});
	  });
	*/

	var updateProject = function(uri, id, raised, goal){
		collection.update({_id:id}, {$set:{amountRaised:raised, goal:goal}}, {safe:true}, function(err, result) {});
	};

	var updateAll = function(){
		  collection.find().sort({currentPosition:1}).toArray(function(err, items) {
		  	items.forEach(function(item){
		  		if (item.platform == "kickstarter"){
		  			scrapeKick(item.url, item._id);
		  		}
		  		else{
		  			scrapeIndie(item.url, item._id);
		  		}
		  	}, this);
  		});
	}

	var scrapeIndie = function(uri, id){
		indiegogo(uri).get(function(err, json){
			var amount = json.raised.replace(',','');
			amount = amount.replace(',','');
			var goal = json.goal.replace(',','');
			goal = goal.replace(',','');
			updateProject(uri, id, parseInt(amount.slice(amount.indexOf('$')+1)), parseInt(goal.slice(goal.indexOf('$')+1)) );
		});
	};

	var scrapeKick = function(uri, id){
		kickstarter(uri).get(function(err,json){
			updateProject(uri, id, parseInt(json.raised), parseInt(json.goal) );
		});
	};





	app.configure(function(){
		app.set('view engine', 'ejs');
	});

	app.use('/assets', express.static(__dirname + '/assets'));

	app.get("/rules", function(req, res){
		res.render('rules.ejs', {
			layout:false
		});
	});

	app.get("/", function(req, res){
		collection.find().sort({currentPosition:1}).toArray(function(err, items) {
			res.render('index.ejs', {
				layout:false,
				entrants: items
			});
		});	
	});


	app.listen(port);
	setInterval(updateAll,600000);
	updateAll();

});


