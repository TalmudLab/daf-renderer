import classes from './styles.css';


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
    setVars(options)
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
    })
  }
}