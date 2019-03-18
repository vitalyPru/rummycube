'use strict';

var gulp        = require('gulp'),
    express     = require('express'),
    path        = require('path');

gulp.task('server', function(){
    var app = express();
    app.set('port', process.env.PORT || 3000);
	app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
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
	var cors = require('cors');
	disc.set('port', 8001);

// use it before all route definitions
    disc.use(cors({origin: 'http://localhost:3000'}));
	disc.get('/api/v2/', function(req, res) {
		res.send('{\
		"id": "uuid:5bf359ab-bd2d-4cb4-857f-18303f0fa689",\
		"name": "[TV] Samsung", \
		"version": "2.1.0",  "device": {   \
		"type": "Samsung SmartTV",   \
		"duid": "uuid:5bf359ab-bd2d-4cb4-857f-18303f0fa689",\
		"model": "16_JAZZL_UHD_BASIC", \
		"modelName": "UE40KU6072", \
		"description": "Samsung DTV RCR",  \
		"networkType": "wireless",  \
		"ssid": "f4:ec:38:e4:14:fc",   \
		"ip": "192.168.1.104", \
		"firmwareVersion": "Unknown", \
		"name": "[TV] Samsung",   \
		"id": "uuid:5bf359ab-bd2d-4cb4-857f-18303f0fa689",  \
		"udn": "uuid:5bf359ab-bd2d-4cb4-857f-18303f0fa689",  \
		"resolution": "3840x2160", \
		"countryCode": "RU",\
		"msfVersion": "2.1.0",\
		"smartHubAgreement": "true",\
		"VoiceSupport": "false",\
		"GamePadSupport": "true",\
		"wifiMac": "40:16:3B:64:A0:69",\
		"developerMode": "1",\
		"developerIP": "192.168.1.104",\
		"OS": "Tizen"},"type": "Samsung SmartTV",\
		"uri": "http://192.168.1.104:8001/api/v2/",\
		"remote": "1.0",\
		"isSupport": \
		    "{\\"remote_available\\":\\"true\\",\
			\\"remote_fourDirections\\":\\"true\\",\
			\\"remote_touchPad\\":\\"true\\",\
			\\"remote_voiceControl\\":\\"false\\",\
			\\"DMP_available\\":\\"true\\",\
			\\"DMP_DRM_PLAYREADY\\":\\"false\\",\
			\\"DMP_DRM_WIDEVINE\\":\\"false\\",\
			\\"EDEN_available\\":\\"true\\"}"\
		}');
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
