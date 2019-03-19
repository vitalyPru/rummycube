var ConnManager;

    var app;
	var host_id = undefined;
    var sendPointerMove = function (command, pointer) {
        if ( app )	app.publish(command,  JSON.stringify(pointer), host_id);

	};

$(ConnManager = function () {

    "use strict";

    window.msf.logger.level = 'silly';

    var username = navigator.userAgent.match(/(opera|chrome|safari|firefox|msie)/i)[0] + ' User';

    var ui = {
        castButton          : $('#castButton'),
        castSettings        : $('#castSettings'),
        castWindowTitle     : $('#castSettings .title'),
        castWindowDeviceList: $('#castSettings .devices'),
        castButtonDisconnect: $('#castSettings button.disconnect'),
        castButtonRescan    : $('#castSettings button.search'),
		holdedCard			: $('#holdedCard')
    };



	
    var setService = function(service){

        // Since the mobile web app and tv app are hosted from the same place
        // We will use a little javascript to determine the tv app url
        //var tvAppUrl = window.location.href.replace('/mobile','/tv');
		var tvAppUrl = "http://rummykub-rummykub.7e14.starter-us-west-2.openshiftapps.com/tv/";

        app = service.application(tvAppUrl, 'ru.vitaly.multiscreen.rcube');

        app.connect({name: username}, function (err) {
            if(err) return console.error(err);
        });

        app.on('connect', function(){
            $('body').removeClass().addClass('connected');
            ui.castWindowTitle.text(service.device.name);
			start_game();
        });

        app.on('disconnect', function(){
            $('body').removeClass().addClass('disconnected');
            ui.castWindowTitle.text('Connect to a device');
            app.removeAllListeners();
        });
		
		app.on('game_state', function(msg, from){
			var sc =rcgame.scene.scenes[0];
			
			sc.onStateUpdate(JSON.parse(msg));

		});
		app.on('slot_update', function(msg, from){
			if ( from.isHost ) {
				host_id = from.id;
			}

		});

};

    var init = function(){

        var search = window.msf.search();

        search.on('found', function(services){

            ui.castWindowDeviceList.empty();

            if(services.length > 0){
                $(services).each(function(index, service){

                    $('<li>').text(service.device.name).data('service',service).appendTo(ui.castWindowDeviceList);
                });
                $('body').removeClass().addClass('disconnected');
                ui.castWindowTitle.text('Connect To A Device');
            }else{
                $('<li>').text('No devices found').appendTo(ui.castWindowDeviceList);
            }
        });

        search.on('error', function(services){

            ui.castWindowDeviceList.empty();

  
                $('<li>').text('No devices found').appendTo(ui.castWindowDeviceList);
       
        });
		
        search.start();

        ui.castButton.on('click', function(){
            ui.castSettings.fadeToggle(200, 'swing');
        });

        ui.castSettings.on('click', function(evt){
            evt.stopPropagation();
            ui.castSettings.fadeOut(200, 'swing');
        });

        ui.castWindowDeviceList.on('click','li', function(evt){
            evt.stopPropagation();
            var service = $(this).data('service');
            if(service){
                setService(service);
                ui.castSettings.hide();
            }
        });

        ui.castButtonDisconnect.on('click', function(){
            if(app) app.disconnect();
            ui.castSettings.fadeToggle(200, 'swing');
        });

        ui.castButtonRescan.on('click', function(evt){
            evt.stopPropagation();
            search.start();
        });

        $(document).on('keydown', function(evt){
             console.log(event.keyCode);
            switch(evt.keyCode) {
				case 13:
			app.publish('turn_end',  ' ', host_id);
			break;
				case 17:
			app.publish('take_put',  ' ', host_id);
			break;
				case 90:
			app.publish('join_request',  '{"name":"VIT", "color":"red"} ', host_id);
			break;
				case 88:
			app.publish('join_request',  '{"name":"NAT", "color":"green"} ', host_id);
			break;
            case 84: // T - group up
                    app.publish('group_move', 'up', host_id);
                    break;
            case 86: // V - group dn
                    app.publish('group_move', 'down', host_id);
                    break;
            case 70: // F - group left`
                    app.publish('group_move', 'left', host_id);
                    break;
            case 71: // G - group rigth
                    app.publish('group_move', 'right', host_id);
                    break;

			case 32: // space
			//	var msg = 
			    rcgame.scene.scenes[0].changePointer();
		//		if(msg != undefined ){
              //      app.publish('place', msg, host_id);
		//		}
                    break;
                case 38: // up
                    app.publish('cursor_move', 'up', host_id);
                    break;
                case 40: // down
                    app.publish('cursor_move', 'down', host_id);
                    break;
                case 39: // right
                    app.publish('cursor_move', 'right', host_id);
                    break;
                case 37: // left
                    app.publish('cursor_move', 'left', host_id);
                    break;
                case 188: // <
               //     app.publish('rotate', 'left');
					rcgame.scene.scenes[0].onCursorMove(true);
                    break;
                case 190: // >
     //               app.publish('rotate', 'right');
	 					rcgame.scene.scenes[0].onCursorMove(false);

                default:
                    break
            }
        });

        $(document).on('keyup', function(evt){
            // console.log(event.keyCode);
            switch(evt.keyCode) {
                case 32: // space
//                    app.publish('fire', 'off');
                    break;
                case 38: // up
//                    app.publish('thrust', 'off');
                    break;
                case 37: // left
//                    app.publish('rotate', 'none');
                    break;
                case 39: // right
//                    app.publish('rotate', 'none');
                default:
                    break
            }
        });
    };


    init();
		console.log("Init ");


});

