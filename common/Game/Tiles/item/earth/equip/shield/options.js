/**
 * Equipment - Shield
 */
exports.options = require('../../../../TileTypes.js').TileType.Item({
    generator : ['Equipment'],
    cost : [25,75,30],
    type : ['shield'],
    shield : {
	block : [1,100,1]
    }
});