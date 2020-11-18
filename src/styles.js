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
})

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
  }


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
  }
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

export default calculateStyles;