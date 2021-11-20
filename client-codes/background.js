// This line is my local IP
// fetch("http://127.0.0.1:5050/refer", {

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
 fetch("http://18.116.199.178:5050/refer", {
            method: 'POST',
            mode: 'cors',
            headers: {"Content-Type": "application/json", 
            "Access-Control-Allow-Headers": "application/json"},
            body: JSON.stringify(message.content)})
            .then(val => val.text()).then(result => sendResponse(result));
        
        return true;
    }
);