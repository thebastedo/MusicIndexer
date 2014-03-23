var Server	= require('mongodb').Server;
		Db 			= require('mongodb').Db;
		BSON		= require('mongodb').BSONPure;

		s				= require('./settings');	

var server = new Server(s.MONGO_HOST, s.MONGO_PORT, {auto_reconnect: true});
db = new Db(s.MONGO_DB, server);

db.open(function(err,db) {
	if (err) { throw err; }
	if (s.MONGO_USER && s.MONGO_PASS) {
		db.authenticate(s.MONGO_USER, s.MONGO_PASS, {authdb: "admin"}, function(err,res){
			if (err) { throw err };
		});
	}
});
