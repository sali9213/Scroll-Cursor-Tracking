//get the intervalId stored in chrome local storage by 'addEventListener.js',
//clear the interval and that "recording" function will stop executing
var intervalId;
chrome.storage.local.get(["intervalId"], function(result) {
  intervalId = result.intervalId;
});
clearInterval(intervalId);
