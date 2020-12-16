# daf-render-lib
## *IN PROGRESS! (If you have questions contact shaunregenbaum@gmail.com)*
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

### Algorithm

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


