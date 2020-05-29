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
var mobx_react_1 = require("mobx-react");
var core_1 = require("@chakra-ui/core");
var react_dropzone_1 = require("react-dropzone");
var react_1 = require("react");
var canvas_utils_1 = require("lib/wordart/canvas-utils");
var Slider_1 = require("components/shared/Slider");
var css_1 = require("@emotion/css");
var ColorPicker_1 = require("components/shared/ColorPicker");
exports.AddCustomImageModal = mobx_react_1.observer(function (props) {
    var isOpen = props.isOpen;
    var originalImgCanvas = react_1.useRef(null);
    var state = mobx_react_1.useLocalStore(function () { return ({
        originalUrl: null,
        invert: false,
        invertColor: 'black',
        removeLightBackground: 0.95
    }); });
    var close = function () {
        state.originalUrl = null;
        props.onClose();
    };
    var processedImgCanvasRef = react_1.useRef(null);
    var updateImgPreview = function (state) {
        if (!originalImgCanvas.current) {
            return;
        }
        var c = processedImgCanvasRef.current;
        if (!c) {
            return;
        }
        var ctx = c.getContext('2d');
        var ctxOriginal = originalImgCanvas.current.getContext('2d');
        ctx.drawImage(ctxOriginal.canvas, 0, 0, ctxOriginal.canvas.width, ctxOriginal.canvas.height, 0, 0, c.width, c.height);
        canvas_utils_1.processImg(ctx.canvas, {
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
        });
    };
    var updateImgPreviewThrottled = updateImgPreview;
    var _a = react_dropzone_1.useDropzone({
        onDropAccepted: function (files) {
            var reader = new FileReader();
            reader.onload = function () { return __awaiter(void 0, void 0, void 0, function () {
                var ctxOriginal;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!processedImgCanvasRef.current) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, canvas_utils_1.loadImageUrlToCanvasCtxWithMaxSize(reader.result, 1000)];
                        case 1:
                            ctxOriginal = _a.sent();
                            state.originalUrl = ctxOriginal.canvas.toDataURL();
                            originalImgCanvas.current = ctxOriginal.canvas;
                            updateImgPreview(state);
                            return [2 /*return*/];
                    }
                });
            }); };
            reader.readAsDataURL(files[0]);
        }
    }), getRootProps = _a.getRootProps, getInputProps = _a.getInputProps;
    var hasChosenImage = !!state.originalUrl;
    return (<core_1.Modal isOpen={isOpen} onClose={close}>
        <core_1.ModalOverlay />
        <core_1.ModalContent maxWidth="350px">
          <core_1.ModalHeader>
            {hasChosenImage ? 'Customize image' : 'Choose image to upload'}
          </core_1.ModalHeader>
          <core_1.ModalCloseButton />
          <core_1.ModalBody>
            <core_1.Box mt="4" css={state.originalUrl
        ? undefined
        : css_1["default"](templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n                      display: none;\n                    "], ["\n                      display: none;\n                    "])))}>
              <canvas ref={processedImgCanvasRef} width="300" height="300"/>

              <core_1.Box mt="3">
                <core_1.Box>
                  <Slider_1.Slider label="Remove light background" value={state.removeLightBackground * 100} onChange={function (value) {
        state.removeLightBackground = value / 100;
        updateImgPreviewThrottled(state);
    }} onAfterChange={function () { return updateImgPreviewThrottled(state); }} min={0} max={100} step={1}/>
                </core_1.Box>

                <core_1.Box mb="3" height="30px">
                  <core_1.Checkbox mr="5" isChecked={state.invert} onChange={function (e) {
        state.invert = e.target.checked;
        updateImgPreviewThrottled(state);
    }}>
                    Invert color
                  </core_1.Checkbox>
                  {state.invert && (<ColorPicker_1.ColorPicker value={state.invertColor} onChange={function (color) {
        state.invertColor = color;
        updateImgPreviewThrottled(state);
    }}/>)}
                </core_1.Box>
              </core_1.Box>
            </core_1.Box>

            {!state.originalUrl && (<core_1.Box {...getRootProps({ className: 'dropzone' })} py="4">
                <input {...getInputProps({})}/>
                <p>
                  Click or drag image files here - JPEG, PNG and SVG files are
                  supported.
                </p>
                <core_1.Button mt="4" variantColor="accent" size="lg">
                  Click to choose file...
                </core_1.Button>
              </core_1.Box>)}
          </core_1.ModalBody>

          <core_1.ModalFooter>
            {state.originalUrl && (<core_1.Button variant="ghost" onClick={function () {
        state.originalUrl = null;
    }}>
                Choose another image
              </core_1.Button>)}
            {state.originalUrl && (<core_1.Button variantColor="accent" onClick={function () {
        var _a;
        props.onSubmit({
            state: state,
            thumbnailUrl: (_a = processedImgCanvasRef.current) === null || _a === void 0 ? void 0 : _a.toDataURL('image/png')
        });
        close();
    }}>
                Import
              </core_1.Button>)}
          </core_1.ModalFooter>
        </core_1.ModalContent>
      </core_1.Modal>);
});
exports.AddCustomImageModal.displayName = 'AddCustomImageModal';
var templateObject_1;
