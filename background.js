//use background script to keep track of current domain
//if domain changes, recording will pause until manually resume
var currentHost;

//listen for url change event
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  //only execute when user is currently recording mouse movement
  chrome.storage.local.get(["recording"], function(result) {
    if (result.recording) {
      //compare current domain and new domain
      //if not the same, pause recording and show alert
      if (changeInfo.url) {
        var url = new URL(changeInfo.url);
        if (url.hostname !== currentHost) {
          //update hostname
          currentHost = url.hostname;
          chrome.storage.local.set({ recording: false });
          alert(
            "Tracking has paused since change of domain, please click start to resume"
          );
        }
      }
    }
  });
});

chrome.runtime.onMessage.addListener(function(request) {
  if (request.currentHost) {
    currentHost = request.currentHost;
  }
});
