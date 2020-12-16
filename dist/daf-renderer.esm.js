const defaultOptions = {
  contentWidth: "600px",
  padding: {
    vertical: "10px",
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
  const innerModifier = 1; // Rashi font causes a percentage difference error 113% when it comes to browser rendering
  const outerModifier = 1;
  const mainModifier = 1; // Vilna font causes a percentage difference error of 95% when it comes to browser rendering

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

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z = "/*Keep this as the first rule in the file*/\n.styles_dafRoot__1QUlM {\n  --contentWidth: 0px;\n  --padding-horizontal: 0px;\n  --padding-vertical: 0px;\n  --halfway: 50%;\n\n  --fontFamily-inner: \"Rashi\";\n  --fontFamily-outer: \"Tosafot\";\n  --fontFamily-main: \"Vilna\";\n\n  --fontSize-main: 0px;\n  --fontSize-side: 0px;\n\n  --lineHeight-main: 0px;\n  --lineHeight-side: 0px;\n\n  --mainMargin-start: 50%;\n  --sidePercent: calc(calc(100% - var(--mainMargin-start))/2);\n  --remainderPercent: calc(100% - var(--sidePercent));\n\n  --innerFloat: left;\n  --outerFloat: right;\n\n  --spacerHeights-start: 0px;\n  --spacerHeights-outer: 0px;\n  --spacerHeights-inner: 0px;\n  --spacerHeights-end: 0px;\n\n}\n\n/*Containers*/\n.styles_dafRoot__1QUlM, .styles_outer__abXQX, .styles_inner__x-amJ, .styles_main__BHTRd {\n  position: absolute;\n  width: var(--contentWidth);\n  pointer-events: none;\n  box-sizing: content-box;\n}\n\n/*Float changes with amud*/\n.styles_inner__x-amJ .styles_spacer__2T7TS, .styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY{\n  float: var(--innerFloat);\n}\n\n.styles_outer__abXQX .styles_spacer__2T7TS, .styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi{\n  float: var(--outerFloat);\n}\n\n\n/*Spacer widths determined by options*/\n.styles_inner__x-amJ .styles_spacer__2T7TS, .styles_outer__abXQX .styles_spacer__2T7TS {\n  width: var(--halfway);\n}\n.styles_spacer__2T7TS.styles_mid__dcgUr {\n  width: var(--remainderPercent);\n}\n\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_start__AwkfY {\n  width: var(--contentWidth);\n}\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi, .styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  width: var(--sidePercent);\n}\n\n/*Spacer heights determined by algorithm*/\n.styles_spacer__2T7TS.styles_start__AwkfY {\n  height: var(--spacerHeights-start);\n}\n\n.styles_spacer__2T7TS.styles_end__2wr6A {\n  height: var(--spacerHeights-end);\n}\n\n.styles_inner__x-amJ .styles_spacer__2T7TS.styles_mid__dcgUr, .styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi {\n  height: var(--spacerHeights-inner);\n}\n.styles_outer__abXQX .styles_spacer__2T7TS.styles_mid__dcgUr, .styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  height: var(--spacerHeights-outer);\n}\n\n/*Margins!*/\n.styles_spacer__2T7TS.styles_start__AwkfY, .styles_spacer__2T7TS.styles_end__2wr6A, .styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi, .styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  margin-left: calc(0.5 * var(--padding-horizontal));\n  margin-right: calc(0.5 * var(--padding-horizontal));\n}\n\n.styles_spacer__2T7TS.styles_mid__dcgUr, .styles_main__BHTRd .styles_text__1_7-z {\n  margin-top: var(--padding-vertical);\n}\n\n.styles_spacer__2T7TS.styles_mid__dcgUr, .styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi, .styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  margin-bottom: calc(2 * var(--padding-vertical));\n}\n\n\n/*Text*/\n.styles_text__1_7-z {\n  direction: rtl;\n  text-align: justify;\n}\n\n.styles_text__1_7-z span {\n  pointer-events: auto;\n}\n\n.styles_main__BHTRd .styles_text__1_7-z {\n  font-family: var(--fontFamily-main);\n  font-size: var(--fontSize-main);\n  line-height: var(--lineHeight-main);\n}\n\n.styles_inner__x-amJ .styles_text__1_7-z, .styles_outer__abXQX .styles_text__1_7-z {\n  font-size: var(--fontSize-side);\n  line-height: var(--lineHeight-side);\n}\n\n.styles_inner__x-amJ .styles_text__1_7-z {\n  font-family: var(--fontFamily-inner);\n}\n\n.styles_outer__abXQX .styles_text__1_7-z {\n  font-family: var(--fontFamily-outer);\n}\n";
var classes = {"dafRoot":"styles_dafRoot__1QUlM","outer":"styles_outer__abXQX","inner":"styles_inner__x-amJ","main":"styles_main__BHTRd","spacer":"styles_spacer__2T7TS","outerMid":"styles_outerMid__2WtcY","innerMid":"styles_innerMid__27MCi","mid":"styles_mid__dcgUr","start":"styles_start__AwkfY","end":"styles_end__2wr6A","text":"styles_text__1_7-z"};
styleInject(css_248z);

function setVars(object, prefix = "") {
  const varsRule = Array.prototype.find.call
  (document.styleSheets, sheet => sheet.rules[0].selectorText == `.${classes.dafRoot}`)
    .rules[0];

  Object.entries(object).forEach(([key, value]) => {
    if (typeof value == "string") {
      varsRule.style.setProperty(`--${prefix}${key}`, value);
    } else if (typeof value == "object") {
      setVars(value, `${key}-`);
    }
  });
}


var styleManager = {
  applyClasses(containers) {
    const add = (className, ...elements) => elements.forEach(el => el.classList.add(className));
    //containers
    add(classes.dafRoot, containers.el);
    ["main", "inner", "outer"].forEach(containerName => add(classes[containerName], containers[containerName].el));
    //spacers
    const allThree = [containers.outer, containers.inner, containers.main];
    add(classes.spacer, ...allThree.flatMap(c => Object.values(c.spacers)));
    add(classes.start, ...allThree.map(c => c.spacers.start));
    ["end", "mid"].forEach(spacer => add(classes[spacer], containers.outer.spacers[spacer], containers.inner.spacers[spacer]));
    add(classes.innerMid, containers.main.spacers.inner);
    add(classes.outerMid, containers.main.spacers.outer);
    //text containers
    add(classes.text, ...allThree.map(c => c.text));
  },
  updateOptionsVars(options) {
    setVars(options);
  },
  updateSpacersVars(spacerHeights) {
    setVars(
      Object.fromEntries(
        Object.entries(spacerHeights).map(([key, value]) => ([key, String(value) + 'px']))
      ),
      "spacerHeights-"
    );
  },
  updateIsAmudB(amudB) {
    setVars({
      innerFloat: amudB ? "right" : "left",
      outerFloat: amudB ? "left" : "right"
    });
  }
};

function el (tag, parent) {
  const newEl = document.createElement(tag);
  if (parent) parent.append(newEl);
  return newEl;
}

function div (parent) {
  return el("div", parent);
}

function span (parent) {
  return el("span", parent);
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
    main:  span(containers.main.text),
    inner:  span(containers.inner.text),
    outer:  span(containers.outer.text)
  };

  const clonedOptions = JSON.parse(JSON.stringify(options)); //TODO: faster clone?

  styleManager.applyClasses(containers);
  styleManager.updateOptionsVars(clonedOptions);

  return {
    containers,
    spacerHeights: {
      start: 0,
      inner: 0,
      outer: 0,
      end: 0
    },
    amud: "a",
    render (main, inner, outer, amud = "a") {
      if (this.amud != amud) {
        this.amud = amud;
        styleManager.updateIsAmudB(amud == "b");
      }
      this.spacerHeights = calculateSpacers(main, inner, outer, options, containers.dummy);
      console.dir(this.spacerHeights);
      styleManager.updateSpacersVars(this.spacerHeights);
      textSpans.main.innerHTML = main;
      textSpans.inner.innerHTML = inner;
      textSpans.outer.innerHTML = outer;
    },
  }
}

export default renderer;
