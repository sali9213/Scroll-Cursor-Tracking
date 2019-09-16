// get all DOM element for later use
var startButton = document.getElementById("start");
var startIcon = document.getElementById("start-icon");
var pauseButton = document.getElementById("pause");
var pauseIcon = document.getElementById("pause-icon");
var clearButton = document.getElementById("clear");
var clearIcon = document.getElementById("clear-icon");
var clearSpan = document.getElementById("clear-span");
var reportButton = document.getElementById("report");
var reportIcon = document.getElementById("report-icon");
var reportSpan = document.getElementById("report-span");
var reportLoader = document.getElementById("report-loader");
var hideSpan = document.getElementById("hide-span");

//start recording function
function addMousemovementListener() {
  //hide start button, show pause button
  startButton.style.display = "none";
  pauseButton.style.display = "block";
  //keep recording status (currrently recording or not) in the chrome local storage,
  //if not, this status will be lost when popup window is closed
  chrome.storage.local.set({ recording: true });
  //tell background script to update current domain
  chrome.tabs.getSelected(function(tab) {
    var url = new URL(tab.url);
    chrome.runtime.sendMessage({ currentHost: url.hostname });
  });

  //execute main recording function
  chrome.tabs.executeScript({
    file: "addEventListener.js"
  });
}

//stop recording function
function removeMousemovementListener() {
  //hide pause button, show start button
  startButton.style.display = "block";
  pauseButton.style.display = "none";
  //change recording status to "stop"
  chrome.storage.local.set({ recording: false });
  //stop recording
  chrome.tabs.executeScript({
    file: "removeEventListener.js"
  });
}

//clear data function
function clearData() {
  //stop recording in case user forgot to stop it
  chrome.storage.local.get(["recording"], function(result) {
    if (result.recording === true) {
      removeMousemovementListener();
    }
  });
  //clear recorded data stored in chrome local storage
  chrome.tabs.executeScript({
    file: "clearData.js"
  });
}

//create report function
function createReport() {
  //show loader
  reportIcon.style.display = "none";
  reportSpan.style.display = "none";
  hideSpan.style.display = "none";
  reportLoader.style.display = "block";
  //stop recording in case user forgot to stop it
  chrome.storage.local.get(["recording"], function(result) {
    if (result.recording === true) {
      removeMousemovementListener();
    }
  });
  //show alert if user has not recorded any data yet
  chrome.storage.local.get(["mouseMovementArray"], function(result) {
    if (!result.mouseMovementArray || result.mouseMovementArray.length === 0) {
      alert("There are no data captured yet, please start recording");
    }
  });
  //create report
  chrome.tabs.executeScript({
    file: "createReport.js"
  });
}
//when popup window loads, check recording status
//in order to decide whether to show 'start' button or 'pause' button
var currentHost;

window.onload = function() {
  chrome.storage.local.get(["recording"], function(result) {
    if (result.recording === true) {
      startButton.style.display = "none";
      pauseButton.style.display = "block";
    } else {
      startButton.style.display = "block";
      pauseButton.style.display = "none";
    }
  });
};

//add eventlisteners for click event on all four buttons, executed above functions accordingly
startButton.addEventListener("click", addMousemovementListener);
pauseButton.addEventListener("click", removeMousemovementListener);
clearButton.addEventListener("click", clearData);
reportButton.addEventListener("click", createReport);

//create report script will send a message when it has completed the task,
//we can hide the loader upon receiving this message
chrome.runtime.onMessage.addListener(function(request) {
  if (request.createdReport) {
    reportIcon.style.display = "block";
    // reportSpan.style.display = "block";
    reportLoader.style.display = "none";
    hideSpan.style.display = "block"
  }

  if (request.hiddenReport) {
    reportIcon.style.display = "block";
    reportSpan.style.display = "block";
    reportLoader.style.display = "none";
    // hideSpan.style.display = "none"
  }
});
