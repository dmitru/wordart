"use strict";
exports.__esModule = true;
var mobx_react_1 = require("mobx-react");
var root_store_1 = require("services/root-store");
var Slider_1 = require("components/shared/Slider");
var shared_1 = require("components/Editor/components/shared");
var Box_1 = require("components/shared/Box");
var react_1 = require("react");
var core_1 = require("@chakra-ui/core");
var anglePresets = [
    { kind: 'horizontal', title: 'Horizontal', getAngles: function () { return [0]; } },
    { kind: 'vertical', title: 'Vertical', getAngles: function () { return [-90]; } },
    {
        kind: 'hor-ver',
        title: 'Horizontal / Vertical',
        getAngles: function () { return [0, -90]; }
    },
    {
        kind: 'hor-ver-diagonal',
        title: 'Horizontal / Vertical / Diagonal',
        getAngles: function () { return [0, -90, -45, 45]; }
    },
    { kind: 'diagonal', title: 'Diagonal', getAngles: function () { return [45, -45]; } },
    { kind: 'diagonal up', title: 'Diagonal Up', getAngles: function () { return [-45]; } },
    { kind: 'diagonal down', title: 'Diagonal Down', getAngles: function () { return [45]; } },
    { kind: '15 up', title: 'Sloping Up', getAngles: function () { return [-15]; } },
    { kind: '15 down', title: 'Sloping Down', getAngles: function () { return [15]; } },
    { kind: '15', title: 'Sloping', getAngles: function () { return [15, -15]; } },
    {
        kind: 'random',
        title: 'Random',
        getAngles: function () {
            return Array(8)
                .fill(null)
                .map(function (a) { return -90 + Math.round(180 * Math.random()); });
        }
    },
];
exports.LeftPanelLayoutTab = mobx_react_1.observer(function (_a) {
    var target = _a.target;
    var editorPageStore = root_store_1.useStore().editorPageStore;
    var style = editorPageStore.styleOptions[target];
    var visualize = react_1.useCallback(function () {
        // editorPageStore.editor?.generateShapeItems({ style })
    }, []);
    return (<>
        {style.words.wordList.length > 0 && (<Box_1.Box mb="5">
            <core_1.Heading size="md" mt="2" mb="3">
              Words
            </core_1.Heading>

            <Box_1.Box mb="3">
              <Slider_1.Slider label="Size" value={style.layout.wordsMaxSize} onChange={function (value) {
        var val = value;
        style.layout.wordsMaxSize = val;
    }} onAfterChange={visualize} min={20} max={100} step={1}/>
            </Box_1.Box>

            <Box_1.Box>
              {anglePresets.map(function (preset) { return (<core_1.Button key={preset.kind} onClick={function () {
        style.words.angles.preset = preset.kind;
        style.words.angles.angles = preset.getAngles();
    }} variantColor={preset.kind === style.words.angles.preset
        ? 'primary'
        : undefined}>
                  {preset.title}
                </core_1.Button>); })}
            </Box_1.Box>
            {style.words.angles.preset === 'custom' && (<Slider_1.Slider label="Angle" value={style.words.angles.angles[0]} onChange={function (value) {
        var val = value;
        style.words.angles.angles = [val];
    }} onAfterChange={visualize} min={-90} max={90} step={1}/>)}
          </Box_1.Box>)}

        {style.icons.iconList.length > 0 && (<Box_1.Box mb="4">
            <shared_1.Label>Icons</shared_1.Label>
            <Slider_1.Slider label="Size" value={style.layout.iconsMaxSize} onChange={function (value) {
        var val = value;
        style.layout.iconsMaxSize = val;
    }} onAfterChange={visualize} min={20} max={100} step={1}/>
            <Slider_1.Slider label="Amount" value={style.layout.iconsProportion} onChange={function (value) {
        var val = value;
        style.layout.iconsProportion = val;
    }} onAfterChange={visualize} min={0} max={100} step={1}/>
          </Box_1.Box>)}

        <Box_1.Box mb="4">
          <core_1.Heading size="md" mb="3" mt="2">
            Placement
          </core_1.Heading>
          
          <Slider_1.Slider label="Density" value={style.layout.itemDensity} onChange={function (value) {
        var val = value;
        style.layout.itemDensity = val;
    }} onAfterChange={visualize} min={0} max={100} step={1}/>
          {style.layout.fitWithinShape && (<>
              <Slider_1.Slider label="Shape Offset" value={style.layout.shapePadding} onChange={function (value) {
        var val = value;
        style.layout.shapePadding = val;
    }} onAfterChange={visualize} min={0} max={100} step={1}/>
            </>)}
        </Box_1.Box>
      </>);
});
