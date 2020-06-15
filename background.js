//  To set the clipboard's text, we need to use a background html page with a dummy field we can set the value of.
//  To get the highlighted text though, we need to send a message to the content.js file, and get the text in the response.
//  Some of these are to save typing, so we don't need to send the message to the content.js file.
const commandObj = {"static-text-1":0, "static-text-2":1, "static-text-3":2, "static-text-4":3, "static-text-5":4, "static-text-6":5, "static-text-7":6, "static-text-8":7, "static-text-9":8, "t_static-text-10":9}
chrome.commands.onCommand.addListener(function (command) {
    console.log(command)
    if (command === "1_paste") {
        getHighlightedText(command)
    } else if (command === "2_abc") {
        getHighlightedText(command)
    } else {
        copy("", command)
    } 
});
// This sets the clipboard based on the key combination, cleaning it up in some cases, setting it to a commonly used term in others.

function copy(str, setting) {
    var sandbox = document.getElementById('sandbox');
    if (setting === "1_paste") {
        sandbox.value = str.replace(/\n/g, " ").replace(/^ /, "").replace(/  /g, " ");
        sandbox.select();
        document.execCommand('copy');
        sandbox.value = ('');
    } else if (setting === "2_abc") {
        sandbox.value = str.split('\n').filter(x => x.length > 0 && 
            (x.endsWith(".") || 
            x.endsWith("\"") || 
            x.endsWith("!") || 
            x.endsWith("?") ||
            x.endsWith("\'")
            ))
        .join(" ")
        sandbox.select();
        document.execCommand('copy');
        sandbox.value = ('');
    } else {
        chrome.storage.local.get({staticText: ["Similar coverage reported by: ", "Also in other publications"]}, function(result) {
            console.log(result)
            console.log(setting);
            sandbox.value = result.staticText[commandObj[setting]]
            sandbox.select();
            document.execCommand('copy');
            sandbox.value = ('');
          });
    } 
    // else if (setting === "static-text-2") {
    //     sandbox.value = "Also in other publications"
    // } 
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

function getContentFromClipboard() {
    var result = '';
    var sandbox = document.getElementById('sandbox');
    sandbox.value = '';
    sandbox.select();
    if (document.execCommand('paste')) {
        result = sandbox.value;
        console.log('got value from sandbox: ' + result);
    }
    sandbox.value = '';
    return result;
}