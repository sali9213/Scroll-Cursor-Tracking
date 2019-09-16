//define two variables to store mouse position
var positionX;
var positionY;

//listen mouse event
document.onmousemove = function(e) {
  //get the mouse position in fully rendered content area in the browser
  var x = e.clientX + pageXOffset;
  var y = e.clientY + pageYOffset;
  positionX = x > document.documentElement.scrollWidth ? document.documentElement.scrollWidth : x;
  positionY = y > document.documentElement.scrollHeight ? document.documentElement.scrollHeight : y;
  console.log(document.elementFromPoint(e.clientX, e.clientY));
  // positionX = e.clientX;
  // positionY = e.clientY;
};

//use following flag to track whether mouse is currently in the content area,
//will pause recording if mouse leaves this area and resume when it comes back
var mouseIsInBrowsingArea = true;
document.onmouseenter = function(e) {
  mouseIsInBrowsingArea = true;
};
document.onmouseleave = function(e) {
  mouseIsInBrowsingArea = false;
};

//store mouse position in chrome local storage as an array
function getNewMousePosition() {
  //don't record if mouse is not in content area
  if (!mouseIsInBrowsingArea || !positionX || !positionY) {
    console.log('not recording data');
    return;
  }
  //represent current mouse position as an array with a length of 2
  var newPointArray = [positionX, Math.round(positionY)];
  //will store all positions we get in chrome local storage as key value pair,
  //key is "mouseMovementArray", value is a two dimensional array,
  //each time we get a position, we push it into this big array
  //if it is the very first position we've got, we will need to create this array
  chrome.storage.local.get(["mouseMovementArray"], function(result) {
    if (
      typeof result.mouseMovementArray !== "undefined" &&
      result.mouseMovementArray instanceof Array
    ) {
      //not the first point, just push it into the array
      result.mouseMovementArray.push(newPointArray);
    } else {
      //this is the first point we got, put it in an array and assign it to result.mouseMovementArray
      result.mouseMovementArray = [newPointArray];
    }
    //store the modified array back to chrome local storage
    chrome.storage.local.set({ mouseMovementArray: result.mouseMovementArray });
  });
}

//set an interval of 0.1s to continuously execute this function to get positions
var intervalId = setInterval(getNewMousePosition, 100);
//store the interval id in local storage, will need to clear the interval through this id when needed
chrome.storage.local.set({ intervalId: intervalId });
