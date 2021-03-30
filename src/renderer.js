import {defaultOptions, mergeAndClone} from "./options";
import calculateSpacers from "./calculate-spacers";
import styleManager from "./style-manager";
import calculateSpacersBreaks from "./calculate-spacers-breaks";


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

        if (inner == "" || outer == "") {
          const toHalve = inner == "" ? outer : inner;
          const testDiv = document.createElement("div");

          const calculateWidth = node => {
            if (node.offsetWidth) {
              return node.offsetWidth;
            }
            if (node.nodeType == 3) {
              const span = document.createElement("span");
              span.append(node.nodeValue);
              node.parentElement.append(span)
              const width = span.offsetWidth;
              span.remove();
              return width;
            }
            return 0;
          }
          testDiv.innerHTML = toHalve;
          containers.dummy.append(testDiv);
          testDiv.style.setProperty("white-space", "nowrap");
          let nodes = Array.from(testDiv.childNodes);
          let widths = nodes.map( (node, i) => calculateWidth(node));
          console.log(widths);
          const totalWidth = widths.reduce( (acc, curr) => acc + curr);
          const midpoint = totalWidth / 2;
          let i = 0, passed = 0;
          while (passed < midpoint) {
            passed += widths[i++];
          }
          let middleEl = testDiv.childNodes[i - 1];
          let widthRemaining = midpoint - (passed - widths[i - 1]);
          passed = 0;
          while (middleEl.nodeType != 3) {
            i = 0;
            const childWidths = Array.from(middleEl.childNodes).map( node => calculateWidth(node));
            while (passed + childWidths[i] < widthRemaining) {
              passed += childWidths[i];
              i++;
            }
            middleEl = middleEl.childNodes[i];
          }
          const proportionalOffset = (widthRemaining - passed) / calculateWidth(middleEl);
          const offsetRemaining = Math.round(proportionalOffset * middleEl.nodeValue.length);
          const range1 = document.createRange();
          range1.setStart(testDiv, 0);
          range1.setEnd(middleEl, offsetRemaining);
          const range2 = document.createRange();
          range2.setStart(middleEl, offsetRemaining + 1);
          range2.setEndAfter(testDiv.childNodes[testDiv.childNodes.length - 1]);
          const halves = [range1, range2]
            .map(range => range.extractContents())
            .map(fragment => {
              const el = document.createElement("div");
              el.append(fragment);
              return el.innerHTML;
            });
          console.dir(halves)
          debugger;
        }

        const [mainSplit, innerSplit, outerSplit] = [main, inner, outer].map( text => {
          containers.dummy.innerHTML = text;
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
            splitFragments.push(range.extractContents());
          })
          return splitFragments.map(fragment => {
            const el = document.createElement("div");
            el.append(fragment);
            return el.innerHTML;
          })
        });
        containers.dummy.innerHTML = "";
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
