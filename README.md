# daf-render-lib
## *IN PROGRESS!*
*(If you have questions contact shaunregenbaum@gmail.com)*
A DOM render library for creating Talmud pages on the web.

## Installation

### Release File

### NPM

## Usage


```javascript
const renderer = dafRenderer("#dafGoesHere", options);
renderer.render(mainHTML, innerHTML, outerHTML, "b");
```

### Options

```javascript
{
  contentWidth: "600px",
  padding: {
    vertical: "10px",
    horizontal: "16px",
  },
  halfway: "50%",
  fontFamily: {
    inner: "Rashi",
    outer: "Rashi",
    main: "Vilna"
  },
  fontSize: {
    main: "15px",
    side: "10.5px"
  },
  lineHeight: {
    main: "17px",
    side: "14px",
  },
  mainMargin: {
    start: "50%",
  },
}
```

### Data Sources

#### Sefaria

#### Talmud.dev API

## How it Works

### Spacers and the DOM
The layout of the Talmud is not easily replicated with the box-model of the web. This is because there is no such thing as *middle* for the CSS [float](https://developer.mozilla.org/en-US/docs/Web/CSS/float) property, or any other kind of ability to allow multiple bodies of text to wrap around one another. This limitation was overcome with a new paradigm we call *spacers*. Spacers take advantage of the wrap-around principles of [flow](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Normal_Flow). When a *right-floated* body of text encounters a *left-floated* element, it will wrap around that element instead of overlapping. Thus, we can make complex shapes out of the text by using multiple spacers to force the text into the shape we want:

![A picture showing three boxes with text wrapping around them](https://github.com/Jutanium/daf-render-lib/blob/master/Documentation%20Pictures/Spacers.PNG)

If we use three layers stacked on top of each other, we can then recreate the page in its entirety:

![A picture sketching the spacer over the daf](https://github.com/Jutanium/daf-render-lib/blob/master/Documentation%20Pictures/Spacers%20Together.PNG)

Once we have this structure, where there are three layers each with their own spacers, the only thing left is to calculate the dimensions of these spacers. Specifically, it is important to know their heights (you can actually set thier widths to zero, and rely on floating them left or right). 


### Algorithm
The algorithim has two stages. 

In order to understand both stages, we must understand that there are three possible layouts that are possible:

1. Double-Wrap
2. Stairs
3. Double-Extend

The first stage of the algorithim determines which layout the current page is. In order to do this there are three-five steps:

1. First we calculate the area that each body of text occupies (in terms of px^2).
2. Second we divide the calculated area by each text's respective width to get an expected height.
3. Third we compare these expected heights. If the main text has the smallest height then we know that we are dealing with the case of Double-Wrap.

4. If the main text is not smallest we then add the areas of the two smallest texts and divide that by their added widths to get a new height.

5. We then compare the new height to the largest expected height. If the new height is smaller than the largest expected height then we are dealing with the case of Stairs. If not, we are dealing with the case of Double-Extend.

The second stage of the algorithim
Now that we know which layout we are dealing with we can calculate the spacer heights using only the calculated area values from before and the padding values that we can optionally apply. We will divide the second 



## License
  
MIT License

Copyright (c) 2020 Dan Jutan Shaun Regenbaum

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Development
Local setup, contributions, issues guidelines etc.


