"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var mobx_react_1 = require("mobx-react");
var root_store_1 = require("services/root-store");
var styled_1 = require("@emotion/styled");
var evaicons = require("@styled-icons/evaicons-outline");
var shared_1 = require("./shared");
var Button_1 = require("components/shared/Button");
var Box_1 = require("components/shared/Box");
var ShapeSelector_1 = require("components/Editor/components/ShapeSelector");
var mobx_1 = require("mobx");
var lodash_1 = require("lodash");
var Toolbar = styled_1["default"](Box_1.Box)(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""])));
var IconsList = styled_1["default"](Box_1.Box)(templateObject_2 || (templateObject_2 = __makeTemplateObject([""], [""])));
var state = mobx_1.observable({
    isAdding: false
});
exports.LeftPanelIconsTab = mobx_react_1.observer(function (_a) {
    var target = _a.target;
    var editorPageStore = root_store_1.useStore().editorPageStore;
    var style = editorPageStore.styleOptions[target];
    var icons = style.icons.iconList;
    var shapes = editorPageStore
        .getAvailableShapes()
        .filter(function (s) { return s.kind === 'svg'; });
    return (<>
        <Toolbar display="flex" alignItems="center">
          <shared_1.Label flex={1}>{state.isAdding ? 'Add Icon' : 'Icons'}</shared_1.Label>
          {!state.isAdding && (<>
              <Button_1.Button px="2" py="1" mt="2" primary onClick={function () {
        state.isAdding = true;
    }}>
                <evaicons.PlusOutline size="20"/> Add
              </Button_1.Button>
              <Button_1.Button px="2" py="1" outline onClick={function () {
        style.icons.iconList = [];
    }}>
                Clear
              </Button_1.Button>
            </>)}

          {state.isAdding && (<>
              <Button_1.Button px="2" py="1" mt="2" secondary onClick={function () {
        state.isAdding = false;
    }}>
                Cancel
              </Button_1.Button>
            </>)}
        </Toolbar>

        {state.isAdding && (<ShapeSelector_1.ShapeSelector shapes={shapes} onSelected={function (shape) {
        style.icons.iconList = lodash_1.uniqBy(__spreadArrays(style.icons.iconList, [{ shapeId: shape.id }]), 'shapeId');
        state.isAdding = false;
    }}/>)}

        {!state.isAdding && (<IconsList mt="2">
            <ShapeSelector_1.ShapeThumbnails mt="2">
              {icons.map(function (icon) { return (<ShapeSelector_1.ShapeThumbnailBtn key={icon.shapeId} onClick={function () {
        style.icons.iconList = style.icons.iconList.filter(function (i) { return i.shapeId !== icon.shapeId; });
    }} backgroundColor="white" shape={editorPageStore.getShapeById(icon.shapeId)}/>); })}
            </ShapeSelector_1.ShapeThumbnails>
          </IconsList>)}
      </>);
});
var templateObject_1, templateObject_2;
