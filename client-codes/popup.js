// Initialize button with user's preferred color
let searchIndependentCitation = document.getElementById("searchIndependentCitation");

searchIndependentCitation.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({
        active: true, currentWindow: true
    });
    let search_level = document.getElementById("maxDepthInput").value;

    chrome.tabs.sendMessage(tab.id, { summary: "requested", depth: search_level.toString() },
        (authorInformationJSON) => {
            let div = document.createElement("h1");
            div.innerText = "Summary";
            document.body.append(div);
            let table = document.createElement("table");

            authorInformation = JSON.parse(authorInformationJSON);

            function generateTableHead(table) {
                let thead = table.createTHead();
                let row = thead.insertRow();
                for (let key of ["Name", "Full Name", "Affiliation", "Citation Number", "Cited Paper(s)"]) {
                    let th = document.createElement("th");
                    let text = document.createTextNode(key);
                    th.appendChild(text);
                    row.appendChild(th);
                }
            }

            function generateTableData(table, data) {
                for (let key in data) {
                    let row = table.insertRow();
                    let shortName = key.split(":", 1);
                    let nametag = document.createElement("a");
                    nametag.appendChild(document.createTextNode(shortName));
                    if (data[key]["URL"] != "null") {
                        nametag.href = data[key]["URL"];
                    }
                    nametag.title = shortName;
                    row.insertCell().appendChild(nametag);
                    row.insertCell().appendChild(document.createTextNode(data[key]["FullName"]));
                    row.insertCell().appendChild(document.createTextNode(data[key]["Affiliation"]));
                    row.insertCell().appendChild(document.createTextNode(data[key]["Total Citation"]));
                    let papers = "";
                    for (let pname in data[key]["Paper"]) {
                        papers += pname + `(${data[key]["Paper"][pname]})\n`;
                    }
                    row.insertCell().appendChild(document.createTextNode(papers));
                }
            }

            generateTableData(table, authorInformation);
            generateTableHead(table);

            document.body.append(table);
            document.body.style.width = '600px';
        }
    );

});

