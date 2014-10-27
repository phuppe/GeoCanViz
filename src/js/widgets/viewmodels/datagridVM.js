/*
 *
 * GeoCanViz viewer / Visionneuse GéoCanViz
 * gcviz.github.io/gcviz/License-eng.txt / gcviz.github.io/gcviz/Licence-fra.txt
 *
 * datagrid view model widget
 */
/* global locationPath: false */
(function() {
	'use strict';
	define(['jquery-private',
			'knockout',
			'gcviz-i18n',
			'gcviz-func',
			'gcviz-gismap'
	], function($viz, ko, i18n, gcvizFunc, gisMap) {
		var initialize,
			vm;

		initialize = function($mapElem, mapid, config) {

			// data model				
			var datagridViewModel = function($mapElem, mapid, config) {
				var _self = this,
					layers = config.layers,
					identifiedFeatures,
					currentFeatureIndex,
					totalFeatures;

				_self.isPopupDialogOpen = ko.observable(false);
				_self.isEnablePrevious = ko.observable(false);
				_self.isEnableNext = ko.observable(false);
				_self.thePopupDialogTitle = ko.observable('');
				_self.popupCounter = ko.observable('');

				_self.init = function() {
					var mymap = gcvizFunc.getElemValueVM(mapid, ['map', 'map'], 'js');

					if (config.enable) {
						// Are popups desired?
						//for (var i=0; i < layers.length; i++) {
						//	if (layers[i].popups) {
						//		gisMap.createIdentifyTask(mymap, layers[i], mapid, _self.returnFromIdentifyTask);
						//	}
						//}
					gisMap.createIdentifyTask(mymap, layers, mapid, _self.returnFromIdentifyTask);
					}

					return { controlsDescendantBindings: true };
				};

				_self.returnFromIdentifyTask = function(features) {
					var right,
						layerNamesList = [];

					right = $viz(window).width() - $viz('#popupmap2').width() - 5;

					if (features.length > 0) {
						//TODO Determine position from config file
						//if (put menu on right) { // Put it at the default location on the right?
						//	$viz('#popupmap2').dialog({ position: [right, 0] });
						//} else { // else, put it on the left
							$viz('#popupmap2').dialog({ position: [5, 0] });
						//}
						$viz('.gcviz-popup-content').css('width', '335px');
						$viz('.gcviz-popup-content').css('heigth', '155px');

						// Put the features in a variable accessible byu the other functions.
						identifiedFeatures = features;

						//TODO Get the list of layers we got results from and add them to the scroll list in the popup
						var v = $viz('#popupSelect'+mapid);
						v.find('option').remove().end();
						$viz('#popupSelect'+mapid)
							.append($viz('<option></option>')
							.attr('value', -1)
							.text(i18n.getDict('%popup-alllayers')));
						for (var i=0; i < features.length; i++) {
							if ($viz.inArray(features[i].layerName, layerNamesList) === -1) {
								layerNamesList.push(features[i].layerName);
								$viz('#popupSelect'+mapid)
									.append($viz('<option></option>')
									.attr('value', i)
									.text(features[i].layerName));
							}
						}

						// Display the first feature
						currentFeatureIndex = 0;
						totalFeatures = features.length;
						_self.displayFeature(features[0]);
						_self.isPopupDialogOpen(true);
						_self.popupCounter('1/' + totalFeatures);
						_self.isEnablePrevious(false);
						//$viz('.gcviz-popup-previous').addClass('gcviz-hidden');
						if (totalFeatures > 1) {
							_self.isEnableNext(true);
							//$viz('.gcviz-popup-next').removeClass('gcviz-hidden');
						}
					}
				};

				_self.displayFeature = function(currentFeature) {
					var titleString,
						thedescription,
						fAttrNames,
						fAttrValues;

					// display the feature attributes in the popup
					for (var j=0; j < layers.length; j++) {
						if (layers[j].popups) {
							if (currentFeature.layerName === layers[j].title) {
								titleString = layers[j].popups.title.titletext;
								$viz('#popupmap2').dialog({ title: titleString });
								// get the feature attribute names and values
								fAttrNames = $viz.map(currentFeature.feature.attributes, function(value, index) {
									return [index];
								});
								fAttrValues = $viz.map(currentFeature.feature.attributes, function(value, index) {
									return [value];
								});
								//Put the desired fields in the content description
								thedescription = '';
								for (var k=0; k < layers[j].popups.fields.length; k++) {
									for (var l=0; l < fAttrNames.length; l++) {
										if (layers[j].popups.fields[k].fieldname.toUpperCase() === fAttrNames[l].toUpperCase()) {
											thedescription += '<span class="gcviz-prop">' + layers[j].popups.fields[k].fieldlabel + '</span><br/>';
											thedescription += '<span class="gcviz-val">' + fAttrValues[l] + '</span><br/>';
										}
									}
								}
								$viz('.gcviz-popup-content').html(thedescription);
							}
						}
					}
					//TODO highlight the feature
					//gisData.createGraphic(currentFeature.feature, ??key??)
				};

				_self.dialogPopupClose = function() {
					_self.isPopupDialogOpen(false);
					currentFeatureIndex = -1;
					totalFeatures = 0;
				};

				_self.clickZoom = function() {
					var currentFeature = identifiedFeatures[currentFeatureIndex].feature;
					var mymap = gcvizFunc.getElemValueVM(mapid, ['map', 'map'], 'js');
					//TODO zoom to center feature on map
					//gisMap.zoomFeature(mymap, currentFeature);
				};

				_self.clickPrevious = function() {
					var currentFeature,
						graphicFeature;
					// decrement index unless already 0
					if (currentFeatureIndex > 0) {
						currentFeatureIndex--;
						currentFeature = identifiedFeatures[currentFeatureIndex];
						_self.displayFeature(currentFeature);
						if (currentFeatureIndex === 0) {
							_self.isEnablePrevious(false);
						} else {
							_self.isEnablePrevious(true);
						}
						_self.isEnableNext(true);
						_self.popupCounter((currentFeatureIndex + 1) + '/' + totalFeatures);
						//TODO highlight the feature
						//graphicFeature = gisData.createGraphic(currentFeature.feature, ??key??)
						//TODO add the graphic feature to the map
					}
				};

				_self.clickNext = function() {
					var currentFeature,
						graphicFeature;
					// decrement index unless already 0
					if (currentFeatureIndex <= (totalFeatures - 1)) {
						currentFeatureIndex++;
						currentFeature = identifiedFeatures[currentFeatureIndex];
						_self.displayFeature(currentFeature);
						if (currentFeatureIndex === (totalFeatures - 1)) {
							_self.isEnableNext(false);
						} else {
							_self.isEnableNext(true);
						}
						_self.isEnablePrevious(true);
						_self.popupCounter((currentFeatureIndex + 1) + '/' + totalFeatures);
						//TODO highlight the feature
						//graphicFeature = gisData.createGraphic(currentFeature.feature, ??key??)
						//TODO add the graphic feature to the map
					}
				};

				_self.init();
			};

			vm = new datagridViewModel($mapElem, mapid, config);
			ko.applyBindings(vm, $mapElem[0]); // This makes Knockout get to work
			return vm;
		};

		return {
			initialize: initialize
		};
	});
}).call(this);
