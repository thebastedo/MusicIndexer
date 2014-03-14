var Server	= require('mongodb').Server;
		Db 			= require('mongodb').Db;
		BSON		= require('mongodb').BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('musicData', server)

db.open(function(err,db) {
	if (err) { throw err; }
	db.collection('songs', {strict:true}, function(err,collection){
		if (err) {
			db.ensureIndex('songs', {path:1}, {unique:true, background:true}, function(err,index) {
				//console.log("Created index: " + index);
			});
		}
	});
});

exports.add = function(req,res) {
	var song = req.body;
	db.collection('songs', function(err,collection) {
		collection.insert(song, {safe:true}, function(e,result) {
			if (err || result === undefined) { res.send({'error':'insert failed','message':e}); }
			else { res.send(result[0]); }
		});
	});
};

exports.update = function(req,res) {

};

exports.delete = function(req,res) {

}

exports.getSong = function(req,res) {

};

exports.getAll = function(req,res) {
	db.collection('songs', function(err,collection) {
		var page = (parseInt(req.query.p) || 0);
		var opts = {};
		opts.limit = 1000;
		opts.skip = page * opts.limit;

		collection.count(function(er,count) {
			var totalPages = Math.ceil(count/opts.limit);

			var resp = {
				'paging': {'total': totalPages}
			};

			if (page+1 < totalPages) {
				resp.paging.next = 'http://localhost:3000/songs?p=' + (page+1);
			}
			if (page-1 > -1) {
				resp.paging.prev = 'http://localhost:3000/songs?p=' + (page-1);
			}

			collection.find({},opts).toArray(function(e,items) {
				resp.songs = items
				res.send(resp);
			});
		});

	});
};

exports.lookupByPath = function(req,res) {

};

var pathLookup = function(p,cb) {
	db.collection('songs',function(err,collection) {
		if (err) { throw err; }

		collection.find({"path": p}, function(err,cursor) {
			if (err) { throw err; }

			cursor.toArray(cb);
		});
	});
}
