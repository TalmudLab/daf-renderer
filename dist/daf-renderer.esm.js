const defaultOptions = {
  contentWidth: "600px",
  padding: {
    vertical: "16px",
    horizontal: "16px",
  },
  halfway: "50%",
  fontFamily: {
    inner: "Rashi",
    outer: "Rashi",
    main: "Vilna"
  },
  fontSize: {
    main: "15px",
    side: "10.5px"
  },
  lineHeight: {
    main: "17px",
    side: "14px",
  },
  mainMargin: {
    start: "50%",
  },
};

const container = width => ({
  position: "absolute",
  width: width,
  pointerEvents: "none",
  boxSizing: "content-box"
});

const horizPaddingMargins = horizPadding => ({
    marginLeft: `${horizPadding * 0.5}px`,
    marginRight: `${horizPadding * 0.5}px`,
});

const spacer = (halfway, float, spacerHeight) => ({
  width: halfway,
  float: float,
  height: `${spacerHeight}px`
});

const mainSpacerStart = (width, spacerHeight) => ({
  width: width,
  height: `${spacerHeight}px`
});

const text = (fontSize, fontFamily, lineHeight) => ({
  fontFamily,
  fontSize,
  lineHeight,
  direction: "rtl",
  textAlign: "justify",
});
function calculateStyles (options, spacerHeights, amudB = true) {
  const floats = {
    inner: amudB ? "right" : "left",
    outer: amudB ? "left" : "right"
  };


  const sidePercentVal = ((100 - parseInt(options.mainMargin.start))/2);
  const sidePercent = sidePercentVal + "%"; // This is the percentage of the width for one commentary
  const remainderPercent = 100 - sidePercentVal + "%"; // This is the remainder of percentage of the width, side and remainder should add up to 100

  const addHorizMargins = style => Object.assign(style,horizPaddingMargins(parseInt(options.padding.horizontal)));
  const addMarginTop = style => Object.assign(style, {marginTop: options.padding.vertical});
  const addMarginBottom = style => Object.assign(style, {marginBottom: `calc(2 * ${options.padding.vertical})`});

  const sideSpacers = side => ({
    start: addHorizMargins(spacer(options.halfway, floats[side], spacerHeights.start)),
    mid: addMarginTop(addMarginBottom(spacer(remainderPercent, floats[side], spacerHeights[side]))),
    end: addHorizMargins(spacer(options.halfway, floats[side], spacerHeights.end))
  });

  const mainSpacers = {
    start: addHorizMargins(mainSpacerStart(options.contentWidth, spacerHeights.start)),
    inner: addMarginBottom(addHorizMargins(spacer(sidePercent, floats.outer, spacerHeights.inner))),
    outer: addMarginBottom(addHorizMargins(spacer(sidePercent, floats.inner, spacerHeights.outer))),
  };
  return {
    container: container(options.contentWidth),
    outer: {
      spacers: sideSpacers("outer"),
      text: text(options.fontSize.side, options.fontFamily.outer, options.lineHeight.side)
    },
    inner: {
      spacers: sideSpacers("inner"),
      text: text(options.fontSize.side, options.fontFamily.inner, options.lineHeight.side)
    },
    main: {
      spacers: mainSpacers,
      text: addMarginTop(text(options.fontSize.main, options.fontFamily.main, options.lineHeight.main))
    }
  }
}

function getAreaOfText(text, font, fs, width, lh, dummy) {
  let testDiv = document.createElement("div");
  testDiv.style.font = String(fs) + "px " + String(font);
  testDiv.style.width = String(width) + "px"; //You can remove this, but it may introduce unforseen problems
  testDiv.style.lineHeight = String(lh) + "px";
  testDiv.innerHTML = text;
  dummy.append(testDiv);
  // console.log(testDiv.clientHeight, testDiv.clientWidth)
  let test_area = Number(testDiv.clientHeight * testDiv.clientWidth);
  testDiv.remove();
  return test_area;
}

function calculateSpacers(mainText, innerText, outerText, options, dummy) {
  const parsedOptions = {
    width: parseFloat(options.contentWidth),
    padding: {
      vertical: parseFloat(options.padding.vertical),
      horizontal: parseFloat(options.padding.horizontal)
    },
    halfway: 0.01 * parseFloat(options.halfway),
    fontFamily: options.fontFamily,
    fontSize: {
      main: parseFloat(options.fontSize.main),
      side: parseFloat(options.fontSize.side),
    },
    lineHeight: {
      main: parseFloat(options.lineHeight.main),
      side: parseFloat(options.lineHeight.side),
    },
    mainMargin: {
      start: 0.01 * parseFloat(options.mainMargin.start),
      content: 0.01 * parseFloat(options.mainMargin.content)
    }
  };

  const midWidth = Number(parsedOptions.width * parsedOptions.mainMargin.start) - 2*parsedOptions.padding.horizontal; //main middle strip
  const topWidth = Number(parsedOptions.width * parsedOptions.halfway) - parsedOptions.padding.horizontal; //each commentary top
  const sideWidth = Number(parsedOptions.width * (1 - parsedOptions.mainMargin.start)/2); //each commentary widths, dont include padding, sokeep it constant

  // These values are unique to the font you are using: 
  // If you change fonts, you will have to modify these numbers, but the value should always be close to 1.
  const innerModifier = 1.13; // Rashi font causes a percentage difference error 113% when it comes to browser rendering
  const outerModifier = 1.13;
  const mainModifier = 0.95; // Vilna font causes a percentage difference error of 95% when it comes to browser rendering

  // We could probably put this somewhere else, it was meant to be a place for all the padding corrections,
  // but there turned out to only be one
  const paddingAreas = {
    name: "paddingAreas",
    horizontalSide: sideWidth * parsedOptions.padding.vertical,
  };

  const adjustCommentaryArea = (area, lineHeight) => area - (4 * lineHeight * topWidth); //remove area of the top 4 lines
  const main = {
    name: "main",
    width: midWidth,
    text: mainText,
    lineHeight: parsedOptions.lineHeight.main,
    area: getAreaOfText(mainText, parsedOptions.fontFamily.main, parsedOptions.fontSize.main, midWidth, parsedOptions.lineHeight.main, dummy) 
    * mainModifier,
    length: null,
    height: null,
  };
  const outer = {
    name: "outer",
    width: sideWidth,
    text: outerText,
    lineHeight: parsedOptions.lineHeight.side,
    area: adjustCommentaryArea(
      getAreaOfText(outerText, parsedOptions.fontFamily.outer, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy) 
      * outerModifier,
      parsedOptions.lineHeight.side
    ) - paddingAreas.horizontalSide,
    length: null,
    height: null,
  };
  const inner = {
    name: "inner",
    width: sideWidth,
    text: innerText,
    lineHeight: parsedOptions.lineHeight.side,
    area: adjustCommentaryArea(
      getAreaOfText(innerText, parsedOptions.fontFamily.inner, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy) 
      * innerModifier,
      parsedOptions.lineHeight.side
    ) - paddingAreas.horizontalSide,
    length: null,
    height: null,
  };

  const texts = [main, outer, inner];
  texts.forEach (text => text.height = text.area / text.width);

  const perHeight = Array.from(texts).sort( (a,b) => a.height - b.height);

  //There are Three Main Types of Case:
  //Double-Wrap: The main text being the smallest and commentaries wrapping around it
  //Stairs: The main text wrapping around one, but the other wrapping around it
  //Double-Extend: The main text wrapping around both commentaries

  //Main Text is Smallest: Double-Wrap
  //Main Text being Middle: Stairs
  //Main Text Being Largest: Double-Extend

  //First we need to check we have enough commentary to fill the first four lines
  if (inner.height <= 0 && outer.height <= 0){
    console.error("Not Enough Commentary");
    return Error("Not enough commentary");
  }
  const spacerHeights = {
    start: 4 * parsedOptions.lineHeight.side, // For Tzurat Hadaf this will always be the same
    inner: null,
    outer: null,
    end: 0,
  };

  //If Double=Wrap
  if (perHeight[0].name === "main"){
    // console.log("Double-Wrap"); 
    spacerHeights.inner = main.area/midWidth;
    spacerHeights.outer = spacerHeights.inner;
    
    const sideArea = spacerHeights.inner * sideWidth + paddingAreas.horizontalSide;
    const bottomChunk = perHeight[1].area - sideArea;
    const bottomHeight = bottomChunk / topWidth; 
    spacerHeights.end = bottomHeight;
    return spacerHeights;
  }
  // If Stairs, there's one text at the bottom. We will call it THE stair. 
  // The remaining two texts form a "block" that we must compare with that bottom text.
  const blockArea = (main.area + perHeight[0].area);
  const blockWidth = midWidth + sideWidth;
  const blockHeight = blockArea / blockWidth;

  const stair = (perHeight[1].name == "main") ? perHeight[2] : perHeight[1];
  const stairHeight = stair.area / stair.width;

  if (blockHeight < stairHeight) {
    console.log(`Stairs, ${stair.name} is the stair`);
    // This function accounts for extra space that is introduced by padding
    const lilArea = (height1, height2, horizPadding) => (horizPadding) * (height1 - height2);
    const smallest = perHeight[0];
    console.log(smallest.height);
    spacerHeights[smallest.name] = smallest.height;
    spacerHeights[stair.name] = (blockArea - lilArea(blockHeight, spacerHeights[smallest.name], parsedOptions.padding.horizontal)) / blockWidth;
    return spacerHeights
  }
  //If Double Extend
  console.log("Double-Extend");
  spacerHeights.inner = inner.height;
  spacerHeights.outer = outer.height;

  return spacerHeights
}

function el (tag, parent) {
  const newEl = document.createElement(tag);
  if (parent) parent.append(newEl);
  return newEl;
}

function div (parent) {
  return el("div", parent);
}

function textSpan (parent) {
  const span = el("span", parent);
  applyStyles(span, {"pointer-events": "auto"});
  return span;
}

function applyStyles(el, styleObj) {
  Object.assign(el.style, styleObj);
}

function renderer (el, options = defaultOptions) {
  const root = (typeof el === "string") ? document.querySelector(el) : el;
  if (!(root && root instanceof Element && root.tagName.toUpperCase() === "DIV")) {
    throw "Argument must be a div element or its selector"
  }
  const outerContainer = div(root);
  const innerContainer = div(root);
  const mainContainer = div(root);
  const dummy = div(root);
  dummy.id = "dummy";
  const containers = {
    el: root,
    dummy: dummy,
    outer: {
      el: outerContainer,
      spacers: {
        start: div(outerContainer),
        mid: div(outerContainer),
        end: div(outerContainer)
      },
      text: div(outerContainer)
    },
    inner: {
      el: innerContainer,
      spacers: {
        start: div(innerContainer),
        mid: div(innerContainer),
        end: div(innerContainer)
      },
      text: div(innerContainer)
    },
    main: {
      el: mainContainer,
      spacers: {
        start: div(mainContainer),
        inner: div(mainContainer),
        outer: div(mainContainer),
      },
      text: div(mainContainer)
    }
  };

  const textSpans = {
    main: textSpan(containers.main.text),
    inner: textSpan(containers.inner.text),
    outer: textSpan(containers.outer.text)
  };

  return {
    containers,
    options: JSON.parse(JSON.stringify(options)), //TODO: faster clone
    spacerHeights: {
      start: 0,
      inner: 0,
      outer: 0,
      end: 0
    },
    innerRight: true,
    render (mainText, innerText, outerText, amud = "a") {
      this.innerRight = amud == "b";
      this.spacerHeights = calculateSpacers(mainText, innerText, outerText, options, containers.dummy);
      this.updateStyles();
      textSpans.main.innerHTML = mainText;
      textSpans.inner.innerHTML = innerText;
      textSpans.outer.innerHTML = outerText;
    },
    updateStyles () {
      const styles = calculateStyles(this.options, this.spacerHeights, this.innerRight);
      [containers.el, containers.outer.el, containers.inner.el,
        containers.main.el].forEach(el =>
        applyStyles(el, styles.container)
      );
      ["start", "mid", "end"].forEach(key => {
        applyStyles(containers.outer.spacers[key], styles.outer.spacers[key]);
        applyStyles(containers.inner.spacers[key], styles.inner.spacers[key]);
      });
      ["start", "inner", "outer"].forEach(key =>
        applyStyles(containers.main.spacers[key], styles.main.spacers[key])
      );
      ["outer", "inner", "main"].forEach(container => {
        applyStyles(containers[container].text, styles[container].text);
      });
    },
  }
}

export default renderer;
