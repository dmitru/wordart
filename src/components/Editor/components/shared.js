"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
var styled_1 = require("@emotion/styled");
var Box_1 = require("components/shared/Box");
exports.Label = styled_1["default"](Box_1.Box)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  font-size: ", "px;\n  font-weight: ", ";\n  color: ", ";\n"], ["\n  font-size: ", "px;\n  font-weight: ", ";\n  color: ", ";\n"])), function (p) { return p.theme.fontSizes[3]; }, function (p) { return p.theme.fontWeights.semibold; }, function (p) { return p.theme.colors.dark2; });
var templateObject_1;
