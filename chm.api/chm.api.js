if($.browser.msie){

	alert('SORRY\nNot Yet Available for Internet Explorer.');
history.back();
$('document').hide();
	
}

	

$(document).ready(function(){

var data = new Array();
$.Data = data;
var numSem=0;
$.ReadJSONData=function(id, src, data){
numSem++;
$.getJSON(src, function(data) {	
	$.Data[id] = data.annotations;
	$(this).remove();
	consoleLog('Annotation Data Retrieved from '+src);
	numSem--;
	if(numSem==0) 
		$.loadAll();
});
}	

var loading=$('<strong/>')			
			.css('top','2%')
			.css('left','0%')
			.css('text-align','center')
			.css('position','absolute')
			.text("Please wait while generating the Hypervideo. This may take some time.");
var imglogo=$('<img/>')			
			.css('bottom','4%')
			.css('width', '100px')
			.css('left','30%')
			.attr('src','chm.api/res/chmlogo.PNG')
			.attr('class','ui-corner-all')
			.css('position','absolute')
			
var wait=$('<div id="waitLoading"/>')
		.prependTo('body')	
		.css('background','white')
		.append(loading)
		.append(imglogo)		
		.dialog({
			autoOpen: true,
			draggable: false,
			resizable:false,
			width: '300',
			height:'100',
			modal: true,
			open: function(event, ui) { $('#waitLoading').parent().children(".ui-dialog-titlebar").hide(); }})

$("[chm\\:component='region']").each( function(){
	var self=this;
	$(self).attr('class','spregion');
});
$("[chm\\:component='videoplayer']").each( function(){
	var self=this;
	if($(self).attr('id')=='') {$(self).attr('id','vpAutoID'+i);i++}

	synchAttr='';
	playerCSS=$(self).attr('style');
	if($(self).attr('chm:timelineref'))
	synchAttr="data-mediasync='"+$(self).attr('chm:timelineref')+"' data-timecontainer='par' data-timeaction='none'";
	
	consoleLog('Initialising The Video Element...'); 
	$(self).replaceWith("<div id="+$(self).attr('id')+"  class='player_container'  style='position:relative;  overflow:visible;'"+synchAttr+" data-playercss="+playerCSS+">" +
                             "<video  id="+$(self).attr('id')+"media preload='true' autoplay='false' style='overflow:visible; width:98%; height:auto; border:thick #00FF00; top:10; bottom:10;right:10;left:10; ' src='" + 
							 $(self).attr('chm:src') + "'></video></div>");

//$(this).remove();
consoleLog('-----> Video element:'+$(self).attr('id')+' ready. Src='+$(self).attr('chm:src'));
});
	
$("[chm\\:component='jsonreader']").each( function(){
	var self=this;
	consoleLog('Getting The Annotation Data from '+$(self).attr('chm:src')+' ...');
	$.ReadJSONData($(self).attr('id'), $(self).attr('chm:src'), data);
});

$("[chm\\:component='annotationreader']").each( function(){
consoleLog('Getting The Annotation Data from '+$(this).attr('chm:src')+' ...');
idd=$(this).attr('id');
src=$(this).attr('chm:src');
$.Data[idd] =src;
	
$(this).remove();
consoleLog('Data Retrieved from '+src);
	
});




EVENTS.onSMILReady(function() {
  consoleLog("SMIL data parsed, starting 'hashchange' event listener.");
  checkHash(); // force to check once at startup
  EVENTS.onHashChange(checkHash);
});

});


$._formatTime = function( seconds, ms) {
	if(!seconds) seconds=0;
	if (ms) seconds = parseInt(seconds / 1000);
	
    var h = parseInt(seconds / 3660);
    var m = parseInt((seconds / 60)-(h*60));
    var s = Number(seconds % 60).toPrecision(3);

    var hp = h >= 10 ? '' : '0';
    var mp = m >= 10 ? '' : '0';
    var sp = s >= 10 ? '' : '0';
    return hp + h + ':' + mp + m + ":" + sp + s
};

$.loadAll = function( ) {
consoleLog("LOADING THE COMPONENTS");
$("*[chm\\:component]").each( function(){
var self=this;
component=$(self).attr('chm:component');
	data=$(this).attr('chm:src');
	title=$(this).attr('title');
	filter=$(this).attr('chm:filter');
	tlref=$(this).attr('chm:timelineref');
	content=$(this).attr('chm:content');
	mediasync=$(this).attr('chm:timelineref')+'media';//
	param=$(this).attr('chm:param');
	target=$(this).attr('chm:target');
	container = $(this).attr('chm:container');
	spregion = $(this).attr('chm:region');
	style = $(this).attr('style');
switch (component){
	case 'toc':  //////////////// TableOfContent                                 
		consoleLog("Loading a ToC!");
		var tocItems=$('<div/>');
		$.tmpl( $.ToCLevelTemplate({"level":1,"filter":filter,"href":"${media}#t=${begin},${end}","target":"timedmedia", "content":content}), $.Data[data] ).appendTo(tocItems);
		$(tocItems).hvToC({'tocTitle':title, 'tlref':tlref, 'style':style});
		$(this).remove();
		consoleLog("The ToC is Ready!");
		break;
		
	case 'textviewer': //////////////// TextViewer
		consoleLog("Preparing the Text Viewers");
		tag="{{if "+filter+"}}<div data-begin=${$._formatTime(begin,true)}  data-end=${$._formatTime(end,true)} style='display: none;'>"+content+"</div>{{/if}}";
		$.template( "TextViewerTemplate", tag );
		var textItems=$('<div data-mediasync="#'+mediasync+'" data-timecontainer="par" data-timeaction="display"/>');
		$.tmpl("TextViewerTemplate", $.Data[data]).appendTo($(textItems));
		$(this).append(textItems);
		//$(this).draggable();
		consoleLog("Text Viewers Ready!");
		break;
		
	case 'richtextviewer': //////////////// RichTextViewer
		consoleLog("Preparing the Rich Text Viewer");
		tag="{{if "+filter+"}}<p data-begin=${$._formatTime(begin,true)}  data-end=${$._formatTime(end,true)}>"+content+"</p>{{/if}}";
		$.template( "richtextTemplate", tag );
		var richtextItems=$('<div data-timecontainer="par" data-mediasync="#'+mediasync+'"  data-timeaction="display" style="overflow:visible;  z-index:99"/>');
		$.tmpl("richtextTemplate", $.Data[target]).appendTo(richtextItems);
		src=$.Data[data];
		prefix='&format=json&callback=?';
		$(richtextItems).EnrichedText({'baseURL':src,'prefix':prefix});
		$(this).append(richtextItems);
		consoleLog("Rich Text Viewer Ready!");
		break;
		
	case 'map'://////////////// Map
	type=$(this).attr('chm:screenshot');
	if(type=="false"){
		consoleLog("Preparing the Textual Hypervideo Maps");
		tag="{{if "+filter+"}}<tr><td><a href='${media}#t=${begin},${end}' chm:timelineref='"+tlref+"' target='timedmedia'>"+content+"</a></td></tr>{{/if}}";
		$.template("mapTemplate", tag );
		var mapItems=$('<table/>');
		$.tmpl("mapTemplate", $.Data[$(this).attr('chm:src')]).appendTo(mapItems);
		$(this).append(mapItems);//.draggable();
		consoleLog("Textual Hypervideo Maps!");
	}
	//////////////// GraphicMap
	else{
		consoleLog("Preparing the Graphic Hypervideo Maps");
		tag="{{if "+filter+"}}<div> <div style='text-align: center'> <a href='${media}#t=${begin},${end}' chm:timelineref='"+tlref+"' target='timedmedia'> <img class='screenshot' src='"+param+"' /> </a> </div></div><br/><span style='text-align:center; color:red'>"+content+"</span><br/>{{/if}}";
		$.template( "shotTemplate", tag );
		var tr=$('<tr>');
		var td=$('<td>');
		var shotItems=$('<div/>');
		$.tmpl("shotTemplate", $.Data[$(this).attr('chm:src')]).appendTo(shotItems);
		$(this).append(shotItems);//.draggable();
		consoleLog("Graphic Hypervideo Maps Ready!");		
	}
	break;
	
	case 'imageviewer':
		consoleLog("Preparing Image Viewers!");
		tag="{{if "+filter+"}}<img  src="+content+"  data-begin=${$._formatTime(begin,true)}  data-end=${$._formatTime(end,true)} style='width:100%;'>{{/if}}";
		$.template( "imageTemplate", tag );
		var figItems=$('<div data-timecontainer="excl" data-timeaction="display" data-mediasync="#'+mediasync+'"></div>');
		$.tmpl("imageTemplate", $.Data[$(this).attr('chm:src')]).appendTo(figItems);
		$(this).append(figItems);//.draggable();
		consoleLog("Image Viewers Ready!");
		break;
		
	case 'caption': //////////////// Textual captions over the Player
		consoleLog("Preparing the Hypervideo Captions");
		container=$('<div class="ui-corner-all ui-video-captions" data-timecontainer="par" data-timeaction="display" data-mediasync="#'+mediasync+'"/>');
		consoleLog("a");
		tag="{{if "+filter+"}}<div data-begin=${$._formatTime(begin,true)}  data-end=${$._formatTime(end,true)}>"+content+"</div>{{/if}}";consoleLog("b");
		$.template( "captionsTemplate", tag );consoleLog("c");
		$(this).remove();consoleLog("d");
		player=$("[id='"+$(self).attr('chm:timelineref')+"']");consoleLog("e");
		$(container)
			.append($.tmpl("captionsTemplate", $.Data[$(this).attr('chm:src')]))
			.appendTo(player);consoleLog("f");
		consoleLog("Hypervideo Captions Ready!");	
		break;
		
	case 'hotspot':
		consoleLog("Parsing the Document Hotspots!");
		tag="{{if "+filter+"}}<div href='${parsed.url}' data-begin=${$._formatTime(begin,true)}  data-end=${$._formatTime(end,true)} style='"+content+"'  ></div>{{/if}}";
		$.template( "hotspotTemplate", tag );
		var hotspotItems=$('<div/>');
		$.tmpl("hotspotTemplate", $.Data[$(this).attr('chm:src')]).appendTo(hotspotItems);		
		container=$('<div data-timecontainer="excl" data-timeaction="display" data-mediasync="#'+mediasync+'"    style="display: block;" />');
		$(hotspotItems).children().each(function(){
		$(container).append($(this).hvHotSpot());
		});
		$('.player_container').append(container);
//$(document).trigger('DomReady');
		$(hotspotItems).remove();
		$(this).remove();
		consoleLog("Hotspots Ready!");
		break;


	case 'timeline':
		consoleLog("Preparing the Hypervideo Timeline");
		var timeline=$('<div/>');

		$(this).children("'chm\\:component'='track'").each( function(){
		data=$(this).attr('chm:src');
		filter=$(this).attr('chm:filter');
		tlref=$(this).attr('chm:timelineref');
		content=$(this).attr('chm:content');
		mediasync=$(this).attr('chm:timelineref')+'media';//
		param=$(this).attr('chm:param');
		target=$(this).attr('chm:target');
		container = $(this).attr('chm:container');
		spregion = $(this).attr('chm:region');
		style = $(this).attr('style');
		 var track=$('<div class="tltrack">');
		tag="{{if "+filter+"}}<div   href='${href}' media='${media}' begin=${begin} end=${end} "+param+"></div>{{/if}}";
		$.template( "timelineTemplate", tag );
		$.tmpl("timelineTemplate", $.Data[$(this).attr('chm:src')]).appendTo(track);
		$(timeline).append(track);

		});

		$(timeline).hvTimeline({'container':$(this)});	
		consoleLog("Hypervideo Timeline Ready!");
		break;	
	
}

});

consoleLog("Initializing the Advene Player!");
$(document).advene();
consoleLog("Advene Player Ready!");

// ===========================================================================
// Parse Video Links
// ===========================================================================
consoleLog("Parsing the Hypervideo Links!");
$("[target='timedmedia']").each( function() {
                var data = /(.+)#t=([.\d]+)?,([.\d]+)?/.exec($(this).attr('href'));

                if (data) {
                    $(this).attr( { 'data-player-id': $(this).attr('chm:timelineref'),
									'data-video-url': data[1],
                                    'data-begin': data[2]/1000,
                                    'data-end': data[3]/1000
                                  });
                    if (!$(this).attr("title"))
                        $(this).attr("title", $._formatTime(data[2],true) + " - " + $._formatTime(data[3],true));
                    $(this).attr('href', '#');
                    $(this).click(function() {
                        return false;
                    });
                    if (video_url == "")
                        video_url = data[1];
                }
               $(this).advene('overlay');
            });
consoleLog("Hypervideo Links Ready!");
consoleLog("COMPONENTS LOADED");

consoleLog("Parsing Timed Content");
  consoleLog("SMIL/HTML Timing: startup");
  EVENTS.onMediaReady(parseAllTimeContainers);
  parseAllMediaElements();
consoleLog("Timed Content Ready!");


$('#waitLoading').dialog("close");

};



/*
    Hypervideo Table Of Content
*/
(function($){
$.ToCLevelTemplate = function(options) {
      options = $.extend({
	  level: 1,
	  filter:'1',
	  href:'#',
	  target:'_self',
	  content:'toc'
   }, options || {});
   
   
return "{{if "+options.filter+"}}<CHML:TOC-LEVEL"+options.level+ " href="+options.href+ " >"+options.content+"</CHML:TOC-LEVEL"+options.level+">{{/if}}";

};
$.fn.hvToC = function(options) {

      options = $.extend({
      tocBaseTag:'CHML:TOC-LEVEL',
      tocWidth: '220px',
      tocTitle: 'ToC',
	  tlref:'#',
      topLevel: 1,
      lowLevel  : 3,
	tocParent: 'body',
	tocDrag : 'true',
	style:' '
   }, options || {});

   // create the TOC wrapper and attach it to the document
   $(options.tocParent).append('<div class="ui-widget-content toc_wrapper ui-corner-all"></div>');

   $('.toc_wrapper').css('width',options.tocWidth).append(
      (options.tocTitle?'<div class="toc_header ">'+ options.tocTitle + '</div>':'') +
      '<div class="toc_body"></div>'
   );
   $('.toc_wrapper').attr('style',$('.toc_wrapper').attr('style')+options.style);

   var theTOC = $('.toc_wrapper .toc_body ');
   var start=options.lowLevel;


	var baseTagRE = new RegExp( '^' + options.tocBaseTag + '\\d+$' );


   this.children().each(function(i) {
      tocItemLevel = this.nodeName.substr(14);
      if(
		this.nodeName.match(baseTagRE)
      	&& tocItemLevel >= options.topLevel
      	&& tocItemLevel <= options.lowLevel
      	&& this.nodeName.substr(14) < start
      ) {
      	start = this.nodeName.substr(14);
     	}
		if (start == options.topLevel) {
		   return false;
		}
	});
	options.topLevel=start;
	var tocItemClass='toc_item';

   this.children().each(function(i) {
      tocItemLevel = this.nodeName.substr(14);
      if(
         this.nodeName.match(baseTagRE)
         && tocItemLevel >= options.topLevel
         && tocItemLevel <= options.lowLevel
      ) {
         href = $(this).attr('href')?$(this).attr('href'):"#";
         target = $(this).attr('target')?$(this).attr('target'):"timedmedia";
		 ref=$(this).attr('chm:timelineref');
         theTOC.append('<a class='+tocItemClass+' target="'+target+'" chm:timelineref="'+options.tlref+
		 '" href="'+ href +'" style="margin-left: ' + (tocItemLevel-options.topLevel)*1 +'em;" ' +
            (tocItemLevel != options.topLevel ? 'class="marker" ': '') +
            '>'+ $(this).text() +'</a>' );
         
      }
   });
theTOC.children('.toc_item').each(function(){
	$(this).attr('title',$(this).attr('target'));
});
  if(options.tocDrag)  $('.toc_wrapper');//.draggable();
   return this;
}
})(jQuery);


/*
    Hypervideo Anchors
*/
(function($){
$.fn.hvHotSpot = function(options) {
      options = $.extend({
	href:' ',
	hotspotTitle:' ',
	style:' ',
	begin:'0',
	end:'0'
   }, options || {});

options.href=$(this).attr('href');

options.begin=$(this).attr('data-begin');
options.end=$(this).attr('data-end');

options.hotspotTitle=$(this).attr('alt');
options.style=$(this).attr('style');//" top:8; left:30%;width:20%;height:40%;";


var HS=$("<a class='ui-corner-all' data-begin="+options.begin+" data-end="+options.end+"  href='"+options.href+"' style=' position:absolute; background-color:#CCC;overflow:visible; opacity: .3; "+options.style+"'></a>");


$(HS).attr('style',$(HS).attr('style')+' '+options.style);
 $(HS).hover(
				function() {$(this).css('opacity','.5');},
				function() {$(this).css('opacity','.3');}
			);


   return (HS);
}
})(jQuery);



/*
    Hypervideo TimeLine
*/
(function($){
$.fn.hvTimeline = function(options) {
        options = $.extend({
	  container: 'body',
	  mediaDuration:1020
   }, options || {});

 var duration = options.mediaDuration;

this.children().each(function() {
$(this).children().each(function(i) {
	dur = parseInt(parseInt($(this).attr('end'))/1000);
	if(dur > parseInt(options.mediaDuration))
		options.mediaDuration = dur + 10;
});
});

numberOfTracks = this.children('.tltrack').size(); 
duration = (parseInt(options.mediaDuration));

$("body").append("<div id='timeline' style='position:fixed;bottom:3;right:0;padding:0;margin:0; width:98%'><div id='video_visualisation' ></div><div id='slider-range'></div><div style='display:none;'>    <label for='scale'>Scale</label>    <input type='range' min='1' step='0.01' id='scale' value='1' />    <label for='scroll'>Scroll</label>    <input type='range' min='0'  step='0.01' id='scroll' value='0' /></div></div>");

      var options = {
						'height':100, 
						'width':$("#timeline").width(),
						'scaleHeight':30,
						'scaleBackgroundColor':'#a50000', 
						'scaleColor':'#ccc',
						'backgroundColor':'#E7E2DE',
						'textColor':'#eee',
						'cursorColor':'#000',
						'maxScaleFactor':1,
						'numberOfTracks':this.children().size(),
						'periodShape':'rectangle',
						'cursorHeight':100, 
					}




var timeline = new Timeline('tmmedia', 'video_visualisation', duration, options, 'scale', 'scroll');
var Colors = ['green','red','blue','yellow','aqua','grey','pink','olive'];
this.children().each(function(j) {
var color=Colors[j];
$(this).children().each(function(i) {
	item={
			"title" : "Scene"+i,
			"start" : new Date($(this).attr('begin')),
			"link" : $(this).attr('media')+'#'+$(this).attr('begin')+'-'+$(this).attr('end'),
			"icon" : $(this).attr('img'),
			"description" : "The movie they think they're making... isn't a movie anymore."
		};

 timeline.addPeriod($(this).attr('begin')/1000, $(this).attr('end')/1000, color,j+1);   

 });
});
  $("#slider-range" ).slider({
      range: true,
      min: 0.0,
      max: 100.0,
      rangeDrag: true,
      values: [ 0.0, 100.0 ],
      slide: function( event, ui ) {
          var ratio = (100 - (ui.values[1]-ui.values[0]))/100 
          var min_scale = parseFloat($('#scale').attr('min'))
          var max_scale = parseFloat($('#scale').attr('max'))
          document.getElementById('scale').setAttribute('value', ratio*(max_scale-min_scale)+min_scale);
          var event = document.createEvent("HTMLEvents");
          event.initEvent("change", true, true);
          document.getElementById('scale').dispatchEvent(event)
          var max_scroll = parseFloat($('#scroll').attr('max'))
          document.getElementById('scroll').setAttribute('value', ui.values[0]/100*max_scroll);
      }
  });

   return this;

}

})(jQuery);




/*
    Hypervideo Rich Text 
*/

(function($){
$.fn.EnrichedText = function(options) {
	options = $.extend({
	container:'body',
	baseURL:'#',
	prefix:''		
   }, options || {});
   
   
   
    this.children().each(function(i) {

	var elt=$(this);
	title=$(this).text();
	$(this).text('');
	$.getJSON(options.baseURL+title+options.prefix, function(data){
	
	var info;
   var link ;
   var p;
   var desc;
   var text;
       //make a link to the document
	   if(data.parse){
        info = $('<p/>');
        link = $('<a/>');
        $(link).attr('target', options.baseURL+title+options.prefix);
        p = $('<p/>');
        p.html(data.parse.displaytitle);
        $(link).append(p);
        // get the first 300 characters of the wiki content
        desc = $('<p/>');
        text = data.parse.text["*"].substr(data.parse.text["*"].indexOf('<p>'));
        text = text.replace(/((<(.|\n)+?>)|(\((.*?)\) )|(\[(.*?)\]))/g, "");
		length= 250;
		pad="...";
		if(text.length < 250) {length=text.length;pad=" ";}
        $(desc).html(text.substr(0, length ) + pad);
        $(info).append(link)
        	   .append(desc);
        $(elt).append(info);
		}
        
    }); ///////// end getJson

    
    });///////// end each child

}

})(jQuery);


