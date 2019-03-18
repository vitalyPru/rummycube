'use strict';

var gulp        = require('gulp'),
    express     = require('express'),
    path        = require('path'),
	cors = require('cors'),
    WebSocketServer = require('ws').Server,
    ws = require('ws'),
	errors = require('errors'),
	http = require('http');
	
gulp.task('server', function(){
    var app = express();
    app.set('port', process.env.PORT || 3000);
	app.use(function (req, res, next) {

		res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
		res.setHeader('Access-Control-Allow-Credentials', true);
		next();
	});
    app.use(express.static(path.join(__dirname, './dist')));
    app.listen(app.get('port'), function(){
        console.log('development server listening on port ' + app.get('port'));
    });
	module.exports.app = app;
});

gulp.task('discovery', function(){
    var disc = express();
	var expressWs = require('express-ws')(disc);

	disc.set('port', 8001);
// use it before all route definitions
    disc.use(cors({origin: 'http://localhost:3000'}));
 //   disc.get('/api/v2/channels/', function (req, res) {
//		 console.log('dev chs');
 //      res.sendfile(__dirname + '/ws.html');
 //   });
	disc.get('/api/v2/', function(req, res) {
		 console.log('dev disc');
		res.send('{\
		"id": "uuid:5bf359ab-bd2d-4cb4-857f-18303f0fa689",\
		"name": "[TV] Sam", \
		"device": { \
			"name": "[TV] Sam" \
		},\
		"type": "Samsung SmartTV",\
		"uri": "http://192.168.1.104:8001/api/v2/"\
		}');
	});

	disc.ws('/api/v2/channels/ru.vitaly.multiscreen.rcube', function(ws, req) {
		ws.on('message', function(msg) {
			console.log(msg)
			let data = JSON.parse(msg) // Вдруг прилетел неправильный json
			console.log('data..', data);
			if( data ) {
                switch ( data.method ) { 
                  case 'ms.application.start': // Смотрим, есть ли у нас экшен
			var smsg = '{"event":"ms.channel.connect","data":{\
			"id" : "Me", \
			"clients":[\
			{ "id" : "Me", "isHost" : true } \
			]\
			}}';
			ws.send(smsg);
                      break
                 case 'ms.webapplication.start': // Смотрим, есть ли у нас экшен
			var smsg = '{"event":"ms.channel.clientConnect","data":{\
			"id" : "CU", \
			"clients":[\
			{ "id" : "CU", "isHost" : false } \
			]\
			}}';
			ws.send(smsg);
                      break      
                  default: // Либо отдаём 404
 //                   ws.send( JSON.stringify(errors['404']) )
                    break
                }
            } else { 
               ws.send( JSON.stringify(errors['400']) )    
            }
		});
		console.log('socket..', req.method);
	});
    disc.listen(disc.get('port'), function(){
        console.log('development discovery server listening on port ' + disc.get('port'));
    });
});

gulp.task('dev',  gulp.parallel('server'));

gulp.task('build', function(){
    return; // currently there are no build tasks
});


gulp.task('default',  gulp.parallel('server', 'discovery'));
