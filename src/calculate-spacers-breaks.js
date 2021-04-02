function getLineInfo(text, font, fontSize, lineHeight, dummy) {
  dummy.innerHTML = "";
  let testDiv = document.createElement("span");
  testDiv.style.font = fontSize + " " + String(font);
  testDiv.style.lineHeight = String(lineHeight) + "px";
  testDiv.innerHTML = text;
  testDiv.style.position = "absolute";
  dummy.append(testDiv);
  const rect = testDiv.getBoundingClientRect();
  const height = rect.height;
  const width = rect.width;
  const widthProportional = width / dummy.getBoundingClientRect().width;
  testDiv.remove();
  return { height, width, widthProportional };
}

function getBreaks(sizeArray) {
  const diffs = sizeArray.map(size => size.widthProportional).map((width, index, widths) => index == 0 ? 0 : Math.abs(width - widths[index - 1]));
  const threshold = 0.15;
  return diffs.reduce((indices, curr, currIndex) => {
    // const normed = norm(curr, diffs[text]);
    // console.log(text, normed, currIndex);
    if (curr > threshold) {
      indices.push(currIndex);
    }
    return indices;
  }, []);
}

export function calculateSpacersBreaks(mainArray, rashiArray, tosafotArray, options, dummy) {
  const parsedOptions = {
    padding: {
      vertical: parseFloat(options.padding.vertical),
      horizontal: parseFloat(options.padding.horizontal)
    },
    halfway: 0.01 * parseFloat(options.halfway),
    fontFamily: options.fontFamily, // Object of strings
    fontSize: {
      main: options.fontSize.main,
      side: options.fontSize.side,
    },
    lineHeight: {
      main: parseFloat(options.lineHeight.main),
      side: parseFloat(options.lineHeight.side),
    },
  }


  const mainSizes = mainArray.map(text => getLineInfo(text, parsedOptions.fontFamily.main, parsedOptions.fontSize.main, parsedOptions.lineHeight.main, dummy));
  const [rashiSizes, tosafotSizes] = [rashiArray, tosafotArray].map(
    array => array.map(text => getLineInfo(text, parsedOptions.fontFamily.side, parsedOptions.fontSize.side, parsedOptions.lineHeight.side, dummy))
  );

  const [mainBreaks, rashiBreaks, tosafotBreaks] = [mainSizes, rashiSizes, tosafotSizes].map(getBreaks);

  const spacerHeights = {
    start: 4.4 * parsedOptions.lineHeight.side,
    inner: null,
    outer: null,
    end: 0,
  };

  const accumulateHeight = sizes => sizes.map(size => size.height).reduce((accumulatedHeight, currHeight) => accumulatedHeight + currHeight, 0);
  const mainHeight = (mainSizes.length) * parsedOptions.lineHeight.main; //accumulateHeight(mainSizes);
  let afterBreak = {
    inner: parsedOptions.lineHeight.side * (rashiSizes.length - 4), //accumulateHeight(rashiSizes.slice(3)) + parsedOptions.lineHeight.side,
    outer: parsedOptions.lineHeight.side * (tosafotSizes.length - 4)//accumulateHeight(tosafotSizes.slice(3)) + parsedOptions.lineHeight.side
  }
  if (rashiBreaks.length < 1 || tosafotBreaks.length < 1) {
    if (rashiBreaks.length < 1) {
      afterBreak.inner = parsedOptions.lineHeight.side * (rashiSizes.length + 1)
    }
    if (tosafotBreaks.length < 1) {
      afterBreak.outer = parsedOptions.lineHeight.side * (tosafotSizes.length + 1)
    }
  }
  switch (mainBreaks.length) {
    case 0:
      spacerHeights.inner = mainHeight;
      spacerHeights.outer = mainHeight;
      if (rashiBreaks.length == 2) {
        spacerHeights.end = parsedOptions.lineHeight.side * (rashiSizes.length - rashiBreaks[1]) //accumulateHeight(rashiSizes.slice(rashiBreaks[1]));
      } else {
        spacerHeights.end = parsedOptions.lineHeight.side * (tosafotSizes.length - tosafotBreaks[1]) //accumulateHeight(tosafotSizes.slice(tosafotBreaks[1]));
      }
      console.log("Double wrap")
      break;
    case 1:
      if (rashiBreaks.length != tosafotBreaks.length) {
        let stair;
        let nonstair;
        if (rashiBreaks.length == 1) {
          stair = "outer";
          nonstair = "inner";
        } else {
          stair = "inner";
          nonstair = "outer";
        }
        spacerHeights[nonstair] = afterBreak[nonstair];
        spacerHeights[stair] = mainHeight;
        console.log("Stairs")
        break;
      }
    case 2:
      spacerHeights.inner = afterBreak.inner;
      spacerHeights.outer = afterBreak.outer;
      console.log(afterBreak.inner, afterBreak.outer)
      console.log("Double Extend")
      break;
    default:
      spacerHeights.inner = afterBreak.inner;
      spacerHeights.outer = afterBreak.outer;
      console.log(afterBreak.inner, afterBreak.outer)
      console.log("No Case Exception")
      break;
  }
  console.log(spacerHeights);
  return spacerHeights;
}
