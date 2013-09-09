//main.js for paste-app.net
//Based on original paste-app code for app.net from @duerig.
//This version by @mcdemarco.

var api = {
    client_id: '<APP_ID>'
};
var pasteSite = "http://paste-app.net/";

var pasteChannel = null;
var annotationArgs = {include_annotations: 1};

var multipleCount = 8; //Number of recent pastes to retrieve for logged-in user.
var highlightMin = 75; //Minimum paste length to trigger highlighting. (It's bad at language detection for short lengths.)
var getvars = [];

//To force authorization: https://account.app.net/oauth/authorize etc.
var authUrl = "https://account.app.net/oauth/authenticate?client_id=" + api['client_id'] + "&response_type=token&redirect_uri=" + window.location.href + "&scope=public_messages";


/* main execution path */

function initialize() {
    //Parse the url and optionally authenticate.
    getvars = getUrlVars();
    if (getvars['m']) {
	getSingle();
    }
    if (api.accessToken) {//If authenticated, get the user's pastes.
	getChannel();
	$(".loggedIn").show('slow');
    } else {
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
	if ((url.fparam('access_token')  && url.fparam('access_token').length > 0 ) || (localStorage && localStorage["accessToken"])) {
	    if (url.fparam('access_token')) {
		api.accessToken = url.fparam('access_token');
		//Hide the access token
		pushHistory(url.attr('source').split("#")[0]);
		$(".loggedOut").hide();
		$(".loggedIn").show();
		if (localStorage) {
		    try {
			localStorage["accessToken"] = api.accessToken;
		    } catch (e) {}
		}
		$.appnet.authorize(api.accessToken,api.client_id);
	    } else {
		try {
		    api.accessToken = localStorage["accessToken"];
		    $(".loggedOut").hide();
		    $(".loggedIn").show();
		    $.appnet.authorize(api.accessToken,api.client_id);
		} catch (e) {}
	    }
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

function getSingle() {
    failAlert("");
    if (!getvars['c']) {
	    if (api.accessToken) {
		var promise = $.appnet.message.getList($.makeArray(getvars['m']), annotationArgs);
		promise.then(completeSingle, function (response) {failAlert('Failed to load message.');});
		pushHistory(pasteSite + 'm/' + getvars['m']);
	    } else {
		//Replace with push for auth
		window.location = authUrl;
	    }
    } else {
	//We have the id & channel so can make an unauthenticated call.
	var promise = $.appnet.message.get(getvars['c'], getvars['m'], annotationArgs);
	promise.then(completeSingle, function (response) {failAlert('Failed to load message.');});
	pushHistory(pasteSite + 'm/' + getvars['enc'] );
    }

    //Scroll to top.
    $('html, body').animate({scrollTop: '0px'}, 150);
}

function completeSingle(response) {
    var resp = response.data;
    if (!resp.created_at)
	resp = response.data[0];

    $('#yourPaste').html("<h3>Paste " + resp.id + "</h3>" + formatPaste(resp)).promise().done(function(){
	$('textarea#repaste-text').css("height", $("code").css("height"));
    });
    $('pre code').each(function(i, e) {hljs.highlightBlock(e, '    ')});
}

function getChannel() {
    if (api.accessToken) {
	var args = {
	    count: 1,
	    channel_types: 'net.paste-app.clips'
	};
	var promise = $.appnet.channel.getCreated(args);
	promise.then(completeChannel, function (response) {failAlert('Failed to retrieve paste channel.');});
    }
}

function completeChannel(response) {
    if (response.data.length > 0) {
	pasteChannel = response.data[0];
	var args = {
	    count: multipleCount,
	    include_annotations: 1
	};
	var promise = $.appnet.message.getChannel(pasteChannel.id, args);
	promise.then(completeMultiple, function (response) {failAlert('Failed to retrieve paste channel.');});
    } else {
	//TODO
	//For a channel with no pastes (possible deleted?), write no pastes found to col1.
    }
    //Activate the button
    $('#paste-create').submit(clickPaste);
}

function completeMultiple(response) {
    var j = 0;
    var paste = "";
    var col = "#col1";
    $("#recentPastesHeader").show();
    for (; j < response.data.length; ++j) {
	var resp = response.data[j];
	if (j == Math.floor(.5 * multipleCount))
	    col = "#col2";
	$(col).append(formatPaste(resp, true));
    }
}


/* channel/paste creation functions */

function createPaste(text) {
    var message = {
	text: 'Paste Link is ' + pasteSite + 'm/{message_id}',
	annotations: [{
			  type: 'net.paste-app.clip',
			  value: { content: text }
		      }]
    };
    var promise = $.appnet.message.create(pasteChannel.id, message, annotationArgs);
    promise.then(completePaste, function (response) {failAlert('Failed to create paste.');});
}

function completePaste(response) {
    pushHistory(pasteSite + 'm/' + response.data.id );
    completeSingle(response);
    $('#paste-text').val("");
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

function deletePaste(id) {
    //TODO
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

function formatPaste(resp, small) {
    //Small means we need the enlarge link for the paste in a paste list.
    //Otherwise, we need raw text, user link, etc.
    var annotations = resp.annotations;
    var i = 0;
    var paste = "";
    for (; i < annotations.length; ++i)
    {
	if (annotations[i].type === 'net.paste-app.clip') {
	    var val = annotations[i].value;
	    if (val.content) {
		paste = val.content;
	    }
	    var date = resp.created_at;
	    var url = resp.entities.links[0].url;
	}
    }
    var formattedDate = new Date(resp.created_at);
    var shorty = parseInt(resp.channel_id).toString(36) + "-" + parseInt(resp.id).toString(36);
    var shortUrl = pasteSite + "m/" + shorty;
    var byline = "@" + resp.user.username;

    var formatted = "<div class='paste" + ((small) ? " small": " view") + "'>";
    formatted += "<div class='byline'>" + formattedDate + " by <a href='" + resp.user.canonical_url + "'>" + byline + "</a></div><pre>";
    if (!small)
	formatted += "<code" + ((paste.length < highlightMin) ? " class='no-highlight'"  : "") + ">"; 

    formatted += escapeHTML(paste) + ((!small) ? "</code>" : "") + "</pre><ul><li></li>";

    if (small) {
	formatted += "<button class='enlargeButton' id='"+ shorty +"' onclick='viewPaste(this.id)'>View full-size</button>";
    } else {
	formatted += "<p><strong>Public link:</strong> <a href='" + shortUrl + "'>" + shortUrl + "</a><br />";
	formatted += "<strong>Private link:</strong> <a href='" + url + "'>" + url + "</a></p>";
	formatted += "<div><strong>Raw:</strong> <textarea id='repaste-text' rows='6' style='width:99%;'>" + paste + "</textarea>";
	formatted += ((api.accessToken) ? "<button class='loggedIn' onclick='clickRepaste()'>Repaste</button>" : "");
	formatted += "<button onclick='clickClose()'>Close Paste</button></div>";
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
}

/* eof */