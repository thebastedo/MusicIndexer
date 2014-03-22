var Server	= require('mongodb').Server;
		Db 			= require('mongodb').Db;
		BSON		= require('mongodb').BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('musicData', server)

db.open(function(err,db) {
	if (err) { throw err; }
	db.collection('albums', {strict:true}, function(err,collection){
		if (err) {
			db.ensureIndex('albums', {album:1}, {unique:true, background:true}, function(err,index) {
				console.log("Created index: " + index);
			});
		}
	});
});

exports.add = function(req,res) {
	var album = req.body;
	db.collection('albums',function(err,collection) {
		collection.insert(album,{safe:true}, function(e,result) {
			if (err || result === undefined) { 
				res.send({'error':'insert failed','message':e}); 
			} else { 
				res.send(JSON.stringify(result)); 
			}
		});
	});
}

exports.getAll = function(req,res) {
	db.collection('albums',function(err,collection) {
		collection.find().sort({album:1}).toArray(function(e,results) {
			if (e) { throw e; }
			else { res.send(results); }
		});
	});
}

exports.getAlbum = function(req,res) {

}

exports.update = function(req,res) {

}

exports.delete = function(req,res) {

}
