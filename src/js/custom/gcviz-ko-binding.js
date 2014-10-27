/*
 *
 * GeoCanViz viewer / Visionneuse GéoCanViz
 * gcviz.github.io/gcviz/License-eng.txt / gcviz.github.io/gcviz/Licence-fra.txt
 *
 * hold custom Knockout binding
 */
/* global dojo: false */
(function() {
	'use strict';
	define(['jquery-private',
			'knockout',
			'gcviz-func',
			'dijit/form/HorizontalSlider',
			'dijit/form/RadioButton',
			'jqueryui'
	], function($viz, ko, gcvizFunc, slider, radio) {
	var btnArray = [];

    ko.bindingHandlers.tooltip = {
		init: function(element, valueAccessor) {
			var local = ko.utils.unwrapObservable(valueAccessor()),
				options = {},
				$element = $viz(element);

			ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
			ko.utils.extend(options, local);

			$element.attr('title', options.content);
			$element.tooltip(options);

			ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.tooltip('destroy');
				});
			},
			options: {
				show: {
					effect: 'slideDown',
					delay: 1000
				},
				hide: {
					effect: 'slideUp',
					delay: 100
				},
				position: {
					my: 'right+30 top+5'
				},
				tooltipClass: 'gcviz-tooltip',
				trigger: 'hover, focus'
			}
	};

	ko.bindingHandlers.wcag = {
		init: function(element, valueAccessor, allBindings, viewModel) {
			var manageWCAG,
				mapid = viewModel.mapid,
				vm = gcvizFunc.getElemValueVM(mapid, ['header'], 'js');

			manageWCAG = function() {
				viewModel.isWCAG(!viewModel.isWCAG());
			};
			vm.isWCAG.subscribe(manageWCAG);
		}
	};

	ko.bindingHandlers.fullscreen = {
		init: function(element, valueAccessor, allBindings, viewModel) {
			var manageFullscreen,
				mapid = viewModel.mapid,
				vm = gcvizFunc.getElemValueVM(mapid, ['header'], 'js');

			manageFullscreen = function(fullscreen) {
				if (fullscreen) {
					viewModel.enterFullscreen(vm.widthSection, vm.heightSection);
				} else {
					viewModel.exitFullscreen();
				}
			};
			vm.isFullscreen.subscribe(manageFullscreen);
		}
	};

	ko.bindingHandlers.insetVisibility = {
		init: function(element, valueAccessor, allBindings, viewModel) {
			var manageInsetVisibility,
				mapid = viewModel.mapid,
				vm = gcvizFunc.getElemValueVM(mapid, ['header'], 'js');
			vm.isInsetVisible.subscribe(manageInsetVisibility);

			manageInsetVisibility = function(visible) {
				viewModel.setVisibility(visible);
			};
		}
	};

	ko.bindingHandlers.enterkey = {
		init: function(element, valueAccessor, allBindings, viewModel) {
			// get function name to call from the binding
			var func = valueAccessor().func,
				keyType = valueAccessor().keyType;

			ko.utils.registerEventHandler(element, keyType, function(event) {
				if (viewModel[func](event.which, event.shiftKey, event.type)) {
					event.preventDefault();
					return false;
				}
				return true;
			});
		}
	};

	ko.bindingHandlers.buttonBlur = {
		init: function(element) {
			// add the element to the array to have an array of all problematic buttons
			btnArray.push(element);

			ko.utils.registerEventHandler(element, 'mouseover', function() {
				// loop trought buttons to blur them when we mouse over another button.
				// This is a workaround for button that keep focus once push. Even if
				// use mouve over on another button the button doesn't loose focus.
				var len = btnArray.length;
				while (len--) {
					$viz(btnArray[len]).blur();
				}
			});
		}
	};

	ko.bindingHandlers.HorizontalSliderDijit = {
        init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var options = valueAccessor(),
				id = viewModel.id,
				widget;

			function loopChildren(VM, e) {
				if (VM.items.length > 0) {
					Object.keys(VM.items).forEach(function(key) {
						loopChildren(VM.items[key], e, loopChildren);
					});
				}
				else {
					bindingContext.$root.changeServiceOpacity(VM.id, e);
				}
			}

			if (options.enable) {
				$viz(element).attr('Visible', options.visible);
				widget = new slider({
					name: 'slider',
					minimum: options.extent[0],
					maximum: options.extent[1],
					intermediateChanges: true,
					value: options.value,
					showButtons: false
				}).placeAt(element);

				// set initstate opacity
				if(viewModel.items.length === 0) {
					bindingContext.$root.changeServiceOpacity(id, options.value);
				} else {
					loopChildren(viewModel, options.value, loopChildren);
				}

				dojo.addClass(widget.domNode, 'gcviz-leg-slider');

				widget.on('Change', function(e) {

					if(viewModel.items.length === 0) {
						bindingContext.$root.changeServiceOpacity(id, e);
					} else {
						loopChildren(viewModel, e, loopChildren);
					}
				});
			}
		}
	};

	ko.bindingHandlers.legendItemList = {
		init: function(element, valueAccessor, allBindings, viewModel) {
			var options = valueAccessor(),
				$element = $viz(element);

			if (viewModel.items.length > 0) {
				$element.children('div#childItems.gcviz-legendHolderDiv').toggle(options.expanded, function(event) {
					event.stopPropagation();
				});
			} else {
				$element.children('.gcviz-legendSymbolDiv').toggle(options.expanded);
				$element.children('div#customImage.gcviz-legendHolderImgDiv').toggle(options.expanded);
			}

			if (viewModel.displaychild.enable === false && viewModel.customimage.enable === false) { //remove bullet symbol
				$element.css('background-image', 'none');
			}

			return false;
		}
	};

	ko.bindingHandlers.LegendRadioButtons = {
		init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			var options = valueAccessor(),
				widget;

			widget = new radio({
				name: options.group,
                value: options.value,
                checked: options.value
            }).placeAt(element);

			widget.on('Change', function(e) {
				bindingContext.$root.switchRadioButtonVisibility(bindingContext.$root.mymap, bindingContext.$data, e);
			});
		}
	};

	// http://stackoverflow.com/questions/9877301/knockoutjs-observablearray-data-grouping
	ko.observableArray.fn.uniqueArray = function() {
		var target = this;

		ko.computed(function() {
			// http://jsfiddle.net/gabrieleromanato/BrLfv/
			var found, x, y,
				origArr = target(),
				newArr = [],
				origLen = origArr.length;

			for (x = 0; x < origLen; x++) {
				found = undefined;
				for (y = 0; y < newArr.length; y++) {
					if (origArr[x] === newArr[y]) {
						found = true;
						break;
					}
				}
				if (!found) {
					newArr.push(origArr[x]);
				}
			}

			return target(newArr);
		}).extend({ notify: 'always' });

		return target;
	};

	ko.bindingHandlers.uiDialog = {
		init: function(element, valueAccessor, allBindings, viewModel) {
			var customFunc,
				local = ko.utils.unwrapObservable(valueAccessor()),
				options = {},
				$element = $viz(element),
				optsDefault = ko.bindingHandlers.uiDialog.options;

			$viz.extend(true, options, optsDefault);
			ko.utils.extend(options, local);

			// if function are provided for ok and/or cancel, update
			if (typeof options.ok !== 'undefined') {
				options.buttons[0].click = options.ok;
			}
			if (typeof options.cancel !== 'undefined') {
				options.buttons[1].click = options.cancel;
			} else {
				options.buttons.pop();
			}
			if (typeof options.close !== 'undefined') {
				options.close = options.close;
			}
			if (typeof options.title !== 'undefined') {
				options.title = options.title;
			}

			$element.dialog(options);

			customFunc = function(value) {
				$element.dialog(value ? 'open' : 'close');
			};

			viewModel[local.openDialog].subscribe(customFunc);

			//handle disposal (if KO removes by the template binding)
			ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
				$element.dialog('destroy');
			});
		},
		options: {
			autoOpen: false,
			modal: true,
			resizable: false,
			draggable: false,
			show: 'fade',
			hide: 'fade',
			closeOnEscape: true,
			close: function() { },
			buttons: [{
				text: 'Ok',
				click: function() {
					$viz(this).dialog('close');
				}
				}, {
				text: 'Cancel',
				click: function() {
					$viz(this).dialog('close');
				}
			}]
		}
	};

	// http://lassieadventurestudio.wordpress.com/2012/06/14/return-key-binding-knockout/
	ko.bindingHandlers.returnKey = {
		init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			ko.utils.registerEventHandler(element, 'keydown', function(evt) {
				if (evt.keyCode === 13) {
					// to solve page refresh bug on enter on input field
					// http://www.w3.org/MarkUp/html-spec/html-spec_8.html#SEC8.2
					evt.preventDefault();
					valueAccessor().call(viewModel, bindingContext.$data);
				}
			});
		}
	};

	// http://knockoutjs.com/documentation/extenders.html
	ko.extenders.numeric = function(target, options) {
		// create a writeable computed observable to intercept writes to our observable
		var result = ko.computed({
			read: target,  // always return the original observables value
			write: function(newValue) {
				var min, max,
					current = target(),
					precision = options.precision,
					validation = options.validation,
					roundingMultiplier = Math.pow(10, precision),
					newValueAsNum = isNaN(newValue) ? validation.min : parseFloat(+newValue),
					valueToWrite = Math.round(newValueAsNum * roundingMultiplier) / roundingMultiplier;

				// if it is a float, let add '.'
				if (typeof newValue === 'string' && precision > 0) {
					if (newValue.indexOf('.') === newValue.length - 1) {
						valueToWrite = newValue;
					}
				}

				if (typeof validation !== 'undefined') {
					// check if validation are observable, if so get value
					min = (typeof validation.min === 'function') ? validation.min() : validation.min;
					max = (typeof validation.max === 'function') ? validation.max() : validation.max;

					if (valueToWrite < min || valueToWrite > max) {
						$viz('#' + validation.id).text(validation.msg);
						valueToWrite = min;
					} else {
						$viz('#' + validation.id).text('');
					}
				}

				// only write if it changed
				if (valueToWrite !== current) {
					target(valueToWrite);
				} else {
					// if the rounded value is the same, but a different value was written, force a notification for the current field
					if (newValue !== current) {
						target.notifySubscribers(valueToWrite);
					}
				}
			}
		}).extend({ notify: 'always' });

		// initialize with current value to make sure it is rounded appropriately
		result(target());

		// return the new computed observable
		return result;
	};

	});
}).call(this);
