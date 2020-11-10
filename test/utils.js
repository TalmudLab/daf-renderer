//This is our function to fetch data with Sefaria's API
function jsonp(uri) {
    return new Promise(function (resolve, reject) {
        var id = '_' + Math.round(10000 * Math.random());
        var callbackName = 'jsonp_callback_' + id;
        window[callbackName] = function (data) {
            delete window[callbackName];
            var ele = document.getElementById(id);
            ele.parentNode.removeChild(ele);
            resolve(data);
        }

        var src = uri + '&callback=' + callbackName;
        var script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.addEventListener('error', reject);
        (document.getElementsByTagName('head')[0] || document.body || document.documentElement).appendChild(script)
    });
}

function ajaxGet(uri, log) {
    return new Promise(function(resolve, reject) {
        const request = new XMLHttpRequest();
        request.open("GET", uri, true);
        request.send();
        request.onreadystatechange = (e) => {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    try {
                        resolve(JSON.parse(request.response));
                    } catch (e) {
                        resolve(request.response);
                    }
                } else {
                    reject(request.status);
                }
            } else {
                if (log) {
                    console.log("Request readyState: " + request.readyState)
                }
            }
        }
    });
}