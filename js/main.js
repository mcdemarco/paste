//main.js for paste-app.net
//Based on original paste-app code for app.net from @duerig.
//This version by @mcdemarco.

var api = {
	client_id: '<APP_ID>'
};
var pasteSite = "http://paste-app.net";

var pasteChannel = null;
var annotationArgs = {include_annotations: 1};

var multipleCount = 8; //Number of recent pastes to retrieve for logged-in user.
var highlightMin = 75; //Minimum paste length to trigger highlighting. (It's bad at language detection for short lengths.)
var getvars = [];

//To force authorization: https://account.app.net/oauth/authorize etc.
var authUrl = "https://account.app.net/oauth/authenticate?client_id=" + api['client_id'] + "&response_type=token&redirect_uri=" + window.location.href + "&scope=public_messages";


/* main execution path */

function initialize() {
	//Parse the url.
	getvars = getUrlVars();
	if (api.accessToken) {//If we have the token, get the user's pastes, too.
		$(".loggedOut").hide();
		$.appnet.authorize(api.accessToken,api.client_id);
		getChannel().then(getSingle);
		$(".loggedIn").show('slow');
	} else {//Otherwise, get one paste.
		getSingle();
		$(".loggedOut").show('slow');
	}
	$("a.adn-button").attr('href',authUrl);
}

function getUrlVars(url) {
	//Passed in url is for opening local view links.
	var vars = [];
	if (!url) {
		//If no url passed in explicitly, we should check the current location for authentication info.
		url = $.url();
		if (url.fparam('access_token') && url.fparam('access_token').length > 0 ) {
			api.accessToken = url.fparam('access_token');
			//Hide & store the access token.
			pushHistory(url.attr('source').split("#")[0]);
			if (localStorage) {
				try {localStorage["accessToken"] = api.accessToken;} 
				catch (e) {}
			}
		} else if (localStorage && localStorage["accessToken"]) {
			//Retrieve the access token.
			try {api.accessToken = localStorage["accessToken"];} 
			catch (e) {}
		}
	}
	if (url.segment(1) == "m") {
		if (!isNaN(url.segment(2))) {
			vars['m'] = url.segment(2);
		} else {
			vars = getShortVars(url.segment(2));
		}
	}
	return vars;
};

function getSingle(userChannel) {
	if (userChannel) {
		//Passing around the channel to decide whether to show the delete paste button.
		api.channel_id = userChannel;
	}
	if (getvars['m']) {
		failAlert("");
		if (!getvars['c']) {
			if (api.accessToken) {
				var promise = $.appnet.message.getList($.makeArray(getvars['m']), annotationArgs);
				promise.then(completeSingle, function (response) {failAlert('Failed to load paste.');});
				pushHistory(pasteSite + '/m/' + getvars['m']);
			} else {
				//Replace with push for auth
				window.location = authUrl;
			}
		} else {
			//We have the id & channel so can make an unauthenticated call.
			var promise = $.appnet.message.get(getvars['c'], getvars['m'], annotationArgs);
			promise.then(completeSingle, function (response) {failAlert('Failed to load paste.');});
			pushHistory(pasteSite + '/m/' + getvars['enc'] );
		}
	}
}

function completeSingle(response) {
	var respd = response.data;
	if (!respd.created_at)
		respd = response.data[0];

	$('#yourPaste').html("<h3>Paste " + respd.id + "</h3>" + formatPaste(respd)).promise().done(function(){
		$('textarea#repaste-text').css("height", $("code").css("height"));
	});
	$('pre code').each(function(i, e) {hljs.highlightBlock(e, '	')});
}

function getChannel() {
	var deferred = $.Deferred();
	if (api.accessToken) {
		var args = {
			count: 1,
			channel_types: 'net.paste-app.clips'
		};
		var promise = $.appnet.channel.getCreated(args);
		promise.then(completeChannel, function (response) {failAlert('Failed to retrieve paste channel.');});
	}
	return deferred.resolveWith(api.channel_id);
}

function completeChannel(response) {
	if (response.data.length > 0) {
		pasteChannel = response.data[0];
		var args = {
			count: multipleCount,
			include_annotations: 1,
			include_deleted: 0
		};
		var promise = $.appnet.message.getChannel(pasteChannel.id, args);
		promise.then(completeMultiple, function (response) {failAlert('Failed to retrieve pastes.');});
		api.channel_id = pasteChannel.id;
	}
	//Activate the button
	$('#paste-create').submit(clickPaste);
}

function completeMultiple(response) {
	var j = 0;
	var paste = "";
	var col = "#col1";
	if (api.lastId)
		col = "#col2";
	$("#recentPastesHeader").show();
	if (response.data.length > 0) {
		for (; j < response.data.length; ++j) {
			var respd = response.data[j];
			if (j == Math.floor(.5 * multipleCount))
				col = "#col2";
			$(col).append(formatPaste(respd, true));
		}
		api.lastId = respd.id;
		api.more = response.meta.more;
		if (!api.more) {
			$('div#morePastes button').prop('disabled',true);
		}
	} else {
		$(col).html("<em>No pastes found.</em>");
	}
}

function morePastes() {
	if (api.more && api.lastId) {
		//Move current pastes into first col.
		$("#col2").children().each(function() {$(this).appendTo($("#col1"));});
		$("#col2").css({opacity: 0.25});
		//Get an equal number of pastes and put in col2.
		multipleCount = $(".small").length;
		var args = {
			before_id: api.lastId,
			count: multipleCount,
			include_annotations: 1,
			include_deleted: 0
		};
		var promise = $.appnet.message.getChannel(pasteChannel.id, args);
		promise.then(completeMultiple, function (response) {failAlert('Failed to retrieve pastes.');});
		//Scroll to head of col2.
		window.location.href = window.location.href.split("#")[0] + "#col2";
		//Flash some animation to indicate what's new.
		$("#col2").animate({ opacity: 1.0 }, 1500 );
		
	} else {
		alert("No more pastes.");
	}
}

/* channel/paste creation/deletion functions */

function createPaste(text) {
	var message = {
		text: 'Paste Link is ' + pasteSite + '/m/{message_id}',
		annotations: [{
						  type: 'net.paste-app.clip',
						  value: { content: text }
					  }]
	};
	var promise = $.appnet.message.create(pasteChannel.id, message, annotationArgs);
	promise.then(completePaste, function (response) {failAlert('Failed to create paste.');});
}

function completePaste(response) {
	var respd = response.data;
	pushHistory(pasteSite + '/m/' + respd.id );
	completeSingle(response);
	$('#paste-text').val("");
	$("#recentPastesHeader").show();
	$("#col1").prepend(formatPaste(respd,true));
}

function createPasteChannel(text) {
	var context = {
		text: text
	};
	var channel = {
		type: 'net.paste-app.clips',
		auto_subscribe: true,
		readers: { 'public': true }
	};
	var promise = $.appnet.channel.create(channel);
	promise.then($.proxy(completeCreateChannel, context), function (response) {failAlert('Failed to create paste channel.');});
}

function completeCreateChannel(response) {
	pasteChannel = response.data;
	createPaste(this.text);
}

function deletePaste(messageId) {
	//We know api.channel_id is set and matches.
	var promise = $.appnet.message.destroy(api.channel_id, messageId);
	promise.then(completeDelete, function (response) {failAlert('Failed to delete paste.');});
}

function completeDelete(response) {
	pasteId = response.data.id;
	$("div#yourPaste div.paste").html("<em>Paste " + pasteId + " deleted.</em><hr />");
	$("div#small-" + pasteId).html("");
}

/* miscellaneous functions */

function clickClose(event) {
	//Erase paste section.
	$("#yourPaste").html("");
	//Cleanup location bar.
	pushHistory(pasteSite);
	$('html, body').animate({scrollTop: '0px'}, 150);
}

function clickPaste(event) {
	event.preventDefault();
	if ($('#paste-text').val() !== '') {
		if (pasteChannel) {
			createPaste($('#paste-text').val());
		} else {
			createPasteChannel($('#paste-text').val());
		}
	}
	return false;
}

function clickRepaste() {
	if ($('#repaste-text').val() !== '') {
		if (pasteChannel)
			createPaste($('#repaste-text').val());
		else
			createPasteChannel($('#repaste-text').val());
	}
	return false;
}

function escapeHTML(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function failAlert(msg) {
	$('#paste-error').html(msg);
}

function formatPaste(respd, small) {
	//Small means we need the enlarge link for the paste in a paste list.
	//Otherwise, we need raw text, user link, etc.
	var annotations = respd.annotations;
	var i = 0;
	var paste = "";
	for (; i < annotations.length; ++i)
	{
		if (annotations[i].type === 'net.paste-app.clip') {
			var val = annotations[i].value;
			if (val.content) {
				paste = val.content;
			}
			var date = respd.created_at;
			var url = respd.entities.links[0].url;
		}
	}
	var formattedDate = new Date(respd.created_at);
	var shorty = parseInt(respd.channel_id).toString(36) + "-" + parseInt(respd.id).toString(36);
	var shortUrl = pasteSite + "/m/" + shorty;
	var byline = "@" + respd.user.username;
	var insert = (small) ? "small" : "view";

	var formatted = "<div id='" + insert + "-" + respd.id + "' class='paste " + insert + "'>";

	if (respd.is_deleted) {
		formatted += "<em>This paste has been deleted by its owner.</em>";
	} else {

		formatted += "<div class='byline'>" + formattedDate + " by <a href='" + respd.user.canonical_url + "'>" + byline + "</a></div><pre>";
		if (!small)
			formatted += "<code" + ((paste.length < highlightMin) ? " class='no-highlight'"  : "") + ">"; 
		formatted += escapeHTML(paste) + ((!small) ? "</code>" : "") + "</pre><ul><li></li>";

		if (small) {
			formatted += "<button class='enlargeButton' id='"+ shorty +"' onclick='viewPaste(this.id)'>View full-size</button>";
		} else {
			formatted += "<p><strong>Public link:</strong> <a href='" + shortUrl + "'>" + shortUrl + "</a><br />";
			formatted += "<strong>Private link:</strong> <a href='" + url + "'>" + url + "</a></p>";
			formatted += "<div><strong>Raw:</strong> <textarea id='repaste-text' rows='6' style='width:99%;'>" + paste + "</textarea>";
				 if (api.accessToken) {
					 formatted += "<button class='loggedIn' onclick='clickRepaste()'>Repaste</button>";
					 formatted += ((respd.channel_id == api.channel_id) ? "<button class='loggedIn' onclick='deletePaste(" + respd.id + ")'>Delete Paste</button>" : "");
				 }
			formatted += "<button onclick='clickClose()'>Close Paste</button></div>";
		}
	}
	formatted += "<hr/></div>";
	return formatted;
}

function getShortVars(shorty) {
	var vars = [];
	splits = shorty.split("-");
	if (splits.length > 0) {		
		vars['enc'] = shorty;
		vars['c'] = parseInt(splits[0], 36);
		vars['m'] = parseInt(splits[1], 36);
	}
	return vars;
}

function login() {
	window.location = authUrl;
};

function logout() {
	//Erase token and post list.
	api.accessToken = '';
	if (localStorage) {
		try {
			localStorage.removeItem("accessToken");
		} catch (e) {}
	}
	$("#col1").html("");
	$("#col2").html("");

	$(".loggedIn").hide();
	$(".loggedOut").show();
};

function pushHistory(newLocation) {
	if (history.pushState) 
		history.pushState({}, document.title, newLocation);   
}

function toggleAbout() {
	$('.about').toggle();
	$('html, body').animate({scrollTop: '0px'}, 150);
	if ( $('#more').html() == "[more]" ) 
		 $('#more').html("[less]");
	else
		$('#more').html("[more]");
};

function viewPaste(shorty) {
	getvars = getShortVars(shorty);
	getSingle();
	//Scroll to paste.
	window.location.href = window.location.href.split("#")[0] + "#yourPaste";
}

/* eof */