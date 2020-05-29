"use strict";
exports.__esModule = true;
var mobx_react_1 = require("mobx-react");
var root_store_1 = require("services/root-store");
var ColorPicker_1 = require("components/shared/ColorPicker");
var Box_1 = require("components/shared/Box");
var shared_1 = require("./shared");
var Slider_1 = require("components/shared/Slider");
var throttle_1 = require("@react-hook/throttle");
var chroma_js_1 = require("chroma-js");
var editor_1 = require("components/Editor/lib/editor");
var core_1 = require("@chakra-ui/core");
exports.LeftPanelColorsTab = mobx_react_1.observer(function (_a) {
    var target = _a.target;
    var editorPageStore = root_store_1.useStore().editorPageStore;
    var shape = editorPageStore.getSelectedShapeConf();
    var shapeStyle = editorPageStore.styleOptions.shape;
    var bgStyle = editorPageStore.styleOptions.bg;
    var style = editorPageStore.styleOptions[target];
    var updateItemsColoring = throttle_1.useThrottleCallback(function () {
        var _a;
        (_a = editorPageStore.editor) === null || _a === void 0 ? void 0 : _a.setShapeItemsColor(target, editor_1.getItemsColoring(style));
    }, 20, true);
    var updateShapeColoring = throttle_1.useThrottleCallback(function () {
        var _a, _b;
        (_a = editorPageStore.editor) === null || _a === void 0 ? void 0 : _a.setShapeFillColors(shapeStyle.fill);
        if (shapeStyle.itemsColoring.kind === 'shape') {
            (_b = editorPageStore.editor) === null || _b === void 0 ? void 0 : _b.setShapeItemsColor('shape', editor_1.getItemsColoring(shapeStyle));
        }
    }, 20, true);
    return (<>
        <Box_1.Box mb="4">
          <Box_1.Box>
            <shared_1.Label mb="2">Shape</shared_1.Label>
          </Box_1.Box>

          {shape.kind === 'svg' && (<>
              <Box_1.Box>
                <core_1.Button px="2" py="1" mr="0" secondary={shapeStyle.fill.kind === 'color-map'} outline={shapeStyle.fill.kind !== 'color-map'} onClick={function () {
        shapeStyle.fill.kind = 'color-map';
        updateShapeColoring();
    }}>
                  Shape colors
                </core_1.Button>
                <core_1.Button px="2" py="1" mr="0" secondary={shapeStyle.fill.kind === 'single-color'} outline={shapeStyle.fill.kind !== 'single-color'} onClick={function () {
        shapeStyle.fill.kind = 'single-color';
        updateShapeColoring();
    }}>
                  Color
                </core_1.Button>
              </Box_1.Box>

              <Box_1.Box mt="2">
                {shapeStyle.fill.kind === 'single-color' && (<ColorPicker_1.ColorPicker disableAlpha value={chroma_js_1["default"](shapeStyle.fill.color).alpha(1).hex()} onChange={function (hex) {
        shapeStyle.fill.color = chroma_js_1["default"](hex).hex();
    }} onAfterChange={function () {
        updateShapeColoring();
    }}/>)}

                {shapeStyle.fill.kind === 'color-map' &&
        shapeStyle.fill.colorMap.map(function (color, index) { return (<Box_1.Box mr="1" key={index} display="inline-block">
                      <ColorPicker_1.ColorPicker disableAlpha value={chroma_js_1["default"](color).alpha(1).hex()} onChange={function (hex) {
            shapeStyle.fill.colorMap[index] = chroma_js_1["default"](hex).hex();
        }} onAfterChange={function () {
            updateShapeColoring();
        }}/>
                    </Box_1.Box>); })}
              </Box_1.Box>
            </>)}

          <Box_1.Box mt="2">
            <Slider_1.Slider label="Opacity" value={100 * shapeStyle.fill.opacity} onChange={function (value) {
        shapeStyle.fill.opacity = value / 100;
    }} onAfterChange={function (value) {
        var _a;
        (_a = editorPageStore.editor) === null || _a === void 0 ? void 0 : _a.setShapeOpacity(value / 100);
    }} min={0} max={100} step={1}/>
          </Box_1.Box>
        </Box_1.Box>

        <Box_1.Box mb="2">
          <shared_1.Label mb="2">Words & Icons</shared_1.Label>
          
          <core_1.Button px="2" py="1" mr="0" variantColor={style.itemsColoring.kind === 'shape' ? 'primary' : undefined} onClick={function () {
        style.itemsColoring.kind = 'shape';
        updateItemsColoring();
    }}>
            Shape color
          </core_1.Button>

          <core_1.Button px="2" py="1" variantColor={style.itemsColoring.kind === 'gradient' ? 'primary' : undefined} onClick={function () {
        style.itemsColoring.kind = 'gradient';
        updateItemsColoring();
    }}>
            Gradient
          </core_1.Button>

          <core_1.Button px="2" py="1" mr="0" variantColor={style.itemsColoring.kind === 'color' ? 'primary' : undefined} onClick={function () {
        style.itemsColoring.kind = 'color';
        updateItemsColoring();
    }}>
            Color
          </core_1.Button>

          <Box_1.Box mt="2">
            {style.itemsColoring.kind === 'shape' && (<Box_1.Box mb="4">
                <Slider_1.Slider label="Brightness" value={style.itemsColoring.shapeBrightness} onChange={function (value) {
        var val = value;
        style.itemsColoring.shapeBrightness = val;
    }} onAfterChange={updateItemsColoring} min={-100} max={100} step={1}/>
              </Box_1.Box>)}
            {style.itemsColoring.kind === 'color' && (<ColorPicker_1.ColorPicker disableAlpha value={style.itemsColoring.color} onChange={function (hex) {
        style.itemsColoring.color = hex;
    }} onAfterChange={updateItemsColoring}/>)}
            {style.itemsColoring.kind === 'gradient' && (<>
                <Box_1.Box mr="1" display="inline-block">
                  <ColorPicker_1.ColorPicker disableAlpha value={style.itemsColoring.gradient.from} onChange={function (hex) {
        style.itemsColoring.gradient.from = hex;
    }} onAfterChange={updateItemsColoring}/>
                </Box_1.Box>
                <Box_1.Box mr="1" display="inline-block">
                  <ColorPicker_1.ColorPicker disableAlpha value={style.itemsColoring.gradient.to} onChange={function (hex) {
        style.itemsColoring.gradient.to = hex;
    }} onAfterChange={updateItemsColoring}/>
                </Box_1.Box>
              </>)}
          </Box_1.Box>
        </Box_1.Box>

        <Box_1.Box mb="4">
          <Slider_1.Slider label="Make larger words brighter" value={style.itemsColoring.dimSmallerItems} onChange={function (value) {
        var val = value;
        style.itemsColoring.dimSmallerItems = val;
    }} onAfterChange={updateItemsColoring} min={0} max={100} step={1}/>
        </Box_1.Box>

        <Box_1.Box mb="4">
          <shared_1.Label mb="2">Background</shared_1.Label>
          <ColorPicker_1.ColorPicker disableAlpha value={chroma_js_1["default"](bgStyle.fill.color).alpha(1).hex()} onChange={function (hex) {
        bgStyle.fill.color = chroma_js_1["default"](hex).hex();
    }} onAfterChange={function () {
        var _a, _b;
        (_a = editorPageStore.editor) === null || _a === void 0 ? void 0 : _a.setBgColor(bgStyle.fill);
        if (bgStyle.itemsColoring.kind === 'shape') {
            (_b = editorPageStore.editor) === null || _b === void 0 ? void 0 : _b.setShapeItemsColor('bg', editor_1.getItemsColoring(bgStyle));
        }
    }}/>
        </Box_1.Box>
      </>);
});
