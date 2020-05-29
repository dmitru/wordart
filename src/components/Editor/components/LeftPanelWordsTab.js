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
exports.__esModule = true;
var core_1 = require("@chakra-ui/core");
var lodash_1 = require("lodash");
var DotsThreeVertical_1 = require("@styled-icons/entypo/DotsThreeVertical");
var styled_1 = require("@emotion/styled");
var mobx_1 = require("mobx");
var mobx_react_1 = require("mobx-react");
var root_store_1 = require("services/root-store");
var Tooltip_1 = require("components/shared/Tooltip");
var stopword_1 = require("stopword");
var WordList = styled_1["default"](core_1.Box)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  height: calc(100vh - 210px);\n  overflow: auto;\n"], ["\n  height: calc(100vh - 210px);\n  overflow: auto;\n"])));
var WordDeleteButton = styled_1["default"](core_1.IconButton)(templateObject_2 || (templateObject_2 = __makeTemplateObject([""], [""])));
var WordRow = styled_1["default"](core_1.Box)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n  width: 100%;\n  padding: 4px 0;\n  display: flex;\n\n  ", " {\n    opacity: 0;\n    transition: 0.2s opacity;\n  }\n\n  &:hover {\n    background: #eee;\n    ", " {\n      opacity: 1;\n    }\n  }\n"], ["\n  width: 100%;\n  padding: 4px 0;\n  display: flex;\n\n  ", " {\n    opacity: 0;\n    transition: 0.2s opacity;\n  }\n\n  &:hover {\n    background: #eee;\n    ", " {\n      opacity: 1;\n    }\n  }\n"])), WordDeleteButton, WordDeleteButton);
var state = mobx_1.observable({
    isShowingImport: false,
    editor: {
        "import": {
            textInput: ''
        }
    }
});
var Toolbar = styled_1["default"](core_1.Box)(templateObject_4 || (templateObject_4 = __makeTemplateObject([""], [""])));
exports.LeftPanelWordsTab = mobx_react_1.observer(function (_a) {
    var target = _a.target;
    var store = root_store_1.useStore().editorPageStore;
    var style = store.styleOptions[target];
    var words = style.words;
    var fonts = store.getAvailableFonts();
    return (<core_1.Box mb="5">
        <core_1.Stack spacing="0">
          <core_1.Stack direction="row" spacing="0">
            <Tooltip_1.Tooltip label="Open advanced words editor..." showDelay={300}>
              <core_1.Button leftIcon="edit">Open editor...</core_1.Button>
            </Tooltip_1.Tooltip>

            <core_1.Button ml="2" leftIcon="arrow-up" onClick={function () {
        state.isShowingImport = true;
    }}>
              Import
            </core_1.Button>

            <core_1.Menu>
              <core_1.MenuButton marginLeft="auto" as={core_1.Button} outline="none" aria-label="menu" color="black" display="inline-flex">
                <DotsThreeVertical_1.DotsThreeVertical size={18}/>
              </core_1.MenuButton>
              <core_1.MenuList>
                <core_1.MenuGroup title="Formatting">
                  <core_1.MenuItem onClick={function () {
        words.wordList = words.wordList.map(function (w) { return (__assign(__assign({}, w), { text: lodash_1.capitalize(w.text) })); });
    }}>
                    Capitalize
                  </core_1.MenuItem>
                  <core_1.MenuItem onClick={function () {
        words.wordList = words.wordList.map(function (w) { return (__assign(__assign({}, w), { text: w.text.toLocaleUpperCase() })); });
    }}>
                    UPPERCASE
                  </core_1.MenuItem>
                  <core_1.MenuItem onClick={function () {
        words.wordList = words.wordList.map(function (w) { return (__assign(__assign({}, w), { text: w.text.toLocaleLowerCase() })); });
    }}>
                    lowercase
                  </core_1.MenuItem>
                </core_1.MenuGroup>

                <core_1.MenuDivider />

                <core_1.MenuItem onClick={function () { return store.clearWords(target); }}>
                  <core_1.Icon name="small-close" size="20px" color="gray.500" mr="2"/>
                  Clear all
                </core_1.MenuItem>
              </core_1.MenuList>
            </core_1.Menu>
          </core_1.Stack>

          <core_1.Stack direction="row" mt="3">
            <core_1.Button variantColor="green" leftIcon="add" onClick={function () { return store.addWord(target); }}>
              Add
            </core_1.Button>

            <core_1.InputGroup flex={1}>
              <core_1.InputLeftElement children={<core_1.Icon name="search"/>}/>
              <core_1.Input placeholder="Filter..."/>
            </core_1.InputGroup>
          </core_1.Stack>

          <WordList mt="2">
            {words.wordList.map(function (word) { return (<WordRow key={word.id}>
                <core_1.Editable ml="2" flex={1} value={word.text} onChange={function (text) {
        store.updateWord(target, word.id, {
            text: text
        });
    }} selectAllOnFocus placeholder="Type new word here...">
                  <core_1.EditablePreview flex={1} width="100%"/>
                  <core_1.EditableInput placeholder="Type new word here..."/>
                </core_1.Editable>

                

                <WordDeleteButton isRound aria-label="Delete" ml="2" mr="2" icon="close" size="xs" onClick={function () { return store.deleteWord(target, word.id); }}>
                  <core_1.Icon name="close"/>
                </WordDeleteButton>
              </WordRow>); })}
          </WordList>
        </core_1.Stack>

        <core_1.Modal size="lg" isOpen={state.isShowingImport} onClose={function () {
        state.isShowingImport = false;
    }}>
          <core_1.ModalOverlay />
          <core_1.ModalContent>
            <core_1.ModalHeader>Import Words</core_1.ModalHeader>
            <core_1.ModalCloseButton />
            <core_1.ModalBody>
              <core_1.Tabs size="md" variant="enclosed">
                <core_1.TabList>
                  <core_1.Tab>Text</core_1.Tab>
                  <core_1.Tab>CSV / Excel</core_1.Tab>
                  <core_1.Tab>Web</core_1.Tab>
                </core_1.TabList>
                <core_1.TabPanels>
                  <core_1.TabPanel>
                    <core_1.Textarea mt="4" minHeight="200px" placeholder="Enter text..." value={state.editor["import"].textInput} onChange={function (evt) {
        state.editor["import"].textInput = evt.target.value;
    }}/>
                    <core_1.Box mt="4" mb="4">
                      <core_1.Stack direction="row" spacing="5">
                        <core_1.Checkbox>Remove common words</core_1.Checkbox>
                        <core_1.Checkbox>Remove numbers</core_1.Checkbox>
                      </core_1.Stack>
                      <core_1.Box>
                        <core_1.Checkbox>
                          Word stemming (e.g. treat “love” and “loves” as one
                          word)
                        </core_1.Checkbox>
                      </core_1.Box>
                    </core_1.Box>
                  </core_1.TabPanel>
                  <core_1.TabPanel>
                    <core_1.Box mt="4">
                      <core_1.Text>
                        <core_1.Link>Learn more</core_1.Link> about importing words from CSV,
                        Excel or Google Sheets.
                      </core_1.Text>
                      <core_1.Textarea mt="3" placeholder="Paste CSV..." value={state.editor["import"].textInput} onChange={function (evt) {
        state.editor["import"].textInput = evt.target.value;
    }}/>
                      <core_1.Box mt="3">
                        <core_1.Text>
                          Or you can choose a CSV file:{' '}
                          <core_1.Button>Open CSV file...</core_1.Button>
                        </core_1.Text>
                      </core_1.Box>
                    </core_1.Box>
                  </core_1.TabPanel>
                </core_1.TabPanels>
              </core_1.Tabs>
            </core_1.ModalBody>

            <core_1.ModalFooter>
              <core_1.Checkbox marginRight="auto">
                Clear word list before importing
              </core_1.Checkbox>
              <core_1.Button ml="3" variantColor="accent" onClick={function () {
        var rawWords = state.editor["import"].textInput
            .split(' ')
            .map(function (word) { return word.toLocaleLowerCase().trim(); });
        var processedWords = stopword_1["default"].removeStopwords(rawWords);
        for (var _i = 0, processedWords_1 = processedWords; _i < processedWords_1.length; _i++) {
            var word = processedWords_1[_i];
            store.addWord(target, word);
        }
        state.isShowingImport = false;
    }}>
                Import
              </core_1.Button>
            </core_1.ModalFooter>
          </core_1.ModalContent>
        </core_1.Modal>
      </core_1.Box>);
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;
