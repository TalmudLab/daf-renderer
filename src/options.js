const defaultOptions = {
  contentWidth: "600px",
  mainWidth: "50%",
  padding: {
    vertical: "10px",
    horizontal: "16px",
  },
  innerPadding: "4px",
  outerPadding: "4px",
  halfway: "50%",
  fontFamily: {
    inner: "Rashi",
    outer: "Rashi",
    main: "Vilna"
  },
  direction: "rtl",
  fontSize: {
    main: "15px",
    side: "10.5px"
  },
  lineHeight: {
    main: "17px",
    side: "14px",
  }
}

function mergeAndClone (modified, definitional = defaultOptions) {
  const newOptions = {};
  for (const key in definitional) {
    if (key in modified) {
      const defType = typeof definitional[key];
      if (typeof modified[key] !== defType) {
        console.error(`Option ${key} must be of type ${defType}; ${typeof modified[key]} was passed.`);
      }
      if (defType == "object") {
        newOptions[key] = mergeAndClone(modified[key], definitional[key])
      } else {
        newOptions[key] = modified[key];
      }
    } else {
      newOptions[key] = definitional[key];
    }
  }
  return newOptions;
}

export {defaultOptions, mergeAndClone}
