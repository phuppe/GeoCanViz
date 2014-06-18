/*
 *
 * GeoCanViz viewer / Visionneuse GéoCanViz
 * gcviz.github.io/gcviz/License-eng.txt / gcviz.github.io/gcviz/Licence-fra.txt
 *
 * GIS Legend functions
 */
(function () {
	'use strict';
	define(['jquery-private',
			'esri/request',
			'esri/renderers/Renderer',
			'dojo/dom-construct',
			'esri/symbols/jsonUtils',
			'esri/renderers/jsonUtils',
			'dojox/gfx',
			'dojo/dom',
			'dojo/dom-class'
	], function($viz, Request, Renderer, domConstruct, esriJsonUtilS, esriJsonUtilR, gfx, dom, dojoClass) {
		var setLayerVisibility,
			setLayerOpacity,
			getFeatureLayerSymbol,
			createSymbols,
			createSVGSurface;

		setLayerVisibility = function(mymap, selectedLayer, visState) {
			var layer = mymap.getLayer(selectedLayer);

			// need to check for undefined because of cluster layer. They are not set
			// when this code irun for the first time
			if (typeof layer !== 'undefined') {
				layer.setVisibility(visState);
			}
		};

		setLayerOpacity = function(mymap, layerid, opacityValue) {
			var layer = mymap.getLayer(layerid);

			// need to check for undefined because of cluster layer. They are not set
			// when this code irun for the first time
			if (typeof layer !== 'undefined') {
				layer.setOpacity(opacityValue);
			}
		};

		getFeatureLayerSymbol = function(renderer, node, layerid) {
			var mySurface,
				descriptors,
				shape,
				aFields,
				anode,
				nodeImage,
				nodeLabel,
				jsonRen = JSON.parse(renderer),
				ren = esriJsonUtilR.fromJson(jsonRen),
				renDefSym = ren.defaultSymbol,
				renInfo = ren.infos,
				renSym = ren.symbol,
				normField = ren.normalizationField,
				field1 = ren.attributeField,
				field2 = ren.attributeField2,
				field3 = ren.attributeField3,
				symbolLocation = node;

			if (renInfo) {
				// unique renderer, class break renderer
				var legs = renInfo;
				if (renDefSym && legs.length > 0 && legs[0].label !== '[all other values]') {
					// add to front of array
					legs.unshift({
						label: '[all other values]',
						symbol: renDefSym
					});
				}

				// fields symbology is based on
				aFields = field1 + (normField ? '/' + normField : '');
				aFields += (field2 ? '/' + field2 : '') + (field3 ? '/' + field3 : '');
				anode = '<div id="featureLayerSymbol' + layerid +
						'" class="gcviz-legendUnqiueFieldHolderDiv row">';
				anode += aFields + '</div>';

				// need a spot in div for each renderer
				domConstruct.place(anode, node);
				domConstruct.place(domConstruct.create('br'), symbolLocation);

				$viz.each(legs, function(key, value) {
					nodeImage = domConstruct.create('div', { 'id': 'imgSymbol', 'class': 'gcviz-legendSymbolUniqueValueDiv gcviz-inline gcviz-verticalAlignMiddle span2' });
					nodeLabel = domConstruct.create('div', { 'class': 'gcviz-inline gcviz-verticalAlignMiddle span8' });
					dojoClass.add(nodeLabel, 'gcviz-legendUniqueValueSpan');
					descriptors = esriJsonUtilS.getShapeDescriptors(value.symbol);
					mySurface = createSVGSurface(value, nodeImage);
					shape = mySurface.createShape(descriptors.defaultShape);
					createSymbols(descriptors, shape, value);
					nodeLabel.innerHTML = value.label;
					domConstruct.place(nodeImage, symbolLocation);
					domConstruct.place(nodeLabel, symbolLocation);
					domConstruct.place(domConstruct.create('br'), symbolLocation);
				});
			} else {
				// picture marker, simple marker
				if (renSym) {
					descriptors = esriJsonUtilS.getShapeDescriptors(renSym);
					mySurface = createSVGSurface(ren, node);
					shape = mySurface.createShape(descriptors.defaultShape);
					createSymbols(descriptors, shape, ren);
				}
			}
		};

		createSVGSurface = function(renderer, node) {
			var mySurface,
				symWidth = renderer.symbol.width,
				symHeight = renderer.symbol.height;

			if (symWidth && symHeight) {
				mySurface = gfx.createSurface(node, symWidth, symHeight);
			} else {
				mySurface = gfx.createSurface(node, 30, 30);
			}

			return mySurface;
		};

		createSymbols = function(descript, shp, renderer) {
			var descFill = descript.fill,
				descStroke = descript.stroke,
				symWidth = renderer.symbol.width,
				symHeight = renderer.symbol.height;

			if (descFill) {
				shp.setFill(descFill);
			}
			if (descStroke) {
				shp.setStroke(descStroke);
			}
			if (symWidth && symHeight) { // wont work for simple fill, no width or height
				shp.applyTransform({
					dx: symWidth / 2,
					dy: symHeight / 2
				});
			} else {
				shp.applyTransform({
					dx: 15,
					dy: 15
				});
			}
		};

		return {
			setLayerVisibility: setLayerVisibility,
			setLayerOpacity: setLayerOpacity,
			getFeatureLayerSymbol: getFeatureLayerSymbol
		};
	});
}());
