console.log(1)
chrome.commands.onCommand.addListener(function (command) {
    console.log(command)
    if (command === "paste") {
        var clipboardContent = getContentFromClipboard();
        sendPasteToContentScript(clipboardContent.replace(/\n/g, " ").replace(/^ /, ""), "paste")
    } else if (command === "toggle-feature-foo") {
        var clipboardContent = "Similar coverage appears in: "
        sendPasteToContentScript(clipboardContent, "note")
    } else if (command === "agd_syndication") {
        var clipboardContent = "Also in other publications"
        sendPasteToContentScript(clipboardContent, "note")
    }  else if (command === "abc_pastecleaning") {
        var clipboardContent = getContentFromClipboard();
        clipboardContent = clipboardContent.split('\n').filter(x => x.length > 0 && (x.endsWith(".") || x.endsWith("\"") || x.endsWith("!") || x.endsWith("?"))).join(" ")
        sendPasteToContentScript(clipboardContent, "paste")
    }
});

function getContentFromClipboard() {
    var result = '';
    var sandbox = document.getElementById('sandbox');
    sandbox.value = '';
    sandbox.select();
    if (document.execCommand('paste')) {
        result = sandbox.value;
        // console.log('got value from sandbox: ' + result);
    }
    sandbox.value = '';
    return result;
}

/**
 * Send the value that should be pasted to the content script.
 */
function sendPasteToContentScript(toBePasted, msg) {
    // We first need to find the active tab and window and then send the data
    // along. This is based on:
    // https://developer.chrome.com/extensions/messaging
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {data: toBePasted, message: msg});
    });
}