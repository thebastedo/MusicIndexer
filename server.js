#!/bin/env node
var express = require('express');
		s				=	require('./settings');
		songs		= require('./songs');
		artists	= require('./artists');
		albums	= require('./albums');
		genres	= require('./genres');

var app = express();

var allowCrossDomain = function(req,res,next) {
	res.header('Access-Control-Allow-Origin','*');
	res.header('Access-Control-Allow-Methods','GET');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	next();
}

app.configure(function() {
	app.use(express.logger('tiny'));
	app.use(express.bodyParser());
	app.use(allowCrossDomain);
});

/*
 * Root Methods
 */
app.get('/', function(req,res) {
	res.send("Music API Docs coming, maybe...");
});

/*
 * Song Methods
 */
app.get('/lookupByPath', songs.lookupByPath);
app.get('/songs', songs.getAll);
app.get('/songs/:id', songs.getSong);
app.post('/songs', songs.add);
app.put('/songs/:id', songs.update);
app.delete('/songs/:id', songs.delete);

/*
 * Artists Methods
 */
app.get('/artists', artists.getAll);
app.get('/artists/:id', artists.getArtist);
app.post('/artists', artists.add);
app.put('/artists/:id', artists.update)
app.delete('/artists/:id', artists.delete);

/*
 * Album Methods
 */
app.get('/albums', albums.getAll);
app.post('/albums', albums.add);

/*
 * Genre Methods
 */
app.get('/genres', genres.getAll);
app.post('/genres', genres.add);

/*
 * Listen!
 */
var ipaddress = s.IP_ADDRESS;
var port = s.LISTEN_PORT || 8080;

if (typeof ipaddress === "undefined") {
	//  Log errors on OpenShift but continue w/ 127.0.0.1 - this
	//  allows us to run/test the app locally.
	console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
	ipaddress = "127.0.0.1";
};

console.log("Listening on " + ipaddress + " on port " + port);
app.listen(port,ipaddress);
