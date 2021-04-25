import {defaultOptions, mergeAndClone} from "./options";
import calculateSpacers from "./calculate-spacers";
import styleManager from "./style-manager";
import {
  calculateSpacersBreaks,
  onlyOneCommentary
} from "./calculate-spacers-breaks";


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

export default function (el, options = defaultOptions) {
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
  }

  const textSpans = {
    main: span(containers.main.text),
    inner: span(containers.inner.text),
    outer: span(containers.outer.text)
  }

  const clonedOptions = mergeAndClone(options, defaultOptions);

  styleManager.applyClasses(containers);
  styleManager.updateOptionsVars(clonedOptions);

  let resizeEvent;
  return {
    containers,
    spacerHeights: {
      start: 0,
      inner: 0,
      outer: 0,
      end: 0
    },
    amud: "a",
    render(main, inner, outer, amud = "a", linebreak, renderCallback, resizeCallback) {
      if (resizeEvent) {
        window.removeEventListener("resize", resizeEvent);
      }
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
          const divRanges = Array.from(containers.dummy.querySelectorAll("div")).map(div => {
            const range = document.createRange();
            range.selectNode(div);
            return range;
          })
          const brs = containers.dummy.querySelectorAll(linebreak);
          const splitFragments = []
          brs.forEach((node, index) => {
            const range = document.createRange();
            range.setEndBefore(node);
            if (index == 0) {
              range.setStart(containers.dummy, 0);
            } else {
              const prev = brs[index - 1];
              range.setStartAfter(prev);
            }
            divRanges.forEach( (divRange, i) => {
              const inBetween = range.compareBoundaryPoints(Range.START_TO_START, divRange) < 0 && range.compareBoundaryPoints(Range.END_TO_END, divRange) > 0;
              if (inBetween) {
                splitFragments.push(divRange.extractContents());
              }
            })
            splitFragments.push(range.extractContents());
          })
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
        resizeEvent = () => {
          this.spacerHeights = calculateSpacersBreaks(mainSplit, innerSplit, outerSplit, clonedOptions, containers.dummy);
          styleManager.updateSpacersVars(this.spacerHeights);
          if (resizeCallback)
            resizeCallback();
          console.log("resizing")
        }
        window.addEventListener('resize', resizeEvent)
      }
      styleManager.updateSpacersVars(this.spacerHeights);
      styleManager.manageExceptions(this.spacerHeights);
      textSpans.main.innerHTML = main;
      textSpans.inner.innerHTML = inner;
      textSpans.outer.innerHTML = outer;

      const containerHeight = Math.max(...["main", "inner", "outer"].map(t => containers[t].el.offsetHeight));
      containers.el.style.height = `${containerHeight}px`;
      if (renderCallback)
        renderCallback();
    },
  }
}
