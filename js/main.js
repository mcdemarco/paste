//Original paste-app code for app.net from @duerig.
//This version by @mcdemarco.
//Requires mod_rewrite for http://paste-app.net/m/<message#>

var api = {
    client_id: '<APP_ID>'
};

var pasteSite = "http://paste-app.net/";

//To force authorization: https://account.app.net/oauth/authorize etc.
var authUrl = "https://account.app.net/oauth/authenticate?client_id=" + api['client_id'] + "&response_type=token&redirect_uri=" + window.location.href + "&scope=messages,public_messages";

//General channel endpoint:
var channelUrl = 'https://alpha-api.app.net/stream/0/channels';
//Users create their own pastes channel(s), so we use this endpoint for retrieving it/them:
var myChannelUrl = 'https://alpha-api.app.net/stream/0/users/me/channels';

var pasteChannel = null;
//Number of recent pastes to retrieve for logged-in user.
var multipleCount = 8;
//Minimum paste length to trigger highlighting. (It's bad at language detection for short lengths.)
var highlightMin = 75;
var getvars = [];

//No console.log in IE.
//if (typeof console == "undefined" || typeof console.log == "undefined") 
//    var console = { log: function() {} }; 

function initialize() {
    getvars = getUrlVars();
    if (getvars['m']) {
	getSingle();
    }
    if (api.accessToken) {
	getChannel();
	$(".loggedIn").show('slow');
    } else {
	$(".loggedOut").show('slow');
    }
    $("a.adn-button").attr('href',authUrl);
}

function getSingle() {
    failAlert("");
    if (!getvars['c']) {
	    if (api.accessToken) {
		var args = {
		    include_annotations: 1,
		    ids: getvars['m']
		};
		api.call(channelUrl + '/messages', 'GET', args, completeSingle, failSingle);
		if ( history.pushState ) 
		    history.pushState( {}, document.title, pasteSite + 'm/' + getvars['m']);
	    } else {
		//Replace with push for auth
		window.location = authUrl;
	    }
    } else {
	//We have the id & channel so can make an unauthorized call.
	var args = {
	    include_annotations: 1
	};
	api.call(channelUrl + '/' + getvars['c'] + '/messages/' + getvars['m'], 'GET', args, completeSingle, failSingle);
	if ( history.pushState ) 
	    history.pushState( {}, document.title, pasteSite + 'm/' + getvars['enc'] );
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

function failSingle(response)
{
  failAlert('Failed to load message.');
}

function getChannel() {
    if (api.accessToken) {
    var args = {
	count: 1,
	channel_types: 'net.paste-app.clips'
    };
    api.call(myChannelUrl, 'GET', args,
             completeChannel, failChannel);
    }
}

function completeChannel(response)
{
  if (response.data.length > 0)
  {
    pasteChannel = response.data[0];
    var args = {
	count: multipleCount,
	include_annotations: 1
    };
    api.call(channelUrl + '/' + pasteChannel.id + '/messages', 'GET', args,
             completeMultiple, failChannel);
  }
  //console.dir(response);
  $('#paste-create').submit(clickPaste);
}

function failChannel(meta) {
    failAlert('Failed to retrieve paste channel.');
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

    //Need to run the formatting for Types&Grids that moves projects to second column in reverse.
    //$(".project:odd").appendTo("#col2");
    //reHighlight();
}

function clickPaste(event) {
  event.preventDefault();
  if ($('#paste-text').val() !== '')
  {
    if (pasteChannel)
    {
      createPaste($('#paste-text').val());
    }
    else
    {
      createPasteChannel($('#paste-text').val());
    }
  }
  return false;
}

function clickRepaste() {
  if ($('#repaste-text').val() !== '')
  {
    if (pasteChannel)
	createPaste($('#repaste-text').val());
    else
	createPasteChannel($('#repaste-text').val());
  }
  return false;
}

function createPaste(text)
{
  //console.log('Create Paste');
  //console.dir(pasteChannel);
  //console.log(text);
  var message = {
    text: 'Paste Link is ' + pasteSite + 'm/{message_id}',
    annotations: [{
      type: 'net.paste-app.clip',
      value: { content: text }
    }]
  };
  api.call(channelUrl + '/' + pasteChannel.id + '/messages', 'POST', { include_annotations: 1 },
           completePaste, failPaste, message);
}

function completePaste(response)
{
  //console.log('completePaste');
  //console.dir(response.data.annotations);
// Rewrite url if safe.
    if ( history.pushState ) 
	history.pushState( {}, document.title, pasteSite + 'm/' + response.data.id );
  completeSingle(response);
  $('#paste-text').val("");
}

function failPaste(meta)
{
  console.log('failPaste');
  console.dir(meta);
}

function createPasteChannel(text)
{
  var context = {
    text: text
  };
  var channel = {
    type: 'net.paste-app.clips',
    auto_subscribe: true,
    readers: { 'public': true }
  };
  api.call(channelUrl, 'POST', {},
           $.proxy(completeCreateChannel, context), failCreateChannel, channel);
}

function completeCreateChannel(response)
{
  //console.log("complete create");
  //console.dir(response);
  pasteChannel = response.data;
  createPaste(this.text);
}

function failCreateChannel(meta)
{
  console.log('failCreateChannel');
  console.dir(meta);
}

var callSuccess = function (response)
{
  if (response !== null &&
      response.meta !== undefined &&
      response.data !== undefined)
  {
    if (this.success)
    {
      this.success(response);
    }
  }
  else
  {
    if (this.failure)
    {
      console.log('AppNet null response');
      console.dir(response);
      this.failure(response.meta);
    }
  }
};

var callFailure = function (request, status, thrown)
{
  console.log('AppNet call failed: ' + status + ', thrown: ' + thrown);
  console.dir(request.responseText);
  var meta = null;
  if (request.responseText) {
    var response = JSON.parse(request.responseText);
    if (response !== null) {
      meta = response.meta;
    }
  }
  if (this.failure) {
    this.failure(meta);
  }
};

function makeArgs(args)
{
  var result = '';
  if (args)
  {
    result = $.param(args);
  }
  if (result !== '')
  {
    result = '?' + result;
  }
  return result;
}

function makeData(data)
{
  var result = null;
  if (data)
  {
    result = JSON.stringify(data);
  }
  return result;
}

function makeUrl(pieces)
{
  var result = '';
  var i = 0;
  for (i = 0; i < pieces.length; i += 1)
  {
    if (pieces[i])
    {
      result += pieces[i];
    }
  }
  return result;
}

api.call = function (url, type, args, success, failure, data)
{
  var complete = {
    success: success,
    failure: failure
  };
  var options = {
    contentType: 'application/json',
    dataType: 'json',
    type: type,
    url: url + makeArgs(args)
  };
  if (this.accessToken) {
    options.headers = { Authorization: 'Bearer ' + this.accessToken };
  }
  if (data) {
    options.data = makeData(data);
  }
  var header = $.ajax(options);
  header.done($.proxy(callSuccess, complete));
  header.fail($.proxy(callFailure, complete));
};

function getUrlVars(url) {
    var vars = [];
    if (!url) {
	//Passed in url is for local view links.
	//If no url passed in, we should check authentication.
	url = $.url();
	if (url.fparam('access_token') && url.fparam('access_token').length > 0) {
	    api.accessToken = url.fparam('access_token');
	    $(".loggedOut").hide();
	    $(".loggedIn").show();
	    //Hide the access token
	    if ( history.pushState ) 
		history.pushState( {}, document.title, url.attr('source').split("#")[0]);
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
	formatted += "<div><strong>Raw:</strong> <textarea id='repaste-text' rows='6' style='width:99%;'>" + paste + "</textarea>" +
	    ((api.accessToken) ? "<button onclick='clickRepaste()'>Repaste</button>" : "") + "</div>";
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
    $("#col1").html("");
    $("#col2").html("");

    $(".loggedIn").hide();
    $(".loggedOut").show();
};

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
