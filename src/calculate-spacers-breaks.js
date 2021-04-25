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
  return {height, width, widthProportional};
}

function heightAccumulator(font, fontSize, lineHeight, dummy) {
  return (lines) => {
    return getLineInfo(lines.join("<br>"), font, fontSize, lineHeight, dummy).height;
  }
}

function getBreaks(sizeArray) {
  const widths = sizeArray.map(size => size.widthProportional);
  const diffs = widths.map((width, index, widths) => index == 0 ? 0 : Math.abs(width - widths[index - 1]));
  const threshold = 0.12;
  let criticalPoints = diffs.reduce((indices, curr, currIndex) => {
    //Breaks before line 4 are flukes
    if (currIndex < 4) return indices;
    if (curr > threshold) {
      //There should never be two breakpoints in a row
      const prevIndex = indices[indices.length - 1];
      if (prevIndex && (currIndex - prevIndex) == 1) {
        return indices;
      }
      indices.push(currIndex);
    }
    return indices;
  }, []);
  const averageAround = points => points.map((point, i) => {
    let nextPoint;
    if (!nextPoint) {
      nextPoint = Math.min(point + 3, widths.length - 1);
    }
    let prevPoint;
    if (!prevPoint) {
      prevPoint = Math.max(point - 3, 0);
    }
    /*
      Note that these are divided by the width of the critical point line such that
      we get the average width of the preceeding and proceeding chunks *relative*
      to the critical line.
     */
    const before = (widths.slice(prevPoint, point).reduce((acc, curr) => acc + curr) /
      (point - prevPoint)) / widths[point];
    let after;
    if ( point + 1 >= nextPoint) {
      after = widths[nextPoint] / widths[point];
    } else {
        after =(widths.slice(point + 1, nextPoint).reduce((acc, curr) => acc + curr) /
          (nextPoint - point - 1)) / widths[point];
    }
    return {
      point,
      before,
      after,
      diff: Math.abs(after - before)
    }
   })
  const aroundDiffs = averageAround(criticalPoints)
    .sort( (a,b) => b.diff - a.diff);
  criticalPoints = aroundDiffs
    .filter( ({diff}) => diff > 0.22)
    .map( ({point}) => point)
  return criticalPoints.sort( (a, b) => a - b);
}

export function onlyOneCommentary(lines, options, dummy) {
  const fontFamily = options.fontFamily.inner;
  const fontSize = options.fontSize.side;
  const lineHeight = parseFloat(options.lineHeight.side);
  const sizes = lines.map(text => getLineInfo(text, fontFamily, fontSize, lineHeight, dummy));
  const breaks = getBreaks(sizes);
  if (breaks.length == 3) {
    const first = lines.slice(0, breaks[1]);
    const second = lines.slice(breaks[1]);
    return [first, second];
  }
}

export function calculateSpacersBreaks(mainArray, rashiArray, tosafotArray, options, dummy) {
  const lines = {
    main: mainArray,
    rashi: rashiArray,
    tosafot: tosafotArray
  }

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


  const mainOptions = [parsedOptions.fontFamily.main, parsedOptions.fontSize.main, parsedOptions.lineHeight.main];
  const commentaryOptions = [parsedOptions.fontFamily.inner, parsedOptions.fontSize.side, parsedOptions.lineHeight.side];
  
  const sizes = {};
  sizes.main = lines.main.map(text => getLineInfo(text, ...mainOptions, dummy));
  ["rashi", "tosafot"].forEach(text => {
    sizes[text] = lines[text].map(line => getLineInfo(line, ...commentaryOptions, dummy))
  })

  const accumulateMain = heightAccumulator(...mainOptions, dummy);
  const accumulateCommentary = heightAccumulator(...commentaryOptions, dummy);

  const breaks = {};

  ["rashi", "tosafot", "main"].forEach(text => {
    breaks[text] = getBreaks(sizes[text])
      /*
      Hadran lines aren't real candidates for line breaks.
        TODO: Extract this behavior , give it an option/parameter
       */
        .filter(lineNum => !(lines[text][lineNum].includes("hadran"))
    )
  })
  

  const spacerHeights = {
    start: 4.4 * parsedOptions.lineHeight.side,
    inner: null,
    outer: null,
    end: 0,
    exception: 0
  };

  const mainHeight = accumulateMain(lines.main);
  const mainHeightOld = (sizes.main.length) * parsedOptions.lineHeight.main;
  let afterBreak = {
    inner: accumulateCommentary(lines.rashi.slice(4)),
    outer: accumulateCommentary(lines.tosafot.slice(4))
  }

  let afterBreakOld = {
    inner: parsedOptions.lineHeight.side * (sizes.rashi.length - 4),
    outer: parsedOptions.lineHeight.side * (sizes.tosafot.length - 4)
  }

  if (breaks.rashi.length < 1 || breaks.tosafot.length < 1) {
    console.log("Dealing with Exceptions")
    if (breaks.rashi.length < 1) {
      afterBreak.inner = parsedOptions.lineHeight.side * (sizes.rashi.length + 1)
      spacerHeights.exception = 2
    }
    if (breaks.tosafot.length < 1) {
      afterBreak.outer = parsedOptions.lineHeight.side * (sizes.tosafot.length + 1)
      spacerHeights.exception = 2
    }
}
  switch (breaks.main.length) {
    case 0:
      spacerHeights.inner = mainHeight;
      spacerHeights.outer = mainHeight;
      if (breaks.rashi.length == 2) {
        spacerHeights.end = accumulateCommentary(lines.rashi.slice(breaks.rashi[1]))
      } else {
        spacerHeights.end = accumulateCommentary(lines.tosafot.slice(breaks.tosafot[1]))
      }
      console.log("Double wrap")
      break;
    case 1:
      if (breaks.rashi.length != breaks.tosafot.length) {
        if (breaks.tosafot.length == 0) {
          spacerHeights.outer = 0;
          spacerHeights.inner = afterBreak.inner;
          break;
        }
        if (breaks.rashi.length == 0) {
          spacerHeights.inner = 0;
          spacerHeights.outer = afterBreak.outer;
          break;
        }
        let stair;
        let nonstair;
        if (breaks.rashi.length == 1) {
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
    default:
      spacerHeights.inner = afterBreak.inner;
      spacerHeights.outer = afterBreak.outer;
      console.log("No Case Exception")
      break;
  }
  return spacerHeights;
}
