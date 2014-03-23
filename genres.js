var musicdb = require('./musicdb');

db.collection('genres', {strict:true}, function(err,collection){
	if (err) {
		db.ensureIndex('genres', {genre:1}, {unique:true, background:true}, function(err,index) {
			console.log("Created index: " + index);
		});
	}
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
		collection.find().sort({genre:1}).toArray(function(e,results) {
			if (e) { throw e; }
			else { res.send(results); }
		});
	});
}

exports.getGenre = function(req,res) {

}
