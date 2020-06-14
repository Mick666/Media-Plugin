
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//       if( request.message === "page_was_changed" ) {
//         console.log(window.location.toString())
//       }
//     }
//   );

document.body.addEventListener("wheel", x => console.log(x))
// arr1.filter(x => x.className === "" && x.style.paddingLeft)

function func(event) {
    if (event.target.href && (/app\.mediaportal\.com\/#\/connect\/media-contact/.test(event.target.href) || /app\.mediaportal\.com\/#connect\/media-outlet/.test(event.target.href))) {
        event.target.href = ""
    }
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        sendResponse({copy: window.getSelection().toString()});
    });
