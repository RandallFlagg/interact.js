// Taye Adeyemi

/** @namespace */
window.interact = (function () {
	"use strict";

	var prevX = 0,
		prevY = 0,
		interactNodes = [],
		nodeStyle,
		target = null,
		supportsTouch = 'createTouch' in document,
		mouseIsDown = false,
		downEvent,
		upEvent,
		moveEvent,
		edgeWidth = supportsTouch? 30 : 10,
		typeErr = new TypeError('Type Error'),
		events = {
			add: function (target, type, listener, useCapture) {
				if (target.events === undefined) {
					target.events = [];
				}
				if (target.events[type] === undefined) {
					target.events[type] = [];
				}
				target.addEventListener(type, listener, useCapture || false);
				target.events[type].push(listener);
				return listener;
			},
			remove: function (target, type, listener, useCapture) {
				if (target && target.events && target.events[type]) {
					var i;
					if (listener === undefined) {
						for (i=0; i < target.events[type].length; i++) {
							target.removeEventListener(type, target.events[type][i], useCapture || false);
							target.events[type].splice(i, 1);
						}
					}
					else {
						for (i=0; i < target.events[type].length; i++) {
							if (target.events[type][i] === listener) {
								target.removeEventListener(type, listener, useCapture || false);
								target.events[type].splice(i, 1);
							}
						}
					}
				}
			}
		};

	/** @private */
	function xResize(event) {
		event.preventDefault();
		
		if (mouseIsDown && target.actions.resize) {
			addClass(target.element, 'interact-target');
			
			var x = event.pageX,
			newWidth = ( event.pageX > target.location.x)? target.width + (x - prevX) : 0 ;

			target.setSize(newWidth, target.height);
			prevX = x;
		}
	}

	/** @private */
	function yResize(event) {
		event.preventDefault();
		
		if (mouseIsDown && target.actions.resize) {
			addClass(target.element, 'interact-target');
			var y = event.pageY,
			newHeight = ( event.pageY > target.location.y)? target.height + (y - prevY) : 0 ;

			target.setSize(target.width, newHeight);
			prevY = y;
		}
	}

	/** @private */
	function xyResize(event) {
		event.preventDefault();
		
		if (mouseIsDown && target.actions.resize) {	
			addClass(target.element, 'interact-target');	
			var x = event.pageX, y = event.pageY,
			newWidth = ( event.pageX > target.location.x)? target.width + (x - prevX) : 0 ,
			newHeight = ( event.pageY > target.location.y)? target.height + (y - prevY) : 0 ;

			target.setSize(newWidth, newHeight);
			prevX = x;
			prevY = y;
		}
	}
	/* Should change this so devices with mouse and touch can use both */
	if (supportsTouch) {
		downEvent = 'touchstart',
		upEvent = 'touchend',
		moveEvent = 'touchmove';
	}
	else {
		downEvent = 'mousedown',
		upEvent = 'mouseup',
		moveEvent = 'mousemove';
	}

	/** @private */
	function docMouseUp (event) {
		console.log('target = ' + target);
		events.remove(document, moveEvent, xResize);
		events.remove(document, moveEvent, yResize);
		events.remove(document, moveEvent, xyResize);
		events.remove(document, moveEvent, interact.drag.xyDrag);
		
		mouseIsDown = false;
		clearTarget();
		events.add(document, moveEvent, mouseMove);
	}

	/** @private */
	function mouseMove(event) {
		if (event.target.actions && (event.target.actions.resize || event.target.actions.drag)) {
			var x = event.pageX,
				y = event.pageY,
				target = event.target.object,
				right = (x - target.location.x > target.width - edgeWidth),
				bottom = (y - target.location.y > target.height - edgeWidth);

			if (right) {
				target.element.style.cursor = bottom?'se-resize' : 'e-resize';
			}
			else {
				target.element.style.cursor = bottom?'s-resize' : target.actions.drag? 'pointer' : 'default';
			}
		}
	};

	/** @private */
	function mouseDown(event) {
		mouseIsDown = true;
		if (event.target.actions && (event.target.actions.resize || event.target.actions.drag)) {
			var	right,
				bottom;

				prevX = event.pageX;
				prevY = event.pageY;
				target = event.target.object;
				right = (prevX - target.location.x > target.width - edgeWidth),
				bottom = (prevY - target.location.y > target.height - edgeWidth);

			if (right) {
				event.preventDefault();

				events.remove(document, moveEvent);
				console.log('resizing on right');
				if (bottom) {
					events.add( document, moveEvent, xyResize );
				}
				else {
					events.add( document, moveEvent, xResize ) ;
				}
			}
			else if (bottom) {
				console.log('resizing on bottom');
				events.remove(document, moveEvent);
				events.add( document, moveEvent, yResize );
			}
			else if (target.actions.drag) {
				event.preventDefault();

				bringToFront(target.element);
				console.log('moving node');
				events.remove(document, moveEvent);
				events.add( document, moveEvent, interact.drag.xyDrag );
				target.element.style.cursor = 'move';					
			}
		return false;
		}
	}

	/** @private */
	function give(parent, child) {
		return parent.appendChild(child);
	}

	/** @private */
	function make(tag, parent) {
		return parent?	parent.appendChild(document.createElement(tag)):
				parent.createElement(tag);
	}

	/** @private */
	function disown(element) {
		return element.parentElement.removeChild(element);
	}

	/** @private */
	function removeClass(element, className) {
		element.className = 
			element.className.replace( new RegExp( '(?:^|\\s)' + className + '(?!\\S)' ) , '' );
	}
	
	/** @private */
	function addClass(element, className) {
		if (!element.className.match( new RegExp( '(?:^|\\s)' + className + '(?!\\S)' ))) {
			element.className += ' ' + className;
		}
	}

	/**
	 * @class Vector Class for locations and dimensions
	 * @param {number} x Value of X ordinate
	 * @param {number} y Value of Y ordinate
	 */
	function Vector(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	}
	
	Vector.prototype.set = function (x, y) {
		this.x = x;
		this.y = y || x;
	};

	Vector.prototype.setX = function (x) {
		this.x = x;
	};

	Vector.prototype.setY = function (y) {
		this.y = y;
	};

	Vector.prototype.copy = function (other) {
		if (!other.x && other.y) {
			return;
		}
		this.x = other.x;
		this.y = other.y;
	};

	/**
	 * @class Node for demonstrating interact functionality
	 * @param {number} x Horizontal position
	 * @param {number} y Vertical position
	 * @param {number} w Element width
	 * @param {number} h Element height
	 */
	function demoNode(x, y, w, h) {
		this.location = new Vector(x, y);
		this.width = w || 0;
		this.height = h || 0;
		this.actions = {resize: true, drag: true};

		
		this.element = document.createElement('div');
		this.element.actions = this.actions;
		this.element.object = this;
		
		this.element.style.setProperty('width', this.width + 'px', '');
		this.element.style.setProperty('height', this.height + 'px', '');
		this.element.style.setProperty('left', x + 'px', '');
		this.element.style.setProperty('top', y + 'px', '');
		this.element.className += ' interact-node ';
		
		if (!nodeStyle) {
			nodeStyle = document.createElement('style');
			nodeStyle.type = 'text/css';
			nodeStyle.innerHTML =' .interact-node { background-color:#2288FF; border:5px solid #333333; border-radius:10px; cursor:move; position:absolute; width:100px; height: 100px}';
			nodeStyle.innerHTML +=' .interact-node:hover { border-color: #AAAAAA; }';
			nodeStyle.innerHTML +=' .interact-target { border-style: dashed; }';
			document.body.appendChild(nodeStyle);
		}
	}

	demoNode.prototype.setSize = function (x, y) {
		if (x && x.constructor.name == 'Vector') {
			this.width =  x.x;
			this.height =  x.y;
		}
		else {
			if (x == null || y == null) {
				typeErr.name = 'Incorrect parameter types';
				typeErr.message = 'demoNode.setSize Parameters must be a single Vector or two numbers.';
				throw (typeErr);
			}
			this.width = x;
			this.height = y;
		}
		this.element.style.setProperty('width', Math.max(x, 20) + 'px', ''); 
		this.element.style.setProperty('height', Math.max(y, 20) + 'px', ''); 
	};

	demoNode.prototype.position = function (x, y) {
		if (x === undefined || y === undefined) {
			return;
		}
		
		this.location.set(x, y);
		this.element.style.setProperty('left', x + 'px', '');
		this.element.style.setProperty('top', y + 'px', '');
	};

	/** @private */
	function bringToFront(element) {
		// Very lazy
		var parent = element.parentElement;
		give(parent, disown(element));
	}

	/** @private */
	function clearTarget() {
		if (target) {
			removeClass(target.element, 'interact-target');
		}
		target = null;
	}

	/**
	 * @name interact
	 * 
	 */
	var interact = {};
	interact.nodes = [];

	/**
	 * @function
	 * @memberOf interact
	 * @description Display debugging data in the browser console
	 */
	interact.debug = function () {
		console.log('target   : ' + target);
		console.log('prevX    : ' + prevX);
		console.log('prevY    : ' + prevY);
		throw (typeErr);
	}

	/**
	 * @function
	 * @description Add an element to the list of interact nodes
	 * @param {object HTMLElement} element The DOM Element that will be added
	 * @param {object} options An object with boolean properties
	 */
	interact.set = function (element, options) {
		var	newNode = {
				element: element,
				drag: options.drag || false,
				resize: options.resize || false,
				parent: options.parent || false
			};
		addClass('interact-node');
		interactNodes.push(newNode);
		
		// different things to be done for normal nodes and graphics nodes
	};
	

	/**
	 * @function
	 * @description Remove an element from the list of interact nodes
	 * @param {object HTMLElement} element The DOM Element that will be removed
	 */
	interact.unset = function (element) {
		var i;
		for (i = 0; i < interactNodes.length; i++) {
			if (interactNodes[i].element === element) {
				interactNodes.splice(i-1, 1);
			}
		}
	};
	
	/**
	 * @description Contains drag functions
	 */
	interact.drag = {
		xyDrag: function (event) {
			event.preventDefault();
			if (mouseIsDown && target.actions.drag) {
				addClass(target.element, 'interact-target');
				var x = event.pageX,
					y = event.pageY;

				target.position(target.location.x + x - prevX , target.location.y + (y - prevY));
				prevX = x;
				prevY = y;
			}
		}
	};
	

	/**
	 * @function
	 * @description introduce random draggable, resizeable nodes to the document (for testing)
	 * @param {number} [n] The number of nodes to be added (default
	 * @param {object} options An object with boolean properties
	 */
	interact.randomNodes = function (n, parent) {
		n = n || 10;
		parent = parent || document.body;
		
		for (var i = 0; i < n; i++) {
			if (interact.nodes[i]!==undefined && interact.nodes[i].element.parentNode === parent) {
				var par = interact.nodes[i].element.parentNode;
				
				par.removeChild(interact.nodes[i].element);
				interact.nodes[i] = new demoNode(Math.random()*(window.screen.width - 20), Math.random()*(window.screen.height - 20), Math.random()* 200, Math.random()* 200);
				give(par, interact.nodes[interact].element);
			}
			else {
				interact.nodes.push(new demoNode(Math.random()*(window.screen.width - 20), Math.random()*(window.screen.height - 20), Math.random()* 200, Math.random()* 200));
				give(document.body, interact.nodes[i].element);
			}
		}
	};
	events.add( document, moveEvent, mouseMove);
	events.add( document, downEvent, mouseDown);
	events.add( document, 'dragenter', function (event) {event.preventDefault();});

	events.add(document, upEvent, docMouseUp);
	return interact;
}());

