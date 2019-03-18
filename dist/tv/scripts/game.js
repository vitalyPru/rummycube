var game;
var gameOptions = {
    tileSizeX: 100,
    tileSizeY: 150,
    fieldSizeX: 30,
	fieldSizeY: 10,
	headerHeight: 200,
	gridColor: 0xAAAAAA,
	cursorColor: 0x444444,
    backgroundColor:  0xFFFFFF,
    GAME_COUNTDOWN_LENGTH: 5
}
var colorMap = ["red", "green", "blue", "orange"];


function Chip (/*digit, color*/ index) {
//  this.digit = digit;
//  this.color = color;
	this.index = index;
}

function Cursor (i,j) {
	this.i = i;
	this.j = j;
}


function GameState (field, players, pile ) {
  this.field = field;
  this.players = players;
  this.pile = pile;
}

function PlayerState (pile, taked ) {
	this.pile = pile;
	this.taked = taked;
}

function Player (id, name, pile) {
  this.id = id;
  this.name = name;
  this.pile = pile;
  this.firstDone = false;
}

var colorMap = ["red", "green", "blue", "orange"];



window.onload = function() {
    var gameConfig = {
       type: Phaser.CANVAS, 
       width: (gameOptions.tileSizeX +12) * gameOptions.fieldSizeX,
       height: (gameOptions.tileSizeY +12) * gameOptions.fieldSizeY + gameOptions.headerHeight,
       backgroundColor:  gameOptions.backgroundColor,
       scene: [mainMenu , playGame]
   };
    game = new Phaser.Game(gameConfig);
    window.focus()
    resize();
    window.addEventListener("resize", resize, false);
	
}


var playGame = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize:
    function playGame(){
	    console.log("PlayGame func ");
        Phaser.Scene.call(this, {key: "PlayGame"});
    },
    preload: function(){
		console.log("preload func ");
        this.load.image("tile", "assets/tile.png");
    },
	
    create: function(){
        console.log("create func ");
        this.playerName = this.add.text( 50, gameOptions.headerHeight / 2, "Name", {
						font: "bold 64px Arial",
						align: "center",
						color: "black",
						align: "center"
					});
		var takedSprite = this.add.sprite(506 + gameOptions.tileSizeX / 2, gameOptions.tileSizeY / 2 , "tile");
		takedSprite.visible = false;
		var takedRect = new Phaser.Geom.Rectangle(506 , 6 , gameOptions.tileSizeX ,gameOptions.tileSizeY) ;
		var takedHolder = this.add.graphics();
			takedHolder.lineStyle(2,gameOptions.gridColor);
			takedHolder.strokeRectShape(takedRect);
		var takedText = this.add.text(506 + gameOptions.tileSizeX / 2 , gameOptions.tileSizeY / 2 , "", {
						font: "bold 64px Arial",
						align: "center",
						color: "red",
						align: "center"
					});
			takedText.setOrigin(0.5);
			takedText.visible= false;
			

		this.takedPlace = {
					tileChip: undefined,
					tileSprite: takedSprite,
					tilePlaceholder: takedHolder,
					tileRect: takedRect,
					tileText: takedText,
					isNew : false,
					isPlaced: false
		};
		
		this.fieldArray = [];
		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			this.fieldArray[i] = [];
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
			var sprite = this.add.sprite(j * (gameOptions.tileSizeX+12)+6 + gameOptions.tileSizeX / 2 , i * (gameOptions.tileSizeY+12)+6   + gameOptions.tileSizeY / 2 + gameOptions.headerHeight, "tile");
				sprite.visible = false;
				var rect = new Phaser.Geom.Rectangle(j * (gameOptions.tileSizeX+12)+6 , i * (gameOptions.tileSizeY+12)+6+ gameOptions.headerHeight , gameOptions.tileSizeX ,gameOptions.tileSizeY) ;
				var outer_rect = new Phaser.Geom.Rectangle(j * (gameOptions.tileSizeX+12) , i * (gameOptions.tileSizeY+12)+ gameOptions.headerHeight , gameOptions.tileSizeX+12 ,gameOptions.tileSizeY+12) ;
				var placeholder = this.add.graphics();
				var outerholder = this.add.graphics();
				placeholder.visible = true;
				placeholder.lineStyle(2,gameOptions.gridColor);
				placeholder.strokeRectShape(rect);
					var text = this.add.text(j * (gameOptions.tileSizeX+12) + gameOptions.tileSizeX / 2 , i * (gameOptions.tileSizeY+12) + gameOptions.tileSizeY / 2 + gameOptions.headerHeight , j+1, {
						font: "bold 64px Arial",
						align: "center",
						color: "red",
						align: "center"
					});
				text.setOrigin(0.5);
				text.visible = false;
		
				this.fieldArray[i][j] = {
					tileChip: undefined,
					tileSprite: sprite,
					tilePlaceholder: placeholder,
					tileRect: rect,
					outerRect: outer_rect,
					outerHolder: outerholder,
					tileText: text,
					isNew: false,
				}
            }
		}
		
	    this.cursor = new Cursor(0,0);
		this.closedPile = [];

		while(this.closedPile.length > 0) {
			this.closedPile.pop();
		}
		/* 0=j, 1..13=r,  14=j, 15..27-r, 
		  28-x, 29..41=g, 42-x, 43..55-g,
		  56-x, 57..69=b, 70,   71,,83=b
		  84-x  85..97=o, 98,   99..111
		  */
		for(var i = 0; i < 4; i++){
			for(var j = 0; j < 13; j++){
				this.closedPile.push( new Chip(j + i*28 + 1));
				this.closedPile.push( new Chip(j + i*28 + 15 ));
			}
		}
		this.closedPile.push( new Chip(0)); // Joker
		this.closedPile.push( new Chip(14)); // Joker
		this.shufflePile(this.closedPile);		
		this.playerStates = [];
		//this.takedChip = undefined;
		
		this.playerSlots = game.scene.getScene('MainMenu').activeSlots();
		for (var p=0; p<this.playerSlots.length; p++ ){
			this.playerStates.push(new Player( this.playerSlots[p].clientId, this.playerSlots[p].name, [] ));
			this.takeFromClosedPile(this.playerStates[p].pile,14);
		    GameManager.onGameStarted(this.playerSlots[p].clientId, 
			new PlayerState(this.playerStates[p].pile, this.takedPlace.tileChip));
		}
		
		var f =this.fieldArray[this.cursor.i][this.cursor.j];
		f.tilePlaceholder.lineStyle(12,gameOptions.cursorColor);
	    f.tilePlaceholder.strokeRectShape(f.tileRect);

		
		this.gameState = new GameState(this.fieldArray, this.playerStates, this.closedPile );
		this.setPlayer(0);
		
		
    },
	
	setPlayer: function(playerIdx ) {
		this.activePlayer = playerIdx;
		this.playerName.setText(this.playerStates[this.activePlayer].name);
//		this.gameBeforeTurn = JSON.parse(JSON.stringify(this.gameState));
	},

	
	shufflePile: function (pile) {
		for(var loop=0; loop<1000; loop++) {
			var fr = Math.floor(Math.random() * pile.length); 
			var to = Math.floor(Math.random() * pile.length); 
			var tmp = pile[fr];
			pile[fr] = pile[to];
			pile[to] = tmp;
		}
	},

    onPointerMove: function(clientId, pointer)	{
		if( this.playerStates[this.activePlayer].id == clientId) {
			var pnt = JSON.parse(pointer);
			pnt.x *= game.config.width; ///gameOptions.tileSizeX * gameOptions.fieldSizeX;
			pnt.y *= (game.config.height - gameOptions.headerHeight); //gameOptions.tileSizeY * gameOptions.fieldSizeY;
			pnt.y += gameOptions.headerHeight;
			var cplace = this.getPointerPlace(pnt.x,pnt.y);
			if (cplace != undefined ) this.setCursor(cplace);
			if ( this.takedChip() != undefined ) {
				this.takedPlace.tileSprite.setPosition(pnt.x, pnt.y);
				this.takedPlace.tileText.setPosition(pnt.x, pnt.y);
			}
		}
	},
	
	getPointerPlace: function(x, y) {
		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
				if ( (x < this.fieldArray[i][j].tileRect.x + this.fieldArray[i][j].tileRect.width) &&
				     (x > this.fieldArray[i][j].tileRect.x) &&
				     (y < this.fieldArray[i][j].tileRect.y + this.fieldArray[i][j].tileRect.height) &&
				     (y > this.fieldArray[i][j].tileRect.y)) {
						 return new Cursor(i,j);
					 }
			}
		}
		return undefined;
	},
	
	setCursor: function(cursor) {
		var f =this.fieldArray[this.cursor.i][this.cursor.j];
	    f.tilePlaceholder.clear();
		f.tilePlaceholder.lineStyle(2,gameOptions.gridColor);
	    f.tilePlaceholder.strokeRectShape(f.tileRect);
		f =this.fieldArray[cursor.i][cursor.j];
	    f.tilePlaceholder.clear();
		f.tilePlaceholder.lineStyle(12,gameOptions.cursorColor);
	    f.tilePlaceholder.strokeRectShape(f.tileRect);
		this.cursor.i = cursor.i;
		this.cursor.j = cursor.j;
	},
/*
	onCursorMove: function(clientId,  direction ) {
		if( this.playerStates[this.activePlayer].id == clientId) {
			if ( direction == 'left' ) {
				if (this.cursor.j > 0) setCursor(this.cursor.i, this.cursor.j-1);
			} else if ( direction == 'right' ) {
				if (this.cursor.j < gameOptions.fieldSizeX-1) setCursor(this.cursor.i, this.cursor.j+1);
			} else if ( direction == 'up' ) {
				if (this.cursor.i > 0) setCursor(this.cursor.i-1, this.cursor.j);
			} else if ( direction == 'down' ) {
				if (this.cursor.i < gameOptions.fieldSizeY-1) setCursor(this.cursor.i+1, this.cursor.j);
			}
		}
	},
*/
	onGroupMove: function(clientId,  direction ) {
		if( this.playerStates[this.activePlayer].id == clientId) {
//			var f =this.fieldArray[0][this.cursor];
//			f.tilePlaceholder.lineStyle(12, gameOptions.backgroundColor);
//			f.tilePlaceholder.strokeRectShape(f.tileRect);
//			f.tilePlaceholder.lineStyle(2,gameOptions.gridColor);
//			f.tilePlaceholder.strokeRectShape(f.tileRect);
//			if ( toLeft ) {
//				if (this.cursor > 0) this.cursor--;
//			} else {
//				if (this.cursor < gameOptions.fieldSizeX) this.cursor++;
//			}
//			f =this.fieldArray[0][this.cursor];
//			f.tilePlaceholder.lineStyle(12,gameOptions.cursorColor);
//			f.tilePlaceholder.strokeRectShape(f.tileRect);
		}
	},
	
	isEqualCard: function(c1, c2) {
		if ( c1.index != c2.index ) return false;
//		if ( c1.color != c2.color ) return false;
		return true;
		
	},
	
	onCursorToRemote: function(clientId, chip ) {
		if( this.playerStates[this.activePlayer].id == clientId) {
			/* traansfer cursor to remote command */
			if ( chip != undefined ) {
				/* cursor with taked */
				if (this.takedChip() == undefined ) {
					/* put local taked to remote teked */
					this.takedPlace.isNew = true;
					this.takedPlace.isPlaced = false;
					this.takedPlace.tileSprite.setPosition(506 + gameOptions.tileSizeX / 2, gameOptions.tileSizeY / 2);
					this.takedPlace.tileText.setPosition(506 + gameOptions.tileSizeX / 2, gameOptions.tileSizeY / 2);
					this.showPlace(this.takedPlace, chip);
				}
			}
		}
	},

	onRemoteClick: function(clientId) {
		if( this.playerStates[this.activePlayer].id == clientId) {
			/* remote click*/
			var f =this.fieldArray[this.cursor.i][this.cursor.j];
			if (this.takedChip() != undefined ) {
				/* taked chip present */
				if (f.tileChip == undefined ) {
					/* put taked chip to empty place*/
					this.showPlace(f,this.takedChip());
					f.isNew = this.takedPlace.isNew;
					/* remove placed card from player pile */
					for( var i =0; i<this.playerStates[this.activePlayer].pile.length; i++ ) {
						if (this.isEqualCard( this.playerStates[this.activePlayer].pile[i] , this.takedPlace.tileChip)) {
							this.playerStates[this.activePlayer].pile.splice(i, 1);
							break;
						}
					}
					/* send new pile to player  */
					GameManager.onGameStarted(this.playerStates[this.activePlayer].id , 
					   new PlayerState(this.playerStates[this.activePlayer].pile, undefined));
					this.clearPlace(this.takedPlace);
				}
			} 
			else {
				/* no taked chip */
				if ( f.tileChip != undefined ) {
					/* put tile to taked chip */
					
					this.takedPlace.tileSprite.setPosition(506 + gameOptions.tileSizeX / 2, gameOptions.tileSizeY / 2);
					this.takedPlace.tileText.setPosition(506 + gameOptions.tileSizeX / 2, gameOptions.tileSizeY / 2);
					this.showPlace(this.takedPlace,f.tileChip);
					this.takedPlace.isNew = f.isNew;
					this.takedPlace.isPlaced = true;
					this.clearPlace(f);
				}
			}
		}
	},
	
	onCursorToLocal: function(clientId) {
		if( this.playerStates[this.activePlayer].id == clientId) {
			if ((this.takedChip() == undefined) || (this.takedPlace.isNew  )) {
				/* no action if old chip is laked  */
				if ( (this.takedChip() != undefined) && (this.takedPlace.isPlaced == true )) {
					/* add placed taked chip back to pile  */
					this.playerStates[this.activePlayer].pile.push(this.takedChip());
				}
				GameManager.onGameStarted(this.playerStates[this.activePlayer].id , 
					new PlayerState(this.playerStates[this.activePlayer].pile, this.takedChip()));
				this.clearPlace(this.takedPlace);
			}
		}
	},
/*	
	onPlacedChip: function(clientId, chip ) {
		if( this.playerStates[this.activePlayer].id == clientId) {
			var f =this.fieldArray[this.cursor.i][this.cursor.j];
			if ((f.tileChip == undefined) && (chip != undefined) ) {
				this.showPlace(f, chip);
				f.isNew = true;
				for( var i =0; i<this.playerStates[this.activePlayer].pile.length; i++ ) {
					if (this.isEqualCard( this.playerStates[this.activePlayer].pile[i] , chip)) {
						this.playerStates[this.activePlayer].pile.splice(i, 1);
						break;
					}
				}
				GameManager.onGameStarted(this.playerStates[this.activePlayer].id , 
				new PlayerState(this.playerStates[this.activePlayer].pile, this.takedPlace.tileChip));
			} else if ((f.tileChip != undefined) && (chip == undefined) && (f.isNew) )  {
				this.playerStates[this.activePlayer].pile.push(f.tileChip);
				this.clearPlace(f);
				//f.isNew = false;
				//this.hilightGroups();
				GameManager.onGameStarted(this.playerStates[this.activePlayer].id ,
				new PlayerState(this.playerStates[this.activePlayer].pile, this.takedPlace.tileChip));				
			}
		}
	},
*/
	
	clearPlace: function( place ) {
		place.tileChip = undefined;
		place.tileSprite.visible = false;
		place.tileText.visible = false;
		place.isNew = false;
	},

	showPlace: function( place, chip ) {
		place.tileChip = chip;
		place.tileSprite.visible = true;
		place.tileText.visible = true;
		if( chip.index == 0 ) {
			place.tileText.setText( "J");
			place.tileText.setColor( "red");
		} else if ( chip.index == 14) {
			place.tileText.setText( "J");
			place.tileText.setColor( "blue");
		} else {
			place.tileText.setText( chip.index%14 );
			place.tileText.setColor( colorMap[Math.floor(chip.index/28)]);
		}

	},
	
	takedChip: function() {
		return this.takedPlace.tileChip;
	},
	
	onTakePut: function(clientId) {
		if( this.playerStates[this.activePlayer].id == clientId) {

			var f =this.fieldArray[this.cursor.i][this.cursor.j];
			if (this.takedChip() != undefined ) {
				if (f.tileChip == undefined ) {
					this.showPlace(f,this.takedChip());
					f.isNew = this.takedPlace.isNew;
					this.clearPlace(this.takedPlace);
					this.takedPlace.isNew = false;
					this.takedChip = undefined;
					//this.hilightGroups();
				}
			} else {
				if ( f.tileChip != undefined ) {
					//this.takedChip = f.tileChip;
					this.showPlace(this.takedPlace, f.tileChip);
					this.takedPlace.isNew = f.isNew;
					this.clearPlace(f);
					//f.isNew = false;
					//this.hilightGroups();
				}
			}
		}
	},

	hilightGroups: function() {
		var allGroupsValid = true;
		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
//				this.fieldArray[i][j].outerHolder.lineStyle(6, gameOptions.backgroundColor);
//				this.fieldArray[i][j].outerHolder.strokeRectShape(this.fieldArray[i][j].outerRect);
				this.fieldArray[i][j].outerHolder.clear();
			}
		}
		for ( var i=0; i<gameOptions.fieldSizeY; i++){
			var start = -1;
			var stop = 0;
			var finished = false;
			while( stop < gameOptions.fieldSizeX) {
				var f =this.fieldArray[i][stop];
				if (f.tileChip != undefined) {
					/* chip placed */
					if ( start < 0 ) {
						/* if first chip - started */
						start = stop;
					}
				} 
				if ( (f.tileChip == undefined) || (stop == (gameOptions.fieldSizeX-1))){
					/*  chip not placed */
					if ( start >= 0 ) {
						if (stop == (gameOptions.fieldSizeX-1)) stop++;
						finished = true;
					}
				}
				
				if ( finished ) {
					/* line finished */
					if ( start >= 0 ) {
						/* and line started */
						var countValidFlash = 0;
						var countValidStreet = 0;
						var lastStreetIndex = -1;
						var streetColor = undefined;
						var flashValue = -1;
						var freeFlashColors = [0,1,2,3];
						for( var k=start; k<stop; k++) {
							var cur = this.fieldArray[i][k];
							if ( lastStreetIndex <0 ) {
								/* first in street */
								lastStreetIndex = cur.tileChip.index % 14;
								if ( lastStreetIndex != 0 ) {
									streetColor = Math.floor(cur.tileChip.index/28);
								}
								countValidStreet++;
							} else {
								/* next in street */
								if ( (cur.tileChip.index % 14 == 0) || (lastStreetIndex == 0) ||
									((cur.tileChip.index % 14 == (lastStreetIndex +1))  &&  ( Math.floor(cur.tileChip.index/28) == streetColor))
									) {
									if ( lastStreetIndex == 0 ) {
											lastStreetIndex = cur.tileChip.index % 14;
											
									} else {
											lastStreetIndex++;
									}
									if ( (streetColor == undefined) && (cur.tileChip.index % 14 != 0) ) {
											streetColor = Math.floor(cur.tileChip.index/28);
									}
									countValidStreet++;
								} else {
									countValidStreet = 0;
								}
							}
							
							if ( flashValue < 0 ) {
								/* first in flash*/
								flashValue = cur.tileChip.index % 14;
								if ( flashValue == 0 ) {
									countValidFlash++;
								} else {
									for( var c=0; c<freeFlashColors.length; c++ ) {
										if ( c == Math.floor(cur.tileChip.index/28) ) {
												freeFlashColors[c] = -1;
												countValidFlash++;
												break;
										}
									}
								}
							} else {
								/* next in flash */
								if ( (cur.tileChip.index % 14 == flashValue) || (flashValue == 0) || (cur.tileChip.index % 14 == 0) ) {
									if ( (flashValue != 0) && (cur.tileChip.index % 14 != 0)) {
										for( var c=0; c<freeFlashColors.length; c++ ) {
											if ( c == Math.floor(cur.tileChip.index/28) ) {
												if ( freeFlashColors[c] >= 0 ) {
													freeFlashColors[c] = -1;
													countValidFlash++;
													break;
												}
											}
										}
										if ( c==freeFlashColors.length ) {
											countValidFlash = 0;
										}
									} else {
										countValidFlash++;
									}
								} else {
									countValidFlash = 0;
								}									
							}
						}
						for( var k=start; k<stop; k++) {
							var cur = this.fieldArray[i][k];
							if ( (countValidFlash >= 3) || (countValidStreet >= 3) ) {
								cur.outerHolder.lineStyle(6, 0x00FF00);
							} else {
								cur.outerHolder.lineStyle(6, 0xFF0000);
								allGroupsValid = false;
							}
							cur.outerHolder.strokeRectShape(cur.outerRect);							
						}
						start = -1;
						finished = false;
					}
				}
				stop++;
			}
		}	
			return allGroupsValid;
	},
	
	checkTurn: function(playerIdx) {
		if ( this.hilightGroups() == false ) return false;

		var hasNew = false;
		var countnew = 0;
		var hasjoker = false;

		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
				if (this.fieldArray[i][j].isNew) {
					hasNew = true;
					if ( this.fieldArray[i][j].tileChip.index % 14 == 0 ) {
						hasjoker = true;
					}
					countnew += this.fieldArray[i][j].tileChip.index % 14;
				}
			}
		}

		if ( /*this.playerStates[playerIdx].pile.length < this.gameBeforeTurn.players[playerIdx].pile.length*/
		     hasNew ) {
			if (this.playerStates[playerIdx].firstDone == false ) {
				if ( (hasjoker==false) && (countnew >= 30)) {
					this.playerStates[playerIdx].firstDone = true;
				} else {
					return false;
				}
			}
		} else {
			this.takeFromClosedPile(this.playerStates[playerIdx].pile,1);
		    GameManager.onGameStarted(this.playerStates[playerIdx].id, 
			new PlayerState(this.playerStates[this.activePlayer].pile, this.takedPlace.tileChip));
		}
		
	},		
	
	onTurnEnd: function(clientId) {
		if( this.playerStates[this.activePlayer].id == clientId) {
			if ( this.takedPlace.tileChip != undefined ) {
//				alert("Taked place not empty");
			} else {
				if ( this.checkTurn(this.activePlayer) == false ) {
//					alert ("Wrong groups on field");
				} else {
					for(var i = 0; i < gameOptions.fieldSizeY; i++) {
						for(var j = 0; j < gameOptions.fieldSizeX; j++){
//							if (this.fieldArray[i][j].isNew) {
								this.fieldArray[i][j].isNew = false;
//							}
						}
					}
						if ( this.playerStates[this.activePlayer].pile.length == 0 ) {
							/* End game */
							this.playerName.setText("!!!!  GAME OVER !!!");
						} else {
							this.activePlayer++;
							if ( this.activePlayer >= this.playerStates.length ) this.activePlayer = 0;
							this.setPlayer(this.activePlayer);
						}
				}
			}
				
		}
	},

	
	
	takeFromClosedPile: function(pile, num) {
		for(var i = 0; i < num; i++){
			var top = this.closedPile[this.closedPile.length-1];
			this.closedPile.pop();
			pile.push(top);
		}
		
    },	
});



function resize() {
	        console.log("resize func ");

    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

