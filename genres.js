var Server	= require('mongodb').Server;
		Db 			= require('mongodb').Db;
		BSON		= require('mongodb').BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('musicData', server)

db.open(function(err,db) {
	if (err) { throw err; }
	db.collection('genres', {strict:true}, function(err,collection){
		if (err) {
			db.ensureIndex('genres', {genre:1}, {unique:true, background:true}, function(err,index) {
				console.log("Created index: " + index);
			});
		}
	});
});

exports.add = function(req,res) {
	var genre = req.body;
	db.collection('genres',function(err,collection) {
		collection.insert(genre, {safe:true}, function(e,result) {
			if (err || result === undefined) { 
				res.send({'error':'insert failed','message':e}); 
			} else { 
				res.send(JSON.stringify(result)); 
			}
		});
	});
}

exports.delete = function(req,res) {

}

exports.update = function(req,res) {

}

exports.getAll = function(req,res) {
	db.collection('genres',function(err,collection) {
		collection.find().toArray(function(e,results) {
			if (e) { throw e; }
			else { res.send(results); }
		});
	});
}

exports.getGenre = function(req,res) {

}