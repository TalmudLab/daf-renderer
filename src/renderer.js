import { defaultOptions, mergeAndClone } from "./options";
import calculateSpacers from "./calculate-spacers";
import styleManager from "./style-manager";


function el (tag, parent) {
  const newEl = document.createElement(tag);
  if (parent) parent.append(newEl);
  return newEl;
}

function div (parent) {
  return el("div", parent);
}

function span (parent) {
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
    main:  span(containers.main.text),
    inner:  span(containers.inner.text),
    outer:  span(containers.outer.text)
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
    render (main, inner, outer, amud = "a") {
      if (this.amud != amud) {
        this.amud = amud;
        styleManager.updateIsAmudB(amud == "b");
      }
      this.spacerHeights = calculateSpacers(main, inner, outer, clonedOptions, containers.dummy);
      styleManager.updateSpacersVars(this.spacerHeights);
      styleManager.manageExceptions(this.spacerHeights);
      console.log(this.spacerHeights)
      textSpans.main.innerHTML = main;
      textSpans.inner.innerHTML = inner;
      textSpans.outer.innerHTML = outer;
    },
  }
}
