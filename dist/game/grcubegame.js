function Chip (/*digit, color*/ index) {
//  this.digit = digit;
//  this.color = color;
	this.index = index;
}

function Pointer(x,y) {
  this.x = x;
//  this.color = color;
  this.y = y;
}

var gameOptions = {
    tileSizeX: 100,
    tileSizeY: 150,
    fieldSizeX: 15,
	fieldSizeY: 6,
	gridColor: 0xAAAAAA,
	cursorColor: 0xFF0000

}
var colorMap = ["red", "green", "blue", "orange"];

class RcField extends Phaser.Scene {

    constructor (config)
    {
        super(config);
    }

    preload ()
    {
        this.load.image('tile', '../game/tile.png');
        this.load.image('cursor', '../game/cursor.png');
    }

    create ()
    {
		console.log("create Rc field ");

		this.fieldArray = [];
		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			this.fieldArray[i] = [];
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
				var sprite = this.add.sprite(j * (gameOptions.tileSizeX+12)+6 + gameOptions.tileSizeX / 2 , i * (gameOptions.tileSizeY+12)+6   + gameOptions.tileSizeY / 2 , "tile");
				sprite.visible = false;
				var rect = new Phaser.Geom.Rectangle(j * (gameOptions.tileSizeX+12)+6 , i * (gameOptions.tileSizeY+12)+6 , gameOptions.tileSizeX ,gameOptions.tileSizeY);
				var placeholder = this.add.graphics();
				placeholder.visible = true;
				placeholder.lineStyle(2,gameOptions.gridColor);
				placeholder.strokeRectShape(rect);
					var text = this.add.text(j * (gameOptions.tileSizeX+12) + gameOptions.tileSizeX / 2 , i * (gameOptions.tileSizeY+12) + gameOptions.tileSizeY / 2  , j+1, {
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
					tileText: text
				}
            }
		}
		
		var takedsprite = this.add.sprite(0 , 0 , "tile");
				takedsprite.visible = false;
		var takedtext = this.add.text(0 , 0  , "", {
						font: "bold 64px Arial",
						align: "center",
						color: "red",
						align: "center"
					});
		takedtext.setOrigin(0.5);
		takedtext.visible = false;
		this.takedPlace = {
					tileChip: undefined,
					tileSprite: takedsprite,
					tileText: takedtext
		}
		
	    this.cursor = 0;
		this.tileLen =0;
		
        this.cursorPointer = this.add.image(0, 0, 'cursor').setVisible(false);
		this.pointerIsMy = true;

		this.input.on('pointermove', function (pointer)
		{
			if ( this.pointerIsMy ) {
				/* move on my board*/
				this.cursorPointer.setVisible(true).setPosition(pointer.x, pointer.y);
				var cplace = this.getPointerPlace(pointer.x,pointer.y);
				if (cplace != undefined ) {
					this.setCursor(cplace);
					if (this.takedPlace.tileChip != undefined ) {
						this.takedPlace.tileSprite.setPosition(pointer.x, pointer.y);
					} 
				}

			} else {
				/* move on remote board */
				this.cursorPointer.setVisible(false);
				
				sendPointerMove('pointer_move', new Pointer(
				  pointer.x / rcgame.config.width/*(gameOptions.fieldSizeX * gameOptions.tileSizeX)*/,
				  pointer.y / rcgame.config.height/*(gameOptions.fieldSizeY * gameOptions.tileSizeY)*/
				  ));
			}

		}, this);		

		this.input.on('pointerdown', function (pointer)
		{
			var cursorPlace = this.getCursorPlace();
			if ( this.pointerIsMy ) {
				/* click on my board*/
				/* get chip on ckick point */
				if ( cursorPlace.tileChip != undefined ){
					/* there are chip on cursor */
					/* move chip to taked */
					this.showPlace(this.takedPlace, cursorPlace.tileChip);
					this.clearPlace(cursorPlace);
					this.takedPlace.tileSprite.setPosition(pointer.x, pointer.y);
				} else {
					/* there are not chip on clicked cursor */
					if ( this.takedPlace.tileChip != undefined) {
						/* put there teked chip if any*/
						this.showPlace(cursorPlace, this.takedPlace.tileChip);
						this.clearPlace(this.takedPlace);
					}
				}
			} else {
				/* click on remote board */
				sendPointerMove('remote_click', '');
			}
		}, this);		
		
		window.focus()
		resize();
		window.addEventListener("resize", resize, false);
    }

    changePointer() {
		if ( this.pointerIsMy ) {
			/* switch to remote */
			this.pointerIsMy = false;
			/* hide cursor pointer */
			this.cursorPointer.setVisible(false);			
			var tchip = this.takedPlace.tileChip;
			/* send taked chip to remote */
			sendPointerMove('cursor_to_remote', tchip);
			this.clearPlace(this.takedPlace);
		} else {
			/* ask for cursor - wait for new player state*/
			sendPointerMove('cursor_to_local', "");
		
		}
	}
	
	
	getPointerPlace(x, y) {
		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
				if ( (x < this.fieldArray[i][j].tileRect.x + this.fieldArray[i][j].tileRect.width) &&
				     (x > this.fieldArray[i][j].tileRect.x) &&
				     (y < this.fieldArray[i][j].tileRect.y + this.fieldArray[i][j].tileRect.height) &&
				     (y > this.fieldArray[i][j].tileRect.y)) {
						 return i*  gameOptions.fieldSizeX + j;
					 }
			}
		}
		return undefined;
	}
	
	findEmptyPlace( ) {
		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
					if ( this.fieldArray[i][j].tileChip == undefined){
						return this.fieldArray[i][j];
					}
			}
		}
		return undefined;
	}

	clearPlace( place ) {
		place.tileChip = undefined;
		place.tileSprite.visible = false;
		place.tileText.visible = false;
	}

	showPlace( place, chip ) {
		place.tileChip = chip;
		place.tileSprite.setVisible(true);
		place.tileText.setVisible(true);
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
		
	}

	
	isEqualCard(c1, c2) {
		if ( c1.index != c2.index ) return false;
//		if ( c1.color != c2.color ) return false;
		return true;
		
	}
	
	onStateUpdate(msg) {
		console.log("state update ");
		this.tileLen= msg.pile.length;
		/* scan field for recepved pile*/
		for(var i = 0; i < gameOptions.fieldSizeY; i++){
			for(var j = 0; j < gameOptions.fieldSizeX; j++){
				if (this.fieldArray[i][j].tileChip != undefined ) {
					/* on every place check if there are chip in pile*/
					for(var k=0; k<msg.pile.length; k++) {
						if ( this.isEqualCard(this.fieldArray[i][j].tileChip , msg.pile[k])) {
							break;
						}
					}
					if ( k < msg.pile.length)  {
						/* if chip found, leave chip on place */ 
						/* and remove it from msg pile  */
						msg.pile.splice(k, 1);
					} else {
						/* otherwise clear place */
						this.clearPlace(this.fieldArray[i][j]);
					}
				}
			}
		}
		/* now in msg pile is non placed chips */
		for(var k=0; k<msg.pile.length; k++) {
			if ( (msg.taked != undefined) && 
			     ( this.isEqualCard(msg.taked , msg.pile[k]))) {
					 /* don't place taked chip*/
//				this.takedPlace.tileChip = msg.taked;
			} else {
				var empty_place = this.findEmptyPlace();
				if ( empty_place != undefined ) {
					this.showPlace(empty_place, msg.pile[k]);
				}
			}
		}
		if ( msg.taked != undefined) {
			this.showPlace(this.takedPlace, msg.taked);
		}

		var i = Math.floor(this.cursor / gameOptions.fieldSizeX);
		var j = this.cursor % gameOptions.fieldSizeX;
		var f =this.fieldArray[i][j];
		f.tilePlaceholder.lineStyle(12,gameOptions.cursorColor);
	    f.tilePlaceholder.strokeRectShape(f.tileRect);
		this.pointerIsMy = true;
		this.cursorPointer.setVisible(true);

	}

	getCursorPlace() { 
		var i = Math.floor(this.cursor / gameOptions.fieldSizeX);
		var j = this.cursor % gameOptions.fieldSizeX;
		return this.fieldArray[i][j];
	}
	
	onSetHostId(id) {
		this.host_id = id;
	}
	
	setCursor(pos) {
		var i = Math.floor(this.cursor / gameOptions.fieldSizeX);
		var j = this.cursor % gameOptions.fieldSizeX;
		var f =this.fieldArray[i][j];
	    f.tilePlaceholder.clear();
		f.tilePlaceholder.lineStyle(2,gameOptions.gridColor);
	    f.tilePlaceholder.strokeRectShape(f.tileRect);
		i = Math.floor(pos / gameOptions.fieldSizeX);
		j = pos % gameOptions.fieldSizeX;
		f =this.fieldArray[i][j];
	    f.tilePlaceholder.clear();
		f.tilePlaceholder.lineStyle(12,gameOptions.cursorColor);
	    f.tilePlaceholder.strokeRectShape(f.tileRect);
		this.cursor = pos;
	}
	
	onCursorMove( toLeft ) {
		if ( toLeft ) {
			if (this.cursor > 0) setCursor(this.cursor -1 );
		} else {
			if (this.cursor < gameOptions.fieldSizeX*gameOptions.fieldSizeY) setCursor(this.cursor + 1 );
		}
	}
}

var gameConfig = {
       type: Phaser.CANVAS, 
       width: (gameOptions.tileSizeX +12) * gameOptions.fieldSizeX,
       height: (gameOptions.tileSizeY +12) * gameOptions.fieldSizeY ,
       backgroundColor: 0xFFFFFF, // 0x444444,
	   parent: "phaser",
       scene: RcField
};

var rcgame;

function start_game() {
 rcgame = new Phaser.Game( gameConfig);
		console.log("Game ");
}


function resize() {
		console.log("resize ");
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight-100;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = rcgame.config.width / rcgame.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}


