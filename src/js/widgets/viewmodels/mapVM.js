/*
 *
 * GeoCanViz viewer / Visionneuse GéoCanViz
 * gcviz.github.io/gcviz/License-eng.txt / gcviz.github.io/gcviz/Licence-fra.txt
 *
 * Map view model widget
 */
(function() {
	'use strict';
	define(['jquery',
			'knockout',
			'gcviz-gismap'
	], function($, ko, gisM) {
		var initialize,
			vm;

		initialize = function($mapElem) {
			
			// data model				
			var mapViewModel = function($mapElem) {
				var _self = this,
					mapframe = $mapElem.mapframe,
					mapid = mapframe.id,
					config = mapframe.map,
					map;
		
				_self.init = function() {
					var layers = config.layers,
						lenLayers = layers.length,
						$map = $('#' + mapid + '_holder'),
						$root,
						$container;
						
					// create map	
					map = gisM.createMap(mapid + '_holder', config, mapframe.extent);
						
					// add layers
					layers = layers.reverse();
					while (lenLayers--) {
						var layer = layers[lenLayers];
						gisM.addLayer(map, layer.type, layer.url);
					}
						
					// set events (mouseover mouseout focusin focusout)
					$map.on('mouseenter mouseleave focusin focusout', function(e) {
						var type = e.type;
						if (type === 'mouseenter' || type === 'focusin') {
							this.focus();
						} else if (type === 'mouseleave' || type === 'focusout') {
							this.blur();
						}
					});
					
					// set class and remove cursor for container
					$root = $('#' + mapid + '_holder_root');
					$container = $('#' + mapid + '_holder_container');
					$map.addClass('gcviz-map');
					$root.addClass('gcviz-root');
					$container.addClass('gcviz-container');

					_self.focus();
					
					// keep map reference in the viewmodel to be accessible from other view model
					_self.map = map;

					return { controlsDescendantBindings: true };
				};

				_self.focus = function() {
					// focus
					_self.mapfocus = ko.observable();
					_self.mapfocus.focused = ko.observable();
					_self.mapfocus.focused.subscribe(function(newValue) {
						if (!newValue) {
							var test = 'test';
							// call link map
							//$map[0].fireEvent("on" + event.eventType, event);
						}
					});
				};
				
				_self.applyKey = function(key, shift) {
					var map = _self.map,
						prevent = false;
					
					if (key === 37) {
						gisM.panLeft(map);
						prevent = true;
					} else if (key === 38) {
						gisM.panUp(map);
						prevent = true;
					} else if (key === 39) {
						gisM.panRight(map);
						prevent = true;
					} else if (key === 40) {
						gisM.panDown(map);
						prevent = true;
					
					// chrome/safari is different then firefox. Need to check for both.
					} else if ((key === 187 && shift) || (key === 61 && shift)) {
						gisM.zoomIn(map);
						prevent = true;
					}  else if ((key === 189 && shift) || (key === 173 && shift)) {
						gisM.zoomOut(map);
						prevent = true;
					
					// firefox trigger internal api zoom even if shift is not press. Grab this key and prevent default.
					} else if (key === 61) {
						prevent = true;
					}
					
					return prevent;
				};
				
				_self.init();
			};
			vm = new mapViewModel($mapElem);
			ko.applyBindings(vm, $mapElem[0]); // This makes Knockout get to work
			
			return vm;
		};
		
		return {
			initialize: initialize
		};
	});
}).call(this);
