paste
=====

Paste-app is a pasteboard/pinboard running on the social networking platform app.net.  Paste-app is the brainchild of Jonathon Duerig, @duerig, and is based on his code from the first session in the Learning the app.net API 101 patter room:  
http://orbt.io/OrDC.pdf   
http://patter-app.net/room.html?channel=14380  

usage
-----

Each paste has a public link that can be viewed without logging in to app.net, as well as a "private" link which will display both the selected paste and a list of the logged-in user's recent pastes.  To create a new paste, you will need a (free) app.net account. 

sausage
-------

Pastes are messages in a user-created channel of type net.paste-app.clip.  The paste text itself is contained in an annotation of type net.paste-app.clip, while the message text contains the private link to the paste.  (The public link is a base 36 encoding of the channel and message IDs, which allows retrieval without authentication.)  You can direct the user to the private link (the paste-app.net website) to view the paste or retrieve the message yourself to display within an app.  The code is all client-side and available at github.  It requires mod_rewrite; see the .htaccess file.


libraries
---------

The app uses jquery, purl.js (for url handling), highlight.js (for code highlighting), and is based on Skeleton, a responsive HTML5 template.

