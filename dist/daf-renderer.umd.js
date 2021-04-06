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

  var css_248z = "/*Keep this as the first rule in the file*/\r\n.styles_dafRoot__1QUlM {\r\n  --contentWidth: 0px;\r\n  --padding-horizontal: 0px;\r\n  --padding-vertical: 0px;\r\n  --halfway: 50%;\r\n\r\n  --fontFamily-inner: \"Rashi\";\r\n  --fontFamily-outer: \"Tosafot\";\r\n  --fontFamily-main: \"Vilna\";\r\n  --direction: \"rtl\";\r\n\r\n  --fontSize-main: 0px;\r\n  --fontSize-side: 0px;\r\n\r\n  --lineHeight-main: 0px;\r\n  --lineHeight-side: 0px;\r\n\r\n  --mainWidth: 0%;\r\n  --mainMargin-start: var(--mainWidth);\r\n  --sidePercent: calc(calc(100% - var(--mainMargin-start)) / 2);\r\n  --remainderPercent: calc(100% - var(--sidePercent));\r\n\r\n  --innerFloat: left;\r\n  --outerFloat: right;\r\n\r\n  --spacerHeights-start: 0px;\r\n  --spacerHeights-outer: 0px;\r\n  --spacerHeights-inner: 0px;\r\n  --spacerHeights-end: 0px;\r\n\r\n  /*Edge Cases*/\r\n  --hasInnerStartGap: 0;\r\n  --hasOuterStartGap: 0;\r\n  --innerStartWidth: 50%;\r\n  --innerPadding: 0px;\r\n  --outerStartWidth: 50%;\r\n  --outerPadding: 0px;\r\n}\r\n\r\n/*Containers*/\r\n.styles_dafRoot__1QUlM,\r\n.styles_outer__abXQX,\r\n.styles_inner__x-amJ,\r\n.styles_main__BHTRd {\r\n  position: absolute;\r\n  width: var(--contentWidth);\r\n  pointer-events: none;\r\n  box-sizing: content-box;\r\n}\r\n\r\n/*Float changes with amud*/\r\n.styles_inner__x-amJ .styles_spacer__2T7TS,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\r\n  float: var(--innerFloat);\r\n}\r\n\r\n.styles_outer__abXQX .styles_spacer__2T7TS,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi {\r\n  float: var(--outerFloat);\r\n}\r\n\r\n/*Spacer widths determined by options*/\r\n.styles_inner__x-amJ .styles_spacer__2T7TS,\r\n.styles_outer__abXQX .styles_spacer__2T7TS {\r\n  width: var(--halfway);\r\n}\r\n.styles_spacer__2T7TS.styles_mid__dcgUr {\r\n  width: var(--remainderPercent);\r\n}\r\n\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_start__AwkfY {\r\n  width: var(--contentWidth);\r\n}\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\r\n  width: var(--sidePercent);\r\n}\r\n\r\n/*Spacer heights determined by algorithm*/\r\n.styles_spacer__2T7TS.styles_start__AwkfY {\r\n  height: var(--spacerHeights-start);\r\n}\r\n\r\n.styles_spacer__2T7TS.styles_end__2wr6A {\r\n  height: var(--spacerHeights-end);\r\n}\r\n\r\n.styles_inner__x-amJ .styles_spacer__2T7TS.styles_mid__dcgUr,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi {\r\n  height: var(--spacerHeights-inner);\r\n}\r\n.styles_outer__abXQX .styles_spacer__2T7TS.styles_mid__dcgUr,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\r\n  height: var(--spacerHeights-outer);\r\n}\r\n\r\n/*Settings to handle edge Cases*/\r\n\r\n.styles_inner__x-amJ .styles_spacer__2T7TS.styles_start__AwkfY {\r\n  width: var(--innerStartWidth);\r\n  margin-left: var(--innerPadding);\r\n  margin-right: var(--innerPadding);\r\n}\r\n\r\n.styles_outer__abXQX .styles_spacer__2T7TS.styles_start__AwkfY {\r\n  width: var(--outerStartWidth);\r\n  margin-left: var(--outerPadding);\r\n  margin-right: var(--outerPadding);\r\n}\r\n\r\n.styles_inner__x-amJ .styles_spacer__2T7TS.styles_start__AwkfY{\r\n  margin-bottom: calc(var(--padding-vertical) * var(--hasInnerStartGap));\r\n}\r\n.styles_outer__abXQX .styles_spacer__2T7TS.styles_start__AwkfY {\r\n  margin-bottom: calc(var(--padding-vertical) * var(--hasOuterStartGap));\r\n}\r\n\r\n.styles_spacer__2T7TS.styles_mid__dcgUr {\r\n  clear: both;\r\n}\r\n\r\n/*Margins!*/\r\n.styles_spacer__2T7TS.styles_start__AwkfY,\r\n.styles_spacer__2T7TS.styles_end__2wr6A,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\r\n  margin-left: calc(0.5 * var(--padding-horizontal));\r\n  margin-right: calc(0.5 * var(--padding-horizontal));\r\n}\r\n\r\n.styles_spacer__2T7TS.styles_mid__dcgUr,\r\n.styles_main__BHTRd .styles_text__1_7-z {\r\n  margin-top: var(--padding-vertical);\r\n}\r\n\r\n.styles_spacer__2T7TS.styles_mid__dcgUr,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_innerMid__27MCi,\r\n.styles_main__BHTRd .styles_spacer__2T7TS.styles_outerMid__2WtcY {\r\n  margin-bottom: var(--padding-vertical);\r\n}\r\n\r\n/*Text*/\r\n.styles_text__1_7-z {\r\n  direction: var(--direction);\r\n  text-align: justify;\r\n}\r\n\r\n.styles_text__1_7-z span {\r\n  pointer-events: auto;\r\n}\r\n\r\n.styles_main__BHTRd .styles_text__1_7-z {\r\n  font-family: var(--fontFamily-main);\r\n  font-size: var(--fontSize-main);\r\n  line-height: var(--lineHeight-main);\r\n}\r\n\r\n.styles_inner__x-amJ .styles_text__1_7-z,\r\n.styles_outer__abXQX .styles_text__1_7-z {\r\n  font-size: var(--fontSize-side);\r\n  line-height: var(--lineHeight-side);\r\n}\r\n\r\n.styles_inner__x-amJ .styles_text__1_7-z {\r\n  font-family: var(--fontFamily-inner);\r\n}\r\n\r\n.styles_outer__abXQX .styles_text__1_7-z {\r\n  font-family: var(--fontFamily-outer);\r\n}\r\n";
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
      if (spacerHeights.exception) {
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


    const mainSizes = mainArray.map(text => getLineInfo(text, parsedOptions.fontFamily.main, parsedOptions.fontSize.main, parsedOptions.lineHeight.main, dummy));
    const [rashiSizes, tosafotSizes] = [rashiArray, tosafotArray].map(
      array => array.map(text => getLineInfo(text, parsedOptions.fontFamily.inner, parsedOptions.fontSize.side, parsedOptions.lineHeight.side, dummy))
    );

    const [mainBreaks, rashiBreaks, tosafotBreaks] = [mainSizes, rashiSizes, tosafotSizes].map(getBreaks);

    console.log("Breaks: ", mainBreaks.length, rashiBreaks.length, tosafotBreaks.length);
    const spacerHeights = {
      start: 4.4 * parsedOptions.lineHeight.side,
      inner: null,
      outer: null,
      end: 0,
      exception: 0
    };
    const mainHeight = (mainSizes.length) * parsedOptions.lineHeight.main; //accumulateHeight(mainSizes);
    let afterBreak = {
      inner: parsedOptions.lineHeight.side * (rashiSizes.length - 4), //accumulateHeight(rashiSizes.slice(3)) + parsedOptions.lineHeight.side,
      outer: parsedOptions.lineHeight.side * (tosafotSizes.length - 4)//accumulateHeight(tosafotSizes.slice(3)) + parsedOptions.lineHeight.side
    };

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
          spacerHeights.end = parsedOptions.lineHeight.side * (rashiSizes.length - rashiBreaks[1]); //accumulateHeight(rashiSizes.slice(rashiBreaks[1]));
        } else {
          spacerHeights.end = parsedOptions.lineHeight.side * (tosafotSizes.length - tosafotBreaks[1]); //accumulateHeight(tosafotSizes.slice(tosafotBreaks[1]));
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
