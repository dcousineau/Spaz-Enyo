enyo.kind({
	name: "Spaz.Container",
	flex: 1,
	kind: "Control",
	height: "100%",
	events: {
		onShowEntryView: "",
		onRefreshAllFinished: ""
	},
	components: [
		{name:"columnsScroller", kind: "SnapScroller", flex: 1, vertical: false, autoVertical: false, style: "background-color: black; padding: 2px;" , components:[
			{kind: "ScrollFades"}
		]},
		{name: "confirmPopup", kind: "enyo.Popup", scrim : true, components: [
			{content: enyo._$L("Delete Column?")},
			{style: "height: 10px;"},
			{kind: "enyo.HFlexBox", components: [
				{kind: "enyo.Button", caption: enyo._$L("Cancel"), flex: 1, onclick: "cancelColumnDeletion"},
				{kind: "enyo.Button", className: "enyo-button-negative", caption: enyo._$L("Delete"), flex: 1, onclick: "confirmColumnDeletion"}
			]}
		]}
	],
	create: function(){
		this.inherited(arguments);
		this.loadingColumns = 0;
		this.columnData = []; 		// we should load this from prefs
		this.createColumns();
	},
	createColumns: function() {
		this.columnsFunction("destroy"); //destroy them all. don't want to always do this.
		var firstAccount = App.Users.getAll()[0];

		if (!firstAccount || !firstAccount.id) {
			alert('no accounts! you should add one');
			return;
		}
		if(this.columnData.length === 0){
			this.columnData.push(
				{type: SPAZ_COLUMN_HOME, accounts: [firstAccount.id]},
				{type: SPAZ_COLUMN_MENTIONS, accounts: [firstAccount.id]},
				// {type: "dms", display: "Messages", accounts: [App.Users.getAll()[0].id]},
				{type: SPAZ_COLUMN_SEARCH, query: 'webos', accounts: [firstAccount.id]},
				{type: SPAZ_COLUMN_SEARCH, query: 'spaz', accounts: [firstAccount.id]}
			)
		}
		var cols = [];

		for (var i = this.columnData.length - 1; i >= 0; i--) {
			var col = {
				name:'Column'+i,
				info: this.columnData[i],
				kind: "Spaz.Column",
				onShowEntryView: "doShowEntryView",
				onDeleteClicked: "deleteColumn",
				onLoadStarted: "loadStarted",
				onLoadFinished: "loadFinished",
				owner: this //@TODO there is an issue here with scope. when we create kinds like this dynamically, the event handlers passed is the scope `this.$.columnsScroller` rather than `this` which is what we want in this case since `doShowEntryView` belongs to `this`. It won't be a big deal here, because if we need the column kinds, we can call this.getComponents() and filter out the scroller itself.
			}; 
			if(col.info.type === "search"){
				col.kind = "Spaz.SearchColumn";
			}
			cols.push(col);
		};
		this.$.columnsScroller.createComponents(cols.reverse());
		setTimeout(enyo.bind(this, this.refreshAll), 1);
	},
	createColumn: function(inAccountId, inColumn){
		this.columnData.push({type: inColumn, accounts: [inAccountId]});
		this.createColumns();
	},
	deleteColumn: function(inSender) {
		this.columnToDelete = inSender;
		this.$.confirmPopup.openAtCenter();
	},
	cancelColumnDeletion: function(inSender) {
		this.$.confirmPopup.close();
		this.columnToDelete = null;
	},
	confirmColumnDeletion: function(inSender) {
		this.$.confirmPopup.close();
		if (this.columnToDelete) {
			//@TODO: remove it from App.Prefs
			this.columnToDelete.destroy();
			this.columnToDelete = null;
            this.$.columnsScroller.resizeHandler();
		}
	},
	columnsFunction: function(functionName, opts){
		_.each(this.getComponents(), function(column){
			try {
				if(column.kind === "Spaz.Column" || column.kind === "Spaz.SearchColumn"){
					this.$[column.name][functionName]()				
				}
			} 
			catch (e) {
				console.error(e);
			}
		}, this);
	},

	resizeHandler: function() {
		this.columnsFunction("resizeHandler");
	},
	
	refreshAll: function() {
		this.loadingColumns = 0;
		this.columnsFunction("loadNewer");
	},
	
	loadStarted: function() {
		this.loadingColumns++;
	},
	
	loadFinished: function() {
		this.loadingColumns--;
		if (this.loadingColumns <= 0) {
			this.doRefreshAllFinished();
		}
	}
});
