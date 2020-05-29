"use strict";
exports.__esModule = true;
var fabric_1 = require("fabric");
var lodash_1 = require("lodash");
exports.findNamedChildren = function (item) {
    var objects = item instanceof fabric_1.fabric.Group ? item.getObjects() : [item];
    var namedChildren = objects.filter(function (obj) { return obj.id != null; });
    if (namedChildren.length > 0) {
        return namedChildren.map(function (child) { return ({
            name: child.id,
            item: child
        }); });
    }
    return [];
};
/** Recursively finds all fill colors used (ignoring pure black) */
exports.getFillColor = function (items) {
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        if (typeof item.fill === 'string') {
            return item.fill;
        }
    }
    return undefined;
};
/** Recursively finds all stroke colors used */
exports.getStrokeColor = function (items) {
    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
        var item = items_2[_i];
        if (typeof item.stroke === 'string') {
            return item.stroke;
        }
    }
    return undefined;
};
exports.computeColorsMap = function (object) {
    var namedChildren = lodash_1.sortBy(exports.findNamedChildren(object), function (c) { return c.name; });
    var namedChildrenByColor = lodash_1.groupBy(namedChildren, function (ch) { return ch.name.split('_')[0]; });
    console.log('computeColorsMap', object, namedChildren);
    var colorEntries = [];
    if (Object.keys(namedChildrenByColor).length > 0) {
        Object.keys(namedChildrenByColor).forEach(function (colorKey) {
            var children = namedChildrenByColor[colorKey];
            var fillColor = exports.getFillColor(children.map(function (c) { return c.item; }));
            var strokeColor = exports.getStrokeColor(children.map(function (c) { return c.item; }));
            if (fillColor !== strokeColor) {
                if (fillColor) {
                    colorEntries.push({
                        fabricItems: children.map(function (c) { return c.item; }),
                        color: fillColor,
                        fill: true,
                        stroke: false
                    });
                }
                if (strokeColor) {
                    colorEntries.push({
                        fabricItems: children.map(function (c) { return c.item; }),
                        color: strokeColor,
                        fill: false,
                        stroke: true
                    });
                }
            }
            else {
                if (strokeColor) {
                    colorEntries.push({
                        fabricItems: children.map(function (c) { return c.item; }),
                        color: strokeColor,
                        fill: true,
                        stroke: true
                    });
                }
            }
        });
    }
    else {
        colorEntries.push({
            fabricItems: object instanceof fabric_1.fabric.Group ? object.getObjects() : [object],
            color: '#333',
            stroke: true,
            fill: true
        });
    }
    // Deduplicate color entries
    var colorEntriesGrouped = lodash_1.groupBy(colorEntries, function (e) { return e.color + ":" + e.fill + ":" + e.stroke; });
    colorEntries = Object.values(colorEntriesGrouped).map(function (ceGroup) {
        var ce = ceGroup[0];
        return {
            fill: ce.fill,
            stroke: ce.stroke,
            color: ce.color,
            fabricItems: lodash_1.flatten(ceGroup.map(function (ce) { return ce.fabricItems; }))
        };
    });
    // Sort color entries
    colorEntries = lodash_1.sortBy(colorEntries, function (ce) { return -(10 * (ce.fill ? 1 : 0) + (ce.stroke ? 1 : 0)); });
    var colorsMap = { colors: colorEntries };
    return colorsMap;
};
