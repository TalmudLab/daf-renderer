import defaultOptions from "./default-options";
import calculateStyles from "./styles";
import calculateSpacers from "./calculate-spacers";

function el (tag, parent) {
  const newEl = document.createElement(tag);
  if (parent) parent.append(newEl);
  return newEl;
}

function div (parent) {
  return el("div", parent);
}

function textSpan (parent) {
  const span = el("span", parent);
  applyStyles(span, {"pointer-events": "auto"});
  return span;
}

function applyStyles(el, styleObj) {
  Object.assign(el.style, styleObj);
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
    main: textSpan(containers.main.text),
    inner: textSpan(containers.inner.text),
    outer: textSpan(containers.outer.text)
  }

  return {
    containers,
    options: JSON.parse(JSON.stringify(options)), //TODO: faster clone
    spacerHeights: {
      start: 0,
      inner: 0,
      outer: 0,
      end: 0
    },
    innerRight: true,
    render (mainText, innerText, outerText, amud = "a") {
      this.innerRight = amud == "b";
      this.spacerHeights = calculateSpacers(mainText, innerText, outerText, options, containers.dummy);
      this.updateStyles();
      textSpans.main.innerHTML = mainText;
      textSpans.inner.innerHTML = innerText;
      textSpans.outer.innerHTML = outerText;
    },
    updateStyles () {
      const styles = calculateStyles(this.options, this.spacerHeights, this.innerRight);
      [containers.el, containers.outer.el, containers.inner.el,
        containers.main.el].forEach(el =>
        applyStyles(el, styles.container)
      );
      ["start", "mid", "end"].forEach(key => {
        applyStyles(containers.outer.spacers[key], styles.outer.spacers[key]);
        applyStyles(containers.inner.spacers[key], styles.inner.spacers[key]);
      });
      ["start", "inner", "outer"].forEach(key =>
        applyStyles(containers.main.spacers[key], styles.main.spacers[key])
      );
      ["outer", "inner", "main"].forEach(container => {
        applyStyles(containers[container].text, styles[container].text);
      })
    },
  }
}
