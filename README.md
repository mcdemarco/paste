paste
=====

Paste away at http://paste.mcdemarco.net.

blurb
-----

Paste allows you to create and view short text clippings using pnut.io. Each paste has a public link that can be viewed without logging in to pnut.io, but an pnut.io account is required to create pastes.  Logged-in users also see a list of their own recent pastes.

about
-----

Paste-app is a pasteboard/pinboard currently running on the social networking platform pnut.io.  Originally built for app.net, Paste-app is the brainchild of Jonathon Duerig, @duerig, and is based on his code from the first session in the Learning the app.net API 101 patter room:  
http://orbt.io/OrDC.pdf   
http://patter-app.net/room.html?channel=14380

usage
-----

Each paste has a public link that can be viewed without logging in to pnut.io, as well as a "private" link which will display both the selected paste and a list of the logged-in user's recent pastes.  To create a new paste, you will need a (free) pnut.io account.  Pastes now have an optional title, type, and tags.

sausage
-------

Pastes are messages in a user-created channel of type net.paste-app.clip.  The paste text itself is contained in an annotation of type net.paste-app.clip, while the message text contains the private link to the paste.  (The public link is a base 36 encoding of the channel and message IDs, which allows retrieval without authentication.)  You can direct the user to the private link (the paste-pnut.io website) to view the paste or retrieve the message yourself to display within an app.  The code is all client-side and is available at github, but you will need either mod_rewrite (the .htaccess file) or Amazon-style rerouting (the .aws-routing file) to resolve paste urls.


libraries
---------

The app uses appnet.js, jquery, mustache.js, purl.js (for url handling), highlight.js (for code highlighting), and Skeleton, a responsive HTML5 template.  The ransom note font used in the images is BlackCasper by AllencHIU cHIU.



