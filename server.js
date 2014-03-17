var express = require('express');
		songs		= require('./songs');
		artists	= require('./artists');

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

/*
 * Genre Methods
 */

/*
 * Listen!
 */
console.log("Listening on 127.0.0.1 on port 3000");
app.listen(3000,"127.0.0.1");
