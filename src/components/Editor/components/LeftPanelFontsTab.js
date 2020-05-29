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
var core_1 = require("@chakra-ui/core");
var styled_1 = require("@emotion/styled");
var DotsThreeVertical_1 = require("@styled-icons/entypo/DotsThreeVertical");
var BaseBtn_1 = require("components/shared/BaseBtn");
var lodash_1 = require("lodash");
var mobx_1 = require("mobx");
var mobx_react_1 = require("mobx-react");
var root_store_1 = require("services/root-store");
var FontDeleteButton = styled_1["default"](core_1.IconButton)(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""])));
var FontButton = styled_1["default"](BaseBtn_1.BaseBtn)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  border: none;\n  flex: 1;\n  display: inline-flex;\n  height: 38px;\n\n  img {\n    height: 30px;\n    margin: 0;\n    object-fit: contain;\n  }\n"], ["\n  border: none;\n  flex: 1;\n  display: inline-flex;\n  height: 38px;\n\n  img {\n    height: 30px;\n    margin: 0;\n    object-fit: contain;\n  }\n"])));
FontButton.defaultProps = {
    pr: '2',
    py: '1'
};
var FontButtonContainer = styled_1["default"](core_1.Box)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  ", " {\n    opacity: 0;\n    transition: 0.2s opacity;\n  }\n\n  transition: 0.1s background;\n\n  ", "\n\n  &:hover {\n    background: ", ";\n    ", " {\n      opacity: 1;\n    }\n  }\n"], ["\n  ", " {\n    opacity: 0;\n    transition: 0.2s opacity;\n  }\n\n  transition: 0.1s background;\n\n  ", "\n\n  &:hover {\n    background: ",
    ";\n    ", " {\n      opacity: 1;\n    }\n  }\n"])), FontDeleteButton, function (p) { return (p.selected ? "background: " + p.theme.colors.blue['100'] + ";" : ''); }, function (p) {
    return p.selected
        ? "" + p.theme.colors.blue['50']
        : p.theme.colors.blackAlpha['50'];
}, FontDeleteButton);
FontButtonContainer.defaultProps = {
    display: 'flex',
    alignItems: 'center'
};
var state = mobx_1.observable({
    isAddingFont: false,
    replacingFontIndex: undefined
});
var Toolbar = styled_1["default"](core_1.Box)(templateObject_4 || (templateObject_4 = __makeTemplateObject([""], [""])));
exports.LeftPanelFontsTab = mobx_react_1.observer(function (_a) {
    var target = _a.target;
    var store = root_store_1.useStore().editorPageStore;
    var style = store.styleOptions[target];
    var words = style.words;
    var fonts = store.getAvailableFonts();
    return (<>
        <core_1.Stack spacing="0">
          <core_1.Stack direction="row">
            <core_1.InputGroup flex={1} size="md">
              <core_1.InputLeftElement children={<core_1.Icon name="search"/>}/>
              <core_1.Input placeholder="Filter..."/>
            </core_1.InputGroup>

            <core_1.Menu>
              <core_1.MenuButton marginLeft="auto" as={core_1.Button} outline="none" aria-label="menu" color="black" display="inline-flex">
                <DotsThreeVertical_1.DotsThreeVertical size={18}/>
              </core_1.MenuButton>
              <core_1.MenuList>
                <core_1.MenuItem>Upload custom font...</core_1.MenuItem>
                <core_1.MenuItem>Reset defaults</core_1.MenuItem>
              </core_1.MenuList>
            </core_1.Menu>
          </core_1.Stack>

          <core_1.Box mt="3">
            {fonts.map(function (font) {
        var fontStyle = font.style;
        var isSelected = style.words.fontIds.find(function (f) { return f === fontStyle.fontId; }) != null;
        return (<FontButtonContainer key={fontStyle.fontId} aria-label={"Font " + fontStyle.title} selected={isSelected}>
                  <FontButton onClick={function (evt) {
            if (evt.metaKey) {
                style.words.fontIds =
                    isSelected && style.words.fontIds.length > 1
                        ? style.words.fontIds.filter(function (f) { return f !== fontStyle.fontId; })
                        : lodash_1.uniq(__spreadArrays(style.words.fontIds, [fontStyle.fontId]));
            }
            else {
                style.words.fontIds = [fontStyle.fontId];
            }
        }}>
                    <img src={fontStyle.thumbnail}/>
                  </FontButton>
                </FontButtonContainer>);
    })}
          </core_1.Box>
        </core_1.Stack>
      </>);
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
