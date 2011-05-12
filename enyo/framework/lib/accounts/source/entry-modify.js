/* Copyright 2009-2011 Hewlett-Packard Development Company, L.P. All rights reserved. */
// This provides UI to edit an account.  These fields are provided:
// 1. Account Name
// 2. Email address (field name can be overwritten by loc_usernameLabel in the account template)
// 3. Password (field name can be overwritten by loc_passwordLabel in the account template)
// 4. "Sign In" button
// 5. "Remove Account" button
// 6. Custom app chrome (can be used to add additional fields to the bottom of the view)
//
// When this view is done the onAccountsUI_Done event will be sent to the calling app
//
// Usage:
// ======
//
// Depends:
// Add this line to your app's depends.js file:
// "$enyo-lib/accounts/"
//
// Kind:
// {kind: "AccountsModify", name: "AccountsModify", capability: "CONTACTS", onAccountsModify_Done: "accountsDone"}
// You can add custom components to the view that will appear between the "Remove Account" and "Back" buttons, like this:
// {kind: "AccountsModify", name: "AccountsModify", capability: "CONTACTS", onAccountsModify_Done: "accountsDone", components: [{kind:"Button", label:"Additional prefs"}]},
//
// Initialise the view:
// this.$.AccountsModify.ModifyAccount(account, template, capability) // template is optional; the template information is included in the account
//
// The callback:
// onAccountsUI_Done: function() {
//		this.$.pane.selectViewByName("prefsAndAccounts");

enyo.kind({
	name: "AccountsModify",
	kind: "Pane",
	published: {
		capability:"",
	},
	events: {
		onAccountsModify_Done: ""
	},
	className:"accounts-modify",
	components: [
		{},		// Empty view so that nothing is shown when switching to the Credentials view from a "bad credentials" dashboard
		{name: "accountModificationFromPIMApp", kind: "VFlexBox", className:"enyo-bg", components: [
			{kind:"Toolbar", className:"enyo-toolbar-light accounts-header", pack:"center", components: [
				{kind: "Image", src: AccountsUtil.libPath + "images/acounts-48x48.png"},
		        {content: AccountsUtil.PAGE_TITLE_ACCOUNT_SETTINGS, className:""}
			]},
			{className:"accounts-header-shadow"},
			{kind: "Scroller", flex: 1, components: [
				{kind: "Control", className:"box-center", components: [
					{kind: "RowGroup", caption: AccountsUtil.GROUP_TITLE_ACCOUNT_NAME, className:"accounts-group", components: [
						{kind: "Input", name: "accountName", spellcheck: false, autocorrect:false}
					]},
					{kind: "Accounts.credentials", name: "credentials", onCredentials_ValidationSuccess: "saveAccountCredentials"},
					{kind: "ActivityButton", name: "removeAccountButton", label: AccountsUtil.BUTTON_REMOVE_ACCOUNT, className: "enyo-button-negative accounts-btn", onclick: "confirmAccountRemoval"}
				]}
			]},
			{name: "removeConfirmDialog", kind: "ModalDialog", caption: AccountsUtil.BUTTON_REMOVE_ACCOUNT, modal: true, scrim: true, components: [
				{content: AccountsUtil.TEXT_REMOVE_CONFIRM, className:"enyo-paragraph"},
				{kind:"HFlexBox", components:[
					{kind: "Button", caption: AccountsUtil.BUTTON_KEEP_ACCOUNT, id:"button-entrymodify-keep", flex:0.8, className:"enyo-button-light", onclick: "keepAccount"},
					{kind: "Button", caption: AccountsUtil.BUTTON_REMOVE_ACCOUNT, id:"button-entrymodify-remove", flex:1, className: "enyo-button-negative", onclick: "removeAccount"}
				]}
			]},
			{name: "client"},
			// {name: "Spacer", flex:1},
			{className:"accounts-footer-shadow"},
			{kind:"Toolbar", className:"enyo-toolbar-light", components:[
				{kind: "Button", label: AccountsUtil.BUTTON_BACK, className:"accounts-toolbar-btn", onclick: "saveAccountName"}
			]},
			
			{name: "modifyAccount", kind: "PalmService", service: enyo.palmServices.accounts, method: "modifyAccount", onResponse: "doAccountsModify_Done"},
			{name: "deleteAccount", kind: "PalmService", service: enyo.palmServices.accounts, method: "deleteAccount", onResponse: "doAccountsModify_Done"}
		]},
		
		{kind: "Accounts.credentialView", name: "changeCredentialsView", onCredentials_ValidationSuccess: "saveAccountCredentials", onCredentials_Cancel: "backHandler"},
		{kind: "Accounts.modifyView", name: "modifyAccountView", onModifyView_ChangeLogin: "editCredentials", onModifyView_Cancel: "doAccountsModify_Done", onModifyView_Success: "doAccountsModify_Done"},
		{kind: "Accounts.crossAppUI", name:"customAccountsUI", onResult: "backHandler"}
	],
	
	// Account to modify was tapped on
	ModifyAccount: function(account, template, capability) {
		this.account = account;
		this.template = template || account;
		this.capability = capability || this.capability;
		
		// Return to "Prefs & Accounts" from cross-app UI
		if (this.capability)
			this.$.customAccountsUI.onResult = "doAccountsModify_Done";

		// It is not possible to edit the Profile account
		if (this.account.templateId === "com.palm.palmprofile") {
			throw "Not possible to edit com.palm.palmprofile account";
		}
		else if (account.credentialError) {
			// There is a credentials error.  Go straight to the Credentials screen
			if (this.template.validator.customUI) {
				// This template has custom UI.  Launch it now
				this.$.customAccountsUI.launchCrossAppUI(this.template.validator.customUI, {mode:"modify", account: this.account, capability: this.capability});
				this.selectViewByName("customAccountsUI");
			}
			else
				this.ModifyCredentials(account);
		}
		else if (!this.capability) {
			// If no capability is provided then Accounts.modifyView provides the necessary functionality
			// Typically only the Accounts app won't provide a capability; all PIM apps must provide a capability
			this.$.modifyAccountView.displayModifyView(account);
			this.selectViewByName("modifyAccountView");
		}
		else {
			if (this.template.validator.customUI) {
				this.$.customAccountsUI.launchCrossAppUI(this.template.validator.customUI, {mode:"modify", account: this.account, capability: this.capability});
				this.selectViewByName("customAccountsUI");
			}
			else {
				this.selectViewByName("accountModificationFromPIMApp");
				this.capability = capability || this.capability;
				// Display the account credentials 
				this.$.credentials.displayCredentialsView(account, capability);
				
				// Set the account name
				this.$.accountName.value = account.alias || account.loc_name;
				this.$.accountName.valueChanged();
				
				// Stop the spinner on the "Remove Account" button and enable it
				this.$.removeAccountButton.active = false;
				this.$.removeAccountButton.activeChanged();
				AccountsUtil.disableControl(this.$.removeAccountButton, false);
			}
		}
	},
	
	// Entry point for "bad credentials" dashboard
	ModifyCredentials: function(account) {
		this.account = account;
		this.$.modifyAccountView.displayBadCredentialsView(account);
	},
	
	// Back was tapped.  Save the account name (the only editable field on the screen)
	saveAccountName: function() {
		var name = this.$.accountName.getValue();
		if (name && name !== this.account.alias)
			this.$.modifyAccount.call({"accountId":this.account._id, "object": {"alias": name}})
		this.doAccountsModify_Done();
	},
	
	// The user changed the credentials on the account 
	saveAccountCredentials: function(inSender, validationResult) {
		console.log("saveAccountCredentials: " + enyo.json.stringify(validationResult));
		// Save the validation results
		var param = {
			"accountId": this.account._id,
			"object": {
				config: validationResult.config,
				credentials: validationResult.credentials,
			}
		}
		// Save the account name, if it changed
		var name = this.$.accountName.getValue();
		if (name && name !== this.account.alias)
			param.object.alias = name;

		this.$.modifyAccount.call(param);
		this.doAccountsModify_Done();
	},
	
	confirmAccountRemoval: function() {
		// Open the "remove confirm" dialog
		this.$.removeConfirmDialog.openAtCenter();
	},
	
	// The "Remove Account" button in the "remove confirm" dialog was tapped (PIM apps only)
	removeAccount: function() {
		// Close the dialog
		this.$.removeConfirmDialog.close();

		// Start the spinner on the button and disable it
		this.$.removeAccountButton.active = true;
		this.$.removeAccountButton.activeChanged();
		AccountsUtil.disableControl(this.$.removeAccountButton, true);

		// Reduce the array of capabilities to only those that are enabled
		var enabledCapabilities = [];
		for (i=0, l=this.account.capabilityProviders.length; i<l; i++) {
			var c = this.account.capabilityProviders[i];
			// Remove this capability from the array of capabilities.  This will disable it
			if (c.capability === this.capability)
				continue;

			// Keep capabilities enabled if they were before
			if (c._id)
				enabledCapabilities.push({"id":c.id});
		}
		
		// If there are no capabilities enabled then delete the account
		if (!enabledCapabilities.length) {
			this.$.deleteAccount.call({accountId:this.account._id});
		}
		else {
			// Remove this capability from the account
			var param = {
				"accountId": this.account._id,
				"object": {
					capabilityProviders: enabledCapabilities
				}
			}
			this.$.modifyAccount.call(param);
		}
	},
	
	keepAccount: function() {
		// Close the dialog
		this.$.removeConfirmDialog.close();
	},

	editCredentials: function(inSender, details) {
		if (!details || !details.account)
			return;
			
		var account = details.account;
		// If this template has custom UI then switch to it
		if (account.validator && account.validator.customUI) {
			// This template has custom UI
			this.$.customAccountsUI.launchCrossAppUI(account.validator.customUI, {mode: "modify", account: account, capability: this.capability});
			this.selectViewByName("customAccountsUI");
		}
		else {
			this.$.changeCredentialsView.displayCredentialsView(account, this.capability);
			this.selectViewByName("changeCredentialsView");
		}
	},
	
	backHandler: function() {
		// Go back from the credentials view to the modify account view
		this.$.modifyAccountView.displayModifyView(this.account);
		this.selectViewByName("modifyAccountView");
	}
});
