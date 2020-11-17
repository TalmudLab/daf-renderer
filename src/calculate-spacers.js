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
  }

  const midWidth = Number(parsedOptions.width * parsedOptions.mainMargin.start); //main middle strip
  const topWidth = Number(parsedOptions.width * parsedOptions.halfway); //each commentary top
  const sideWidth = Number((parsedOptions.width - midWidth)/2) //each commentary widths

  const paddingAreas = {
    name: "paddingAreas",
    horizontalSide: sideWidth * parsedOptions.padding.vertical,
    verticalTop: 4 * parsedOptions.lineHeight.side * parsedOptions.padding.horizontal, //NOT IMPORTANT
  }

  const adjustCommentaryArea = (area, lineHeight) => area - (4 * lineHeight * topWidth) - paddingAreas.horizontalSide; //remove area of top 4 lines
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
    area: adjustCommentaryArea(
      getAreaOfText(outerText, parsedOptions.fontFamily.outer, parsedOptions.fontSize.side, sideWidth, parsedOptions.lineHeight.side, dummy),
      parsedOptions.lineHeight.side
    ),
    length: null,
    height: null,
  }
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
  }

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
  };

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
    const bottomGhostHeight = (ghostHeight - spacerHeights.inner);

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
  console.log("Double-Extend")
  spacerHeights.inner = roundLine(inner.height, inner.lineHeight, parsedOptions.lineHeight.modifier);
  spacerHeights.outer = roundLine(outer.height, outer.lineHeight, parsedOptions.lineHeight.modifier);

  return spacerHeights
}

export default calculateSpacers;