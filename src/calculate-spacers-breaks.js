function getLineInfo(text, font, fontSize, lineHeight, dummy) {
  let testDiv = document.createElement("span");
  testDiv.style.font = String(fontSize) + "px " + String(font);
  testDiv.style.lineHeight = String(lineHeight) + "px";
  testDiv.innerHTML = text;
  testDiv.style.position = "absolute";
  dummy.append(testDiv);
  const rect = testDiv.getBoundingClientRect();
  const height = rect.height;
  const width = rect.width;
  // console.log("lineInfo", width, text);
  testDiv.remove();
  return { height, width };
}

function calculateSpacersBreaks (mainArray, rashiArray, tosafotArray, options, dummy) {
  const parsedOptions = {
    padding: {
      vertical: parseFloat(options.padding.vertical),
      horizontal: parseFloat(options.padding.horizontal)
    },
    halfway: 0.01 * parseFloat(options.halfway),
    fontFamily: options.fontFamily, // Object of strings
    fontSize: {
      main: parseFloat(options.fontSize.main),
      side: parseFloat(options.fontSize.side),
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

  const [mainDiffs, rashiDiffs, tosafotDiffs] = [mainSizes, rashiSizes, tosafotSizes].map(sizeArray =>
    sizeArray.map(size => size.width).map( (width, index, widths) => index == 0 ? 0 : Math.abs(width - widths[index - 1]))
  );

  const diffs = {
    main: mainDiffs,
    rashi: rashiDiffs,
    tosafot: tosafotDiffs
  }

  const sorted = [mainDiffs, rashiDiffs, tosafotDiffs].map( array => array.map((num, index)=> ({num, index}))).map(diffs => diffs.sort( (a, b) => (b.num - a.num)));
  console.log(sorted);
  const secondDiffs = sorted.map(sizeArray =>
    sizeArray.map( (diffObj, index, diffs) => ({
        num: index == 0 ? 0 : Math.abs(diffObj.num - diffs[index - 1].num),
        index: diffObj.index
      }
    )
  ));
  console.log(secondDiffs);

  function norm(value, array) {
    const min = Math.min(...array);
    const max = Math.max(...array);
    return (value - min) / (max - min);
  }

  const threshold = 100;
  const [mainBreaks, rashiBreaks, tosafotBreaks] = ["main", "rashi", "tosafot"].map(text => diffs[text].reduce( (indices, curr, currIndex) => {
    const normed = norm(curr, diffs[text]);
    // console.log(text, normed, currIndex);
    if (normed > threshold) {
      indices.push(currIndex);
    }
    return indices;
  }, []));
  // console.log("main", mainBreaks, "rashi", rashiBreaks, "tosafot", tosafotBreaks);

  const spacerHeights = {
    start: 4.5 * parsedOptions.lineHeight.side,
    inner: null,
    outer: null,
    end: 0,
  };

  const accumulateHeight = sizes => sizes.map(size => size.height).reduce( (accumulatedHeight, currHeight) => accumulatedHeight + currHeight, 0);
  const mainHeight = accumulateHeight(mainSizes);
  const afterBreak = {
    inner: accumulateHeight(rashiSizes.slice(3)) + parsedOptions.lineHeight.side,
    outer: accumulateHeight(tosafotSizes.slice(3)) + parsedOptions.lineHeight.side
  }
  switch (mainBreaks.length) {
    case 0:
      spacerHeights.inner = mainHeight;
      spacerHeights.outer = mainHeight;
      if (rashiBreaks.length == 2) {
        spacerHeights.end = accumulateHeight(rashiSizes.slice(rashiBreaks[1]));
      } else {
        spacerHeights.end = accumulateHeight(tosafotSizes.slice(tosafotBreaks[1]));
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
      console.log("Double Extend")
      break;
  }
  console.log(spacerHeights);
  return spacerHeights;

}

export default calculateSpacersBreaks;