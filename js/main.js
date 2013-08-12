//Original paste-app code for app.net from @duerig.
//This version by @mcdemarco.
//Requires mod_rewrite for http://paste-app.net/m/<message#>

var api = {
  accessToken: '<ACCESS_TOKEN>'
};

var pasteSite = "http://paste-app.net/";
var pasteChannel = null;
var multipleCount = 10;

//No console.log in IE.
//if (typeof console == "undefined" || typeof console.log == "undefined") 
//    var console = { log: function() {} }; 

function initialize() {
    var getvars = getUrlVars();
    if (getvars['m']) {
	getSingle(getvars['m']);
    }
    var args = {
	count: 1,
	channel_types: 'net.paste-app.clips'
    };
    api.call('https://alpha-api.app.net/stream/0/channels', 'GET', args,
             completeChannel, failChannel);
}

function getSingle(messageId) {
    var args = {
	include_annotations: 1,
	ids: messageId
    };
    api.call('https://alpha-api.app.net/stream/0/channels/messages', 'GET', args,
	     completeSingle, failSingle);
    if ( history.pushState ) 
	history.pushState( {}, document.title, pasteSite + 'm/' + messageId );
    //Scroll to top.
    $('html, body').animate({scrollTop: '0px'}, 150);
}

function completeSingle(response) {
    var resp = response.data;
    if (!resp.created_at)
	resp = response.data[0];
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
    $('#yourPaste').html("<h3>Your Paste</h3>" + formatPaste(paste, date, url));
}

function formatPaste(paste, date, url, navId) {
    var formattedDate = new Date(date);
    var formatted = "<div class='project'><div class='projectInfo'>";
    if (navId)
	formatted += "<div class='projectNav'><div class='projectNavEnlarge'><button class='enlargeButton' onclick='getSingle(" + navId + ")'>View full-size</button></div></div>";
    formatted += "<p>" + paste + "</p><ul><li></li>";
    if (formattedDate)
	formatted += "<li><strong>Posted:</strong> " + formattedDate + "</li>";
    if (url)
	formatted += "<li><strong>Permalink:</strong> <a href='" + url + "'>" + url + "</a></li>";
    formatted += "</ul><hr/></div></div>";
    return formatted;
}

function failSingle(response)
{
  $('#paste-error').html('Failed to load message');
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
    api.call('https://alpha-api.app.net/stream/0/channels/' + pasteChannel.id + '/messages', 'GET', args,
             completeMultiple, failMultiple);
  }
  console.dir(response);
  //$('#paste-create').show();
  $('#paste-create').submit(clickPaste);
}

function failChannel(meta)
{
  console.log('Failure getting channel!');
  console.dir(meta);
}

function completeMultiple(response) {
    var j = 0;
    var paste = "";
    var col = "#col1";
    for (; j < response.data.length; ++j) {
	var i = 0;
	var resp = response.data[j];
	for (; i < resp.annotations.length; ++i)
	    if (resp.annotations[i].type === 'net.paste-app.clip') {
		var val = resp.annotations[i].value;
		if (val.content) {
		    paste = val.content;
		}
		var date = resp.created_at;
		var url = resp.entities.links[0].url;
	    }
	if (j == Math.floor(.5 * multipleCount))
	    col = "#col2";
	$(col).append(formatPaste(paste, date, url, resp.id));
    }

    //Need to run the formatting for Types&Grids that moves projects to second column in reverse.
    //$(".project:odd").appendTo("#col2");
}

function failMultiple(meta)
{
  console.log('Failure retrieving multiple pastes!');
  console.dir(meta);
}

function clickPaste(event)
{
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

function createPaste(text)
{
  console.log('Create Paste');
  console.dir(pasteChannel);
  console.log(text);
  var message = {
    text: 'Paste Link is ' + pasteSite + 'm/{message_id}',
    annotations: [{
      type: 'net.paste-app.clip',
      value: { content: text }
    }]
  };
  api.call('https://alpha-api.app.net/stream/0/channels/' + pasteChannel.id
           + '/messages', 'POST', { include_annotations: 1 },
           completePaste, failPaste, message);
}

function completePaste(response)
{
  console.log('completePaste');
  console.dir(response.data.annotations);
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
  api.call('https://alpha-api.app.net/stream/0/channels', 'POST', {},
           $.proxy(completeCreateChannel, context), failCreateChannel, channel);
}

function completeCreateChannel(response)
{
  console.log("complete create");
  console.dir(response);
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

function getUrlVars() {
    var vars = [], hash;
    if (window.location.href.indexOf('/m/') > 0) 
	vars["m"] = window.location.href.split('/m/')[1].split("/")[0];
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    var i = 0;
    for (i = 0; i < hashes.length; i += 1)
    {
	hash = hashes[i].split('=');
	vars.push(hash[0]);
	vars[hash[0]] = hash[1];
    }
    return vars;
};
