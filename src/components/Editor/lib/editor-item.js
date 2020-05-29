"use strict";
exports.__esModule = true;
var fabric_impl_1 = require("fabric/fabric-impl");
var fabric_utils_1 = require("components/Editor/lib/fabric-utils");
var EditorItemWord = /** @class */ (function () {
    function EditorItemWord(id, canvas, conf, font) {
        var _this = this;
        this.kind = 'word';
        this.defaultText = '';
        /** When was the item placed by the generation algorithm */
        this.placedIndex = -1;
        /** Transform produced by the generator algorithm */
        this.generatedTransform = new paper.Matrix();
        /** Current transform of the item */
        this.transform = new paper.Matrix();
        /** Is position locked? */
        this.locked = false;
        /** Color of the shape where the item was auto-placed */
        this.shapeColor = 'black';
        this.isShowingLockBorder = false;
        this.setSelectable = function (value) {
            _this.fabricObj.selectable = value;
        };
        this._updateColor = function (color) {
            _this.fabricObj.cornerColor = color;
            _this.fabricObj.cornerStyle = 'circle';
            _this.fabricObj.transparentCorners = false;
            _this.fabricObj.borderColor = color;
            _this.wordObj.set({ fill: color });
            _this.lockBorder.set({ stroke: color });
        };
        this._updateOpacity = function (opacity) {
            _this.fabricObj.opacity = opacity;
        };
        this.setColor = function (color) {
            _this.color = color;
            _this._updateColor(_this.customColor || _this.color);
        };
        this.setOpacity = function (opacity) {
            _this._updateOpacity(opacity);
        };
        this.setCustomColor = function (color) {
            _this.customColor = color;
            _this._updateColor(_this.customColor);
        };
        this.clearCustomColor = function () {
            _this.customColor = undefined;
            _this._updateColor(_this.color);
        };
        this.setLockBorderVisibility = function (value) {
            _this.isShowingLockBorder = value;
            _this.lockBorder.set({
                opacity: _this.locked && value ? 1 : 0
            });
        };
        this.setLocked = function (value) {
            _this.locked = value;
            _this.lockBorder.set({ opacity: value && _this.isShowingLockBorder ? 1 : 0 });
        };
        this.id = id;
        this.canvas = canvas;
        this.font = font;
        var wordPath = font.otFont.getPath(conf.text, 0, 0, 100);
        var pathBounds = wordPath.getBoundingBox();
        var pw = pathBounds.x2 - pathBounds.x1;
        var ph = pathBounds.y2 - pathBounds.y1;
        var pad = 0;
        var wordGroup = new fabric_impl_1["default"].Group([
            new fabric_impl_1["default"].Rect().set({
                originX: 'center',
                originY: 'center',
                left: pathBounds.x1,
                top: pathBounds.y1,
                width: pw + 2 * pad,
                height: ph + 2 * pad,
                strokeWidth: 1,
                stroke: 'black',
                fill: 'rgba(255,255,255,0.3)',
                opacity: 0
            }),
            new fabric_impl_1["default"].Path(wordPath.toPathData(3)).set({
                originX: 'center',
                originY: 'center'
            }),
        ]);
        this.customColor = conf.customColor;
        this.color = conf.color || 'black';
        this.fabricObj = wordGroup;
        this.wordObj = wordGroup.item(1);
        this.lockBorder = wordGroup.item(0);
        this.wordObj.set({ fill: this.color });
        this.transform = conf.transform;
        this.generatedTransform = conf.transform;
        this.defaultText = conf.text;
        this.shapeColor = conf.shapeColor;
        this.path = wordPath;
        this.pathBounds = pathBounds;
        this.placedIndex = conf.index;
        this.wordConfigId = conf.wordConfigId;
        this.setLocked(conf.locked);
        wordGroup.on('modified', function () {
            _this.transform = new paper.Matrix(wordGroup.calcOwnMatrix());
        });
        wordGroup.on('selected', function () {
            _this.fabricObj.bringToFront();
            _this.canvas.requestRenderAll();
        });
        this._updateColor(this.customColor || this.color);
        fabric_utils_1.applyTransformToObj(wordGroup, conf.transform.values);
    }
    return EditorItemWord;
}());
exports.EditorItemWord = EditorItemWord;
