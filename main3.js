/*
variables
*/
var model;
var canvas;
var classNames = [];
var canvas;
var coords = [];
var mousePressed = false;
var mode;

/*
prepare the drawing canvas 
*/
$(function() {
    canvas = window._canvas = new fabric.Canvas('canvas');
    canvas.backgroundColor = '#ffffff';
    canvas.isDrawingMode = 0;
    canvas.freeDrawingBrush.color = "Black";
    canvas.freeDrawingBrush.width = 15;
    canvas.renderAll();
    //setup listeners 
    canvas.on('mouse:up', function(e) {
        mousePressed = false
    });
    canvas.on('mouse:down', function(e) {
        mousePressed = true
    });
    canvas.on('mouse:move', function(e) {
        recordCoor(e)
    });
})

/*
set the table of the predictions 
*/
function setTable(top1, probs) {
    //loop over the predictions 
    for (var i = 0; i < top2.length; i++) {
        let sym = document.getElementById('sym' + (i + 1))
        let prob = document.getElementById('prob' + (i + 1))
        sym.innerHTML = top1[i]
        prob.innerHTML = Math.round(probs[i] * 100)
    }

}

/*
record the current drawing coordinates
*/
function recordCoor(event) {
    var pointer = canvas.getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer)
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates 
    var coorX = coords.map(function(p) {
        return p.x
    });
    var coorY = coords.map(function(p) {
        return p.y
    });

    //find top left and bottom right corners 
    var min_coords = {
        x: Math.min.apply(null, coorX),
        y: Math.min.apply(null, coorY)
    }
    var max_coords = {
        x: Math.max.apply(null, coorX),
        y: Math.max.apply(null, coorY)
    }

    //return as strucut 
    return {
        min: min_coords,
        max: max_coords
    }
}

/*
get the current image data 
*/
function getImageData() {
        //get the minimum bounding box around the drawing 
        const mbb = getMinBox()

        //get image data according to dpi 
        const dpi = window.devicePixelRatio
        const imgData = canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
                                                      (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
        return imgData
    }


/*
get the the class names 
*/
function getClassNames(indices) {
    var outp = []
    for (var i = 0; i < indices.length; i++)
        outp[i] = classNames[indices[i]]
    return outp
}

/*
load the class names 
*/
async function loadDict() {
    // if (mode == 'ar')
    //     loc = 'model2/class_names_ar.txt'
    // else
    var loc = 'model1/class_names.txt'
    
    await $.ajax({
        url: loc,
        dataType: 'text',
    }).done(success);
}

/*
load the class names
*/
function success(data) {
    const lst = data.split(/\n/)
    for (var i = 0; i < lst.length - 1; i++) {
        let symbol = lst[i]
        classNames[i] = symbol
    }
}

/*
get indices of the top probs
*/
function findIndicesOfMax(inp, count) {
    var outp = [];
    for (var i = 0; i < inp.length; i++) {
        outp.push(i); // add index to output array
        if (outp.length > count) {
            outp.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            outp.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    return outp;
}


/*
preprocess the data
*/
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor 
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1)
        
        //resize 
        const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()
        
        //normalize 
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resized.div(offset));

        //We add a dimension to get a batch shape 
        const batched = normalized.expandDims(0)
        return batched
    })
}

/*
load the model
*/

async function start(cur_mode) {
    //arabic or english
    mode = cur_mode
    
    //load the model 
    model = await tf.loadLayersModel('model1/model.json')
    
    //warm up 
    model.predict(tf.zeros([1, 28, 28, 1]))
    
    //allow drawing on the canvas 
    allowDrawing()
    
    //load the class names
    await loadDict()
}

/*
allow drawing on canvas
*/
function allowDrawing() {
    canvas.isDrawingMode = 1;
    // if (mode == 'en')
    //     document.getElementById('status').innerHTML = 'Model Loaded';
    // else
    //     document.getElementById('status').innerHTML = 'تم التحميل';
    // $('button').prop('disabled', false);
}

/*
clear the canvs 
*/
function erase() {
    canvas.clear();
    document.getElementById("test").innerHTML=""; 
    document.getElementById("testA").style.visibility="hidden";
    document.getElementById("testB").style.visibility="hidden";
    document.getElementById("testA2").style.visibility="hidden";
    canvas.backgroundColor = '#ffffff';
    coords = [];
}



function predict(){

    const imgData = getImageData()
    const pred = model.predict(preprocess(imgData)).dataSync()
    const indices = findIndicesOfMax(pred, 1)
    const names = getClassNames(indices)

    // console.log(names);
    if(names =="flower"){
        document.getElementById("test2").innerHTML="That is flower"; 
   
        setTimeout('window.location.href="drB.html";',1000);

    }
        
     
    else{
        document.getElementById("test").innerHTML="Sorry, I don't know what's that"; 
        document.getElementById("testA").style.visibility="visible";
        document.getElementById("testB").style.visibility="visible";
        document.getElementById("testA2").style.visibility="visible";
    

    }
     

}