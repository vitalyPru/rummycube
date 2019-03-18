var ConnectivityManager;

/**
 * The ConnectivityManager manages the communication channel between the client(s) and the TV application and acts as a
 * layer of abstraction between the client(s) and the game. In order to listen for the correct events, it has to have
 * some knowledge of the game but does not include any game logic. This approach allows for the form of transport to
 * be changed without the game logic having to be changed.
 */
$(ConnectivityManager = function(){

    "use strict";

    var channel;
    var logToConsole = true;
			   console.log('conn manager');
    window.msf.local(function(err, service){
        channel = service.channel('ru.vitaly.multiscreen.rcube');
   console.log('msf');
        channel.connect({name: 'TV'}, function (err) {
            // If there was an error log the error and return.
			   console.log('msf connect');
            if (err) {
                return console.error(err);
            }
            // Else we successfully connected to the channel, broadcast a slot update. For this application, the slot
            // update is used to indicate to the client that the TV Application has been initialized and is ready to go.
            else {
                if (logToConsole) {
                    console.log('connect success.');
                }
                sendSlotUpdate();
            }
        });

        channel.on('connect', function(client){
            if (logToConsole) {
                console.log('connect');
            }

            // Send the slot update to the new client so it knows what slots are available. For this application, the
            // slot update is used to indicate to the client that the TV Application has been initialized and is ready
            // to go.
            sendSlotUpdate(client.id);
        });

        channel.on('disconnect', function(client){
            if (logToConsole) {
                console.log('disconnect');
            }
            GameManager.removePlayer(client.id);
            sendSlotUpdate();
        });

        channel.on('clientConnect', function(client){
            if (logToConsole) {
                console.log('clientConnect');
            }

            // Send the slot update to the new client sp it knows what slots are available. For this application, the
            // slot update is used to indicate to the client that the TV Application has been initialized and is ready
            // to go.
            sendSlotUpdate(client.id);
        });

        channel.on('clientDisconnect', function(client){
            if (logToConsole) {
                console.log('clientDisconnect');
            }
            GameManager.removePlayer(client.id);
            sendSlotUpdate();
        });

        channel.on('join_request', function(msg, from) {
            if (logToConsole) {
                console.log('join_request. from=' + (from.id || 'Unknown'));
            }

            // Parse the JSON data received from the client.
            var joinRequestData = JSON.parse(msg);

            // Attempt to add the player to the game.
            var responseCode = GameManager.addPlayer(from.id, joinRequestData.name, joinRequestData.color);

            // Create the join response data
            var joinResponse = { name : joinRequestData.name,
                color : joinRequestData.color,
                response_code : responseCode };

            // Send a join_response back to the client
            if (logToConsole) {
                console.log('sending join_response ' + JSON.stringify(joinResponse) + ". to=" + from.id);
            }
            channel.publish('join_response', JSON.stringify(joinResponse), from.id);

            // If the client successfully joined, send out the slot data update.
            if (responseCode == GameManager.JoinResponseCode.SUCCESS) {
                sendSlotUpdate();
            }
        });

        channel.on('quit', function(msg, from) {
            if (logToConsole) {
                console.log('quit. from=' + (from.id || 'Unknown'));
            }
            GameManager.removePlayer(from.id);
            sendSlotUpdate();
        });

		channel.on('group_move', function(msg, from){

            if (logToConsole) {
                console.log('left. from=' + (from.id || 'Unknown'));
            }
            // Parse the JSON data received from the client.
           // var rotateData = JSON.parse(msg);

            // Rotate the player
            GameManager.onGroupMove(from.id, msg);
        });

		channel.on('cursor_to_remote', function(msg, from){

            if (logToConsole) {
                console.log('remote click. from=' + (from.id || 'Unknown'));
            }
            // Parse the JSON data received from the client.
			var chip = undefined;
            if (msg != undefined) chip = JSON.parse(msg);

            // Rotate the player
            GameManager.onCursorToRemote(from.id, chip);
        });
		
		 
        channel.on('remote_click', function(msg, from){
            if (logToConsole) {
                console.log('remote click. from=' + (from.id || 'Unknown'));
            }
            GameManager.onRemoteClick(from.id, msg);
        });

		channel.on('pointer_move', function(msg, from){
            if (logToConsole) {
                console.log('pointermove. from=' + (from.id || 'Unknown'));
            }
            GameManager.onPointerMove(from.id, msg);
        });

		channel.on('cursor_to_local', function(msg, from){
            if (logToConsole) {
                console.log('cursor to local. from=' + (from.id || 'Unknown'));
            }
            GameManager.onCursorToLocal(from.id, msg);
        });


        channel.on('turn_end', function(msg, from){
            if (logToConsole) {
                console.log('turnend. from=' + (from.id || 'Unknown'));
            }
            GameManager.onTurnEnd(from.id, msg);
        });

        channel.on('config_update', function(msg, from) {
            if (logToConsole) {
                console.log('config_update. from=' + (from.id || 'Unknown'));
            }

            // Parse the JSON data received from the client.
            var config = JSON.parse(msg);

            // Notify the GameManager of the config update.
            GameManager.setConfig(config);
        });

    });

	window.onkeydown = function(){
//	sendSlotUpdate("vvv");
		};
    // Send a slot_update to all or a specific client.
    function sendSlotUpdate(clientId) {
        // Create and populate the slot data array. It is a subset of the slots object used by the GameManager.
        //
        // NOTE: We create the SlotData here instead of in the GameManager since the ConnectivityManager to Client
        // contract has a subset of the data of the slots object used by the GameManager and we do not want the
        // GameManager to make any assumptions about the contract between the ConnectivityManager and the clients.
        var slotData = [];
        for (var i in GameManager.slots) {
            var slot = GameManager.slots[i];
            slotData[i] = { available : slot.available, color : slot.color};
        }

        // Send a slot_update to the client(s)
        if (logToConsole) {
            console.log('sending slot_update ' + JSON.stringify(slotData) + ". clientId=" + clientId);
        }
        if (clientId !== 'undefined') {
            channel.publish('slot_update', JSON.stringify(slotData), clientId);
        } else {
            channel.publish('slot_update', JSON.stringify(slotData));
        }
    }

    // Send a game_start to all clients
    function sendGameStart(countdown) {
        if (logToConsole) {
            console.log('sending game_start ' + countdown + " secs. to=all");
        }
        channel.publish('game_start', countdown.toString());
    }

    // Send a game_start to all clients
    function sendGameStarted(clientId, game_state) {
        if (logToConsole) {
            console.log('sending game_start ' +JSON.stringify(game_state) + clientId  );
        }
        var countdown = 0;
        channel.publish('game_state', JSON.stringify(game_state) , clientId);
    }

    // Send a player_out to the client
    function sendPlayerOut(clientId, countdown) {
        if (logToConsole) {
            console.log('sending player_out ' + countdown + " secs. to=" + clientId);
        }
        channel.publish('player_out', countdown.toString(), clientId);
    }

    // Send a game_over to all clients
    function sendGameOver(scoreData) {
        if (logToConsole) {
            console.log('sending game_over ' + JSON.stringify(scoreData) + '. to=all');
        }
        channel.publish('game_over', JSON.stringify(scoreData));
    }

    // Define what is exposed on the ConnectivityManager variable.
    return {
        onGameStart: function(countdown) { return sendGameStart(countdown); },
        onGameStarted: function(clientId, game_state) { return sendGameStarted(clientId, game_state); },
        onPlayerOut: function(clientId, countdown) { return sendPlayerOut(clientId, countdown); },
        onGameOver: function(scoreData) { return sendGameOver(scoreData); }
    }

}());
