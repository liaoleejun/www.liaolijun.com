let reqOpenDB = window.indexedDB.open(DB_NAME, DB_VERSION);
let store = null;

reqOpenDB.onsuccess = function (e) {
    if (store === null) {
        store = e.target.result.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME);
    }
};

// 输出 not in list
// 输出 contrast
//
// text ----> lines ----> may_words ----------> words
//       \n          \s              [a-zA-Z]
document.getElementById("start").addEventListener("click", function(){
    // Not in list
    let notInList = document.getElementById("not-in-list");
    if (notInList) {notInList.parentNode.removeChild(notInList);}
    notInList = document.createElement("div");
    notInList.id = "not-in-list";
    document.body.appendChild(notInList);

    // 原文对照并突出显示 Not in list
    let contrast = document.getElementById("contrast");
    if (contrast) {contrast.parentNode.removeChild(contrast);}
    contrast = document.createElement("div");
    contrast.id = "contrast";
    document.body.appendChild(contrast);

    let text = document.getElementById("input").value;
    if(!text.trim()) {return;}

    let lines = text.match(/[\n]+|[^\n]+/g);
    let unmatched = {};
    (async function () {
        for (let [idx, line] of lines.entries()) {
            if (line.match(/\n/i)) {
                for (let i = 0; i < line.match(/\n/g).length; i++) {
                    let br = document.createElement("br");
                    contrast.appendChild(br);
                }
            } else {
                let may_words = line.match(/([\s]+)|([^\s]+)/g);
                for (let may_word of may_words) {
                    if (may_word.match(/\s/i)) {
                        let textnode = document.createTextNode(may_word)
                        contrast.appendChild(textnode);
                    } else {
                        let words = may_word.match(/([a-zA-Z]+)|([^a-zA-Z]+)/g);
                        for (let word of words) {
                            if (word.match(/[a-zA-Z]+/g) && word.length > 2) {
                                let isInList = await checkWordList(word);
                                if (isInList) {
                                    let textnode = document.createTextNode(word);
                                    contrast.appendChild(textnode);
                                } else {
                                    if (unmatched[word]) {
                                        unmatched[word]++;
                                        let textnode = document.createTextNode(word);
                                        contrast.appendChild(textnode);
                                    } else {
                                        unmatched[word] = 1;
                                        let span = document.createElement("span");
                                        span.innerText = word;
                                        span.classList.add("not-in-list");
                                        contrast.appendChild(span);
                                        notInList.innerHTML = Object.keys(unmatched).join(", ");
                                    }
                                }
                            } else {
                                let textnode = document.createTextNode(word);
                                contrast.appendChild(textnode);
                            }
                        }
                    }
                }
            }
            // 当到达最后一行时，在id="not-in-list"后面append统计数据
            if (idx === lines.length - 1) {
                let elem = document.createElement("div");
                elem.innerText = `Stats: ${Object.keys(unmatched).length} words`;
                notInList.parentNode.insertBefore(elem, notInList.nextSibling);
            }
        }
    })();
});

function getRadioValueByName(name) {
    let radios = document.getElementsByName(name);
    for (let i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            return(radios[i].value);
        }
    }
}

function checkWordList(x) {
    return new Promise(function (resolve) {
        x = x.toLowerCase();

        // 找到radio所指定的单词列表等级 ["oxford_3000", "oxford_5000"]
        let select_level = getRadioValueByName("std_level");

        let store = db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME);
        let reqGet = store.get(x);
        reqGet.onsuccess = function (e) {
            let result = e.target.result;
            // 不存在，返回 false
            // 存在，select_level = oxford_3000 而且存在的数据的 level = oxford_5000，返回 false
            // 存在，select_level = oxford_3000 而且存在的数据的 level = oxford_3000，返回 true
            // 存在，select_level = oxford_5000，返回 true
            if (result === undefined || (select_level === "oxford_3000" && result.level === "oxford_5000" )) {
                resolve(false);
            } else {
                resolve(true);
            }
        };
        reqGet.onerror = function (e) {
            console.log(e);
        };
    });
}
