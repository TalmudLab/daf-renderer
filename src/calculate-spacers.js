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
  }

  const midWidth = Number(parsedOptions.width * parsedOptions.mainWidth) - 2*parsedOptions.padding.horizontal; //main middle strip
  const topWidth = Number(parsedOptions.width * parsedOptions.halfway) - parsedOptions.padding.horizontal; //each commentary top
  const sideWidth = Number(parsedOptions.width * (1 - parsedOptions.mainWidth)/2) //each commentary widths, dont include padding, sokeep it constant

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
  }


  const topArea = (lineHeight) => ((4 * lineHeight * topWidth)); //remove area of the top 4 lines
  

  const main = {
    name: "main",
    width: midWidth,
    text: mainText,
    lineHeight: parsedOptions.lineHeight.main,
    area: getAreaOfText(mainText, parsedOptions.fontFamily.main, parsedOptions.fontSize.main, midWidth, parsedOptions.lineHeight.main, dummy),
    length: null,
    height: null,
  }
  const outer = {
    name: "outer",
    width: sideWidth,
    text: outerText,
    lineHeight: parsedOptions.lineHeight.side,
    area: getAreaOfText(outerText, parsedOptions.fontFamily.outer, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy) 
          - topArea(parsedOptions.lineHeight.side),
    length: null,
    height: null,
  }
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
  }

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
  };

 
  // This is a case that we have to decice what to do with, when there is not enough commentary on both sides to fill the lines. 
  if (inner.height <= spacerHeights.start && outer.height <= spacerHeights.start) {
    console.error("Not Enough Commentary to Fill Four Lines");
    return Error("Not Enough Commentary");
  };

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
  };

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
  console.log("Double-Extend")
  spacerHeights.inner = inner.height;
  spacerHeights.outer = outer.height;

  return spacerHeights
}


export default (calculateSpacers);