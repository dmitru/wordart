"use strict";
exports.__esModule = true;
var tm = require("transformation-matrix");
var paper_1 = require("paper");
var lodash_1 = require("lodash");
exports.matrixToPaperTransform = function (m) {
    return m ? new paper_1["default"].Matrix([m.a, m.b, m.c, m.d, m.e, m.f]) : new paper_1["default"].Matrix();
};
exports.hBoundsWasmToPaperGroup = function (hbounds, colors) {
    if (colors === void 0) { colors = {
        inside: 'red',
        outside: 'blue'
    }; }
    var group = new paper_1["default"].Group();
    var inside = colors.inside, outside = colors.outside;
    var impl = function (hbounds, transform, level) {
        if (transform === void 0) { transform = tm.identity(); }
        if (level === void 0) { level = 0; }
        if (level > 7) {
            return;
        }
        var bounds = hbounds.get_bounds();
        var boundsPath = new paper_1["default"].Path.Rectangle(new paper_1["default"].Rectangle(bounds.x, bounds.y, bounds.w, bounds.h)).addTo(group);
        var hboundsJs = hbounds.get_js();
        boundsPath.strokeColor = hboundsJs.overlaps_shape
            ? new paper_1["default"].Color(inside)
            : new paper_1["default"].Color(outside);
        boundsPath.transform(exports.matrixToPaperTransform(transform));
        // for (const child of hboundsJs.children) {
        //   const childTransform = tm.compose(
        //     transform,
        //     child.transform || tm.identity()
        //   )
        //   impl(child, childTransform, level + 1)
        // }
    };
    impl(hbounds, tm.identity());
    // console.log('impl / transform = ', hbounds.transform)
    group.transform(exports.matrixToPaperTransform(tm.identity()));
    return group;
};
exports.hBoundsWasmSerializedToPaperGroup = function (hbounds, colors) {
    if (colors === void 0) { colors = {
        inside: 'red',
        outside: 'blue'
    }; }
    var group = new paper_1["default"].Group();
    var inside = colors.inside, outside = colors.outside;
    var impl = function (hbounds, transform, level) {
        if (transform === void 0) { transform = tm.identity(); }
        if (level === void 0) { level = 0; }
        if (level > 0) {
            return;
        }
        var boundsPath = new paper_1["default"].Path.Rectangle(new paper_1["default"].Rectangle(hbounds.bounds.x, hbounds.bounds.y, hbounds.bounds.w, hbounds.bounds.h)).addTo(group);
        boundsPath.strokeColor = hbounds.overlaps_shape
            ? new paper_1["default"].Color(inside)
            : new paper_1["default"].Color(outside);
        boundsPath.transform(exports.matrixToPaperTransform(transform));
        for (var _i = 0, _a = hbounds.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var childTransform = tm.compose(transform, child.transform || tm.identity());
            impl(child, childTransform, level + 1);
        }
    };
    impl(hbounds, hbounds.transform || tm.identity());
    // console.log('impl / transform = ', hbounds.transform)
    // group.transform(matrixToPaperTransform(hbounds.transform))
    return group;
};
/** Recursively finds all fill colors used (ignoring pure black) */
exports.getFillColor = function (items, level, maxLevel) {
    if (level === void 0) { level = 0; }
    if (maxLevel === void 0) { maxLevel = 6; }
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (item.fillColor) {
            return item.fillColor;
        }
        if (item.children && level < maxLevel) {
            var color = exports.getFillColor(item.children, level + 1);
            if (color && color.red * color.green * color.blue > 0) {
                return color;
            }
        }
    }
    return undefined;
};
/** Recursively finds all stroke colors used */
exports.getStrokeColor = function (items, level, maxLevel) {
    if (level === void 0) { level = 0; }
    if (maxLevel === void 0) { maxLevel = 6; }
    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
        var item = items_2[_i];
        if (item.strokeColor) {
            return item.strokeColor;
        }
        if (item.children && level < maxLevel) {
            var color = exports.getStrokeColor(item.children, level + 1);
            if (color) {
                return color;
            }
        }
    }
    return undefined;
};
/** Find all children Items with IDs */
exports.findNamedChildren = function (item, level, maxLevel) {
    if (level === void 0) { level = 0; }
    if (maxLevel === void 0) { maxLevel = 6; }
    var namedChildren = item._namedChildren;
    if (namedChildren && Object.keys(namedChildren).length > 0) {
        return Object.keys(namedChildren).map(function (name) { return ({
            name: name,
            item: namedChildren[name][0]
        }); });
    }
    if (item.children && level < maxLevel) {
        var resultsForChildren = item.children.map(function (i) {
            return exports.findNamedChildren(i, level + 1);
        });
        return lodash_1.flatten(resultsForChildren);
    }
    return [];
};
