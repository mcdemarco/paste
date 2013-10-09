//main.js for paste-app.net
//Based on original paste-app code for app.net from @duerig.
//This version by @mcdemarco.

var pasteChannel = null;
var annotationArgs = {include_annotations: 1};

var multipleCount = 8; //Number of recent pastes to retrieve for logged-in user.
var highlightMin = 75; //Minimum paste length to trigger auto-highlighting. (It's bad at language detection for short lengths.)
var getvars = [];

//To force authorization: https://account.app.net/oauth/authorize etc.
var authUrl = "https://account.app.net/oauth/authenticate?client_id=" + api['client_id'] + "&response_type=token&redirect_uri=" + window.location.href + "&scope=public_messages";

//Mustache template for pastes.
var stringTemplate = "<div id='{{flag}}-{{id}}' class='paste {{flag}}'>" 
		+ "{{#is_deleted}}<em>This paste has been deleted by its owner.</em>{{/is_deleted}}"
		+ "{{^is_deleted}}"
			+ "<h5>{{#annotation.title}}<span class='pasteTitle'>{{annotation.title}}</span>{{/annotation.title}}</h5>"
			+ "<div class='byline'>{{created_at}} by <a href='{{user.canonical_url}}'>@{{user.username}}</a></div>" 
			+ "{{#small}}"
				+ "<pre>{{annotation.content}}</pre>{{#annotation}}<span class='pasteTags'>{{#tags}}{{.}} {{/tags}}</span>{{/annotation}}"
				+ "<button class='enlargeButton' id='{{shorty}}' onclick='viewPaste(this.id)'>View</button>"
			+ "{{/small}}"
			+ "{{^small}}"
				+ "<pre><code class='{{highlightClass}}'>{{annotation.content}}</code></pre>"
				+ "<p><strong>Tags:</strong> {{#annotation}}<span class='pasteTags'>{{#tags}}{{.}} {{/tags}}</span>{{/annotation}}<br />"
				+ "<strong>Public link:</strong> <a href='{{shortUrl}}'>{{shortUrl}}</a><br />"
				+ "<strong>Private link:</strong> <a href='{{longUrl}}'>{{longUrl}}</a></p>"
				+ "<div><strong>Raw{{#annotation.content_type}} (<span class='pasteContentType'>{{annotation.content_type}}</span>){{/annotation.content_type}}:</strong> <textarea id='rawPaste' rows='6' style='width:99%;' readonly='readonly'>{{annotation.content}}</textarea>"
				+ "{{#auth}}"
					+ "<button class='loggedIn' onclick='clickRepaste()'>Repaste</button>"
					+ "{{#del}}<button class='loggedIn' onclick='deletePaste({{id}})'>Delete Paste</button>{{/del}}"
					+ "<button onclick='clickClose()'>Close Paste</button>"
				+ "{{/auth}}"
				+ "</div>"
			+ "{{/small}}"
		+ "{{/is_deleted}}<hr/></div>";

var compiledTemplate = Mustache.compile(stringTemplate);

/* main execution path */

function initialize() {
	//Parse the url.
	getvars = getUrlVars();
	if (api.accessToken) {//If we have the token, get the user's pastes, too.
		$(".loggedOut").hide();
		$.appnet.authorize(api.accessToken,api.client_id);
		getChannel();
		$(".loggedIn").show('slow');
	} else {//Otherwise, get one paste.
		getSingle();
		$(".loggedOut").show('slow');
	}
	$("a.adn-button").attr('href',authUrl);
	$('#paste-description').keyup(function () {
		var max = 2048;
		var len = $(this).val().length;
		var cnt = max - len;
		var col = (cnt > 20) ? "gray" : "red";
		$('#pasteCounter').text(cnt).css("color",col);
	});
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
}

function getSingle() {
	if (getvars['m']) {
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
		$('textarea#rawPaste').css("height", $("code").css("height"));
	});
	$('pre code').each(function(i, e) {hljs.highlightBlock(e, '	');});
	if ($('#yourPaste h5').html() != "") {
		$('#yourPaste h3').html($('#yourPaste h5').html());
		$('#yourPaste h5').hide();
	}
}

function getChannel() {
	//We have the token.
	var args = {
		count: 1,
		channel_types: 'net.paste-app.clips'
	};
	var promise = $.appnet.channel.getCreated(args);
	promise.then(completeChannel, function (response) {failAlert('Failed to retrieve paste channel.');}).then(getSingle);
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

function createPaste(formObject) {
	var message = {
		text: 'Paste Link is ' + pasteSite + '/m/{message_id}',
		annotations: [{
						  type: 'net.paste-app.clip',
						  value: formObject
					  }]
	};
	var promise = $.appnet.message.create(pasteChannel.id, message, annotationArgs);
	promise.then(completePaste, function (response) {failAlert('Failed to create paste.');});
}

function completePaste(response) {
	var respd = response.data;
	pushHistory(pasteSite + '/m/' + respd.id );
	completeSingle(response);
	clearForm();
	$("#recentPastesHeader").show();
	$("#col1").prepend(formatPaste(respd,true));
}

function createPasteChannel(formObject) {
	var context = {
		formObject: formObject
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

function clearForm() {
	$("#newPaste h3").html("New Paste");
	$('form#paste-create input').each(function () {$(this).val("");});
	$('form#paste-create textarea').val("");
	$('form#paste-create select').val("");	
	$('#pasteCounter').html("");	
}

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
		var formObject = getFormAsObject($('form#paste-create'));
		if (pasteChannel) {
			createPaste(formObject);
		} else {
			createPasteChannel(formObject);
		}
	}
	//Scroll to paste.
	window.location.href = window.location.href.split("#")[0] + "#yourPaste";
	return false;
}

function clickRepaste() {
	//Now uses the paste form instead of automatically pasting.
	clearForm();
	$('form#paste-create input#paste-title').val($('#yourPaste .pasteTitle').html());
	$('form#paste-create input#paste-tags').val($('#yourPaste .pasteTags').html());
	$('form#paste-create textarea').val($("#rawPaste").val());
	$('form#paste-create select').val($('#yourPaste .pasteContentType').html());	
	//Scroll to paste.
	window.location.href = window.location.href.split("#")[0] + "#newPaste";
	$("#newPaste h3").html("Repaste");
}

function failAlert(msg) {
	$('#paste-error').html(msg).show().fadeOut(8000);
}

function formatPaste(respd, small) {
	//Small means the paste is going into the recent pastes list and needs the enlarge button.
	//Otherwise, it needs raw text, repaste button, user link, etc.

	//Flatten the annotations for use in the template.
	var annotations = respd.annotations;
	var i = 0;
	for (; i < annotations.length; ++i) {
		if (annotations[i].type === 'net.paste-app.clip') {
			respd.annotation = annotations[i].value;
		}
	}
	//Add more info for use by the template.
	respd.created_at = (new Date(respd.created_at)).toString();
	respd.shorty = parseInt(respd.channel_id).toString(36) + "-" + parseInt(respd.id).toString(36);
	respd.small = (small) ? true : false;
	respd.auth = (api.accessToken) ? true : false;
	respd.del = (respd.channel_id == api.channel_id) ? true : false;
	respd.shortUrl = pasteSite + "/m/" + respd.shorty;
	respd.longUrl = pasteSite + "/m/" + respd.id;
	respd.flag = (small) ? "small" : "view";

	//Determine highlighting class based on the content type, which doesn't always match.
	if (respd.annotation && respd.annotation.content) {
		if (respd.annotation.content_type) {
			switch (respd.annotation.content_type) {
				case "text":
					respd.highlightClass =  "no-highlight";
					break;
				case "html":
					respd.highlightClass =  "xml";
					break;
				case "scheme":
					respd.highlightClass =  "lisp";
					break;
				case "c":
				case "prolog":
				case "code":
					//autodetect
					break;
				default:
					respd.highlightClass = respd.annotation.content_type;
			}
		} else if (respd.annotation.content.length < highlightMin) {//Turn off autodetection for short content.
			respd.highlightClass = "no-highlight";
		}//else autodetect
	}

	var formatted = compiledTemplate(respd);
	//process template to formatted
	return formatted;
}

function getFormAsObject($form){
	var unindexed_array = $form.serializeArray();
	var indexed_array = {};
	//Convert name/value to JSON style.
	//Don't pass empty string values to ADN in order to save annotation space.
	$.map(unindexed_array, function(n, i){
		if (n['value'] !== "") {
			if (n['name'] == "tags") {
				indexed_array[n['name']] = n['value'].split(/[ ,]+/);
			} else {
				indexed_array[n['name']] = n['value'];
			}
		}
	});
	return indexed_array;
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
}

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
}

function pushHistory(newLocation) {
	if (history.pushState) 
		history.pushState({}, document.title, newLocation);
}

function testForm() {
	var myText = $("#paste-description").val(); 
	var message = {
		text: myText
	};
	var promise = $.appnet.text.process(message);
	promise.then(completeTest, function (response) {failAlert('Failed test.');});
}

function completeTest(response) {
	$("#yourPaste").prepend(response.data.html + "<hr />");
	clearForm();
}

function toggleAbout() {
	$('.about').toggle();
	$('html, body').animate({scrollTop: '0px'}, 150);
	if ( $('#more').html() == "[more]" ) 
		 $('#more').html("[less]");
	else
		$('#more').html("[more]");
}

function viewPaste(shorty) {
	getvars = getShortVars(shorty);
	getSingle();
	//Scroll to paste.
	window.location.href = window.location.href.split("#")[0] + "#yourPaste";
}

/* eof */
