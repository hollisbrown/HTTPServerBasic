const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer(onRequest);
const PORT = 8383;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
function onRequest(request, response) {
    response.statusCode = 200;
    response.setHeader("Access-Control-Allow-Origin", "*"); //CORS !
    response.setHeader('Content-Type', 'text/plain');
    switch (request.method) {
        case 'GET':
            get(request, response);
            break;

        case 'POST':
            post(request, response);
            break;
    }
}

let objectList = [];
let textList = [];
let maxEntries = 256;
let pathRumors = path.resolve('src/data/rumors.json');
load();

function get(request, response) {
    let url = request.url;


    switch (url) {
        case "/list":
            let jsonList = JSON.stringify(textList);
            response.write(jsonList);
            break;
        default:
            response.statusCode = 400;
            break;
    }
    response.end();
}

function post(request, response) {
    let buffer = '';
    request.on('data', chunk => {
        if (chunk.length > 1024) {
            return;
        }
        buffer += chunk;
    });
    request.on('end', () => {
        if (buffer.length > 1024) {
            return;
        }
        try {
            let receivedObject = JSON.parse(buffer);
            add(receivedObject);
        } catch (e) {
            console.log("Not a valid json object:");
            console.log(buffer);
        }
    })
    response.write("POST RECEIVED");
    response.end();
}

function add(obj) {
    let text = obj.text.replace(/[^a-zA-Z0-9-.,:?!"' ]/g, "");
    obj.text = text;
    if (obj.text.length > 4 || obj.text.length < 512) {

        let today = new Date();
        let date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        let timestamp = date + '|' + time;
        obj.timestamp = timestamp;

        if (objectList.length >= maxEntries) {
            objectList = objectList.slice(1, maxEntries);
        }

        objectList.push(obj);
        createTextList();

        console.log("saved! " + timestamp);
        console.log(objectList.length + " items on list");
        save();
    }
}

function createTextList() {
    textList = [];
    objectList.forEach(obj => {
        textList.push(obj.text);
    });
}

function save() {
    let jsonList = JSON.stringify(objectList);
    fs.writeFile(pathRumors, jsonList, 'utf-8', (err) => {
        if (err) {
            console.log(err.message);
        }
    });
}

function load() {
    fs.readFile(pathRumors, 'utf-8', (err, data) => {
        if (err) {
            console.log(err.message);
        } else {
            console.log("loading done.");
            objectList = JSON.parse(data);
            createTextList();
            console.log("loaded " + objectList.length + " items");
        }
    });
}

//curl -d '{"text":"This is a test","name":"curl test"}' -X POST http://localhost:8383/
