var stanza = require ("./modules/stanza/stanza")
var fs = require ('fs');
var log = require ("./modules/log");
var Client = require('node-xmpp-client');
var client = new Client ({
	"jid": process.env.JID,
	"password": process.env.JID_PWD
});
var nlp = require ("./modules/nlp");
var commandParser = require ('./modules/commands');

client.connection.on ("data", function (data) { 
	//log.info (data);
});
client.on ("online", function () { 
	log.info ("online");
	client.send('<presence/>')
});
client.on ("error", function (e) { 
	log.info ("error: " + e);
});
client.on ("stanza", function (sta) { 
	stanza.parse (sta);
});
stanza.Presence.on ("subscribe", function (attrs) { 
	client.send (stanza.Presence.acceptSubscription (attrs.from));
})
stanza.Message.on ("message", function (attrs, body) { 
	var lines = body.split ("\n");
	if (lines [0].trim ().substring (0, 4) == "?OTR") { 
		client.send (stanza.Message.send (attrs.to, attrs.from, "I will support OTR soon!"));
	} else {
		log.info ("not otr");
		var words = body.split (" ");
		log.info (words.length);
		if (words.length >= 2) { 
			var cmd = words.slice (0, 2).join ("_");
			var file = "commands/" + cmd + ".js";
			if (!fs.existsSync (file)) {
				var p = nlp.parse (body),
					cmd = p.map (function (x) { return x.key.replace (" ", "_"); }).join ("_"),
					file = "commands/" + cmd + ".js";
				if (fs.existsSync (file)) {
					file = "commands/not_found.js";
				}
			}
			try {
				commandParser.parse (file);
			} catch (e) {
				log.info ("Failed to parse: (" + file + "):" + e);
			}
		}
		/*
		client.send (stanza.Message.send (attrs.to, attrs.from, "This are the commands I understood: " + p.map (function (x) { return x.key; }).join (", ")));
		var verbs = p.map ((x) => { return x.verbs.map ((v) => { return v.text; }).join (" ") }),
			people = p.map ((x) => { return x.people.map ((p) => { return p.text; }).join (" ") }),
			nouns = p.map ((x) => { return x.nouns.map ((n) => { return n.text; }).join (" ") });

		client.send (stanza.Message.send (attrs.to, attrs.from, "Verbs: " + verbs + "\nNouns: " + nouns + "\nPeople: " + people));
		*/
	}
});
