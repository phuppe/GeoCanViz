/*
 *
 * GeoCanViz viewer / Visionneuse GéoCanViz
 * gcviz.github.io/gcviz/License-eng.txt / gcviz.github.io/gcviz/Licence-fra.txt
 *
 * Datagrid view widget
 */
(function() {
	'use strict';
	define(['gcviz-vm-datagrid'
	], function(datagridVM) {
		var initialize;

		initialize = function($mapElem) {
			var $popup,
				config = $mapElem.datagrid,
				mapid = $mapElem.mapframe.id,
				node = '';
			// dialog text to show popup
			node += '<span>';
			node += '<div id="popup' + mapid + '" class="gcviz-popup" data-bind="uiDialog: { width: 350, height: 200, title: $root.thePopupDialogTitle, openDialog: \'isPopupDialogOpen\', modal: false, close: $root.dialogPopupClose }">';
			node += '<select id="popupSelect' + mapid + '" class="gcviz-popup-select" data-bind="click: $root.selectLayerOptions" tabindex="0" title="Select the features from the following layer"></select>';
			node += '<button class="gcviz-popup-zoom" data-bind="click: $root.clickZoom" tabindex="0" title="Zoom to record"></button>';
			node += '<button class="gcviz-popup-previous" data-bind="click: $root.clickPrevious, enable: $root.isEnablePrevious" tabindex="0" title="Previous record"></button>';
			node += '<button class="gcviz-popup-next" data-bind="click: $root.clickNext, enable: $root.isEnableNext" tabindex="0" title="Next record"></button>';
			node += '</span>';
			node += '<span class="gcviz-popup-counter" data-bind="text: $root.popupCounter"></span>';
			node += '<hr class="gcviz-popup-separator"/>';
			node += '<div class="gcviz-popup-content" style="height: 155px;">';
			node += '</div>';
			node += '</div>';


			//node += '<div id="popup' + mapid + '" class="gcviz-popup" data-bind="uiDialog: { width: 350, height: 200}"></div>';
			//node = '<div id="popup' + mapid + '"></div>';
			$mapElem.find('#' + mapid).append(node);

			//$mapElem.find('#' + mapid).append('<div id="popup' + mapid + '" class="gcviz-popup"></div>');
			$popup = $mapElem.find('.gcviz-popup');

			return(datagridVM.initialize($popup, mapid, config));
		};

		return {
			initialize: initialize
		};
	});
}).call(this);
