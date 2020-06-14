
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//       if( request.message === "page_was_changed" ) {
//         console.log(window.location.toString())
//       }
//     }
//   );
chrome.storage.local.get({disableLinks: true}, function(data){
    if (data.disableLinks)  document.body.addEventListener("mouseover", func)
})
// arr1.filter(x => x.className === "" && x.style.paddingLeft)

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.disableLinks === "switch") {
            switchLinkDisabler();
        }
    }
)

function func(event) {
    if (event.target.href && (/app\.mediaportal\.com\/#\/connect\/media-contact/.test(event.target.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.href))) {
        event.target.href = ""
    }
}

function switchLinkDisabler() {
    chrome.storage.local.get({disableLinks: true}, function(data){
        if (data.disableLinks)  document.body.addEventListener("mouseover", func)
        else document.body.removeEventListener("mouseover", func)
    })
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        sendResponse({copy: window.getSelection().toString()});
    });
 