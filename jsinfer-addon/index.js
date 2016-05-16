/*
var self = require("sdk/self");

// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
function dummy(text, callback) {
  callback(text);
}

exports.dummy = dummy;
*/

var buttons = require('sdk/ui/button/action');
var tabs = require("sdk/tabs");
var self = require("sdk/self");

var button = buttons.ActionButton({
  id: "mozilla-link",
  label: "Infer Types for JS",
  icon: {
    "16": "./JSL.png",
    "32": "./JSL.png",
    "64": "./JSL.png"
  },
  onClick: handleClick
});

function handleClick(state) {
  tabs.open(self.data.url("sample.html"));
  tabs.on('ready', function(tab){
  var worker = tab.attach({
      contentScriptFile: [self.data.url("reflect.js"),self.data.url("TypeInference.js")]
  });
});

}
