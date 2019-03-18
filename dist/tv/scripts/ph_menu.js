

var mainMenu = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function mainMenu(){
	    console.info("MainMenu func ");
        Phaser.Scene.call(this, {key: "MainMenu"});
    },
    preload: function(){
		console.log("mm preload func ");
		this.load.image("tile", "assets/tile.png");
    },
    create: function(){
		console.log("mm create func " );
		this.secondsElapsed = 0; //initial
        this.playerTextHeightOffset = 40;
        this.players = this.add.group();

        this.loadingText = this.add.text(game.config.width / 2, game.config.height /2 + 330 , "Waiting for Players to join", 
				{ fontSize: 64, fill: "#444444"});
        this.onPlayerUpdate(GameManager.getPlayerCount());
	},
	
	onPlayerUpdate: function (count) {
        console.log("onPlayerUpdate " + count);
        this.updateConnectedPlayers(count);

        if (this.players.getLength() > 0) {
			this.time.addEvent({ delay: 1000, callback: this.updateTimer, repeat: 10, callbackScope: this });
			console.log("timer start ");
        } else {
 			this.time.removeAllEvents();

            this.secondsElapsed = 0; //reset
            this.loadingText.setText("Waiting for Players to join...")
            this.loadingText.cacheAsBitmap = true;
        }
    },
    startGame: function () {
			this.time.removeAllEvents();
        this.players.destroy(true);

        this.loadingText.destroy();

        // Start the game
        GameManager.onGameStart(0);
        this.secondsElapsed = 0; //reset
        game.scene.switch('MainMenu','PlayGame');
    },

    updateTimer: function () {
		console.log("timer update ");
        var secondsToStart = gameOptions.GAME_COUNTDOWN_LENGTH - this.secondsElapsed;
        this.loadingText.setText("Game starting in " + secondsToStart + (secondsToStart==1 ? " second" : " seconds"));
        this.loadingText.cacheAsBitmap = true;
        GameManager.onGameStart(secondsToStart);
        if (this.secondsElapsed == gameOptions.GAME_COUNTDOWN_LENGTH) {
            this.startGame();
        }
        this.secondsElapsed = this.secondsElapsed + 1;
    },

    updateConnectedPlayers: function(count) {

        this.players.clear(true); //.removeAll();

        var activeSlots = this.activeSlots();

        if (count > 0) {

            for (var i = 0; i < count; i++) {
                var playerTextHorizontalPosition = (game.config.width / count / 2) * (i + 1);
                var playerTextStyle = { fontSize: 64, fill: activeSlots[i].hexColor, align: "center" };
               var playerText = this.add.text(playerTextHorizontalPosition, this.playerTextHeightOffset, activeSlots[i].name, playerTextStyle);
                this.players.add(playerText);
            }
        }
    },

    activeSlots: function() {
        var activeSlots = [];
        var slots = GameManager.slots;
        for (var i in slots) {
            var slot = slots[i];
            if (!slot.available) {
                activeSlots.push(slot);
            }
        }
        return activeSlots;
    }


});
