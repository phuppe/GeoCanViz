/*
 *
 * GeoCanViz viewer / Visionneuse GéoCanViz
 * gcviz.github.io/gcviz/License-eng.txt / gcviz.github.io/gcviz/Licence-fra.txt
 *
 * GIS map functions
 */
(function () {
	'use strict';
	define(['jquery-private',
			'kineticpanning',
			'gcviz-func',
			'dijit/Menu',
			'dijit/MenuItem',
			'dijit/PopupMenuItem',
            'gcviz-gislegend',
            'gcviz-giscluster',
            'esri/config',
			'esri/map',
			'esri/layers/FeatureLayer',
			'esri/layers/ArcGISTiledMapServiceLayer',
			'esri/layers/ArcGISDynamicMapServiceLayer',
			'esri/layers/ArcGISImageServiceLayer',
			'esri/layers/WebTiledLayer',
			'esri/layers/WMSLayer',
			'esri/layers/WMSLayerInfo',
			'esri/geometry',
			'esri/geometry/Extent',
            'esri/geometry/Point',
            'esri/dijit/Popup',
            'esri/dijit/PopupTemplate',
            'esri/dijit/InfoWindow',
            'esri/symbols/SimpleFillSymbol',
            'esri/Color',
            'dojo/Deferred',
            'dojo/DeferredList',
            'dojo/dom-construct',
            'dojo/dom-class',
            'dojo/_base/connect',
            'esri/tasks/IdentifyTask',
            'esri/tasks/IdentifyParameters',
            'dojo/_base/array'
	], function($viz, kpan, func, menu, menuItem, menupopup, gisLegend, gisCluster, esriConfig, esriMap, esriFL, esriTiled, esriDyna, esriImage, webTiled, wms, wmsInfo, esriGeom, esriExt, esriPoint, esriPopup, esriPopupTemplate, esriInfoWindow, esriFill, esriColor, dojoDeferred, dojoDefList, domConstruct, domClass, dojoConnect, IdentifyTask, IdentifyParameters, arrayUtils) {
		var mapArray = {},
			setProxy,
			createMap,
			createInset,
			applyLink,
			setPanScaleLink,
			connectLinkEvent,
			connectEvent,
			addLayer,
			createIdentifyTask,
			executeIdentifyTask,
			returnIdentifyResults,
			configLayers,
			resizeMap,
			resizeCenterMap,
			zoomPoint,
			getMapCenter,
			createMapMenu,
			zoomIn,
			zoomOut,
			panLeft,
			panUp,
			panRight,
			panDown,
			getKeyExtent,
			getOverviewLayer,
			linkNames = [],
			manageScreenState,
			linkInset,
			insetArray = {},
			isFullscreen,
			linkCount,
			noLink = false,
			identifyTask,
			identifyTaskIndex = -1,
			identifyParams,
			identifyTasks = [],
			themap,
			theIdentifyFeatures,
			returnToFunction;

		setProxy = function(url) {
			// set proxy for esri request (https://github.com/Esri/resource-proxy)
			// proxy needs to be in the same domain
			esriConfig.defaults.io.proxyUrl = url;
			esriConfig.defaults.io.alwaysUseProxy = false;
		};

        createMap = function(id, config) {
            var iExtent = config.extentinit,
                fExtent = config.extentmax,
                wkid = config.sr.wkid,
                initExtent = new esriExt({ 'xmin': iExtent.xmin, 'ymin': iExtent.ymin,
										'xmax': iExtent.xmax, 'ymax': iExtent.ymax,
										'spatialReference': { 'wkid': wkid } }),
                fullExtent = new esriExt({ 'xmin': fExtent.xmin, 'ymin': fExtent.ymin,
										'xmax': fExtent.xmax, 'ymax': fExtent.ymax,
										'spatialReference': { 'wkid': wkid } }),
				lod = config.lods,
				options,
				map,
				mapid = id.split('_')[0],
				panning;

			// set options
			if (lod.length) {
			//if (lod.values.length) {
				options = {
					extent: initExtent,
					spatialReference: { 'wkid': wkid },
					logo: false,
					showAttribution: false,
					lods: lod,
					wrapAround180: true,
					smartNavigation: false
				};
			} else {
				options = {
					extent: initExtent,
					spatialReference: { 'wkid': wkid },
					logo: false,
					showAttribution: false,
					wrapAround180: true,
					smartNavigation: false
				};
			}

			map = new esriMap(id, options);
			mapArray[mapid] = map;

			// add kinetic panning
			panning = new kpan(map);
			panning.enableMouse();

			// add value to map object
			map.vInitExtent = initExtent;
			map.vFullExtent = fullExtent;
			map.vIdName = mapid;
			map.vWkid = wkid;
			map.vInsetId = [];

			// resize the map on load to ensure everything is set correctly.
			// if we dont do this, every maps after the first one are not set properly
			map.on('load', function() {
				map.resize();

				// enable navigation (do not enable keyboard navigation,
				// this is made with custom events)
				map.enableScrollWheelZoom();
				map.isZoomSlider = false;
				map.disableDoubleClickZoom();

				// connect event map
				if (config.link) {
					linkNames.push({ 'name': map.vIdName, 'fire': false });
					connectLinkEvent(map);
				} else {
					connectEvent(map);
				}

				// set the link count to enable the first extent-change event
				linkCount = linkNames.length;

				// add context menu
				//gisM.createMapMenu(mymap);
            });

			return map;
		};

		createInset = function(id, config, masterId) {
			var extentC = config.extent,
				wkid = config.sr.wkid,
				extent = new esriExt({ 'xmin': extentC.xmin, 'ymin': extentC.ymin,
									'xmax': extentC.xmax, 'ymax': extentC.ymax,
									'spatialReference': { 'wkid': wkid } }),
				map,
				panning;

			map = new esriMap(id, {
				extent: extent,
				spatialReference: { 'wkid': wkid },
				logo: false,
				showAttribution: false,
				smartNavigation: false
			});

			// add kinetic panning
			panning = new kpan(map);
			panning.enableMouse();

			// add value to map object
			map.vWkid = wkid;
			map.vType = config.type;

			// resize the map on load to ensure everything is set correctly.
			// if we dont do this, every maps after the first one are not set properly
			map.on('load', function() {
				map.resize();
				map.disableMapNavigation();

				if (config.type !== 'static') {
					// add inset link to master map
					mapArray[masterId].vInsetId.push(map.id);
					insetArray[id] = map;

					if (config.typeinfo.pan) {
						map.enablePan();
					}

					if (config.type === 'panscale') {
						map.vLod = config.typeinfo.lod;
						map.setLevel(map.vLod);
						setTimeout(function() {
							map.vDeltaX = (Math.abs(map.extent.xmax) -
										Math.abs(map.extent.xmin)) / 2;
							map.vDeltaY = (Math.abs(map.extent.ymax) -
										Math.abs(map.extent.ymin)) / 2;
						}, 1000);
					}
				}
			});

			return map;
		};

		applyLink = function(mapName) {
			// loop trought maps and modify extent
			var len = linkNames.length,
				name,
				link,
				mymap;

			// loop trought array of link map
			while (len--) {
				link = linkNames[len];
				name = link.name;

				// if mapName is different from the link map name, set extent for this link map name
				if (name !== mapName)
				{
					mymap = mapArray[name];
					mymap.setExtent(mapArray[mapName].extent, mymap.spatialReference);
				}
			}
		};

		linkInset = function(map) {
			var len = map.vInsetId.length,
				insetMap;

			while (len--) {
				insetMap = insetArray[map.vInsetId[len]];

				if (insetMap.vType === 'panscale') {
					setPanScaleLink(map, insetMap);
				} else if (insetMap.vType === 'link') {
					insetMap.setExtent(map.extent);
				}
			}
		};

		setPanScaleLink = function(map, insetMap) {
			var mapCenter = getMapCenter(map),
				extent = new esriExt({ 'xmin': mapCenter.x - insetMap.vDeltaX, 'ymin': mapCenter.y - insetMap.vDeltaY,
									'xmax': mapCenter.x + insetMap.vDeltaX, 'ymax': mapCenter.y + insetMap.vDeltaY,
									'spatialReference': { 'wkid': map.spatialReference.wkid } });

				insetMap.setExtent(extent);
		};

		connectLinkEvent = function(map) {
			map.on('extent-change', func.debounce(function(evt) {
				var target = evt.target,
					id = target.id.split('_')[0],
					flag = false;

				// Check if all maps had fired event
				if (linkCount === linkNames.length) { flag = true; }

				// if exent-change has not been fire and not in fullscreen, do it
				if (flag && !isFullscreen) {
					// apply link
					setTimeout(function() { applyLink(id); }, 1000);
				}

				// check if inset needs to be resize
				if (!noLink) { linkInset(target); }
				noLink = false;

				// decreament the counter and check if we need to reseet it
				linkCount -= 1;
				if (linkCount === 0) {
					setTimeout(function() { linkCount = linkNames.length; }, 1000);
				}
			}, 1000, false));
		};

		connectEvent = function(map) {
			map.on('extent-change', func.debounce(function(evt) {
				var target = evt.target;

				// check if inset needs to be resize
				if (!noLink) { linkInset(target); }
				noLink = false;
			}, 1000, false));
		};

		addLayer = function(map, layerInfo) {
			var layer,
				options,
				resourceInfo,
				type = layerInfo.type;

			if (type === 1) {
				// TODO add WMTS functions
			} else if (type === 2) {
				layer = new esriTiled(layerInfo.url, { 'id': layerInfo.id });
			} else if (type === 3) {
				options = layerInfo.options;
				resourceInfo = {
					extent: map.extent,
					layerInfos: options.layerinfos
				};

				layer = new wms(layerInfo.url, {
					resourceInfo: resourceInfo,
					visibleLayers: options.visiblelayers,
					'id': layerInfo.id
				});
			} else if (type === 4) {
				layer = new esriDyna(layerInfo.url, { 'id': layerInfo.id });
			} else if (type === 5) {
				layer = new esriFL(layerInfo.url, {
                    mode: esriFL.MODE_ONDEMAND,
                    outFields: ['*'],
                    id: layerInfo.id
				});
			} else if (type === 6) {
				// cluster layer
				gisCluster.startCluster(map, layerInfo);
			}

			// cluster layer is added in gisCluster class
			if (type !== 6) {
				map.addLayer(layer);
			}
		};

		// createIdentifyTask = function(mymap, thelayer, mapid, callbackFunction) {
			// themap = mymap;
			// returnToFunction = callbackFunction;
			// // Add map event
			// theIdentifyFeatures = mymap.on('click', executeIdentifyTask);
			// //create identify tasks and setup parameters
			// identifyTask = new IdentifyTask(thelayer.layerinfo.url);
			// identifyParams = new IdentifyParameters();
			// identifyParams.tolerance = 3;
			// identifyParams.returnGeometry = true;
			// identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE; //LAYER_OPTION_ALL
			// identifyParams.width = mymap.width;
			// identifyParams.height = mymap.height;
			// //identifyTasks.Add(identifyTask);
			// identifyTaskIndex++;
			// identifyTasks[identifyTaskIndex] = identifyTask;
		// };

		createIdentifyTask = function(mymap, layers, mapid, callbackFunction) {
			themap = mymap;
			returnToFunction = callbackFunction;
			// Add map event
			theIdentifyFeatures = mymap.on('click', executeIdentifyTask);
			// Are popups desired?
			for (var i=0; i < layers.length; i++) {
				if (layers[i].popups) {
					//create identify tasks and setup parameters
					identifyTask = new IdentifyTask(layers[i].layerinfo.url);
					identifyParams = new IdentifyParameters();
					identifyParams.tolerance = 3;
					identifyParams.returnGeometry = true;
					identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE; //LAYER_OPTION_ALL
					identifyParams.width = mymap.width;
					identifyParams.height = mymap.height;
					//identifyTasks.Add(identifyTask);
					identifyTaskIndex++;
					identifyTasks[identifyTaskIndex] = identifyTask;
				}
			}
		};

//		executeIdentifyTask = function(event) {
//			var mapid,
//				right,
//				i,
//				deferred,
//				features = [];
//			mapid = event.currentTarget.id.substr(0,event.currentTarget.id.indexOf('_'));
//			right = $viz(window).width() - $viz('#popup' + mapid).width() - 5;
//			identifyParams.geometry = event.mapPoint;
//			identifyParams.mapExtent = themap.extent;
//redo like sample from gis stackexchange...
//			deferred = identifyTask
//				.execute(identifyParams)
//				.addCallback(function (response) {
//					// send the resonse to the calling view model 
//					returnToFunction(response);
//					return features;
//				});
//
//		};

		executeIdentifyTask = function(event) {
			var mapid,
				right,
				i,
				deferred = [],
				defList = [],
				features = [],
				dlTasks;
			mapid = event.currentTarget.id.substr(0,event.currentTarget.id.indexOf('_'));
			right = $viz(window).width() - $viz('#popup' + mapid).width() - 5;
			identifyParams.geometry = event.mapPoint;
			identifyParams.mapExtent = themap.extent;
			// define all deferred functions
			for (i=0; i<identifyTasks.length; i++) {
				deferred[i] = new dojoDeferred();
				defList.push(deferred[i]);
			}
			dlTasks = new dojoDefList(defList);
			dlTasks.then(returnIdentifyResults);
			// returnIdentifyResults will be called after all tasks have completed
			for (i=0; i<identifyTasks.length; i++) {
				//identifyTasks[i].execute(identifyParams, deferred[i].callback);
				identifyTasks[i].execute(identifyParams, dlTasks.callback);
			}
		};

		returnIdentifyResults = function(response) {
			// send the resonse to the calling view model 
			returnToFunction(response);
		};

		getOverviewLayer = function(configoverviewtype, configoverviewurl) {
			var bLayer;
            if (configoverviewtype === 1) { // WMTS service
				bLayer = new webTiled(configoverviewurl);
            } else if (configoverviewtype === 2) { // tiled service
				bLayer = new esriTiled(configoverviewurl);
            } else if (configoverviewtype === 4) { // dynamic service
				bLayer = new esriDyna(configoverviewurl);
            // } else if (configoverviewtype === 7) { // image service
				// bLayer = new esriImage(configoverviewurl);
            // } else if (configoverviewtype === 8) { // Virtual Earth service
				// bLayer = new esriImage(configoverviewurl);
            // } else if (configoverviewtype === 9) { // Open Street Map service
				// bLayer = new esriImage(configoverviewurl);
            }
            return bLayer;
		};

		resizeMap = function(map) {
			map.resize();
		};

		resizeCenterMap = function(map, options) {
			var point,
				interval;

			options = options || {};
			point = options.point || getMapCenter(map);
			interval = options.interval || 0;

			resizeMap(map);
			setTimeout(function() { zoomPoint(map, point); }, interval);
		};

		zoomPoint = function(map, point) {
			point = point || getMapCenter(map);
			map.centerAt(point);
		};

		getMapCenter = function(map) {
			var extent,
				point;

			extent = map.extent;
			point = new esriPoint((extent.xmin + extent.xmax) / 2,
								(extent.ymin + extent.ymax) / 2, map.vWkid);

			return point;
		};

		manageScreenState = function(map, interval, fullscreen) {
			// get extent before the resize then resize
			var extent = map.extent;
			isFullscreen = fullscreen;

			// set no link to true to avoid link inset on extent-change
			// after the resize if fullscreen
			if (fullscreen) { noLink = true; }
			resizeMap(map);

			// wait for the resize to finish then set extent 
			// (cant use resize event because it is trigger before it is finish)
			setTimeout(function() { map.setExtent(extent); }, interval);
		};

		// USE JQUERY.UI-contextmenu INSTEAD OF DOJO!!!
		createMapMenu = function() {
			// Creates right-click context menu for map
			var ctxMenuMap = new menu({
				targetNodeIds: ['gcviz-header']
				// onOpen: function(box) {
				// // Lets calculate the map coordinates where user right clicked.
				// //currentLocation = getMapPointFromMenuPosition(box);          
				// }
			});

			ctxMenuMap.addChild(new menuItem({
				label: 'Add Point',
				onClick: function() {
				}
			}));

			ctxMenuMap.startup();
			//ctxMenuMap.bindDomNode(map.container);
        };

		zoomIn = function(map) {
			map.setExtent(getKeyExtent(map, 'in'));
		};

		zoomOut = function(map) {
			map.setExtent(getKeyExtent(map, 'out'));
		};

		panLeft = function(map) {
			map.setExtent(getKeyExtent(map, 'left'));
		};

		panUp = function(map) {
			map.setExtent(getKeyExtent(map, 'up'));
		};

		panRight = function(map) {
			map.setExtent(getKeyExtent(map, 'right'));
		};

		panDown = function(map) {
			map.setExtent(getKeyExtent(map, 'down'));
		};

		getKeyExtent = function(map, direction) {
			var extent = map.extent,
				factorPan = 2,
				factorZoom = 4,
				delta,
				xmin = extent.xmin,
				xmax = extent.xmax,
				ymin = extent.ymin,
				ymax = extent.ymax;

			if (direction === 'up') {
				delta = (ymax - ymin) / factorPan;
				ymin = ymin - delta;
				ymax = ymax - delta;
			} else if (direction === 'down') {
				delta = (ymax - ymin) / factorPan;
				ymin = ymin + delta;
				ymax = ymax + delta;
			} else if (direction === 'left') {
				delta = (xmax - xmin) / factorPan;
				xmin = xmin - delta;
				xmax = xmax - delta;
			} else if (direction === 'right') {
				delta = (xmax - xmin) / factorPan;
				xmin = xmin + delta;
				xmax = xmax + delta;
			} else if (direction === 'in') {
				delta = (xmax - xmin) / factorZoom;
				xmin = xmin + delta;
				xmax = xmax - delta;
				delta = (ymax - ymin) / factorZoom;
				ymin = ymin + delta;
				ymax = ymax - delta;
			} else if (direction === 'out') {
				delta = (xmax - xmin) / factorZoom;
				xmin = xmin - delta;
				xmax = xmax + delta;
				delta = (ymax - ymin) / factorZoom;
				ymin = ymin - delta;
				ymax = ymax + delta;
			}

			extent = new esriExt({ 'xmin': xmin, 'ymin': ymin,
								'xmax': xmax, 'ymax': ymax,
								'spatialReference': { 'wkid': map.spatialReference.wkid } });

			return extent;
		};

		return {
			setProxy: setProxy,
			createMap: createMap,
			createInset: createInset,
			addLayer: addLayer,
			createIdentifyTask: createIdentifyTask,
			resizeMap: resizeMap,
			resizeCenterMap: resizeCenterMap,
			zoomPoint: zoomPoint,
			getOverviewLayer: getOverviewLayer,
			getMapCenter: getMapCenter,
			manageScreenState: manageScreenState,
			createMapMenu: createMapMenu,
			zoomIn: zoomIn,
			zoomOut: zoomOut,
			panLeft: panLeft,
			panUp: panUp,
			panRight: panRight,
			panDown: panDown
		};
	});
}());
