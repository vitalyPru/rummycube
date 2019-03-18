'use strict';

var 
    express     = require('express'),
    path        = require('path');
	
	    var app = express();
    app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 3000);
    app.use(express.static(path.join(__dirname, './dist')));
    app.listen(app.get('port'), function(){
        console.log('development server listening on port ' + app.get('port'));
    });
	module.exports.app = app;