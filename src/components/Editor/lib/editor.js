"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var chroma_js_1 = require("chroma-js");
var colormap_1 = require("components/Editor/lib/colormap");
var fabric_utils_1 = require("components/Editor/lib/fabric-utils");
var generator_1 = require("components/Editor/lib/generator");
var fabric_1 = require("fabric");
var canvas_utils_1 = require("lib/wordart/canvas-utils");
var fonts_1 = require("lib/wordart/fonts");
var lodash_1 = require("lodash");
var mobx_1 = require("mobx");
var paper_1 = require("paper");
var seedrandom_1 = require("seedrandom");
var async_1 = require("utils/async");
var console_logger_1 = require("utils/console-logger");
var ids_1 = require("utils/ids");
var not_empty_1 = require("utils/not-empty");
var type_utils_1 = require("utils/type-utils");
var editor_item_1 = require("components/Editor/lib/editor-item");
var Editor = /** @class */ (function () {
    function Editor(params) {
        var _this = this;
        this.logger = console_logger_1.consoleLoggers.editor;
        this.editorItemIdGen = new ids_1.UninqIdGenerator(3);
        /** Info about the current shape */
        this.shape = null;
        this.fontsInfo = new Map();
        this.itemsSelection = false;
        this.shapeSelection = false;
        this.showLockBorders = function () {
            console.log('showLockBorders');
            for (var _i = 0, _a = _this.items.shape.itemsById; _i < _a.length; _i++) {
                var _b = _a[_i], item = _b[1];
                item.setLockBorderVisibility(true);
            }
            _this.canvas.requestRenderAll();
        };
        this.hideLockBorders = function () {
            console.log('hideLockBorders');
            for (var _i = 0, _a = _this.items.shape.itemsById; _i < _a.length; _i++) {
                var _b = _a[_i], item = _b[1];
                item.setLockBorderVisibility(false);
            }
            _this.canvas.requestRenderAll();
        };
        this.enableItemsSelection = function () {
            _this.itemsSelection = true;
            for (var _i = 0, _a = _this.items.shape.itemsById; _i < _a.length; _i++) {
                var _b = _a[_i], item = _b[1];
                if (item.fabricObj) {
                    item.fabricObj.selectable = true;
                }
            }
            _this.enableSelectionMode();
            _this.canvas.requestRenderAll();
        };
        this.disableItemsSelection = function () {
            _this.itemsSelection = false;
            for (var _i = 0, _a = _this.items.shape.itemsById; _i < _a.length; _i++) {
                var _b = _a[_i], item = _b[1];
                if (item.fabricObj) {
                    item.fabricObj.selectable = false;
                }
            }
            _this.deselectAll();
        };
        this.setAspectRatio = function (aspect) {
            _this.aspectRatio = aspect;
            _this.projectBounds = new paper_1["default"].Rectangle({
                x: 0,
                y: 0,
                width: 1000,
                height: 1000 / _this.aspectRatio
            });
            _this.handleResize();
        };
        this.handleResize = function () {
            var wrapperBounds = _this.params.canvasWrapperEl.getBoundingClientRect();
            wrapperBounds.width -= 40;
            wrapperBounds.height -= 40;
            // Update view size
            if (wrapperBounds.width / wrapperBounds.height > _this.aspectRatio) {
                _this.canvas.setWidth(_this.aspectRatio * wrapperBounds.height);
                _this.canvas.setHeight(wrapperBounds.height);
            }
            else {
                _this.canvas.setWidth(wrapperBounds.width);
                _this.canvas.setHeight(wrapperBounds.width / _this.aspectRatio);
            }
            // // Update view transform to make sure the viewport includes the entire project bounds
            _this.canvas.setZoom(_this.canvas.getWidth() / _this.projectBounds.width);
        };
        this.setBgColor = function (config) {
            _this.logger.debug('setBgColor', mobx_1.toJS(config, { recurseEverything: true }));
            _this.canvas.backgroundColor =
                config.kind === 'transparent' ? 'transparent' : config.color;
            _this.canvas.requestRenderAll();
        };
        this.setShapeFillColors = function (config) { return __awaiter(_this, void 0, void 0, function () {
            var shape, colorsMap, color_1, objects;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug('setShapeFillColors', mobx_1.toJS(config, { recurseEverything: true }));
                        if (!this.shape) {
                            this.logger.debug('>  No current shape, early exit');
                            return [2 /*return*/];
                        }
                        if (this.shape.kind === 'raster') {
                            this.setShapeOpacity(config.opacity);
                            this.canvas.requestRenderAll();
                            return [2 /*return*/];
                        }
                        if (!this.fabricObjects.shape || !this.fabricObjects.shapeOriginalColors) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, new Promise(function (r) {
                                return _this.fabricObjects.shapeOriginalColors.clone(function (copy) { return r(copy); }, ['id']);
                            })];
                    case 1:
                        shape = _a.sent();
                        if (config.kind === 'color-map') {
                            colorsMap = colormap_1.computeColorsMap(shape);
                            this.logger.debug('>  Using color map', colorsMap);
                            colorsMap.colors.forEach(function (colorEntry, entryIndex) {
                                _this.logger.debug(">    Setting color to " + config.colorMap[entryIndex] + ", " + colorEntry.color + " for " + colorEntry.fabricItems.length + " items...");
                                colorEntry.fabricItems.forEach(function (item) {
                                    var color = config.colorMap[entryIndex] || colorEntry.color;
                                    if (colorEntry.fill) {
                                        item.set({ fill: color });
                                    }
                                    if (colorEntry.stroke && item.stroke) {
                                        item.set({ stroke: color });
                                    }
                                });
                            });
                            this.canvas.remove(this.fabricObjects.shape);
                            this.canvas.insertAt(shape, 0, false);
                            // this.shape. = colorsMap
                            this.setShapeObj(shape);
                        }
                        else {
                            this.logger.debug('>  Using single color');
                            color_1 = config.color;
                            objects = shape instanceof fabric_1.fabric.Group ? shape.getObjects() : [shape];
                            objects.forEach(function (obj) {
                                obj.set({ fill: color_1 });
                                if (obj.stroke) {
                                    obj.set({ stroke: color_1 });
                                }
                            });
                            this.canvas.remove(this.fabricObjects.shape);
                            this.canvas.insertAt(shape, 0, false);
                            this.setShapeObj(shape);
                        }
                        this.setShapeOpacity(config.opacity);
                        this.canvas.requestRenderAll();
                        return [2 /*return*/];
                }
            });
        }); };
        this.setShapeObj = function (shape) {
            if (!_this.shape) {
                throw new Error('no shape');
            }
            shape.set({ selectable: _this.shapeSelection });
            _this.shape.obj = shape;
        };
        this.setShapeOpacity = function (opacity) {
            _this.logger.debug('setShapeOpacity', opacity);
            if (!_this.shape) {
                return;
            }
            _this.shape.obj.set({ opacity: opacity });
            _this.canvas.requestRenderAll();
        };
        this.setShapeItemsColor = function (coloring) { return __awaiter(_this, void 0, void 0, function () {
            var itemsById, items, colors, scale, itemAreas, maxArea, minArea, rng, shapeRaster, shapeRasterImgData, dimSmallerFactor, _loop_1, this_1, i;
            var _this = this;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        itemsById = this.items.shape.itemsById;
                        items = __spreadArrays(itemsById.values());
                        this.logger.debug('setItemsColor', mobx_1.toJS(coloring, { recurseEverything: true }), items.length + " items");
                        colors = [];
                        if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
                            if (coloring.kind === 'single-color') {
                                colors = [coloring.color];
                            }
                            else if (coloring.kind === 'gradient') {
                                scale = chroma_js_1["default"].scale([coloring.colorFrom, coloring.colorTo]);
                                colors = scale.colors(10);
                            }
                        }
                        else if (coloring.kind === 'shape' && coloring.shapeStyleFill) {
                            if (coloring.shapeStyleFill.kind === 'single-color') {
                                colors = [coloring.shapeStyleFill.color];
                            }
                            else if (coloring.shapeStyleFill.kind === 'color-map') {
                                colors = coloring.shapeStyleFill.colorMap;
                            }
                            else if (coloring.shapeStyleFill.kind === 'original') {
                            }
                            else {
                                type_utils_1.exhaustiveCheck(coloring.shapeStyleFill.kind);
                            }
                        }
                        itemAreas = items.map(function (item) {
                            if (item.kind === 'word') {
                                var wordPathBb = item.pathBounds;
                                var scaling = item.transform.scaling;
                                var wordH = (wordPathBb.y2 - wordPathBb.y1) * scaling.y;
                                var wordW = (wordPathBb.x2 - wordPathBb.x1) * scaling.x;
                                var wordArea = Math.sqrt(wordH * wordW);
                                return wordArea;
                            }
                            return 0;
                        });
                        maxArea = lodash_1.max(itemAreas);
                        minArea = lodash_1.min(itemAreas);
                        rng = seedrandom_1["default"]('fill color');
                        dimSmallerFactor = coloring.dimSmallerItems / 100;
                        if (!((!shapeRaster || !shapeRasterImgData) && this.fabricObjects.shape)) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (r) {
                                return _this.fabricObjects.shape.cloneAsImage(function (copy) { return r(copy); });
                            })];
                    case 1:
                        shapeRaster = _e.sent();
                        _e.label = 2;
                    case 2:
                        _loop_1 = function (i) {
                            var item = items[i];
                            var area = itemAreas[i];
                            if (item.kind !== 'word' && item.kind !== 'symbol') {
                                return "continue";
                            }
                            if (coloring.kind === 'gradient' || coloring.kind === 'single-color') {
                                var index = Math.floor(rng() * colors.length);
                                item.setColor(colors[index]);
                            }
                            else if (coloring.shapeStyleFill) {
                                if (coloring.shapeStyleFill.kind === 'single-color') {
                                    var shapeColor = new paper_1["default"].Color(coloring.shapeStyleFill.color);
                                    var color = chroma_js_1["default"].rgb(255 * shapeColor.red, 255 * shapeColor.green, 255 * shapeColor.blue);
                                    if (coloring.shapeBrightness != 0) {
                                        color = color.brighten(coloring.shapeBrightness / 100);
                                    }
                                    var hex = color.hex();
                                    item.setColor(hex);
                                }
                                else if (coloring.shapeStyleFill.kind === 'color-map') {
                                    if (((_a = this_1.shape) === null || _a === void 0 ? void 0 : _a.kind) === 'svg') {
                                        var colorMapSorted = lodash_1.sortBy(coloring.shapeStyleFill.defaultColorMap.map(function (color, index) { return ({
                                            color: color,
                                            index: index
                                        }); }), function (_a) {
                                            var color = _a.color;
                                            return chroma_js_1["default"].distance(color, item.shapeColor, 'rgb');
                                        });
                                        var shapeColorStringIndex = colorMapSorted[0].index;
                                        var shapeColorString = coloring.shapeStyleFill.colorMap[shapeColorStringIndex];
                                        var shapeColor = new paper_1["default"].Color(shapeColorString);
                                        var color = chroma_js_1["default"].rgb(255 * shapeColor.red, 255 * shapeColor.green, 255 * shapeColor.blue);
                                        if (coloring.shapeBrightness != 0) {
                                            color = color.brighten(coloring.shapeBrightness / 100);
                                        }
                                        var hex = color.hex();
                                        item.setColor(hex);
                                    }
                                    else if (((_b = this_1.shape) === null || _b === void 0 ? void 0 : _b.kind) === 'raster') {
                                        var color = chroma_js_1["default"](item.shapeColor);
                                        if (coloring.shapeBrightness != 0) {
                                            color = color.brighten(coloring.shapeBrightness / 100);
                                        }
                                        item.setColor(color.hex());
                                    }
                                }
                                else if (coloring.shapeStyleFill.kind === 'original') {
                                    var shape = (_c = this_1.shape) === null || _c === void 0 ? void 0 : _c.shapeConfig;
                                    var colorString = item.shapeColor;
                                    if ((shape === null || shape === void 0 ? void 0 : shape.kind) === 'raster' && ((_d = shape === null || shape === void 0 ? void 0 : shape.processing) === null || _d === void 0 ? void 0 : _d.invert.enabled)) {
                                        colorString = shape.processing.invert.color;
                                    }
                                    var color = chroma_js_1["default"](colorString);
                                    if (coloring.shapeBrightness != 0) {
                                        color = color.brighten(coloring.shapeBrightness / 100);
                                    }
                                    item.setColor(color.hex());
                                }
                                else {
                                    type_utils_1.exhaustiveCheck(coloring.shapeStyleFill.kind);
                                }
                            }
                            item.setOpacity((dimSmallerFactor * (area - minArea)) / (maxArea - minArea) +
                                (1 - dimSmallerFactor));
                        };
                        this_1 = this;
                        for (i = 0; i < items.length; ++i) {
                            _loop_1(i);
                        }
                        this.canvas.requestRenderAll();
                        return [2 /*return*/];
                }
            });
        }); };
        /** Sets the shape, clearing the project */
        this.setShape = function (params) { return __awaiter(_this, void 0, void 0, function () {
            var shapeConfig, shapeColors, bgColors, colorsMap, shapeObj, Shape, originalCanvas, processedCanvas, font, group, w, h, defaultPadding, sceneBounds, scale, shapeCopy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('setShape', params);
                        shapeConfig = params.shapeConfig, shapeColors = params.shapeColors, bgColors = params.bgColors;
                        if (!shapeConfig) {
                            throw new Error('Missing shape config');
                        }
                        this.logger.debug('setShape', mobx_1.toJS(params, { recurseEverything: true }));
                        if (!(shapeConfig.kind === 'svg')) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve) {
                                return fabric_1.fabric.loadSVGFromURL(shapeConfig.url, function (objects, options) {
                                    var obj = fabric_1.fabric.util.groupSVGElements(objects, options);
                                    resolve(obj);
                                });
                            })];
                    case 1:
                        shapeObj = _a.sent();
                        colorsMap = colormap_1.computeColorsMap(shapeObj);
                        Shape = {
                            kind: 'svg',
                            colorsMap: colorsMap,
                            shapeConfig: shapeConfig
                        };
                        return [3 /*break*/, 6];
                    case 2:
                        if (!(shapeConfig.kind === 'raster')) return [3 /*break*/, 4];
                        return [4 /*yield*/, new Promise(function (resolve) {
                                return fabric_1.fabric.Image.fromURL(shapeConfig.url, function (oImg) {
                                    resolve(oImg);
                                });
                            })];
                    case 3:
                        shapeObj = _a.sent();
                        originalCanvas = shapeObj.toCanvasElement();
                        processedCanvas = shapeObj.toCanvasElement();
                        if (shapeConfig.processing) {
                            processImg(processedCanvas, shapeConfig.processing);
                        }
                        shapeObj = new fabric_1.fabric.Image(canvas_utils_1.canvasToImgElement(processedCanvas));
                        Shape = {
                            kind: 'raster',
                            shapeConfig: shapeConfig,
                            originalCanvas: originalCanvas,
                            processedCanvas: processedCanvas
                        };
                        return [3 /*break*/, 6];
                    case 4:
                        if (!(shapeConfig.kind === 'text')) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.store.fetchFontById(shapeConfig.fontId)];
                    case 5:
                        font = _a.sent();
                        group = fabric_utils_1.createMultilineFabricTextGroup(shapeConfig.text, font, 100, shapeConfig.color);
                        group.setPositionByOrigin(new fabric_1.fabric.Point(this.canvas.getWidth() / 2, this.canvas.getHeight() / 2), 'center', 'center');
                        shapeObj = group;
                        Shape = {
                            kind: 'text',
                            shapeConfig: shapeConfig
                        };
                        _a.label = 6;
                    case 6:
                        if (!shapeObj) {
                            throw new Error('no shape obj');
                        }
                        w = shapeObj.width;
                        h = shapeObj.height;
                        defaultPadding = 50;
                        sceneBounds = this.getSceneBounds(defaultPadding);
                        if (Math.max(w, h) !== Math.max(sceneBounds.width, sceneBounds.height)) {
                            scale = w / h > sceneBounds.width / sceneBounds.height
                                ? sceneBounds.width / w
                                : sceneBounds.height / h;
                            shapeObj.set({ scaleX: scale, scaleY: scale });
                        }
                        if (params.clear) {
                            this.clear();
                        }
                        this.setBgColor(bgColors);
                        shapeObj.setPositionByOrigin(new fabric_1.fabric.Point(defaultPadding + sceneBounds.width / 2, defaultPadding + sceneBounds.height / 2), 'center', 'center');
                        return [4 /*yield*/, new Promise(function (r) {
                                return shapeObj.clone(function (copy) { return r(copy); }, ['id']);
                            })];
                    case 7:
                        shapeCopy = _a.sent();
                        shapeCopy.set({
                            selectable: false
                        });
                        shapeObj.set({
                            opacity: shapeColors.opacity,
                            selectable: false
                        });
                        if (this.fabricObjects.shape) {
                            this.canvas.remove(this.fabricObjects.shape);
                        }
                        this.canvas.add(shapeObj);
                        this.setShapeObj(shapeObj);
                        this.fabricObjects.shapeOriginalColors = shapeCopy;
                        this.shape = Shape;
                        if (shapeConfig.kind === 'raster') {
                            shapeColors.kind = 'original';
                        }
                        else if (colorsMap) {
                            shapeColors.colorMap = colorsMap === null || colorsMap === void 0 ? void 0 : colorsMap.colors.map(function (c) { return c.color; });
                            shapeColors.defaultColorMap = colorsMap === null || colorsMap === void 0 ? void 0 : colorsMap.colors.map(function (c) { return c.color; });
                            shapeColors.kind = 'color-map';
                            console.log('setting default color map', shapeColors, colorsMap);
                        }
                        return [4 /*yield*/, this.setShapeFillColors(shapeColors)];
                    case 8:
                        _a.sent();
                        this.canvas.requestRenderAll();
                        return [2 /*return*/, { colorsMap: colorsMap }];
                }
            });
        }); };
        this.getSceneBounds = function (pad) {
            if (pad === void 0) { pad = 20; }
            return new paper_1["default"].Rectangle({
                x: pad,
                y: pad,
                width: _this.projectBounds.width - pad * 2,
                height: _this.projectBounds.height - pad * 2
            });
        };
        this.setBgItems = function (items) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); };
        /** Returns list of items in paint order (order: bottom to front) */
        this.getItemsSorted = function (target) {
            var fabricObjToItem = target === 'shape'
                ? _this.items.shape.fabricObjToItem
                : _this.items.bg.fabricObjToItem;
            var objsSet = new Set(fabricObjToItem.keys());
            var objs = _this.canvas.getObjects().filter(function (obj) { return objsSet.has(obj); });
            var items = objs.map(function (obj) { return fabricObjToItem.get(obj); });
            return items;
        };
        this.setShapeItems = function (itemConfigs) { return __awaiter(_this, void 0, void 0, function () {
            var _a, items, itemsById, fabricObjToItem, oldItemsToDelete, oldItemsToKeep, _i, oldItemsToKeep_1, item, objs;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!this.fabricObjects.shape) {
                            console.error('No shape');
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.convertToEditorItems(itemConfigs)];
                    case 1:
                        _a = _d.sent(), items = _a.items, itemsById = _a.itemsById, fabricObjToItem = _a.fabricObjToItem;
                        oldItemsToDelete = __spreadArrays(this.items.shape.itemsById.values()).filter(function (item) { return !item.locked; });
                        oldItemsToKeep = __spreadArrays(this.items.shape.itemsById.values()).filter(function (item) { return item.locked; });
                        for (_i = 0, oldItemsToKeep_1 = oldItemsToKeep; _i < oldItemsToKeep_1.length; _i++) {
                            item = oldItemsToKeep_1[_i];
                            itemsById.set(item.id, item);
                            fabricObjToItem.set(item.fabricObj, item);
                        }
                        (_b = this.canvas).remove.apply(_b, lodash_1.flatten(oldItemsToDelete.map(function (item) { return __spreadArrays([
                            item.fabricObj
                        ], item.fabricObj.getObjects()); })));
                        objs = items.map(function (item) { return item.fabricObj; });
                        (_c = this.canvas).add.apply(_c, objs);
                        this.canvas.requestRenderAll();
                        this.items.shape = {
                            itemsById: itemsById,
                            fabricObjToItem: fabricObjToItem
                        };
                        return [2 /*return*/];
                }
            });
        }); };
        this.generateBgItems = function (params) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        }); };
        this.generateShapeItems = function (params) { return __awaiter(_this, void 0, void 0, function () {
            var style, coloring, shapeObj, shapeOriginalColorsObj, i, shapeClone, shapeImage, shapeCanvas, shapeCanvasOriginalColors, canvasSubtract, lockedItems, ctx, _i, lockedItems_1, item, saved, shapeRasterBounds, wordFonts, shapeConfig, result, wordConfigsById, items, _a, _b, genItem, wordConfig;
            var _this = this;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        style = params.style;
                        coloring = style.items.coloring;
                        this.logger.debug('generateShapeItems');
                        if (!((_c = this.shape) === null || _c === void 0 ? void 0 : _c.obj)) {
                            console.error('No shape obj');
                            return [2 /*return*/];
                        }
                        shapeObj = this.shape.obj;
                        shapeOriginalColorsObj = this.shape.kind === 'svg' ? this.shape.objOriginalColors : this.shape.obj;
                        if (!shapeOriginalColorsObj) {
                            console.error('No shapeOriginalColorsObj');
                            return [2 /*return*/];
                        }
                        this.store.isVisualizing = true;
                        i = 0;
                        _d.label = 1;
                    case 1:
                        if (!(i < 10)) return [3 /*break*/, 4];
                        return [4 /*yield*/, async_1.waitAnimationFrame()];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        ++i;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, this.generator.init()];
                    case 5:
                        _d.sent();
                        return [4 /*yield*/, fabric_utils_1.cloneObj(shapeObj)];
                    case 6:
                        shapeClone = _d.sent();
                        shapeClone.set({ opacity: 1 });
                        return [4 /*yield*/, fabric_utils_1.cloneObjAsImage(shapeClone)];
                    case 7:
                        shapeImage = _d.sent();
                        shapeCanvas = fabric_utils_1.objAsCanvasElement(shapeImage);
                        shapeCanvasOriginalColors = fabric_utils_1.objAsCanvasElement(shapeOriginalColorsObj);
                        lockedItems = this.getItemsSorted('shape').filter(function (i) { return i.locked; });
                        if (lockedItems.length > 0) {
                            canvasSubtract = canvas_utils_1.createCanvas({
                                w: shapeCanvas.width,
                                h: shapeCanvas.height
                            });
                            ctx = canvasSubtract.getContext('2d');
                            for (_i = 0, lockedItems_1 = lockedItems; _i < lockedItems_1.length; _i++) {
                                item = lockedItems_1[_i];
                                ctx.save();
                                ctx.translate(-shapeObj.getBoundingRect(true).left || 0, -shapeObj.getBoundingRect(true).top || 0);
                                saved = item.isShowingLockBorder;
                                item.setLockBorderVisibility(false);
                                item.fabricObj.drawObject(ctx);
                                item.setLockBorderVisibility(saved);
                                ctx.restore();
                            }
                        }
                        shapeRasterBounds = new paper_1["default"].Rectangle(shapeObj.getBoundingRect(true).left || 0, shapeObj.getBoundingRect(true).top || 0, shapeCanvas.width, shapeCanvas.height);
                        return [4 /*yield*/, this.fetchFonts(style.items.words.fontIds)];
                    case 8:
                        wordFonts = _d.sent();
                        shapeConfig = this.store.getSelectedShapeConf();
                        return [4 /*yield*/, this.generator.fillShape({
                                shape: {
                                    canvas: shapeCanvas,
                                    canvasSubtract: canvasSubtract,
                                    shapeCanvasOriginalColors: shapeCanvasOriginalColors,
                                    bounds: shapeRasterBounds,
                                    processing: {
                                        removeWhiteBg: {
                                            enabled: shapeConfig.kind === 'raster',
                                            lightnessThreshold: 98
                                        },
                                        shrink: {
                                            enabled: style.items.placement.shapePadding > 0,
                                            amount: style.items.placement.shapePadding
                                        },
                                        edges: {
                                            enabled: this.shape.kind === 'raster' || this.shape.kind === 'svg'
                                                ? this.shape.processing.edges != null
                                                : false,
                                            blur: 17 *
                                                (1 -
                                                    ((this.shape.kind === 'raster' ||
                                                        this.shape.kind === 'svg') &&
                                                        this.shape.processing.edges
                                                        ? this.shape.processing.edges.amount
                                                        : 0) /
                                                        100),
                                            lowThreshold: 30,
                                            highThreshold: 100
                                        },
                                        invert: {
                                            enabled: false
                                        }
                                    }
                                },
                                itemPadding: Math.max(1, 100 - style.items.placement.itemDensity),
                                // Words
                                wordsMaxSize: style.items.placement.wordsMaxSize,
                                words: style.items.words.wordList.map(function (wc) { return ({
                                    wordConfigId: wc.id,
                                    text: wc.text,
                                    angles: style.items.words.angles,
                                    fillColors: ['red'],
                                    // fonts: [fonts[0], fonts[1], fonts[2]],
                                    fonts: wordFonts
                                }); }),
                                // Icons
                                icons: style.items.icons.iconList.map(function (shape) { return ({
                                    shape: _this.store.getShapeById(shape.shapeId)
                                }); }),
                                iconsMaxSize: style.items.placement.iconsMaxSize,
                                iconProbability: style.items.placement.iconsProportion / 100
                            }, function (progressPercent) {
                                _this.store.visualizingProgress = progressPercent;
                            })];
                    case 9:
                        result = _d.sent();
                        wordConfigsById = lodash_1.keyBy(style.items.words.wordList, 'id');
                        items = [];
                        for (_a = 0, _b = result.generatedItems; _a < _b.length; _a++) {
                            genItem = _b[_a];
                            if (genItem.kind === 'word') {
                                wordConfig = wordConfigsById[genItem.wordConfigId];
                                items.push(__assign(__assign({}, genItem), { color: 'black', locked: false, text: wordConfig.text, customColor: wordConfig.color }));
                            }
                        }
                        return [4 /*yield*/, this.setShapeItems(items)];
                    case 10:
                        _d.sent();
                        return [4 /*yield*/, this.setShapeItemsColor(style.items.coloring)];
                    case 11:
                        _d.sent();
                        this.store.isVisualizing = false;
                        return [2 /*return*/];
                }
            });
        }); };
        this.clear = function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug('Editor: clear');
                this.canvas.clear();
                this.shape = null;
                this.items.bg.fabricObjToItem.clear();
                this.items.bg.itemsById.clear();
                this.items.shape.fabricObjToItem.clear();
                this.items.shape.itemsById.clear();
                return [2 /*return*/];
            });
        }); };
        this.clearItems = function (target) {
            var _a;
            if (target === 'shape') {
                var nonLockedItems = __spreadArrays(_this.items.shape.itemsById.values()).filter(function (item) { return !item.locked; });
                var fabricObjs = nonLockedItems.map(function (i) { return i.fabricObj; }).filter(not_empty_1.notEmpty);
                (_a = _this.canvas).remove.apply(_a, fabricObjs);
                fabricObjs.forEach(function (obj) { return _this.items.shape.fabricObjToItem["delete"](obj); });
                nonLockedItems.forEach(function (item) {
                    return _this.items.shape.itemsById["delete"](item.id);
                });
                _this.editorItemIdGen.removeIds(nonLockedItems.map(function (i) { return i.id; }));
                _this.editorItemIdGen.resetLen();
                _this.canvas.requestRenderAll();
            }
            else {
                // TODO
            }
        };
        this.destroy = function () {
            window.removeEventListener('resize', _this.handleResize);
        };
        this.selectShape = function () {
            _this.logger.debug('selectShape');
            if (!_this.shape) {
                return;
            }
            _this.shapeSelection = true;
            _this.shape.obj.selectable = true;
            _this.enableSelectionMode();
            _this.canvas.setActiveObject(_this.shape.obj);
            _this.canvas.requestRenderAll();
        };
        this.deselectShape = function () {
            _this.logger.debug('deselectShape');
            if (!_this.shape) {
                return;
            }
            _this.shapeSelection = false;
            _this.shape.obj.selectable = false;
            _this.deselectAll();
        };
        this.disableSelectionMode = function () {
            _this.canvas.skipTargetFind = true;
            _this.canvas.selection = false;
            _this.canvas.requestRenderAll();
        };
        this.enableSelectionMode = function () {
            _this.canvas.skipTargetFind = false;
            _this.canvas.selection = true;
            _this.canvas.requestRenderAll();
        };
        this.deselectAll = function () {
            _this.canvas.discardActiveObject();
            _this.canvas.requestRenderAll();
        };
        // TODO: optimize performance
        // TODO: rename to "convert to EditorItems"
        this.convertToEditorItems = function (itemConfigs) { return __awaiter(_this, void 0, void 0, function () {
            var items, itemsById, fabricObjToItem, allWordItems, wordItemsByFont, uniqFontIds, _i, allWordItems_1, itemConfig, fontInfo, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        items = [];
                        itemsById = new Map();
                        fabricObjToItem = new Map();
                        allWordItems = itemConfigs.filter(function (item) { return item.kind === 'word'; });
                        wordItemsByFont = lodash_1.groupBy(allWordItems, 'fontId');
                        uniqFontIds = Object.keys(wordItemsByFont);
                        return [4 /*yield*/, this.fetchFonts(uniqFontIds)
                            // Process all fonts...
                        ];
                    case 1:
                        _a.sent();
                        // Process all fonts...
                        for (_i = 0, allWordItems_1 = allWordItems; _i < allWordItems_1.length; _i++) {
                            itemConfig = allWordItems_1[_i];
                            fontInfo = this.fontsInfo.get(itemConfig.fontId);
                            item = new editor_item_1.EditorItemWord(this.editorItemIdGen.get(), this.canvas, itemConfig, fontInfo.font);
                            item.setSelectable(this.itemsSelection);
                            items.push(item);
                            itemsById.set(item.id, item);
                            fabricObjToItem.set(item.fabricObj, item);
                        }
                        return [2 /*return*/, {
                                items: items,
                                fabricObjToItem: fabricObjToItem,
                                itemsById: itemsById
                            }];
                }
            });
        }); };
        this.fetchFonts = function (fontIds) { return __awaiter(_this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(fontIds.map(function (fontId) { return __awaiter(_this, void 0, void 0, function () {
                        var style, font, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    if (this.fontsInfo.has(fontId)) {
                                        return [2 /*return*/, this.fontsInfo.get(fontId).font];
                                    }
                                    style = this.store.getFontById(fontId).style;
                                    _a = {};
                                    return [4 /*yield*/, fonts_1.loadFont(style.url)];
                                case 1:
                                    font = (_a.otFont = _b.sent(),
                                        _a.id = fontId,
                                        _a.isCustom = false,
                                        _a);
                                    this.fontsInfo.set(fontId, { font: font, glyphs: new Map() });
                                    return [2 /*return*/, font];
                            }
                        });
                    }); }))];
            });
        }); };
        this.params = params;
        this.store = params.store;
        this.generator = new generator_1.Generator();
        paper_1["default"].setup(new paper_1["default"].Size({ width: 1, height: 1 }));
        this.canvas = new fabric_1.fabric.Canvas(params.canvas.id);
        this.aspectRatio = this.params.aspectRatio;
        this.canvas.on('selection:created', function () {
            var target = _this.canvas.getActiveObject();
            var item = _this.items.shape.fabricObjToItem.get(target);
            if (item) {
                params.onItemSelected(item);
            }
        });
        this.canvas.on('selection:updated', function () {
            var target = _this.canvas.getActiveObject();
            var item = _this.items.shape.fabricObjToItem.get(target);
            if (item) {
                params.onItemSelected(item);
            }
        });
        this.canvas.on('selection:cleared', function () {
            params.onItemSelectionCleared();
        });
        this.canvas.on('object:moving', function (evt) {
            var _a;
            var target = evt.target;
            if (!target) {
                return;
            }
            if (target === ((_a = _this.shape) === null || _a === void 0 ? void 0 : _a.obj)) {
                _this.clearItems('shape');
                _this.clearItems('bg');
            }
        });
        this.canvas.on('object:rotating', function (evt) {
            var _a;
            var target = evt.target;
            if (!target) {
                return;
            }
            if (target === ((_a = _this.shape) === null || _a === void 0 ? void 0 : _a.obj)) {
                _this.clearItems('shape');
                _this.clearItems('bg');
            }
        });
        this.canvas.on('object:scaling', function (evt) {
            var _a;
            var target = evt.target;
            if (!target) {
                return;
            }
            if (target === ((_a = _this.shape) === null || _a === void 0 ? void 0 : _a.obj)) {
                _this.clearItems('shape');
                _this.clearItems('bg');
            }
        });
        this.canvas.on('object:modified', function (evt) {
            var _a;
            var target = evt.target;
            if (!target) {
                return;
            }
            if (target === ((_a = _this.shape) === null || _a === void 0 ? void 0 : _a.obj) &&
                _this.shape.kind === 'svg' &&
                _this.shape.objOriginalColors) {
                fabric_utils_1.applyTransformToObj(_this.shape.objOriginalColors, _this.shape.obj.calcTransformMatrix());
                _this.canvas.requestRenderAll();
            }
            else {
                var item = _this.items.shape.fabricObjToItem.get(target);
                if (item) {
                    item.setLocked(true);
                    params.onItemUpdated(item);
                }
            }
        });
        this.canvas.renderOnAddRemove = false;
        // @ts-ignore
        window['canvas'] = this.canvas;
        this.projectBounds = new paper_1["default"].Rectangle({
            x: 0,
            y: 0,
            width: 1000,
            height: 1000 / this.aspectRatio
        });
        this.logger.debug("Editor: init, " + params.canvas.width + " x " + params.canvas.height);
        this.items = {
            shape: {
                itemsById: new Map(),
                fabricObjToItem: new Map()
            },
            bg: {
                itemsById: new Map(),
                fabricObjToItem: new Map()
            }
        };
        window.addEventListener('resize', this.handleResize);
        this.handleResize();
    }
    return Editor;
}());
exports.Editor = Editor;
