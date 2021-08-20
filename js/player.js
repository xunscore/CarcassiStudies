/**
 * Copyright (C) 2021, by XunScore contributors (xunscore@139.com)
 * Report bugs and download new versions at http://www.xunscore.cn/
 *
 * This library is distributed under the MIT License. See notice at the end
 * of this file.
 */
var stamps;
var version;
$("#player").on({
  play: function() {
    $("#play").css("display", "none");
    $("#pause").css("display", "inline");  
  },
  pause: function() {
    $("#play").css("display", "inline");
    $("#pause").css("display", "none");  
  },
  ended: function() {
    $("#play").css("display", "inline");
    $("#pause").css("display", "none");  
  },
  canplay: function() {  
    this.formattime = function(value) {
      var m = parseInt(value/60);
      var s = parseInt(value-m*60);  
      return (m<10?"0"+m.toString():m.toString())+":"+(s<10?"0"+s.toString():s.toString());
    };
    $("#play svg").attr("fill", "white");
    $("#pause svg").attr("fill", "white");
    $("#currenttime").css("color", "white");       
    $("#duration").css("color", "white").html(this.formattime(this.duration));         
    $("#zoomout svg").attr("fill", "white");       
    $("#zoomin svg").attr("fill", "white");  
    $("#thumbtack svg").attr("fill", "white"); 
  },    
  timeupdate: function() { 
    var second = this.currentTime;
    var low = 0;  
    var high = stamps.length-1;
    while (low<=high) {//lower_bound
      var mid = parseInt((high+low)/2);
      if (stamps[mid].second>=second) high = mid-1;
      else low = mid+1;
    }
    var cur = high<(stamps.length-1)?high:(stamps.length-1);
    if (stamps[cur]) {
      var indicator = $("#"+stamps[cur].slice);      
      indicator.attr("fill", "#007bff").attr("fill-opacity", 0.3);
      //if ($("#thumbtack")[0].scroll==null) window.scrollTo({top:$("#"+stamps[cur].slice).offset().top-window.innerHeight*0.2, behavior:"smooth"}); safari fail
      if ($("#thumbtack")[0].scroll==null) window.scrollTo({top:indicator[0].getBoundingClientRect().top+indicator[0].ownerDocument.defaultView.pageYOffset-window.innerHeight*0.2, behavior:"smooth"});
    }
    if (stamps[this.pre]&&(this.pre!=cur)) $("#"+stamps[this.pre].slice).attr("fill-opacity", 0);
    this.pre = cur;  
    //----
    $("#currenttime").html(this.formattime(this.currentTime));
    $("#playbar").css("width",this.currentTime/this.duration*100+"%");     
  }  
});
$("#play").click(function() { 
  if ($("#play svg").attr("fill")!="white") return;  
  player.play();
});
$("#pause").click(function() { 
  if ($("#play svg").attr("fill")!="white") return;  
  player.pause();
});
$("#seekbar").click(function(event) { 
  if ($("#play svg").attr("fill")!="white") return;  
  player.currentTime = player.duration*event.offsetX/$("#seekbar").width();
});
$("#zoomout").on({
  click: function() {
    if (this.zoom==null) {
      var width =　parseInt($("#scorepanel>svg").attr("width"))-1;
      $("#scorepanel>svg").attr("width", width+"%");
    }
  },
  mousedown: function() {
    this.zoom = setInterval(function() {  
    var width =　parseInt($("#scorepanel>svg").attr("width"))-1;
      $("#scorepanel>svg").attr("width", width+"%");
    }, 100);
  },
  mouseup: function() {
    clearInterval(this.zoom);  
    this.zoom = null;
  }
});
$("#zoomin").on({
  click: function() {
    if (this.zoom==null) {
      var width =　parseInt($("#scorepanel>svg").attr("width"))+1;
      $("#scorepanel>svg").attr("width", width+"%");
    }
  },
  mousedown: function() {
    this.zoom = setInterval(function() {  
    var width =　parseInt($("#scorepanel>svg").attr("width"))+1;
      $("#scorepanel>svg").attr("width", width+"%");
    }, 100);
  },
  mouseup: function() {
    clearInterval(this.zoom);  
    this.zoom = null;
  }
});
$("#thumbtack").on({
  click: function() {
    this.scroll = this.scroll?null:true;
  }
});
$("#open").on({
  click: function() {
    $("#file").click();
  }
});

function fromCharCode(data) { 
  var res = "";
  var chunk = 8*1024;
  var i;
  for (i=0; i<data.length/chunk; i++) res+=String.fromCharCode.apply(null, data.slice(i*chunk, (i+1)*chunk));
  res+=String.fromCharCode.apply(null, data.slice(i*chunk));
  return res
}
function uzip(result) { 
  var zip = new ZipFile(result);
	var data = zip.read("json");
	if (!data) { $("#scorepanel").get(0).innerHTML += "<H1 style='color:white'>410</H1>";	return; }		  
	var json = JSON.parse(String.fromCharCode.apply(null, data));
  version = json.version?parseInt(json.version.split(".").join("")):100;
  stamps = json.stamps;  
  $("#scorepanel").get(0).innerHTML="";
 	var pnb=1; 	
  while (data=zip.read((pnb++)+".svg")) $("#scorepanel").get(0).innerHTML += fromCharCode(data);
  $("#scorepanel>svg").attr("width", "95%").css("background-color", "white").css("box-shadow", "0px 0px 10px rgba(0, 0, 0, 1)").before($("<div style='height: 30px;'/>"));
  $("#scorepanel>svg:last").attr("width", "95%").css("box-shadow", "0px 0px 10px rgba(0, 0, 0, 1)").after($("<div style='height: 10px;'/>"));
	if (data=zip.read("mp3")) $("<source/>").attr("src", URL.createObjectURL(new Blob([data],{type:"audio/mpeg"}))).attr("type","audio/mpeg").prependTo($("#player"));
	else if (data=zip.read("oga")) $("<source/>").attr("src", URL.createObjectURL(new Blob([data],{type:"audio/ogg"}))).attr("type","audio/ogg").prependTo($("#player"));
}
function request(file) {
  if (arguments.length) {
    var fileReader = new FileReader();
    fileReader.onload = function(event) { uzip(event.target.result); };
    fileReader.readAsArrayBuffer(file);
  } else {
    var avg = function(key) {
      var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)","i");
      var r = window.location.search.substr(1).match(reg);
      if (r!=null) return (r[2]); return null;
    }
    if (avg("url")==null) return;
    $.ajax({
	    url: decodeURIComponent(avg("url")),
    	type: "GET",
    	dataType: 'binary',
    	responseType:'arraybuffer',
    	processData: false,
    	success: function (result) { uzip(result); },
    	error: function (xhr, ajaxOptions, thrownError) {
    	  $("#scorepanel").get(0).innerHTML += "<H1 style='color:white'>404</H1>";
    	}
    });
  }
  $("#open").css("display", "none");  
}
/**
 * Copyright (c) 2021 XunScore contributors
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
