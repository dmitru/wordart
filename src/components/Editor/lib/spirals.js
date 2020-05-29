"use strict";
exports.__esModule = true;
function archimedeanSpiral(nRotations) {
    if (nRotations === void 0) { nRotations = 10; }
    return function (t) {
        return {
            x: t * Math.cos(t * (Math.PI * 2 * nRotations)),
            y: t * Math.sin(t * Math.PI * 2 * nRotations)
        };
    };
}
exports.archimedeanSpiral = archimedeanSpiral;
function rectangularSpiral(width, height) {
    var dy = 4;
    var dx = (dy * width) / height;
    var x = 0;
    var y = 0;
    return function (t) {
        var sign = t < 0 ? -1 : 1;
        // See triangular numbers: T_n = n * (n + 1) / 2.
        switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
            case 0:
                x += dx;
                break;
            case 1:
                y += dy;
                break;
            case 2:
                x -= dx;
                break;
            default:
                y -= dy;
                break;
        }
        return { x: x, y: y };
    };
}
exports.rectangularSpiral = rectangularSpiral;
