var Server	= require('mongodb').Server;
		Db 			= require('mongodb').Db;
		BSON		= require('mongodb').BSONPure;

var server = new Server(process.env.OPENSHIFT_MONGODB_DB_HOST, parseInt(process.env.OPENSHIFT_MONGODB_DB_PORT), {auto_reconnect: true});
db = new Db('music', server)

db.open(function(err,db) {
	if (err) { throw err; }
	db.authenticate(process.env.OPENSHIFT_MONGODB_DB_USERNAME, process.env.OPENSHIFT_MONGODB_DB_PASSWORD, {authdb: "admin"}, function(err,res){
		if (err) { throw err };
		db.collection('artists', {strict:true}, function(err,collection){
			if (err) {
				db.ensureIndex('artists', {artist:1}, {unique:true, background:true}, function(err,index) {
					console.log("Created index: " + index);
				});
			}
		});
	});
});

exports.add = function(req,res) {
	var artist = req.body;
	db.collection('artists', function(err,collection) {
		collection.insert(artist, {safe:true}, function(e,result) {
			if (err || result === undefined) { 
				console.log("ERROR!!!!");
				console.log(err);
				res.send({'error':'insert failed','message':e}); 
			} else { 
				res.send(JSON.stringify(result)); 
			}
		});
	});
}

exports.update = function(req,res) {

}

exports.delete = function(req,res) {

}

exports.getArtist = function(req,res) {

};

exports.getAll = function(req,res) {
	db.collection('artists',function(err,collection) {
		if (err) { throw err; }
		
		collection.find().sort({artist: 1}).toArray(function(e,artists) {
				collection.count(function(er,count) {
					var result = { paging: { totalArtists: count }, artists: artists};
					res.send(JSON.stringify(result)); 
			});
		});
	});
}
