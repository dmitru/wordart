"use strict";
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
var canvas_utils_1 = require("lib/wordart/canvas-utils");
var image_processor_wasm_1 = require("lib/wordart/wasm/image-processor-wasm");
var wasm_module_1 = require("lib/wordart/wasm/wasm-module");
var lodash_1 = require("lodash");
var paper_1 = require("paper");
var console_logger_1 = require("utils/console-logger");
var FONT_SIZE = 100;
var Generator = /** @class */ (function () {
    function Generator() {
        var _this = this;
        this.logger = console_logger_1.consoleLoggers.generator;
        this.words = new Map();
        this.wordPaths = new Map();
        this.init = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, wasm_module_1.getWasmModule()];
                    case 1:
                        _a.wasm = _b.sent();
                        return [2 /*return*/];
                }
            });
        }); };
        this.items = [];
        this.clear = function () {
            _this.items = [];
        };
        this.fillShape = function (task, onProgressCallback) {
            if (onProgressCallback === void 0) { onProgressCallback = lodash_1.noop; }
            return __awaiter(_this, void 0, void 0, function () {
                var shapeCanvasMaxExtent, shapeCanvas, shapeCanvasOriginalColors, shapeCanvasScale, shapeCanvasDimensions, unrotatedCtx, unrotatedCtxOriginalColors, edgesCanvas, unrotatedCtxOriginalShape, unrotatedCtxOriginalColorsImgData, imageProcessor, icons, iconSymbolDefs, iconRasterCanvases, iconsBounds, words, wordPaths, wordPathsBounds, placedWordItems, placedSymbolItems, nIter, t1, wordAngles, hasWords, hasIcons, iconProbability, rotationInfos, computeRotationInfo, wordIndex, iconIndex, mostLargestRect, tLastNotified, _loop_1, i, state_1, t2;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.wasm) {
                                throw new Error('call init() first');
                            }
                            this.logger.debug('Generator: generate', task);
                            shapeCanvasMaxExtent = 280;
                            shapeCanvas = task.shape.canvas;
                            shapeCanvasOriginalColors = task.shape.shapeCanvasOriginalColors;
                            console.screenshot(shapeCanvas, 0.3);
                            shapeCanvasScale = shapeCanvasMaxExtent / Math.max(shapeCanvas.width, shapeCanvas.height);
                            shapeCanvasDimensions = {
                                w: Math.floor(shapeCanvasScale * shapeCanvas.width),
                                h: Math.floor(shapeCanvasScale * shapeCanvas.height)
                            };
                            unrotatedCtx = canvas_utils_1.createCanvasCtx(shapeCanvasDimensions);
                            unrotatedCtxOriginalColors = canvas_utils_1.createCanvasCtx(shapeCanvasDimensions);
                            unrotatedCtx.drawImage(shapeCanvas, 0, 0, shapeCanvas.width, shapeCanvas.height, 1, 1, unrotatedCtx.canvas.width - 2, unrotatedCtx.canvas.height - 2);
                            unrotatedCtxOriginalColors.drawImage(shapeCanvasOriginalColors, 0, 0, shapeCanvasOriginalColors.width, shapeCanvasOriginalColors.height, 1, 1, unrotatedCtx.canvas.width - 2, unrotatedCtx.canvas.height - 2);
                            if (task.shape.processing.removeWhiteBg.enabled) {
                                canvas_utils_1.removeLightPixels(unrotatedCtx.canvas, task.shape.processing.removeWhiteBg.lightnessThreshold / 100);
                            }
                            if (task.shape.processing.edges.enabled &&
                                !task.shape.processing.invert.enabled) {
                                edgesCanvas = canvas_utils_1.detectEdges(unrotatedCtxOriginalColors.canvas, (task.shape.processing.edges.blur * shapeCanvasMaxExtent) / 300, task.shape.processing.edges.lowThreshold, task.shape.processing.edges.highThreshold);
                            }
                            canvas_utils_1.clampPixelOpacityUp(unrotatedCtx.canvas);
                            canvas_utils_1.clampPixelOpacityUp(unrotatedCtxOriginalColors.canvas);
                            if (task.shape.processing.invert.enabled) {
                                canvas_utils_1.invertImageMask(unrotatedCtx.canvas);
                                // Remove a 1px border around the shape to make largest-rect algorithm work correctly
                                unrotatedCtx.save();
                                unrotatedCtx.globalCompositeOperation = 'destination-out';
                                unrotatedCtx.lineWidth = 1;
                                unrotatedCtx.strokeRect(0, 0, unrotatedCtx.canvas.width, unrotatedCtx.canvas.height);
                                unrotatedCtx.restore();
                            }
                            if (task.shape.processing.shrink.enabled) {
                                canvas_utils_1.shrinkShape(unrotatedCtx.canvas, (task.shape.processing.shrink.amount / 100) *
                                    5 *
                                    (shapeCanvasMaxExtent / 100));
                            }
                            unrotatedCtxOriginalShape = canvas_utils_1.createCanvasCtxCopy(unrotatedCtx);
                            canvas_utils_1.copyCanvas(unrotatedCtxOriginalColors, unrotatedCtxOriginalShape);
                            unrotatedCtxOriginalColorsImgData = new Uint8ClampedArray(unrotatedCtxOriginalShape.getImageData(0, 0, unrotatedCtxOriginalShape.canvas.width, unrotatedCtxOriginalShape.canvas.height).data.buffer);
                            if (edgesCanvas) {
                                unrotatedCtx.save();
                                unrotatedCtx.globalCompositeOperation = 'destination-out';
                                unrotatedCtx.drawImage(edgesCanvas, 0, 0);
                                unrotatedCtx.restore();
                            }
                            if (task.shape.canvasSubtract) {
                                unrotatedCtx.save();
                                unrotatedCtx.globalCompositeOperation = 'destination-out';
                                unrotatedCtx.shadowBlur =
                                    0.25 + (task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6;
                                unrotatedCtx.shadowColor = 'black';
                                unrotatedCtx.drawImage(task.shape.canvasSubtract, 0, 0, task.shape.canvasSubtract.width, task.shape.canvasSubtract.height, 0, 0, unrotatedCtx.canvas.width, unrotatedCtx.canvas.height);
                                unrotatedCtx.restore();
                            }
                            imageProcessor = new image_processor_wasm_1.ImageProcessorWasm(this.wasm);
                            icons = task.icons;
                            iconSymbolDefs = [];
                            iconRasterCanvases = [];
                            iconsBounds = [];
                            return [4 /*yield*/, Promise.all(icons.map(function (icon) { return __awaiter(_this, void 0, void 0, function () {
                                    var shapeItemGroup, iconSymDef, raster, rasterCanvas, iconBounds;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                                    return new paper_1["default"].Item().importSVG(icon.shape.url, function (item) {
                                                        return resolve(item);
                                                    });
                                                })];
                                            case 1:
                                                shapeItemGroup = _a.sent();
                                                shapeItemGroup.fillColor = new paper_1["default"].Color('black');
                                                shapeItemGroup.strokeColor = new paper_1["default"].Color('black');
                                                shapeItemGroup.scale(shapeCanvasMaxExtent /
                                                    Math.max(shapeItemGroup.bounds.width, shapeItemGroup.bounds.height) /
                                                    2);
                                                iconSymDef = new paper_1["default"].SymbolDefinition(shapeItemGroup);
                                                iconSymbolDefs.push(iconSymDef);
                                                raster = iconSymDef.item.rasterize(40, false);
                                                rasterCanvas = raster.getSubCanvas(new paper_1["default"].Rectangle(0, 0, raster.width, raster.height));
                                                iconRasterCanvases.push(rasterCanvas);
                                                iconBounds = iconSymDef.item.bounds;
                                                iconsBounds.push({
                                                    x: Math.round(iconBounds.left),
                                                    y: Math.round(iconBounds.top),
                                                    h: Math.round(iconBounds.height),
                                                    w: Math.round(iconBounds.width)
                                                });
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }))];
                        case 1:
                            _a.sent();
                            words = lodash_1.flatten(task.words.map(function (word) {
                                return word.fonts.map(function (font) {
                                    return new WordInfo(font.id + "-" + word.text, word.wordConfigId, word.text, font);
                                });
                            }));
                            wordPaths = words.map(function (word) {
                                return word.font.otFont.getPath(word.text, 0, 0, 100);
                            });
                            wordPathsBounds = wordPaths.map(function (wordPath) {
                                return wordPath.getBoundingBox();
                            });
                            placedWordItems = [];
                            placedSymbolItems = [];
                            nIter = 600;
                            t1 = performance.now();
                            wordAngles = lodash_1.uniq(lodash_1.flatten(task.words.map(function (w) { return w.angles; })));
                            hasWords = task.words.length > 0;
                            hasIcons = task.icons.length > 0;
                            iconProbability = task.iconProbability;
                            if (hasWords && hasIcons) {
                                iconProbability = task.iconProbability;
                            }
                            else if (hasWords) {
                                iconProbability = 0;
                            }
                            else if (hasIcons) {
                                iconProbability = 1;
                            }
                            rotationInfos = new Map();
                            computeRotationInfo = function (angle) {
                                var bounds = new paper_1["default"].Path.Rectangle(new paper_1["default"].Rectangle(0, 0, shapeCanvasDimensions.w, shapeCanvasDimensions.h));
                                var rotatedBounds = bounds.clone();
                                rotatedBounds.rotate(angle, new paper_1["default"].Point(0, 0));
                                var rotatedBoundsAabb = rotatedBounds.bounds;
                                var rotatedBoundsScaleX1 = shapeCanvasMaxExtent / rotatedBoundsAabb.width;
                                var rotatedBoundsScaleY1 = shapeCanvasMaxExtent / rotatedBoundsAabb.height;
                                var rotatedBoundsScaleX = Math.max(rotatedBoundsScaleX1, rotatedBoundsScaleY1);
                                var rotatedBoundsScaleY = Math.max(rotatedBoundsScaleX1, rotatedBoundsScaleY1);
                                var rotatedCanvasDimensions = {
                                    w: Math.round(rotatedBoundsAabb.width * rotatedBoundsScaleX),
                                    h: Math.round(rotatedBoundsAabb.height * rotatedBoundsScaleY)
                                };
                                var rotatedBoundsTransform = new paper_1["default"].Matrix()
                                    // .translate(rotatedBoundsAabb.center)
                                    .rotate(-angle, new paper_1["default"].Point(0, 0))
                                    // .translate(rotatedBoundsAabb.center.multiply(-1))
                                    .translate(rotatedBoundsAabb.topLeft)
                                    .scale(1 / (rotatedCanvasDimensions.w / rotatedBoundsAabb.width), 1 / (rotatedCanvasDimensions.h / rotatedBoundsAabb.height), new paper_1["default"].Point(0, 0));
                                // .scale(rotatedBoundsScale, rotatedBoundsScale)
                                var rotatedBoundsTransformInverted = rotatedBoundsTransform.inverted();
                                var rotatedCtx = canvas_utils_1.createCanvasCtx(rotatedCanvasDimensions);
                                return {
                                    ctx: rotatedCtx,
                                    rotatedCanvasDimensions: rotatedCanvasDimensions,
                                    rotatedBounds: rotatedBounds,
                                    transform: rotatedBoundsTransform,
                                    inverseTransform: rotatedBoundsTransformInverted
                                };
                            };
                            wordAngles.forEach(function (angle) {
                                return rotationInfos.set(angle, computeRotationInfo(angle));
                            });
                            if (hasIcons && !rotationInfos.has(0)) {
                                rotationInfos.set(0, computeRotationInfo(0));
                            }
                            unrotatedCtx.fillStyle = 'black';
                            unrotatedCtx.globalCompositeOperation = 'destination-out';
                            wordIndex = 0;
                            iconIndex = 0;
                            tLastNotified = performance.now();
                            _loop_1 = function (i) {
                                var type = 'word';
                                if (hasWords && hasIcons) {
                                    type = Math.random() < task.iconProbability ? 'icon' : 'word';
                                }
                                else if (hasWords) {
                                    type = 'word';
                                }
                                else if (hasIcons) {
                                    type = 'icon';
                                }
                                else {
                                    return "break";
                                }
                                if (type === 'word') {
                                    var word_1 = words[wordIndex];
                                    var wordConfig = task.words.find(function (wc) { return wc.wordConfigId === word_1.wordConfigId; });
                                    var angle = lodash_1.sample(wordConfig.angles);
                                    var rotationInfo = rotationInfos.get(angle);
                                    if (!rotationInfo) {
                                        throw new Error("rotation info is missing for angle " + angle);
                                    }
                                    var rotatedCtx = rotationInfo.ctx, rotatedCanvasDimensions = rotationInfo.rotatedCanvasDimensions, rotatedBoundsTransform = rotationInfo.transform, rotatedBoundsTransformInverted = rotationInfo.inverseTransform;
                                    if (wordAngles.length === 1 && wordAngles[0] === 0) {
                                        // Optimize for case of just 1 angle
                                        rotatedCtx = unrotatedCtx;
                                        rotatedBoundsTransform = new paper_1["default"].Matrix();
                                        rotatedBoundsTransformInverted = new paper_1["default"].Matrix();
                                    }
                                    else {
                                        rotatedCtx = rotationInfo.ctx;
                                        canvas_utils_1.clearCanvas(rotatedCtx);
                                        rotatedCtx.save();
                                        rotatedBoundsTransformInverted.applyToContext(rotatedCtx);
                                        rotatedCtx.drawImage(unrotatedCtx.canvas, 0, 0);
                                        rotatedCtx.restore();
                                    }
                                    // console.log('i = ', i, angle)
                                    var wordPathBounds = wordPathsBounds[wordIndex];
                                    var wordPath = wordPaths[wordIndex];
                                    // let scale = 1 - (0.5 * i) / nIter
                                    var scale = 1;
                                    // rotatedCtx.fillStyle = '#f002'
                                    // rotatedCtx.fillRect(
                                    //   0,
                                    //   0,
                                    //   rotatedCtx.canvas.width,
                                    //   rotatedCtx.canvas.height
                                    // )
                                    // console.log(rotatedCanvasDimensions)
                                    // console.screenshot(rotatedCtx.canvas)
                                    var rotatedImgData = rotatedCtx.getImageData(0, 0, rotatedCanvasDimensions.w, rotatedCanvasDimensions.h);
                                    var rotatedCanvasBounds = {
                                        x: 0,
                                        y: 0,
                                        w: rotatedCanvasDimensions.w,
                                        h: rotatedCanvasDimensions.h
                                    };
                                    var wordPathSize = {
                                        w: wordPathBounds.x2 - wordPathBounds.x1,
                                        h: wordPathBounds.y2 - wordPathBounds.y1
                                    };
                                    var wordAspect = wordPathSize.w / wordPathSize.h;
                                    var largestRectWasm = imageProcessor.findLargestRect(rotatedImgData, rotatedCanvasBounds, wordAspect);
                                    var largestRect = {
                                        x: largestRectWasm.x,
                                        y: largestRectWasm.y,
                                        w: largestRectWasm.w,
                                        h: largestRectWasm.h
                                    };
                                    if (!mostLargestRect) {
                                        mostLargestRect = largestRect;
                                    }
                                    // const [largestRect] = getLargestRect(
                                    //   scratchImgData,
                                    //   scratchCanvasBounds,
                                    //   wordAspect
                                    // )
                                    // console.log('largestRect ', largestRect)
                                    // shapeCtx.fillRect(...spreadRect(largestRect))
                                    if (largestRect.w < 1 || largestRect.h < 1) {
                                        return "break";
                                    }
                                    var pathScale = scale *
                                        Math.min(largestRect.w / wordPathSize.w, largestRect.h / wordPathSize.h);
                                    var maxMaxDim = (task.wordsMaxSize / 100) *
                                        Math.max(mostLargestRect.w, mostLargestRect.h);
                                    var maxDim = Math.max(wordPathSize.w, wordPathSize.h) * pathScale;
                                    if (maxDim > maxMaxDim) {
                                        pathScale *= maxMaxDim / maxDim;
                                    }
                                    unrotatedCtx.save();
                                    rotatedBoundsTransform.applyToContext(unrotatedCtx);
                                    unrotatedCtx.shadowBlur =
                                        0.25 + (task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6;
                                    unrotatedCtx.shadowColor = 'red';
                                    if (pathScale * Math.min(largestRect.w, largestRect.h) >=
                                        0.05 * (shapeCanvasMaxExtent / 360)) {
                                        var dx = Math.max(largestRect.w - pathScale * wordPathSize.w, 0);
                                        var dy = Math.max(largestRect.h - pathScale * wordPathSize.h, 0);
                                        var tx = largestRect.x - pathScale * wordPathBounds.x1 + Math.random() * dx;
                                        var ty = largestRect.y +
                                            largestRect.h -
                                            pathScale * wordPathBounds.y2 -
                                            Math.random() * dy;
                                        unrotatedCtx.translate(tx, ty);
                                        unrotatedCtx.scale(pathScale, pathScale);
                                        var wordCenterRotated = new paper_1["default"].Point(tx + (wordPathSize.w * pathScale) / 2, ty - (wordPathSize.h * pathScale) / 2);
                                        // TODO: perhaps the transform is off...
                                        var wordCenterUnrotated = rotatedBoundsTransform.transform(wordCenterRotated);
                                        var col = Math.round(wordCenterUnrotated.x);
                                        var row = Math.round(wordCenterUnrotated.y);
                                        var colorSamplePixelIndex = 4 * (unrotatedCtxOriginalShape.canvas.width * row + col);
                                        var r = unrotatedCtxOriginalColorsImgData[colorSamplePixelIndex + 0];
                                        var g = unrotatedCtxOriginalColorsImgData[colorSamplePixelIndex + 1];
                                        var b = unrotatedCtxOriginalColorsImgData[colorSamplePixelIndex + 2];
                                        var shapeColor = chroma_js_1["default"].rgb(r, g, b).hex();
                                        wordPath.draw(unrotatedCtx);
                                        placedWordItems.push({
                                            index: i,
                                            kind: 'word',
                                            shapeColor: shapeColor,
                                            fontId: word_1.font.id,
                                            text: word_1.text,
                                            wordConfigId: word_1.wordConfigId,
                                            // Transform to the center of the placed item
                                            transform: new paper_1["default"].Matrix()
                                                .translate(task.shape.bounds.left, task.shape.bounds.top)
                                                .scale(task.shape.bounds.width / shapeCanvasDimensions.w, task.shape.bounds.height / shapeCanvasDimensions.h)
                                                .append(rotatedBoundsTransform)
                                                .translate(tx, ty)
                                                .scale(pathScale)
                                                .translate(wordPathBounds.x1 + 0.5 * wordPathSize.w, wordPathBounds.y1 + wordPathSize.h * 0.5)
                                        });
                                    }
                                    else {
                                        unrotatedCtx.fillRect(largestRect.x, largestRect.y, Math.max(1.2, largestRect.w), Math.max(1.2, largestRect.h));
                                    }
                                    unrotatedCtx.restore();
                                    // console.screenshot(shapeCtx.canvas)
                                    wordIndex = (wordIndex + 1) % words.length;
                                }
                                else {
                                    var icon = icons[iconIndex];
                                    var iconSymDef = iconSymbolDefs[iconIndex];
                                    var rasterCanvas = iconRasterCanvases[iconIndex];
                                    var angle = 0;
                                    var rotationInfo = rotationInfos.get(angle);
                                    if (!rotationInfo) {
                                        throw new Error("rotation info is missing for angle " + angle);
                                    }
                                    var rotatedCtx = rotationInfo.ctx, rotatedCanvasDimensions = rotationInfo.rotatedCanvasDimensions, rotatedBoundsTransform = rotationInfo.transform, rotatedBoundsTransformInverted = rotationInfo.inverseTransform;
                                    // console.log('i = ', i, angle)
                                    if (angle === 0) {
                                        // Optimize for case of just 1 angle
                                        rotatedCtx = unrotatedCtx;
                                        rotatedBoundsTransform = new paper_1["default"].Matrix();
                                        rotatedBoundsTransformInverted = new paper_1["default"].Matrix();
                                    }
                                    else {
                                        rotatedCtx = rotationInfo.ctx;
                                        canvas_utils_1.clearCanvas(rotatedCtx);
                                        rotatedCtx.save();
                                        rotatedBoundsTransformInverted.applyToContext(rotatedCtx);
                                        rotatedCtx.drawImage(unrotatedCtx.canvas, 0, 0);
                                        rotatedCtx.restore();
                                    }
                                    // let scale = 1 - (0.5 * i) / nIter
                                    var scale = 1;
                                    // rotatedCtx.fillStyle = '#f002'
                                    // rotatedCtx.fillRect(
                                    //   0,
                                    //   0,
                                    //   rotatedCtx.canvas.width,
                                    //   rotatedCtx.canvas.height
                                    // )
                                    // console.log(rotatedCanvasDimensions)
                                    // console.screenshot(rotatedCtx.canvas)
                                    var rotatedImgData = rotatedCtx.getImageData(0, 0, rotatedCanvasDimensions.w, rotatedCanvasDimensions.h);
                                    var rotatedCanvasBounds = {
                                        x: 0,
                                        y: 0,
                                        w: rotatedCanvasDimensions.w,
                                        h: rotatedCanvasDimensions.h
                                    };
                                    var iconBounds = iconsBounds[iconIndex];
                                    var iconDims = {
                                        w: iconBounds.w,
                                        h: iconBounds.h
                                    };
                                    var aspect = iconDims.w / iconDims.h;
                                    var largestRectWasm = imageProcessor.findLargestRect(rotatedImgData, rotatedCanvasBounds, aspect);
                                    var largestRect = {
                                        x: largestRectWasm.x,
                                        y: largestRectWasm.y,
                                        w: largestRectWasm.w,
                                        h: largestRectWasm.h
                                    };
                                    if (!mostLargestRect) {
                                        mostLargestRect = largestRect;
                                    }
                                    // const [largestRect] = getLargestRect(
                                    //   scratchImgData,
                                    //   scratchCanvasBounds,
                                    //   wordAspect
                                    // )
                                    // console.log('largestRect ', largestRect)
                                    // shapeCtx.fillRect(...spreadRect(largestRect))
                                    if (largestRect.w < 1 || largestRect.h < 1) {
                                        return "break";
                                    }
                                    // let iconScale = 0.5
                                    var iconScale = scale *
                                        Math.min(largestRect.w / iconDims.w, largestRect.h / iconDims.h);
                                    var maxMaxDim = (task.iconsMaxSize / 100) *
                                        Math.max(mostLargestRect.w, mostLargestRect.h);
                                    var maxDim = Math.max(iconDims.w, iconDims.h) * iconScale;
                                    if (maxDim > maxMaxDim) {
                                        iconScale *= maxMaxDim / maxDim;
                                    }
                                    // shapeCtx.strokeStyle = '#f008'
                                    // shapeCtx.lineWidth = 2
                                    // shapeCtx.strokeRect(...spreadRect(largestRect))
                                    unrotatedCtx.save();
                                    rotatedBoundsTransform.applyToContext(unrotatedCtx);
                                    if (task.itemPadding > 0) {
                                        unrotatedCtx.shadowBlur =
                                            ((task.itemPadding / 100) * (shapeCanvasMaxExtent / 360) * 3.6) /
                                                iconScale;
                                        unrotatedCtx.shadowColor = 'red';
                                    }
                                    else {
                                        unrotatedCtx.shadowBlur = 0;
                                    }
                                    // console.log(
                                    //   'shapeCtx.shadowBlur',
                                    //   shapeCtx.shadowBlur,
                                    //   (task.itemPadding / 100) * (shapeCanvasMaxExtent / 100) * 1,
                                    //   iconScale
                                    // )
                                    if (iconScale * Math.min(largestRect.w, largestRect.h) >=
                                        0.05 * (shapeCanvasMaxExtent / 360)) {
                                        var dx = Math.max(largestRect.w - iconScale * iconDims.w, 0);
                                        var dy = Math.max(largestRect.h - iconScale * iconDims.h, 0);
                                        var tx = largestRect.x - iconScale * iconBounds.x + Math.random() * dx;
                                        var ty = largestRect.y +
                                            largestRect.h -
                                            iconScale * (iconBounds.y + iconBounds.h) -
                                            Math.random() * dy;
                                        unrotatedCtx.translate(tx, ty);
                                        unrotatedCtx.scale(iconScale, iconScale);
                                        // console.log('iconScale: ', iconScale)
                                        // console.log('rasterCanvas: ', rasterCanvas.width, rasterCanvas.height)
                                        // console.log(
                                        //   'iconBounds: ',
                                        //   iconBounds.x,
                                        //   iconBounds.y,
                                        //   iconBounds.w,
                                        //   iconBounds.h
                                        // )
                                        // console.log('---------------------')
                                        // shapeCtx.imageSmoothingEnabled = false
                                        unrotatedCtx.drawImage(rasterCanvas, 0, 0, rasterCanvas.width, rasterCanvas.height, iconBounds.x, iconBounds.y, 
                                        // rasterCanvas.width,
                                        // rasterCanvas.height
                                        iconBounds.w, iconBounds.h);
                                        placedSymbolItems.push({
                                            index: i,
                                            kind: 'symbol',
                                            shapeColor: 'black',
                                            symbolDef: iconSymDef,
                                            shapeId: icon.shape.id,
                                            transform: new paper_1["default"].Matrix()
                                                .translate(task.shape.bounds.left, task.shape.bounds.top)
                                                .scale(task.shape.bounds.width / shapeCanvasDimensions.w, task.shape.bounds.height / shapeCanvasDimensions.h)
                                                .append(rotatedBoundsTransform)
                                                .translate(tx, ty)
                                                .scale(iconScale)
                                        });
                                    }
                                    else {
                                        unrotatedCtx.fillRect(largestRect.x, largestRect.y, Math.max(1.2, largestRect.w), Math.max(1.2, largestRect.h));
                                    }
                                    unrotatedCtx.restore();
                                    // console.screenshot(shapeCtx.canvas)
                                    iconIndex = (iconIndex + 1) % icons.length;
                                }
                                if (i % 30) {
                                    var t2_1 = performance.now();
                                    if (t2_1 - t1 > 50) {
                                        tLastNotified = t2_1;
                                        // onProgressCallback(i / nIter)
                                        // await sleep(10)
                                    }
                                }
                            };
                            for (i = 0; i < nIter; ++i) {
                                state_1 = _loop_1(i);
                                if (state_1 === "break")
                                    break;
                            }
                            t2 = performance.now();
                            console.screenshot(unrotatedCtx.canvas, 1);
                            console.log("Placed " + placedWordItems.length + " words; Finished " + nIter + " iterations in " + ((t2 - t1) / 1000).toFixed(2) + " s, " + ((t2 - t1) / nIter).toFixed(3) + "ms / iter");
                            return [2 /*return*/, {
                                    generatedItems: __spreadArrays(placedWordItems, placedSymbolItems)
                                }];
                    }
                });
            });
        };
    }
    return Generator;
}());
exports.Generator = Generator;
// Perhaps it's not needed
var WordInfo = /** @class */ (function () {
    function WordInfo(id, wordConfigId, text, font, fontSize) {
        if (fontSize === void 0) { fontSize = FONT_SIZE; }
        this.id = id;
        this.wordConfigId = wordConfigId;
        this.font = font;
        this.text = text;
        this.fontSize = fontSize;
        // this.symbols = stringToSymbols(text, font, fontSize)
        // this.symbolOffsets = this.symbols.map(
        //   (symbol) =>
        //     (fontSize * symbol.glyph.advanceWidth) / this.font.otFont.unitsPerEm
        // )
    }
    return WordInfo;
}());
exports.WordInfo = WordInfo;
var Symbol = /** @class */ (function () {
    function Symbol(font, glyph, fontSize) {
        var _this = this;
        if (fontSize === void 0) { fontSize = FONT_SIZE; }
        this.getPathData = function () {
            return _this.glyph.getPath(0, 0, _this.fontSize).toPathData(3);
        };
        this.font = font;
        this.fontSize = fontSize;
        this.id = exports.getSymbolAngleId(glyph, font);
        this.glyph = glyph;
    }
    return Symbol;
}());
exports.Symbol = Symbol;
exports.getFontName = function (font) { return font.otFont.names.fullName.en; };
exports.getSymbolId = function (glyph, font) {
    // @ts-ignore
    return exports.getFontName(font) + "." + glyph.index;
};
exports.getSymbolAngleId = function (glyph, font, angle) {
    if (angle === void 0) { angle = 0; }
    // @ts-ignore
    return exports.getFontName(font) + "." + glyph.index + "." + angle;
};
exports.getWordAngleId = function (text, font, angle) {
    if (angle === void 0) { angle = 0; }
    // @ts-ignore
    return exports.getFontName(font) + "." + angle + "." + text;
};
exports.stringToSymbols = function (text, font, fontSize) {
    if (fontSize === void 0) { fontSize = FONT_SIZE; }
    return font.otFont
        .stringToGlyphs(text)
        .map(function (otGlyph) { return new Symbol(font, otGlyph, fontSize); });
};
