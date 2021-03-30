import classes from './styles.css';

const sideSpacersClasses = {
  start: [classes.spacer, classes.start],
  mid: [classes.spacer, classes.mid],
  end: [classes.spacer, classes.end]
}

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
}

function addClasses(element, classNames) {
  if (Array.isArray(classNames))
    element.classList.add(...classNames)
  else
    element.classList.add(classNames)
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
  })
}


export default {
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
    setVars(options)
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
    })
  },
  manageExceptions(spacerHeights) {
    if (spacerHeights.inner/2 - 40 < spacerHeights.start) {
      console.log("In Style Exception")
      setVars({
        hasInnerStartGap: "1",
        innerStartWidth: "100%",
        outerStartWidth: "0%",
        innerPadding: "0px",
        outerPadding: "0px",
      })
    } else if (spacerHeights.outer/2 - 40 < spacerHeights.start) {
      console.log("In Style Exception")
      setVars({
        hasOuterStartGap: "1",
        outerStartWidth: "100%",
        innerStartWidth: "0%",
        innerPadding: "0px",
        outerPadding: "0px"
      })
    } else {
      setVars({
        hasOuterStartGap: "0",
        hasInnerStartGap: "0",
        outerStartWidth: "50%",
        innerStartWidth: "50%",
        innerPadding: "0px",
        outerPadding: "0px",
      })
    }
  }
}