"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
exports.__esModule = true;
var mobx_react_1 = require("mobx-react");
var styled_1 = require("@emotion/styled");
var Box_1 = require("components/shared/Box");
var lodash_1 = require("lodash");
var polished_1 = require("polished");
exports.ShapeSelector = mobx_react_1.observer(function (_a) {
    var shapes = _a.shapes, selectedShapeId = _a.selectedShapeId, _b = _a.onSelected, onSelected = _b === void 0 ? lodash_1.noop : _b, rest = __rest(_a, ["shapes", "selectedShapeId", "onSelected"]);
    return (<>
        <exports.ShapeThumbnails mt="2" {...rest}>
          {shapes.map(function (shape) { return (<exports.ShapeThumbnailBtn key={shape.id} onClick={function () {
        onSelected(shape);
    }} backgroundColor="white" active={shape.id === selectedShapeId} url={shape.thumbnailUrl || shape.url}/>); })}
        </exports.ShapeThumbnails>
      </>);
});
exports.ShapeThumbnailBtn = mobx_react_1.observer(function (_a) {
    var url = _a.url, backgroundColor = _a.backgroundColor, _b = _a.active, active = _b === void 0 ? false : _b, onClick = _a.onClick, rest = __rest(_a, ["url", "backgroundColor", "active", "onClick"]);
    return (<ShapeThumbnailBtnInner {...rest} active={active} onClick={onClick} backgroundColor={backgroundColor}>
      <ShapeThumbnailBtnInnerImg src={url}/>
    </ShapeThumbnailBtnInner>);
    return null;
});
var ShapeThumbnailBtnInnerImg = styled_1["default"].img(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  width: 90px;\n  height: 90px;\n  margin: 0;\n  object-fit: contain;\n"], ["\n  width: 90px;\n  height: 90px;\n  margin: 0;\n  object-fit: contain;\n"])));
exports.ShapeThumbnails = styled_1["default"](Box_1.Box)(templateObject_2 || (templateObject_2 = __makeTemplateObject([""], [""])));
var ShapeThumbnailBtnInner = styled_1["default"].button(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  width: 106px;\n  height: 106px;\n  border: 1px solid #ddd;\n  outline: none;\n  background: white;\n  display: inline-flex;\n  padding: 5px;\n  margin: 0;\n  justify-content: center;\n  align-items: center;\n  font-size: 12px;\n  cursor: pointer;\n  flex-direction: column;\n\n  -webkit-appearance: none;\n\n  img {\n    margin: 0;\n  }\n\n  svg {\n    width: 90px;\n    height: 90px;\n\n    * {\n      ", ";\n    }\n  }\n\n  color: black;\n\n  .icon {\n    width: 20px;\n    height: 20px;\n    margin-bottom: 4px;\n  }\n\n  transition: 0.2s all;\n\n  ", "\n\n  &:hover,\n  &:focus {\n    z-index: 1;\n    background: #eee;\n    border: 1px solid ", ";\n    ", "\n  }\n"], ["\n  width: 106px;\n  height: 106px;\n  border: 1px solid #ddd;\n  outline: none;\n  background: white;\n  display: inline-flex;\n  padding: 5px;\n  margin: 0;\n  justify-content: center;\n  align-items: center;\n  font-size: 12px;\n  cursor: pointer;\n  flex-direction: column;\n\n  -webkit-appearance: none;\n\n  img {\n    margin: 0;\n  }\n\n  svg {\n    width: 90px;\n    height: 90px;\n\n    * {\n      ", ";\n    }\n  }\n\n  color: black;\n\n  .icon {\n    width: 20px;\n    height: 20px;\n    margin-bottom: 4px;\n  }\n\n  transition: 0.2s all;\n\n  ",
    "\n\n  &:hover,\n  &:focus {\n    z-index: 1;\n    background: #eee;\n    border: 1px solid ", ";\n    ",
    "\n  }\n"])), function (_a) {
    var fill = _a.fill;
    return fill && "fill: " + fill;
}, function (_a) {
    var theme = _a.theme, active = _a.active;
    return active &&
        "\n    border: 1px solid " + theme.colors.accent + ";\n    background-color: #c8e8ff;\n  ";
}, function (p) { return p.theme.colors.accent; }, function (_a) {
    var theme = _a.theme, active = _a.active;
    return active &&
        "\n      border: 1px solid " + theme.colors.accent + "; \n      z-index: 2;\n      background: " + polished_1.darken(0.1, '#c8e8ff') + ";\n      ";
});
var templateObject_1, templateObject_2, templateObject_3;
