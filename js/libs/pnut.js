/*
 * base.js
 *
 * Base pnut.io library file. Sets up the single global pnut object.
 *
 */

/*global jQuery: true, require: true, module: true, exports: true */
if (typeof exports !== 'undefined')
{
  jQuery = {};

  jQuery.param = function (object)
  {
    'use strict';
    // Query String able to use escaping
    var query = require('querystring');

    var result = '',
        key = '',
        postfix = '&';

    var i;
    for (i in object)
    {
      // If not prefix like a[one]...
//      if (! prefix)
//      {
      key = query.escape(i);
//      }
//      else
//      {
//        key = prefix + '[' + query.escape(i) + ']';
//      }

      // String pass as is...
      if (typeof(object[i]) === 'string')
      {
        result += key + '=' + query.escape(object[i]) + postfix;
        continue;
      }

      // objectects and arrays pass depper
/*
      if (typeof(object[i]) === 'object' || typeof(object[i]) === 'array')
      {
        result += toURL(object[i], key) + postfix;
        continue;
      }
*/
      // Other passed stringified
      if (object[i].toString)
      {
        result += key + '=' + query.escape(object[i].toString()) + postfix;
        continue;
      }
    }
    // Delete trailing delimiter (&) Yep it's pretty durty way but
    // there was an error gettin length of the objectect;
    result = result.substr(0, result.length - 1);
    return result;
  };

  jQuery.ajax = function (options)
  {
    'use strict';
    var http = require('q-io/http');
    var Reader = require('q-io/reader');
    var Q = require('q');
    var streamifier = require('streamifier');
    var request = {
      url: options.url,
      method: options.type,
      headers: options.headers,
    };
    if (options.data)
    {
      request.headers['Content-Type'] = 'application/json';
      var newStream = streamifier.createReadStream(options.data);
      request.body = Reader(newStream);
    }
    var result = http.request(http.normalizeRequest(request));
    return result.then(function (response) {
      if (response.status !== 200)
      {
        throw response;
      }
      return Q.post(response.body, 'read', []);
    });
  };

  jQuery.extend = require('xtend');

  jQuery.wait = require('q').delay;
}

(function ($) {
  'use strict';
  var pnut = {
    userToken: null,
    appToken: null,
    endpoints: null,
    core: {},
    note: {}
  };

  pnut.authorize = function (user, app)
  {
    this.userToken = user;
    this.appToken = app;
  };
  
  pnut.deauthorize = function ()
  {
    this.userToken = null;
    this.appToken = null;
  };

  pnut.isLogged = function ()
  {
    return (this.isApp() || this.isUser());
  };

  pnut.isApp = function ()
  {
    var result = false;
    if (this.appToken)
    {
      result = true;
    }
    return result;
  };

  pnut.isUser = function ()
  {
    var result = false;
    if (this.userToken)
    {
      result = true;
    }
    return result;
  };

  $.pnut = pnut;

}(jQuery));

if (typeof module !== 'undefined')
{
  module.exports = jQuery.pnut;
}

/*global jQuery: true */
(function ($) {
'use strict';
  $.pnut.endpoints = {
    "format_version": 3,
    "data_version": 5,
    "scopes": {
        "basic": "See basic information about this user",
        "stream": "Read this user's stream",
        "write_post": "Create a new post as this user",
        "follow": "Add or remove follows (or mutes) for this user",
        "public_messages": "Send and receive public messages as this user",
        "messages": "Send and receive public and private messages as this user",
        "update_profile": "Update a user's name, images, and other profile information",
        "presence": ""
    },
    "stream_types": [
        "user",
        "post",
        "channel",
        "message",
        "interaction",
        "marker",
        "text",
        "token",
        "config"
    ],
    "migrations": [ ],
    "parameter_category": {
        "pagination":      [ "since_id", "before_id", "count" ],
        "general_user":    [ "include_raw", "include_user_raw", "include_html",
                             "connection_id" ],
        "general_post":    [ "include_muted", "include_deleted",
                             "include_bookmarked_by", "include_reposters", "include_raw", 
                             "include_post_raw", "include_user_raw", "include_html",
                             "connection_id" ],
        "general_channel": [ "channel_types", "include_marker", "include_read", "include_recent_message", 
                             "include_raw", "include_user_raw", "include_message_raw",
                             "connection_id" ],
        "general_message": [ "include_muted", "include_deleted",
                             "include_raw", "include_user_raw", "include_message_raw", 
                             "include_html", "connection_id" ],

        "user":            [ "name", "locale", "timezone", "content" ],
        "avatar":          "image",
        "cover":           "image",
        "post":            [ "text", "reply_to", "raw", "entities" ],
        "channel":         [ "acl", "raw", "type" ],
        "message":         [ "text", "reply_to", "raw", "entities", "destinations" ],
        "content":         "content",
        "marker":          [ "id", "name", "percentage" ],
        "post_or_message": [ "text" ],
        "user_ids":    [ "ids" ],
        "post_ids":    [ "ids" ],
        "channel_ids": [ "ids" ],
        "message_ids": [ "ids" ]
    },
    "base": "https://api.pnut.io/v0/",
    "endpoints": [
        {
            "id": "100",
            "group": "user",
            "name": "get",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "GET",
            "url": [
                "users/"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve a User",
            "link": "http://developers.app.net/docs/resources/user/lookup/#retrieve-a-user"
        },
        {
            "id": "101",
            "group": "user",
            "name": "update",
            "url_params": [],
            "data_params": [
                "user"
            ],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "PUT",
            "url": [
                "users/me"
            ],
            "token": "User",
            "scope": "update_profile",
            "description": "Update a User",
            "link": "http://developers.app.net/docs/resources/user/profile/#update-a-user"
        },
        {
            "id": "124",
            "group": "user",
            "name": "partialUpdate",
            "url_params": [],
            "data_params": [
                "user"
            ],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "PATCH",
            "url": [
                "users/me"
            ],
            "token": "User",
            "scope": "update_profile",
            "description": "Partially Update a User",
            "link": "http://developers.app.net/docs/resources/user/profile/#partially-update-a-user"
        },
        {
            "id": "102",
            "group": "user",
            "name": "getAvatar",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ ],
            "method": "GET",
            "url": [
                "users/",
                "/avatar"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve a User's avatar image",
            "link": "http://developers.app.net/docs/resources/user/profile/#retrieve-a-users-avatar-image"
        },
        {
            "id": "103",
            "group": "user",
            "name": "updateAvatar",
            "url_params": [],
            "data_params": [
                "avatar"
            ],
            "array_params": [],
            "get_params": [ ],
            "method": "POST-RAW",
            "url": [
                "users/me/avatar"
            ],
            "token": "User",
            "scope": "update_profile",
            "description": "Update a User's avatar image",
            "link": "http://developers.app.net/docs/resources/user/profile/#update-a-users-avatar-image"
        },
        {
            "id": "104",
            "group": "user",
            "name": "getCover",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ ],
            "method": "GET",
            "url": [
                "users/",
                "/cover"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve a User's cover image",
            "link": "http://developers.app.net/docs/resources/user/profile/#retrieve-a-users-cover-image"
        },
        {
            "id": "105",
            "group": "user",
            "name": "updateCover",
            "url_params": [],
            "data_params": [
                "cover"
            ],
            "array_params": [],
            "get_params": [ ],
            "method": "POST-RAW",
            "url": [
                "users/me/cover"
            ],
            "token": "User",
            "scope": "update_profile",
            "description": "Update a User's cover image",
            "link": "http://developers.app.net/docs/resources/user/profile/#update-a-users-cover-image"
        },
        {
            "id": "106",
            "group": "user",
            "name": "follow",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "PUT",
            "url": [
                "users/",
                "/follow"
            ],
            "token": "User",
            "scope": "follow",
            "description": "Follow a User",
            "link": "http://developers.app.net/docs/resources/user/following/#follow-a-user"
        },
        {
            "id": "107",
            "group": "user",
            "name": "unfollow",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "DELETE",
            "url": [
                "users/",
                "/follow"
            ],
            "token": "User",
            "scope": "follow",
            "description": "Unfollow a User",
            "link": "http://developers.app.net/docs/resources/user/following/#unfollow-a-user"
        },
        {
            "id": "108",
            "group": "user",
            "name": "mute",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "PUT",
            "url": [
                "users/",
                "/mute"
            ],
            "token": "User",
            "scope": "follow",
            "description": "Mute a User",
            "link": "http://developers.app.net/docs/resources/user/muting/#mute-a-user"
        },
        {
            "id": "109",
            "group": "user",
            "name": "unmute",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "DELETE",
            "url": [
                "users/",
                "/mute"
            ],
            "token": "User",
            "scope": "follow",
            "description": "Unmute a User",
            "link": "http://developers.app.net/docs/resources/user/muting/#unmute-a-user"
        },
        {
            "id": "110",
            "group": "user",
            "name": "block",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "PUT",
            "url": [
                "users/",
                "/block"
            ],
            "token": "User",
            "scope": "follow",
            "description": "Block a User",
            "link": "http://developers.app.net/docs/resources/user/blocking/#block-a-user"
        },
        {
            "id": "111",
            "group": "user",
            "name": "unblock",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "DELETE",
            "url": [
                "users/",
                "/block"
            ],
            "token": "User",
            "scope": "follow",
            "description": "Unblock a User",
            "link": "http://developers.app.net/docs/resources/user/blocking/#unblock-a-user"
        },
        {
            "id": "112",
            "group": "user",
            "name": "getList",
            "url_params": [],
            "data_params": [],
            "array_params": [
                "user_ids"
            ],
            "get_params": [ "general_user" ],
            "method": "GET",
            "url": [
                "users"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve multiple Users",
            "link": "http://developers.app.net/docs/resources/user/lookup/#retrieve-multiple-users"
        },
        {
            "id": "114",
            "group": "user",
            "name": "getFollowing",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user", "pagination" ],
            "method": "GET",
            "url": [
                "users/",
                "/following"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve Users a User is following",
            "link": "http://developers.app.net/docs/resources/user/following/#list-users-a-user-is-following"
        },
        {
            "id": "115",
            "group": "user",
            "name": "getFollowers",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user", "pagination" ],
            "method": "GET",
            "url": [
                "users/",
                "/followers"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve Users following a User",
            "link": "http://developers.app.net/docs/resources/user/following/#list-users-following-a-user"
        },
        {
            "id": "118",
            "group": "user",
            "name": "getMuted",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
	    "get_params": [ "general_user" ],
            "method": "GET",
            "url": [
                "users/",
                "/muted"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve muted Users",
            "link": "http://developers.app.net/docs/resources/user/muting/#list-muted-users"
        },
        {
            "id": "120",
            "group": "user",
            "name": "getBlocked",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "GET",
            "url": [
                "users/",
                "/blocked"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve blocked Users",
            "link": "http://developers.app.net/docs/resources/user/blocking/#list-blocked-users"
        },
        {
            "id": "122",
            "group": "user",
            "name": "getPostActions",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_user" ],
            "method": "GET",
            "url": [
                "posts/",
                "/actions"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve actions made against a post",
            "link": "http://developers.app.net/docs/resources/user/post-interactions/#list-users-who-have-reposted-a-post"
        },
        {
            "id": "200",
            "group": "post",
            "name": "create",
            "url_params": [],
            "data_params": [
                "post"
            ],
            "array_params": [],
            "get_params": [ "general_post" ],
            "method": "POST",
            "url": [
                "posts"
            ],
            "token": "User",
            "scope": "write_post",
            "description": "Create a Post",
            "link": "http://developers.app.net/docs/resources/post/lifecycle/#create-a-post"
        },
        {
            "id": "201",
            "group": "post",
            "name": "get",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post" ],
            "method": "GET",
            "url": [
                "posts/"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve a Post",
            "link": "http://developers.app.net/docs/resources/post/lookup/#retrieve-a-post"
        },
        {
            "id": "202",
            "group": "post",
            "name": "destroy",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post" ],
            "method": "DELETE",
            "url": [
                "posts/"
            ],
            "token": "User",
            "scope": "write_post",
            "description": "Delete a Post",
            "link": "http://developers.app.net/docs/resources/post/lifecycle/#delete-a-post"
        },
        {
            "id": "203",
            "group": "post",
            "name": "repost",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post" ],
            "method": "PUT",
            "url": [
                "posts/",
                "/repost"
            ],
            "token": "User",
            "scope": "write_post",
            "description": "Repost a Post",
            "link": "http://developers.app.net/docs/resources/post/reposts/#repost-a-post"
        },
        {
            "id": "204",
            "group": "post",
            "name": "unrepost",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post" ],
            "method": "DELETE",
            "url": [
                "posts/",
                "/repost"
            ],
            "token": "User",
            "scope": "write_post",
            "description": "Unrepost a Post",
            "link": "http://developers.app.net/docs/resources/post/reposts/#unrepost-a-post"
        },
        {
            "id": "205",
            "group": "post",
            "name": "bookmark",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post" ],
            "method": "POST",
            "url": [
                "posts/",
                "/bookmark"
            ],
            "token": "User",
            "scope": "write_post",
            "description": "Bookmark a Post",
            "link": "http://developers.app.net/docs/resources/post/stars/#star-a-post"
        },
        {
            "id": "206",
            "group": "post",
            "name": "unbookmark",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post" ],
            "method": "DELETE",
            "url": [
                "posts/",
                "/bookmark"
            ],
            "token": "User",
            "scope": "write_post",
            "description": "Unbookmark a Post",
            "link": "http://developers.app.net/docs/resources/post/stars/#unstar-a-post"
        },
        {
            "id": "207",
            "group": "post",
            "name": "getList",
            "url_params": [],
            "data_params": [],
            "array_params": [
                "post_ids"
            ],
            "get_params": [ "general_post" ],
            "method": "GET",
            "url": [
                "posts"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve multiple Posts",
            "link": "http://developers.app.net/docs/resources/post/lookup/#retrieve-multiple-posts"
        },
        {
            "id": "208",
            "group": "post",
            "name": "getUser",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination" ],
            "method": "GET",
            "url": [
                "users/",
                "/posts"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve a User's posts",
            "link": "http://developers.app.net/docs/resources/post/streams/#retrieve-posts-created-by-a-user"
        },
        {
            "id": "209",
            "group": "post",
            "name": "getUserBookmarked",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination" ],
            "method": "GET",
            "url": [
                "users/",
                "/bookmarks"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve a User's bookmarked posts",
            "link": "http://developers.app.net/docs/resources/post/stars/#retrieve-posts-starred-by-a-user"
        },
        {
            "id": "210",
            "group": "post",
            "name": "getUserMentions",
            "url_params": [
                "user_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination" ],
            "method": "GET",
            "url": [
                "users/",
                "/mentions"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve Posts mentioning a User",
            "link": "http://developers.app.net/docs/resources/post/streams/#retrieve-posts-mentioning-a-user"
        },
        {
            "id": "211",
            "group": "post",
            "name": "getHashtag",
            "url_params": [
                "hashtag"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination" ],
            "method": "GET",
            "url": [
                "posts/tag/"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve Posts containing a hashtag",
            "link": "http://developers.app.net/docs/resources/post/streams/#retrieve-tagged-posts"
        },
        {
            "id": "212",
            "group": "post",
            "name": "getThread",
            "url_params": [
                "post_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination" ],
            "method": "GET",
            "url": [
                "posts/",
                "/thread"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve replies to a Post",
            "link": "http://developers.app.net/docs/resources/post/replies"
        },
        {
            "id": "213",
            "group": "post",
            "name": "getUserStream",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination", "stream_facet" ],
            "method": "GET",
            "url": [
                "posts/streams/me"
            ],
            "token": "User",
            "scope": "stream",
            "description": "Retrieve a User's personalized stream",
            "link": "http://developers.app.net/docs/resources/post/streams/#retrieve-a-users-personalized-stream"
        },
        {
            "id": "214",
            "group": "post",
            "name": "getUnifiedStream",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination", "stream_facet" ],
            "method": "GET",
            "url": [
                "posts/streams/unified"
            ],
            "token": "User",
            "scope": "stream",
            "description": "Retrieve a User's unified stream",
            "link": "http://developers.app.net/docs/resources/post/streams/#retrieve-a-users-unified-stream"
        },
        {
            "id": "215",
            "group": "post",
            "name": "getGlobal",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_post", "pagination" ],
            "method": "GET",
            "url": [
                "posts/streams/global"
            ],
            "token": "User",
            "scope": "basic",
            "description": "Retrieve the Global stream",
            "link": "http://developers.app.net/docs/resources/post/streams/#retrieve-the-global-stream"
        },
        {
            "id": "300",
            "group": "channel",
            "name": "getUserSubscribed",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel", "pagination" ],
            "method": "GET",
            "url": [
                "users/me/channels/subscribed"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Get current user's subscribed channels",
            "link": "http://developers.app.net/docs/resources/channel/subscriptions/#get-current-users-subscribed-channels"
        },
        {
            "id": "301",
            "group": "channel",
            "name": "create",
            "url_params": [],
            "data_params": [
                "channel"
            ],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "POST",
            "url": [
                "channels"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Create a Channel",
            "link": "http://developers.app.net/docs/resources/channel/lifecycle/#create-a-channel"
        },
        {
            "id": "302",
            "group": "channel",
            "name": "get",
            "url_params": [
                "channel_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "GET",
            "url": [
                "channels/"
            ],
            "token": "Varies",
            "scope": "messages",
            "description": "Retrieve a Channel",
            "link": "http://developers.app.net/docs/resources/channel/lookup/#retrieve-a-channel"
        },
        {
            "id": "303",
            "group": "channel",
            "name": "getList",
            "url_params": [],
            "data_params": [],
            "array_params": [
                "channel_ids"
            ],
            "get_params": [ "general_channel" ],
            "method": "GET",
            "url": [
                "channels"
            ],
            "token": "Varies",
            "scope": "messages",
            "description": "Retrieve multiple Channels",
            "link": "http://developers.app.net/docs/resources/channel/lookup/#retrieve-multiple-channels"
        },
        {
            "id": "304",
            "group": "channel",
            "name": "getCreated",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel", "pagination" ],
            "method": "GET",
            "url": [
                "users/me/channels"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Retrieve my Channels",
            "link": "http://developers.app.net/docs/resources/channel/lookup/#retrieve-my-channels"
        },
        {
            "id": "305",
            "group": "channel",
            "name": "getUnreadCount",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ ],
            "method": "GET",
            "url": [
                "users/me/channels/num_unread/pm"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Retrieve number of unread PM Channels",
            "link": "http://developers.app.net/docs/resources/channel/lookup/#retrieve-number-of-unread-pm-channels"
        },
        {
            "id": "306",
            "group": "channel",
            "name": "update",
            "url_params": [
                "channel_id"
            ],
            "data_params": [
                "channel"
            ],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "PUT",
            "url": [
                "channels/"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Update a Channel",
            "link": "http://developers.app.net/docs/resources/channel/lifecycle/#update-a-channel"
        },
        {
            "id": "307",
            "group": "channel",
            "name": "subscribe",
            "url_params": [
                "channel_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "PUT",
            "url": [
                "channels/",
                "/subscribe"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Subscribe to a Channel",
            "link": "http://developers.app.net/docs/resources/channel/subscriptions/#subscribe-to-a-channel"
        },
        {
            "id": "308",
            "group": "channel",
            "name": "unsubscribe",
            "url_params": [
                "channel_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "DELETE",
            "url": [
                "channels/",
                "/subscribe"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Unsubscribe from a Channel",
            "link": "http://developers.app.net/docs/resources/channel/subscriptions/#unsubscribe-from-a-channel"
        },
        {
            "id": "309",
            "group": "channel",
            "name": "getSubscribers",
            "url_params": [
                "channel_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel", "pagination" ],
            "method": "GET",
            "url": [
                "channels/",
                "/subscribers"
            ],
            "token": "None",
            "scope": "messages",
            "description": "Retrieve users subscribed to a Channel",
            "link": "http://developers.app.net/docs/resources/channel/subscriptions/#retrieve-users-subscribed-to-a-channel"
        },
        {
            "id": "312",
            "group": "channel",
            "name": "mute",
            "url_params": [
                "channel_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "PUT",
            "url": [
                "channels/",
                "/mute"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Mute a Channel",
            "link": "http://developers.app.net/docs/resources/channel/muting/#mute-a-channel"
        },
        {
            "id": "313",
            "group": "channel",
            "name": "unmute",
            "url_params": [
                "channel_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "DELETE",
            "url": [
                "channels/",
                "/mute"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Unmute a Channel",
            "link": "http://developers.app.net/docs/resources/channel/muting/#unmute-a-channel"
        },
        {
            "id": "314",
            "group": "channel",
            "name": "getMuted",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_channel" ],
            "method": "GET",
            "url": [
                "users/me/channels/muted"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Get current user's muted Channels",
            "link": "http://developers.app.net/docs/resources/channel/muting/#get-current-users-muted-channels"
        },
        {
            "id": "400",
            "group": "message",
            "name": "getChannel",
            "url_params": [
                "channel_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_message", "pagination" ],
            "method": "GET",
            "url": [
                "channels/",
                "/messages"
            ],
            "token": "None",
            "scope": "messages",
            "description": "Retrieve the Messages in a Channel",
            "link": "http://developers.app.net/docs/resources/message/lifecycle/#retrieve-the-messages-in-a-channel"
        },
        {
            "id": "401",
            "group": "message",
            "name": "create",
            "url_params": [
                "channel_id"
            ],
            "data_params": [
                "message"
            ],
            "array_params": [],
            "get_params": [ "general_message" ],
            "method": "POST",
            "url": [
                "channels/",
                "/messages"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Create a Message",
            "link": "http://developers.app.net/docs/resources/message/lifecycle/#create-a-message"
        },
        {
            "id": "402",
            "group": "message",
            "name": "get",
            "url_params": [
                "channel_id",
                "message_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_message" ],
            "method": "GET",
            "url": [
                "channels/",
                "/messages/"
            ],
            "token": "None",
            "scope": "messages",
            "description": "Retrieve a Message",
            "link": "http://developers.app.net/docs/resources/message/lookup/#retrieve-a-message"
        },
        {
            "id": "403",
            "group": "message",
            "name": "getList",
            "url_params": [],
            "data_params": [],
            "array_params": [
                "message_ids"
            ],
            "get_params": [ "general_message" ],
            "method": "GET",
            "url": [
                "channels/messages"
            ],
            "token": "None",
            "scope": "messages",
            "description": "Retrieve multiple Messages",
            "link": "http://developers.app.net/docs/resources/message/lookup/#retrieve-multiple-messages"
        },
        {
            "id": "404",
            "group": "message",
            "name": "getUser",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_message" ],
            "method": "GET",
            "url": [
                "users/me/messages"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Retrieve my Messages",
            "link": "http://developers.app.net/docs/resources/message/lookup/#retrieve-my-messages"
        },
        {
            "id": "405",
            "group": "message",
            "name": "destroy",
            "url_params": [
                "channel_id",
                "message_id"
            ],
            "data_params": [],
            "array_params": [],
            "get_params": [ "general_message" ],
            "method": "DELETE",
            "url": [
                "channels/",
                "/messages/"
            ],
            "token": "User",
            "scope": "messages",
            "description": "Delete a Message",
            "link": "http://developers.app.net/docs/resources/message/lifecycle/#delete-a-message"
        },
        {
            "id": "900",
            "group": "interaction",
            "name": "get",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ "pagination" ],
            "method": "GET",
            "url": [
                "users/me/actions"
            ],
            "token": "User",
            "scope": "basic",
            "description": "Retrieve Interactions with the current User",
            "link": "http://developers.app.net/docs/resources/interaction/"
        },
        {
            "id": "1000",
            "group": "marker",
            "name": "update",
            "url_params": [],
            "data_params": [
                "marker"
            ],
            "array_params": [],
            "get_params": [ ],
            "method": "POST",
            "url": [
                "markers"
            ],
            "token": "User",
            "scope": "basic",
            "description": "Update a Stream Marker",
            "link": "http://developers.app.net/docs/resources/stream-marker/#update-a-stream-marker"
        },
        {
            "id": "1100",
            "group": "text",
            "name": "process",
            "url_params": [],
            "data_params": [
                "post_or_message"
            ],
            "array_params": [],
            "get_params": [ ],
            "method": "POST",
            "url": [
                "text/process"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Process text",
            "link": "http://developers.app.net/docs/resources/text-processor/"
        },
        {
            "id": "1200",
            "group": "token",
            "name": "get",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [ ],
            "method": "GET",
            "url": [
                "token"
            ],
            "token": "Any",
            "scope": "basic",
            "description": "Retrieve the current token",
            "link": "http://developers.app.net/docs/resources/token/#retrieve-current-token"
        },
        {
            "id": "1500",
            "group": "config",
            "name": "get",
            "url_params": [],
            "data_params": [],
            "array_params": [],
            "get_params": [],
            "method": "GET",
            "url": [
                "sys/config"
            ],
            "token": "None",
            "scope": "basic",
            "description": "Retrieve the Configuration Object",
            "link": "http://developers.app.net/docs/resources/config/#retrieve-the-configuration-object"
        }
    ]
};
}(jQuery));
/*
 * core.js
 *
 * Core functions for calling the app.net API via ajax.
 *
 */

/*global jQuery: true */
(function ($) {
  'use strict';
  function wait(time)
  {
    console.log('Waiting ' + time + ' ms to retry');
    if ($.wait === undefined)
    {
      return $.Deferred(function (newDeferred) {
        setTimeout($.bind(newDeferred.resolve, newDeferred), time);
      }).promise();
    }
    else
    {
      return $.wait(time);
    }
  }

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

  $.pnut.core.makeUrl = function (pieces)
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
  };

  $.pnut.core.call = function (url, type, args, data)
  {
    var options = {
      contentType: 'application/json',
      dataType: 'json',
      type: type,
      url: url + makeArgs(args)
    };
    var token = $.pnut.userToken;
    if (! token)
    {
      token = $.pnut.appToken;
    }
    if (token)
    {
      options.headers = { Authorization: 'Bearer ' + token };
    }
    if (data)
    {
      options.data = makeData(data);
    }
    var promise = $.ajax(options);
    // If we get a 429 busy response, we should retry once after
    // waiting the requisite time.
    return promise.fail(function (response) {
      var status;
      if (typeof exports !== 'undefined')
      {
        status = response.status;
      }
      else
      {
        status = response.statusCode();
      }
      if (status === 429)
      {
        var delaySec;
        if (typeof exports !== 'undefined')
        {
          delaySec = parseInt(response.headers['retry-after'], 10);
        }
        else
        {
          delaySec = parseInt(response.getRequestHeader('Retry-After'), 10);
        }
        var result = wait(delaySec * 1000);
        return result.then(function () {
          return $.ajax(options);
        });
      }
      else
      {
        if (typeof exports !== 'undefined')
        {
          throw response;
        }
        return response;
      }
    });
  };

}(jQuery));

/*
 * add.js
 *
 * Evaluate the endpoints json and add all the appropriate endpoint methods.
 *
 */

/*global jQuery: true */
(function ($) {
  'use strict';

  function run(endpoints)
  {
    addTypes(endpoints.stream_types);
    addEndpoints(endpoints.base, endpoints.endpoints);
    addChained();
  }

  function addTypes(types)
  {
    var i = 0;
    for (i = 0; i < types.length; i += 1)
    {
      $.pnut[types[i]] = {};
    }
  }

  function addEndpoints(base, endpoints)
  {
    var i = 0;
    for (i = 0; i < endpoints.length; i += 1)
    {
      var group = $.pnut[endpoints[i].group];
      if (! group)
      {
        console.log('Invalid group: ' + endpoints[i].group);
        console.dir(endpoints[i]);
      }
      else
      {
        addEndpoint(base, group, endpoints[i]);
      }
    }
  }

  function call(vars, argsIn)
  {
    var prefix = null;
    var suffix = null;
    if (vars.end.url.length > 0)
    {
      prefix = vars.end.url[0];
    }
    if (vars.end.url.length > 1)
    {
      suffix = vars.end.url[1];
    }
    var url = $.pnut.core.makeUrl([vars.base, prefix, vars.first,
                                     suffix, vars.second]);
    var args = {};
    if (vars.list)
    {
      args.ids = vars.list.join(',');
    }
    args = $.extend({}, args, argsIn);
    return $.pnut.core.call(url, vars.end.method, args, vars.data);
  }

  function addEndpoint(base, group, end)
  {
    if (end.url_params.length === 0 &&
        end.data_params.length === 0 &&
        end.array_params.length === 0)
    {
      group[end.name] = function (args) {
        return call({ base: base, end: end }, args);
      };
    }
    else if (end.url_params.length === 1 &&
             end.data_params.length === 0 &&
             end.array_params.length === 0)
    {
      group[end.name] = function (first, args) {
        return call({ base: base, end: end, first: first }, args);
      };
    }
    else if (end.url_params.length === 2 &&
             end.data_params.length === 0 &&
             end.array_params.length === 0)
    {
      group[end.name] = function (first, second, args) {
        return call({ base: base, end: end, first: first, second: second }, args);
      };
    }
    else if (end.url_params.length === 0 &&
             end.data_params.length === 1 &&
             end.array_params.length === 0)
    {
      group[end.name] = function (data, args) {
        return call({ base: base, end: end, data: data }, args);
      };
    }
    else if (end.url_params.length === 1 &&
             end.data_params.length === 1 &&
             end.array_params.length === 0)
    {
      group[end.name] = function (first, data, args) {
        return call({ base: base, end: end, first: first, data: data }, args);
      };
    }
    else if (end.url_params.length === 2 &&
             end.data_params.length === 1 &&
             end.array_params.length === 0)
    {
      group[end.name] = function (first, second, data, args) {
        return call({ base: base, end: end, first: first, second: second, data: data },
             args);
      };
    }
    else if (end.url_params.length === 0 &&
             end.data_params.length === 0 &&
             end.array_params.length === 1)
    {
      group[end.name] = function (list, args) {
        return call({ base: base, end: end, list: list }, args);
      };
    }
    else if (end.url_params.length === 1 &&
             end.data_params.length === 0 &&
             end.array_params.length === 1)
    {
      group[end.name] = function (first, list, args) {
        return call({ base: base, end: end, first: first, list: list }, args);
      };
    }
    else if (end.url_params.length === 2 &&
             end.data_params.length === 0 &&
             end.array_params.length === 1)
    {
      group[end.name] = function (first, second, list, args) {
        return call({ base: base, end: end, first: first, second: second, list: list },
             args);
      };
    }
    else if (end.url_params.length === 0 &&
             end.data_params.length === 1 &&
             end.array_params.length === 1)
    {
      group[end.name] = function (data, list, args) {
        return call({ base: base, end: end, data: data, list: list }, args);
      };
    }
    else if (end.url_params.length === 1 &&
             end.data_params.length === 1 &&
             end.array_params.length === 1)
    {
      group[end.name] = function (first, data, list, args) {
        return call({ base: base, end: end, first: first, data: data, list: list },
             args);
      };
    }
    else if (end.url_params.length === 2 &&
             end.data_params.length === 1 &&
             end.array_params.length === 1)
    {
      group[end.name] = function (first, second, data, list, args) {
        return call({ base: base, end: end, first: first, second: second,
               data: data, list: list }, args);
      };
    }
    else
    {
      console.log('Skipping ' + end.group + '.' + end.name);
    }
  }

  function addChained()
  {
    $.pnut.all = {};
    addAll('getSubscriptions', $.pnut.channel.getUserSubscribed);
    addAllOne('getMessages', $.pnut.message.getChannel);
    addAllOne('getUserPosts', $.pnut.post.getUser);
    addAllOne('getFollowing', $.pnut.user.getFollowing);
    addAllList('getChannelList', $.pnut.channel.getList);
    addAllList('getUserList', $.pnut.user.getList);
  }

  function addAll(name, single)
  {
    $.pnut.all[name] = allFromSingle(single);
  }

  function addAllOne(name, single)
  {
    $.pnut.all[name] = function (target, args)
    {
      var callWithTarget = function (a) {
        return single(target, a);
      };
      return allFromSingle(callWithTarget)(args);
    };
  }

  function allFromSingle(single)
  {
    return function (args)
    {
      if (! args)
      {
        args = {};
      }
      args.count = 200;
      var result = [];

      function fetchMore(response)
      {
        if ($.wait !== undefined)
        {
          response = JSON.parse(response.toString());
        }
        result = result.concat(response.data);
        if (response.meta.more)
        {
          args.before_id = response.meta.min_id;
          var promise = single(args);
          return promise.then(fetchMore);
        }
        else
        {
          var meta = {};
          if (response.meta.max_id)
          {
            meta.max_id = response.meta.max_id;
          }
          return {
            data: result,
            meta: meta
          };
        }
      }

      var first = single(args);
      return first.then(fetchMore);
    };
  }

  function addAllList(name, single)
  {
    $.pnut.all[name] = function (list, args)
    {
      var start = 0;
      var end = start + (list.length < 200 ? list.length : 200);
      var result = [];

      function fetchMore(response)
      {
        if ($.wait !== undefined)
        {
          response = JSON.parse(response.toString());
        }
        result = result.concat(response.data);
        start += 200;
        end = start + (list.length < start + 200 ? list.length : 200);
        if (start < list.length)
        {
          var promise = single(list.slice(start, end), args);
          return promise.then(fetchMore);
        }
        else
        {
          return { data: result };
        }
      }

      var first = single(list.slice(start, end), args);
      return first.then(fetchMore);
    };
  }

  run($.pnut.endpoints);

}(jQuery));

/*
 * note.js
 *
 * Functions for manipulating app.net annotations
 *
 */

/*global jQuery: true */
(function ($) {
  'use strict';

  $.pnut.note.find = function (type, list)
  {
    var result = null;
    var i = 0;
    if (list)
    {
      for (i = 0; i < list.length; i += 1)
      {
        if (list[i].type === type)
        {
          result = list[i].value;
          break;
        }
      }
    }
    return result;
  };

}(jQuery));

