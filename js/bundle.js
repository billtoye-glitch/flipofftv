class Tile {
    constructor(value) {
        this.value = value;
    }
}

class SoundEngine {
    playSound(sound) {
        console.log(`Playing sound: ${sound}`);
    }
}

class Board {
    constructor() {
        this.tiles = [];
    }
    
    addTile(tile) {
        this.tiles.push(tile);
    }
}

const MESSAGES = {
    SALVADOR_DALI: ["Time is a fluid construction of the mind.", ""]
};