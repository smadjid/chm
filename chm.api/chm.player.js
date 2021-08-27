	$.widget("ui.video", {
		    // default options
		    options: {
		        VideoURL: "",
		        autoPlay: false,
		        loop: false,
		        autoBuffer: true,
		        volume: .25,
		        overlay: false,
		        fragmentPlay: false,
		        startPoint: 0,
		        endPoint: 0,
				tlroffset: 0,
		        endFragmentBehaviour: "continue",
				transcriptHighlight: true,
		        // Follow the transcription (dynamic montage)
		        transcriptFollow: false,
		        // Only 1 player at a time
		        singletonPlayer: true,
		        location: { 'left': 0, 'top': 0 }
		    },

		    _create: function() {
		        var self = this;
				self.mediaSlaves = new Array();
				self.tlroffset = self.options.tlroffset;
				
		MediaElement(self.element[0], {

            success: function(mediaElement, de) {

                // MediaElement has been successfully hooked. 
		        self.mediaElement = mediaElement;
		        self.mediaElement.options = self.options;

                self.options.transcriptHighlight = ($(".transcript", document).length > 0);
                self.options.transcriptFollow = ($(".transcriptFollow", document).length > 0);

                var videoOptions = {
                    autoplay: self.options.autoPlay,
                    controls: false,
                    loop: self.options.loop,
					poster:'chm.api/res/chmlogo.png',
                    autobuffer: self.options.autoBuffer
                };

                self._container = self.element.parent();
				self._playbackError = false;

                if (self.options.overlay)
                    self.options.fragmentPlay = true;

                self._oldVideooptions = {};

                $.each( videoOptions , function( key, value) {
                    if( value !== null ) {
                        // webkit bug
                        if (key == 'autoplay' && $.browser.webkit) {
                            value = false;
                        }
                        self._oldVideooptions[key] = self.element.attr( key );
                        self.element.attr( key, value );
                    }
                });

                // We can now define the methods that will handle player events.
		        self._stop = function() {
                    self.stop();
		            $(".activeTranscript").each( $(this).removeClass("activeTranscript") );
                };

                self._tooglePlayLoop = function() {
                    if (self.mediaElement.loop) {
                        self.mediaElement.loop=false;
                        self._playLoopButton.removeClass('ui-video-noplayLoop').addClass('ui-video-playLoop');
                    } else {
                        self.mediaElement.loop=true;
                        self._playLoopButton.addClass('ui-video-noplayLoop').removeClass('ui-video-playLoop');
                    }
                };

                self._stopfragmentplay = function() {
                    self.options.fragmentPlay=false;
                    self._stopFragmentLoop.hide();
                    self._container.parent().find(".ui-dialog-fragment-title").hide();
                    self._container.parent().find(".ui-dialog-fragment-title").text("Fragment play");
                };

                self._mute = function() {
                    var muted = self.mediaElement.muted = !self.mediaElement.muted;self.mediaElement.setMuted(muted);
                    self._muteButton
                        .toggleClass(self.options.overlay ? 'ui-icon-volume-on' : 'ui-video-mute', !muted)
                        .toggleClass(self.options.overlay ? 'ui-icon-volume-off' : 'ui-video-unmute', muted);
                };
                
                self.setVideoSize = function(x,y) {
		            self.mediaElement.setVideoSize(x,y);
	            };

	            self.getAspectRatio = function () {
	                if (self.mediaElement.videoHeight > 0)
		                return ( self.mediaElement.videoWidth / self.mediaElement.videoHeight )
	                else
                        return 1;
	            }
                self.play = function() {
                    self.mediaElement.play();
					self.forceStatus('play');
                };

                self.pause = function() {
                    self.mediaElement.pause();
					self.forceStatus('pause');
                };

                self.stop = function() {
                    this.fragmentLoop = false;
					self.setPlayingTime(0);					
					setTimeout(function() {
					self.mediaElement.pause();
					self._timeLinerSlider.slider('value', 0);
                    self._currentProgressSpan.text($._formatTime(0));
                    }, 100);
                    
		            $(".activeTranscript").each( $(this).removeClass("activeTranscript") );
                };

                self.mute = function() {
                    self.mediaElement.muted = true;
                };

                self.unmute = function() {
                    self.mediaElement.muted = false;
                };

                self.rewind = function() {
                    self.mediaElement.playbackRate -= 2;
                };

                self.forward = function() {
                    self.mediaElement.playbackRate += 2;
                };

                self.volume = function(vol) {
                    self.mediaElement.setVolume(Math.max(Math.min(parseInt(vol) / 100, 1), 0));
                };

                // Calculate the corresponding time of a timeline slider position
                self.timeline = function(pos) {
                    var duration = self.mediaElement.duration;
                    var pos = Math.max(Math.min(parseInt(pos) / 100, 1), 0);
                    self.mediaElement.setCurrentTime(duration * pos);
                };

                self.setPlayingTime = function(pos){
                    try{
                        self.mediaElement.setCurrentTime(pos);
                        self.play();
                    }
                    catch(e) { }
                };

                self.fragmentPlay = function(begin, end, endFragBehav) {
                    //self.mediaElement.load();
                    //setTimeout(function() {
                        self.options.endPoint = end > 0 ? end : self.mediaElement.duration;
                        self.options.startPoint = begin;
                        self.options.fragmentPlay = true;
                        self.options.endFragmentBehaviour = endFragBehav;
                        self._stopFragmentLoop.show();
                        self.setPlayingTime(begin);
                  //  }, 50);
                };

                //  Control bar instanciation
                self._createControls();

                self._container.hover(
                    $.proxy(self._showControls, self),
                    $.proxy(self._hideControls, self)
                );
                
                self._waitingContainer = $('<div/>', {'class': 'ui-corner-all ui-widget-content ui-video-waiting-container'});
                self._waiting = $('<div/>', {'class': 'ui-video-waiting'}).appendTo(self._waitingContainer);
				self._waiting.text("loading...");
                self._controls
                    .fadeIn(500)
                    .delay(100)
                    .fadeOut(800);
                
                self.mediaElement.setVolume(0.25);
                self._volumeSlider.slider('value', parseInt(self.mediaElement.volume * 100));

                // webkit bug
                if( self.options.autoPlay && $.browser.webkit ) {
                    self.play();
                }

                // Setting event listeners
                self.mediaElement.addEventListener('play', function(e) {
        	        self._playButton.addClass(self.options.overlay ? 'ui-icon-pause' : 'ui-video-pause').removeClass(self.options.overlay ? 'ui-icon-play' : 'ui-video-play');
				}, false);

                self.mediaElement.addEventListener('pause', function(e) {
			        self._playButton.removeClass(self.options.overlay ? 'ui-icon-pause' : 'ui-video-pause').addClass(self.options.overlay ? 'ui-icon-play' : 'ui-video-play');
				}, false);
				
				self.mediaElement.addEventListener('stop', function(e) {
				self._playButton.removeClass(self.options.overlay ? 'ui-icon-pause' : 'ui-video-pause').addClass(self.options.overlay ? 'ui-icon-play' : 'ui-video-play');
				}, false);

                self.mediaElement.addEventListener('progress', function(e) {
                    // FIXME: investigate or remove
                    return;
			        var lengthComputable = e.originalEvent.lengthComputable,
                    loaded = e.originalEvent.loaded,
                    total = e.originalEvent.total;
                    
                    if( lengthComputable ) {
                        var fraction = Math.max(Math.min(loaded / total,1),0);
                        this._bufferStatus.width(Math.max(fraction * self._timeLinerSliderAbsoluteWidth));
                    }
				}, false);

                self.mediaElement.addEventListener('seeked', function(e) {
			        self._hideWaiting();
				}, false);

                self.mediaElement.addEventListener('canplay', function(e) {
			        self._hideWaiting();
				}, false);

                self.mediaElement.addEventListener('loadstart', function(e) {
			        self._showWaiting('loading...');
				}, false);
                
                self.mediaElement.addEventListener('durationchange', function(e) {
			        self._showWaiting('loading...');
				}, false);
				
				self.mediaElement.addEventListener('abort', function(e) {
			        self._showWaiting('abort...');
				}, false);
                
                self.mediaElement.addEventListener('seeking', function(e) {
			        self._showWaiting('loading...');
				}, false);

                self.mediaElement.addEventListener('waiting', function(e) {
			        self._showWaiting('loading...');
				}, false);

                self.mediaElement.addEventListener('loadedmetadata', function(e) {
		            width= 320;
		            ratio= self.getAspectRatio();
		            height= width / ratio;
		            self.mediaElement.setVideoSize(width, height); 
					$('.ui-dialog').trigger('resizestop');
			        self._durationSpan.text($._formatTime(self.mediaElement.duration));
				}, false);
                
                
                
                self.mediaElement.addEventListener('click', function(e) {
		            self._playButton.trigger('click.video');
				}, true);
                
                self.mediaElement.addEventListener('error', function(e) {
			        var textError = "Playback Error";
                    if (! e.target.error)
                        return;
                    
                    switch (e.target.error.code) {
                    case e.target.error.MEDIA_ERR_ABORTED:
                        textError='You aborted the video playback.';
                        break;
                    case e.target.error.MEDIA_ERR_NETWORK:
                        textError='A network error caused the video download to fail part-way.';
                        break;
                    case e.target.error.MEDIA_ERR_DECODE:
                        textError='The video playback was aborted due to a corruption problem or because the video used features your browser did not support.';
                        break;
                    case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        textError='The video could not be loaded, either because the server or network failed or because the format is not supported.';
                        break;
                    default:
                        textError=textError+'An unknown error occurred.';
                        break;
                    }
                    self._showWaiting(textError);
					self._playbackError = true;
                    //self._waiting.show();
				}, false);
                
                self.mediaElement.addEventListener('timeupdate', function(e) {
		            if( ! self.mediaElement.seeking ) {
                        var duration = self.mediaElement.duration;
                        var currentTime = self.mediaElement.currentTime;
                        
                        if (self.options.fragmentPlay) {
                            if (currentTime < self.options.startPoint) {
                                self.mediaElement.setCurrentTime(self.options.startPoint)
                            } else if (currentTime > self.options.endPoint) {
                                switch(self.options.endFragmentBehaviour) {
                                case "continue":
                                    if (self.options.overlay) {
                                        self.mediaElement.setCurrentTime(self.options.startPoint);
                                        break;
                                    } else {
                                        self._stopfragmentplay();
                                        break;
                                    }
                                case "pause":
                                    self._stopfragmentplay();
                                    self.pause();
                                    break;
                                case "stop":
                                    self._stopfragmentplay();
                                    self.stop();
                                    break;
                                default: // 'loop' is the default behaviour
                                    self.setPlayingTime(self.options.startPoint);
                                }
                            }
                        }
                        
                        // Highlight/unhighlight elements by using the .activeTranscript class
                        if (self.options.transcriptHighlight)
                            $(".transcript[data-begin]", $(document)).each( function() {
                                if ($(this).hasClass('activeTranscript')) {
                                    if ((currentTime < $(this).attr('data-begin') 
                                         || currentTime > $(this).attr('data-end'))) {
                                        $(this).removeClass('activeTranscript');
                                        if (self.options.transcriptFollow) {
                                            // Get the next transcript node
                                            next = $(this).next().find(".transcript");
                                            if (! next.length)
                                                // The element could be inside a container.
                                                // FIXME: how many container levels should we take into account?
                                                next = $(this).parent().next().find(".transcript");
                                            if (next.length) {
                                                // A next node has been found. Go to it
                                                t = next[0].getAttribute('data-begin');
                                                // Only follow the timecode if new
                                                // time is sufficiently
                                                // different. This avoids infinite
                                                // looping when adjacent
                                                // annotations share the same
                                                // begin/end time
                                                if (Math.abs(t - $(this).attr('data-end')) > .5)
                                                    setTimeout(function() {
                                                        // FIXME: check data-video-url for multi-video case
                                                        self.setPlayingTime(t);
                                                    }, 200);
                                            } else {
                                                self.pause();
                                            }
                                        }
                                    }
                                } else {
                                    if ($(this).attr('data-begin') <= self.element[0].currentTime 
                                        && self.element[0].currentTime <= $(this).attr('data-end')) {
                                        $(this).addClass('activeTranscript');
                                    }
                                }
                            });
							
							
                        self._timeLinerSlider.slider(
                            'value',
                            [(currentTime / (self.mediaElement.duration)) * 100]
                        );
                        
                        self._durationSpan.text($._formatTime(self.mediaElement.duration));
						self._currentProgressSpan.text($._formatTime(currentTime));
                        self.forceSynchronization();
												
		
                    }
				}, false);
            }
        });
    },
	addSlaveNode: function(id){
	var self=this;
		self.mediaSlaves.push(id);
	},
	forceStatus: function(s){ 
	var self=this;
		self.mediaSlaves.forEach(function(child) {
		$("[id='"+child+"']").video('setStatusFromMaster',s);
		});
	},
	
	setStatusFromMaster: function(s){
	var self=this;
		if(s=='pause')
			self.pause()
		else
			self.play();
	},
	
	forceSynchronization: function(){ 
	var self=this;
		self.mediaSlaves.forEach(function(child) {
		$("[id='"+child+"']").video('setTimeFromMaster',self.mediaElement.currentTime);
		});
	},	
	setTimeFromMaster: function(t){
	var self=this;
	if(((self.mediaElement.currentTime-t)>1) || ((t-self.mediaElement.currentTime)>1))
		self.mediaElement.currentTime=t + self.tlroffset;
//	else //consoleLog(t-self.mediaElement.currentTime);
	},	
	//  Controls creation
	    _createControls: function() {
        var self = this;
        
        self._controls = $('<div/>')
            .addClass(self.options.overlay ? 'ui-corner-all ui-video-control-vign' : 'ui-corner-all ui-video-control')
            .prependTo(self._container);

        self._progressDiv = $('<div/>')
            .addClass(self.options.overlay ? 'ui-corner-all  ui-video-progress-vign' : 'ui-corner-all  ui-video-progress')
            .appendTo(self._controls)
            .hover(
                function() {
                    $(this).effect("highlight");
                },
                function() {
                }
            );

        self._currentProgressSpan = $('<span/>',
                                      {
                                          'class': 'ui-video-current-progress', 'text': '00:00:00.00'
                                      }
                                     )
            .appendTo(self._progressDiv);

        $('<span/>',
          {
              'html': '/',
              'class': 'ui-video-progress-divider'
          }
         )
            .appendTo(self._progressDiv);

        self._durationSpan = $('<span/>',
                               {
                                   'class': 'ui-video-length', 'text': '00:00:00.00'
                               }
                              )
            .appendTo(self._progressDiv);

        self._muteButton = $('<div/>')
            .addClass(self.options.overlay ? 'ui-icon ui-icon-volume-on ui-video-mute-vign' : 'ui-video-mute')
            .appendTo(self._controls)
            .bind('click.video', $.proxy(self._mute, self));

        self._playButton = $('<div/>')
            .addClass(self.options.overlay ? 'ui-icon ui-icon-play ui-video-play-vign' : 'ui-video-play')
            .appendTo(self._controls)
            .bind('click.video', $.proxy(self._togglePlayPause, self));

        self._stopButton = $('<div/>')
            .addClass(self.options.overlay ? 'ui-icon ui-icon-stop ui-video-stop-vign' : 'ui-video-stop')
            .appendTo(self._controls)
            .bind('click.video', $.proxy(self._stopfragmentplay, self))
            .bind('click.video', $.proxy(self._stop, self));

        self._playLoopButton = $('<div/>')
            .appendTo(self._controls)
            .addClass(self.options.overlay ? 'ui-icon ui-icon-arrowrefresh-1-s ui-video-playLoop-vign' : 'ui-video-playLoop')
            .bind('click.video', $.proxy(self._tooglePlayLoop, self));

        self._stopFragmentLoop = $('<div/>')
            .addClass(self.options.overlay ? 'ui-icon ui-icon-closethick ui-video-fragmentLoop-vign' : 'ui-video-fragmentLoop')
            .appendTo(self._controls)
            .hide()
            .bind('click.video', $.proxy(self._stopfragmentplay, self));

        self._volumeSlider = $('<div/>')
            .addClass(self.options.overlay ? 'ui-video-volume-slider-vign' : 'ui-video-volume-slider')
            .appendTo(self._controls)
            .slider({
                range: 'min',
                animate: true,
                stop: function( e, ui ) {
                    ui.handle.blur();
                },
                slide: function( e, ui ) {
                    self.volume.apply(self, [ui.value]);
                    return true;
                }
            }
                   );

        self._timeLinerSliderHover =  $('<div/>',
                                        {
                                            'class': 'ui-widget-content ui-corner-all ui-video-timeLiner-slider-hover'
                                        }
                                       )
            .hide();

        self._timeLinerSlider = $('<div/>')
            .addClass(self.options.overlay ? 'ui-video-timeLiner-slider-vign' : 'ui-video-timeLiner-slider')
            .appendTo(self._controls)
            .slider({
                range: 'min',
                animate: false,
                start: function( e, ui ) {
                    if( self.mediaElement.readyState === HTMLMediaElement.HAVE_NOTHING ) {
                        return false;
                    } else {
                        self._timeLinerSliderHover.fadeIn('fast');
                        self._timeLinerHoverUpdate.apply(self,[ui.handle, ui.value]);
                        return true;
                    }
                },
                stop: function( e, ui ) {

                    ui.handle.blur();
                    if( self._timeLinerSliderHover.is(':visible') ) {
                        self._timeLinerSliderHover.fadeOut('fast');
                    }

                    if( self.mediaElement.readyState === HTMLMediaElement.HAVE_NOTHING ) {
                        return false;
                    } else {
                        self._currentProgressSpan.text($._formatTime(self.mediaElement.duration * (ui.value/100)));
                        return true;
                    }
                },
                slide: function( e, ui ) {
                    if( self.mediaElement.readyState === HTMLMediaElement.HAVE_NOTHING ) {
                        return false;
                    } else {
                        self._timeLinerHoverUpdate.apply(self,[ui.handle, ui.value]);
                        self.timeline.apply(self,[ui.value]);
                        return true;
                    }
                }
            }
                   );

        self._timeLinerSliderHover.appendTo(self._timeLinerSlider);

        self._timeLinerSliderAbsoluteWidth = self._timeLinerSlider.width();

        self._bufferStatus = $('<div/>',
                               {
                                   'class': 'ui-video-buffer-status ui-corner-all'
                               }
                              ).appendTo( self._timeLinerSlider );

        self._stopFragmentButton = $('<div/>')
            .addClass(self.options.overlay ? 'ui-icon ui-icon-closethick ui-video-fragment-close-vign' : 'ui-icon ui-icon-closethick ui-video-fragment-close')
            .appendTo(self._controls)
            .bind('click.video', $.proxy(self._closeFragment,self));
    },
    _timeLinerHoverUpdate: function( elem, value ) {
        var self = this;
        var duration = self.mediaElement.duration;

        self._timeLinerSliderHover
            .text($._formatTime(duration * (value/100)))
            .position({
                'my': 'bottom',
                'at': 'top',
                'of': elem,
                'offset': '0 -10',
                'collision': 'none'
            }
         );
		 


    },
    _togglePlayPause: function() {
        var self = this;
        if( self.mediaElement.paused ) {
            self.play();
        } else {
            self.pause();
        }

    },
    _stop: function() {
        var self = this;
        self.stop();
        $(".activeTranscript").each( $(this).removeClass("activeTranscript") );
    },
    _tooglePlayLoop: function() {
        var self = this;
        if (self.mediaElement.loop) {
            self.mediaElement.loop=false;
            self._playLoopButton.removeClass('ui-video-noplayLoop').addClass('ui-video-playLoop');
        } else {
            self.mediaElement.loop=true;
            self._playLoopButton.addClass('ui-video-noplayLoop').removeClass('ui-video-playLoop');
        }
    },
    _hideControls: function() {
        var self = this;
		self._container.find('.ui-video-captions').css('bottom','5px');
        self._controls
            .stop(true,true)
            .delay(100)
            .fadeOut(500);
    },
    _showControls: function(){
        var self = this;
		self._container.find('.ui-video-captions').css('bottom','50px');
        self._controls
            .stop(true, true)
            .fadeIn(500);
    },
    _hideWaiting: function(){
        var self = this;
        if( self._waitingId ) {
            self._waitingId = false;
            self._waitingContainer
					.fadeOut('fast')
					.remove();
        }
    },
    _showWaiting: function(msg){
        var self = this;
		if (self._playbackError) return;
		self._waiting.text(msg);
		self._waiting.css('width',self._container.width()-12);
		self._waiting.css('width',self._waitingContainer.width()-12);
        if( ! self._waitingId ) {
            self._waiting.css('left', 0);
            self._waitingContainer
				.appendTo(self._container)
				.css('left', 5)
				.css('right', 5)
				.css('top',  (self._container.height()- self._waiting.height())/2)
				.fadeIn('slow');
			self._waitingId=true;
		}

    },
    _closeFragment: function() {
        var self = this;
        self._hideWaiting();
        self._container.parent().find('.video-container:first').trigger("destroySamplePlayer");
    },
    // FIXME: WTF?
    _wait: function(t) {
        var date = new Date();
        var curDate = null;
        do {
            curDate = new Date();
        } while (curDate - date < t);
    },

    // User functions

    // Handle keyboard events
    triggerKeyBoardEvent: function(e) {
        var self = this;
        if (!e)
            var e = window.event
        // handle events and stop propagating it!
        e.cancelBubble = true;
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();

        switch (e.keyCode){
        case 32:  // Space
            self._togglePlayPause();
            break;
        case 38: // up-arrow
            self.volume.apply(self, [parseInt(self.mediaElement.volume * 100 + 10)]);
			self._volumeSlider.slider('value', parseInt(self.mediaElement.volume * 100));
            break;
        case 40: // down-arrow
            self.volume.apply(self, [parseInt(self.mediaElement.volume * 100 - 10)]);
			self._volumeSlider.slider('value', parseInt(self.mediaElement.volume * 100));
            break;
        case 36: // Home  
            self.setPlayingTime(0);
            break;
        case 37: // left-arrow (<--)
            self.setPlayingTime(self.mediaElement.currentTime - 60);
            break;
        case 39: // right-arrow (-->)
            self.setPlayingTime(self.mediaElement.currentTime + 60);
            break;
        case 35: // End
            self.stop();
            break;
        }
    },
    // The destroyer
    destroy: function() {
        var self = this;
        $.each( self._oldVideooptions , function( key, value) {
            self.element.attr( key, value );
        } );
        self._controls.remove();
        self.element.unwrap();
        self.element.unbind( ".video" );
        // FIXME: self.mediaElement destroy??
        $.Widget.prototype.destroy.apply(self, arguments); // default destroy
    }
});


/**
 * Main player widget
 *
 * The "player" widget defines a HTML5 video player. It instanciates a
 * video() object by specifying an independant container. The
 * container itself is derived from jqueryui.dialog, with some
 * additional features.
 */
(function($) {
    player=$.extend({}, $.ui.dialog.prototype);
    $.widget("ui.player", $.ui.dialog, player);
    var _init = $.ui.player.prototype._init;

    $.ui.player.prototype._init = function() {
        var self = this;
        var options = self.options;
        var videoObject;
		
        options.closeOnEscape = false;
        _init.apply(this, arguments);

        self.uiPlayer=self.uiDialog;//alert(uiPlayer.attr('id'));
        // Default behaviour: fixed position
        self.uiPlayer.css('position', 'fixed');
		self.uiPlayer.attr('style',self.uiPlayer.attr('style')+options.style);
		
		/* Minimized icon */
        self.minplayer=$('<img/>',
                         {
                             'class': 'ui-corner-all player_minimized',
                             'src': 'chm.api/res/maximized.png',
                             'title': self.options.title+' Click to restore'
                         }
                        )
            .appendTo(self.uiPlayer.parent())
            .hide()
            .draggable()
            .hover(
                function() {
                    $(this).css('background-color','#F00');
                },
                function() {
                    $(this).css('background-color','#CCC');
                }
            )
            .focus(function() {
                $(this).addClass('ui-state-focus');
                    })
            .blur(function() {
                $(this).removeClass('ui-state-focus');
            })
            .mousedown(function(ev) {
                ev.stopPropagation();
            })
            .click(function(event) {
                var options = {
                    to: ".player_container",
                    className: 'ui-effects-transfer'
                };
                self.uiPlayer.show();
                // Set player on a visible part of the screen
                if (self.uiPlayer.css('position') == 'absolute' &&
                    (($(document).scrollTop() > self.uiPlayer.position().top + self.uiPlayer.height())||
                     ($(document).scrollTop() + $(window).height() < self.uiPlayer.position().top)))
                    self.uiPlayer.css( { position: 'absolute',
                                    top:  event.pageY - self.uiPlayer.height() - 20 } );
                self.minplayer.hide("transfer", options, 1000, function(){} );
                self.minplayer.hide();
                return false;
            })

			self.uiPlayer
		            .bind('resizestop', function(event, ui) {
		                // Resize only with native video. To FIX
						if(self.uiPlayer.find('embed', this).size()) return;
		                
						vid = self.uiPlayer.find('video', this);
						content=self.uiPlayer.find('.ui-dialog-content ', this);
		                control=self.uiPlayer.find('.ui-video-control ', this);

		                $(content).position({
		                    my: "left top",
		                    at:"left bottom",
		                    of: self.uiPlayer.find('.ui-dialog-titlebar'),
		                    offset: "1",
		                    collision: "none"
		                });
		                $(vid).position({
		                    my: "top",
		                    at:"top",
		                    of: content,
		                    offset: "2",
		                    collision: "none"
		                });

		                var hauteur= $(vid).position().top + $(vid).height();
		                var largeur= $(vid).position().left + $(vid).width();
		                self.uiPlayer.css({
		                    'width': largeur + 2,
		                    'height': hauteur + 20
		                });
		                $(content).css({
		                    'height': hauteur
		                });
		                if (self.uiPlayer.find('.ui-dialog-titlebar-fixonscreen', this).is(':hidden')) {
		                    var pos = self.uiPlayer.position();
		                    self.uiPlayer.css('position', 'fixed');
		                    self.uiPlayer.css('top', pos.top - $(window).scrollTop());
		                };
							videoObject.video('setVideoSize',$(this).height(),$(this).width());
		            });

        videoObject = self.uiPlayer.find('video', this);
        videoObject.video();
        videoObject.video('option', 'endFragmentBehaviour', 'continue');
		self.uiPlayer.find('.ui-dialog-titlebar-close ', this).remove();
		if(self.uiPlayer.find('video', this).attr('id')!='tm2media')
			videoObject.video('addSlaveNode', 'tm2media');

        uiPlayerTitlebar=self.uiPlayer.find('.ui-dialog-titlebar ', this);

        // Fragment title
        uiPlayerFragmentTitle = $('<strong/>')
            .text("Fragment play")
            .addClass("ui-dialog-fragment-title")
            .hide()
            .appendTo(self.uiPlayer);

        //  Minimisation icon
        uiPlayerTitlebarToggle = $('<a href="#"/>')
            .addClass('ui-dialog-titlebar-toggle ' + 'ui-corner-all')
            .attr('role', 'button')
			.appendTo(uiPlayerTitlebar)
            .hover(
                function() { $(this).addClass('ui-state-hover'); },
                function() { $(this).removeClass('ui-state-hover'); }
            )
            .focus(function() { $(this).addClass('ui-state-focus'); })
            .blur(function() { $(this).removeClass('ui-state-focus'); })
            .mousedown(function(ev) { ev.stopPropagation(); })
            .click(function(event) {
                self.uiPlayer.hide();
                self.minplayer.show();
                return false;
            });
            

        uiPlayerTitlebarToggleText = (this.uiPlayerTitlebarToggleText = $('<span/>'))
            .addClass('ui-icon ' +'ui-icon-minusthick')
            .text('Toggle Player')
            .attr('title','Minimize Player')
            .appendTo(uiPlayerTitlebarToggle);

        // Thumbtack the player on the window (it will scroll with the content)
        uiPlayerTitlebarFixonScreen = $('<a href="#"/>')
            .addClass('ui-dialog-titlebar-fixonscreen ' +'ui-corner-all')
            .attr('role', 'button')			
            .appendTo(uiPlayerTitlebar)
            .hover(function() {$(this).addClass('ui-state-hover');},
                   function() {$(this).removeClass('ui-state-hover');}
                  )
            .focus(function() {$(this).addClass('ui-state-focus');})
            .blur(function() {$(this).removeClass('ui-state-focus');    })
            .mousedown(function(ev) {
                ev.stopPropagation();
            })
            .click(function(event) {
                $(this).hide();
                var pos = self.uiPlayer.position();
                self.uiPlayer.css('position', 'fixed');
                self.uiPlayer.css('top',pos.top - $(window).scrollTop());
                self.uiPlayer.find('.ui-dialog-titlebar-nofixonscreen ',this).show();
                return false;
            })
            .hide();

        uiPlayerTitlebarFixonScreenText = (this.uiPlayerTitlebarFixonScreenText = $('<span/>'))
            .addClass('ui-icon ' +'ui-icon-pin-s')
            .text("Fix On Screen")
            .attr('title','Fix Player On Screen (fixed)')
            .appendTo(uiPlayerTitlebarFixonScreen);

        // Do not thumbtack the player on the window (it will not scroll with the content)
        uiPlayerTitlebarNoFixonScreen = $('<a href="#"/>')
            .addClass('ui-dialog-titlebar-nofixonscreen ' +'ui-corner-all')
            .attr('role', 'button')
			.appendTo(uiPlayerTitlebar)
            .hover(
                function() { $(this).addClass('ui-state-hover'); },
                function() { $(this).removeClass('ui-state-hover'); }
            )
            .focus(function() { $(this).addClass('ui-state-focus');} )
            .blur(function() { $(this).removeClass('ui-state-focus'); } )
            .mousedown(function(ev) { ev.stopPropagation(); } )
            .click(function(event) {
                $(this).hide();
                var pos = self.uiPlayer.position();
                self.uiPlayer.css('position','absolute');
                self.uiPlayer.css('top', pos.top);
                self.uiPlayer.find('.ui-dialog-titlebar-fixonscreen ', this).show();
                return false;
            })
            .show();

        uiPlayerTitlebarNoFixonScreenText = (this.uiPlayerTitlebarNoFixonScreenText = $('<span/>'))
            .addClass('ui-icon ' +'ui-icon-pin-w')
            .text('options')
            .attr('title','Fix Player on its Page (absolute)')
            .appendTo(uiPlayerTitlebarNoFixonScreen);

        // Control function
        self.fragmentPlay = function(begin, end, title, endFragBehav) {
            videoObject.video('fragmentPlay', begin, end, self.options.endFragmentBehaviour);
            self.uiPlayer.find(".ui-dialog-fragment-title").show();
            if (!title)
                switch (self.options.endFragmentBehaviour) {
                case "continue":
                    title = "Playing from " + $._formatTime(begin);
                    break;
                case "pause":
                case "stop":
                    title = "Playing from " + $._formatTime(begin) + " to " + $._formatTime(end);
                    break;
                default:
                    // Loop
                    title = "Looping from " + $._formatTime(begin) + " to " + $._formatTime(end);
                    break;
                }
            self.uiPlayer.find(".ui-dialog-fragment-title").text(title);
            self.minplayer.click();
        };
		//s=$('<div class="xxx" data-timecontainer="par" data-timeaction="display" data-mediasync="tm"/>'); $(self.uiPlayer).wrapAll(s);
		
		
    };

    // Capture CTRL + KEY events and forward them to the video widget of the main player
    document.onkeydown = function(e) {
        if (e.ctrlKey == 1) {
            self.uiPlayer.find('video', this).video('triggerKeyBoardEvent', e);
            // FIXME: return true if no shortcut was defined
            return false;
        }
    }

    $.ui.player.prototype.videoObject = null;
    $.ui.player.prototype.options.title = 'CHM VideoPlayer';
    $.ui.player.prototype.options.endFragmentBehaviour = "continue";
    $.ui.player.prototype.options.position = "right";
    $.ui.player.prototype.options.resizable = "se";
	$.ui.player.prototype.options.height="300";
	$.ui.player.prototype.options.width="450";


})(jQuery);

		//			$.ui.player.prototype.options.height="260";
		//$.ui.player.prototype.options.width="340";

		// Main advene plugin declaration.
		// It defines the following methods:
		// $(document).advene() or $(document).advene('init'): initialisation of the plugin
		// element.advene('overlay'): hook the player call, and possibly add an overlay player over the screenshot
		// element.advene('player', videoUrl, start, end): start the player at the given position
		(function($) {

		    // See http://docs.jquery.com/Plugins/Authoring#Plugin_Methods for the pattern used here.
		    var methods = {
		        'init': function(options) {
            // FIXME: pass appropriate options (player options, etc)
            var video_url = "";

//            if (($("[target = 'video_player']").length == 0))
                // No video player link
  //              return;
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

		            $("[target='video_player']").each( function() {
		                var data = /(.+)#t=([.\d]+)?,([.\d]+)?/.exec($(this).attr('href'));

		                if (data) {
		                    $(this).attr( { 'data-player-id': $(this).attr('chm:timelineref'),
											'data-video-url': data[1],
		                                    'data-begin': data[2],
		                                    'data-end': data[3]
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
		            
		            if ($(".highlightRelated", document).length > 0) {
		                $(".transcript[data-begin]").each( function() {
		                    $(this).mouseover( function() {
		                        /* Highlight related */
		                        self = this;
		                        begin = $(self).attr('data-begin');
		                        end = $(self).attr('data-end');
		                        $(".transcript[data-begin]", $(document)).each( function() {
		                            if (Math.max(begin, $(this).attr('data-begin')) <= Math.min(end, $(this).attr('data-end'))) {
		                                $(this).addClass('relatedTranscript');
		                            }
		                        });
		                    })
		                        .mouseout( function() {
		                            $(".relatedTranscript", $(document)).each( function() { $(this).removeClass('relatedTranscript'); });
		                        });
		                });
		            }


		                             
		                            
		            playerOptions =  { title:'CHM Video Player',
		                               endFragmentBehaviour: 'continue',
		                             };
		            if (options !== undefined)
		                for (key in options)
		                    playerOptions[key] = options[key];
					$.MediaElements = new Array();
					$('.player_container').each( function() {					
					playerOptions['style']=$(this).attr('data-playercss');
					playerCont=$(this).player( playerOptions );
					});
					
					
		        },

		    'overlay': function() {
            // overlay plugin.
            // The overlay function transforms MediaFragment-type links into calls to the video() object API.
            // On elements of class "screenshot", it overlays a menu that proposes to launch the player either embedded in the document, or as main player.
            var options = {
                border_color : '#666',
                overlay_color : '#000',
                overlay_text_color : '#666',
            };

            var self = this;
			player=$("[id='"+$(this).attr('chm:timelineref')+"']");
			var fragmentTitle = $('.screenshot', this).siblings("strong:first").text();

            if ($(this).children('.screenshot').size() == 0)
            {
                // No screenshot. Simply trigger the appropriate action.
                $(this).click(function() {
                    $(player).player('fragmentPlay', $(this).attr('data-begin'), $(this).attr('data-end'));
                    return false;
                });
                return false;
            }

           // $('.screenshot', this).siblings().wrapAll("<div class='caption'/>");

            $(this).addClass('image-overlay');

            $optionPlay=$('<div/>')
                .attr("class", 'screenshot-overlay-menu')
                .appendTo($(self));

            var  $option = $('<img/>')
                .attr('src', './chm.api/res/view_here.png')
                .appendTo($optionPlay)
                .click( function() {
                    node = $('.screenshot', self).parent();
                    $('.screenshot', self).hide();
                    $('.caption', self).hide();
                    $('.screenshot-overlay-menu', self).removeClass('screenshot-overlay-menu').addClass('screenshot-overlay-player');
                    $(this).parent().advene('player', node.attr('data-video-url'), node.attr('data-begin'), node.attr('data-end'));
                });

            option = $('<img/>')
                .attr('src', './chm.api/res/view_player.png')
                .css('top', 30)
                .click( function(event){
                    node = $('.screenshot', self).parent();
					vplayer=$("[id='"+node.attr('data-player-id')+"']");
                    $(vplayer).player('fragmentPlay', node.attr('data-begin'), node.attr('data-end'), fragmentTitle);

                    // Positioning player on screen when it's no longer visible (due to a scroll).
                    if ( ($(document).scrollTop() > $(player).parent().position().top + $(player).parent().height())
                         || ($(document).scrollTop() + $(window).height() < $(player).parent().position().top) )
                        $(player).parent().css( { position:'absolute', top: event.pageY - 50 } );
						

                })
                .appendTo($optionPlay);


            var image = new Image();
            image.src = $('img', this).attr('src');
            $(this).css({
                width :$('img', this).css('width'),
                height : $('img', this).css('height'),
                borderColor : options.border_color});
            $('img', this).attr({ title : '' });

            var imageHeight = $('img', this).height();
            var captionHeight = $('.caption', this).height();

            $('.caption', this).css({
                top: (options.always_show_overlay ? '0px' :  imageHeight + 'px'),
                backgroundColor: options.overlay_color,
                color : options.overlay_text_color
            });

            $(this).hover(function() {
                $('.caption', this).stop().animate( {
                    top: (imageHeight - captionHeight) + 'px'
                }, {
                    queue: false
                });
                $('.screenshot-overlay-menu', this).fadeIn(800);
            },
                          function() {
                              $('.caption', this).stop().animate( {
                                  top: imageHeight + 'px'
                              }, {
                                  queue: false
                              });
                              $('.screenshot-overlay-menu', this).fadeOut(200);
                          });

            self.bind( "fragmentclose", function(event, parentC) {
                $(parentC).find('.screenshot').show();
                $(parentC).find('.caption').show();
                $(parentC).find('.screenshot-overlay-player').removeClass('screenshot-overlay-player').addClass('screenshot-overlay-menu');
                self.die();
            } );
        },

        'player': function(videoURL, startx, endx) {
            // The player tool defines a screenshot-overlayed player
            var self = this;
            self.options = {
                start_point: 0,
                end_point: 0
            };
            self.options.start_point = startx;
            self.options.end_point = endx;

            var parentC = null;
            return this.each(function() {
                /**
                 * @type {!jQuery}
                 * @private
                 */
                self.addClass('video-container');
                self._videoContainer = null;
                self._videoContainer = $('<div/>',
                                         {
                                             'class': ' ui-corner-all ui-video-container'
                                         }
                                        )
                    .css('height', $(self).css('height'))
                    .css('width', $(self).css('width'))
                    .css('background-color', 'black')
                    .css('padding', '0');

                self._video = $('<video/>',
                                {
                                    'class': ' ui-corner-all sampleContainer',
                                    'src': videoURL,
                                    'poster': 'chm.api/res/chmlogo.png',
									'autoplay':'false',
									'preload':'true'
                                }
                               )
                    .css('position', 'absolute')
                    .prependTo(self._videoContainer);
parentC = $(self).parent();
                parentC.append(self._videoContainer);
                $(self._video).video({
                                 'overlay': 'true',
                                 'startPoint': self.options.start_point,
                                 'endPoint': self.options.end_point,
                                 'poster':'chm.api/res/chmlogo.png',
                                 'autoPlay': false
                                 });


                //destroy();
                self._videoContainer
                    .css('height','100%')
                    .css('width','100%');

                self.bind("destroySamplePlayer", destroySamplePlayer );
                $(self._video).hide();
                $(self._video).fadeIn('5000');
            });
            function destroySamplePlayer() {
			$(self._videoContainer).children('.me-plugin').remove();
                $(self._video).video("destroy");
                self._video.remove();

                self._videoContainer.empty();
                self._videoContainer.remove();
                self.removeClass('video-container');
                parentC.find('.screenshot:first').trigger('fragmentclose',parentC);
                self.unbind( "destroySamplePlayer", destroySamplePlayer );


            }
        }
    };

    $.fn.advene = function( method ) {
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
        }
  };

})(jQuery);
