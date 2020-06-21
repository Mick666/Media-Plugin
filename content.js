
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//       if( request.message === "page_was_changed" ) {
//         console.log(window.location.toString())
//       }
//     }
//   );
chrome.storage.local.get({disableLinks: true}, function(data){
    if (data.disableLinks && window.location.toString() !== "https://app.mediaportal.com/dailybriefings/#/briefings")  document.body.addEventListener("mouseover", func)
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
    if (event.target.parentElement.href && /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.href)) {
        event.target.parentElement.href = ""
    } else if (event.target.parentElement.href && event.target.parentElement.parentElement.href && /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.parentElement.href)) {
        event.target.parentElement.href = ""
    } else if (event.target.parentElement && 
            event.target.parentElement.parentElement &&
            event.target.parentElement.parentElement.parentElement &&
            event.target.parentElement.parentElement.parentElement.parentElement &&
            event.target.parentElement.parentElement.parentElement.parentElement.href && 
            /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.parentElement.parentElement.parentElement.parentElement.href)) {
        event.target.parentElement.parentElement.parentElement.parentElement.href = ""
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
        if (request.action === "getHighlightedText") {
            sendResponse({copy: window.getSelection().toString()});
        } else if (request.action === "highlight") {
            highlightBroadcastItems()
        }
    });
        
function highlightBroadcastItems() {
    const headlines = document.body.getElementsByClassName("headline mp-page-ellipsis headerRow");
    for (let i = 0; i < headlines.length; i++) {
        if ((/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/).test(headlines[i].firstChild.innerText) 
            && (headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === "fa-volume-up" || 
            headlines[i].parentElement.lastChild.children[1].children[2].children[0].classList[2] === "fa-video")) {
                    headlines[i].firstChild.innerHTML = headlines[i].firstChild.innerHTML
                    .replace(/^(?:[^ ]+[ ]+){0,2}[A-Z]{2,}/gi, function(match) {
                        return '<span style="background-color:#FDFF47;">' + match + "</span>";
                    });
            }
    }
}