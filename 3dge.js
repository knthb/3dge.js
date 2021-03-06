/**********
 * 3dge.js
 * Original found at github.com/knth-b/3dge.js
 * Diagram 1 found at:
 * 
 */


/**
 * edge: a simple library for 3d rendering.
 * Contains a Camera constructor, an unimplemented Light constructor, and a World  Constructor.
 */
var edge = (function () {
    'use strict';
    var qPI = Math.PI/4;
    var hPI = Math.PI/2;
    var tPI = Math.PI/3;
    var sPI = Math.PI/6;
    /**
     * Creates a camera to view the 3d World
     * @constructor
     * @param {number} x - x Coordinate of the Camera
     * @param {number} y - y Coordinate of the Camera
     * @param {number} z - z Coordinate of the Camera
     * @param {number[]} d - angular direction camera is facing, all angles are in radians.  
     * @param {number} d[0] - rotation about z axis ('x' rotation)
     * @param {number} d[1] - rotation about x axis ('y' rotation)
     * @param {number} d[2] - rotation about y axis (end viewing rectangle rotation)
     * @param {number} vvA - vertical viewing angle of Camera
     * @param {number} hvA - horizontal viewing angle of Camera
     * @param {number} vD -  directional viewing distance
     * @param {Object} [flags] - an object with a couple flags to toggle.
     */
    //better rounding function from MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
    var niceRound = function(number, precision) {
    var factor = Math.pow(10, precision);
    var tempNumber = number * factor;
    var roundedTempNumber = Math.round(tempNumber);
    return roundedTempNumber / factor;
};

    var Camera = function(x,y,z,d,vvA,hvA,vD, flags){
        //Assign all of the parameters
        this.x = x;
        this.y = y;
        this.z = z;
        this.d = d;
        this.vvA = vvA;
        this.hvA = hvA;
        this.vD = vD;
        //make an object holding this so I can access it in other scopes.
        var self = this;
        /**
         * @constructor
         */
        this.ViewRect = function(){
            //set width and height based on viewing angle and z distance for a rectangle
            this.width = 2 * self.vD / Math.tan(self.hvA / 2);
            this.height = 2 * self.vD / Math.tan(self.vvA / 2);
            //initalize the point that is the center of the farthest viewing rectangle.
            this.x = self.x;
            this.y = self.y;
            this.z = self.z;
            //console.log("The D is", d);
            this.hAngle = d[0];
            this.vAngle = d[1];
            this.aAngle = d[2];
            var cosHAngle = niceRound(Math.cos(this.hAngle), 3);
            var sinHAngle = niceRound(Math.sin(this.hAngle), 3);
            var cosVAngle = niceRound(Math.cos(this.vAngle), 3);
            var sinVAngle = niceRound(Math.sin(this.vAngle), 3);
            var cosAAngle = niceRound(Math.cos(this.aAngle), 3);
            var sinAAngle = niceRound(Math.sin(this.aAngle), 3);
            console.log("sin and cos of AAngle are", sinAAngle, cosAAngle);
            console.log("this.z is",this.z);
            this.x = this.x + self.vD * cosHAngle * sinVAngle;
            this.y = this.y + self.vD * sinHAngle * sinVAngle;
            this.z = this.z + self.vD * cosVAngle;
            console.log("this.z is",this.z);
            this.vrVector = [ (this.x - self.x) / (this.y - self.y), (this.z - self.z) / (this.y - self.y)];
            this.rectVector = [ -1 / this.vrVector[0], -1 / this.vrVector[1]];
            this.rect = {
                zZ: this.z,
                minX: -this.width/2,
                minY: -this.height/2,
                maxX: this.width/2,
                maxY: this.height/2,
                get mXS(){ return this.minX/this.zZ;},
                get mYS(){ return this.minY/this.zZ;},
                get MXS(){ return this.maxX/this.zZ;},
                get MYS(){ return this.maxY/this.zZ;}
            };
            this.get2dPathArray = function(wor, canvas){
                //console.log(this.rect);
                var tdpa = [];
                var woA = wor.objectArray;
                //iterate through every object in the world Array
                for(var i = 0; i < woA.length; i ++){
                    var currentVertices = woA[i].vertices;
                    //iterate through all the vertices
                    var thisObs2dPathArray = [];
                    for(var j = 0; j < currentVertices.length; j ++){
                        var cV /*ertex*/  =currentVertices[j];
                        var a = cV[0];
                        var b  = cV[1];
                        var c = cV[2];
                        console.log("Current Vertices are", cV);
                        //see diagram 1 to see angle naming
                        var dist = Math.sqrt( (a - self.x) * (a - self.x) + (b - self.y) * (b - self.y) + (c - self.z)*(c - self.z));
                        console.log("dist is",dist);
                        var cosTheta = (c - self.z) / dist;
                        var sinTheta = Math.sin(Math.acos(cosTheta));
                        var sinBeta = (b - self.y) / (dist * sinTheta);
                        var cosBeta = (a - self.x) / (dist * sinTheta);
                        console.log("cos and sin of theta are", cosTheta, "&", sinTheta);
                        console.log("cos and sin of beta are", cosBeta, "&", sinBeta);
                        //Rotating the vertex to align with the camera's view. Rotated about y-axis by this.hAngle radians, and about x-axis by this.vAngle radians.
                        //sin(a+b) = sin(a)*cos(b) + cos(a) * sin(b):
                        //cos(a+b) = cos(a)*cos(b) - sin(a) * sin(b):
                    
                        var sinBetaPlusHAngle = sinBeta * cosHAngle + cosBeta * sinHAngle;
                        var cosBetaPlusHAngle = cosBeta * cosHAngle - sinBeta * sinHAngle;
                        var sinThetaPlusVAngle = sinTheta * cosVAngle + cosTheta * sinVAngle;
                        var cosThetaPlusVangle = cosTheta * cosVAngle - sinTheta * sinVAngle;
                        console.log("sin and cos of H and V angles are", sinHAngle, cosHAngle, sinVAngle, cosVAngle);
                        var tV = [ //tV = transformed Vertex, shortened for easier typing
                            self.x + dist * cosBetaPlusHAngle * sinThetaPlusVAngle,
                            self.y + dist * sinBetaPlusHAngle * sinThetaPlusVAngle,
                            self.z + dist * cosThetaPlusVangle 
                            ];
                            console.log("tV is ",tV);
                        var newDist = Math.sqrt((tV[0] - this.x)*(tV[0] - this.x)+(tV[1] - this.y)*(tV[1] - this.y));
                        var sinAlpha = tV[0] / newDist;
                        var cosAlpha = tV[1] / newDist;
                        var sinAlphaPlusAAngle = sinAlpha * cosAAngle + cosAlpha * sinAAngle;
                        var cosAlphaPlusAAngle = cosAlpha * cosAAngle - sinAlpha * sinAAngle;
                        tV[0] = newDist * cosAlphaPlusAAngle;
                        tV[1] = newDist * sinAlphaPlusAAngle;
                        var vrmx = tV[2]*this.rect.mXS;
                        var vrmy = tV[2]*this.rect.mYS;
                        var vrMx = tV[2]*this.rect.MXS;
                        var vrMy = tV[2]*this.rect.MYS;
                        console.log("vrmx is", vrmx,"and vrmy is", vrmy);
                        console.log("tV is",tV);
                        thisObs2dPathArray.push([(tV[0]-vrmx)/(vrMx-vrmx) * canvas.width,(tV[1]-vrmy)/(vrMy-vrmy) * canvas.height, tV[2]]);
                        console.log(thisObs2dPathArray);
                    }
                    tdpa.push(thisObs2dPathArray);
                }
                return tdpa;
            };

            this.slope = [this.rect.minX/this.z, this.y/this.z, 1/*this.z/this.z*/]; //I don't really know what this would be useful for...
            this.draw = function (world, canvas, context) {
                var ct = context;
                ct.clearRect(0,0,canvas.width,canvas.height);
                var wr = world;
                var tdpa = this.get2dPathArray(wr, canvas);
                /*
                tdpa = tdpa.sort(function(a, b){
                    return b[1] - a[1];
                });
                */
                //go through the objects in the World. Draw them with individual paths.
                var unprioritizedArray = [];
                console.log(wr.objectArray);
                console.log("tdpa is", tdpa);
                for (var i = 0; i < wr.objectArray.length; i ++){
                    console.log(wr.objectArray[i]);
                    var current2dObj  =tdpa[i];
                    console.log("Current 2d Obj is", current2dObj);
                    for (var j = 0; j < wr.objectArray[i].faces.length; j ++){
                        var currentFace = wr.objectArray[i].faces[j];
                        //console.log("current 2d face is", current2dFace);                      
                        //var current3dObj = wr.objectArray[i];
                        var runningSum = 0;
                        var subArray = [];
                        console.log("J IS", j);
                        console.log("Current Face is", currentFace);
                        for (var k = 0; k < currentFace.length; k++){
                            //console.log("current 2d face is", current2dFace); 
                            console.log(k + "CURFACE" + currentFace[k]);
                            console.log(current2dObj[currentFace[k]]);
                            subArray.push([current2dObj[currentFace[k]][0],current2dObj[currentFace[k]][1]]);
                            runningSum += current2dObj[currentFace[k]][2];
                        }
                        unprioritizedArray.push([subArray, runningSum / k]);
                    }
                }
                console.log(unprioritizedArray);
                //prioritize the array by sorting backwards by z values:
                var prioritizedArray = unprioritizedArray.sort(function(a,b){
                    return b[1] - a[1];
                    //return a[1] - b[1];
                });
                console.log(prioritizedArray);
                var pArrayWithPrioritiesRemoved = prioritizedArray.map(function(item){return item[0];});
                for (i = 0; i < pArrayWithPrioritiesRemoved.length; i ++){
                    ct.beginPath();
                    var current2dFace = pArrayWithPrioritiesRemoved[i];
                    ct.fillStyle = 'rgb('+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+','+Math.floor(Math.random()*256)+')';
                    //window.confirm("About to do " + current2dFace)
                    ct.moveTo(current2dFace[0][0],current2dFace[0][1]);
                    //ct.fillRect(current2dFace[0][0],current2dFace[0][1],10,10);
                    //window.confirm("Did a point " + current2dFace[0][0]+','+current2dFace[0][1]);
                    console.log("Moved to",current2dFace[0][0],current2dFace[0][1]);
                    for(var j = 0, l = current2dFace.length; j < l; j ++){
                        var k = (j + 1) % l;
                        //var k = j;
                        ct.lineTo(current2dFace[k][0],current2dFace[k][1]);
                        console.log("Drew line to:",current2dFace[k][0],current2dFace[k][1]);
                        //ct.fillRect(current2dFace[k][0],current2dFace[k][1],5,5);
                        //window.confirm("Did a point");
                    }
                    //ct.lineTo(current2dFace[0][0],current2dFace[0][0]);
                    ct.fill();
                    //window.confirm("Finished Step "+i);
                    console.log("Finsihed!");
                    //ct.closePath();
                }
                //window.confirm('DID SOMETHING COOL');
                
            };

        };
        this.vr = new this.ViewRect();
        this.moveTo = function(x,y,z){
            this.x = x;
            this.y = y;
            this.z = z;
            self = this;
            this.vr = new this.ViewRect();
        };
        this.rotateTo = function(xAng,yAng,zAng){
            this.d = [xAng,yAng,zAng];
            self = this;
            this.vr = new this.ViewRect();
        };
        
        this.render = function(World, Canvas, Context){
            this.vr.draw(World, Canvas, Context);
        };

    };
    /**
     * A light for this dark world
     * @constructor
     */
    var Light = function(){};
    /**
     * The world which everything resides in...
     * @constructor
     * @param {number} size - the Size of the world(a cube)
     * @param {number} [accuracy] - the power of 10 points in a world unit, defaults to 5
     */
    var World = function(size, accuracy){
        accuracy = (isNaN(parseInt(accuracy)) ? null : parseInt(accuracy));
        if(typeof accuracy !== 'number'){
            accuracy = 5;
        }
        this.biggestX = this.biggestY = this.biggestZ = size / 2 * accuracy;
        this.smallestX = this.smallestY = this.smallestZ = -1 * size / 2 * accuracy;
        this.objectArray = [];
        this.addObject = function(ObjectThing){
            this.objectArray.push(ObjectThing);
        };
        this.Presets = {
            create: function(objectType){
                //stuff
                var argvs = Array.prototype.slice.call(arguments,1);
                if(objectType === "Cube"){
                    var r = argvs[1];
                    var rot  = argvs[2];
                    var xRot = rot[0];
                    var zRot = rot[1];
                    this.center = argvs[0];
                    var x = this.center[0];
                    var y = this.center[1];
                    var z = this.center[2];
                    this.vertices = [
                        [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                        [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                        [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)],
                        [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                        [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                        [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)],
                        [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)],
                        [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)]
                        ];
                    this.vertices = this.vertices.map(function(current){return [niceRound(current[0],accuracy),niceRound(current[1],accuracy),niceRound(current[2],accuracy)];});
                        
                    this.edges = [
                        [0,1],
                        [0,2],
                        [0,3],
                        [1,4],
                        [1,5],
                        [2,5],
                        [2,6],
                        [3,4],
                        [3,6],
                        [4,7],
                        [5,7],
                        [6,7]
                    ];
                    this.faces = [
                        [0,1,4,3],
                        [0,2,5,1],
                        [1,5,7,4],
                        [6,7,4,3],
                        [6,3,0,2],
                        [2,6,7,5]
                    ];
                    this.moveTo = function(a,b,c){
                        this.center = [a,b,c];
                        var x = this.center[0];
                        var y = this.center[1];
                        var z = this.center[2];
                        this.vertices = [
                            [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                            [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                            [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)],
                            [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                            [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z + r * Math.cos(qPI + zRot)],
                            [x + r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)],
                            [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y + r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)],
                            [x - r * Math.cos(qPI + xRot) * Math.sin(qPI + zRot), y - r * Math.sin(qPI + xRot) * Math.sin(qPI + zRot), z - r * Math.cos(qPI + zRot)]
                            ];
                    };
                }
            }
        };
    };
    return {
        Camera: Camera,
        Light: Light,
        World: World
    };
})();

/*Pseudocode for making all points in sphere:
var sphere_points = [];
var r2 = Math.pow(r,2);
for(var i = x - r; i ++; i <= x + r){
    var i2 = (Math.pow(i,2)-Math.pow(x,2));
    for(var j = y - r; j++; j <= y + r){
        var j2 = (Math.pow(j,2)-Math.pow(y,2));
        if(i2+j2+k2 == r2){
            sphere_points.append()
        }
    }
}

*/
