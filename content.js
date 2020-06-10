
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//       if( request.message === "page_was_changed" ) {
//         console.log(window.location.toString())
//       }
//     }
//   );

document.body.addEventListener("mouseover", func)

function func(event) {
    if (event.target.href && (/app\.mediaportal\.com\/#\/connect\/media-contact/.test(event.target.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.href))) {
        event.target.href = ""
    }
}

function insertTextAtCursor(text) {
    var el = document.activeElement;
    var val = el.value;
    var endIndex;
    var range;
    var doc = el.ownerDocument;
    console.log(window.getSelection().toString())
    if (typeof el.selectionStart === 'number' &&
        typeof el.selectionEnd === 'number') {
        endIndex = el.selectionEnd;
        el.value = text
        el.selectionStart = el.selectionEnd = endIndex + text.length;
    }
}

function insertNoteAtCursor(text) {
    var el = document.activeElement;
    var val = el.value;
    var endIndex;
    var range;
    var doc = el.ownerDocument;
    console.log(window.getSelection().toString())
    if (typeof el.selectionStart === 'number' &&
        typeof el.selectionEnd === 'number') {
        endIndex = el.selectionEnd;
        el.value = text
        el.selectionStart = el.selectionEnd = endIndex + text.length;
    }
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.data&& request.message === "paste") {
        insertTextAtCursor(request.data);
    } else if (request.data && request.message === "note") {
        insertNoteAtCursor(request.data)
    }
});
