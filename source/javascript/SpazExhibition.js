enyo.kind({
	name: "SpazExhibition",
	kind: enyo.HFlexBox,
	components: [
		{kind: enyo.ApplicationEvents, //onApplicationRelaunch: "relaunchHandler",
			onWindowActivated:"windowActivated", onWindowDeactivated:"windowDeactivated",
			onUnload:"unloaded"},
	    {name: "slider", kind: ekl.Layout.SlidingPane, flex: 1, dismissDistance: 100, onDismiss: "hideDetailPane", style:"background:#000", components: [
	        {name: "main", layoutKind: enyo.HFlexLayout, flex: 1, components: [
	            {
        			name: "sidebar",
        			kind: "Spaz.Sidebar",
        			onRefreshAll: "refreshAll",
        			onCreateColumn: "createColumn",
        			onAccountAdded: "accountAdded",
        			onAccountRemoved: "accountRemoved"
        		},
        		{
        			name: "container",
        			kind: "Spaz.Container",
        			onRefreshAllFinished: "refreshAllFinished",
        			onShowAccountsPopup: "showAccountsPopup"
        		}
	        ]},

	        {name: "detail", layoutKind: enyo.VFlexLayout, nodragleft: true, fixedWidth: true, width: "322px", dismissible: true, showing: false, components: [
                {name: "detailContent", kind: enyo.Pane, transitionKind: "enyo.transitions.Fade", flex: 1}
            ]}
	    ]},

		{
			name: "imageViewPopup",
			kind: "Spaz.ImageViewPopup",
			onClose: "closeImageView"
		},
		{name: "dashboard", kind:"Dashboard", onTap: "dashboardTap", onIconTap: "iconTap", onMessageTap: "messageTap",
					onUserClose: "dashboardClose", onLayerSwipe: "layerSwiped", appId: null},
		{name: "deleteEntryPopup", kind: "enyo.Popup", scrim : true, components: [
			{content: enyo._$L("Delete Entry?")},
			{style: "height: 10px;"},
			{kind: "enyo.HFlexBox", components: [
				{kind: "enyo.Button", caption: enyo._$L("Cancel"), flex: 1, onclick: "cancelEntryDeletion"},
				{kind: "enyo.Button", className: "enyo-button-negative", caption: enyo._$L("Delete"), flex: 1, onclick: "confirmEntryDeletion"}
			]}
		]},
		{name : "versionService", kind : "enyo.WebService", url: "http://getspaz.com/feeds/spazhd"}
	],

	isRendered: false,
	onRendered: [], // functions we will execute once everything is rendered
	dashWin: null,

	twit: new SpazTwit(),

	windowParamsChangeHandler: function(inParams) {
		AppUtils.showBanner('windowParamsChangeHandler: '+JSON.stringify(enyo.windowParams));
		AppUtils.showBanner('windowParamsChangeHandler inParams: '+JSON.stringify(inParams));

    	// capture any parameters associated with this app instance
    	var params = enyo.windowParams;
	},

	// called when app is opened or reopened
    relaunchHandler: function() {
    	this.processLaunchParams(enyo.windowParams);
		this.$.dashboard.setLayers([]); // empty the notifications
    },

	windowActivated: function() {
		this.windowActive = true;
		this.$.dashboard.setLayers([]); // empty the notifications
	},

	windowDeactivated: function() {
		this.windowActive = false;
	},

	// the window is closed
	unloaded: function() {
		this.$.dashboard.setLayers([]);
	},

	processLaunchParams: function(inParams) {
		/*
			for compatibility with Bad Kitty and Twee APIs
		*/
		if (inParams.tweet) {
			inParams.action = 'prepPost';
			inParams.msg = inParams.tweet;
		}
		if (inParams.user) {
			inParams.action = 'user';
			inParams.userid = inParams.user;
		}

		if (!inParams.account) {
			var acc_id = this.getLaunchParamsAccount(inParams);
			if (acc_id) {
				inParams.account = acc_id;
			}
		}

		enyo.log(JSON.stringify(inParams));

		switch(inParams.action) {

			/**
			 * {
			 *   action:"prepPost",
			 *   msg:"Some Text",
			 *   account:"ACCOUNT_HASH" // optional
			 * }
			 */
			case 'prepPost':
			case 'post':

				var postfunc = _.bind(function() {
					AppUI.compose(inParams.msg, inParams.account);
				}, this);

				if (this.isRendered === false) {
					this.onRendered.push(postfunc);
				} else {
					postfunc();
				}
				break;

			// /**
			//  * {
			//  *   action:"user",
			//  *   userid:"funkatron"
			//  * }
			//  */
			// case 'user':
			// 	// appAssistant.loadAccount(inParams.account||null);
			// 	// stageController.pushScene('user-detail', '@'+inParams.userid);
			// 	break;

			/**
			 * {
			 *   action:"search",
			 *   account:"ACCOUNT_HASH",
			 *   query:"spaz source:spaz"
			 * }
			 */
			case 'search':
				var searchfunc = _.bind(function() {
					AppUI.search(decodeURI(inParams.query), inParams.account);
				}, this);

				if (this.isRendered === false) {
					this.onRendered.push(searchfunc);
				} else {
					searchfunc();
				}
				break;

			// /**
			//  * {
			//  *   action:"status",
			//  *   statusid:24426249322
			//  * }
			//  */
			// case 'status':
			// 	// stageController.pushScene('message-detail', inParams.statusid);
			// 	break;

			//
			// case "tweetNowPlaying":
			// 	// if(inParams.returnValue === true){
			// 	// 	var tweet = "#NowPlaying " + inParams.nowPlaying.title
			// 	// 	if(inParams.nowPlaying.artist !== ""){
			// 	// 		tweet += " by " + inParams.nowPlaying.artist;
			// 	// 	}
			// 	// 	if (tweet.length > 112){
			// 	// 		tweet = tweet.truncate(112, ' [...]');//truncate is a prototype function
			// 	// 	}
			// 	//
			// 	// 	var suffix = " on @Koto_Player, via @Spaz";
			// 	// 	stageController.sendEventToCommanders({'type':Mojo.Event.command, 'command':'addTextToPost', text: tweet + suffix});
			// 	// } else {
			// 	// 	//Mojo.Controller.getAppController().getStageController(SPAZ_MAIN_STAGENAME).activeScene().showBanner("Not Playing Anything");
			// 	// 	//banner error?
			// 	// 	Mojo.Log.error("not playing anything");
			// 	// }
			// 	break;
			case 'bgcheck':

				var refreshfunc = _.bind(function() {
					AppUI.refresh();
				}, this);

				if (this.isRendered === false) {
					this.onRendered.push(refreshfunc);
				} else {
					refreshfunc();
				}
				break;
			case 'relaunch':
				// should have "from" param, we will parse in future
				break;
		}
	},

	getLaunchParamsAccount: function(inParams) {
		// what user do we use to process action?
		if (!inParams.account) {
			var rs;
			if (inParams.username && inParams.service) {
				rs = App.Users.getByUsernameAndType(inParams.username, inParams.service)[0];
			} else if (inParams.username) {
				rs = App.Users.getByUsername(inParams.username)[0];
			} else if (inParams.service) {
				rs = App.Users.getByType(inParams.service)[0];
			} else {
				rs = App.Users.getAll()[0];
			}

			if (rs) {
				return rs.id;
			} else {
				return null;
			}

		} else {
			return inParams.account;
		}

	},


	initAppObject: function(prefsLoadedCallback) {
		/**
		 * initialize the App object
		 */
		window.App = {};

		var self = this;

		/*
			Remap JSON parser because JSON2.js one was causing probs with unicode
		*/
		sc.helpers.deJSON = function(str) {
			try {
				var obj = JSON.parse(str);
				return obj;
			} catch(e) {
				console.error('There was a problem decoding the JSON string');
				console.error('Here is the JSON string: '+str);
				return null;
			}

		};
		sc.helpers.enJSON = function(obj) {
			var json = JSON.stringify(obj);
			return json;
		};


		// App.search_cards = [];
		// App.new_search_card = 0;
		// App.search_card_prefix = "searchcard_";

		if (SPAZCORE_CONSUMERKEY_TWITTER) {
			SpazAuth.addService(SPAZCORE_ACCOUNT_TWITTER, {
				authType: SPAZCORE_AUTHTYPE_OAUTH,
				consumerKey: SPAZCORE_CONSUMERKEY_TWITTER,
				consumerSecret: SPAZCORE_CONSUMERSECRET_TWITTER,
				accessURL: 'https://twitter.com/oauth/access_token'
		    });
		} else {
			console.error('SPAZCORE_CONSUMERKEY_TWITTER not set, will not be able to authenticate against Twitter');
		}

		App.Prefs = null;

		/*
			load our prefs
			default_preferences is from default_preferences.js, loaded in index.html
		*/
		App.Prefs = new SpazPrefs(SPAZ_DEFAULT_PREFS, null, {
			'network-refreshinterval' : {
				'onGet': function(key, value) {
					if (value < 0) {
						value = 0;
					}
					sch.debug(key + ':' + value);
					return value;
				},
				'onSet': function(key, value) {
					if (value < 0) {
						value = 0;
					}
					sch.debug(key + ':' + value);
					return value;
				}
			}
		});
		App.Prefs.load(function() {
			App.Users = new SpazAccounts(App.Prefs);
			prefsLoadedCallback();
		});


		// /*
		// 	model for saving Tweets to Depot. We replace on every start to make sure we don't go over-budget
		// */
		// App.Tweets = new Tweets({
		// 	'replace':false,
		// 	'prefs_obj':this.App.Prefs
		// });

		// App.master_timeline_model = {
		//     items : []
		// };

		// if (!App.cache) {
		// 	App.cache = new TempCache({
		// 		'appObj':this.App
		// 	});
		// }


		// App.versionCookie = new VersionCookie(this.App.Prefs);
		// App.versionCookie.init();

		this.initAppCache();

	},

	/**
	 * this binds DOM event listeners
	 * used throughout the app
	 */
	bindGlobalListeners: function() {


		$('a[href]').live('click', function(e) {
			sc.helpers.openInBrowser(this.getAttribute('href'));
			event.preventDefault();
			return false;
		});

		// $('span.username.clickable').live('click', function(e) {
		//
		// });

	},

	create: function(){
		var self = this
		  , inheritedArgs = arguments;

		// this lets the popups positon properly when keyboard shows
		enyo.keyboard.setResizesWindow(false);

		// init window.App
		self.initAppObject(function() {
		    self.inherited(inheritedArgs);
		});

		self.bindGlobalListeners();

		AppUI.addFunction("viewUser", function(inUsername, inService, inAccountId, inColumnIndex){
			this.showUserView(this, inUsername, inService, inAccountId, inColumnIndex);
		}, this);
		AppUI.addFunction("viewEntry", function(inEntry){
			this.showEntryView(this, inEntry);
		}, this);
		AppUI.addFunction("compose", function(inText, inAccountId){
			this.compose(this, inText, inAccountId);
		}, this);
		AppUI.addFunction("reply", function(inEntry){
			this.reply(this, inEntry);
		}, this);
		AppUI.addFunction("repost", function(inEntry){
			this.repost(this, inEntry);
		}, this);
		AppUI.addFunction("repostManual", function(inEntry){
			this.repostManual(this, inEntry);
		}, this);
		AppUI.addFunction("directMessage", function(inUsername, inAccountId){
			this.directMessage(this, inUsername, inAccountId);
		}, this);
		AppUI.addFunction("confirmDeleteEntry", function(inEntry) {
			this.confirmDeleteEntry(this, inEntry);
		}, this);
		AppUI.addFunction("deleteEntry", function(inEntry) {
			this.deleteEntry(this, inEntry);
		}, this);


		// Refresher methods
		AppUI.addFunction("startAutoRefresher", function() {
			if (App.Prefs.get('network-refreshinterval') > 0) {
				enyo.log('Starting auto-refresher', App.Prefs.get('network-refreshinterval'));
				App._refresher = setInterval(function() {
					enyo.log("Auto-refreshing");
					AppUI.refresh();
				}, App.Prefs.get('network-refreshinterval'));
			}
		}, this);
		AppUI.addFunction("stopAutoRefresher", function() {
			enyo.log("Clearing auto-refresher");
			clearInterval(App._refresher);
		}, this);
		AppUI.addFunction("restartAutoRefresher", function() {
			enyo.log("Restarting auto-refresher");
			AppUI.stopAutoRefresher();
			AppUI.startAutoRefresher();
		}, this);

		// start the auto-refresher
		AppUI.startAutoRefresher();

		this.processLaunchParams(enyo.windowParams);

		this.$.dashboard.appId = enyo.fetchAppInfo().id;

		enyo.asyncMethod(this, this.sendVersionInfo);

		AppUtils.showTestBuildWarning();
	},

	showDetailPane: function() {

        if (!this.$.detail.showing) {
    	    this.$.slider.selectViewByName("main");
    	    this.$.detail.setShowing(true);
        }
	},

	hideDetailPane: function() {
		console.log("hiding detail pane");
		this.$.slider.selectViewByName("main");
		this.$.detail.setShowing(false);
		this.viewEvents = [];
		enyo.asyncMethod(this.$.container, "reclaimSpace");
	},

	// do some stuff after the components are rendered
	rendered: function() {
		this.inherited(arguments);
		if (this.onRendered.length > 0) {
			for (var i=0; i < this.onRendered.length; i++) {
				this.onRendered[i].call();
			}
			this.onRendered = []; // clear each
		}
		this.isRendered = true; // so we don't try to bind stuff to onRendered again
	},


	showEntryView: function(inSender, inEntry){
		var entryName = 'entry-' + inEntry.spaz_id;

		if (!this.$.detailContent.validateView(entryName)) {
			this.$.detailContent.createComponent({
				name: entryName,
				kind: "Spaz.EntryView",
				onDestroy: "hideDetailPane" ,
				onGoPreviousViewEvent: "goPreviousViewEvent",
				onGetViewEvents: "getViewEvents",
				onShowImageView: "showImageView"
			}, {owner: this});
			this.$[entryName].render();

			//this.$.container.refreshList();
		}

		var topEvent,
			newEvent = {type: (inEntry.is_private_message === true) ? "message" : "entry", entry: inEntry},
			dontPush = false;

		if( (topEvent = this.viewEvents[this.viewEvents.length-1]) ){
			if(topEvent.type === "entry" && topEvent.entry.service_id === newEvent.entry.service_id){
				dontPush = true;
			}
		}
		if(!dontPush){
			this.viewEvents.push(newEvent);
		}
		this.$[entryName].setEntry(inEntry);

    	this.$.detailContent.selectViewByName(entryName);

    	this.showDetailPane();
	    //this.$.detail.setShowing(true);

	    if(inEntry.columnIndex){
			var controls = this.$.container.$.columnsScroller.getControls();
			for(var i = 0; i < controls.length; i++){
				if(controls[i].name === "Column" + inEntry.columnIndex){
					this.$.container.$.columnsScroller.snapTo(i);
						//.next() looks better than snapTo, but we can't use it because if we are viewing an entry from the first column in view, it will hide it.
					break;
				}
			}
		}

	},

	showUserView: function(inSender, inUsername, inService, inAccountId, inColumnIndex) {
		var userId = 'user-' + inUsername + '-' + inService + '-' + inAccountId;

		if (!this.$.detailContent.validateView(userId)) {
			this.$.detailContent.createComponent({
				name: userId,
				kind: "Spaz.UserView",
				onDestroy: "hideDetailPane",
				onGoPreviousViewEvent: "goPreviousViewEvent",
				onGetViewEvents: "getViewEvents"

			}, {owner: this});
			this.$[userId].render();

			//this.$.container.refreshList();
		}
		var topEvent,
			newEvent = {type: "user", user: {username: inUsername, type: inService, account_id: inAccountId}},
			dontPush = false;

		if( (topEvent = this.viewEvents[this.viewEvents.length-1]) ){
			if(topEvent.type === "user" && topEvent.user.username === newEvent.user.username){
				dontPush = true;
			}
		}
		if(!dontPush){
			this.viewEvents.push(newEvent);
		}
    	this.$[userId].showUser(inUsername, inService, inAccountId);

    	this.$.detailContent.selectViewByName(userId);

    	this.showDetailPane();

    	if(inColumnIndex){
			var controls = this.$.container.$.columnsScroller.getControls(),
				offset = 0;
			for(var i = 0; i < controls.length; i++){
				if(controls[i].name === "Column" + inColumnIndex && controls[i].hasNode()){
					this.$.container.$.columnsScroller.snapTo(i + offset);
					break;
				} else if (!controls[i].hasNode()){
					offset--;
				}
			}
		}

	},
	viewEvents: [],
	goPreviousViewEvent: function(inSender){
		this.viewEvents.pop(); //get rid of top level we are leaving
		var event = this.viewEvents[this.viewEvents.length-1];
		switch(event.type){
			case "user":
				AppUI.viewUser(event.user.username, event.user.type, event.user.account_id);
				break;
			case "entry":
			case "message":
				AppUI.viewEntry(event.entry);
				break;
		}
	},
	getViewEvents: function(){
		return this.viewEvents;
	},
	createColumn: function(inSender, inObj){
		this.$.container.createColumn(inObj);
	},

	refreshAll: function(inSender, account_id) {
		this.$.container.refreshAll(account_id);
	},

	refreshAllFinished: function() {
		this.$.sidebar.refreshAllFinished();
	},

	// To keep the reply/dm logic in one place, components only pass up
	// onReply events, and we'll figure out here whether that should be
	// handled as a reply or as a dm.
	compose: function (inSender, inText, inAccountId) {
		this.$.sidebar.compose({
			'text':inText,
			'account_id':inAccountId
		});
	},
	reply: function(inSender, inEntry) {
		if (inEntry.is_private_message) {
			this.$.sidebar.directMessage({
				'to':inEntry.author_username,
				'text':null,
				'entry':inEntry,
				'account_id':inEntry.account_id
			});
		} else {
			this.$.sidebar.replyTo({
				'entry':inEntry,
				'account_id':inEntry.account_id
			});
		}
	},
	repost: function(inSender, inEntry) {
		if (inEntry.is_private_message) {
			AppUtils.showBanner("Private messages cannot be reposted");
		} else {
			this.$.sidebar.repost({
				'entry':inEntry,
				'account_id':inEntry.account_id
			});
		}
	},
	repostManual: function(inSender, inEntry) {
		if (inEntry.is_private_message) {
			AppUtils.showBanner("Private messages cannot be reposted");
		} else {
			this.$.sidebar.repostManual({
				'entry':inEntry,
				'account_id':inEntry.account_id
			});
		}
	},
	mention: function(inSender, inEntry) {

	},
	directMessage: function(inSender, inUsername, inAccountId) {
		this.$.sidebar.directMessage({
			'to':inUsername,
			'text':null,
			'account_id':inAccountId
		});
	},
	deleteEntry: function(inSender, inEntry) {
		//@TODO: should we confirm?
		var account = App.Users.get(inEntry.account_id);
		var auth = new SpazAuth(account.type);
		auth.load(account.auth);

		var twit = new SpazTwit();
		twit.setBaseURLByService(account.type);
		twit.setSource(App.Prefs.get('twitter-source'));
		twit.setCredentials(auth);

		if(inEntry.is_private_message) {
			twit.destroyDirectMessage(inEntry.service_id,
				enyo.bind(this, function(data) {
					AppUI.removeEntryById(inEntry.service_id);
					AppUtils.showBanner(enyo._$L("Deleted message"));
				}),
				enyo.bind(this, function() {
					AppUtils.showBanner(enyo._$L("Error deleting message"));
				})
			);
		}
		else if(inEntry.is_author) {
			twit.destroy(inEntry.service_id,
				enyo.bind(this, function(data) {
					AppUI.removeEntryById(inEntry.service_id);
					AppUtils.showBanner(enyo._$L("Deleted entry"));
				}),
				enyo.bind(this, function() {
					AppUtils.showBanner(enyo._$L("Error deleting entry"));
				})
			);
		}
	},
	showImageView: function(inSender, inUrls, inIndex) {
		this.$.imageViewPopup.openAtCenter();
		this.$.imageViewPopup.setImages(inUrls, inIndex);
	},
	closeImageView: function(inSender) {
		this.$.imageViewPopup.close();
	},
	accountAdded: function(inSender, inAccountId) {
		this.$.container.accountAdded(inAccountId);
	},
	accountRemoved: function(inSender, inAccountId) {
		this.$.container.checkAccountChanges(inAccountId);
	},
	showAccountsPopup: function(inSender) {
		this.$.sidebar.showAccountsPopup();
	},

	dashboardTap: function(inSender, layer) {
		AppUtils.relaunch('dashboard', this.$.dashboard.appInfo);
	},
	messageTap: function(inSender, layer) {
		enyo.log("Tapped on message: "+layer.text);
	},
	iconTap: function(inSender, layer) {
		enyo.log("Tapped on icon for message: "+layer.text);
	},
	dashboardClose: function(inSender) {
		enyo.log("Closed dashboard.");
	},
	layerSwiped: function(inSender, layer) {
		enyo.log("Swiped layer: "+layer.text);
	},


	pushDashboard: function(inIcon, inTitle, inText) {
		this.dashWin = this.$.dashboard.push({icon:inIcon, title:inTitle, text:inText});
	},
	popDashboard: function() {
		this.$.dashboard.pop();
	},
	confirmDeleteEntry: function(inSender, inEntry) {
		this.entryToDelete = inEntry;
		this.$.deleteEntryPopup.openAtCenter();
	},
	cancelEntryDeletion: function(inSender) {
		this.$.deleteEntryPopup.close();
		this.entryToDelete = null;
	},
	confirmEntryDeletion: function(inSender) {
		this.$.deleteEntryPopup.close();
		if (this.entryToDelete) {
			AppUI.deleteEntry(this.entryToDelete);
			this.entryToDelete = null;
		}
	},
	sendVersionInfo: function() {
		this.$.versionService.call({
			platform: sch.getPlatform(),
			appVersion: enyo.fetchAppInfo().version
		});
	},
	initAppCache: function() {
		App.Cache = {
			'EntriesHTML' : new Cache(750)
		}
	}
});
