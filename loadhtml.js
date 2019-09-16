var reportSpan = document.getElementById("report-span");
var hideSpan = document.getElementById("hide-span");


function onLoad() {

    var canvCheck = document.getElementById('heatMapCanvas')
    if(canvCheck != null){x
        reportSpan.style.display = "none"
        hideSpan.style.display = "block"
    } else {
        hideSpan.style.display = "none"
        reportSpan.style.display = "block"
    }

    console.log('done setting html')
    
}

