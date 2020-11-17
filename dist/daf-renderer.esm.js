const defaultOptions = {
  contentWidth: "500px",
  padding: {
    vertical: "0px",
    horizontal: "10px",
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
    modifier: .69
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
  textAlign: "justify"
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

function roundLine(height, lineHeight, modifier){
  const actualLineHeight = modifier * lineHeight;
  const numLines = Math.ceil(height/(actualLineHeight));
  return numLines * (actualLineHeight);
}

function getAreaOfText(text, font, fs, width, lh, dummy) {
  let testDiv = document.createElement("div");
  testDiv.style.font = String(fs) + "px " + String(font);
  testDiv.style.width = String(width) + "px";
  testDiv.style.lineHeight = String(lh) + "px";
  testDiv.innerHTML = text;
  // testDiv.style.textAlign = "justify";
  dummy.append(testDiv);
  let test_area = Number(testDiv.offsetHeight * testDiv.offsetWidth);
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
      modifier: options.lineHeight.modifier,
    },
    mainMargin: {
      start: 0.01 * parseFloat(options.mainMargin.start),
      content: 0.01 * parseFloat(options.mainMargin.content)
    }
  };

  const midWidth = Number(parsedOptions.width * parsedOptions.mainMargin.start); //main middle strip
  const topWidth = Number(parsedOptions.width * parsedOptions.halfway); //each commentary top
  const sideWidth = Number((parsedOptions.width - midWidth)/2); //each commentary widths

  const paddingAreas = {
    name: "paddingAreas",
    horizontalSide: sideWidth * parsedOptions.padding.vertical,
    verticalTop: 4 * parsedOptions.lineHeight.side * parsedOptions.padding.horizontal, //NOT IMPORTANT
  };

  const adjustCommentaryArea = (area, lineHeight) => area - (4 * lineHeight * topWidth) - paddingAreas.horizontalSide; //remove area of top 4 lines
  const main = {
    name: "main",
    width: midWidth,
    text: mainText,
    lineHeight: parsedOptions.lineHeight.main,
    area: getAreaOfText(mainText, parsedOptions.fontFamily.main, parsedOptions.fontSize.main, midWidth, parsedOptions.lineHeight.main, dummy),
    length: null,
    height: null,
  };
  const outer = {
    name: "outer",
    width: sideWidth,
    text: outerText,
    lineHeight: parsedOptions.lineHeight.side,
    area: adjustCommentaryArea(
      getAreaOfText(outerText, parsedOptions.fontFamily.outer, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy),
      parsedOptions.lineHeight.side
    ),
    length: null,
    height: null,
  };
  const inner = {
    name: "inner",
    width: sideWidth,
    text: innerText,
    lineHeight: parsedOptions.lineHeight.side,
    area: adjustCommentaryArea(
      getAreaOfText(innerText, parsedOptions.fontFamily.inner, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy),
      parsedOptions.lineHeight.side
    ),
    length: null,
    height: null,
  };

  const texts = [main, outer, inner];
  texts.forEach (text => text.height = text.area / text.width);
  texts.forEach (text => text.length = text.height / text.lineHeight);


  const perLength = Array.from(texts).sort( (a,b) => a.length - b.length);
  const perArea = Array.from(texts).sort ( (a,b) => a.area - b.area );
 
  //There are Three Main Types of Case:
  //Double-wrap: The main text being the smallest and commentaries wrapping around it
  //Stairs: The main text wrapping around one, but the other wrapping around it
  //Doublle-Extend: The main text wrapping around both commentaries

  //Main Text is Smallest: Double-Wrap
  //Main Text being Middle: Stairs
  //Main Text Being Largest: Double-Extend

  //First we need to check we have enough commentary to fill the first four lines
  if (inner.length <= 0 && outer.length <= 0){
    console.error("Not Enough Commentary");
    return Error("Not enough commentary");
  }
  const spacerHeights = {
    start: 4 * parsedOptions.lineHeight.side,
    inner: null,
    outer: null,
    end: 0,
  };

  //If Double=Wrap
  if (perLength[0].name === "main"){
    console.log("Double-Wrap"); 
    spacerHeights.inner = main.area/midWidth;
    spacerHeights.outer = spacerHeights.inner;
    const ghostHeight = perLength[1].height;

    const sideArea = spacerHeights.inner * sideWidth + paddingAreas.horizontalSide;


    const bottomChunk = perArea[1] - sideArea;
    const bottomHeight = bottomChunk / topWidth; //also the footer width in this case!
    spacerHeights.end = bottomHeight;  //push the main text up a bit more for the space where the next page's first word would go
    return spacerHeights;
  }
  //If Stairs, there's one text at the bottom. We will call it THE stair. The remaining two texts form a "block" that we must compare with that bottom text.
  const blockArea = (main.area + perLength[0].area);
  const blockWidth = midWidth + sideWidth;
  const blockHeight = blockArea / blockWidth;

  const stair = (perLength[1].name == "main") ? perLength[2] : perLength[1];
  const stairHeight = stair.area / stair.width;

  if (blockHeight < stairHeight) {
    console.log(`Stairs, ${stair} is the stair`);
    // This function gets rid of extra space that is introduced by padding
    const lilArea = (height1, height2, horizPadding) => (horizPadding / 2) * (height1 - height2); //TODO: draw a picture
    const smallest = perLength[0];

    spacerHeights[smallest.name] = roundLine(smallest.height, smallest.lineHeight, parsedOptions.lineHeight.modifier);
    const temp = roundLine(blockHeight, main.lineHeight, parsedOptions.lineHeight.modifier) - 100*parsedOptions.padding.vertical; //it's subtracting height. TODO: make this make sense
    // This is just a temporary (??) fix for the spacing issue and well make it better later
    spacerHeights[stair.name] = (blockArea - lilArea(temp, spacerHeights[smallest.name], parsedOptions.padding.horizontal)) / blockWidth;
    return spacerHeights
  }
  //If Double Extend
  console.log("Double-Extend");
  spacerHeights.inner = roundLine(inner.height, inner.lineHeight, parsedOptions.lineHeight.modifier);
  spacerHeights.outer = roundLine(outer.height, outer.lineHeight, parsedOptions.lineHeight.modifier);

  return spacerHeights
}

function div (parent) {
  const newEl = document.createElement("div");
  if (parent) parent.append(newEl);
  return newEl;
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
      this.spacerHeights = calculateSpacers(mainText, innerText, outerText, options, this.containers.dummy);
      this.updateStyles();
      this.containers.main.text.innerHTML = mainText;
      this.containers.inner.text.innerHTML = innerText;
      this.containers.outer.text.innerHTML = outerText;
    },
    updateStyles () {
      const styles = calculateStyles(this.options, this.spacerHeights, this.innerRight);
      [this.containers.el, this.containers.outer.el, this.containers.inner.el,
        this.containers.main.el].forEach(el =>
        applyStyles(el, styles.container)
      );
      ["start", "mid", "end"].forEach(key => {
        applyStyles(this.containers.outer.spacers[key], styles.outer.spacers[key]);
        applyStyles(this.containers.inner.spacers[key], styles.inner.spacers[key]);
      });
      ["start", "inner", "outer"].forEach(key =>
        applyStyles(this.containers.main.spacers[key], styles.main.spacers[key])
      );
      ["outer", "inner", "main"].forEach(container => {
        applyStyles(this.containers[container].text, styles[container].text);
      });
    },
  }
}

export default renderer;
