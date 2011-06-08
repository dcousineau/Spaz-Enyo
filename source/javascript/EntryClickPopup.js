enyo.kind({
	name: "Spaz.EntryClickPopup",
	kind: "Popup",
	components: [
		// menu contents are built up dynamically in showAtEvent()
		{name: "menu", kind: "enyo.Menu"}
	],
	create: function(){
		this.inherited(arguments);
		this.entry = null;
	},
	detailsClicked: function(inSender) {
		AppUI.viewEntry(this.entry);
	},
	replyClicked: function(inSender) {
		AppUI.reply(this.entry);
	},
	favoriteClicked: function(inSender) {
		var account = App.Users.get(this.entry.account_id);
		var auth = new SpazAuth(account.type);
		auth.load(account.auth);
			
		var twit =new SpazTwit();
		twit.setBaseURLByService(account.type);
		twit.setSource(App.Prefs.get('twitter-source'));
		twit.setCredentials(auth);
			
		if (this.entry.is_favorite) {
			console.log('UNFAVORITING %j', this.entry);
			twit.unfavorite(
				this.entry.service_id,
				enyo.bind(this, function(data) {
					this.entry.is_favorite = false;
					AppUtils.showBanner($L('Removed favorite'));
					AppUI.rerenderTimelines();
				}),
				function(xhr, msg, exc) {
					AppUtils.showBanner($L('Error removing favorite'));
				}
			);
		} else {
			console.log('FAVORITING %j', this.entry);
			twit.favorite(
				this.entry.service_id,
				enyo.bind(this, function(data) {
					this.entry.is_favorite = true;
					AppUtils.showBanner($L('Added favorite'));
					AppUI.rerenderTimelines();
					
				}),
				function(xhr, msg, exc) {
					AppUtils.showBanner($L('Error adding favorite'));
				}
			);
		}
	},
	repostClicked: function(inSender) {
		AppUI.repost(this.entry);
	},
	editRepostClicked: function(inSender) {
		AppUI.repostManual(this.entry);
	},
	emailClicked: function(inSender) {
		AppUtils.emailTweet(this.entry);
	},
	smsClicked: function(inSender) {
	},
	clipboardClicked: function(inSender) {
	},
	showAtEvent: function(inEntry, inEvent){
		if(this.lazy) {
			this.validateComponents();
		}
		this.entry = inEntry;
		
		enyo.forEach (this.$.menu.getControls(), function (control) {
			 control.destroy();
		});
		this.$.menu.openAtEvent(inEvent);
				
		var components = [
			{caption: "Details", onclick: "detailsClicked"},
			{caption: "Reply", onclick: "replyClicked"}
		];
		
		if(this.entry.is_favorite){
			components.push({caption: "Unfavorite", onclick: "favoriteClicked"});
		} else if(!this.entry.is_private_message){
			components.push({caption: "Favorite", onclick: "favoriteClicked"});
		}
		
		components.push({caption: "Share", onclick: "shareClicked", components: [
			{caption: "Repost", onclick: "repostClicked"},
			{caption: "Edit & Repost", onclick: "editRepostClicked"},
			{caption: "Email", onclick: "emailClicked"},
			{caption: "SMS/IM", onclick: "smsClicked"},
			{caption: "Copy To Clipboard", onclick: "clipboardClicked"}
		]});
		
		this.$.menu.createComponents(components, {owner:this});
		this.$.menu.render();
	}
});
