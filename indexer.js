var fs 		= require('fs');
		path	= require('path');
		probe	= require('node-ffprobe');
		http 	= require('http');

var _path = '/Users/justinbastedo/Desktop/testMusic';
//var _path = '/Volumes/External/CLEANED_MUSIC';
//var _path = '/Volumes/External/INCOMPLETE_MUSIC';
//var _path = '/Volumes/External/Music';

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

/*
 * Songs Functions
 */
var songsMovedOn = false;

var addSong = function(song) {
	if (song == null) { 
		console.log("Null Song...");
		addNextSong();
	} else {
		postData('/songs',song,
			function(data) {
				process.stdout.write('.');
				addedCount++;
				addNextSong();
			},
			function(fail) {
				setTimeout(function() { addSong(song); }, 10000);
			});
	}
}

var addNextSong = function() {
	if (id3s.length !== 0) {
		var next  = [];
		while (id3s.length > 0 && next.length !== 50) {
			next.push(makeSong(id3s.shift()));
		}
		addSong(next);
	} else { 
		if (!songsMovedOn) {
			songsMovedOn = true;
			process.stdout.write('\n');
			elapsed_time("Added all id3s we found!");
			console.log("Posted " + addedCount + " to the api");
			console.log(addedErrors.length + " posts failed");
			console.log("Adding artists... " + artists.length);
			addNextArtists();
		}
	}
}

var makeSong = function(data) {
	if (data.metadata) {
		if (artists.indexOf(data.metadata.artist) == -1) {
			artists.push(data.metadata.artist);
		}
		if (albums.indexOf(data.metadata.album) == -1) {
			albums.push(data.metadata.album);
		}
		if (genres.indexOf(data.metadata.genre) == -1) {
			genres.push(data.metadata.genre);
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

/*
 * Artists Functions
 */
var artistsMovedOn = false;
var artists = [];

var addArtists = function(artist) {
	if (artist == null || artist.length == 0) { 
		console.log("Null Artist...");
		addNextArtists();
	} else {
		postData('/artists',artist,
			function(data) {
				process.stdout.write('.');
				addNextArtists();
			},
			function(fail) {
				setTimeout(function() { addArtists(artist); }, 10000);
			});
	}
}

var addNextArtists = function() {
	var next  = getNextBatch('artist',artists,50);
	
	if (next.length > 0) {
		addArtists(next);
	} else {
		if (!artistsMovedOn) {
			artistsMovedOn = true;
			process.stdout.write('\n');
			elapsed_time("Artists added!");
			console.log("Adding Albums... " + albums.length);
			addNextAlbums();
		}
	}
}

/*
 * Albums Functions
 */
var albumsMovedOn = false;
var albums = [];

var addAlbums = function(album) {
	if (album == null || album.length == 0) { 
		console.log("Null Album...");
		addNextAlbums();
	} else {
		postData('/albums',album, function(data) {
			process.stdout.write('.');
			addNextAlbums(); 
		},
		function(fail) {
			setTimeout(function() { addAlbums(album); }, 10000);
		});
	}
}

var addNextAlbums = function() {
	var next = getNextBatch('album',albums,50);

	if (next.length > 0) {
		addAlbums(next);
	} else {
		if (!albumsMovedOn) {
			albumsMovedOn = true;
			process.stdout.write('\n');
			elapsed_time("Albums added!");
			console.log("Adding Genres..." + genres.length);
			addNextGenres();
		}
	}
}

/*
 * Genre Functions
 */
var genresMovedOn = false;
var genres = [];

var addGenres = function(genre) {
	postData('/genres',genre,
		function(data) {
			process.stdout.write('.');
			addNextGenres();
		},
		function(fail) {
			setTimeout(function() { addGeners(genre); }, 10000);
		}
	);
}

var addNextGenres = function() {
	var next = getNextBatch('genre',genres,50);
	
	if(next.length > 0) {
		addGenres(next);
	} else {
		process.stdout.write('\n');
		elapsed_time("Genres Added!");
	}
}

/*
 * Misc Functions
 */
var getNextBatch = function(label,dataSet,size) {
	var returnSet = [];
	while (dataSet.length > 0 && returnSet.length !== size) {
		var obj = {};
		obj[label] = dataSet.shift();
		returnSet.push(obj);
	}
	return returnSet;
}

var postData = function(path,data,callback,failfunc) {
	// Make our data ready to post
	var pdata = JSON.stringify(data);	

	// Set some headers
	var hdrs = {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(pdata, 'utf8')
	};

	// set our post options
	var opts = {
		host: 'music-thebastedo.rhcloud.com',
		port: 80,
		path: path,
		method: 'POST',
		headers: hdrs
	};

	// create the http object
	var pst = http.request(opts, function(res) {
		res.on('data', function(d) {
			callback(d);
		});
	});
	
	pst.write(pdata);
	pst.end();
	pst.on('error', function(e) {
		process.stdout.write('\n');
		console.log("HTTP Write error.");
		console.log(e);
		process.stdout.write('\n');
		setTimeout(function() { failfunc(data); }, 10000);
	});
}

console.log("Finding all files...");
scan(_path);
