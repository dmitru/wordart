"use strict";
exports.__esModule = true;
var fabric_1 = require("fabric");
exports.applyTransformToObj = function (shape, transform) {
    var qr = fabric_1.fabric.util.qrDecompose(transform);
    shape.set({
        flipX: false,
        flipY: false,
        centeredRotation: true,
        originX: 'center',
        originY: 'center'
    });
    shape.set({ scaleX: qr.scaleX, scaleY: qr.scaleY });
    shape.setCoords();
    shape.set({
        angle: qr.angle
    });
    shape.setCoords();
    shape.set({
        left: qr.translateX,
        top: qr.translateY
    });
    shape.setCoords();
};
exports.cloneObj = function (obj) {
    return new Promise(function (r) { return obj.clone(function (obj) { return r(obj); }); });
};
exports.cloneObjAsImage = function (obj) {
    return new Promise(function (r) {
        return obj.cloneAsImage(function (obj) { return r(obj); });
    });
};
exports.objAsCanvasElement = function (obj) {
    return obj.toCanvasElement();
};
exports.createMultilineFabricTextGroup = function (text, font, fontSize, color) {
    if (fontSize === void 0) { fontSize = 100; }
    var lines = text.split('\n');
    var lineObjs = lines.map(function (line, index) {
        var path = font.getPath(line, 0, 0, fontSize);
        var pathData = path.toPathData(3);
        return new fabric_1.fabric.Path(pathData, {
            left: 0,
            top: index * fontSize,
            originX: 'center',
            originY: 'center',
            fill: color
        });
    });
    var group = new fabric_1.fabric.Group(lineObjs);
    return group;
};
