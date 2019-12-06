const DB_NAME = "WordPal";
const DB_VERSION = 1;
const STORE_NAME = "wordlist";
let db;

function setup() {
    let reqOpenDB = window.indexedDB.open(DB_NAME, DB_VERSION);

    reqOpenDB.onsuccess = function (e) {
        db = e.target.result;
        // db.onerror = function(e) {
        //     alert("Sorry, an unforseen error was thrown.");
        //     console.log("***ERROR***");
        //     console.dir(e.target);
        // };

        db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME).count().onsuccess = function(e) {
            let count = e.target.result;
            if (count === 0) {
                let store = db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME);
                for (let i = 0; i < wordlist.length; i++) {
                    let reqAdd = store.add(wordlist[i]);
                    reqAdd.onsuccess = function () {
                        console.log("success");
                    };
                    reqAdd.onerror = function (e) {
                        console.log(e);
                        console.log(wordlist[i]);
                    };
                }
            } else {
                console.log("Object store already exists, no data initialization is performed.")
            }

        }
    };

    reqOpenDB.onerror = function () {
        console.log("Error occurred: " + reqOpenDB.error);
    };

    reqOpenDB.onupgradeneeded = function (e) {
        let db = e.target.result;
        db.createObjectStore(STORE_NAME, {keyPath: 'word'});
    };
}

setup();
