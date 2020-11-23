function getAreaOfText(text, font, fs, width, lh, dummy) {
  let testDiv = document.createElement("div");
  testDiv.style.font = String(fs) + "px " + String(font);
  testDiv.style.width = String(width) + "px";
  // testDiv.style.height = "100%"
  testDiv.style.lineHeight = String(lh) + "px";
  testDiv.innerHTML = text;
  // testDiv.style.textAlign = "justify";
  dummy.append(testDiv);
  // console.log("Hello");
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
  }

  const midWidth = Number(parsedOptions.width * parsedOptions.mainMargin.start) - 2*parsedOptions.padding.horizontal; //main middle strip
  const topWidth = Number(parsedOptions.width * parsedOptions.halfway) - parsedOptions.padding.horizontal; //each commentary top
  const sideWidth = Number((parsedOptions.width - midWidth - 2 * parsedOptions.padding.horizontal)/2) //each commentary widths, dont include padding, so need to keep it constant

  const sideModifier = 1.13 //These are experimentally derived numbers based on the error of calculate Area
  const mainModifier = 0.95 //These are experimentally derived numbers based on the error of calculate Area

  const paddingAreas = {
    name: "paddingAreas",
    horizontalSide: sideWidth * parsedOptions.padding.vertical,
  }

  console.log(topWidth);
  const adjustCommentaryArea = (area, lineHeight) => area - (4 * lineHeight * topWidth); //remove area of top 4 lines
  const main = {
    name: "main",
    width: midWidth,
    text: mainText,
    lineHeight: parsedOptions.lineHeight.main,
    area: getAreaOfText(mainText, parsedOptions.fontFamily.main, parsedOptions.fontSize.main, midWidth, parsedOptions.lineHeight.main, dummy) * mainModifier,
    length: null,
    height: null,
  }
  const outer = {
    name: "outer",
    width: sideWidth,
    text: outerText,
    lineHeight: parsedOptions.lineHeight.side,
    area: adjustCommentaryArea(
      getAreaOfText(outerText, parsedOptions.fontFamily.outer, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy) * sideModifier,
      parsedOptions.lineHeight.side
    ) - paddingAreas.horizontalSide,
    length: null,
    height: null,
  }
  const inner = {
    name: "inner",
    width: sideWidth,
    text: innerText,
    lineHeight: parsedOptions.lineHeight.side,
    area: adjustCommentaryArea(
      getAreaOfText(innerText, parsedOptions.fontFamily.inner, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy) *sideModifier,
      parsedOptions.lineHeight.side
    ) - paddingAreas.horizontalSide,
    length: null,
    height: null,
  }

  const texts = [main, outer, inner];
  texts.forEach (text => text.height = text.area / text.width);

  const perHeight = Array.from(texts).sort( (a,b) => a.height - b.height);
  const perArea = Array.from(texts).sort ( (a,b) => a.area - b.area );
  console.log(perHeight[0])

  //There are Three Main Types of Case:
  //Double-wrap: The main text being the smallest and commentaries wrapping around it
  //Stairs: The main text wrapping around one, but the other wrapping around it
  //Doublle-Extend: The main text wrapping around both commentaries

  //Main Text is Smallest: Double-Wrap
  //Main Text being Middle: Stairs
  //Main Text Being Largest: Double-Extend

  //First we need to check we have enough commentary to fill the first four lines
  if (inner.height <= 0 && outer.height <= 0){
    console.error("Not Enough Commentary");
    return Error("Not enough commentary");
  };

  const spacerHeights = {
    start: 4 * parsedOptions.lineHeight.side,
    inner: null,
    outer: null,
    end: 0,
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
  //If Stairs, there's one text at the bottom. We will call it THE stair. The remaining two texts form a "block" that we must compare with that bottom text.
  const blockArea = (main.area + perHeight[0].area);
  const blockWidth = midWidth + sideWidth;
  const blockHeight = blockArea / blockWidth;

  const stair = (perHeight[1].name == "main") ? perHeight[2] : perHeight[1];
  const stairHeight = stair.area / stair.width;

  if (blockHeight < stairHeight) {
    console.log(`Stairs, ${stair.name} is the stair`);
    // This function gets rid of extra space that is introduced by padding
    const lilArea = (height1, height2, horizPadding) => (horizPadding) * (height1 - height2); //TODO: draw a picture
    const smallest = perHeight[0];
    console.log(smallest.height)
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

export default calculateSpacers;