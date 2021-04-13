(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.dafRenderer = factory());
}(this, (function () { 'use strict';

  const defaultOptions = {
    contentWidth: "600px",
    mainWidth: "50%",
    padding: {
      vertical: "10px",
      horizontal: "16px",
    },
    innerPadding: "4px",
    outerPadding: "4px",
    halfway: "50%",
    fontFamily: {
      inner: "Rashi",
      outer: "Rashi",
      main: "Vilna"
    },
    direction: "rtl",
    fontSize: {
      main: "15px",
      side: "10.5px"
    },
    lineHeight: {
      main: "17px",
      side: "14px",
    }
  };

  function mergeAndClone (modified, definitional = defaultOptions) {
    const newOptions = {};
    for (const key in definitional) {
      if (key in modified) {
        const defType = typeof definitional[key];
        if (typeof modified[key] !== defType) {
          console.error(`Option ${key} must be of type ${defType}; ${typeof modified[key]} was passed.`);
        }
        if (defType == "object") {
          newOptions[key] = mergeAndClone(modified[key], definitional[key]);
        } else {
          newOptions[key] = modified[key];
        }
      } else {
        newOptions[key] = definitional[key];
      }
    }
    return newOptions;
  }

  function getAreaOfText(text, font, fs, width, lh, dummy) {
    let testDiv = document.createElement("div");
    testDiv.style.font = String(fs) + "px " + String(font);
    testDiv.style.width = String(width) + "px"; //You can remove this, but it may introduce unforseen problems
    testDiv.style.lineHeight = String(lh) + "px";
    testDiv.innerHTML = text;
    dummy.append(testDiv);
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
      mainWidth: 0.01 * parseFloat(options.mainWidth)
    };

    const midWidth = Number(parsedOptions.width * parsedOptions.mainWidth) - 2*parsedOptions.padding.horizontal; //main middle strip
    const topWidth = Number(parsedOptions.width * parsedOptions.halfway) - parsedOptions.padding.horizontal; //each commentary top
    const sideWidth = Number(parsedOptions.width * (1 - parsedOptions.mainWidth)/2); //each commentary widths, dont include padding, sokeep it constant

     const spacerHeights = {
      start: 4.3 * parsedOptions.lineHeight.side,
      inner: null,
      outer: null,
      end: 0,
      exception: 0
    };

    // We are accounting for the special case, where you have line breaks:
    // if (options.lineBreaks) {
    //   console.log("Special Case for Line Breaks")
    //   const main = {
    //       name: "main",
    //       text: mainText,
    //       lineHeight: parsedOptions.lineHeight.main,
    //       top: 0,
    //     }
    //     const outer = {
    //       name: "outer",
    //       text: outerText,
    //       lineHeight: parsedOptions.lineHeight.side,
    //       top: 4,
    //     }
    //     const inner = {
    //       name: "inner",
    //       text: innerText,
    //       lineHeight: parsedOptions.lineHeight.side,
    //       top: 4,
    //   }
    //
    //     const texts = [main, outer, inner];
    //     texts.forEach(body => body.brCount = (body.text.match(/<br>/g) || []).length - body.top);
    //     texts.forEach(body => body.height = (body.brCount * body.lineHeight));
    //     texts.forEach(body => body.unadjustedHeight = ((body.brCount + body.top + 1) * body.lineHeight));
    //     texts.forEach(body => body.unadjustedHeightAlt = ((body.brCount + body.top) * body.lineHeight)*sideWidth/topWidth);
    //     const perHeight = Array.from(texts).sort((a, b) => a.height - b.height);
    //
    //     const exConst = 2.2
    //
    //     //Checking Exceptions:
    //     if (inner.unadjustedHeight <= 0 && outer.unadjustedHeight <= 0){
    //       console.error("No Commentary");
    //       return Error("No Commentary");
    //   };
    //     if (inner.unadjustedHeightAlt/exConst < spacerHeights.start || outer.unadjustedHeightAlt/exConst < spacerHeights.start) {
    //     console.log("Exceptions")
    //       if (inner.unadjustedHeightAlt/exConst <= spacerHeights.start) {
    //           spacerHeights.inner = inner.unadjustedHeight;
    //           spacerHeights.outer = outer.height
    //           return spacerHeights;
    //         }
    //       if (outer.unadjustedHeightAlt/exConst <= spacerHeights.start) {
    //           spacerHeights.outer = outer.unadjustedHeight;
    //           spacerHeights.inner = inner.height;
    //           return spacerHeights;
    //         }
    //       else {
    //         return Error("Inner Spacer Error");
    //       }
    //     };
    //     //If Double=Wrap
    //     if (perHeight[0].name === "main"){
    //       console.log("Double-Wrap");
    //       spacerHeights.inner = main.height;
    //       spacerHeights.outer = main.height;
    //
    //       const brDifference = perHeight[1].brCount - perHeight[0].brCount;
    //       spacerHeights.end = brDifference*perHeight[1].lineHeight;
    //       return spacerHeights;
    //     }
    //
    //     //If Stairs
    //     if (perHeight[1].name === "main") {
    //       console.log("Stairs");
    //       spacerHeights[perHeight[0].name] = perHeight[0].height;
    //       spacerHeights[perHeight[2].name] = main.height;
    //       return spacerHeights;
    //     }
    //
    //     //If Double Extend
    //     console.log("Double-Extend")
    //     spacerHeights.inner = inner.height + (inner.height/inner.height**2)*inner.lineHeight;
    //     spacerHeights.outer = outer.height +  (inner.height/inner.height**2)*outer.lineHeight;
    //     return spacerHeights
    // }


    // We could probably put this somewhere else, it was meant to be a place for all the padding corrections,
    // but there turned out to only be one
    const paddingAreas = {
      name: "paddingAreas",
      horizontalSide: sideWidth * parsedOptions.padding.vertical,
    };


    const topArea = (lineHeight) => ((4 * lineHeight * topWidth)); //remove area of the top 4 lines
    

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
      area: getAreaOfText(outerText, parsedOptions.fontFamily.outer, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy) 
            - topArea(parsedOptions.lineHeight.side),
      length: null,
      height: null,
    };
    const inner = {
      name: "inner",
      width: sideWidth,
      text: innerText,
      lineHeight: parsedOptions.lineHeight.side,
      area:
        getAreaOfText(innerText, parsedOptions.fontFamily.inner, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy) 
        - topArea(parsedOptions.lineHeight.side),
      length: null,
      height: null,
    };

    const texts = [main, outer, inner];
    texts.forEach(text => text.height = text.area / text.width);
    texts.forEach(text => text.unadjustedArea = text.area + topArea(parsedOptions.lineHeight.side));
    texts.forEach(text => text.unadjustedHeight = text.unadjustedArea / text.width);

    const perHeight = Array.from(texts).sort((a, b) => a.height - b.height);
   
    //There are Three Main Types of Case:
    //Double-Wrap: The main text being the smallest and commentaries wrapping around it
    //Stairs: The main text wrapping around one, but the other wrapping around it
    //Double-Extend: The main text wrapping around both commentaries

    //Main Text is Smallest: Double-Wrap
    //Main Text being Middle: Stairs
    //Main Text Being Largest: Double-Extend

    //First we need to check we have enough commentary to fill the first four lines
    if (inner.height <= 0 && outer.height <= 0){
      console.error("No Commentary");
      return Error("No Commentary");
    }
   
    // This is a case that we have to decice what to do with, when there is not enough commentary on both sides to fill the lines. 
    if (inner.height <= spacerHeights.start && outer.height <= spacerHeights.start) {
      console.error("Not Enough Commentary to Fill Four Lines");
      return Error("Not Enough Commentary");
    }
    // We are going to deal with our first edge case when there is either only one commentary
    // Or where there is enough of one commentary, but not four lines of the other.
    if (inner.unadjustedHeight  <= spacerHeights.start || outer.unadjustedHeight  <= spacerHeights.start) {
      if (inner.unadjustedHeight  <= spacerHeights.start) {
        spacerHeights.inner = inner.unadjustedHeight;
        spacerHeights.outer = (outer.unadjustedArea - parsedOptions.width * 4 * parsedOptions.lineHeight.side) / sideWidth;
        spacerHeights.exception = 1;
        return spacerHeights;
      }
      if (outer.unadjustedHeight <= spacerHeights.start) {
        spacerHeights.outer = outer.unadjustedHeight;

        spacerHeights.inner = (inner.unadjustedArea - parsedOptions.width * 4 * parsedOptions.lineHeight.side) / sideWidth;
        spacerHeights.exception = 2;
        return spacerHeights;
      }
      else {
        return Error("Inner Spacer Error");
      }
    }
    //If Double=Wrap
    if (perHeight[0].name === "main"){
      console.log("Double-Wrap"); 
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

  var css_248z = "/*Keep this as the first rule in the file*/\n.styles_dafRoot__1QUlM {\n  --contentWidth: 0px;\n  --padding-horizontal: 0px;\n  --padding-vertical: 0px;\n  --halfway: 50%;\n\n  --fontFamily-inner: \"Rashi\";\n  --fontFamily-outer: \"Tosafot\";\n  --fontFamily-main: \"Vilna\";\n  --direction: \"rtl\";\n\n  --fontSize-main: 0px;\n  --fontSize-side: 0px;\n\n  --lineHeight-main: 0px;\n  --lineHeight-side: 0px;\n\n  --mainWidth: 0%;\n  --mainMargin-start: var(--mainWidth);\n  --sidePercent: calc(calc(100% - var(--mainMargin-start)) / 2);\n  --remainderPercent: calc(100% - var(--sidePercent));\n\n  --innerFloat: left;\n  --outerFloat: right;\n\n  --spacerHeights-start: 0px;\n  --spacerHeights-outer: 0px;\n  --spacerHeights-inner: 0px;\n  --spacerHeights-end: 0px;\n\n  /*Edge Cases*/\n  --hasInnerStartGap: 0;\n  --hasOuterStartGap: 0;\n  --innerStartWidth: 50%;\n  --innerPadding: 0px;\n  --outerStartWidth: 50%;\n  --outerPadding: 0px;\n}\n\n/*Containers*/\n.styles_dafRoot__1QUlM,\n.styles_outer__abXQX,\n.styles_inner__x-amJ,\n.styles_main__BHTRd {\n  position: absolute;\n  width: var(--contentWidth);\n  pointer-events: none;\n  box-sizing: content-box;\n}\n\n/*Float changes with amud*/\n.styles_inner__x-amJ .styles_spacer__2T7TS,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  float: var(--innerFloat);\n}\n\n.styles_outer__abXQX .styles_spacer__2T7TS,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi {\n  float: var(--outerFloat);\n}\n\n/*Spacer widths determined by options*/\n.styles_inner__x-amJ .styles_spacer__2T7TS,\n.styles_outer__abXQX .styles_spacer__2T7TS {\n  width: var(--halfway);\n}\n.styles_spacer__2T7TS.styles_mid__dcgUr {\n  width: var(--remainderPercent);\n}\n\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_start__AwkfY {\n  width: var(--contentWidth);\n}\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  width: var(--sidePercent);\n}\n\n/*Spacer heights determined by algorithm*/\n.styles_spacer__2T7TS.styles_start__AwkfY {\n  height: var(--spacerHeights-start);\n}\n\n.styles_spacer__2T7TS.styles_end__2wr6A {\n  height: var(--spacerHeights-end);\n}\n\n.styles_inner__x-amJ .styles_spacer__2T7TS.styles_mid__dcgUr,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi {\n  height: var(--spacerHeights-inner);\n}\n.styles_outer__abXQX .styles_spacer__2T7TS.styles_mid__dcgUr,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  height: var(--spacerHeights-outer);\n}\n\n/*Settings to handle edge Cases*/\n\n.styles_inner__x-amJ .styles_spacer__2T7TS.styles_start__AwkfY {\n  width: var(--innerStartWidth);\n  margin-left: var(--innerPadding);\n  margin-right: var(--innerPadding);\n}\n\n.styles_outer__abXQX .styles_spacer__2T7TS.styles_start__AwkfY {\n  width: var(--outerStartWidth);\n  margin-left: var(--outerPadding);\n  margin-right: var(--outerPadding);\n}\n\n.styles_inner__x-amJ .styles_spacer__2T7TS.styles_start__AwkfY{\n  margin-bottom: calc(var(--padding-vertical) * var(--hasInnerStartGap));\n}\n.styles_outer__abXQX .styles_spacer__2T7TS.styles_start__AwkfY {\n  margin-bottom: calc(var(--padding-vertical) * var(--hasOuterStartGap));\n}\n\n.styles_spacer__2T7TS.styles_mid__dcgUr {\n  clear: both;\n}\n\n/*Margins!*/\n.styles_spacer__2T7TS.styles_start__AwkfY,\n.styles_spacer__2T7TS.styles_end__2wr6A,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  margin-left: calc(0.5 * var(--padding-horizontal));\n  margin-right: calc(0.5 * var(--padding-horizontal));\n}\n\n.styles_spacer__2T7TS.styles_mid__dcgUr,\n.styles_main__BHTRd .styles_text__1_7-z {\n  margin-top: var(--padding-vertical);\n}\n\n.styles_spacer__2T7TS.styles_mid__dcgUr,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi,\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\n  margin-bottom: var(--padding-vertical);\n}\n\n/*Text*/\n.styles_text__1_7-z {\n  direction: var(--direction);\n  text-align: justify;\n}\n\n.styles_text__1_7-z span {\n  pointer-events: auto;\n}\n\n.styles_main__BHTRd .styles_text__1_7-z {\n  font-family: var(--fontFamily-main);\n  font-size: var(--fontSize-main);\n  line-height: var(--lineHeight-main);\n}\n\n.styles_inner__x-amJ .styles_text__1_7-z,\n.styles_outer__abXQX .styles_text__1_7-z {\n  font-size: var(--fontSize-side);\n  line-height: var(--lineHeight-side);\n}\n\n.styles_inner__x-amJ .styles_text__1_7-z {\n  font-family: var(--fontFamily-inner);\n}\n\n.styles_outer__abXQX .styles_text__1_7-z {\n  font-family: var(--fontFamily-outer);\n}\n";
  var classes = {"dafRoot":"styles_dafRoot__1QUlM","outer":"styles_outer__abXQX","inner":"styles_inner__x-amJ","main":"styles_main__BHTRd","spacer":"styles_spacer__2T7TS","outerMid":"styles_outerMid__2WtcY","innerMid":"styles_innerMid__27MCi","mid":"styles_mid__dcgUr","start":"styles_start__AwkfY","end":"styles_end__2wr6A","text":"styles_text__1_7-z"};
  styleInject(css_248z);

  const sideSpacersClasses = {
    start: [classes.spacer, classes.start],
    mid: [classes.spacer, classes.mid],
    end: [classes.spacer, classes.end]
  };

  const containerClasses = {
    el: classes.dafRoot,
    outer: {
      el: classes.outer,
      spacers: sideSpacersClasses,
      text: classes.text,
    },
    inner: {
      el: classes.inner,
      spacers: sideSpacersClasses,
      text: classes.text,
    },
    main: {
      el: classes.main,
      spacers: {
        start: sideSpacersClasses.start,
        inner: [classes.spacer, classes.innerMid],
        outer: [classes.spacer, classes.outerMid]
      },
      text: classes.text
    }
  };

  function addClasses(element, classNames) {
    if (Array.isArray(classNames))
      element.classList.add(...classNames);
    else
      element.classList.add(classNames);
  }

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
    applyClasses(containers, classesMap = containerClasses) {
      for (const key in containers) {
        if (key in classesMap) {
          const value = classesMap[key];
          if (typeof value === "object" && !Array.isArray(value)) {
            this.applyClasses(containers[key], value);
          } else {
            addClasses(containers[key], value);
          }
        }
      }
    },
    updateOptionsVars(options) {
      setVars(options);
    },
    updateSpacersVars(spacerHeights) {
      setVars(
        Object.fromEntries(
          Object.entries(spacerHeights).map(
            ([key, value]) => ([key, String(value) + 'px']))
        ),
        "spacerHeights-"
      );
    },
    updateIsAmudB(amudB) {
      setVars({
        innerFloat: amudB ? "right" : "left",
        outerFloat: amudB ? "left" : "right"
      });
    },
    manageExceptions(spacerHeights) {
      if (!spacerHeights.exception) {
        setVars({
          hasOuterStartGap: "0",
          hasInnerStartGap: "0",
          outerStartWidth: "50%",
          innerStartWidth: "50%",
          innerPadding: "0px",
          outerPadding: "0px",
        });
        return;
      }
      if (spacerHeights.exception === 1) {
        console.log("In Style Exception, Case 1");
        setVars({
          hasInnerStartGap: "1",
          innerStartWidth: "100%",
          outerStartWidth: "0%",
          innerPadding: "0px",
          outerPadding: "0px",
        });
      } else if (spacerHeights.exception === 2) {
        console.log("In Style Exception, Case 2");
        setVars({
          hasOuterStartGap: "1",
          outerStartWidth: "100%",
          innerStartWidth: "0%",
          innerPadding: "0px",
          outerPadding: "0px"
        });
      }
    }
  };

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
     });
    const aroundDiffs = averageAround(criticalPoints)
      .sort( (a,b) => b.diff - a.diff);
    criticalPoints = aroundDiffs
      .filter( ({diff}) => diff > 0.22)
      .map( ({point}) => point);
    return criticalPoints.sort( (a, b) => a - b);
  }

  function onlyOneCommentary(lines, options, dummy) {
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

  function calculateSpacersBreaks(mainArray, rashiArray, tosafotArray, options, dummy) {
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
    };


    const mainOptions = [parsedOptions.fontFamily.main, parsedOptions.fontSize.main, parsedOptions.lineHeight.main];
    const commentaryOptions = [parsedOptions.fontFamily.inner, parsedOptions.fontSize.side, parsedOptions.lineHeight.side];
    const mainSizes = mainArray.map(text => getLineInfo(text, ...mainOptions, dummy));
    const [rashiSizes, tosafotSizes] = [rashiArray, tosafotArray].map(
      array => array.map(text => getLineInfo(text, ...commentaryOptions, dummy))
    );

    const accumulateMain = heightAccumulator(...mainOptions, dummy);
    const accumulateCommentary = heightAccumulator(...commentaryOptions, dummy);

    const [mainBreaks, rashiBreaks, tosafotBreaks] = [mainSizes, rashiSizes, tosafotSizes].map(getBreaks);

    console.log("Breaks: ", mainBreaks.length, rashiBreaks.length, tosafotBreaks.length);
    const spacerHeights = {
      start: 4.4 * parsedOptions.lineHeight.side,
      inner: null,
      outer: null,
      end: 0,
      exception: 0
    };

    const mainHeight = accumulateMain(mainArray);
    const mainHeightOld = (mainSizes.length) * parsedOptions.lineHeight.main;
    let afterBreak = {
      inner: accumulateCommentary(rashiArray.slice(4)),
      outer: accumulateCommentary(tosafotArray.slice(4))
    };

    let afterBreakOld = {
      inner: parsedOptions.lineHeight.side * (rashiSizes.length - 4),
      outer: parsedOptions.lineHeight.side * (tosafotSizes.length - 4)
    };

    debugger;
    if (rashiBreaks.length < 1 || tosafotBreaks.length < 1) {
      console.log("Dealing with Exceptions");
      if (rashiBreaks.length < 1) {
        afterBreak.inner = parsedOptions.lineHeight.side * (rashiSizes.length + 1);
        spacerHeights.exception = 2;
      }
      if (tosafotBreaks.length < 1) {
        afterBreak.outer = parsedOptions.lineHeight.side * (tosafotSizes.length + 1);
        spacerHeights.exception = 2;
      }
  }
    switch (mainBreaks.length) {
      case 0:
        spacerHeights.inner = mainHeight;
        spacerHeights.outer = mainHeight;
        if (rashiBreaks.length == 2) {
          spacerHeights.end = parsedOptions.lineHeight.side * accumulateCommentary(rashiArray.slice(rashiBreaks[1]));
        } else {
          spacerHeights.end = parsedOptions.lineHeight.side * accumulateCommentary(tosafotArray.slice(tosafotBreaks[1]));
        }
        console.log("Double wrap");
        break;
      case 1:
        if (rashiBreaks.length != tosafotBreaks.length) {
          if (tosafotBreaks.length == 0) {
            spacerHeights.outer = 0;
            spacerHeights.inner = afterBreak.inner;
            break;
          }
          if (rashiBreaks.length == 0) {
            spacerHeights.inner = 0;
            spacerHeights.outer = afterBreak.outer;
            break;
          }
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
          console.log("Stairs");
          break;
        }
      case 2:
        spacerHeights.inner = afterBreak.inner;
        spacerHeights.outer = afterBreak.outer;
        console.log(afterBreak.inner, afterBreak.outer);
        console.log("Double Extend");
        break;
      default:
        spacerHeights.inner = afterBreak.inner;
        spacerHeights.outer = afterBreak.outer;
        console.log(afterBreak.inner, afterBreak.outer);
        console.log("No Case Exception");
        break;
    }
    console.log(spacerHeights);
    return spacerHeights;
  }

  function el(tag, parent) {
    const newEl = document.createElement(tag);
    if (parent) parent.append(newEl);
    return newEl;
  }

  function div(parent) {
    return el("div", parent);
  }

  function span(parent) {
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
      main: span(containers.main.text),
      inner: span(containers.inner.text),
      outer: span(containers.outer.text)
    };

    const clonedOptions = mergeAndClone(options, defaultOptions);

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
      render(main, inner, outer, amud = "a", linebreak) {

        if (this.amud != amud) {
          this.amud = amud;
          styleManager.updateIsAmudB(amud == "b");
        }
        if (!linebreak) {
          this.spacerHeights = calculateSpacers(main, inner, outer, clonedOptions, containers.dummy);
        }
        else {
          let [mainSplit, innerSplit, outerSplit] = [main, inner, outer].map( text => {
            containers.dummy.innerHTML = text;
            const brs = containers.dummy.querySelectorAll(linebreak);
            const splitFragments = [];
            brs.forEach((node, index) => {
              const range = document.createRange();
              range.setEndBefore(node);
              if (index == 0) {
                range.setStart(containers.dummy, 0);
              } else {
                const prev = brs[index - 1];
                range.setStartAfter(prev);
              }
              splitFragments.push(range.extractContents());
            });
            return splitFragments.map(fragment => {
              const el = document.createElement("div");
              el.append(fragment);
              return el.innerHTML;
            })
          });
          containers.dummy.innerHTML = "";

          const hasInner = innerSplit.length != 0;
          const hasOuter = outerSplit.length != 0;

          if (hasInner != hasOuter) {
            const withText = hasInner ? innerSplit : outerSplit;
            const fixed = onlyOneCommentary(withText, clonedOptions, dummy);
            if (fixed) {
              if (amud == "a") {
                innerSplit = fixed[0];
                outerSplit = fixed[1];
              } else {
                innerSplit = fixed[1];
                outerSplit = fixed[0];
              }
              inner = innerSplit.join('<br>');
              outer = outerSplit.join('<br>');
            }
          }

          this.spacerHeights = calculateSpacersBreaks(mainSplit, innerSplit, outerSplit, clonedOptions, containers.dummy);
        }
        styleManager.updateSpacersVars(this.spacerHeights);
        styleManager.manageExceptions(this.spacerHeights);
        textSpans.main.innerHTML = main;
        textSpans.inner.innerHTML = inner;
        textSpans.outer.innerHTML = outer;
      },
    }
  }

  return renderer;

})));
