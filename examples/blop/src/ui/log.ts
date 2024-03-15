import * as Constants from "../constants";

let oldLogsIndex = Infinity;
export var logs: string[] = [];

// export function drawLogs(logDisplay) {
//   var yLine = _constants__WEBPACK_IMPORTED_MODULE_0__.LOG_HEIGHT - 1;
//   var i = 0;

//   var _iterator = _createForOfIteratorHelper(logs),
//     _step;

//   try {
//     for (_iterator.s(); !(_step = _iterator.n()).done; ) {
//       var message = _step.value;

//       if (i >= oldLogsIndex) {
//         message = (0,
//         _graphics_coloredText__WEBPACK_IMPORTED_MODULE_1__.coloredText)(
//           message.replaceAll(/%c{[^}]*}/gm, ""),
//           _constants__WEBPACK_IMPORTED_MODULE_0__.GREYED_COLOR
//         );
//       }

//       var lineCount = (0,
//       _graphics_coloredText__WEBPACK_IMPORTED_MODULE_1__.coloredTextLineCount)(
//         message,
//         _constants__WEBPACK_IMPORTED_MODULE_0__.LOG_TEXT_WIDTH
//       );
//       var textLine = yLine - lineCount + 1;

//       if (textLine < 0) {
//         break;
//       }

//       logDisplay.drawText(0, yLine - lineCount + 1, message, {
//         width: _constants__WEBPACK_IMPORTED_MODULE_0__.LOG_TEXT_WIDTH,
//       });
//       i += 1;
//       yLine -= lineCount;

//       if (yLine < 0) {
//         break;
//       }
//     }
//   } catch (err) {
//     _iterator.e(err);
//   } finally {
//     _iterator.f();
//   }
// }

export function addLog(message: string) {
  // TODO - split at log display width...

  logs.unshift(message);
  if (logs.length > Constants.LOG_HEIGHT + 2) {
    logs.length = Constants.LOG_HEIGHT + 2;
  }

  oldLogsIndex += 1;
}

export function addEmptyLine(limitToOne = true) {
  if (!limitToOne || (logs.length && logs[0] !== "")) {
    addLog("");
  }
}

export function clearLogs() {
  logs = [];
  oldLogsIndex = 0;
}

export function setLogsOld() {
  oldLogsIndex = 0;
}
