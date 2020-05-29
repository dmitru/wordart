"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
var styled_1 = require("@emotion/styled");
var MagicWand_1 = require("@styled-icons/boxicons-solid/MagicWand");
var ColorPalette_1 = require("@styled-icons/evaicons-solid/ColorPalette");
var Shapes_1 = require("@styled-icons/fa-solid/Shapes");
var Font_1 = require("@styled-icons/icomoon/Font");
var Face_1 = require("@styled-icons/material/Face");
var TextFields_1 = require("@styled-icons/material/TextFields");
var LayoutMasonry_1 = require("@styled-icons/remix-fill/LayoutMasonry");
var LeftPanelColorsTab_1 = require("components/Editor/components/LeftPanelColorsTab");
var LeftPanelFontsTab_1 = require("components/Editor/components/LeftPanelFontsTab");
var LeftPanelIconsTab_1 = require("components/Editor/components/LeftPanelIconsTab");
var LeftPanelLayoutTab_1 = require("components/Editor/components/LeftPanelLayoutTab");
var LeftPanelShapesTab_1 = require("components/Editor/components/LeftPanelShapesTab");
var LeftPanelWordsTab_1 = require("components/Editor/components/LeftPanelWordsTab");
var editor_store_1 = require("components/Editor/editor-store");
var BaseBtn_1 = require("components/shared/BaseBtn");
var Box_1 = require("components/shared/Box");
var SpinnerSplashScreen_1 = require("components/shared/SpinnerSplashScreen");
var Tooltip_1 = require("components/shared/Tooltip");
require("lib/wordart/console-extensions");
var mobx_1 = require("mobx");
var mobx_react_1 = require("mobx-react");
var router_1 = require("next/dist/client/router");
var link_1 = require("next/link");
var polished_1 = require("polished");
var react_1 = require("react");
var api_1 = require("services/api/api");
var root_store_1 = require("services/root-store");
var urls_1 = require("urls");
var ColorPicker_1 = require("components/shared/ColorPicker");
exports.EditorComponent = mobx_react_1.observer(function (props) {
    var toast = core_1.useToast();
    var aspectRatio = 4 / 3;
    var canvasSize = react_1.useState({ w: 900 * aspectRatio, h: 900 })[0];
    var canvasRef = react_1.useRef(null);
    var canvasWrapperRef = react_1.useRef(null);
    var _a = root_store_1.useStore(), store = _a.editorPageStore, wordcloudsStore = _a.wordcloudsStore;
    var isNew = props.wordcloudId == null;
    var authStore = root_store_1.useStore().authStore;
    var router = router_1.useRouter();
    var _b = react_1.useState(false), isSaving = _b[0], setIsSaving = _b[1];
    var handleSaveClick = react_1.useCallback(function () {
        var save = function () { return __awaiter(void 0, void 0, void 0, function () {
            var thumbnail, editorData, wordcloud;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (isSaving || !store.editor) {
                            return [2 /*return*/];
                        }
                        setIsSaving(true);
                        thumbnail = store.editor.canvas.toDataURL({
                            multiplier: 0.3,
                            format: 'jpeg',
                            quality: 0.8
                        });
                        editorData = store.serialize();
                        if (!isNew) return [3 /*break*/, 2];
                        return [4 /*yield*/, wordcloudsStore.create({
                                title: state.title,
                                editorData: editorData,
                                thumbnail: thumbnail
                            })];
                    case 1:
                        wordcloud = _a.sent();
                        router.push(urls_1.Urls.editor._next, urls_1.Urls.editor.edit(wordcloud.id), {
                            shallow: true
                        });
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, wordcloudsStore.save(props.wordcloudId, {
                            title: state.title,
                            thumbnail: thumbnail,
                            editorData: editorData
                        })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        toast({
                            title: 'Your work is saved',
                            status: 'success',
                            duration: 2000,
                            position: 'bottom-right',
                            isClosable: true
                        });
                        setIsSaving(false);
                        return [2 /*return*/];
                }
            });
        }); };
        save();
    }, [isSaving, props.wordcloudId]);
    react_1.useEffect(function () {
        var init = function () { return __awaiter(void 0, void 0, void 0, function () {
            var editorParams, wordcloud, editorData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(authStore.hasInitialized &&
                            canvasRef.current &&
                            store.lifecycleState !== 'initialized')) return [3 /*break*/, 5];
                        editorParams = {
                            canvas: canvasRef.current,
                            canvasWrapperEl: canvasWrapperRef.current,
                            aspectRatio: aspectRatio
                        };
                        if (!(props.wordcloudId != null)) return [3 /*break*/, 2];
                        wordcloud = wordcloudsStore.getById(props.wordcloudId);
                        if (wordcloud) {
                            state.title = wordcloud.title;
                        }
                        return [4 /*yield*/, api_1.Api.wordclouds.fetchEditorData(props.wordcloudId)];
                    case 1:
                        editorData = _a.sent();
                        editorParams.serialized = editorData;
                        return [3 /*break*/, 3];
                    case 2:
                        state.title = 'New wordart';
                        _a.label = 3;
                    case 3: return [4 /*yield*/, store.initEditor(editorParams)
                        // store.editor?.generateShapeItems({
                        //   style: store.styles.shape,
                        // })
                    ];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        init();
    }, [props.wordcloudId, authStore.hasInitialized, canvasRef.current]);
    react_1.useEffect(function () {
        return store.destroyEditor;
    }, []);
    if (!router || !authStore.hasInitialized) {
        return <SpinnerSplashScreen_1.SpinnerSplashScreen />;
    }
    if (authStore.isLoggedIn !== true) {
        router.replace(urls_1.Urls.login);
        return <SpinnerSplashScreen_1.SpinnerSplashScreen />;
    }
    var leftTab = state.targetTab === 'bg' ? state.leftTabBg : state.leftTabShape;
    return (<PageLayoutWrapper>
        <TopNavWrapper alignItems="center" display="flex">
          <link_1["default"] href={urls_1.Urls.dashboard} passHref>
            <core_1.Button color="white" variant="ghost" leftIcon="chevron-left">
              Back
            </core_1.Button>
          </link_1["default"]>

          <core_1.Menu>
            <core_1.MenuButton ml="4" color="white" as={core_1.Button} rightIcon="chevron-down" variant="ghost">
              Menu
            </core_1.MenuButton>
            <core_1.MenuList zIndex={4}>
              <core_1.MenuItem onClick={function () {
        state.leftPanelContext = 'resize';
    }}>
                Change page size...
              </core_1.MenuItem>
            </core_1.MenuList>
          </core_1.Menu>
          <core_1.Button ml="4" color="white" onClick={handleSaveClick} isLoading={isSaving} loadingText="Saving..." variant="ghost">
            Save
          </core_1.Button>

          <core_1.Editable ml="4" value={state.title} onChange={function (value) {
        state.title = value;
    }} placeholder="Enter name..." color="white" fontSize="xl" maxWidth="200px" flex={1}>
            <core_1.EditablePreview width="100%"/>
            <core_1.EditableInput />
          </core_1.Editable>
        </TopNavWrapper>

        <EditorLayout>
          <LeftWrapper>
            <LeftBottomWrapper>
              <SideNavbar activeIndex={state.targetTab === 'shape'
        ? leftPanelShapeTabs.findIndex(function (s) { return s === state.leftTabShape; })
        : leftPanelBgTabs.findIndex(function (s) { return s === state.leftTabBg; })}>
                {state.targetTab !== 'bg' && (<LeftNavbarBtn onClick={function () {
        state.leftTabShape = 'shapes';
    }} active={state.leftTabShape === 'shapes'}>
                    <Shapes_1.Shapes className="icon"/>
                    Shape
                  </LeftNavbarBtn>)}

                <LeftNavbarBtn onClick={function () {
        state.leftTabBg = 'words';
        state.leftTabShape = 'words';
    }} active={leftTab === 'words'}>
                  <TextFields_1.TextFields className="icon"/>
                  Words
                </LeftNavbarBtn>

                <LeftNavbarBtn onClick={function () {
        state.leftTabBg = 'fonts';
        state.leftTabShape = 'fonts';
    }} active={leftTab === 'fonts'}>
                  <Font_1.Font className="icon"/>
                  Fonts
                </LeftNavbarBtn>

                <LeftNavbarBtn onClick={function () {
        state.leftTabBg = 'symbols';
        state.leftTabShape = 'symbols';
    }} active={leftTab === 'symbols'}>
                  <Face_1.Face className="icon"/>
                  Icons
                </LeftNavbarBtn>

                <LeftNavbarBtn onClick={function () {
        state.leftTabBg = 'layout';
        state.leftTabShape = 'layout';
    }} active={leftTab === 'layout'}>
                  <LayoutMasonry_1.LayoutMasonry className="icon"/>
                  Layout
                </LeftNavbarBtn>

                <LeftNavbarBtn onClick={function () {
        state.leftTabBg = 'colors';
        state.leftTabShape = 'colors';
    }} active={leftTab === 'colors'}>
                  <ColorPalette_1.ColorPalette className="icon"/>
                  Colors
                </LeftNavbarBtn>
              </SideNavbar>

              <LeftPanel>
                <LeftPanelContent id="left-panel-content" px="3" py="3">
                  {store.lifecycleState === 'initialized' ? (<>
                      {state.leftPanelContext === 'resize' && (<Box_1.Box>
                          <core_1.Heading size="md" mt="0" mb="3">
                            Page Size
                          </core_1.Heading>
                          {editor_store_1.pageSizePresets.map(function (preset) { return (<core_1.Button variantColor={store.pageSize.kind === 'preset' &&
        store.pageSize.preset.id === preset.id
        ? 'primary'
        : undefined} mr="2" mb="3" key={preset.id} onClick={function () {
        store.setPageSize({ kind: 'preset', preset: preset });
    }}>
                              {preset.title}
                            </core_1.Button>); })}
                          <core_1.Button variantColor={store.pageSize.kind === 'custom'
        ? 'primary'
        : undefined} mr="2" mb="3" onClick={function () {
        store.setPageSize({
            kind: 'custom',
            height: 2,
            width: 4
        });
    }}>
                            Custom
                          </core_1.Button>

                          <Box_1.Box>
                            <core_1.Button mt="4" variantColor="green" onClick={function () {
        state.leftPanelContext = 'normal';
    }}>
                              Done
                            </core_1.Button>
                          </Box_1.Box>
                        </Box_1.Box>)}

                      {state.leftPanelContext === 'normal' && (<>
                          {leftTab === 'shapes' && <LeftPanelShapesTab_1.LeftPanelShapesTab />}
                          {leftTab === 'words' && (<>
                              <LeftPanelWordsTab_1.LeftPanelWordsTab target={state.targetTab}/>
                            </>)}
                          {leftTab === 'fonts' && (<>
                              <LeftPanelFontsTab_1.LeftPanelFontsTab target={state.targetTab}/>
                            </>)}
                          {leftTab === 'symbols' && (<LeftPanelIconsTab_1.LeftPanelIconsTab target={state.targetTab}/>)}
                          {leftTab === 'colors' && (<LeftPanelColorsTab_1.LeftPanelColorsTab target={state.targetTab}/>)}

                          {leftTab === 'layout' && (<LeftPanelLayoutTab_1.LeftPanelLayoutTab target={state.targetTab}/>)}
                        </>)}
                    </>) : (<Box_1.Box>Loading...</Box_1.Box>)}
                </LeftPanelContent>
              </LeftPanel>
            </LeftBottomWrapper>
          </LeftWrapper>

          <RightWrapper>
            <TopToolbar display="flex" alignItems="center" bg="light" p="2" pl="3">
              <core_1.Button css={core_2.css(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n                  width: 128px;\n                "], ["\n                  width: 128px;\n                "])))} 
    // accent
    // isDisabled={store.isVisualizing}
    variantColor="accent" loadingText="Working" isLoading={store.isVisualizing} onClick={function () {
        var _a, _b;
        if (state.targetTab === 'shape') {
            (_a = store.editor) === null || _a === void 0 ? void 0 : _a.generateShapeItems({
                style: store.styleOptions.shape
            });
        }
        else {
            (_b = store.editor) === null || _b === void 0 ? void 0 : _b.generateBgItems({
                style: store.styleOptions.bg
            });
        }
    }}>
                <MagicWand_1.MagicWand size={24} css={core_2.css(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n                    margin-right: 4px;\n                  "], ["\n                    margin-right: 4px;\n                  "])))}/>

                {store.isVisualizing
        ? "Working: " + Math.round((store.visualizingProgress || 0) * 100) + "%"
        : 'Visualize'}
              </core_1.Button>

              <Tooltip_1.Tooltip label="Undo" aria-label="Undo" hasArrow zIndex={5}>
                <core_1.IconButton ml="3" icon="arrow-back" aria-label="Undo"/>
              </Tooltip_1.Tooltip>
              <Tooltip_1.Tooltip label="Redo" aria-label="Redo" hasArrow zIndex={5}>
                <core_1.IconButton ml="1" icon="arrow-forward" aria-label="Redo"/>
              </Tooltip_1.Tooltip>

              <Box_1.Box mr="3" ml="3">
                {store.mode === 'view' && (<core_1.Button css={core_2.css(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n                      box-shadow: none !important;\n                    "], ["\n                      box-shadow: none !important;\n                    "])))} py="1" onClick={function () {
        store.enterEditItemsMode();
    }}>
                    Edit Items
                  </core_1.Button>)}

                {store.mode === 'edit items' && (<>
                    <core_1.Button css={core_2.css(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n                        box-shadow: none !important;\n                      "], ["\n                        box-shadow: none !important;\n                      "])))} mr="2" py="1" variantColor="green" onClick={function () {
        store.enterViewMode();
    }}>
                      Done
                    </core_1.Button>

                    <core_1.Button mr="2" size="sm" isDisabled={!store.hasItemChanges} variant="ghost" onClick={store.resetAllItems}>
                      Reset All
                    </core_1.Button>

                    {store.selectedItemData && (<>
                        <ColorPicker_1.ColorPicker value={store.selectedItemData.customColor ||
        store.selectedItemData.color} onAfterChange={function (color) {
        store.setItemCustomColor(color);
    }}>
                          <core_1.Button onClick={function () {
        store.resetItemCustomColor();
    }}>
                            Reset Default Color
                          </core_1.Button>
                        </ColorPicker_1.ColorPicker>
                        <core_1.Button ml="2" size="sm" onClick={function () {
        if (!store.selectedItemData) {
            return;
        }
        store.setItemLock(!Boolean(store.selectedItemData.locked));
    }}>
                          {store.selectedItemData.locked ? 'Unlock' : 'Lock'}
                        </core_1.Button>
                      </>)}
                  </>)}
              </Box_1.Box>

              {store.mode === 'view' && (<Box_1.Box mr="3" ml="3" marginLeft="auto">
                  <core_1.Button css={core_2.css(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n                      box-shadow: none !important;\n                    "], ["\n                      box-shadow: none !important;\n                    "])))} py="1" borderTopRightRadius="0" borderBottomRightRadius="0" variantColor="primary" onClick={function () {
        state.targetTab = 'shape';
    }} variant={state.targetTab !== 'shape' ? 'outline' : 'solid'}>
                    Shape
                  </core_1.Button>
                  <core_1.Button css={core_2.css(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n                      box-shadow: none !important;\n                    "], ["\n                      box-shadow: none !important;\n                    "])))} py="1" borderTopLeftRadius="0" borderBottomLeftRadius="0" variantColor="primary" onClick={function () {
        state.targetTab = 'bg';
    }} variant={state.targetTab !== 'bg' ? 'outline' : 'solid'}>
                    Background
                  </core_1.Button>
                </Box_1.Box>)}
            </TopToolbar>

            <CanvasWrappper ref={canvasWrapperRef}>
              <Canvas width={canvasSize.w} height={canvasSize.h} ref={canvasRef} id="scene"/>
            </CanvasWrappper>
          </RightWrapper>
        </EditorLayout>
      </PageLayoutWrapper>);
});
var PageLayoutWrapper = styled_1["default"].div(templateObject_7 || (templateObject_7 = __makeTemplateObject(["\n  display: flex;\n  flex-direction: column;\n  height: 100vh;\n  width: 100vw;\n  overflow: hidden;\n"], ["\n  display: flex;\n  flex-direction: column;\n  height: 100vh;\n  width: 100vw;\n  overflow: hidden;\n"])));
var EditorLayout = styled_1["default"].div(templateObject_8 || (templateObject_8 = __makeTemplateObject(["\n  display: flex;\n  height: calc(100% - 50px);\n  width: 100%;\n  margin: 0 auto;\n  overflow: hidden;\n"], ["\n  display: flex;\n  height: calc(100% - 50px);\n  width: 100%;\n  margin: 0 auto;\n  overflow: hidden;\n"])));
var TopToolbar = styled_1["default"](Box_1.Box)(templateObject_9 || (templateObject_9 = __makeTemplateObject(["\n  z-index: 1;\n  box-shadow: 0 0 5px 0 #00000033;\n  height: 58px;\n"], ["\n  z-index: 1;\n  box-shadow: 0 0 5px 0 #00000033;\n  height: 58px;\n"])));
var TopNavWrapper = styled_1["default"](Box_1.Box)(templateObject_10 || (templateObject_10 = __makeTemplateObject(["\n  height: 50px;\n  padding: 20px;\n  /* font-size: 1.5em; */\n  /* font-weight: 400; */\n  /* background: linear-gradient(90deg, #21c5be, #697af5); */\n  background: linear-gradient(90deg, #80578e, #3b458c);\n  /* color: white; */\n"], ["\n  height: 50px;\n  padding: 20px;\n  /* font-size: 1.5em; */\n  /* font-weight: 400; */\n  /* background: linear-gradient(90deg, #21c5be, #697af5); */\n  background: linear-gradient(90deg, #80578e, #3b458c);\n  /* color: white; */\n"])));
var LeftWrapper = styled_1["default"].div(templateObject_11 || (templateObject_11 = __makeTemplateObject(["\n  height: 100%;\n  background: white;\n  max-width: 460px;\n  min-width: 460px;\n  flex: 1;\n  z-index: 3;\n  display: flex;\n  flex-direction: column;\n  /* box-shadow: 0 0 5px 0 #00000033; */\n"], ["\n  height: 100%;\n  background: white;\n  max-width: 460px;\n  min-width: 460px;\n  flex: 1;\n  z-index: 3;\n  display: flex;\n  flex-direction: column;\n  /* box-shadow: 0 0 5px 0 #00000033; */\n"])));
var LeftTopWrapper = styled_1["default"](Box_1.Box)(templateObject_12 || (templateObject_12 = __makeTemplateObject(["\n  height: 58px;\n  background: white;\n  position: relative;\n  z-index: 4;\n\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: center;\n  box-shadow: -3px 1px 2px 1px #00000033;\n  /* box-shadow: 0 0 5px 0 #00000033; */\n"], ["\n  height: 58px;\n  background: white;\n  position: relative;\n  z-index: 4;\n\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  justify-content: center;\n  box-shadow: -3px 1px 2px 1px #00000033;\n  /* box-shadow: 0 0 5px 0 #00000033; */\n"])));
var LeftBottomWrapper = styled_1["default"].div(templateObject_13 || (templateObject_13 = __makeTemplateObject(["\n  flex: 1;\n  display: flex;\n  flex-direction: row;\n  background: #606060;\n  /* box-shadow: 0 0 5px 0 #00000033; */\n"], ["\n  flex: 1;\n  display: flex;\n  flex-direction: row;\n  background: #606060;\n  /* box-shadow: 0 0 5px 0 #00000033; */\n"])));
var LeftPanel = styled_1["default"](Box_1.Box)(templateObject_14 || (templateObject_14 = __makeTemplateObject(["\n  flex: 1;\n  width: 350px;\n"], ["\n  flex: 1;\n  width: 350px;\n"])));
var SideNavbar = styled_1["default"].div(templateObject_15 || (templateObject_15 = __makeTemplateObject(["\n  /* background: ", "; */\n  /* border-bottom: 1px solid #cecece; */\n  padding: 0;\n  margin: 0;\n  margin-top: 58px;\n  /* height: 50px; */\n  display: flex;\n  flex-direction: column;\n  \n  z-index: 4;\n\n  position: relative;\n\n  &::after {\n    content: '';\n    display: block;\n    transition: 0.2s transform;\n    transform: translateY(", "px);\n    top: 0;\n    left: 0;\n    position: absolute;\n    height: 70px;\n    width: 100%;\n    z-index: 0;\n    background: ", ";\n    border-left: 8px solid ", "; \n  }\n"], ["\n  /* background: ",
    "; */\n  /* border-bottom: 1px solid #cecece; */\n  padding: 0;\n  margin: 0;\n  margin-top: 58px;\n  /* height: 50px; */\n  display: flex;\n  flex-direction: column;\n  \n  z-index: 4;\n\n  position: relative;\n\n  &::after {\n    content: '';\n    display: block;\n    transition: 0.2s transform;\n    transform: translateY(", "px);\n    top: 0;\n    left: 0;\n    position: absolute;\n    height: 70px;\n    width: 100%;\n    z-index: 0;\n    background: ", ";\n    border-left: 8px solid ", "; \n  }\n"])), function (p) {
    return polished_1.darken(0.1, polished_1.desaturate(0.5, p.theme.colors.dark4));
}, function (p) { return p.activeIndex * 70; }, function (p) { return p.theme.colors.light; }, function (p) { return p.theme.colors.primary; });
var LeftNavbarBtn = styled_1["default"](BaseBtn_1.BaseBtn)(templateObject_16 || (templateObject_16 = __makeTemplateObject(["\n  min-width: 20%;\n  font-weight: 500;\n  height: 70px;\n  padding: 0 20px 0 20px;\n  text-transform: uppercase;\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  font-size: 12px;\n  /* background: ", "; */\n  /* background: #dedede; */\n  border-radius: 0;\n  color: ", ";\n  outline: none;\n  /* border: 1px solid #cecece; */\n  border: none;\n  border-radius: 0;\n  z-index: 1;\n\n  transition: 0.2s all;\n\n  ", "\n\n  .icon {\n    width: 24px;\n    height: 24px;\n    margin-bottom: 4px;\n  }\n\n  /* transition: 0.2s background; */\n\n  &:hover,\n  &:focus {\n    background: #0001;\n    ", "\n  }\n"], ["\n  min-width: 20%;\n  font-weight: 500;\n  height: 70px;\n  padding: 0 20px 0 20px;\n  text-transform: uppercase;\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  font-size: 12px;\n  /* background: ", "; */\n  /* background: #dedede; */\n  border-radius: 0;\n  color: ", ";\n  outline: none;\n  /* border: 1px solid #cecece; */\n  border: none;\n  border-radius: 0;\n  z-index: 1;\n\n  transition: 0.2s all;\n\n  ",
    "\n\n  .icon {\n    width: 24px;\n    height: 24px;\n    margin-bottom: 4px;\n  }\n\n  /* transition: 0.2s background; */\n\n  &:hover,\n  &:focus {\n    background: #0001;\n    ",
    "\n  }\n"])), function (p) { return p.theme.colors.light1; }, function (p) { return p.theme.colors.textLight; }, function (_a) {
    var theme = _a.theme, active = _a.active;
    return active &&
        "\n    z-index: 1;\n    color: " + theme.colors.text + ";\n    background: transparent;\n    // transform: translateY(-3px);\n    // border: 1px solid #cecece;\n    // box-shadow: 0 0 2px 0 #00000033;\n  ";
}, function (_a) {
    var theme = _a.theme, active = _a.active;
    return active &&
        "\n      background: transparent;\n    color: " + theme.colors.text + ";\n    ";
});
var LeftPanelContent = styled_1["default"](Box_1.Box)(templateObject_17 || (templateObject_17 = __makeTemplateObject(["\n  flex: 1;\n  height: 100%;\n  overflow: auto;\n  background: ", ";\n  z-index: 2;\n  box-shadow: 0 0 5px 0 #00000033;\n"], ["\n  flex: 1;\n  height: 100%;\n  overflow: auto;\n  background: ", ";\n  z-index: 2;\n  box-shadow: 0 0 5px 0 #00000033;\n"])), function (p) { return p.theme.colors.light; });
var RightWrapper = styled_1["default"].div(templateObject_18 || (templateObject_18 = __makeTemplateObject(["\n  height: 100%;\n  background: #eee;\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  box-shadow: 0 0 5px 0 #00000033;\n"], ["\n  height: 100%;\n  background: #eee;\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  box-shadow: 0 0 5px 0 #00000033;\n"])));
var CanvasWrappper = styled_1["default"].div(templateObject_19 || (templateObject_19 = __makeTemplateObject(["\n  flex: 1;\n  height: calc(100vh - 100px);\n  width: calc(100vw - 460px);\n  padding: 20px;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  box-shadow: inset 0 0 5px 0 #00000033;\n"], ["\n  flex: 1;\n  height: calc(100vh - 100px);\n  width: calc(100vw - 460px);\n  padding: 20px;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  box-shadow: inset 0 0 5px 0 #00000033;\n"])));
var Canvas = styled_1["default"].canvas(templateObject_20 || (templateObject_20 = __makeTemplateObject(["\n  /* width: 100%; */\n  height: 100%;\n  /* max-height: 100%; */\n  margin: auto;\n"], ["\n  /* width: 100%; */\n  height: 100%;\n  /* max-height: 100%; */\n  margin: auto;\n"])));
var state = mobx_1.observable({
    title: 'New wordart',
    leftTabShape: 'shapes',
    leftTabBg: 'words',
    targetTab: 'shape',
    leftPanelContext: 'normal'
});
var leftPanelShapeTabs = [
    'shapes',
    'words',
    'fonts',
    'symbols',
    'layout',
    'colors',
];
var leftPanelBgTabs = [
    'words',
    'fonts',
    'symbols',
    'layout',
    'colors',
];
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20;
