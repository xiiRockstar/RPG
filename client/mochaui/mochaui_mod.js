/*
Distributed under the MIT License:

 * Copyright (c) 2010 Greg Houston and Contributors in AUTHORS.txt
 * MIT (MIT-LICENSE.txt)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

 */
var MUI = MochaUI = new Hash({
    version: "0.9.7",
    options: new Hash({
	theme: "charcoal",
	advancedEffects: false,
	standardEffects: true
    }),
    path: {
	source: "/client/mochaui/",
	themes: "/client/mochaui/themes/",
	plugins: "/client/mochaui/plugins/"
    },
    themePath: function() {
	return MUI.path.themes + MUI.options.theme + "/"
    },
    files: new Hash()
});
MUI.files[MUI.path.source + "Core/Core.js"] = "loaded";
MUI.extend({
    Windows: {
	instances: new Hash()
    },
    ieSupport: "nexcanvas",
    updateContent: function(options) {
	var options = $extend({
	    element: null,
	    childElement: null,
	    method: null,
	    data: null,
	    title: null,
	    content: null,
	    loadMethod: null,
	    url: null,
	    scrollbars: null,
	    padding: null,
	    require: {},
	    onContentLoaded: $empty
	}, options);
	options.require = $extend({
	    css: [],
	    images: [],
	    js: [],
	    onloaded: null
	}, options.require);
	var args = {};
	if (!options.element) {
	    return
	}
	var element = options.element;
	if (MUI.Windows.instances.get(element.id)) {
	    args.recipient = "window"
	} else {
	    args.recipient = "panel"
	}
	var instance = element.retrieve("instance");
	if (options.title) {
	    instance.titleEl.set("html", options.title)
	}
	var contentEl = instance.contentEl;
	args.contentContainer = options.childElement != null ? options.childElement : instance.contentEl;
	var contentWrapperEl = instance.contentWrapperEl;
	if (!options.loadMethod) {
	    if (!instance.options.loadMethod) {
		if (!options.url) {
		    options.loadMethod = "html"
		} else {
		    options.loadMethod = "xhr"
		}
	    } else {
		options.loadMethod = instance.options.loadMethod
	    }
	}
	var scrollbars = options.scrollbars || instance.options.scrollbars;
	if (args.contentContainer == instance.contentEl) {
	    contentWrapperEl.setStyles({
		overflow: scrollbars != false && options.loadMethod != "iframe" ? "auto" : "hidden"
	    })
	}
	if (options.padding != null) {
	    contentEl.setStyles({
		"padding-top": options.padding.top,
		"padding-bottom": options.padding.bottom,
		"padding-left": options.padding.left,
		"padding-right": options.padding.right
	    })
	}
	if (args.contentContainer == contentEl) {
	    contentEl.empty().show();
	    contentEl.getAllNext(".column").destroy();
	    contentEl.getAllNext(".columnHandle").destroy()
	}
	args.onContentLoaded = function() {
	    if (options.require.js.length || typeof options.require.onloaded == "function") {
		new MUI.Require({
		    js: options.require.js,
		    onloaded: function() {
			if (Browser.Engine.presto) {
			    options.require.onloaded.delay(100)
			} else {
			    options.require.onloaded()
			}
			(options.onContentLoaded && options.onContentLoaded != $empty) ? options.onContentLoaded() : instance.fireEvent("contentLoaded", element)
		    }.bind(this)
		})
	    } else {
		(options.onContentLoaded && options.onContentLoaded != $empty) ? options.onContentLoaded() : instance.fireEvent("contentLoaded", element)
	    }
	};
	if (options.require.css.length || options.require.images.length) {
	    new MUI.Require({
		css: options.require.css,
		images: options.require.images,
		onloaded: function() {
		    this.loadSelect(instance, options, args)
		}.bind(this)
	    })
	} else {
	    this.loadSelect(instance, options, args)
	}
    },
    loadSelect: function(instance, options, args) {
	switch (options.loadMethod) {
	    case "xhr":
		this.updateContentXHR(instance, options, args);
		break;
	    case "iframe":
		this.updateContentIframe(instance, options, args);
		break;
	    case "json":
		this.updateContentJSON(instance, options, args);
		break;
	    case "html":
	    default:
		this.updateContentHTML(instance, options, args);
		break
	}
    },
    updateContentJSON: function(instance, options, args) {
	var contentEl = instance.contentEl;
	var contentContainer = args.contentContainer;
	new Request({
	    url: options.url,
	    update: contentContainer,
	    method: options.method != null ? options.method : "get",
	    data: options.data != null ? new Hash(options.data).toQueryString() : "",
	    evalScripts: false,
	    evalResponse: false,
	    headers: {
		"Content-Type": "application/json"
	    },
	    onRequest: function() {
		if (args.recipient == "window" && contentContainer == contentEl) {
		    instance.showSpinner()
		} else {
		    if (args.recipient == "panel" && contentContainer == contentEl && $("spinner")) {
			$("spinner").show()
		    }
		}
	    }.bind(this),
	    onFailure: function() {
		if (contentContainer == contentEl) {
		    contentContainer.set("html", "<p><strong>Error Loading XMLHttpRequest</strong></p>");
		    if (recipient == "window") {
			instance.hideSpinner()
		    } else {
			if (recipient == "panel" && $("spinner")) {
			    $("spinner").hide()
			}
		    }
		}
		if (contentContainer == contentEl) {
		    contentContainer.set("html", "<p><strong>Error Loading XMLHttpRequest</strong></p>");
		    if (args.recipient == "window") {
			instance.hideSpinner()
		    } else {
			if (args.recipient == "panel" && $("spinner")) {
			    $("spinner").hide()
			}
		    }
		}
	    }.bind(this),
	    onException: function() {
	    }.bind(this),
	    onSuccess: function(json) {
		if (contentContainer == contentEl) {
		    if (contentContainer == contentEl) {
			if (args.recipient == "window") {
			    instance.hideSpinner()
			} else {
			    if (args.recipient == "panel" && $("spinner")) {
				$("spinner").hide()
			    }
			}
		    }
		    var json = JSON.decode(json);
		    instance.fireEvent("loaded", $A([options.element, json, instance]))
		}
	    }.bind(this),
	    onComplete: function() {
	    }.bind(this)
	}).get()
    },
    updateContentXHR: function(instance, options, args) {
	var contentEl = instance.contentEl;
	var contentContainer = args.contentContainer;
	var onContentLoaded = args.onContentLoaded;
	new Request.HTML({
	    url: options.url,
	    update: contentContainer,
	    method: options.method != null ? options.method : "get",
	    data: options.data != null ? new Hash(options.data).toQueryString() : "",
	    evalScripts: instance.options.evalScripts,
	    evalResponse: instance.options.evalResponse,
	    onRequest: function() {
		if (args.recipient == "window" && contentContainer == contentEl) {
		    instance.showSpinner()
		} else {
		    if (args.recipient == "panel" && contentContainer == contentEl && $("spinner")) {
			$("spinner").show()
		    }
		}
	    }.bind(this),
	    onFailure: function(response) {
		if (contentContainer == contentEl) {
		    var getTitle = new RegExp("<title>[\n\rs]*(.*)[\n\rs]*</title>", "gmi");
		    var error = getTitle.exec(response.responseText);
		    if (!error) {
			error = "Unknown"
		    }
		    contentContainer.set("html", "<h3>Error: " + error[1] + "</h3>");
		    if (args.recipient == "window") {
			instance.hideSpinner()
		    } else {
			if (args.recipient == "panel" && $("spinner")) {
			    $("spinner").hide()
			}
		    }
		}
	    }.bind(this),
	    onSuccess: function() {
		contentEl.addClass("pad");
		if (contentContainer == contentEl) {
		    if (args.recipient == "window") {
			instance.hideSpinner()
		    } else {
			if (args.recipient == "panel" && $("spinner")) {
			    $("spinner").hide()
			}
		    }
		}
		Browser.Engine.trident4 ? onContentLoaded.delay(750) : onContentLoaded()
	    }.bind(this),
	    onComplete: function() {
	    }.bind(this)
	}).send()
    },
    updateContentIframe: function(instance, options, args) {
	var contentEl = instance.contentEl;
	var contentContainer = args.contentContainer;
	var contentWrapperEl = instance.contentWrapperEl;
	var onContentLoaded = args.onContentLoaded;
	if (instance.options.contentURL == "" || contentContainer != contentEl) {
	    return
	}
	contentEl.removeClass("pad");
	contentEl.setStyle("padding", "0px");
	instance.iframeEl = new Element("iframe", {
	    id: instance.options.id + "_iframe",
	    name: instance.options.id + "_iframe",
	    "class": "mochaIframe",
	    src: options.url,
	    marginwidth: 0,
	    marginheight: 0,
	    frameBorder: 0,
	    scrolling: "auto",
	    styles: {
		height: contentWrapperEl.offsetHeight - contentWrapperEl.getStyle("border-top").toInt() - contentWrapperEl.getStyle("border-bottom").toInt(),
		width: instance.panelEl ? contentWrapperEl.offsetWidth - contentWrapperEl.getStyle("border-left").toInt() - contentWrapperEl.getStyle("border-right").toInt() : "100%"
	    }
	}).injectInside(contentEl);
	instance.iframeEl.addEvent("load", function(e) {
	    if (args.recipient == "window") {
		instance.hideSpinner()
	    } else {
		if (args.recipient == "panel" && contentContainer == contentEl && $("spinner")) {
		    $("spinner").hide()
		}
	    }
	    Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded()
	}.bind(this));
	if (args.recipient == "window") {
	    instance.showSpinner()
	} else {
	    if (args.recipient == "panel" && contentContainer == contentEl && $("spinner")) {
		$("spinner").show()
	    }
	}
    },
    updateContentHTML: function(instance, options, args) {
	var contentEl = instance.contentEl;
	var contentContainer = args.contentContainer;
	var onContentLoaded = args.onContentLoaded;
	var elementTypes = new Array("element", "textnode", "whitespace", "collection","htmltable");
	contentEl.addClass("pad");
	if (elementTypes.contains(typeOf(options.content))) {
	    contentContainer.empty().adopt(options.content);
	} else {
	    contentContainer.set("html", options.content)
	}
	if (contentContainer == contentEl) {
	    if (args.recipient == "window") {
		instance.hideSpinner()
	    } else {
		if (args.recipient == "panel" && $("spinner")) {
		    $("spinner").hide()
		}
	    }
	}
	Browser.Engine.trident4 ? onContentLoaded.delay(50) : onContentLoaded()
    },
    reloadIframe: function(iframe) {
	Browser.Engine.gecko ? $(iframe).src = $(iframe).src : top.frames[iframe].location.reload(true)
    },
    roundedRect: function(ctx, x, y, width, height, radius, rgb, a) {
	ctx.fillStyle = "rgba(" + rgb.join(",") + "," + a + ")";
	ctx.beginPath();
	ctx.moveTo(x, y + radius);
	ctx.lineTo(x, y + height - radius);
	ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
	ctx.lineTo(x + width - radius, y + height);
	ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
	ctx.lineTo(x + width, y + radius);
	ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
	ctx.lineTo(x + radius, y);
	ctx.quadraticCurveTo(x, y, x, y + radius);
	ctx.fill()
    },
    triangle: function(ctx, x, y, width, height, rgb, a) {
	ctx.beginPath();
	ctx.moveTo(x + width, y);
	ctx.lineTo(x, y + height);
	ctx.lineTo(x + width, y + height);
	ctx.closePath();
	ctx.fillStyle = "rgba(" + rgb.join(",") + "," + a + ")";
	ctx.fill()
    },
    circle: function(ctx, x, y, diameter, rgb, a) {
	ctx.beginPath();
	ctx.arc(x, y, diameter, 0, Math.PI * 2, true);
	ctx.fillStyle = "rgba(" + rgb.join(",") + "," + a + ")";
	ctx.fill()
    },
    notification: function(message) {
	new MUI.Window({
	    loadMethod: "html",
	    closeAfter: 1500,
	    type: "notification",
	    addClass: "notification",
	    content: message,
	    width: 220,
	    height: (/<br>/.test(message)?55:40),
	    y: 53,
	    padding: {
		top: 10,
		right: 12,
		bottom: 10,
		left: 12
	    },
	    shadowBlur: 5
	})
    },
    toggleAdvancedEffects: function(link) {
	if (MUI.options.advancedEffects == false) {
	    MUI.options.advancedEffects = true;
	    if (link) {
		this.toggleAdvancedEffectsLink = new Element("div", {
		    "class": "check",
		    id: "toggleAdvancedEffects_check"
		}).inject(link)
	    }
	} else {
	    MUI.options.advancedEffects = false;
	    if (this.toggleAdvancedEffectsLink) {
		this.toggleAdvancedEffectsLink.destroy()
	    }
	}
    },
    toggleStandardEffects: function(link) {
	if (MUI.options.standardEffects == false) {
	    MUI.options.standardEffects = true;
	    if (link) {
		this.toggleStandardEffectsLink = new Element("div", {
		    "class": "check",
		    id: "toggleStandardEffects_check"
		}).inject(link)
	    }
	} else {
	    MUI.options.standardEffects = false;
	    if (this.toggleStandardEffectsLink) {
		this.toggleStandardEffectsLink.destroy()
	    }
	}
    },
    underlayInitialize: function() {
	var windowUnderlay = new Element("div", {
	    id: "windowUnderlay",
	    styles: {
		height: parent.getCoordinates().height,
		opacity: 0.01,
		display: "none"
	    }
	}).inject(document.body)
    },
    setUnderlaySize: function() {
	$("windowUnderlay").setStyle("height", parent.getCoordinates().height)
    }
});
function fixPNG(myImage) {
    if (Browser.Engine.trident4 && document.body.filters) {
	var imgID = (myImage.id) ? "id='" + myImage.id + "' " : "";
	var imgClass = (myImage.className) ? "class='" + myImage.className + "' " : "";
	var imgTitle = (myImage.title) ? "title='" + myImage.title + "' " : "title='" + myImage.alt + "' ";
	var imgStyle = "display:inline-block;" + myImage.style.cssText;
	var strNewHTML = "<span " + imgID + imgClass + imgTitle + ' style="width:' + myImage.width + "px; height:" + myImage.height + "px;" + imgStyle + ";filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + myImage.src + "', sizingMethod='scale');\"></span>";
	myImage.outerHTML = strNewHTML
    }
}
document.addEvent("mousedown", function(event) {
    MUI.blurAll.delay(50)
});
window.addEvent("domready", function() {
    MUI.underlayInitialize()
});
window.addEvent("resize", function() {
    if ($("windowUnderlay")) {
	MUI.setUnderlaySize()
    } else {
	MUI.underlayInitialize()
    }
});
Element.implement({
    hide: function() {
	this.setStyle("display", "none");
	return this
    },
    show: function() {
	this.setStyle("display", "block");
	return this
    }
});
Element.implement({
    shake: function(radius, duration) {
	radius = radius || 3;
	duration = duration || 500;
	duration = (duration / 50).toInt() - 1;
	var parent = this.getParent();
	if (parent != $(document.body) && parent.getStyle("position") == "static") {
	    parent.setStyle("position", "relative")
	}
	var position = this.getStyle("position");
	if (position == "static") {
	    this.setStyle("position", "relative");
	    position = "relative"
	}
	if (Browser.Engine.trident) {
	    parent.setStyle("height", parent.getStyle("height"))
	}
	var coords = this.getPosition(parent);
	if (position == "relative" && !Browser.Engine.presto) {
	    coords.x -= parent.getStyle("paddingLeft").toInt();
	    coords.y -= parent.getStyle("paddingTop").toInt()
	}
	var morph = this.retrieve("morph");
	if (morph) {
	    morph.cancel();
	    var oldOptions = morph.options
	}
	var morph = this.get("morph");
	for (var i = 0; i < duration; i++) {
	    morph.start({
		duration: 50,
		link: "chain",
		top: coords.y + $random(-radius, radius),
		left: coords.x + $random(-radius, radius)
	    })
	}
	morph.start({
	    top: coords.y,
	    left: coords.x
	}).chain(function() {
	    if (oldOptions) {
		this.set("morph", oldOptions)
	    }
	}.bind(this));
	return this
    }
});
String.implement({
    parseQueryString: function() {
	var vars = this.split(/[&;]/);
	var rs = {};
	if (vars.length) {
	    vars.each(function(val) {
		var keys = val.split("=");
		if (keys.length && keys.length == 2) {
		    rs[decodeURIComponent(keys[0])] = decodeURIComponent(keys[1])
		}
	    })
	}
	return rs
    }
});
Request.HTML.implement({
    processHTML: function(text) {
	var match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	text = (match) ? match[1] : text;
	var container = new Element("div");
	return container.set("html", text)
    }
});
MUI.getCSSRule = function(selector) {
    for (var ii = 0; ii < document.styleSheets.length; ii++) {
	var mysheet = document.styleSheets[ii];
	var myrules = mysheet.cssRules ? mysheet.cssRules : mysheet.rules;
	for (i = 0; i < myrules.length; i++) {
	    if (myrules[i].selectorText == selector) {
		return myrules[i]
	    }
	}
    }
    return false
};
if (location.protocol == "file:") {
    Request.implement({
	isSuccess: function(status) {
	    return (status == 0 || (status >= 200) && (status < 300))
	}
    });
    Browser.Request = function() {
	return $try(function() {
	    return new ActiveXObject("MSXML2.XMLHTTP")
	}, function() {
	    return new XMLHttpRequest()
	})
    }
}
MUI.Require = new Class({
    Implements: [Options],
    options: {
	css: [],
	images: [],
	js: [],
	onloaded: $empty
    },
    initialize: function(options) {
	this.setOptions(options);
	var options = this.options;
	this.assetsToLoad = options.css.length + options.images.length + options.js.length;
	this.assetsLoaded = 0;
	var cssLoaded = 0;
	if (options.css.length) {
	    options.css.each(function(sheet) {
		this.getAsset(sheet, function() {
		    if (cssLoaded == options.css.length - 1) {
			if (this.assetsLoaded == this.assetsToLoad - 1) {
			    this.requireOnload()
			} else {
			    this.assetsLoaded++;
			    this.requireContinue.delay(50, this)
			}
		    } else {
			cssLoaded++;
			this.assetsLoaded++
		    }
		}.bind(this))
	    }.bind(this))
	} else {
	    if (!options.js.length && !options.images.length) {
		this.options.onloaded();
		return true
	    } else {
		this.requireContinue.delay(50, this)
	    }
	}
    },
    requireOnload: function() {
	this.assetsLoaded++;
	if (this.assetsLoaded == this.assetsToLoad) {
	    this.options.onloaded();
	    return true
	}
    },
    requireContinue: function() {
	var options = this.options;
	if (options.images.length) {
	    options.images.each(function(image) {
		this.getAsset(image, this.requireOnload.bind(this))
	    }.bind(this))
	}
	if (options.js.length) {
	    options.js.each(function(script) {
		this.getAsset(script, this.requireOnload.bind(this))
	    }.bind(this))
	}
    },
    getAsset: function(source, onloaded) {
	if (MUI.files[source] == "loaded") {
	    if (typeof onloaded == "function") {
		onloaded()
	    }
	    return true
	} else {
	    if (MUI.files[source] == "loading") {
		var tries = 0;
		var checker = (function() {
		    tries++;
		    if (MUI.files[source] == "loading" && tries < "100") {
			return
		    }
		    $clear(checker);
		    if (typeof onloaded == "function") {
			onloaded()
		    }
		}).periodical(50)
	    } else {
		MUI.files[source] = "loading";
		properties = {
		    onloaded: onloaded != "undefined" ? onloaded : $empty
		};
		var oldonloaded = properties.onloaded;
		properties.onloaded = function() {
		    MUI.files[source] = "loaded";
		    if (oldonloaded) {
			oldonloaded()
		    }
		}.bind(this);
		switch (source.match(/\.\w+$/)[0]) {
		    case ".js":
			return Asset.javascript(source, properties);
		    case ".css":
			return Asset.css(source, properties);
		    case ".jpg":
		    case ".png":
		    case ".gif":
			return Asset.image(source, properties)
		}
		alert('The required file "' + source + '" could not be loaded')
	    }
	}
    }
});
$extend(Asset, {
    javascript: function(source, properties) {
	properties = $extend({
	    onloaded: $empty,
	    document: document,
	    check: $lambda(true)
	}, properties);
	if ($(properties.id)) {
	    properties.onloaded();
	    return $(properties.id)
	}
	var script = new Element("script", {
	    src: source,
	    type: "text/javascript"
	});
	var load = properties.onloaded.bind(script), check = properties.check, doc = properties.document;
	delete properties.onloaded;
	delete properties.check;
	delete properties.document;
	if (!Browser.Engine.webkit419 && !Browser.Engine.presto) {
	    script.addEvents({
		load: load,
		readystatechange: function() {
		    if (Browser.Engine.trident && ["loaded", "complete"].contains(this.readyState)) {
			load()
		    }
		}
	    }).setProperties(properties)
	} else {
	    var checker = (function() {
		if (!$try(check)) {
		    return
		}
		$clear(checker);
		Browser.Engine.presto ? load.delay(500) : load()
	    }).periodical(50)
	}
	return script.inject(doc.head)
    },
    css: function(source, properties) {
	properties = $extend({
	    id: null,
	    media: "screen",
	    onloaded: $empty
	}, properties);
	new Request({
	    method: "get",
	    url: source,
	    onComplete: function(response) {
		var newSheet = new Element("link", {
		    id: properties.id,
		    rel: "stylesheet",
		    media: properties.media,
		    type: "text/css",
		    href: source
		}).inject(document.head);
		properties.onloaded()
	    }.bind(this),
	    onFailure: function(response) {
	    },
	    onSuccess: function() {
	    }.bind(this)
	}).send()
    }
});
MUI.extend({
    newWindowsFromHTML: function(arg) {
	new MUI.Require({
	    js: [MUI.path.plugins + "mochaui/Window/Windows-from-html.js"],
	    onloaded: function() {
		new MUI.newWindowsFromHTML(arg)
	    }
	})
    },
    newWindowsFromJSON: function(arg) {
	new MUI.Require({
	    js: [MUI.path.plugins + "mochaui/Window/Windows-from-json.js"],
	    onloaded: function() {
		new MUI.newWindowsFromJSON(arg)
	    }
	})
    },
    arrangeCascade: function() {
	new MUI.Require({
	    js: [MUI.path.plugins + "mochaui/Window/Arrange-cascade.js"],
	    onloaded: function() {
		new MUI.arrangeCascade()
	    }
	})
    },
    arrangeTile: function() {
	new MUI.Require({
	    js: [MUI.path.plugins + "mochaui/Window/Arrange-tile.js"],
	    onloaded: function() {
		new MUI.arrangeTile()
	    }
	})
    },
    saveWorkspace: function() {
	new MUI.Require({
	    js: [MUI.path.plugins + "mochaui/Layout/Workspaces.js"],
	    onloaded: function() {
		new MUI.saveWorkspace()
	    }
	})
    },
    loadWorkspace: function() {
	new MUI.Require({
	    js: [MUI.path.plugins + "mochaui/Layout/Workspaces.js"],
	    onloaded: function() {
		new MUI.loadWorkspace()
	    }
	})
    },
    Themes: {
	init: function(arg) {
	    new MUI.Require({
		js: [MUI.path.plugins + "mochaui/Utilities/Themes.js"],
		onloaded: function() {
		    MUI.Themes.init(arg)
		}
	    })
	}
    }
});
if (Browser.Engine.webkit) {
    new MUI.Require({
	js: [MUI.path.plugins + "mochaui/Window/WebKitShadower.js"]
    })
}
MUI.files[MUI.path.source + "Window/Window.js"] = "loading";
MUI.extend({
    Windows: {
	instances: new Hash(),
	indexLevel: 100,
	windowIDCount: 0,
	windowsVisible: true,
	focusingWindow: false
    }
});
MUI.Windows.windowOptions = {
    id: null,
    title: "New Window",
    icon: false,
    type: "window",
    require: {
	css: [],
	images: [],
	js: [],
	onloaded: null
    },
    loadMethod: null,
    method: "get",
    contentURL: null,
    data: null,
    closeAfter: false,
    evalScripts: true,
    evalResponse: false,
    content: "Window content",
    toolbar: false,
    toolbarPosition: "top",
    toolbarHeight: 29,
    toolbarURL: "pages/lipsum.html",
    toolbarData: null,
    toolbarContent: "",
    toolbarOnload: $empty,
    toolbar2: false,
    toolbar2Position: "bottom",
    toolbar2Height: 29,
    toolbar2URL: "pages/lipsum.html",
    toolbar2Data: null,
    toolbar2Content: "",
    toolbar2Onload: $empty,
    container: null,
    restrict: true,
    shape: "box",
    collapsible: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    storeOnClose: false,
    modalOverlayClose: true,
    draggable: null,
    draggableGrid: false,
    draggableLimit: false,
    draggableSnap: false,
    resizable: null,
    resizeLimit: {
	x: [250, 2500],
	y: [125, 2000]
    },
    addClass: "",
    width: 300,
    height: 125,
    headerHeight: 25,
    footerHeight: 35,
    cornerRadius: 8,
    x: null,
    y: null,
    scrollbars: true,
    padding: {
	top: 10,
	right: 12,
	bottom: 10,
	left: 12
    },
    shadowBlur: 5,
    shadowOffset: {
	x: 0,
	y: 1
    },
    controlsOffset: {
	right: 6,
	top: 6
    },
    useCanvas: true,
    useCanvasControls: true,
    useSpinner: true,
    headerStartColor: [250, 250, 250],
    headerStopColor: [229, 229, 229],
    bodyBgColor: [229, 229, 229],
    minimizeBgColor: [255, 255, 255],
    minimizeColor: [0, 0, 0],
    maximizeBgColor: [255, 255, 255],
    maximizeColor: [0, 0, 0],
    closeBgColor: [255, 255, 255],
    closeColor: [0, 0, 0],
    resizableColor: [254, 254, 254],
    onBeforeBuild: $empty,
    onContentLoaded: $empty,
    onFocus: $empty,
    onBlur: $empty,
    onResize: $empty,
    onMinimize: $empty,
    onMaximize: $empty,
    onRestore: $empty,
    onClose: $empty,
    onCloseComplete: $empty
};
MUI.Windows.windowOptionsOriginal = $merge(MUI.Windows.windowOptions);
MUI.Window = new Class({
    Implements: [Events, Options],
    options: MUI.Windows.windowOptions,
    initialize: function(options) {
	this.setOptions(options);
	var options = this.options;
	$extend(this, {
	    mochaControlsWidth: 0,
	    minimizebuttonX: 0,
	    maximizebuttonX: 0,
	    closebuttonX: 0,
	    headerFooterShadow: options.headerHeight + options.footerHeight + (options.shadowBlur * 2),
	    oldTop: 0,
	    oldLeft: 0,
	    isMaximized: false,
	    isMinimized: false,
	    isCollapsed: false,
	    timestamp: $time()
	});
	if (options.type != "window") {
	    options.container = document.body;
	    options.minimizable = false
	}
	if (!options.container) {
	    options.container = MUI.Desktop && MUI.Desktop.desktop ? MUI.Desktop.desktop : document.body
	}
	if (options.resizable == null) {
	    if (options.type != "window" || options.shape == "gauge") {
		options.resizable = false
	    } else {
		options.resizable = true
	    }
	}
	if (options.draggable == null) {
	    options.draggable = options.type != "window" ? false : true
	}
	if (options.shape == "gauge" || options.type == "notification") {
	    options.collapsible = false;
	    options.maximizable = false;
	    options.contentBgColor = "transparent";
	    options.scrollbars = false;
	    options.footerHeight = 0
	}
	if (options.type == "notification") {
	    options.closable = false;
	    options.headerHeight = 0
	}
	if (MUI.Dock && $(MUI.options.dock)) {
	    if (MUI.Dock.dock && options.type != "modal" && options.type != "modal2") {
		options.minimizable = options.minimizable
	    }
	} else {
	    options.minimizable = false
	}
	options.maximizable = MUI.Desktop && MUI.Desktop.desktop && options.maximizable && options.type != "modal" && options.type != "modal2";
	if (this.options.type == "modal2") {
	    this.options.shadowBlur = 0;
	    this.options.shadowOffset = {
		x: 0,
		y: 0
	    };
	    this.options.useSpinner = false;
	    this.options.useCanvas = false;
	    this.options.footerHeight = 0;
	    this.options.headerHeight = 0
	}
	options.id = options.id || "win" + (++MUI.Windows.windowIDCount);
	this.windowEl = $(options.id);
	if (options.require.css.length || options.require.images.length) {
	    new MUI.Require({
		css: options.require.css,
		images: options.require.images,
		onloaded: function() {
		    this.newWindow()
		}.bind(this)
	    })
	} else {
	    this.newWindow()
	}
	return this
    },
    saveValues: function() {
	var coordinates = this.windowEl.getCoordinates();
	this.options.x = coordinates.left.toInt();
	this.options.y = coordinates.top.toInt()
    },
    newWindow: function(properties) {
	var instances = MUI.Windows.instances;
	var instanceID = MUI.Windows.instances.get(this.options.id);
	var options = this.options;
	if (instanceID) {
	    var instance = instanceID
	}
	if (this.windowEl && !this.isClosing) {
	    if (instance.isMinimized) {
		MUI.Dock.restoreMinimized(this.windowEl)
	    } else {
		if (instance.isCollapsed) {
		    MUI.collapseToggle(this.windowEl);
		    setTimeout(MUI.focusWindow.pass(this.windowEl, this), 10)
		} else {
		    if (this.windowEl.hasClass("windowClosed")) {
			if (instance.check) {
			    instance.check.show()
			}
			this.windowEl.removeClass("windowClosed");
			this.windowEl.setStyle("opacity", 0);
			this.windowEl.addClass("mocha");
			if (MUI.Dock && $(MUI.options.dock) && instance.options.type == "window") {
			    var currentButton = $(instance.options.id + "_dockTab");
			    if (currentButton != null) {
				currentButton.show()
			    }
			    MUI.Desktop.setDesktopSize()
			}
			instance.displayNewWindow()
		    } else {
			var coordinates = document.getCoordinates();
			if (this.windowEl.getStyle("left").toInt() > coordinates.width || this.windowEl.getStyle("top").toInt() > coordinates.height) {
			    MUI.centerWindow(this.windowEl)
			}
			setTimeout(MUI.focusWindow.pass(this.windowEl, this), 10);
			if (MUI.options.standardEffects == true) {
			    this.windowEl.shake()
			}
		    }
		}
	    }
	    return
	} else {
	    instances.set(options.id, this)
	}
	this.isClosing = false;
	this.fireEvent("onBeforeBuild");
	MUI.Windows.indexLevel++;
	this.windowEl = new Element("div", {
	    "class": "mocha",
	    id: options.id,
	    styles: {
		position: "absolute",
		width: options.width,
		height: options.height,
		display: "block",
		opacity: 0,
		zIndex: MUI.Windows.indexLevel += 2
	    }
	});
	this.windowEl.store("instance", this);
	this.windowEl.addClass(options.addClass);
	if (options.type == "modal2") {
	    this.windowEl.addClass("modal2")
	}
	if (Browser.Engine.trident && options.shape == "gauge") {
	    this.windowEl.setStyle("backgroundImage", "url(../images/spacer.gif)")
	}
	if ((this.options.type == "modal" || options.type == "modal2") && Browser.Platform.mac && Browser.Engine.gecko) {
	    if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
		var ffversion = new Number(RegExp.$1);
		if (ffversion < 3) {
		    this.windowEl.setStyle("position", "fixed")
		}
	    }
	}
	if (options.loadMethod == "iframe") {
	    options.padding = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	    }
	}
	this.insertWindowElements();
	this.titleEl.set("html", options.title);
	this.contentWrapperEl.setStyle("overflow", "hidden");
	this.contentEl.setStyles({
	    "padding-top": options.padding.top,
	    "padding-bottom": options.padding.bottom,
	    "padding-left": options.padding.left,
	    "padding-right": options.padding.right
	});
	if (options.shape == "gauge") {
	    if (options.useCanvasControls) {
		this.canvasControlsEl.setStyle("visibility", "hidden")
	    } else {
		this.controlsEl.setStyle("visibility", "hidden")
	    }
	    this.windowEl.addEvent("mouseover", function() {
		this.mouseover = true;
		var showControls = function() {
		    if (this.mouseover != false) {
			if (options.useCanvasControls) {
			    this.canvasControlsEl.setStyle("visibility", "visible")
			} else {
			    this.controlsEl.setStyle("visibility", "visible")
			}
			this.canvasHeaderEl.setStyle("visibility", "visible");
			this.titleEl.show()
		    }
		};
		showControls.delay(0, this)
	    }.bind(this));
	    this.windowEl.addEvent("mouseleave", function() {
		this.mouseover = false;
		if (this.options.useCanvasControls) {
		    this.canvasControlsEl.setStyle("visibility", "hidden")
		} else {
		    this.controlsEl.setStyle("visibility", "hidden")
		}
		this.canvasHeaderEl.setStyle("visibility", "hidden");
		this.titleEl.hide()
	    }.bind(this))
	}
	this.windowEl.inject(options.container);
	this.setColors();
	if (options.type != "notification") {
	    this.setMochaControlsWidth()
	}
	MUI.updateContent({
	    element: this.windowEl,
	    content: options.content,
	    method: options.method,
	    url: options.contentURL,
	    data: options.data,
	    onContentLoaded: null,
	    require: {
		js: options.require.js,
		onloaded: options.require.onloaded
	    }
	});
	if (this.options.toolbar == true) {
	    MUI.updateContent({
		element: this.windowEl,
		childElement: this.toolbarEl,
		content: options.toolbarContent,
		loadMethod: "xhr",
		method: options.method,
		url: options.toolbarURL,
		data: options.toolbarData,
		onContentLoaded: options.toolbarOnload
	    })
	}
	if (this.options.toolbar2 == true) {
	    MUI.updateContent({
		element: this.windowEl,
		childElement: this.toolbar2El,
		content: options.toolbar2Content,
		loadMethod: "xhr",
		method: options.method,
		url: options.toolbar2URL,
		data: options.toolbar2Data,
		onContentLoaded: options.toolbar2Onload
	    })
	}
	this.drawWindow();
	this.attachDraggable();
	this.attachResizable();
	this.setupEvents();
	if (options.resizable) {
	    this.adjustHandles()
	}
	if (options.container == document.body || options.container == MUI.Desktop.desktop) {
	    var dimensions = window.getSize()
	} else {
	    var dimensions = $(this.options.container).getSize()
	}
	var x, y;
	if (!options.y) {
	    if (MUI.Desktop && MUI.Desktop.desktop) {
		y = (dimensions.y * 0.5) - (this.windowEl.offsetHeight * 0.5);
		if (y < -options.shadowBlur) {
		    y = -options.shadowBlur
		}
	    } else {
		y = window.getScroll().y + (window.getSize().y * 0.5) - (this.windowEl.offsetHeight * 0.5);
		if (y < -options.shadowBlur) {
		    y = -options.shadowBlur
		}
	    }
	} else {
	    y = options.y - options.shadowBlur
	}
	if (this.options.x == null) {
	    x = (dimensions.x * 0.5) - (this.windowEl.offsetWidth * 0.5);
	    if (x < -options.shadowBlur) {
		x = -options.shadowBlur
	    }
	} else {
	    x = options.x - options.shadowBlur
	}
	this.windowEl.setStyles({
	    top: y,
	    left: x
	});
	this.opacityMorph = new Fx.Morph(this.windowEl, {
	    duration: 350,
	    transition: Fx.Transitions.Sine.easeInOut,
	    onComplete: function() {
		if (Browser.Engine.trident) {
		    this.drawWindow()
		}
	    }.bind(this)
	});
	this.displayNewWindow();
	this.morph = new Fx.Morph(this.windowEl, {
	    duration: 200
	});
	this.windowEl.store("morph", this.morph);
	this.resizeMorph = new Fx.Elements([this.contentWrapperEl, this.windowEl], {
	    duration: 400,
	    transition: Fx.Transitions.Sine.easeInOut,
	    onStart: function() {
		this.resizeAnimation = this.drawWindow.periodical(20, this)
	    }.bind(this),
	    onComplete: function() {
		$clear(this.resizeAnimation);
		this.drawWindow();
		if (this.iframeEl) {
		    this.iframeEl.setStyle("visibility", "visible")
		}
	    }.bind(this)
	});
	this.windowEl.store("resizeMorph", this.resizeMorph);
	if ($(this.windowEl.id + "LinkCheck")) {
	    this.check = new Element("div", {
		"class": "check",
		id: this.options.id + "_check"
	    }).inject(this.windowEl.id + "LinkCheck")
	}
	if (this.options.closeAfter != false) {
	    MUI.closeWindow.delay(this.options.closeAfter, this, this.windowEl)
	}
	if (MUI.Dock && $(MUI.options.dock) && this.options.type == "window") {
	    MUI.Dock.createDockTab(this.windowEl)
	}
    },
    displayNewWindow: function() {
	options = this.options;
	if (options.type == "modal" || options.type == "modal2") {
	    MUI.currentModal = this.windowEl;
	    if (Browser.Engine.trident4) {
		$("modalFix").show()
	    }
	    $("modalOverlay").show();
	    if (MUI.options.advancedEffects == false) {
		$("modalOverlay").setStyle("opacity", 0.6);
		this.windowEl.setStyles({
		    zIndex: 11000,
		    opacity: 1
		})
	    } else {
		MUI.Modal.modalOverlayCloseMorph.cancel();
		MUI.Modal.modalOverlayOpenMorph.start({
		    opacity: 0.6
		});
		this.windowEl.setStyles({
		    zIndex: 11000
		});
		this.opacityMorph.start({
		    opacity: 1
		})
	    }
	    $$(".dockTab").removeClass("activeDockTab");
	    $$(".mocha").removeClass("isFocused");
	    this.windowEl.addClass("isFocused")
	} else {
	    if (MUI.options.advancedEffects == false) {
		this.windowEl.setStyle("opacity", 1);
		setTimeout(MUI.focusWindow.pass(this.windowEl, this), 10)
	    } else {
		if (Browser.Engine.trident) {
		    this.drawWindow(false)
		}
		this.opacityMorph.start({
		    opacity: 1
		});
		setTimeout(MUI.focusWindow.pass(this.windowEl, this), 10)
	    }
	}
    },
    setupEvents: function() {
	var windowEl = this.windowEl;
	if (this.closeButtonEl) {
	    this.closeButtonEl.addEvent("click", function(e) {
		new Event(e).stop();
		MUI.closeWindow(windowEl)
	    }.bind(this))
	}
	if (this.options.type == "window") {
	    windowEl.addEvent("mousedown", function(e) {
		if (Browser.Engine.trident) {
		    new Event(e).stop()
		}
		MUI.focusWindow(windowEl);
		if (windowEl.getStyle("top").toInt() < -this.options.shadowBlur) {
		    windowEl.setStyle("top", -this.options.shadowBlur)
		}
	    }.bind(this))
	}
	if (this.minimizeButtonEl) {
	    this.minimizeButtonEl.addEvent("click", function(e) {
		new Event(e).stop();
		MUI.Dock.minimizeWindow(windowEl)
	    }.bind(this))
	}
	if (this.maximizeButtonEl) {
	    this.maximizeButtonEl.addEvent("click", function(e) {
		new Event(e).stop();
		if (this.isMaximized) {
		    MUI.Desktop.restoreWindow(windowEl)
		} else {
		    MUI.Desktop.maximizeWindow(windowEl)
		}
	    }.bind(this))
	}
	if (this.options.collapsible == true) {
	    this.titleEl.addEvent("selectstart", function(e) {
		e = new Event(e).stop()
	    }.bind(this));
	    if (Browser.Engine.trident) {
		this.titleBarEl.addEvent("mousedown", function(e) {
		    this.titleEl.setCapture()
		}.bind(this));
		this.titleBarEl.addEvent("mouseup", function(e) {
		    this.titleEl.releaseCapture()
		}.bind(this))
	    }
	    this.titleBarEl.addEvent("dblclick", function(e) {
		e = new Event(e).stop();
		MUI.collapseToggle(this.windowEl)
	    }.bind(this))
	}
    },
    attachDraggable: function() {
	var windowEl = this.windowEl;
	if (!this.options.draggable) {
	    return
	}
	this.windowDrag = new Drag.Move(windowEl, {
	    handle: this.titleBarEl,
	    container: this.options.restrict == true ? $(this.options.container) : false,
	    grid: this.options.draggableGrid,
	    limit: this.options.draggableLimit,
	    snap: this.options.draggableSnap,
	    onStart: function() {
		if (this.options.type != "modal" && this.options.type != "modal2") {
		    MUI.focusWindow(windowEl);
		    $("windowUnderlay").show()
		}
		if (this.iframeEl) {
		    if (!Browser.Engine.trident) {
			this.iframeEl.setStyle("visibility", "hidden")
		    } else {
			this.iframeEl.hide()
		    }
		}
	    }.bind(this),
	    onComplete: function() {
		if (this.options.type != "modal" && this.options.type != "modal2") {
		    $("windowUnderlay").hide()
		}
		if (this.iframeEl) {
		    if (!Browser.Engine.trident) {
			this.iframeEl.setStyle("visibility", "visible")
		    } else {
			this.iframeEl.show()
		    }
		}
		this.saveValues()
	    }.bind(this)
	})
    },
    attachResizable: function() {
	var windowEl = this.windowEl;
	if (!this.options.resizable) {
	    return
	}
	this.resizable1 = this.windowEl.makeResizable({
	    handle: [this.n, this.ne, this.nw],
	    limit: {
		y: [function() {
		    return this.windowEl.getStyle("top").toInt() + this.windowEl.getStyle("height").toInt() - this.options.resizeLimit.y[1]
		}.bind(this), function() {
		    return this.windowEl.getStyle("top").toInt() + this.windowEl.getStyle("height").toInt() - this.options.resizeLimit.y[0]
		}.bind(this)]
	    },
	    modifiers: {
		x: false,
		y: "top"
	    },
	    onStart: function() {
		this.resizeOnStart();
		this.coords = this.contentWrapperEl.getCoordinates();
		this.y2 = this.coords.top.toInt() + this.contentWrapperEl.offsetHeight
	    }.bind(this),
	    onDrag: function() {
		this.coords = this.contentWrapperEl.getCoordinates();
		this.contentWrapperEl.setStyle("height", this.y2 - this.coords.top.toInt());
		this.resizeOnDrag()
	    }.bind(this),
	    onComplete: function() {
		this.resizeOnComplete()
	    }.bind(this)
	});
	this.resizable2 = this.contentWrapperEl.makeResizable({
	    handle: [this.e, this.ne],
	    limit: {
		x: [this.options.resizeLimit.x[0] - (this.options.shadowBlur * 2), this.options.resizeLimit.x[1] - (this.options.shadowBlur * 2)]
	    },
	    modifiers: {
		x: "width",
		y: false
	    },
	    onStart: function() {
		this.resizeOnStart()
	    }.bind(this),
	    onDrag: function() {
		this.resizeOnDrag()
	    }.bind(this),
	    onComplete: function() {
		this.resizeOnComplete()
	    }.bind(this)
	});
	this.resizable3 = this.contentWrapperEl.makeResizable({
	    container: this.options.restrict == true ? $(this.options.container) : false,
	    handle: this.se,
	    limit: {
		x: [this.options.resizeLimit.x[0] - (this.options.shadowBlur * 2), this.options.resizeLimit.x[1] - (this.options.shadowBlur * 2)],
		y: [this.options.resizeLimit.y[0] - this.headerFooterShadow, this.options.resizeLimit.y[1] - this.headerFooterShadow]
	    },
	    modifiers: {
		x: "width",
		y: "height"
	    },
	    onStart: function() {
		this.resizeOnStart()
	    }.bind(this),
	    onDrag: function() {
		this.resizeOnDrag()
	    }.bind(this),
	    onComplete: function() {
		this.resizeOnComplete()
	    }.bind(this)
	});
	this.resizable4 = this.contentWrapperEl.makeResizable({
	    handle: [this.s, this.sw],
	    limit: {
		y: [this.options.resizeLimit.y[0] - this.headerFooterShadow, this.options.resizeLimit.y[1] - this.headerFooterShadow]
	    },
	    modifiers: {
		x: false,
		y: "height"
	    },
	    onStart: function() {
		this.resizeOnStart()
	    }.bind(this),
	    onDrag: function() {
		this.resizeOnDrag()
	    }.bind(this),
	    onComplete: function() {
		this.resizeOnComplete()
	    }.bind(this)
	});
	this.resizable5 = this.windowEl.makeResizable({
	    handle: [this.w, this.sw, this.nw],
	    limit: {
		x: [function() {
		    return this.windowEl.getStyle("left").toInt() + this.windowEl.getStyle("width").toInt() - this.options.resizeLimit.x[1]
		}.bind(this), function() {
		    return this.windowEl.getStyle("left").toInt() + this.windowEl.getStyle("width").toInt() - this.options.resizeLimit.x[0]
		}.bind(this)]
	    },
	    modifiers: {
		x: "left",
		y: false
	    },
	    onStart: function() {
		this.resizeOnStart();
		this.coords = this.contentWrapperEl.getCoordinates();
		this.x2 = this.coords.left.toInt() + this.contentWrapperEl.offsetWidth
	    }.bind(this),
	    onDrag: function() {
		this.coords = this.contentWrapperEl.getCoordinates();
		this.contentWrapperEl.setStyle("width", this.x2 - this.coords.left.toInt());
		this.resizeOnDrag()
	    }.bind(this),
	    onComplete: function() {
		this.resizeOnComplete()
	    }.bind(this)
	})
    },
    resizeOnStart: function() {
	$("windowUnderlay").show();
	if (this.iframeEl) {
	    if (!Browser.Engine.trident) {
		this.iframeEl.setStyle("visibility", "hidden")
	    } else {
		this.iframeEl.hide()
	    }
	}
    },
    resizeOnDrag: function() {
	if (Browser.Engine.gecko) {
	    this.windowEl.getElements(".panel").each(function(panel) {
		panel.store("oldOverflow", panel.getStyle("overflow"));
		panel.setStyle("overflow", "visible")
	    })
	}
	this.drawWindow();
	this.adjustHandles();
	if (Browser.Engine.gecko) {
	    this.windowEl.getElements(".panel").each(function(panel) {
		panel.setStyle("overflow", panel.retrieve("oldOverflow"))
	    })
	}
    },
    resizeOnComplete: function() {
	$("windowUnderlay").hide();
	if (this.iframeEl) {
	    if (!Browser.Engine.trident) {
		this.iframeEl.setStyle("visibility", "visible")
	    } else {
		this.iframeEl.show();
		this.iframeEl.setStyle("width", "99%");
		this.iframeEl.setStyle("height", this.contentWrapperEl.offsetHeight);
		this.iframeEl.setStyle("width", "100%");
		this.iframeEl.setStyle("height", this.contentWrapperEl.offsetHeight)
	    }
	}
	if (this.contentWrapperEl.getChildren(".column") != null) {
	    MUI.rWidth(this.contentWrapperEl);
	    this.contentWrapperEl.getChildren(".column").each(function(column) {
		MUI.panelHeight(column)
	    })
	}
	this.fireEvent("onResize", this.windowEl)
    },
    adjustHandles: function() {
	var shadowBlur = this.options.shadowBlur;
	var shadowBlur2x = shadowBlur * 2;
	var shadowOffset = this.options.shadowOffset;
	var top = shadowBlur - shadowOffset.y - 1;
	var right = shadowBlur + shadowOffset.x - 1;
	var bottom = shadowBlur + shadowOffset.y - 1;
	var left = shadowBlur - shadowOffset.x - 1;
	var coordinates = this.windowEl.getCoordinates();
	var width = coordinates.width - shadowBlur2x + 2;
	var height = coordinates.height - shadowBlur2x + 2;
	this.n.setStyles({
	    top: top,
	    left: left + 10,
	    width: width - 20
	});
	this.e.setStyles({
	    top: top + 10,
	    right: right,
	    height: height - 30
	});
	this.s.setStyles({
	    bottom: bottom,
	    left: left + 10,
	    width: width - 30
	});
	this.w.setStyles({
	    top: top + 10,
	    left: left,
	    height: height - 20
	});
	this.ne.setStyles({
	    top: top,
	    right: right
	});
	this.se.setStyles({
	    bottom: bottom,
	    right: right
	});
	this.sw.setStyles({
	    bottom: bottom,
	    left: left
	});
	this.nw.setStyles({
	    top: top,
	    left: left
	})
    },
    detachResizable: function() {
	this.resizable1.detach();
	this.resizable2.detach();
	this.resizable3.detach();
	this.resizable4.detach();
	this.resizable5.detach();
	this.windowEl.getElements(".handle").hide()
    },
    reattachResizable: function() {
	this.resizable1.attach();
	this.resizable2.attach();
	this.resizable3.attach();
	this.resizable4.attach();
	this.resizable5.attach();
	this.windowEl.getElements(".handle").show()
    },
    insertWindowElements: function() {
	var options = this.options;
	var height = options.height;
	var width = options.width;
	var id = options.id;
	var cache = {};
	if (Browser.Engine.trident4) {
	    cache.zIndexFixEl = new Element("iframe", {
		id: id + "_zIndexFix",
		"class": "zIndexFix",
		scrolling: "no",
		marginWidth: 0,
		marginHeight: 0,
		src: "",
		styles: {
		    position: "absolute"
		}
	    }).inject(this.windowEl)
	}
	cache.overlayEl = new Element("div", {
	    id: id + "_overlay",
	    "class": "mochaOverlay",
	    styles: {
		position: "absolute",
		top: 0,
		left: 0
	    }
	}).inject(this.windowEl);
	cache.titleBarEl = new Element("div", {
	    id: id + "_titleBar",
	    "class": "mochaTitlebar",
	    styles: {
		cursor: options.draggable ? "move" : "default"
	    }
	}).inject(cache.overlayEl, "top");
	cache.titleEl = new Element("h3", {
	    id: id + "_title",
	    "class": "mochaTitle"
	}).inject(cache.titleBarEl);
	if (options.icon != false) {
	    cache.titleEl.setStyles({
		"padding-left": 28,
		background: "url(" + options.icon + ") 5px 4px no-repeat"
	    })
	}
	cache.contentBorderEl = new Element("div", {
	    id: id + "_contentBorder",
	    "class": "mochaContentBorder"
	}).inject(cache.overlayEl);
	if (options.toolbar) {
	    cache.toolbarWrapperEl = new Element("div", {
		id: id + "_toolbarWrapper",
		"class": "mochaToolbarWrapper",
		styles: {
		    height: options.toolbarHeight
		}
	    }).inject(cache.contentBorderEl, options.toolbarPosition == "bottom" ? "after" : "before");
	    if (options.toolbarPosition == "bottom") {
		cache.toolbarWrapperEl.addClass("bottom")
	    }
	    cache.toolbarEl = new Element("div", {
		id: id + "_toolbar",
		"class": "mochaToolbar",
		styles: {
		    height: options.toolbarHeight
		}
	    }).inject(cache.toolbarWrapperEl)
	}
	if (options.toolbar2) {
	    cache.toolbar2WrapperEl = new Element("div", {
		id: id + "_toolbar2Wrapper",
		"class": "mochaToolbarWrapper",
		styles: {
		    height: options.toolbar2Height
		}
	    }).inject(cache.contentBorderEl, options.toolbar2Position == "bottom" ? "after" : "before");
	    if (options.toolbar2Position == "bottom") {
		cache.toolbar2WrapperEl.addClass("bottom")
	    }
	    cache.toolbar2El = new Element("div", {
		id: id + "_toolbar2",
		"class": "mochaToolbar",
		styles: {
		    height: options.toolbar2Height
		}
	    }).inject(cache.toolbar2WrapperEl)
	}
	cache.contentWrapperEl = new Element("div", {
	    id: id + "_contentWrapper",
	    "class": "mochaContentWrapper",
	    styles: {
		width: width + "px",
		height: height + "px"
	    }
	}).inject(cache.contentBorderEl);
	if (this.options.shape == "gauge") {
	    cache.contentBorderEl.setStyle("borderWidth", 0)
	}
	cache.contentEl = new Element("div", {
	    id: id + "_content",
	    "class": "mochaContent"
	}).inject(cache.contentWrapperEl);
	if (this.options.useCanvas == true && Browser.Engine.trident != true) {
	    cache.canvasEl = new Element("canvas", {
		id: id + "_canvas",
		"class": "mochaCanvas",
		width: 10,
		height: 10
	    }).inject(this.windowEl)
	}
	if (this.options.useCanvas == true && Browser.Engine.trident) {
	    cache.canvasEl = new Element("canvas", {
		id: id + "_canvas",
		"class": "mochaCanvas",
		width: 50000,
		height: 20000,
		styles: {
		    position: "absolute",
		    top: 0,
		    left: 0
		}
	    }).inject(this.windowEl);
	    if (MUI.ieSupport == "excanvas") {
		G_vmlCanvasManager.initElement(cache.canvasEl);
		cache.canvasEl = this.windowEl.getElement(".mochaCanvas")
	    }
	}
	cache.controlsEl = new Element("div", {
	    id: id + "_controls",
	    "class": "mochaControls"
	}).inject(cache.overlayEl, "after");
	if (options.useCanvasControls == true) {
	    cache.canvasControlsEl = new Element("canvas", {
		id: id + "_canvasControls",
		"class": "mochaCanvasControls",
		width: 14,
		height: 14
	    }).inject(this.windowEl);
	    if (Browser.Engine.trident && MUI.ieSupport == "excanvas") {
		G_vmlCanvasManager.initElement(cache.canvasControlsEl);
		cache.canvasControlsEl = this.windowEl.getElement(".mochaCanvasControls")
	    }
	}
	if (options.closable) {
	    cache.closeButtonEl = new Element("div", {
		id: id + "_closeButton",
		"class": "mochaCloseButton mochaWindowButton",
		title: "Close"
	    }).inject(cache.controlsEl)
	}
	if (options.maximizable) {
	    cache.maximizeButtonEl = new Element("div", {
		id: id + "_maximizeButton",
		"class": "mochaMaximizeButton mochaWindowButton",
		title: "Maximize"
	    }).inject(cache.controlsEl)
	}
	if (options.minimizable) {
	    cache.minimizeButtonEl = new Element("div", {
		id: id + "_minimizeButton",
		"class": "mochaMinimizeButton mochaWindowButton",
		title: "Minimize"
	    }).inject(cache.controlsEl)
	}
	if (options.useSpinner == true && options.shape != "gauge" && options.type != "notification") {
	    cache.spinnerEl = new Element("div", {
		id: id + "_spinner",
		"class": "mochaSpinner",
		width: 16,
		height: 16
	    }).inject(this.windowEl, "bottom")
	}
	if (this.options.shape == "gauge") {
	    cache.canvasHeaderEl = new Element("canvas", {
		id: id + "_canvasHeader",
		"class": "mochaCanvasHeader",
		width: this.options.width,
		height: 26
	    }).inject(this.windowEl, "bottom");
	    if (Browser.Engine.trident && MUI.ieSupport == "excanvas") {
		G_vmlCanvasManager.initElement(cache.canvasHeaderEl);
		cache.canvasHeaderEl = this.windowEl.getElement(".mochaCanvasHeader")
	    }
	}
	if (Browser.Engine.trident) {
	    cache.overlayEl.setStyle("zIndex", 2)
	}
	if (Browser.Platform.mac && Browser.Engine.gecko) {
	    if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
		var ffversion = new Number(RegExp.$1);
		if (ffversion < 3) {
		    cache.overlayEl.setStyle("overflow", "auto")
		}
	    }
	}
	if (options.resizable) {
	    cache.n = new Element("div", {
		id: id + "_resizeHandle_n",
		"class": "handle",
		styles: {
		    top: 0,
		    left: 10,
		    cursor: "n-resize"
		}
	    }).inject(cache.overlayEl, "after");
	    cache.ne = new Element("div", {
		id: id + "_resizeHandle_ne",
		"class": "handle corner",
		styles: {
		    top: 0,
		    right: 0,
		    cursor: "ne-resize"
		}
	    }).inject(cache.overlayEl, "after");
	    cache.e = new Element("div", {
		id: id + "_resizeHandle_e",
		"class": "handle",
		styles: {
		    top: 10,
		    right: 0,
		    cursor: "e-resize"
		}
	    }).inject(cache.overlayEl, "after");
	    cache.se = new Element("div", {
		id: id + "_resizeHandle_se",
		"class": "handle cornerSE",
		styles: {
		    bottom: 0,
		    right: 0,
		    cursor: "se-resize"
		}
	    }).inject(cache.overlayEl, "after");
	    cache.s = new Element("div", {
		id: id + "_resizeHandle_s",
		"class": "handle",
		styles: {
		    bottom: 0,
		    left: 10,
		    cursor: "s-resize"
		}
	    }).inject(cache.overlayEl, "after");
	    cache.sw = new Element("div", {
		id: id + "_resizeHandle_sw",
		"class": "handle corner",
		styles: {
		    bottom: 0,
		    left: 0,
		    cursor: "sw-resize"
		}
	    }).inject(cache.overlayEl, "after");
	    cache.w = new Element("div", {
		id: id + "_resizeHandle_w",
		"class": "handle",
		styles: {
		    top: 10,
		    left: 0,
		    cursor: "w-resize"
		}
	    }).inject(cache.overlayEl, "after");
	    cache.nw = new Element("div", {
		id: id + "_resizeHandle_nw",
		"class": "handle corner",
		styles: {
		    top: 0,
		    left: 0,
		    cursor: "nw-resize"
		}
	    }).inject(cache.overlayEl, "after")
	}
	$extend(this, cache)
    },
    setColors: function() {
	if (this.options.useCanvas == true) {
	    var pattern = /\?(.*?)\)/;
	    if (this.titleBarEl.getStyle("backgroundImage") != "none") {
		var gradient = this.titleBarEl.getStyle("backgroundImage");
		gradient = gradient.match(pattern)[1];
		gradient = gradient.parseQueryString();
		var gradientFrom = gradient.from;
		var gradientTo = gradient.to.replace(/\"/, "");
		this.options.headerStartColor = new Color(gradientFrom);
		this.options.headerStopColor = new Color(gradientTo);
		this.titleBarEl.addClass("replaced")
	    } else {
		if (this.titleBarEl.getStyle("background-color") !== "" && this.titleBarEl.getStyle("background-color") !== "transparent") {
		    this.options.headerStartColor = new Color(this.titleBarEl.getStyle("background-color")).mix("#fff", 20);
		    this.options.headerStopColor = new Color(this.titleBarEl.getStyle("background-color")).mix("#000", 20);
		    this.titleBarEl.addClass("replaced")
		}
	    }
	    if (this.windowEl.getStyle("background-color") !== "" && this.windowEl.getStyle("background-color") !== "transparent") {
		this.options.bodyBgColor = new Color(this.windowEl.getStyle("background-color"));
		this.windowEl.addClass("replaced")
	    }
	    if (this.options.resizable && this.se.getStyle("background-color") !== "" && this.se.getStyle("background-color") !== "transparent") {
		this.options.resizableColor = new Color(this.se.getStyle("background-color"));
		this.se.addClass("replaced")
	    }
	}
	if (this.options.useCanvasControls == true) {
	    if (this.minimizeButtonEl) {
		if (this.minimizeButtonEl.getStyle("color") !== "" && this.minimizeButtonEl.getStyle("color") !== "transparent") {
		    this.options.minimizeColor = new Color(this.minimizeButtonEl.getStyle("color"))
		}
		if (this.minimizeButtonEl.getStyle("background-color") !== "" && this.minimizeButtonEl.getStyle("background-color") !== "transparent") {
		    this.options.minimizeBgColor = new Color(this.minimizeButtonEl.getStyle("background-color"));
		    this.minimizeButtonEl.addClass("replaced")
		}
	    }
	    if (this.maximizeButtonEl) {
		if (this.maximizeButtonEl.getStyle("color") !== "" && this.maximizeButtonEl.getStyle("color") !== "transparent") {
		    this.options.maximizeColor = new Color(this.maximizeButtonEl.getStyle("color"))
		}
		if (this.maximizeButtonEl.getStyle("background-color") !== "" && this.maximizeButtonEl.getStyle("background-color") !== "transparent") {
		    this.options.maximizeBgColor = new Color(this.maximizeButtonEl.getStyle("background-color"));
		    this.maximizeButtonEl.addClass("replaced")
		}
	    }
	    if (this.closeButtonEl) {
		if (this.closeButtonEl.getStyle("color") !== "" && this.closeButtonEl.getStyle("color") !== "transparent") {
		    this.options.closeColor = new Color(this.closeButtonEl.getStyle("color"))
		}
		if (this.closeButtonEl.getStyle("background-color") !== "" && this.closeButtonEl.getStyle("background-color") !== "transparent") {
		    this.options.closeBgColor = new Color(this.closeButtonEl.getStyle("background-color"));
		    this.closeButtonEl.addClass("replaced")
		}
	    }
	}
    },
    drawWindow: function(shadows) {
	if (this.drawingWindow == true) {
	    return
	}
	this.drawingWindow = true;
	if (this.isCollapsed) {
	    this.drawWindowCollapsed(shadows);
	    return
	}
	var windowEl = this.windowEl;
	var options = this.options;
	var shadowBlur = options.shadowBlur;
	var shadowBlur2x = shadowBlur * 2;
	var shadowOffset = this.options.shadowOffset;
	this.overlayEl.setStyles({
	    width: this.contentWrapperEl.offsetWidth
	});
	if (this.iframeEl) {
	    this.iframeEl.setStyle("height", this.contentWrapperEl.offsetHeight)
	}
	var borderHeight = this.contentBorderEl.getStyle("border-top").toInt() + this.contentBorderEl.getStyle("border-bottom").toInt();
	var toolbarHeight = this.toolbarWrapperEl ? this.toolbarWrapperEl.getStyle("height").toInt() + this.toolbarWrapperEl.getStyle("border-top").toInt() : 0;
	var toolbar2Height = this.toolbar2WrapperEl ? this.toolbar2WrapperEl.getStyle("height").toInt() + this.toolbar2WrapperEl.getStyle("border-top").toInt() : 0;
	this.headerFooterShadow = options.headerHeight + options.footerHeight + shadowBlur2x;
	var height = this.contentWrapperEl.getStyle("height").toInt() + this.headerFooterShadow + toolbarHeight + toolbar2Height + borderHeight;
	var width = this.contentWrapperEl.getStyle("width").toInt() + shadowBlur2x;
	this.windowEl.setStyles({
	    height: height,
	    width: width
	});
	this.overlayEl.setStyles({
	    height: height,
	    top: shadowBlur - shadowOffset.y,
	    left: shadowBlur - shadowOffset.x
	});
	if (this.options.useCanvas == true) {
	    if (Browser.Engine.trident) {
		this.canvasEl.height = 20000;
		this.canvasEl.width = 50000
	    }
	    this.canvasEl.height = height;
	    this.canvasEl.width = width
	}
	if (Browser.Engine.trident4) {
	    this.zIndexFixEl.setStyles({
		width: width,
		height: height
	    })
	}
	this.titleBarEl.setStyles({
	    width: width - shadowBlur2x,
	    height: options.headerHeight
	});
	if (options.useSpinner == true && options.shape != "gauge" && options.type != "notification") {
	    this.spinnerEl.setStyles({
		left: shadowBlur - shadowOffset.x + 3,
		bottom: shadowBlur + shadowOffset.y + 4
	    })
	}
	if (this.options.useCanvas != false) {
	    var ctx = this.canvasEl.getContext("2d");
	    ctx.clearRect(0, 0, width, height);
	    switch (options.shape) {
		case "box":
		    this.drawBox(ctx, width, height, shadowBlur, shadowOffset, shadows);
		    break;
		case "gauge":
		    this.drawGauge(ctx, width, height, shadowBlur, shadowOffset, shadows);
		    break
	    }
	    if (options.resizable) {
		MUI.triangle(ctx, width - (shadowBlur + shadowOffset.x + 17), height - (shadowBlur + shadowOffset.y + 18), 11, 11, options.resizableColor, 1)
	    }
	    if (Browser.Engine.trident) {
		MUI.triangle(ctx, 0, 0, 10, 10, options.resizableColor, 0)
	    }
	}
	if (options.type != "notification" && options.useCanvasControls == true) {
	    this.drawControls(width, height, shadows)
	}
	if (MUI.Desktop && this.contentWrapperEl.getChildren(".column").length != 0) {
	    MUI.rWidth(this.contentWrapperEl);
	    this.contentWrapperEl.getChildren(".column").each(function(column) {
		MUI.panelHeight(column)
	    })
	}
	this.drawingWindow = false;
	return this
    },
    drawWindowCollapsed: function(shadows) {
	var windowEl = this.windowEl;
	var options = this.options;
	var shadowBlur = options.shadowBlur;
	var shadowBlur2x = shadowBlur * 2;
	var shadowOffset = options.shadowOffset;
	var headerShadow = options.headerHeight + shadowBlur2x + 2;
	var height = headerShadow;
	var width = this.contentWrapperEl.getStyle("width").toInt() + shadowBlur2x;
	this.windowEl.setStyle("height", height);
	this.overlayEl.setStyles({
	    height: height,
	    top: shadowBlur - shadowOffset.y,
	    left: shadowBlur - shadowOffset.x
	});
	if (Browser.Engine.trident4) {
	    this.zIndexFixEl.setStyles({
		width: width,
		height: height
	    })
	}
	this.windowEl.setStyle("width", width);
	this.overlayEl.setStyle("width", width);
	this.titleBarEl.setStyles({
	    width: width - shadowBlur2x,
	    height: options.headerHeight
	});
	if (this.options.useCanvas != false) {
	    this.canvasEl.height = height;
	    this.canvasEl.width = width;
	    var ctx = this.canvasEl.getContext("2d");
	    ctx.clearRect(0, 0, width, height);
	    this.drawBoxCollapsed(ctx, width, height, shadowBlur, shadowOffset, shadows);
	    if (options.useCanvasControls == true) {
		this.drawControls(width, height, shadows)
	    }
	    if (Browser.Engine.trident) {
		MUI.triangle(ctx, 0, 0, 10, 10, options.resizableColor, 0)
	    }
	}
	this.drawingWindow = false;
	return this
    },
    drawControls: function(width, height, shadows) {
	var options = this.options;
	var shadowBlur = options.shadowBlur;
	var shadowOffset = options.shadowOffset;
	var controlsOffset = options.controlsOffset;
	this.controlsEl.setStyles({
	    right: shadowBlur + shadowOffset.x + controlsOffset.right,
	    top: shadowBlur - shadowOffset.y + controlsOffset.top
	});
	this.canvasControlsEl.setStyles({
	    right: shadowBlur + shadowOffset.x + controlsOffset.right,
	    top: shadowBlur - shadowOffset.y + controlsOffset.top
	});
	this.closebuttonX = options.closable ? this.mochaControlsWidth - 7 : this.mochaControlsWidth + 12;
	this.maximizebuttonX = this.closebuttonX - (options.maximizable ? 19 : 0);
	this.minimizebuttonX = this.maximizebuttonX - (options.minimizable ? 19 : 0);
	var ctx2 = this.canvasControlsEl.getContext("2d");
	ctx2.clearRect(0, 0, 100, 100);
	if (this.options.closable) {
	    this.closebutton(ctx2, this.closebuttonX, 7, options.closeBgColor, 1, options.closeColor, 1)
	}
	if (this.options.maximizable) {
	    this.maximizebutton(ctx2, this.maximizebuttonX, 7, options.maximizeBgColor, 1, options.maximizeColor, 1)
	}
	if (this.options.minimizable) {
	    this.minimizebutton(ctx2, this.minimizebuttonX, 7, options.minimizeBgColor, 1, options.minimizeColor, 1)
	}
	if (Browser.Engine.trident) {
	    MUI.circle(ctx2, 0, 0, 3, this.options.resizableColor, 0)
	}
    },
    drawBox: function(ctx, width, height, shadowBlur, shadowOffset, shadows) {
	var options = this.options;
	var shadowBlur2x = shadowBlur * 2;
	var cornerRadius = this.options.cornerRadius;
	if (shadows != false) {
	    for (var x = 0; x <= shadowBlur; x++) {
		MUI.roundedRect(ctx, shadowOffset.x + x, shadowOffset.y + x, width - (x * 2) - shadowOffset.x, height - (x * 2) - shadowOffset.y, cornerRadius + (shadowBlur - x), [0, 0, 0], x == shadowBlur ? 0.29 : 0.065 + (x * 0.01))
	    }
	}
	this.bodyRoundedRect(ctx, shadowBlur - shadowOffset.x, shadowBlur - shadowOffset.y, width - shadowBlur2x, height - shadowBlur2x, cornerRadius, options.bodyBgColor);
	if (this.options.type != "notification") {
	    this.topRoundedRect(ctx, shadowBlur - shadowOffset.x, shadowBlur - shadowOffset.y, width - shadowBlur2x, options.headerHeight, cornerRadius, options.headerStartColor, options.headerStopColor)
	}
    },
    drawBoxCollapsed: function(ctx, width, height, shadowBlur, shadowOffset, shadows) {
	var options = this.options;
	var shadowBlur2x = shadowBlur * 2;
	var cornerRadius = options.cornerRadius;
	if (shadows != false) {
	    for (var x = 0; x <= shadowBlur; x++) {
		MUI.roundedRect(ctx, shadowOffset.x + x, shadowOffset.y + x, width - (x * 2) - shadowOffset.x, height - (x * 2) - shadowOffset.y, cornerRadius + (shadowBlur - x), [0, 0, 0], x == shadowBlur ? 0.3 : 0.06 + (x * 0.01))
	    }
	}
	this.topRoundedRect2(ctx, shadowBlur - shadowOffset.x, shadowBlur - shadowOffset.y, width - shadowBlur2x, options.headerHeight + 2, cornerRadius, options.headerStartColor, options.headerStopColor)
    },
    drawGauge: function(ctx, width, height, shadowBlur, shadowOffset, shadows) {
	var options = this.options;
	var radius = (width * 0.5) - (shadowBlur) + 16;
	if (shadows != false) {
	    for (var x = 0; x <= shadowBlur; x++) {
		MUI.circle(ctx, width * 0.5 + shadowOffset.x, (height + options.headerHeight) * 0.5 + shadowOffset.x, (width * 0.5) - (x * 2) - shadowOffset.x, [0, 0, 0], x == shadowBlur ? 0.75 : 0.075 + (x * 0.04))
	    }
	}
	MUI.circle(ctx, width * 0.5 - shadowOffset.x, (height + options.headerHeight) * 0.5 - shadowOffset.y, (width * 0.5) - shadowBlur, options.bodyBgColor, 1);
	this.canvasHeaderEl.setStyles({
	    top: shadowBlur - shadowOffset.y,
	    left: shadowBlur - shadowOffset.x
	});
	var ctx = this.canvasHeaderEl.getContext("2d");
	ctx.clearRect(0, 0, width, 100);
	ctx.beginPath();
	ctx.lineWidth = 24;
	ctx.lineCap = "round";
	ctx.moveTo(13, 13);
	ctx.lineTo(width - (shadowBlur * 2) - 13, 13);
	ctx.strokeStyle = "rgba(0, 0, 0, .65)";
	ctx.stroke()
    },
    bodyRoundedRect: function(ctx, x, y, width, height, radius, rgb) {
	ctx.fillStyle = "rgba(" + rgb.join(",") + ", 1)";
	ctx.beginPath();
	ctx.moveTo(x, y + radius);
	ctx.lineTo(x, y + height - radius);
	ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
	ctx.lineTo(x + width - radius, y + height);
	ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
	ctx.lineTo(x + width, y + radius);
	ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
	ctx.lineTo(x + radius, y);
	ctx.quadraticCurveTo(x, y, x, y + radius);
	ctx.fill()
    },
    topRoundedRect: function(ctx, x, y, width, height, radius, headerStartColor, headerStopColor) {
	var lingrad = ctx.createLinearGradient(0, 0, 0, height);
	lingrad.addColorStop(0, "rgb(" + headerStartColor.join(",") + ")");
	lingrad.addColorStop(1, "rgb(" + headerStopColor.join(",") + ")");
	ctx.fillStyle = lingrad;
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x, y + height);
	ctx.lineTo(x + width, y + height);
	ctx.lineTo(x + width, y + radius);
	ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
	ctx.lineTo(x + radius, y);
	ctx.quadraticCurveTo(x, y, x, y + radius);
	ctx.fill()
    },
    topRoundedRect2: function(ctx, x, y, width, height, radius, headerStartColor, headerStopColor) {
	if (navigator.userAgent.toLowerCase().indexOf("chrome") > -1) {
	    ctx.fillStyle = "rgba(" + headerStopColor.join(",") + ", 1)"
	} else {
	    var lingrad = ctx.createLinearGradient(0, this.options.shadowBlur - 1, 0, height + this.options.shadowBlur + 3);
	    lingrad.addColorStop(0, "rgb(" + headerStartColor.join(",") + ")");
	    lingrad.addColorStop(1, "rgb(" + headerStopColor.join(",") + ")");
	    ctx.fillStyle = lingrad
	}
	ctx.beginPath();
	ctx.moveTo(x, y + radius);
	ctx.lineTo(x, y + height - radius);
	ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
	ctx.lineTo(x + width - radius, y + height);
	ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
	ctx.lineTo(x + width, y + radius);
	ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
	ctx.lineTo(x + radius, y);
	ctx.quadraticCurveTo(x, y, x, y + radius);
	ctx.fill()
    },
    maximizebutton: function(ctx, x, y, rgbBg, aBg, rgb, a) {
	ctx.beginPath();
	ctx.arc(x, y, 7, 0, Math.PI * 2, true);
	ctx.fillStyle = "rgba(" + rgbBg.join(",") + "," + aBg + ")";
	ctx.fill();
	ctx.strokeStyle = "rgba(" + rgb.join(",") + "," + a + ")";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x, y - 3.5);
	ctx.lineTo(x, y + 3.5);
	ctx.moveTo(x - 3.5, y);
	ctx.lineTo(x + 3.5, y);
	ctx.stroke()
    },
    closebutton: function(ctx, x, y, rgbBg, aBg, rgb, a) {
	ctx.beginPath();
	ctx.arc(x, y, 7, 0, Math.PI * 2, true);
	ctx.fillStyle = "rgba(" + rgbBg.join(",") + "," + aBg + ")";
	ctx.fill();
	ctx.strokeStyle = "rgba(" + rgb.join(",") + "," + a + ")";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x - 3, y - 3);
	ctx.lineTo(x + 3, y + 3);
	ctx.moveTo(x + 3, y - 3);
	ctx.lineTo(x - 3, y + 3);
	ctx.stroke()
    },
    minimizebutton: function(ctx, x, y, rgbBg, aBg, rgb, a) {
	ctx.beginPath();
	ctx.arc(x, y, 7, 0, Math.PI * 2, true);
	ctx.fillStyle = "rgba(" + rgbBg.join(",") + "," + aBg + ")";
	ctx.fill();
	ctx.strokeStyle = "rgba(" + rgb.join(",") + "," + a + ")";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(x - 3.5, y);
	ctx.lineTo(x + 3.5, y);
	ctx.stroke()
    },
    setMochaControlsWidth: function() {
	this.mochaControlsWidth = 0;
	var options = this.options;
	if (options.minimizable) {
	    this.mochaControlsWidth += (this.minimizeButtonEl.getStyle("margin-left").toInt() + this.minimizeButtonEl.getStyle("width").toInt())
	}
	if (options.maximizable) {
	    this.mochaControlsWidth += (this.maximizeButtonEl.getStyle("margin-left").toInt() + this.maximizeButtonEl.getStyle("width").toInt())
	}
	if (options.closable) {
	    this.mochaControlsWidth += (this.closeButtonEl.getStyle("margin-left").toInt() + this.closeButtonEl.getStyle("width").toInt())
	}
	this.controlsEl.setStyle("width", this.mochaControlsWidth);
	if (options.useCanvasControls == true) {
	    this.canvasControlsEl.setProperty("width", this.mochaControlsWidth)
	}
    },
    hideSpinner: function() {
	if (this.spinnerEl) {
	    this.spinnerEl.hide()
	}
	return this
    },
    showSpinner: function() {
	if (this.spinnerEl) {
	    this.spinnerEl.show()
	}
	return this
    },
    close: function() {
	if (!this.isClosing) {
	    MUI.closeWindow(this.windowEl)
	}
	return this
    },
    minimize: function() {
	MUI.Dock.minimizeWindow(this.windowEl);
	return this
    },
    maximize: function() {
	if (this.isMinimized) {
	    MUI.Dock.restoreMinimized(this.windowEl)
	}
	MUI.Desktop.maximizeWindow(this.windowEl);
	return this
    },
    restore: function() {
	if (this.isMinimized) {
	    MUI.Dock.restoreMinimized(this.windowEl)
	} else {
	    if (this.isMaximized) {
		MUI.Desktop.restoreWindow(this.windowEl)
	    }
	}
	return this
    },
    resize: function(options) {
	MUI.resizeWindow(this.windowEl, options);
	return this
    },
    center: function() {
	MUI.centerWindow(this.windowEl);
	return this
    },
    hide: function() {
	this.windowEl.setStyle("display", "none");
	return this
    },
    show: function() {
	this.windowEl.setStyle("display", "block");
	return this
    }
});
MUI.extend({
    closeWindow: function(windowEl) {
	var instance = windowEl.retrieve("instance");
	if (windowEl != $(windowEl) || instance.isClosing) {
	    return
	}
	instance.isClosing = true;
	instance.fireEvent("onClose", windowEl);
	if (instance.options.storeOnClose) {
	    this.storeOnClose(instance, windowEl);
	    return
	}
	if (instance.check) {
	    instance.check.destroy()
	}
	if ((instance.options.type == "modal" || instance.options.type == "modal2") && Browser.Engine.trident4) {
	    $("modalFix").hide()
	}
	if (MUI.options.advancedEffects == false) {
	    if (instance.options.type == "modal" || instance.options.type == "modal2") {
		$("modalOverlay").setStyle("opacity", 0)
	    }
	    MUI.closingJobs(windowEl);
	    return true
	} else {
	    if (Browser.Engine.trident) {
		instance.drawWindow(false)
	    }
	    if (instance.options.type == "modal" || instance.options.type == "modal2") {
		MUI.Modal.modalOverlayCloseMorph.start({
		    opacity: 0
		})
	    }
	    var closeMorph = new Fx.Morph(windowEl, {
		duration: 120,
		onComplete: function() {
		    MUI.closingJobs(windowEl);
		    return true
		}.bind(this)
	    });
	    closeMorph.start({
		opacity: 0.4
	    })
	}
    },
    closingJobs: function(windowEl) {
	var instances = MUI.Windows.instances;
	var instance = instances.get(windowEl.id);
	windowEl.setStyle("visibility", "hidden");
	if (Browser.Engine.trident) {
	    windowEl.dispose()
	} else {
	    windowEl.dispose();
	}
	instance.fireEvent("onCloseComplete");
	if (instance.options.type != "notification") {
	    var newFocus = this.getWindowWithHighestZindex();
	    this.focusWindow(newFocus)
	}
	instances.erase(instance.options.id);
	if (this.loadingWorkspace == true) {
	    this.windowUnload()
	}
	if (MUI.Dock && $(MUI.options.dock) && instance.options.type == "window") {
	    var currentButton = $(instance.options.id + "_dockTab");
	    if (currentButton != null) {
		MUI.Dock.dockSortables.removeItems(currentButton).destroy()
	    }
	    MUI.Desktop.setDesktopSize()
	}
    },
    storeOnClose: function(instance, windowEl) {
	if (instance.check) {
	    instance.check.hide()
	}
	windowEl.setStyles({
	    zIndex: -1
	});
	windowEl.addClass("windowClosed");
	windowEl.removeClass("mocha");
	if (MUI.Dock && $(MUI.options.dock) && instance.options.type == "window") {
	    var currentButton = $(instance.options.id + "_dockTab");
	    if (currentButton != null) {
		currentButton.hide()
	    }
	    MUI.Desktop.setDesktopSize()
	}
	instance.fireEvent("onCloseComplete");
	if (instance.options.type != "notification") {
	    var newFocus = this.getWindowWithHighestZindex();
	    this.focusWindow(newFocus)
	}
	instance.isClosing = false
    },
    closeAll: function() {
	$$(".mocha").each(function(windowEl) {
	    this.closeWindow(windowEl)
	}.bind(this))
    },
    collapseToggle: function(windowEl) {
	var instance = windowEl.retrieve("instance");
	var handles = windowEl.getElements(".handle");
	if (instance.isMaximized == true) {
	    return
	}
	if (instance.isCollapsed == false) {
	    instance.isCollapsed = true;
	    handles.hide();
	    if (instance.iframeEl) {
		instance.iframeEl.setStyle("visibility", "hidden")
	    }
	    instance.contentBorderEl.setStyles({
		visibility: "hidden",
		position: "absolute",
		top: -10000,
		left: -10000
	    });
	    if (instance.toolbarWrapperEl) {
		instance.toolbarWrapperEl.setStyles({
		    visibility: "hidden",
		    position: "absolute",
		    top: -10000,
		    left: -10000
		})
	    }
	    instance.drawWindowCollapsed()
	} else {
	    instance.isCollapsed = false;
	    instance.drawWindow();
	    instance.contentBorderEl.setStyles({
		visibility: "visible",
		position: null,
		top: null,
		left: null
	    });
	    if (instance.toolbarWrapperEl) {
		instance.toolbarWrapperEl.setStyles({
		    visibility: "visible",
		    position: null,
		    top: null,
		    left: null
		})
	    }
	    if (instance.iframeEl) {
		instance.iframeEl.setStyle("visibility", "visible")
	    }
	    handles.show()
	}
    },
    toggleWindowVisibility: function() {
	MUI.Windows.instances.each(function(instance) {
	    if (instance.options.type == "modal" || instance.options.type == "modal2" || instance.isMinimized == true) {
		return
	    }
	    var id = $(instance.options.id);
	    if (id.getStyle("visibility") == "visible") {
		if (instance.iframe) {
		    instance.iframeEl.setStyle("visibility", "hidden")
		}
		if (instance.toolbarEl) {
		    instance.toolbarWrapperEl.setStyle("visibility", "hidden")
		}
		instance.contentBorderEl.setStyle("visibility", "hidden");
		id.setStyle("visibility", "hidden");
		MUI.Windows.windowsVisible = false
	    } else {
		id.setStyle("visibility", "visible");
		instance.contentBorderEl.setStyle("visibility", "visible");
		if (instance.iframe) {
		    instance.iframeEl.setStyle("visibility", "visible")
		}
		if (instance.toolbarEl) {
		    instance.toolbarWrapperEl.setStyle("visibility", "visible")
		}
		MUI.Windows.windowsVisible = true
	    }
	}.bind(this))
    },
    focusWindow: function(windowEl, fireEvent) {
	MUI.Windows.focusingWindow = true;
	var windowClicked = function() {
	    MUI.Windows.focusingWindow = false
	};
	windowClicked.delay(170, this);
	if ($$(".mocha").length == 0) {
	    return
	}
	if (windowEl != $(windowEl) || windowEl.hasClass("isFocused")) {
	    return
	}
	var instances = MUI.Windows.instances;
	var instance = instances.get(windowEl.id);
	if (instance && instance.options && instance.options.type == "notification") {
	    windowEl.setStyle("zIndex", 11001);
	    return
	}
	MUI.Windows.indexLevel += 2;
	windowEl.setStyle("zIndex", MUI.Windows.indexLevel);
	$("windowUnderlay").setStyle("zIndex", MUI.Windows.indexLevel - 1).inject($(windowEl), "after");
	instances.each(function(instance) {
	    if (instance.windowEl.hasClass("isFocused")) {
		instance.fireEvent("onBlur", instance.windowEl)
	    }
	    instance.windowEl.removeClass("isFocused")
	});
	if (MUI.Dock && $(MUI.options.dock) && instance && instance.options && instance.options.type == "window") {
	    MUI.Dock.makeActiveTab()
	}
	windowEl.addClass("isFocused");
	if (instance && fireEvent != false) {
	    instance.fireEvent("onFocus", windowEl)
	}
    },
    getWindowWithHighestZindex: function() {
	this.highestZindex = 0;
	$$(".mocha").each(function(element) {
	    this.zIndex = element.getStyle("zIndex");
	    if (this.zIndex >= this.highestZindex) {
		this.highestZindex = this.zIndex
	    }
	}.bind(this));
	$$(".mocha").each(function(element) {
	    if (element.getStyle("zIndex") == this.highestZindex) {
		this.windowWithHighestZindex = element
	    }
	}.bind(this));
	return this.windowWithHighestZindex
    },
    blurAll: function() {
	if (MUI.Windows.focusingWindow == false) {
	    $$(".mocha").each(function(windowEl) {
		var instance = windowEl.retrieve("instance");
		if (instance.options.type != "modal" && instance.options.type != "modal2") {
		    windowEl.removeClass("isFocused")
		}
	    });
	    $$(".dockTab").removeClass("activeDockTab")
	}
    },
    centerWindow: function(windowEl) {
	if (!windowEl) {
	    MUI.Windows.instances.each(function(instance) {
		if (instance.windowEl.hasClass("isFocused")) {
		    windowEl = instance.windowEl
		}
	    })
	}
	var instance = windowEl.retrieve("instance");
	var options = instance.options;
	var dimensions = options.container.getCoordinates();
	var windowPosTop = window.getScroll().y + (window.getSize().y * 0.5) - (windowEl.offsetHeight * 0.5);
	if (windowPosTop < -instance.options.shadowBlur) {
	    windowPosTop = -instance.options.shadowBlur
	}
	var windowPosLeft = (dimensions.width * 0.5) - (windowEl.offsetWidth * 0.5);
	if (windowPosLeft < -instance.options.shadowBlur) {
	    windowPosLeft = -instance.options.shadowBlur
	}
	if (MUI.options.advancedEffects == true) {
	    instance.morph.start({
		top: windowPosTop,
		left: windowPosLeft
	    })
	} else {
	    windowEl.setStyles({
		top: windowPosTop,
		left: windowPosLeft
	    })
	}
    },
    resizeWindow: function(windowEl, options) {
	var instance = windowEl.retrieve("instance");
	$extend({
	    width: null,
	    height: null,
	    top: null,
	    left: null,
	    centered: true
	}, options);
	var oldWidth = windowEl.getStyle("width").toInt();
	var oldHeight = windowEl.getStyle("height").toInt();
	var oldTop = windowEl.getStyle("top").toInt();
	var oldLeft = windowEl.getStyle("left").toInt();
	if (options.centered) {
	    var top = typeof (options.top) != "undefined" ? options.top : oldTop - ((options.height - oldHeight) * 0.5);
	    var left = typeof (options.left) != "undefined" ? options.left : oldLeft - ((options.width - oldWidth) * 0.5)
	} else {
	    var top = typeof (options.top) != "undefined" ? options.top : oldTop;
	    var left = typeof (options.left) != "undefined" ? options.left : oldLeft
	}
	if (MUI.options.advancedEffects == false) {
	    windowEl.setStyles({
		top: top,
		left: left
	    });
	    instance.contentWrapperEl.setStyles({
		height: options.height,
		width: options.width
	    });
	    instance.drawWindow();
	    if (instance.iframeEl) {
		if (!Browser.Engine.trident) {
		    instance.iframeEl.setStyle("visibility", "visible")
		} else {
		    instance.iframeEl.show()
		}
	    }
	} else {
	    windowEl.retrieve("resizeMorph").start({
		"0": {
		    height: options.height,
		    width: options.width
		},
		"1": {
		    top: top,
		    left: left
		}
	    })
	}
	return instance
    },
    dynamicResize: function(windowEl) {
	var instance = windowEl.retrieve("instance");
	var contentWrapperEl = instance.contentWrapperEl;
	var contentEl = instance.contentEl;
	contentWrapperEl.setStyles({
	    height: contentEl.offsetHeight,
	    width: contentEl.offsetWidth
	});
	instance.drawWindow()
    }
});
document.addEvent("keydown", function(event) {
    if (event.key == "q" && event.control && event.alt) {
	MUI.toggleWindowVisibility()
    }
});
MUI.files[MUI.path.source + "Window/Modal.js"] = "loaded";
MUI.Modal = new Class({
    Extends: MUI.Window,
    options: {
	type: "modal"
    },
    initialize: function(options) {
	if (!$("modalOverlay")) {
	    this.modalInitialize();
	    window.addEvent("resize", function() {
		this.setModalSize()
	    }.bind(this))
	}
	this.parent(options)
    },
    modalInitialize: function() {
	var modalOverlay = new Element("div", {
	    id: "modalOverlay",
	    styles: {
		height: document.getCoordinates().height,
		opacity: 0.6
	    }
	}).inject(document.body);
	modalOverlay.setStyles({
	    position: Browser.Engine.trident4 ? "absolute" : "fixed"
	});
	modalOverlay.addEvent("click", function(e) {
	    var instance = MUI.Windows.instances.get(MUI.currentModal.id);
	    if (instance.options.modalOverlayClose == true) {
		MUI.closeWindow(MUI.currentModal)
	    }
	});
	if (Browser.Engine.trident4) {
	    var modalFix = new Element("iframe", {
		id: "modalFix",
		scrolling: "no",
		marginWidth: 0,
		marginHeight: 0,
		src: "",
		styles: {
		    height: document.getCoordinates().height
		}
	    }).inject(document.body)
	}
	MUI.Modal.modalOverlayOpenMorph = new Fx.Morph($("modalOverlay"), {
	    duration: 150
	});
	MUI.Modal.modalOverlayCloseMorph = new Fx.Morph($("modalOverlay"), {
	    duration: 150,
	    onComplete: function() {
		$("modalOverlay").hide();
		if (Browser.Engine.trident4) {
		    $("modalFix").hide()
		}
	    }.bind(this)
	})
    },
    setModalSize: function() {
	$("modalOverlay").setStyle("height", document.getCoordinates().height);
	if (Browser.Engine.trident4) {
	    $("modalFix").setStyle("height", document.getCoordinates().height)
	}
    }
});
MUI.extend({
    initializeTabs: function(el, target) {
	$(el).setStyle("list-style", "none");
	$(el).getElements("li").each(function(listitem) {
	    var link = listitem.getFirst("a").addEvent("click", function(e) {
		e.preventDefault()
	    });
	    listitem.addEvent("click", function(e) {
		MUI.updateContent({
		    element: $(target),
		    url: link.get("href")
		});
		MUI.selected(this, el)
	    })
	})
    },
    selected: function(el, parent) {
	$(parent).getChildren().each(function(listitem) {
	    listitem.removeClass("selected")
	});
	el.addClass("selected")
    }
});
MUI.files[MUI.path.source + "Layout/Layout.js"] = "loaded";
MUI.extend({
    Columns: {
	instances: new Hash(),
	columnIDCount: 0
    },
    Panels: {
	instances: new Hash(),
	panelIDCount: 0
    }
});
MUI.Desktop = {
    options: {
	desktop: "desktop",
	desktopHeader: "desktopHeader",
	desktopFooter: "desktopFooter",
	desktopNavBar: "desktopNavbar",
	pageWrapper: "pageWrapper",
	page: "page",
	desktopFooter: "desktopFooterWrapper"
    },
    initialize: function() {
	this.desktop = $(this.options.desktop);
	this.desktopHeader = $(this.options.desktopHeader);
	this.desktopNavBar = $(this.options.desktopNavBar);
	this.pageWrapper = $(this.options.pageWrapper);
	this.page = $(this.options.page);
	this.desktopFooter = $(this.options.desktopFooter);
	if (this.desktop) {
	    ($$("body")).setStyles({
		overflow: "hidden",
		height: "100%",
		margin: 0
	    });
	    ($$("html")).setStyles({
		overflow: "hidden",
		height: "100%"
	    })
	}
	if (!MUI.Dock) {
	    this.setDesktopSize()
	}
	this.menuInitialize();
	window.addEvent("resize", function(e) {
	    this.onBrowserResize()
	}.bind(this));
	if (MUI.myChain) {
	    MUI.myChain.callChain()
	}
    },
    menuInitialize: function() {
	if (Browser.Engine.trident4 && this.desktopNavBar) {
	    this.desktopNavBar.getElements("li").each(function(element) {
		element.addEvent("mouseenter", function() {
		    this.addClass("ieHover")
		});
		element.addEvent("mouseleave", function() {
		    this.removeClass("ieHover")
		})
	    })
	}
    },
    onBrowserResize: function() {
	this.setDesktopSize();
	setTimeout(function() {
	    MUI.Windows.instances.each(function(instance) {
		if (instance.isMaximized) {
		    if (instance.iframeEl) {
			instance.iframeEl.setStyle("visibility", "hidden")
		    }
		    var coordinates = document.getCoordinates();
		    var borderHeight = instance.contentBorderEl.getStyle("border-top").toInt() + instance.contentBorderEl.getStyle("border-bottom").toInt();
		    var toolbarHeight = instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle("height").toInt() + instance.toolbarWrapperEl.getStyle("border-top").toInt() : 0;
		    instance.contentWrapperEl.setStyles({
			height: coordinates.height - instance.options.headerHeight - instance.options.footerHeight - borderHeight - toolbarHeight,
			width: coordinates.width
		    });
		    instance.drawWindow();
		    if (instance.iframeEl) {
			instance.iframeEl.setStyles({
			    height: instance.contentWrapperEl.getStyle("height")
			});
			instance.iframeEl.setStyle("visibility", "visible")
		    }
		}
	    }.bind(this))
	}.bind(this), 100)
    },
    setDesktopSize: function() {
	var windowDimensions = window.getCoordinates();
	var dockWrapper = $(MUI.options.dockWrapper);
	if (this.desktop) {
	    this.desktop.setStyle("height", windowDimensions.height)
	}
	if (this.pageWrapper) {
	    var dockOffset = MUI.dockVisible ? dockWrapper.offsetHeight : 0;
	    var pageWrapperHeight = windowDimensions.height;
	    pageWrapperHeight -= this.pageWrapper.getStyle("border-top").toInt();
	    pageWrapperHeight -= this.pageWrapper.getStyle("border-bottom").toInt();
	    if (this.desktopHeader) {
		pageWrapperHeight -= this.desktopHeader.offsetHeight
	    }
	    if (this.desktopFooter) {
		pageWrapperHeight -= this.desktopFooter.offsetHeight
	    }
	    pageWrapperHeight -= dockOffset;
	    if (pageWrapperHeight < 0) {
		pageWrapperHeight = 0
	    }
	    this.pageWrapper.setStyle("height", pageWrapperHeight)
	}
	if (MUI.Columns.instances.getKeys().length > 0) {
	    MUI.Desktop.resizePanels()
	}
    },
    resizePanels: function() {
	MUI.panelHeight();
	MUI.rWidth()
    },
    maximizeWindow: function(windowEl) {
	var instance = MUI.Windows.instances.get(windowEl.id);
	var options = instance.options;
	var windowDrag = instance.windowDrag;
	if (windowEl != $(windowEl) || instance.isMaximized) {
	    return
	}
	if (instance.isCollapsed) {
	    MUI.collapseToggle(windowEl)
	}
	instance.isMaximized = true;
	if (instance.options.restrict) {
	    windowDrag.detach();
	    if (options.resizable) {
		instance.detachResizable()
	    }
	    instance.titleBarEl.setStyle("cursor", "default")
	}
	if (options.container != this.desktop) {
	    this.desktop.grab(windowEl);
	    if (this.options.restrict) {
		windowDrag.container = this.desktop
	    }
	}
	instance.oldTop = windowEl.getStyle("top");
	instance.oldLeft = windowEl.getStyle("left");
	var contentWrapperEl = instance.contentWrapperEl;
	contentWrapperEl.oldWidth = contentWrapperEl.getStyle("width");
	contentWrapperEl.oldHeight = contentWrapperEl.getStyle("height");
	if (instance.iframeEl) {
	    if (!Browser.Engine.trident) {
		instance.iframeEl.setStyle("visibility", "hidden")
	    } else {
		instance.iframeEl.hide()
	    }
	}
	var windowDimensions = document.getCoordinates();
	var options = instance.options;
	var shadowBlur = options.shadowBlur;
	var shadowOffset = options.shadowOffset;
	var newHeight = windowDimensions.height - options.headerHeight - options.footerHeight;
	newHeight -= instance.contentBorderEl.getStyle("border-top").toInt();
	newHeight -= instance.contentBorderEl.getStyle("border-bottom").toInt();
	newHeight -= (instance.toolbarWrapperEl ? instance.toolbarWrapperEl.getStyle("height").toInt() + instance.toolbarWrapperEl.getStyle("border-top").toInt() : 0);
	MUI.resizeWindow(windowEl, {
	    width: windowDimensions.width,
	    height: newHeight,
	    top: shadowOffset.y - shadowBlur,
	    left: shadowOffset.x - shadowBlur
	});
	instance.fireEvent("onMaximize", windowEl);
	if (instance.maximizeButtonEl) {
	    instance.maximizeButtonEl.setProperty("title", "Restore")
	}
	MUI.focusWindow(windowEl)
    },
    restoreWindow: function(windowEl) {
	var instance = windowEl.retrieve("instance");
	if (windowEl != $(windowEl) || !instance.isMaximized) {
	    return
	}
	var options = instance.options;
	instance.isMaximized = false;
	if (options.restrict) {
	    instance.windowDrag.attach();
	    if (options.resizable) {
		instance.reattachResizable()
	    }
	    instance.titleBarEl.setStyle("cursor", "move")
	}
	if (instance.iframeEl) {
	    if (!Browser.Engine.trident) {
		instance.iframeEl.setStyle("visibility", "hidden")
	    } else {
		instance.iframeEl.hide()
	    }
	}
	var contentWrapperEl = instance.contentWrapperEl;
	MUI.resizeWindow(windowEl, {
	    width: contentWrapperEl.oldWidth,
	    height: contentWrapperEl.oldHeight,
	    top: instance.oldTop,
	    left: instance.oldLeft
	});
	instance.fireEvent("onRestore", windowEl);
	if (instance.maximizeButtonEl) {
	    instance.maximizeButtonEl.setProperty("title", "Maximize")
	}
    }
};
MUI.Column = new Class({
    Implements: [Events, Options],
    options: {
	id: null,
	container: null,
	placement: null,
	width: null,
	resizeLimit: [],
	sortable: true,
	isCollapsed: false,
	onResize: $empty,
	onCollapse: $empty,
	onExpand: $empty
    },
    initialize: function(options) {
	this.setOptions(options);
	$extend(this, {
	    timestamp: $time(),
	    isCollapsed: false,
	    oldWidth: 0
	});
	if (this.options.id == null) {
	    this.options.id = "column" + (++MUI.Columns.columnIDCount)
	}
	var options = this.options;
	var instances = MUI.Columns.instances;
	var instanceID = instances.get(options.id);
	if (options.container == null) {
	    options.container = MUI.Desktop.pageWrapper
	} else {
	    $(options.container).setStyle("overflow", "hidden")
	}
	if (typeof this.options.container == "string") {
	    this.options.container = $(this.options.container)
	}
	if (instanceID) {
	    var instance = instanceID
	}
	if (this.columnEl) {
	    return
	} else {
	    instances.set(options.id, this)
	}
	if ($(options.container).getElement(".pad") != null) {
	    $(options.container).getElement(".pad").hide()
	}
	if ($(options.container).getElement(".mochaContent") != null) {
	    $(options.container).getElement(".mochaContent").hide()
	}
	this.columnEl = new Element("div", {
	    id: this.options.id,
	    "class": "column expanded",
	    styles: {
		width: options.placement == "main" ? null : options.width
	    }
	}).inject($(options.container));
	this.columnEl.store("instance", this);
	var parent = this.columnEl.getParent();
	var columnHeight = parent.getStyle("height").toInt();
	this.columnEl.setStyle("height", columnHeight);
	if (this.options.sortable) {
	    if (!this.options.container.retrieve("sortables")) {
		var sortables = new Sortables(this.columnEl, {
		    opacity: 1,
		    handle: ".panel-header",
		    constrain: false,
		    revert: false,
		    onSort: function() {
			$$(".column").each(function(column) {
			    column.getChildren(".panelWrapper").each(function(panelWrapper) {
				panelWrapper.getElement(".panel").removeClass("bottomPanel")
			    });
			    if (column.getChildren(".panelWrapper").getLast()) {
				column.getChildren(".panelWrapper").getLast().getElement(".panel").addClass("bottomPanel")
			    }
			    column.getChildren(".panelWrapper").each(function(panelWrapper) {
				var panel = panelWrapper.getElement(".panel");
				var column = panelWrapper.getParent().id;
				instance = MUI.Panels.instances.get(panel.id);
				instance.options.column = column;
				if (instance) {
				    var nextpanel = panel.getParent().getNext(".expanded");
				    if (nextpanel) {
					nextpanel = nextpanel.getElement(".panel")
				    }
				    instance.partner = nextpanel
				}
			    });
			    MUI.panelHeight()
			}.bind(this))
		    }.bind(this)
		});
		this.options.container.store("sortables", sortables)
	    } else {
		this.options.container.retrieve("sortables").addLists(this.columnEl)
	    }
	}
	if (options.placement == "main") {
	    this.columnEl.addClass("rWidth")
	}
	switch (this.options.placement) {
	    case "left":
		this.handleEl = new Element("div", {
		    id: this.options.id + "_handle",
		    "class": "columnHandle"
		}).inject(this.columnEl, "after");
		this.handleIconEl = new Element("div", {
		    id: options.id + "_handle_icon",
		    "class": "handleIcon"
		}).inject(this.handleEl);
		addResizeRight(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
		break;
	    case "right":
		this.handleEl = new Element("div", {
		    id: this.options.id + "_handle",
		    "class": "columnHandle"
		}).inject(this.columnEl, "before");
		this.handleIconEl = new Element("div", {
		    id: options.id + "_handle_icon",
		    "class": "handleIcon"
		}).inject(this.handleEl);
		addResizeLeft(this.columnEl, options.resizeLimit[0], options.resizeLimit[1]);
		break
	}
	if (this.options.isCollapsed && this.options.placement != "main") {
	    this.columnToggle()
	}
	if (this.handleEl != null) {
	    this.handleEl.addEvent("dblclick", function() {
		this.columnToggle()
	    }.bind(this))
	}
	MUI.rWidth()
    },
    columnCollapse: function() {
	var column = this.columnEl;
	this.oldWidth = column.getStyle("width").toInt();
	this.resize.detach();
	this.handleEl.removeEvents("dblclick");
	this.handleEl.addEvent("click", function() {
	    this.columnExpand()
	}.bind(this));
	this.handleEl.setStyle("cursor", "pointer").addClass("detached");
	column.setStyle("width", 0);
	this.isCollapsed = true;
	column.addClass("collapsed");
	column.removeClass("expanded");
	MUI.rWidth();
	this.fireEvent("onCollapse");
	return true
    },
    columnExpand: function() {
	var column = this.columnEl;
	column.setStyle("width", this.oldWidth);
	this.isCollapsed = false;
	column.addClass("expanded");
	column.removeClass("collapsed");
	this.handleEl.removeEvents("click");
	this.handleEl.addEvent("dblclick", function() {
	    this.columnCollapse()
	}.bind(this));
	this.resize.attach();
	this.handleEl.setStyle("cursor", Browser.Engine.webkit ? "col-resize" : "e-resize").addClass("attached");
	MUI.rWidth();
	this.fireEvent("onExpand");
	return true
    },
    columnToggle: function() {
	if (this.isCollapsed == false) {
	    this.columnCollapse()
	} else {
	    this.columnExpand()
	}
    }
});
MUI.Column.implement(new Options, new Events);
MUI.Panel = new Class({
    Implements: [Events, Options],
    options: {
	id: null,
	title: "&nbsp;",
	column: null,
	require: {
	    css: [],
	    images: [],
	    js: [],
	    onloaded: null
	},
	loadMethod: null,
	contentURL: null,
	method: "get",
	data: null,
	evalScripts: true,
	evalResponse: false,
	content: "&nbsp;",
	tabsURL: null,
	tabsData: null,
	tabsOnload: $empty,
	header: true,
	headerToolbox: false,
	headerToolboxContent: "pages/lipsum.html",
	headerToolboxOnload: $empty,
	height: 125,
	addClass: "",
	scrollbars: true,
	padding: {
	    top: 0,
	    right: 0,
	    bottom: 0,
	    left: 0
	},
	collapsible: true,
	onBeforeBuild: $empty,
	onContentLoaded: $empty,
	onResize: $empty,
	onCollapse: $empty,
	onExpand: $empty
    },
    initialize: function(options) {
	this.setOptions(options);
	$extend(this, {
	    timestamp: $time(),
	    isCollapsed: false,
	    oldHeight: 0,
	    partner: null
	});
	if (this.options.id == null) {
	    this.options.id = "panel" + (++MUI.Panels.panelIDCount)
	}
	var instances = MUI.Panels.instances;
	var instanceID = instances.get(this.options.id);
	var options = this.options;
	if (instanceID) {
	    var instance = instanceID
	}
	if (this.panelEl) {
	    return
	} else {
	    instances.set(this.options.id, this)
	}
	this.fireEvent("onBeforeBuild");
	if (options.loadMethod == "iframe") {
	    options.padding = {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0
	    }
	}
	this.showHandle = true;
	if ($(options.column).getChildren().length == 0) {
	    this.showHandle = false
	}
	this.panelWrapperEl = new Element("div", {
	    id: this.options.id + "_wrapper",
	    "class": "panelWrapper expanded"
	}).inject($(options.column));
	this.panelEl = new Element("div", {
	    id: this.options.id,
	    "class": "panel expanded",
	    styles: {
		height: options.height
	    }
	}).inject(this.panelWrapperEl);
	this.panelEl.store("instance", this);
	this.panelEl.addClass(options.addClass);
	this.contentEl = new Element("div", {
	    id: options.id + "_pad",
	    "class": "pad"
	}).inject(this.panelEl);
	this.contentWrapperEl = this.panelEl;
	this.contentEl.setStyles({
	    "padding-top": options.padding.top,
	    "padding-bottom": options.padding.bottom,
	    "padding-left": options.padding.left,
	    "padding-right": options.padding.right
	});
	this.panelHeaderEl = new Element("div", {
	    id: this.options.id + "_header",
	    "class": "panel-header",
	    styles: {
		display: options.header ? "block" : "none"
	    }
	}).inject(this.panelEl, "before");
	var columnInstances = MUI.Columns.instances;
	var columnInstance = columnInstances.get(this.options.column);
	if (this.options.collapsible) {
	    this.collapseToggleInit();
	}
	if (this.options.headerToolbox) {
	    this.panelHeaderToolboxEl = new Element("div", {
		id: options.id + "_headerToolbox",
		"class": "panel-header-toolbox"
	    }).inject(this.panelHeaderEl)
	}
	this.panelHeaderContentEl = new Element("div", {
	    id: options.id + "_headerContent",
	    "class": "panel-headerContent"
	}).inject(this.panelHeaderEl);
	if (columnInstance.options.sortable) {
	    this.panelHeaderEl.setStyle("cursor", "move");
	    columnInstance.options.container.retrieve("sortables").addItems(this.panelWrapperEl);
	    if (this.panelHeaderToolboxEl) {
		this.panelHeaderToolboxEl.addEvent("mousedown", function(e) {
		    e = new Event(e).stop();
		    e.target.focus()
		});
		this.panelHeaderToolboxEl.setStyle("cursor", "default")
	    }
	}
	this.titleEl = new Element("h2", {
	    id: options.id + "_title"
	}).inject(this.panelHeaderContentEl);
	this.handleEl = new Element("div", {
	    id: options.id + "_handle",
	    "class": "horizontalHandle",
	    styles: {
		display: this.showHandle == true ? "block" : "none"
	    }
	}).inject(this.panelEl, "after");
	this.handleIconEl = new Element("div", {
	    id: options.id + "_handle_icon",
	    "class": "handleIcon"
	}).inject(this.handleEl);
	addResizeBottom(options.id);
	if (options.require.css.length || options.require.images.length) {
	    new MUI.Require({
		css: options.require.css,
		images: options.require.images,
		onloaded: function() {
		    this.newPanel()
		}.bind(this)
	    })
	} else {
	    this.newPanel()
	}
    },
    newPanel: function() {
	options = this.options;
	if (this.options.headerToolbox) {
	    MUI.updateContent({
		element: this.panelEl,
		childElement: this.panelHeaderToolboxEl,
		loadMethod: "html",
		content: options.headerToolboxContent,
		onContentLoaded: options.headerToolboxOnload
	    })
	}
	if (options.tabsURL == null) {
	    if (typeOf(options.title) == 'string') {
		this.titleEl.set("html", options.title);
	    } else if (typeOf(options.title) == 'element') {
		this.titleEl.empty().adopt(options.title);
	    }
	} else {
	    this.panelHeaderContentEl.addClass("tabs");
	    MUI.updateContent({
		element: this.panelEl,
		childElement: this.panelHeaderContentEl,
		loadMethod: "xhr",
		url: options.tabsURL,
		data: options.tabsData,
		onContentLoaded: options.tabsOnload
	    })
	}
	MUI.updateContent({
	    element: this.panelEl,
	    content: options.content,
	    method: options.method,
	    data: options.data,
	    url: options.contentURL,
	    onContentLoaded: null,
	    require: {
		js: options.require.js,
		onloaded: options.require.onloaded
	    }
	});
	$(options.column).getChildren(".panelWrapper").each(function(panelWrapper) {
	    panelWrapper.getElement(".panel").removeClass("bottomPanel")
	});
	$(options.column).getChildren(".panelWrapper").getLast().getElement(".panel").addClass("bottomPanel");
	MUI.panelHeight(options.column, this.panelEl, "new");
	if (this.options.isCollapsed && this.collapseToggleEl) {
	    this.collapseToggleEl.collapseClick();
	}
    },
    collapseToggleInit: function(options) {
	var options = this.options;
	var collapseClick = null;
	this.panelHeaderCollapseBoxEl = new Element("div", {
	    id: options.id + "_headerCollapseBox",
	    "class": "toolbox"
	}).inject(this.panelHeaderEl);
	if (options.headerToolbox) {
	    this.panelHeaderCollapseBoxEl.addClass("divider")
	}
	this.collapseToggleEl = new Element("div", {
	    id: options.id + "_collapseToggle",
	    "class": "panel-collapse icon16",
	    styles: {
		width: 16,
		height: 16
	    },
	    title: "Collapse Panel"
	}).inject(this.panelHeaderCollapseBoxEl);
	this.collapseToggleEl.addEvent("click", collapseClick = function(event) {
	    var panel = this.panelEl;
	    var panelWrapper = this.panelWrapperEl;
	    var instances = MUI.Panels.instances;
	    var expandedSiblings = [];
	    panelWrapper.getAllPrevious(".panelWrapper").each(function(sibling) {
		var instance = instances.get(sibling.getElement(".panel").id);
		if (instance.isCollapsed == false) {
		    expandedSiblings.push(sibling.getElement(".panel").id)
		}
	    });
	    panelWrapper.getAllNext(".panelWrapper").each(function(sibling) {
		var instance = instances.get(sibling.getElement(".panel").id);
		if (instance.isCollapsed == false) {
		    expandedSiblings.push(sibling.getElement(".panel").id)
		}
	    });
	    if (this.isCollapsed == false) {
		var currentColumn = MUI.Columns.instances.get($(options.column).id);
		if (expandedSiblings.length == 0 && currentColumn.options.placement != "main") {
		    var currentColumn = MUI.Columns.instances.get($(options.column).id);
		    currentColumn.columnToggle();
		    return
		} else {
		    if (expandedSiblings.length == 0 && currentColumn.options.placement == "main") {
			return
		    }
		}
		this.oldHeight = panel.getStyle("height").toInt();
		if (this.oldHeight < 10) {
		    this.oldHeight = 20
		}
		this.contentEl.setStyle("position", "absolute");
		panel.setStyle("height", 0);
		this.isCollapsed = true;
		panelWrapper.addClass("collapsed");
		panelWrapper.removeClass("expanded");
		MUI.panelHeight(options.column, panel, "collapsing");
		MUI.panelHeight();
		this.collapseToggleEl.removeClass("panel-collapsed");
		this.collapseToggleEl.addClass("panel-expand");
		this.collapseToggleEl.setProperty("title", "Expand Panel");
		this.fireEvent("onCollapse")
	    } else {
		this.contentEl.setStyle("position", null);
		panel.setStyle("height", this.oldHeight);
		this.isCollapsed = false;
		panelWrapper.addClass("expanded");
		panelWrapper.removeClass("collapsed");
		MUI.panelHeight(this.options.column, panel, "expanding");
		MUI.panelHeight();
		this.collapseToggleEl.removeClass("panel-expand");
		this.collapseToggleEl.addClass("panel-collapsed");
		this.collapseToggleEl.setProperty("title", "Collapse Panel");
		this.fireEvent("onExpand")
	    }
	}.bind(this))
	this.collapseToggleEl.collapseClick = collapseClick;

    }
});
MUI.Panel.implement(new Options, new Events);
MUI.extend({
    panelHeight: function(column, changing, action) {
	if (column != null) {
	    MUI.panelHeight2($(column), changing, action)
	} else {
	    $$(".column").each(function(column) {
		MUI.panelHeight2(column)
	    }.bind(this))
	}
    },
    panelHeight2: function(column, changing, action) {
	var instances = MUI.Panels.instances;
	var parent = column.getParent();
	var columnHeight = parent.getStyle("height").toInt();
	if (Browser.Engine.trident4 && parent == MUI.Desktop.pageWrapper) {
	    columnHeight -= 1
	}
	column.setStyle("height", columnHeight);
	var panels = [];
	column.getChildren(".panelWrapper").each(function(panelWrapper) {
	    panels.push(panelWrapper.getElement(".panel"))
	}.bind(this));
	var panelsExpanded = [];
	column.getChildren(".expanded").each(function(panelWrapper) {
	    panelsExpanded.push(panelWrapper.getElement(".panel"))
	}.bind(this));
	var panelsToResize = [];
	var tallestPanel;
	var tallestPanelHeight = 0;
	this.panelsTotalHeight = 0;
	this.height = 0;
	panels.each(function(panel) {
	    instance = instances.get(panel.id);
	    if (panel.getParent().hasClass("expanded") && panel.getParent().getNext(".expanded")) {
		instance.partner = panel.getParent().getNext(".expanded").getElement(".panel");
		instance.resize.attach();
		instance.handleEl.setStyles({
		    display: "block",
		    cursor: Browser.Engine.webkit ? "row-resize" : "n-resize"
		}).removeClass("detached")
	    } else {
		instance.resize.detach();
		instance.handleEl.setStyles({
		    display: "none",
		    cursor: null
		}).addClass("detached")
	    }
	    if (panel.getParent().getNext(".panelWrapper") == null) {
		instance.handleEl.hide()
	    }
	}.bind(this));
	column.getChildren().each(function(panelWrapper) {
	    panelWrapper.getChildren().each(function(el) {
		if (el.hasClass("panel")) {
		    var instance = instances.get(el.id);
		    anyNextSiblingsExpanded = function(el) {
			var test;
			el.getParent().getAllNext(".panelWrapper").each(function(sibling) {
			    var siblingInstance = instances.get(sibling.getElement(".panel").id);
			    if (siblingInstance.isCollapsed == false) {
				test = true
			    }
			}.bind(this));
			return test
		    }.bind(this);
		    anyExpandingNextSiblingsExpanded = function(el) {
			var test;
			changing.getParent().getAllNext(".panelWrapper").each(function(sibling) {
			    var siblingInstance = instances.get(sibling.getElement(".panel").id);
			    if (siblingInstance.isCollapsed == false) {
				test = true
			    }
			}.bind(this));
			return test
		    }.bind(this);
		    anyNextContainsChanging = function(el) {
			var allNext = [];
			el.getParent().getAllNext(".panelWrapper").each(function(panelWrapper) {
			    allNext.push(panelWrapper.getElement(".panel"))
			}.bind(this));
			var test = allNext.contains(changing);
			return test
		    }.bind(this);
		    nextExpandedChanging = function(el) {
			var test;
			if (el.getParent().getNext(".expanded")) {
			    if (el.getParent().getNext(".expanded").getElement(".panel") == changing) {
				test = true
			    }
			}
			return test
		    };
		    if (action == "new") {
			if (!instance.isCollapsed && el != changing) {
			    panelsToResize.push(el);
			    this.panelsTotalHeight += el.offsetHeight.toInt()
			}
		    } else {
			if (action == null || action == "collapsing") {
			    if (!instance.isCollapsed && (!anyNextContainsChanging(el) || !anyNextSiblingsExpanded(el))) {
				panelsToResize.push(el);
				this.panelsTotalHeight += el.offsetHeight.toInt()
			    }
			} else {
			    if (action == "expanding" && !instance.isCollapsed && el != changing) {
				if (!anyNextContainsChanging(el) || (!anyExpandingNextSiblingsExpanded(el) && nextExpandedChanging(el))) {
				    panelsToResize.push(el);
				    this.panelsTotalHeight += el.offsetHeight.toInt()
				}
			    }
			}
		    }
		    if (el.style.height) {
			this.height += el.getStyle("height").toInt()
		    }
		} else {
		    this.height += el.offsetHeight.toInt()
		}
	    }.bind(this))
	}.bind(this));
	var remainingHeight = column.offsetHeight.toInt() - this.height;
	this.height = 0;
	column.getChildren().each(function(el) {
	    this.height += el.offsetHeight.toInt()
	}.bind(this));
	var remainingHeight = column.offsetHeight.toInt() - this.height;
	panelsToResize.each(function(panel) {
	    var ratio = this.panelsTotalHeight / panel.offsetHeight.toInt();
	    var newPanelHeight = panel.getStyle("height").toInt() + (remainingHeight / ratio);
	    if (newPanelHeight < 1) {
		newPanelHeight = 0
	    }
	    panel.setStyle("height", newPanelHeight)
	}.bind(this));
	this.height = 0;
	column.getChildren().each(function(panelWrapper) {
	    panelWrapper.getChildren().each(function(el) {
		this.height += el.offsetHeight.toInt();
		if (el.hasClass("panel") && el.getStyle("height").toInt() > tallestPanelHeight) {
		    tallestPanel = el;
		    tallestPanelHeight = el.getStyle("height").toInt()
		}
	    }.bind(this))
	}.bind(this));
	var remainingHeight = column.offsetHeight.toInt() - this.height;
	if (remainingHeight != 0 && tallestPanelHeight > 0) {
	    tallestPanel.setStyle("height", tallestPanel.getStyle("height").toInt() + remainingHeight);
	    if (tallestPanel.getStyle("height") < 1) {
		tallestPanel.setStyle("height", 0)
	    }
	}
	parent.getChildren(".columnHandle").each(function(handle) {
	    var parent = handle.getParent();
	    if (parent.getStyle("height").toInt() < 1) {
		return
	    }
	    var handleHeight = parent.getStyle("height").toInt() - handle.getStyle("border-top").toInt() - handle.getStyle("border-bottom").toInt();
	    if (Browser.Engine.trident4 && parent == MUI.Desktop.pageWrapper) {
		handleHeight -= 1
	    }
	    handle.setStyle("height", handleHeight)
	});
	panelsExpanded.each(function(panel) {
	    MUI.resizeChildren(panel)
	}.bind(this))
    },
    resizeChildren: function(panel) {
	var instances = MUI.Panels.instances;
	var instance = instances.get(panel.id);
	var contentWrapperEl = instance.contentWrapperEl;
	if (instance.iframeEl) {
	    if (!Browser.Engine.trident) {
		instance.iframeEl.setStyles({
		    height: contentWrapperEl.getStyle("height"),
		    width: contentWrapperEl.offsetWidth - contentWrapperEl.getStyle("border-left").toInt() - contentWrapperEl.getStyle("border-right").toInt()
		})
	    } else {
		instance.iframeEl.setStyles({
		    height: contentWrapperEl.getStyle("height"),
		    width: contentWrapperEl.offsetWidth - contentWrapperEl.getStyle("border-left").toInt() - contentWrapperEl.getStyle("border-right").toInt() - 1
		});
		instance.iframeEl.setStyles({
		    width: contentWrapperEl.offsetWidth - contentWrapperEl.getStyle("border-left").toInt() - contentWrapperEl.getStyle("border-right").toInt()
		})
	    }
	}
    },
    rWidth: function(container) {
	if (container == null) {
	    var container = MUI.Desktop.desktop
	}
	container.getElements(".rWidth").each(function(column) {
	    var currentWidth = column.offsetWidth.toInt();
	    currentWidth -= column.getStyle("border-left").toInt();
	    currentWidth -= column.getStyle("border-right").toInt();
	    var parent = column.getParent();
	    this.width = 0;
	    parent.getChildren().each(function(el) {
		if (el.hasClass("mocha") != true) {
		    this.width += el.offsetWidth.toInt()
		}
	    }.bind(this));
	    var remainingWidth = parent.offsetWidth.toInt() - this.width;
	    var newWidth = currentWidth + remainingWidth;
	    if (newWidth < 1) {
		newWidth = 0
	    }
	    column.setStyle("width", newWidth);
	    column.getChildren(".panel").each(function(panel) {
		panel.setStyle("width", newWidth - panel.getStyle("border-left").toInt() - panel.getStyle("border-right").toInt());
		MUI.resizeChildren(panel)
	    }.bind(this))
	})
    }
});
function addResizeRight(element, min, max) {
    if (!$(element)) {
	return
    }
    element = $(element);
    var instances = MUI.Columns.instances;
    var instance = instances.get(element.id);
    var handle = element.getNext(".columnHandle");
    handle.setStyle("cursor", Browser.Engine.webkit ? "col-resize" : "e-resize");
    if (!min) {
	min = 50
    }
    if (!max) {
	max = 250
    }
    if (Browser.Engine.trident) {
	handle.addEvents({
	    mousedown: function() {
		handle.setCapture()
	    },
	    mouseup: function() {
		handle.releaseCapture()
	    }
	})
    }
    instance.resize = element.makeResizable({
	handle: handle,
	modifiers: {
	    x: "width",
	    y: false
	},
	limit: {
	    x: [min, max]
	},
	onStart: function() {
	    element.getElements("iframe").setStyle("visibility", "hidden");
	    element.getNext(".column").getElements("iframe").setStyle("visibility", "hidden")
	}.bind(this),
	onDrag: function() {
	    if (Browser.Engine.gecko) {
		$$(".panel").each(function(panel) {
		    if (panel.getElements(".mochaIframe").length == 0) {
			panel.hide()
		    }
		})
	    }
	    MUI.rWidth(element.getParent());
	    if (Browser.Engine.gecko) {
		$$(".panel").show()
	    }
	    if (Browser.Engine.trident4) {
		element.getChildren().each(function(el) {
		    var width = $(element).getStyle("width").toInt();
		    width -= el.getStyle("border-right").toInt();
		    width -= el.getStyle("border-left").toInt();
		    width -= el.getStyle("padding-right").toInt();
		    width -= el.getStyle("padding-left").toInt();
		    el.setStyle("width", width)
		}.bind(this))
	    }
	}.bind(this),
	onComplete: function() {
	    MUI.rWidth(element.getParent());
	    element.getElements("iframe").setStyle("visibility", "visible");
	    element.getNext(".column").getElements("iframe").setStyle("visibility", "visible");
	    instance.fireEvent("onResize")
	}.bind(this)
    })
}
function addResizeLeft(element, min, max) {
    if (!$(element)) {
	return
    }
    element = $(element);
    var instances = MUI.Columns.instances;
    var instance = instances.get(element.id);
    var handle = element.getPrevious(".columnHandle");
    handle.setStyle("cursor", Browser.Engine.webkit ? "col-resize" : "e-resize");
    var partner = element.getPrevious(".column");
    if (!min) {
	min = 50
    }
    if (!max) {
	max = 250
    }
    if (Browser.Engine.trident) {
	handle.addEvents({
	    mousedown: function() {
		handle.setCapture()
	    },
	    mouseup: function() {
		handle.releaseCapture()
	    }
	})
    }
    instance.resize = element.makeResizable({
	handle: handle,
	modifiers: {
	    x: "width",
	    y: false
	},
	invert: true,
	limit: {
	    x: [min, max]
	},
	onStart: function() {
	    $(element).getElements("iframe").setStyle("visibility", "hidden");
	    partner.getElements("iframe").setStyle("visibility", "hidden")
	}.bind(this),
	onDrag: function() {
	    MUI.rWidth(element.getParent())
	}.bind(this),
	onComplete: function() {
	    MUI.rWidth(element.getParent());
	    $(element).getElements("iframe").setStyle("visibility", "visible");
	    partner.getElements("iframe").setStyle("visibility", "visible");
	    instance.fireEvent("onResize")
	}.bind(this)
    })
}
function addResizeBottom(element) {
    if (!$(element)) {
	return
    }
    var element = $(element);
    var instances = MUI.Panels.instances;
    var instance = instances.get(element.id);
    var handle = instance.handleEl;
    handle.setStyle("cursor", Browser.Engine.webkit ? "row-resize" : "n-resize");
    partner = instance.partner;
    min = 0;
    max = function() {
	return element.getStyle("height").toInt() + partner.getStyle("height").toInt()
    }.bind(this);
    if (Browser.Engine.trident) {
	handle.addEvents({
	    mousedown: function() {
		handle.setCapture()
	    },
	    mouseup: function() {
		handle.releaseCapture()
	    }
	})
    }
    instance.resize = element.makeResizable({
	handle: handle,
	modifiers: {
	    x: false,
	    y: "height"
	},
	limit: {
	    y: [min, max]
	},
	invert: false,
	onBeforeStart: function() {
	    partner = instance.partner;
	    this.originalHeight = element.getStyle("height").toInt();
	    this.partnerOriginalHeight = partner.getStyle("height").toInt()
	}.bind(this),
	onStart: function() {
	    if (instance.iframeEl) {
		if (!Browser.Engine.trident) {
		    instance.iframeEl.setStyle("visibility", "hidden");
		    partner.getElements("iframe").setStyle("visibility", "hidden")
		} else {
		    instance.iframeEl.hide();
		    partner.getElements("iframe").hide()
		}
	    }
	}.bind(this),
	onDrag: function() {
	    partnerHeight = partnerOriginalHeight;
	    partnerHeight += (this.originalHeight - element.getStyle("height").toInt());
	    partner.setStyle("height", partnerHeight);
	    MUI.resizeChildren(element, element.getStyle("height").toInt());
	    MUI.resizeChildren(partner, partnerHeight);
	    element.getChildren(".column").each(function(column) {
		MUI.panelHeight(column)
	    });
	    partner.getChildren(".column").each(function(column) {
		MUI.panelHeight(column)
	    })
	}.bind(this),
	onComplete: function() {
	    partnerHeight = partnerOriginalHeight;
	    partnerHeight += (this.originalHeight - element.getStyle("height").toInt());
	    partner.setStyle("height", partnerHeight);
	    MUI.resizeChildren(element, element.getStyle("height").toInt());
	    MUI.resizeChildren(partner, partnerHeight);
	    element.getChildren(".column").each(function(column) {
		MUI.panelHeight(column)
	    });
	    partner.getChildren(".column").each(function(column) {
		MUI.panelHeight(column)
	    });
	    if (instance.iframeEl) {
		if (!Browser.Engine.trident) {
		    instance.iframeEl.setStyle("visibility", "visible");
		    partner.getElements("iframe").setStyle("visibility", "visible")
		} else {
		    instance.iframeEl.show();
		    partner.getElements("iframe").show();
		    var width = instance.iframeEl.getStyle("width").toInt();
		    instance.iframeEl.setStyle("width", width - 1);
		    MUI.rWidth();
		    instance.iframeEl.setStyle("width", width)
		}
	    }
	    instance.fireEvent("onResize")
	}.bind(this)
    })
}
MUI.extend({
    closeColumn: function(columnEl) {
	columnEl = $(columnEl);
	if (columnEl == null) {
	    return
	}
	var instances = MUI.Columns.instances;
	var instance = instances.get(columnEl.id);
	if (instance == null || instance.isClosing) {
	    return
	}
	instance.isClosing = true;
	var panels = $(columnEl).getElements(".panel");
	panels.each(function(panel) {
	    MUI.closePanel(panel.id)
	}.bind(this));
	if (Browser.Engine.trident) {
	    columnEl.dispose();
	    if (instance.handleEl != null) {
		instance.handleEl.dispose()
	    }
	} else {
	    columnEl.destroy();
	    if (instance.handleEl != null) {
		instance.handleEl.destroy()
	    }
	}
	if (MUI.Desktop) {
	    MUI.Desktop.resizePanels()
	}
	var sortables = instance.options.container.retrieve("sortables");
	if (sortables) {
	    sortables.removeLists(columnEl)
	}
	instances.erase(instance.options.id);
	return true
    },
    closePanel: function(panelEl) {
	panelEl = $(panelEl);
	if (panelEl == null) {
	    return
	}
	var instances = MUI.Panels.instances;
	var instance = instances.get(panelEl.id);
	if (panelEl != $(panelEl) || instance.isClosing) {
	    return
	}
	var column = instance.options.column;
	instance.isClosing = true;
	var columnInstances = MUI.Columns.instances;
	var columnInstance = columnInstances.get(column);
	if (columnInstance.options.sortable) {
	    columnInstance.options.container.retrieve("sortables").removeItems(instance.panelWrapperEl)
	}
	instance.panelWrapperEl.destroy();
	if (MUI.Desktop) {
	    MUI.Desktop.resizePanels()
	}
	var panels = $(column).getElements(".panelWrapper");
	panels.each(function(panelWrapper) {
	    panelWrapper.getElement(".panel").removeClass("bottomPanel")
	});
	if (panels.length > 0) {
	    panels.getLast().getElement(".panel").addClass("bottomPanel")
	}
	instances.erase(instance.options.id);
	return true
    }
});
MUI.files[MUI.path.source + "Layout/Dock.js"] = "loaded";
MUI.options.extend({
    dockWrapper: "dockWrapper",
    dockVisible: "false",
    dock: "dock"
});
MUI.extend({
    minimizeAll: function() {
	$$(".mocha").each(function(windowEl) {
	    var instance = windowEl.retrieve("instance");
	    if (!instance.isMinimized && instance.options.minimizable == true) {
		MUI.Dock.minimizeWindow(windowEl)
	    }
	}.bind(this))
    }
});
MUI.Dock = {
    options: {
	useControls: true,
	dockPosition: "bottom",
	dockVisible: false,
	trueButtonColor: [70, 245, 70],
	enabledButtonColor: [115, 153, 191],
	disabledButtonColor: [170, 170, 170]
    },
    initialize: function(options) {
	if (!MUI.Desktop) {
	    return
	}
	MUI.dockVisible = this.options.dockVisible;
	this.dockWrapper = $(MUI.options.dockWrapper);
	this.dock = $(MUI.options.dock);
	this.autoHideEvent = null;
	this.dockAutoHide = false;
	if (!this.dockWrapper) {
	    return
	}
	if (!this.options.useControls) {
	    if ($("dockPlacement")) {
		$("dockPlacement").setStyle("cursor", "default")
	    }
	    if ($("dockAutoHide")) {
		$("dockAutoHide").setStyle("cursor", "default")
	    }
	}
	this.dockWrapper.setStyles({
	    display: "block",
	    position: "absolute",
	    top: null,
	    bottom: MUI.Desktop.desktopFooter ? MUI.Desktop.desktopFooter.offsetHeight : 0,
	    left: 0
	});
	if (this.options.useControls) {
	    this.initializeDockControls()
	}
	if ($("dockLinkCheck")) {
	    this.sidebarCheck = new Element("div", {
		"class": "check",
		id: "dock_check"
	    }).inject($("dockLinkCheck"))
	}
	this.dockSortables = new Sortables("#dockSort", {
	    opacity: 1,
	    constrain: true,
	    clone: false,
	    revert: false
	});
	if (!(MUI.dockVisible)) {
	    this.dockWrapper.hide()
	}
	MUI.Desktop.setDesktopSize();
	if (MUI.myChain) {
	    MUI.myChain.callChain()
	}
    },
    initializeDockControls: function() {
	this.setDockColors();
	if (this.options.useControls) {
	    var canvas = new Element("canvas", {
		id: "dockCanvas",
		width: "15",
		height: "18"
	    }).inject(this.dock);
	    if (Browser.Engine.trident && MUI.ieSupport == "excanvas") {
		G_vmlCanvasManager.initElement(canvas)
	    }
	}
	var dockPlacement = $("dockPlacement");
	var dockAutoHide = $("dockAutoHide");
	dockPlacement.setProperty("title", "Position Dock Top");
	dockPlacement.addEvent("click", function() {
	    this.moveDock()
	}.bind(this));
	dockAutoHide.setProperty("title", "Turn Auto Hide On");
	dockAutoHide.addEvent("click", function(event) {
	    if (this.dockWrapper.getProperty("dockPosition") == "top") {
		return false
	    }
	    var ctx = $("dockCanvas").getContext("2d");
	    this.dockAutoHide = !this.dockAutoHide;
	    if (this.dockAutoHide) {
		$("dockAutoHide").setProperty("title", "Turn Auto Hide Off");
		MUI.circle(ctx, 5, 14, 3, this.options.trueButtonColor, 1);
		this.autoHideEvent = function(event) {
		    if (!this.dockAutoHide) {
			return
		    }
		    if (!MUI.Desktop.desktopFooter) {
			var dockHotspotHeight = this.dockWrapper.offsetHeight;
			if (dockHotspotHeight < 25) {
			    dockHotspotHeight = 25
			}
		    } else {
			if (MUI.Desktop.desktopFooter) {
			    var dockHotspotHeight = this.dockWrapper.offsetHeight + MUI.Desktop.desktopFooter.offsetHeight;
			    if (dockHotspotHeight < 25) {
				dockHotspotHeight = 25
			    }
			}
		    }
		    if (!MUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)) {
			if (!MUI.dockVisible) {
			    this.dockWrapper.show();
			    MUI.dockVisible = true;
			    MUI.Desktop.setDesktopSize()
			}
		    } else {
			if (MUI.Desktop.desktopFooter && event.client.y > (document.getCoordinates().height - dockHotspotHeight)) {
			    if (!MUI.dockVisible) {
				this.dockWrapper.show();
				MUI.dockVisible = true;
				MUI.Desktop.setDesktopSize()
			    }
			} else {
			    if (MUI.dockVisible) {
				this.dockWrapper.hide();
				MUI.dockVisible = false;
				MUI.Desktop.setDesktopSize()
			    }
			}
		    }
		}.bind(this);
		document.addEvent("mousemove", this.autoHideEvent)
	    } else {
		$("dockAutoHide").setProperty("title", "Turn Auto Hide On");
		MUI.circle(ctx, 5, 14, 3, this.options.enabledButtonColor, 1);
		document.removeEvent("mousemove", this.autoHideEvent)
	    }
	}.bind(this));
	this.renderDockControls();
	if (this.options.dockPosition == "top") {
	    this.moveDock()
	}
    },
    setDockColors: function() {
	var dockButtonEnabled = MUI.getCSSRule(".dockButtonEnabled");
	if (dockButtonEnabled && dockButtonEnabled.style.backgroundColor) {
	    this.options.enabledButtonColor = new Color(dockButtonEnabled.style.backgroundColor)
	}
	var dockButtonDisabled = MUI.getCSSRule(".dockButtonDisabled");
	if (dockButtonDisabled && dockButtonDisabled.style.backgroundColor) {
	    this.options.disabledButtonColor = new Color(dockButtonDisabled.style.backgroundColor)
	}
	var trueButtonColor = MUI.getCSSRule(".dockButtonTrue");
	if (trueButtonColor && trueButtonColor.style.backgroundColor) {
	    this.options.trueButtonColor = new Color(trueButtonColor.style.backgroundColor)
	}
    },
    renderDockControls: function() {
	var ctx = $("dockCanvas").getContext("2d");
	ctx.clearRect(0, 0, 100, 100);
	MUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1);
	if (this.dockWrapper.getProperty("dockPosition") == "top") {
	    MUI.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1)
	} else {
	    if (this.dockAutoHide) {
		MUI.circle(ctx, 5, 14, 3, this.options.trueButtonColor, 1)
	    } else {
		MUI.circle(ctx, 5, 14, 3, this.options.enabledButtonColor, 1)
	    }
	}
    },
    moveDock: function() {
	var ctx = $("dockCanvas").getContext("2d");
	if (this.dockWrapper.getStyle("position") != "relative") {
	    this.dockWrapper.setStyles({
		position: "relative",
		bottom: null
	    });
	    this.dockWrapper.addClass("top");
	    MUI.Desktop.setDesktopSize();
	    this.dockWrapper.setProperty("dockPosition", "top");
	    ctx.clearRect(0, 0, 100, 100);
	    MUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1);
	    MUI.circle(ctx, 5, 14, 3, this.options.disabledButtonColor, 1);
	    $("dockPlacement").setProperty("title", "Position Dock Bottom");
	    $("dockAutoHide").setProperty("title", "Auto Hide Disabled in Top Dock Position");
	    this.dockAutoHide = false
	} else {
	    this.dockWrapper.setStyles({
		position: "absolute",
		bottom: MUI.Desktop.desktopFooter ? MUI.Desktop.desktopFooter.offsetHeight : 0
	    });
	    this.dockWrapper.removeClass("top");
	    MUI.Desktop.setDesktopSize();
	    this.dockWrapper.setProperty("dockPosition", "bottom");
	    ctx.clearRect(0, 0, 100, 100);
	    MUI.circle(ctx, 5, 4, 3, this.options.enabledButtonColor, 1);
	    MUI.circle(ctx, 5, 14, 3, this.options.enabledButtonColor, 1);
	    $("dockPlacement").setProperty("title", "Position Dock Top");
	    $("dockAutoHide").setProperty("title", "Turn Auto Hide On")
	}
    },
    createDockTab: function(windowEl) {
	var instance = windowEl.retrieve("instance");
	var dockTab = new Element("div", {
	    id: instance.options.id + "_dockTab",
	    "class": "dockTab",
	    title: titleText
	}).inject($("dockClear"), "before");
	dockTab.addEvent("mousedown", function(e) {
	    new Event(e).stop();
	    this.timeDown = $time()
	});
	dockTab.addEvent("mouseup", function(e) {
	    this.timeUp = $time();
	    if ((this.timeUp - this.timeDown) < 275) {
		if (MUI.Windows.windowsVisible == false) {
		    MUI.toggleWindowVisibility();
		    if (instance.isMinimized == true) {
			MUI.Dock.restoreMinimized.delay(25, MUI.Dock, windowEl)
		    } else {
			MUI.focusWindow(windowEl)
		    }
		    return
		}
		if (instance.isMinimized == true) {
		    MUI.Dock.restoreMinimized.delay(25, MUI.Dock, windowEl)
		} else {
		    if (instance.windowEl.hasClass("isFocused") && instance.options.minimizable == true) {
			MUI.Dock.minimizeWindow(windowEl)
		    } else {
			MUI.focusWindow(windowEl)
		    }
		    var coordinates = document.getCoordinates();
		    if (windowEl.getStyle("left").toInt() > coordinates.width || windowEl.getStyle("top").toInt() > coordinates.height) {
			MUI.centerWindow(windowEl)
		    }
		}
	    }
	});
	this.dockSortables.addItems(dockTab);
	var titleText = instance.titleEl.innerHTML;
	var dockTabText = new Element("div", {
	    id: instance.options.id + "_dockTabText",
	    "class": "dockText"
	}).set("html", titleText.substring(0, 19) + (titleText.length > 19 ? "..." : "")).inject($(dockTab));
	if (instance.options.icon != false) {
	}
	MUI.Desktop.setDesktopSize()
    },
    makeActiveTab: function() {
	var windowEl = MUI.getWindowWithHighestZindex();
	var instance = windowEl.retrieve("instance");
	$$(".dockTab").removeClass("activeDockTab");
	if (instance.isMinimized != true) {
	    instance.windowEl.addClass("isFocused");
	    var currentButton = $(instance.options.id + "_dockTab");
	    if (currentButton != null) {
		currentButton.addClass("activeDockTab")
	    }
	} else {
	    instance.windowEl.removeClass("isFocused")
	}
    },
    minimizeWindow: function(windowEl) {
	if (windowEl != $(windowEl)) {
	    return
	}
	var instance = windowEl.retrieve("instance");
	instance.isMinimized = true;
	if (instance.iframeEl) {
	    if (!Browser.Engine.trident) {
		instance.iframeEl.setStyle("visibility", "hidden")
	    } else {
		instance.iframeEl.hide()
	    }
	}
	instance.contentBorderEl.setStyle("visibility", "hidden");
	if (instance.toolbarWrapperEl) {
	    instance.toolbarWrapperEl.hide()
	}
	windowEl.setStyle("visibility", "hidden");
	if (Browser.Platform.mac && Browser.Engine.gecko) {
	    if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
		var ffversion = new Number(RegExp.$1);
		if (ffversion < 3) {
		    instance.contentWrapperEl.setStyle("overflow", "hidden")
		}
	    }
	}
	MUI.Desktop.setDesktopSize();
	setTimeout(function() {
	    windowEl.setStyle("zIndex", 1);
	    windowEl.removeClass("isFocused");
	    this.makeActiveTab()
	}.bind(this), 100);
	instance.fireEvent("onMinimize", windowEl)
    },
    restoreMinimized: function(windowEl) {
	var instance = windowEl.retrieve("instance");
	if (instance.isMinimized == false) {
	    return
	}
	if (MUI.Windows.windowsVisible == false) {
	    MUI.toggleWindowVisibility()
	}
	MUI.Desktop.setDesktopSize();
	if (instance.options.scrollbars == true && !instance.iframeEl) {
	    instance.contentWrapperEl.setStyle("overflow", "auto")
	}
	if (instance.isCollapsed) {
	    MUI.collapseToggle(windowEl)
	}
	windowEl.setStyle("visibility", "visible");
	instance.contentBorderEl.setStyle("visibility", "visible");
	if (instance.toolbarWrapperEl) {
	    instance.toolbarWrapperEl.show()
	}
	if (instance.iframeEl) {
	    if (!Browser.Engine.trident) {
		instance.iframeEl.setStyle("visibility", "visible")
	    } else {
		instance.iframeEl.show()
	    }
	}
	instance.isMinimized = false;
	MUI.focusWindow(windowEl);
	instance.fireEvent("onRestore", windowEl)
    },
    toggle: function() {
	if (!MochaUI.dockVisible) {
	    this.dockWrapper.show();
	    MUI.dockVisible = true;
	    MUI.Desktop.setDesktopSize()
	} else {
	    this.dockWrapper.hide();
	    MUI.dockVisible = false;
	    MUI.Desktop.setDesktopSize()
	}
    }
};
