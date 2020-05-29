"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.__esModule = true;
var core_1 = require("@chakra-ui/core");
var core_2 = require("@emotion/core");
var chroma_js_1 = require("chroma-js");
var AddCustomImageModal_1 = require("components/Editor/components/AddCustomImageModal");
var ShapeSelector_1 = require("components/Editor/components/ShapeSelector");
var shared_1 = require("components/Editor/components/shared");
var editor_1 = require("components/Editor/lib/editor");
var ColorPicker_1 = require("components/shared/ColorPicker");
var Slider_1 = require("components/shared/Slider");
var Tooltip_1 = require("components/shared/Tooltip");
var framer_motion_1 = require("framer-motion");
var mobx_1 = require("mobx");
var mobx_react_1 = require("mobx-react");
var react_1 = require("react");
var root_store_1 = require("services/root-store");
var lib_1 = require("use-debounce/lib");
var CustomizeRasterImageModal_1 = require("components/Editor/components/CustomizeRasterImageModal");
var canvas_utils_1 = require("lib/wordart/canvas-utils");
var fabric_1 = require("fabric");
var fabric_utils_1 = require("components/Editor/lib/fabric-utils");
var initialState = {
    mode: 'home',
    isShowingAddCustomImage: false,
    isShowingCustomizeImage: false,
    isTransforming: false,
    textShape: {
        thumbnailPreview: '',
        text: '',
        // TODO: font id
        color: {
            kind: 'single',
            invert: false,
            color: 'red'
        }
    }
};
var state = mobx_1.observable(__assign({}, initialState));
var ShapeOpacitySlider = mobx_react_1.observer(function (_a) {
    var style = _a.style, onAfterChange = _a.onAfterChange;
    return (<Slider_1.Slider label="Opacity" value={100 * style.fill.opacity} onChange={function (value) {
        style.fill.opacity = value / 100;
    }} onAfterChange={onAfterChange} min={0} max={100} step={1}/>);
});
exports.LeftPanelShapesTab = mobx_react_1.observer(function () {
    var _a, _b, _c;
    var store = root_store_1.useStore().editorPageStore;
    var shapeStyle = store.styleOptions.shape;
    var shape = store.getSelectedShapeConf();
    var _d = react_1.useState(''), term = _d[0], setTerm = _d[1];
    var allOptions = [
        'Animals',
        'Baby',
        'Birthday',
        'Christmas',
        'Clouds',
        'Geometric Shapes',
        'Emoji',
        'Icons',
        'Love & Wedding',
        'Nature',
        'Music',
        'Money & Business',
        'People',
        'Education & School',
        'Sports',
        'Transport',
        'Other',
    ].map(function (value) { return ({ value: value, label: value }); });
    var _e = react_1.useState(allOptions), options = _e[0], setOptions = _e[1];
    var _f = react_1.useState(null), selectedOption = _f[0], setSelectedOption = _f[1];
    var visualize = react_1.useCallback(function () {
        var _a;
        (_a = store.editor) === null || _a === void 0 ? void 0 : _a.generateShapeItems({
            style: shapeStyle
        });
    }, []);
    var _g = react_1.useState(''), query = _g[0], setQuery = _g[1];
    var matchingShapes = store
        .getAvailableShapes()
        .filter(function (s) { return s.title.toLowerCase().includes(query.toLowerCase()); });
    var updateShapeColoring = lib_1.useDebouncedCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, ((_a = store.editor) === null || _a === void 0 ? void 0 : _a.setShapeFillColors(shapeStyle.fill))];
                case 1:
                    _c.sent();
                    store.updateShapeThumbnail();
                    if (shapeStyle.itemsColoring.kind === 'shape') {
                        (_b = store.editor) === null || _b === void 0 ? void 0 : _b.setShapeItemsColor('shape', editor_1.getItemsColoring(shapeStyle));
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 20, {
        leading: true,
        trailing: true
    })[0];
    react_1.useEffect(function () {
        return function () {
            var _a;
            if (state.isTransforming) {
                (_a = store.editor) === null || _a === void 0 ? void 0 : _a.deselectShape();
            }
            Object.assign(state, initialState);
        };
    }, []);
    var updateTextThumbnailPreview = function () { return __awaiter(void 0, void 0, void 0, function () {
        var fontInfo, font, canvasSize, pad, fontSize, canvas, c, text, group;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fontInfo = store.getAvailableFonts()[4];
                    return [4 /*yield*/, store.fetchFontById(fontInfo.style.fontId)];
                case 1:
                    font = _a.sent();
                    if (!font) {
                        return [2 /*return*/];
                    }
                    canvasSize = 400;
                    pad = 10;
                    fontSize = 100;
                    canvas = canvas_utils_1.createCanvas({ w: canvasSize, h: canvasSize });
                    c = new fabric_1.fabric.StaticCanvas(canvas);
                    text = state.textShape.text || 'Preview';
                    group = fabric_utils_1.createMultilineFabricTextGroup(text, font, fontSize, state.textShape.color.kind === 'single'
                        ? state.textShape.color.color
                        : state.textShape.color.colors[0]);
                    if (group.height > group.width) {
                        group.scaleToHeight(canvasSize - 2 * pad);
                    }
                    else {
                        group.scaleToWidth(canvasSize - 2 * pad);
                    }
                    group.setPositionByOrigin(new fabric_1.fabric.Point(canvasSize / 2, canvasSize / 2), 'center', 'center');
                    c.add(group);
                    c.renderAll();
                    state.textShape.thumbnailPreview = c.toDataURL();
                    c.dispose();
                    return [2 /*return*/];
            }
        });
    }); };
    return (<>
        <core_1.Box>
          <>
            <core_1.Box display="flex" alignItems="flex-start" mb="3">
              <ShapeSelector_1.ShapeThumbnailBtn css={core_2.css(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n                  width: 180px;\n                  height: 180px;\n                  min-width: 180px;\n\n                  img {\n                    width: 175px;\n                    height: 175px;\n                  }\n                "], ["\n                  width: 180px;\n                  height: 180px;\n                  min-width: 180px;\n\n                  img {\n                    width: 175px;\n                    height: 175px;\n                  }\n                "])))} backgroundColor="white" url={(state.mode === 'add text shape'
        ? state.textShape.thumbnailPreview
        : shape.thumbnailUrl || shape.url)}/>
              <core_1.Box flex={1} ml="3" display="flex" flexDirection="column" alignItems="flex-start" justifyContent="space-between" height="120px">
                <core_1.Box flex={1} width="100%" mb="2">
                  {state.mode !== 'add text shape' && (<ShapeOpacitySlider style={shapeStyle} onAfterChange={function (value) {
        var _a;
        (_a = store.editor) === null || _a === void 0 ? void 0 : _a.setShapeOpacity(value / 100);
    }}/>)}
                </core_1.Box>

                <core_1.Flex marginTop="70px">
                  {state.mode === 'home' && (<Tooltip_1.Tooltip label="Customize colors, size and position" isDisabled={state.mode === 'customize shape'}>
                      <core_1.Button mr="2" variant="solid" onClick={function () {
        state.mode = 'customize shape';
    }}>
                        Customize
                      </core_1.Button>
                    </Tooltip_1.Tooltip>)}

                  {state.mode === 'customize shape' && (<core_1.Button variantColor="green" onClick={function () {
        var _a, _b;
        state.mode = 'home';
        if (state.isTransforming) {
            state.isTransforming = false;
            (_a = store.editor) === null || _a === void 0 ? void 0 : _a.deselectShape();
            (_b = store.editor) === null || _b === void 0 ? void 0 : _b.generateShapeItems({
                style: store.styleOptions.shape
            });
        }
    }}>
                      Done
                    </core_1.Button>)}
                </core_1.Flex>
              </core_1.Box>
            </core_1.Box>

            <core_1.Box position="relative" overflow="auto" overflowX="hidden" width="100%" height="calc(100vh - 255px)">
              <framer_motion_1.AnimatePresence initial={false}>
                {state.mode === 'add text shape' && (<framer_motion_1.motion.div key="customize" initial={{ x: 355, y: 0, opacity: 0 }} transition={{ ease: 'easeInOut', duration: 0.2 }} animate={{ x: 0, y: 0, opacity: 1 }} exit={{ x: 355, y: 0, opacity: 0 }}>
                    <core_1.Stack mb="4" p="2" position="absolute" width="100%">
                      <core_1.Heading size="md" m="0" mb="3" display="flex">
                        Add Text Shape
                      </core_1.Heading>
                      <core_1.Textarea autoFocus value={state.textShape.text} onChange={function (e) {
        state.textShape.text = e.target.value;
        updateTextThumbnailPreview();
    }} placeholder="Type text here..."/>
                      <ColorPicker_1.ColorPicker value={state.textShape.color.kind === 'single'
        ? state.textShape.color.color
        : state.textShape.color.colors[0]} onChange={function (color) {
        state.textShape.color = {
            kind: 'single',
            color: color,
            invert: false
        };
        updateTextThumbnailPreview();
    }}/>

                      <core_1.Box mt="3">
                        <core_1.Button variantColor="accent" size="lg" onClick={function () { return __awaiter(void 0, void 0, void 0, function () {
        var shapeId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shapeId = store.addCustomShapeText({
                        kind: 'text',
                        text: state.textShape.text,
                        // @ts-ignore
                        color: state.textShape.color.color,
                        fontId: store.getAvailableFonts()[2].style.fontId,
                        title: 'Custom text',
                        fillConfig: {
                            kind: 'original',
                            color: 'black',
                            colorMap: [],
                            defaultColorMap: [],
                            opacity: 1
                        },
                        isCustom: true
                    });
                    state.mode = 'home';
                    return [4 /*yield*/, store.selectShape(shapeId)];
                case 1:
                    _a.sent();
                    store.updateShapeThumbnail();
                    return [2 /*return*/];
            }
        });
    }); }}>
                          Done
                        </core_1.Button>
                        <core_1.Button variant="ghost" size="lg" onClick={function () {
        state.mode = 'home';
    }}>
                          Cancel
                        </core_1.Button>
                      </core_1.Box>
                    </core_1.Stack>
                  </framer_motion_1.motion.div>)}

                {state.mode === 'customize shape' && (<framer_motion_1.motion.div key="customize" initial={{ x: 355, y: 0, opacity: 0 }} transition={{ ease: 'easeInOut', duration: 0.2 }} animate={{ x: 0, y: 0, opacity: 1 }} exit={{ x: 355, y: 0, opacity: 0 }}>
                    <core_1.Stack mb="4" p="2" position="absolute" width="100%">
                      {shape.kind === 'svg' && (<core_1.Heading size="md" m="0" mb="3" display="flex">
                          Customize Colors
                          <core_1.Button variant="ghost" variantColor="blue" size="sm" marginLeft="auto">
                            Reset
                          </core_1.Button>
                        </core_1.Heading>)}
                      {shape.kind === 'svg' &&
        shapeStyle.fill.colorMap.length > 1 && (<core_1.Box mt="3">
                            <core_1.Tabs variantColor="primary" index={shapeStyle.fill.kind == 'color-map' ? 0 : 1} variant="solid-rounded" size="sm" onChange={function (index) {
        if (index === 0) {
            shapeStyle.fill.kind = 'color-map';
            updateShapeColoring();
        }
        else {
            shapeStyle.fill.kind = 'single-color';
            updateShapeColoring();
        }
    }}>
                              <core_1.TabList mb="1em">
                                <core_1.Tab>Multiple</core_1.Tab>
                                <core_1.Tab>Single</core_1.Tab>
                              </core_1.TabList>
                              <core_1.TabPanels>
                                <core_1.TabPanel>
                                  <core_1.Box>
                                    {shapeStyle.fill.colorMap.map(function (color, index) { return (<core_1.Box mr="1" mb="2" key={index} display="inline-block">
                                          <ColorPicker_1.ColorPicker disableAlpha value={chroma_js_1["default"](color).alpha(1).hex()} onChange={function (hex) {
        shapeStyle.fill.colorMap[index] = chroma_js_1["default"](hex).hex();
    }} onAfterChange={function () {
        updateShapeColoring();
    }}/>
                                        </core_1.Box>); })}
                                  </core_1.Box>
                                </core_1.TabPanel>
                                <core_1.TabPanel>
                                  <core_1.Box mr="1" mb="2">
                                    <ColorPicker_1.ColorPicker disableAlpha value={chroma_js_1["default"](shapeStyle.fill.color)
        .alpha(1)
        .hex()} onChange={function (hex) {
        shapeStyle.fill.color = chroma_js_1["default"](hex).hex();
    }} onAfterChange={function () {
        updateShapeColoring();
    }}/>
                                  </core_1.Box>
                                </core_1.TabPanel>
                              </core_1.TabPanels>
                            </core_1.Tabs>
                          </core_1.Box>)}
                      {shape.kind === 'svg' &&
        shapeStyle.fill.colorMap.length === 1 && (<ColorPicker_1.ColorPicker disableAlpha value={chroma_js_1["default"](shapeStyle.fill.color).alpha(1).hex()} onChange={function (hex) {
        shapeStyle.fill.kind = 'single-color';
        shapeStyle.fill.color = chroma_js_1["default"](hex).hex();
    }} onAfterChange={function () {
        updateShapeColoring();
    }}/>)}
                      {shape.kind === 'raster' && shape.processing && (<>
                          <core_1.Heading size="md" m="0" mb="3" display="flex">
                            Image
                          </core_1.Heading>

                          <core_1.Box>
                            <core_1.Button variantColor="accent" onClick={function () {
        state.isShowingCustomizeImage = true;
    }}>
                              Customize Image
                            </core_1.Button>
                          </core_1.Box>
                        </>)}

                      <core_1.Box mt="6">
                        <core_1.Heading size="md" m="0" display="flex">
                          Resize, rotate, transform
                          <core_1.Button variant="ghost" variantColor="blue" size="sm" marginLeft="auto">
                            Reset
                          </core_1.Button>
                        </core_1.Heading>
                        {!state.isTransforming && (<>
                            <core_1.Text mt="2">
                              All unlocked words will be re-visualized.
                            </core_1.Text>
                            <core_1.Button variantColor="accent" onClick={function () {
        var _a;
        state.isTransforming = true;
        (_a = store.editor) === null || _a === void 0 ? void 0 : _a.selectShape();
    }}>
                              Transform shape
                            </core_1.Button>
                          </>)}

                        {state.isTransforming && (<>
                            <core_1.Text mt="2">
                              Drag the shape to move or rotate it.
                            </core_1.Text>
                            <core_1.Stack direction="row" mt="3" spacing="3">
                              <core_1.Button variantColor="accent" onClick={function () {
        var _a, _b;
        state.isTransforming = false;
        (_a = store.editor) === null || _a === void 0 ? void 0 : _a.deselectShape();
        (_b = store.editor) === null || _b === void 0 ? void 0 : _b.generateShapeItems({
            style: store.styleOptions.shape
        });
    }}>
                                Apply
                              </core_1.Button>
                              <Tooltip_1.Tooltip label="Center shape and restore its original size">
                                <core_1.Button ml="3">Reset original</core_1.Button>
                              </Tooltip_1.Tooltip>
                            </core_1.Stack>
                          </>)}
                      </core_1.Box>
                    </core_1.Stack>
                  </framer_motion_1.motion.div>)}

                {state.mode === 'home' && (<framer_motion_1.motion.div key="main" transition={{ ease: 'easeInOut', duration: 0.2 }} initial={{ x: -400, y: 0, opacity: 0 }} animate={{ x: 0, y: 0, opacity: 1 }} exit={{ x: -400, y: 0, opacity: 0 }}>
                    <core_1.Box position="absolute" width="100%" height="100%">
                      <core_1.Flex mt="5">
                        <Tooltip_1.Tooltip label="Add custom image...">
                          <core_1.Button leftIcon="add" variantColor="green" size="sm" mr="2" onClick={function () {
        state.isShowingAddCustomImage = true;
    }}>
                            Image
                          </core_1.Button>
                        </Tooltip_1.Tooltip>

                        <Tooltip_1.Tooltip label="Use text as a shape...">
                          <core_1.Button leftIcon="add" variantColor="green" size="sm" mr="2" onClick={function () {
        state.mode = 'add text shape';
        updateTextThumbnailPreview();
    }}>
                            Text
                          </core_1.Button>
                        </Tooltip_1.Tooltip>

                        <core_1.InputGroup size="sm">
                          <core_1.InputLeftElement children={<core_1.Icon name="search"/>}/>
                          <core_1.Input _placeholder={{
        color: 'red'
    }} placeholder="Search shapes..." value={term} onChange={function (e) { return setTerm(e.target.value); }}/>
                          {!!term && (<core_1.InputRightElement onClick={function () { return setTerm(''); }} children={<core_1.IconButton aria-label="Clear" icon="close" color="gray" isRound variant="ghost" size="sm"/>}/>)}
                        </core_1.InputGroup>
                      </core_1.Flex>

                      <core_1.Flex align="center" mt="2" mb="1">
                        <shared_1.Label mr="2">Category:</shared_1.Label>

                        <core_1.Box flex={1}>
                          <core_1.Menu>
                            <core_1.MenuButton variant="link" variantColor="primary" as={core_1.Button} rightIcon="chevron-down" py="2" px="3">
                              {selectedOption ? selectedOption.value : 'All'}
                            </core_1.MenuButton>
                            <core_1.MenuList as="div" css={core_2.css(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n                                background: white;\n                                position: absolute;\n                                top: 0px !important;\n                                margin-top: 0 !important;\n                                z-index: 5000 !important;\n                                max-height: 300px;\n                                overflow: auto;\n                              "], ["\n                                background: white;\n                                position: absolute;\n                                top: 0px !important;\n                                margin-top: 0 !important;\n                                z-index: 5000 !important;\n                                max-height: 300px;\n                                overflow: auto;\n                              "])))}>
                              <core_1.MenuItem onClick={function () { return setSelectedOption(null); }}>
                                Show all
                              </core_1.MenuItem>
                              <core_1.MenuDivider />
                              {options.map(function (item, index) { return (<core_1.MenuItem key={item.value} onClick={function () { return setSelectedOption(item); }}>
                                  {item.value}
                                </core_1.MenuItem>); })}
                            </core_1.MenuList>
                          </core_1.Menu>
                        </core_1.Box>

                        {!!selectedOption && (<core_1.Button ml="3" variant="link" onClick={function () {
        setSelectedOption(null);
    }}>
                            Show all
                          </core_1.Button>)}
                      </core_1.Flex>

                      <ShapeSelector_1.ShapeSelector height="calc(100vh - 370px)" width="345px" overflowY="scroll" shapes={matchingShapes} onSelected={function (shape) {
        store.selectShape(shape.id);
    }} selectedShapeId={store.getSelectedShapeConf().id}/>
                    </core_1.Box>
                  </framer_motion_1.motion.div>)}
              </framer_motion_1.AnimatePresence>
            </core_1.Box>
          </>
        </core_1.Box>

        <CustomizeRasterImageModal_1.CustomizeRasterImageModal isOpen={state.isShowingCustomizeImage} value={{
        invert: ((_a = shape.processing) === null || _a === void 0 ? void 0 : _a.invert.enabled) || false,
        invertColor: ((_b = shape.processing) === null || _b === void 0 ? void 0 : _b.invert.color) || 'black',
        removeLightBackground: ((_c = shape.processing) === null || _c === void 0 ? void 0 : _c.removeLightBackground.threshold) || 0,
        originalUrl: shape.url
    }} onClose={function () {
        state.isShowingCustomizeImage = false;
    }} onSubmit={function (thumbnailUrl, value) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    shape.thumbnailUrl = thumbnailUrl;
                    shape.processing = {
                        invert: {
                            enabled: value.invert,
                            color: value.invertColor
                        },
                        removeLightBackground: {
                            enabled: true,
                            threshold: value.removeLightBackground
                        },
                        edges: {
                            enabled: false,
                            amount: 0
                        }
                    };
                    return [4 /*yield*/, store.updateShape()];
                case 1:
                    _a.sent();
                    store.updateShapeThumbnail();
                    return [2 /*return*/];
            }
        });
    }); }}/>

        <AddCustomImageModal_1.AddCustomImageModal isOpen={state.isShowingAddCustomImage} onClose={function () {
        state.isShowingAddCustomImage = false;
    }} onSubmit={function (_a) {
        var thumbnailUrl = _a.thumbnailUrl, state = _a.state;
        var customImgId = store.addCustomShapeImg({
            kind: 'raster',
            title: 'Custom',
            url: state.originalUrl,
            thumbnailUrl: thumbnailUrl,
            isCustom: true,
            processing: {
                edges: {
                    enabled: false,
                    amount: 0
                },
                invert: {
                    enabled: state.invert,
                    color: state.invertColor
                },
                removeLightBackground: {
                    enabled: true,
                    threshold: state.removeLightBackground
                }
            }
        });
        store.selectShape(customImgId);
    }}/>
      </>);
});
var templateObject_1, templateObject_2;
