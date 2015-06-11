/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document */
/*mendix */

define([
    'dojo/_base/declare', 'mxui/widget/_WidgetBase', 'dijit/_TemplatedMixin',
    'mxui/dom', 'dojo/dom-style', 'dojo/dom-construct', 'dojo/_base/lang', 'dojo/text', 'dojo/html', 'dojo/_base/xhr',
    'dojo/text!PopupVideoPlayer/widget/template/PopupVideoPlayer.html'
], function (declare, _WidgetBase, _TemplatedMixin, dom, domStyle, domConstruct, lang, text, html, xhr, widgetTemplate) {
    'use strict';

    return declare('PopupVideoPlayer.widget.PopupVideoPlayer', [_WidgetBase, _TemplatedMixin], {
        
        templateString : widgetTemplate,
		
		buttonNode : null,
		thumbnailNode : null,
		textNode : null,
		titleNode : null,
		authorNode : null,
		byNode : null,
        
        bgNode : null,
        containerNode : null,
        iframeNode : null,
        videoId : '',
		jsonpcb : null,
		buttonClickHandler : null,
        
        startup : function () {
            
        },

        update : function (obj, callback) {
			if (!obj) {
				domStyle.set(this.buttonNode, 'display', 'none');
				callback();
				return;
			}
			
            this.videoId = obj.get(this.videoIdAttr);
			
			var url = "";
			var cb = this.id+"oembedcb";
			
			this.resetJsonp();
			
			if (this.source === "youtube") {
				this.jsonpcb = window[cb] = lang.hitch(this, function (data) {
					this.showButton(data);
				});
				// RvH: Youtube doesn't work with GET because of CORS and does not support jsonp callbacks. Luckily the noembed wrapper does.
				url = "https://noembed.com/embed?url=http%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D"+this.videoId+"&callback="+cb;
			} else if (this.source === "vimeo") {
				url = "https://vimeo.com/api/oembed.json?url=http%3A//vimeo.com/"+this.videoId;
			}
			
            xhr.get({
                url : url,
                handleAs: 'json',
				headers : {
					// Dojo by default tries to do a preflighted request, this runs into CORS so we disable this.
					"X-Requested-With": null
				},
                load : lang.hitch(this, function (data) {
					if (this.source === 'vimeo')
						this.showButton(data);
				}),
				error : lang.hitch(this, this.resetJsonp)
            });
            
            callback();
        },
        
        openPopup : function (evt) {
			this.resetJsonp();
			
			if (evt.target.nodeName === "A") {
				return;
			}
			
			var videoUrl = "";
            this.bgNode = domConstruct.create('div', { 'class' : 'popupVideoPlayer-bg'});
            this.containerNode = domConstruct.create('div', { 'class' : 'popupVideoPlayer-container'});
            this.iframeNode = domConstruct.create('iframe', {
				 'class' : 'popupVideoPlayer-iframe',
				 width : this.playerWidth,
				 height : this.playerHeight,
				 frameBorder: '0',
				 webkitAllowFullscreen : true,
				 allowFullscreen : true,
				 mozAllowFullscreen : true
			});
            
			if (this.source == "youtube") {
				videoUrl = "//www.youtube.com/embed/"+this.videoId;
			} else if (this.source == "vimeo") {
				videoUrl = '//player.vimeo.com/video/'+this.videoId;
			}
			
			if (this.autoPlay) {
				videoUrl += "?autoplay=1";
			}
			
			this.iframeNode.src = videoUrl;
            
            this.centerPopup(this.containerNode);
            this.connect(this.bgNode, 'click', lang.hitch(this, this.removePopup));
            
            domConstruct.place(this.iframeNode, this.containerNode);
            domConstruct.place(this.bgNode, document.body);
            domConstruct.place(this.containerNode, document.body);
        },
        
        showButton : function (data) {
			this.resetClickHandler();
			
            html.set(this.titleNode, data.title);
			html.set(this.authorNode, data.author_name);
			this.authorNode.href = data.author_url;
			this.thumbnailNode.src = data.thumbnail_url;
			
			if (data.author_name != "")
				domStyle.set(this.byNode, 'display', 'block');
				
			domStyle.set(this.buttonNode, 'display', 'block');
			this.buttonClickHandler = this.connect(this.buttonNode, 'click', lang.hitch(this, this.openPopup));
        },
        
        centerPopup : function (node) {
            domStyle.set(node, {
                top : (window.innerHeight-this.playerHeight)/2+'px',
                left : (window.innerWidth-this.playerWidth)/2+'px'
            });
        },
		
		resetJsonp : function () {
			if (this.jsonpcb)
				delete this.jsonpcb;
		},
        
        removePopup : function () {
            domConstruct.destroy(this.iframeNode);
            domConstruct.destroy(this.bgNode);
            domConstruct.destroy(this.containerNode);
        },
		
		resetClickHandler : function () {
			if (this.buttonClickHandler) {
				this.disconnect(this.buttonClickHandler);
				this.buttonClickHandler = null;
			}
		},
        
        uninitialize : function () {
			this.resetJsonp();
            this.removePopup();
			this.resetClickHandler();
        }

    });
});
require(['PopupVideoPlayer/widget/PopupVideoPlayer'], function () {
    'use strict';
});