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

let list = [];
let maxLength = 32;
let jsonPath = path.resolve('src/data/list.json');

function get(request, response) {   
    let url = request.url;
    switch (url) {
        case "/list":
            let jsonList = JSON.stringify(list);
            response.write(jsonList);
            break;
        case "/clear":
            response.write("List cleared.");
            list = [];
            break;
        case "/save":
            response.write("Saved to file.");
            save();
            break;
        case "/load":
            response.write("Loaded from file.");
            load();
            break;
        default:
            response.statusCode = 400;
            response.write("Valid URL commands are: /list /clear /save /load");          
            break;
    }
    response.end();
}

function post(request, response) {
    let buffer = '';
    request.on('data', chunk => { 
        if(chunk.length > 1024){
            return;
        }
            buffer += chunk;
    });
    request.on('end', () => {
        if(buffer.length > 1024){
            return;
        }
        try {
            let jsonObject = JSON.parse(buffer);
            add(jsonObject.text);
            console.log("--- CURRENT LIST: ---")
            console.log(list);
        } catch (e) {

            console.log("Not a valid json object:");
            console.log(buffer);
        }
    })
    response.write("POST RECEIVED");
    response.end();
}

function add(string) {
    if (list.length >= maxLength) {
        list = list.slice(1, maxLength);
    }
    if (string.length > 16 || string.length < 1024) {
        list.push(string);
    }
}

function save() {
    let jsonList = JSON.stringify(list);
    fs.writeFile(jsonPath, jsonList, 'utf-8', (err) => {
        if (err) {
            console.log(err.message);
        } else {
            console.log("save done.");
        }
    });
}

function load() {
    fs.readFile(jsonPath, 'utf-8', (err, data) => {
        if (err) {
            console.log(err.message);
        } else {
            console.log("loading done.");
            list = JSON.parse(data);
            console.log(list);
        }
    })
}
