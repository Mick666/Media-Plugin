//  To set the clipboard's text, we need to use a background html page with a dummy field we can set the value of.
//  To get the highlighted text though, we need to send a message to the content.js file, and get the text in the response.
//  Some of these are to save typing, so we don't need to send the message to the content.js file.
chrome.commands.onCommand.addListener(function (command) {
    console.log(command)
    if (command === "paste") {
        getHighlightedText(command)
    } else if (command === "similar_coverage") {
        copy("", command)
    } else if (command === "agd_syndication") {
        copy("", command)
    }  else if (command === "abc_pastecleaning") {
        getHighlightedText(command)
    }
});
// This sets the clipboard based on the key combination, cleaning it up in some cases, setting it to a commonly used term in others.

function copy(str, setting) {
    var sandbox = document.getElementById('sandbox');
    if (setting === "paste") {
        sandbox.value = str.replace(/\n/g, " ").replace(/^ /, "").replace(/  /g, " ");
    } else if (setting === "similar_coverage") {
        sandbox.value = "Similar coverage reported by: "
    } else if (setting === "agd_syndication") {
        sandbox.value = "Also in other publications"
    } else if (setting === "abc_pastecleaning") {
        sandbox.value = str.split('\n').filter(x => x.length > 0 && 
            (x.endsWith(".") || 
            x.endsWith("\"") || 
            x.endsWith("!") || 
            x.endsWith("?") ||
            x.endsWith("\'")
            ))
        .join(" ")
    }
    sandbox.select();
    document.execCommand('copy');
    sandbox.value = ('');
}

// This gets the highlighted text from the webpage.
function getHighlightedText(setting) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
          console.log(response);
          copy(response.copy, setting)
        });
      });
}