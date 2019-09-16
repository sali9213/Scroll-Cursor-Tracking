function simpleheat(canvas) {
  if (!(this instanceof simpleheat)) return new simpleheat(canvas);

  this._canvas = canvas = typeof canvas === 'string' ? document.getElementById(canvas) : canvas;

  this._ctx = canvas.getContext('2d');
  this._width = canvas.width;
  this._height = canvas.height;

  this._max = 100;
  this._data = [];
}

simpleheat.prototype = {

  defaultRadius: 25,

  defaultGradient: {
      0.4: 'blue',
      0.6: 'cyan',
      0.7: 'lime',
      0.8: 'yellow',
      1.0: 'red'
  },

  data: function (data) {
      this._data = data;
      return this;
  },

  max: function (max) {
      this._max = max;
      return this;
  },

  add: function (point) {
      this._data.push(point);
      return this;
  },

  clear: function () {
      this._data = [];
      return this;
  },

  radius: function (r, blur) {
      blur = blur === undefined ? 15 : blur;

      // create a grayscale blurred circle image that we'll use for drawing points
      var circle = this._circle = this._createCanvas(),
          ctx = circle.getContext('2d'),
          r2 = this._r = r + blur;

      circle.width = circle.height = r2 * 2;

      ctx.shadowOffsetX = ctx.shadowOffsetY = r2 * 2;
      ctx.shadowBlur = blur;
      ctx.shadowColor = 'black';

      ctx.beginPath();
      ctx.arc(-r2, -r2, r, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fill();

      return this;
  },

  resize: function () {
      this._width = this._canvas.width;
      this._height = this._canvas.height;
  },

  gradient: function (grad) {
      // create a 256x1 gradient that we'll use to turn a grayscale heatmap into a colored one
      var canvas = this._createCanvas(),
          ctx = canvas.getContext('2d'),
          gradient = ctx.createLinearGradient(0, 0, 0, 256);

      canvas.width = 1;
      canvas.height = 256;

      for (var i in grad) {
          gradient.addColorStop(+i, grad[i]);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1, 256);

      this._grad = ctx.getImageData(0, 0, 1, 256).data;

      return this;
  },

  draw: function (minOpacity) {
      if (!this._circle) this.radius(this.defaultRadius);
      if (!this._grad) this.gradient(this.defaultGradient);

      var ctx = this._ctx;

      ctx.clearRect(0, 0, this._width, this._height);

      // draw a grayscale heatmap by putting a blurred circle at each data point
      for (var i = 0, len = this._data.length, p; i < len; i++) {
          p = this._data[i];
          ctx.globalAlpha = Math.min(Math.max(p[2] / this._max, minOpacity === undefined ? 0.05 : minOpacity), 1);
          ctx.drawImage(this._circle, p[0] - this._r, p[1] - this._r);
      }

      // colorize the heatmap, using opacity value of each pixel to get the right color from our gradient
      var colored = ctx.getImageData(0, 0, this._width, this._height);
      this._colorize(colored.data, this._grad);
      ctx.putImageData(colored, 0, 0);

      return this;
  },

  _colorize: function (pixels, gradient) {
      for (var i = 0, len = pixels.length, j; i < len; i += 4) {
          j = pixels[i + 3] * 4; // get gradient color from opacity value

          if (j) {
              pixels[i] = gradient[j];
              pixels[i + 1] = gradient[j + 1];
              pixels[i + 2] = gradient[j + 2];
          }
      }
  },

  _createCanvas: function () {
      if (typeof document !== 'undefined') {
          return document.createElement('canvas');
      } else {
          // create a new canvas instance in node.js
          // the canvas class needs to have a default constructor without any parameter
          return new this._canvas.constructor();
      }
  }
};

//get all the data we've collected from chrome local storage
chrome.storage.local.get(["mouseMovementArray"], function(result) {

  var canvCheck = document.getElementById('heatMapCanvas')
  if(canvCheck != null){
      canvCheck.remove();
      chrome.runtime.sendMessage({ hiddenReport: true });
      return;
  }
  //return if we don't have any data yet
  if (!result.mouseMovementArray || result.mouseMovementArray.length === 0) {
    chrome.runtime.sendMessage({ createdReport: true });
    return;
  }
  //create a two dimensional array to store how many times each pixel has been touched by mouse
  //since we use pixel as unit, this array will have a length of "screen height",
  //each subarray in it will have a length of " screen width"
  // var lineNumber = window.innerHeight;
  // var rowNumber = window.innerWidth;

  var lineNumber = document.documentElement.scrollHeight + 1;
  var rowNumber = document.documentElement.scrollWidth + 1;

  var arrangedData = new Array(rowNumber);
  for (let i = 0; i < arrangedData.length; i++) {
    arrangedData[i] = new Array(lineNumber).fill(0);
  }
  // initialize all values in this array to be 0
  // for (let i = 0; i < arrangedData.length; i++) {
  //   for (let j = 0; j < arrangedData[i].length; j++) {
  //     arrangedData[i][j] = 0;
  //   }
  // }
  //traverse mouse position array we've collected,
  //find its position in the array created above(use i as positionX and j as positionY) and increase count number by 1
  var rawData = result.mouseMovementArray;
  for (let i = 0; i < rawData.length; i++) {
    arrangedData[rawData[i][0]][rawData[i][1]]++;
  }
  //now the arragedData array contains information of which point has been touched how many times,
  //traverse this array, find the max touched times in order to calculate a relative alpha value
  //e.g, position (100,100) has been touched 100 times
  var max = 0;
  for (let i = 0; i < arrangedData.length; i++) {
    for (let j = 0; j < arrangedData[i].length; j++) {
      if (arrangedData[i][j] > max) {
        max = arrangedData[i][j];
      }
    }
  }
  //prepare two canvas,
  //alphaCanvas is used to generate a Grayscale image,
  //outputCanvas is for colored heatmap after we've finished drawing on alphaCanvas
  //each canvas has a height and width equal to the screen's
  // var alphaCanvas = document.createElement("canvas");
  var outputCanvas = document.createElement("canvas");

    outputCanvas.id = 'heatMapCanvas'
    outputCanvas.style.position = 'absolute'
    outputCanvas.style.overflow = 'visible'
    outputCanvas.style.left="0px"
    outputCanvas.style.top="0px"
    outputCanvas.style.width=document.documentElement.scrollWidth+"px"
    outputCanvas.style.height=document.documentElement.scrollHeight+"px"
    outputCanvas.style.zIndex="2000"
    outputCanvas.style.opacity = 0.8
    outputCanvas.height = document.documentElement.scrollHeight;
    outputCanvas.width = document.documentElement.scrollWidth;

  var ctxOutput = outputCanvas.getContext("2d");


  var heat = simpleheat(outputCanvas)

  heat.max(max)

  rawData.forEach(element => {  
    heat.add([element[0], element[1], 1])
  });

  heat.draw(0.2);

  document.body.appendChild(outputCanvas)
  

  //tell popup.js report has been created
  chrome.runtime.sendMessage({ createdReport: true });
});
