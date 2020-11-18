
const texts = { main: [], rashi: [], tosafot: [], sefariaTranslations: []};
const spans = { main: [], rashi: [], tosafot: []};
const sentenceSpans = { main: [] }
const charIndexToSpan = { main: [], rashi: [], tosafot: []} // set when getSpanByCharIndex is first called
const spanPrefixes = { main: 'word-main', rashi: 'word-rashi', tosafot: 'word-tosafot', sentence: 'sentence-main' };

let tractate = 'Eruvin';
let daf = 29; //Set What daf you want
let amud = 'a'; // Set what amud you want, a or bd
let hebrewRef = '';
let next = []; //tractate, daf, amud; e.g., ['Eruvin', '13', a']
let prev = []; //tractate, daf, amud


window.addEventListener("load", () => {
    getTexts(tractate, daf, amud);
})
function getTexts(tractate, daf, amud) {
    //For now this is how we are accessing Texts
    commentary = checkRashbam(tractate, daf, amud);

    const uri1 = 'https://www.sefaria.org/api/texts/' + tractate + '.' + daf + amud + '?' + 'vhe=Wikisource_Talmud_Bavli',
        uri2 = 'https://www.sefaria.org/api/texts/' + commentary +'_on_' + tractate + '.' + daf + amud + '.1-100' + '?',
        uri3 = 'https://www.sefaria.org/api/texts/Tosafot_on_' + tractate + '.' + daf + amud + '.1-100' + '?';

    const renderer = dafRenderer("#daf");

    Promise.all([jsonp(uri1), jsonp(uri2), jsonp(uri3)]).then(values => {

        const main = values[0];
        const rashi = values[1];
        const tosafot = values[2];

        //Set next and prev for the arrow buttons.
        //Sefaria does give you next and prev... sometimes. So we're not relying on that.
        // const tractateDetails = tractates[tractate];
        // if (daf + amud == tractateDetails.lastPage) {
        //     next = [tractateDetails.nextTractate, 2, a]
        // }
        // else {
        //     next = (amud == 'a') ? [tractate, daf, 'b'] : [tractate, daf + 1, 'a'];
        // }
        // if (daf + amud == '2a') {
        //     const lastPage = tractates[tractateDetails.prevTractate].lastPage;
        //     const lastPageAmud = lastPage.slice(-1);
        //     const lastPageDaf = lastPage.slice(0, -1)
        //     prev = [tractateDetails.prevTractate, lastPageDaf, lastPageAmud];
        // }
        // else {
        //     prev = (amud == 'a') ? [tractate, daf - 1, 'b'] : [tractate, daf, 'a'];
        // }
        // next = main.next.split(/ (?=\d)|(?=[ab])/g);
        // prev = main.prev.split(/ (?=\d)|(?=[ab])/g);

        heRef = main.heRef;
        
        heRefArray = main.heRef.replace('״', '').split(' ');
        if (heRefArray.length == 4) {
            heRefArray[0] += ' ' + heRefArray[1]; 
            heRefArray.splice(1,1);
        }

        // setTitle(heRefArray[0], tractate, heRefArray[1], daf, heRefArray[2] == 'א');


        texts.rashi = reformatRashi(rashi.he);
        texts.tosafot = reformatTosafot(tosafot.he);
        texts.main = reformatMain(main.he)
        texts.sefariaTranslations = main.text;

        sentenceSpans.main = texts.main.map( 
            (sentence, index) => { return { sentence: sentence, id: `${spanPrefixes.sentence}-${index}`}})

        //This code works, and I'm sure it could use some refactoring
        //(It's the word-span-wrapping function, but now it has to not step on the toes of the bolding functionality)
        const processText = (text, prefix, indexStart = 0) => text
            .split(/(\<[^<>]+\>[^<>]+<[^<>]+>)/g) //Break out all HTML elements
            .join('***') //Join using so we can do another split
            .split(/ (?![^<]*>|<)/g) //Break out all spaces that are not preceeding tags or within tag declarations
            .join('***') //Join so we're back to one string, with everything separated by commas
            .split('***') //Split into a final, one-dimensional array of words
            .filter(Boolean) //Get rid of empty elements
            .map(n => n.includes('img') ? wrapImage(n) : n) //Wrap image elements with hover buttons that show and hide them
            .map( (word, index) => { return {word: word, id: `${prefix}-${index + indexStart}`} });

        let nthVerse = 0;
        const cutVerses = string => {
            const verse = /\(([^\(\)]*,[^\(\)]*)\)/g;
            return string.replace(verse, (match, verseRef) => verseLinkSpan(verseRef, ++nthVerse));
        }

        const wordToHTML = spanObj => wordSpan(spanObj.id, spanObj.word);
        const sentenceToHTML = spanObj => sentenceSpan(spanObj.id, spanObj.sentence);

        sentenceSpans.main = sentenceSpans.main.map( (sentenceObj) => {
            const wordSpanObj = 
                processText(
                     cutVerses(sentenceObj.sentence),
                     spanPrefixes.main, 
                     spans.main.length
                )
                .map(wordSpanObj => Object.assign(wordSpanObj, {sentence: sentenceObj.id}));
            spans.main = spans.main.concat(wordSpanObj); //OY A SIDE EFFECT (refactor? though this is more efficient than looping twice)
            return {
                id: sentenceObj.id, 
                sentence: wordSpanObj.map(wordToHTML).join(' ')
            }
        })
        
        spans.rashi = processText(texts.rashi, spanPrefixes.rashi);
        spans.tosafot = processText(texts.tosafot, spanPrefixes.tosafot);
        
        const mainHTML = sentenceSpans.main.map(sentenceToHTML).join(' ');
        const rashiHTML = spans.rashi.map(wordToHTML).join(' ')
        const tosafotHTML = spans.tosafot.map(wordToHTML).join(' ')
       

        // document.getElementById('maintxtcntr').innerHTML =  "<u class=maintxtcontent>" + mainHTML + "</u>";
        // document.getElementById('innertxtcntr').innerHTML = "<u class=rashitext>" + rashiHTML + "</u>";
        // document.getElementById('outertxtcntr').innerHTML = "<u class=tosafottext>" + tosafotHTML + "</u>";;
        
        setTimeout(function(){
            renderer.render(mainHTML, rashiHTML, tosafotHTML, amud);
            // document.querySelector('.daf-container').style.opacity = '1';
            // changePadding();

            // Should probably be its own function, but need to do it after all of this and couldnt figure out how
            // spaceLastLine('maintxtcontent');
        }, 10)

    })
        
}


//TITLE CONTROLS
// document.querySelector('.daf-button-prev').addEventListener('click', prevPage);
// document.querySelector('.daf-button-next').addEventListener('click', nextPage);
//
// document.querySelector('.daf-title-tractate-dropdown').addEventListener('change', event => {
//     tractate = event.target.value;
//     getTexts(tractate, daf, amud);
// });
//
// document.querySelector('.daf-page-dropdown').addEventListener('change', event => {
//     amud = event.target.value.slice(-1);
//     daf = event.target.value.slice(0, -1);
//     getTexts(tractate, daf, amud);
// });
//
// function nextPage() {
//     getTexts(...next);
// }
//
// function prevPage() {
//     getTexts(...prev);
// }
//
// function setTitle(mesekhet, tractate, daf, page, amudAlef = true) {
//     document.querySelector('.daf-title-tractate-hebrew').innerText = mesekhet;
//     document.querySelector('.daf-title-page').innerText = (amudAlef ? '.' : ':') + daf ;
//     document.querySelector('.daf-title-tractate-dropdown').value = tractate;
//
//     const dafSelection = document.querySelector('.daf-page-dropdown');
//     const currTractateLength = tractates[tractate].length;
//
//     if (dafSelection.options.length < currTractateLength) {
//         for (let i = dafSelection.options.length; i < currTractateLength; i++){
//             const amudA = i % 2 == 0;
//             const daf = 2 + (i - (i % 2)) / 2;
//             const dafString = daf + (amudA ? 'a' : 'b');
//             const opt = document.createElement('option');
//             opt.value = dafString;
//             opt.innerHTML = dafString;
//             dafSelection.appendChild(opt);
//         }
//     } else {
//         //dafSelection.options and its indexes will change as we delete items
//         const difference = dafSelection.options.length - currTractateLength;
//         for (let i = 0; i < difference; i++) {
//             dafSelection.options.remove(currTractateLength);
//         }
//     }
//
//     document.querySelector('.daf-page-dropdown').value = page + (amudAlef ? 'a' : 'b');
// }

// function getHorizontalPos(el) {
//     const wdth = document.getElementsByClassName('maintxtcontent')[0].offsetWidth;
//     for (var lx_left=0, lx_right=0;
//          el != null;
//          lx_left += el.offsetLeft, lx_right = wdth - lx_left, el = el.offsetParent);
//     return {left: lx_left, right: lx_right};
// }
//TEXT PROCESSING AND HTML GENERATION
const wordSpan = (id, word) => `<span class='word' id='${id}'>${word}</span>`

const sentenceSpan = (id, sentence) => `<span class='sentence' id='${id}'>${sentence}</span>`

const verseLinkSpan = (verse, number) => 
    "<span class='verse-linker' " + 
    `onmouseover="verseLinkHover('${verse}')" ` + 
    `onclick="verseLinkClick('${verse}')">${number}</span>`

let nthImage = 0;
const wrapImage = imageEl => 
`<input type='image' class='show-image-button' 
onmouseenter='imageButtonEnter(${++nthImage})'
ontouchstart='imageButtonEnter(${nthImage})'
onmouseleave='imageButtonLeave(${nthImage})'
ontouchend='imageButtonLeave(${nthImage})'
src='icons/image-icon.png' width=16 height=16>
 </input>
<span class='image-wrapper image-${nthImage}'>${imageEl}</span>
`
const wrapSentences = sentenceArray => sentenceArray.map(
    (sentence, index) => sentenceSpan(sentence, `${spanPrefixes.sentence}-${index}`))

const reformatMain = text => 
    text.map(string => string
        .replace(/:,/g, ": ")
        .replace(/<strong>/g, "")
        .replace(/<\/strong>/g, ""))

const reformatRashi = text => 
    text.filter(arr => arr.length > 0)
    .map(subarr => subarr.map(str => 
        str.replace(/([^-:]*) - ([^-:]+:)/, ("<b class='rashi-header'>$1. </b>$2 "))
        ).join(''))
    .join('')
    .replace(/,,/g, "")
    .replace(/,:/g, ": ")
    .replace(/:,/g, ": ")

const reformatTosafot = text => 
    text.filter(arr => arr.length > 0)
    .map(subarr => subarr.map(str => 
        str.replace(/([^-:]*) - ([^-:]+:)/, ("<b class='tosafot-header'>$1. </b>$2 "))
        ).join(''))
    .join('')
    .replace(/,,/g, "")
    .replace(/,:/g, ": ")
    .replace(/:,/g, ": ")
    
//SPAN ACCESS
// function getSpanByWordIndex(text, index) {
//     return spans[text][index];
// }
//
// function getSpanByWordId(text, id) {
//     const index = id.match(/\d+/)[0];
//     return spans[text][index];
// }
//
// function getSpanByCharIndex(text, index) {
//     if (charIndexToSpan[text].length) {
//         return charIndexToSpan[text][index];
//     }
//     else {
//         let spaceCount = 0;
//         let returnVal;
//         for (let i = 0; i < texts[text].length; i++) {
//             if (texts[text][i] === ' ') {
//                 spaceCount++;
//             }
//             const span = spans[text][spaceCount];
//             charIndexToSpan[text][i] = span;
//             if (i === index) {
//                 returnVal = span;
//             }
//         }
//         return returnVal;
//     }
//
// }
//
// function getSpansBySearch(text, query) {
//     const regex = new RegExp(query, 'gi');
//     let spans = [], result;
//     while ( (result = regex.exec(texts[text])) ) {
//         spans.push(getSpanByCharIndex(text, result.index));
//     }
//     return spans;
// }
//
// function getSefariaTranslation(sentenceIndex) {
//     return texts.sefariaTranslations[sentenceIndex];
// }
//
// //Verse number links
// function verseLinkHover(verse) {
// //alert(verse);
// }
//
// function verseLinkClick(verse) {
//     ajaxGet("https://sefaria.org/api/name/" + verse).then((data) =>
//         window.open("https://sefaria.org/" + data.url))
// }
//
// function imageButtonEnter(imageNumber) {
//     document.querySelector('.image-' + imageNumber).style.display = 'block';
// }
// function imageButtonLeave(imageNumber) {
//     document.querySelector('.image-' + imageNumber).style.display = 'none';
// }


function checkRashbam (tractate, daf, amud) {
    if(tractate === "Bava Batra" && daf >= 30){
        return ("Rashbam");
    }
    else{
        return("Rashi");
    }
};


