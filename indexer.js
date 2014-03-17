var fs 		= require('fs');
		path	= require('path');
		probe	= require('node-ffprobe');
		http 	= require('http');

var _path = '/Users/justinbastedo/Desktop/testMusic';
//var _path = '/Volumes/External/CLEANED_MUSIC';
//var _path = '/Volumes/External/INCOMPLETE_MUSIC';

var _ignore = ['.DS_Store'];

var _new = [];

var _files = [];
var _dirs = [];

var start = process.hrtime();

var elapsed_time = function(note){
    var precision = 3; // 3 decimal places
    var elapsed = process.hrtime(start)[1] / 1000000; // divide by a million to get nano to milli
    console.log(process.hrtime(start)[0] + " s, " + elapsed.toFixed(precision) + " ms - " + note); // print message + time
    start = process.hrtime(); // reset the timer
}

var scan = function(p) {
	//console.log("Scanning : " + p );
	process.stdout.write('.');
	fs.stat(p, function(err,data) {
		if (err) { throw err; }

		if (data.isDirectory()) {
			_dirs.push(p);
			fs.readdir(p, function(err, f) {
				for (var i=0; i < f.length; i++) {
					if (_ignore.indexOf(f[i])) {
						_new.push(p +'/'+f[i]);
					}
				}
				scanNext();
			});
		} else if (data.isFile()) {
			_files.push(p);
			scanNext();
		} else {
			scanNext();
		} 
	});
}

var scanNext = function() {
	var next = _new.shift();

	if (next) {
		scan(next);
	} else {
		process.stdout.write('\n');
		elapsed_time("Finding files complete!");
		console.log("Found " + _dirs.length + " directories.");
		console.log("Found " + _files.length + " files.");
		if (_files.length > 0) {
			console.log("Scanning ID3s...");
			scanFile(_files.shift());
		}
	}
}

var id3s = [];

var failures = [];

var scanFile = function(f) {
	probe(f, function(err,data) {
		if (err) { 
			process.stdout.write('o');
			failures.push(f);
			var nextFile = _files.shift();

			if (nextFile) {
				scanFile(nextFile);
 				return; 
			}
		}
		
		process.stdout.write('.');

		if (data.fileext == '.mp3') {
			id3s.push(data);
		}
		
		var nextFile = _files.shift();

		if (nextFile) {
			scanFile(nextFile);
		} else {
			process.stdout.write('\n');
			elapsed_time("Scanned all the files...");
			console.log(id3s.length + " ID3s found.");
			console.log(failures.length + " Files failed.");
			for (var x=0; x < 10; x++) {
				console.log("Failure "+x+": "+ failures[x]);
			}

			var song = id3s.shift();
			if (song) {
				console.log("Adding songs via API...");
				addNextSong();
			}
		}
	});
}

var addedCount = 0;
var addedErrors = [];

var addSong = function(song) {
	if (song == null) { 
		console.log("Null Song...");
		addNextSong();
	} else {
		sng = JSON.stringify(song);
	
		var hdrs = {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(sng, 'utf8')
		};

		var opts = {
			host: 'localhost',
			port: 3000,
			path: '/songs',
			method: 'POST',
			headers: hdrs
		};

		var pst = http.request(opts, function(res) {
			res.on('data', function(d) {
				//console.log("Post completed for " + song.path );
				process.stdout.write('.');
				addedCount++;
				addNextSong();
			});
		});
	
		pst.write(sng);
		pst.end();
		pst.on('error', function(e) {
			console.log("HTTP Write error.");
			console.log(e);
			console.log(song);
			addedErrors.push(song);
			//id3s.push(song);
			setTimeout(function() { addSong(song); }, 10000);
		});
	}
}

var addNextSong = function() {
	var nextSong = id3s.shift();

	if (nextSong) {
		addSong(makeSong(nextSong));
		//setTimeout(function() { addSong(makeSong(nextSong)); }, 50);
	} else { 
		process.stdout.write('\n');
		elapsed_time("Added all id3s we found!");
		console.log("Posted " + addedCount + " to the api");
		console.log(addedErrors.length + " posts failed");
		console.log("Adding artists...");
		addNextArtists();
	}
}

var makeSong = function(data) {
	if (data.metadata) {
		if (artists.indexOf(data.metadata.artist) == -1) {
			artists.push(data.metadata.artist);
		}

		return {
			'path': data.file,
			'title': data.metadata.title,
			'artist': data.metadata.artist,
			'album_artist': data.metadata.album_artist,
			'composer': data.metadata.composer,
			'album': data.metadata.album,
			'track': data.metadata.track,
			'track': data.metadata.disc,
			'genre': data.metadata.genre,
			'duration': data.format.duration,
			'date': data.metadata.date,
			'sample_rate': data.streams[0].sample_rate,
			'bit_rate': data.streams[0].bit_rate,
			'size': data.format.size
		};
	} else {
		return null;
	}
}

var artists = [];

var addArtists = function(artists) {
	if (artists == null || artists.length == 0) { 
		console.log("Null Artist...");
		addNextArtists();
	} else {
		arts = JSON.stringify(artists);
	
		var hdrs = {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(arts, 'utf8')
		};

		var opts = {
			host: 'localhost',
			port: 3000,
			path: '/artists',
			method: 'POST',
			headers: hdrs
		};

		var pst = http.request(opts, function(res) {
			res.on('data', function(d) {
				process.stdout.write('.');
				addNextArtists();
			});
		});
	
		console.log("POSTING: " + arts);
		pst.write(arts);
		pst.end();
		pst.on('error', function(e) {
			console.log("HTTP Write error.");
			console.log(e);
			console.log(song);
			addedErrors.push(song);
			//id3s.push(song);
			setTimeout(function() { addArtists(arts); }, 10000);
		});
	}
}

var addNextArtists = function() {
	var next  = [];
	for (var i=0; i < 51; i++) {
		if (artists.length > 0) {
			next.push({artist: artists.shift()});
		}
	}
	
	if (next.length > 0) {
		addArtists(next);
	} else {
		console.log("Artists added!");
	}
}

console.log("Finding all files...");
scan(_path);
