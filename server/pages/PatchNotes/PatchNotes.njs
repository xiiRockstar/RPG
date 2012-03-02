/*
 * #PatchNotes page
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require("../pageBase.njs")
    );

RPG.pagePatchNotes =  new Class({
    Extends : RPG.PageBaseClass,
    pageContents : {}, /*Object to hold all the contents of this page*/
    options : {

    },
    initialize : function(options) {
	this.parent(options);

	/**
	 * Default object that will be modified by each request.
	 * Take care when modifying the default pageContents as it is served to all users.
	 * Instead, clone the object for the current user and modify the clone.
	 */
	this.pageContents = {
	    heading : {
		'h1#homeHeader' : {
		    'class' : 'textCenter',
		    html : 'Current Patch Notes'
		}
	    }
	};
    },
    /**
     * Overrides onRequest
     */
    onRequest : function(request,response) {
	/**
	 * Clone the default pageContents for modification
	 */
	var clone = Object.clone(this.pageContents);

	/**
	 * Modify the Clone
	 */
	var all = false;
	if (request.url && request.url.query && request.url.query.all) {
	    all = true;
	    clone.heading['h1#homeHeader'].html = 'All Patch Notes'
	}


	/**
	 * Finally Call the parent classes onRequest
	 * which wraps the contents in a page object
	 */
	response.onRequestComplete(response,this._onRequest(request,{
	    title : (all?'All Patch Notes':'Current Patch Notes'),
	    populates : 'pnlMainContent',
	    requires : {
		//'css' : ['home.css'],
		'js' : ['/client/pages/PatchNotes/PatchNotes.js'],
		exports :'pagePatchNotes'
	    },
	    pageContents : clone
	}));
    }
});