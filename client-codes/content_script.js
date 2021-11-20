async function iteratePapersAndCitedPapers(maxRecursion) {
    function filterDot(name) {
        if (name.slice(-1) == '\u2026') {
            return name.slice(0, -1);
        }
        return name;
    };

    // Find my name
    let userName = document.getElementById("gsc_prf_in").innerText;
    let authorInformation = new Object();

    let getNameAbbreviation = (fullName) => {
        parts = fullName.trim().split(" ", 2);
        if (parts.length <= 1) {
            return parts[0];
        }
        else {
            return `${parts[0][0]} ${parts[1]}`;
        }
    };

    let officialName = getNameAbbreviation(userName);

    console.log(`User Name: ${userName}, abbreviated as ${officialName}`);

    // Find my papers
    let userPapers = document.querySelectorAll("tr.gsc_a_tr");

    // Define function to follow link
    let citeSum = 0;
    let citeSumNoSelf = 0;
    let authorSet;

    async function followLink(url, paperName, paperObject, recursionNum) {
        if (recursionNum >= maxRecursion) {
            console.log("Reach maximum recursion!");
            return true;
        }

        let html = await fetch(url).then(res => { return res.text(); });

        // convert html to doc
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // process and update the citation number
        let processText = (x) => {
            x = x.split("-")[0].split(",");
            x.forEach(function (ele, idx, arr) {
                arr[idx] = ele.trim();
            });
            return x;
        };

        // Get title, url and abstract
        let titles = Array.from(doc.querySelectorAll("h3.gs_rt a")).map(div => div.innerText);
        let urls = Array.from(doc.querySelectorAll("h3.gs_rt a")).map(div => div.href);
        let abstracts = Array.from(doc.querySelectorAll("div.gs_rs")).map(div => div.innerText);

        // Fill in paperObject
        for (let i = 0; i < titles.length; i++) {
            paperObject.otherPapers.push({title: titles[i], url: urls[i], abstract: abstracts[i]});
        }

        // Get all cited papers
        let citedPapers = doc.querySelectorAll("div.gs_a");

        // Find all with Google Scholar Account
        citedPapers.forEach((val) => {
            let names = val.innerText.split("-", 1)[0].split(",").map((val) => { return filterDot(val.trim()) });
            let name_url = Object.fromEntries(names.map(x => [x, "null"]));
            let name_gs = Object.fromEntries(
                [...val.querySelectorAll("a")].map(x => [x.innerText, x.href]));
            for (let name in name_url) {
                if (name_gs[name]) {
                    name_url[name] = name_gs[name];
                }
            }
            console.log(name_url);

            // now we iterate name_url
            for (let name in name_url) {
                let key = name + ":" + name_url[name];

                if (!authorInformation[key]) {
                    authorInformation[key] = { "Paper": {}, "URL": name_url[name], "FullName": "Unknown", "Affiliation": "Unknown", "Total Citation": 0 };
                }

                if (!authorInformation[key]["Paper"][paperName]) {
                    authorInformation[key]["Paper"][paperName] = 1;
                } else {
                    authorInformation[key]["Paper"][paperName] += 1;
                }
                authorInformation[key]["Total Citation"] += 1;
            }
        });

        let totalCitation = citedPapers.length;
        let withoutSelfCitation = 0;
        for (let citedPaper of citedPapers) {
            let authors = processText(citedPaper.innerText);
            console.log(`${authors.length} authors: ${authors}`)
            let ifSelf = false;
            authors.forEach(ele => {
                if (authorSet.has(ele)) {
                    ifSelf = true;
                }
            })
            if (!ifSelf) {
                withoutSelfCitation += 1;
            }
        }

        // find url to next page
        let nextUrl = null;
        doc.querySelectorAll("#gs_n a").forEach((node) => {
            if (node.innerText == "Next") {
                nextUrl = node.href;
            }
        });

        citeSum += totalCitation;
        citeSumNoSelf += withoutSelfCitation;
        if (nextUrl) {
            console.log(`Next link: ${nextUrl}`);
            // create a randome timeout from 200ms to 300ms
            setTimeout(() => { }, Math.random() * 100 + 200);
            return followLink(nextUrl, paperName, paperObject, recursionNum + 1);
        }
        return true;
    }

    for (let paper of userPapers) {
        let citation = paper.querySelector("td a.gsc_a_ac");
        let authors = paper.querySelector("div").innerText;
        let paperName = paper.querySelector("a.gsc_a_at").innerText;
        let paperUrl = paper.querySelector("a.gsc_a_at").href;
        let url = citation.href;

        // get all author names
        authors = authors.split(",");
        authors.forEach((val, idx, arr) => {
            arr[idx] = val.trim();
        });
        authorSet = new Set(authors);

        console.log(`${authorSet.size} authors: ${Array.from(authorSet)}`);

        console.log(`Start scanning for paper ${paperName} at ${url}`);

        console.log('Extract abstract...');
        async function extractAbstract(paperUrl) {
            let html = await fetch(paperUrl).then(res => { return res.text(); });

            // convert html to doc
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            return Array.from(doc.querySelectorAll("div.gs_scl")).
                filter(ele => ele.innerText.startsWith("Description"))[0].
                innerText.substring("Description".length);
        }

        // Initialize paper object
        paperObject = new Object();

        if (paperUrl) {
            paperObject["myPaper"] = {
                title: paperName,
                abstract: null,
                url: paperUrl
            };
            paperObject.myPaper.abstract = await extractAbstract(paperUrl);
        }
        paperObject["otherPapers"] = new Array();


        citeSum = 0;
        citeSumNoSelf = 0;
        await followLink(url, paperName, paperObject, 0);
        console.log(`Finished scanning for paper ${paperName} at ${url}`);

        // start analyzing the reference
        console.log("Here is paper object:");
        console.dir(paperObject);
        if (paperObject.myPaper && paperObject.otherPapers.length) {
            chrome.runtime.sendMessage(
                {content: paperObject},
                result => {
                    let resultObj = JSON.parse(result);

                    // parse the result and print abstract
                    let rank = resultObj.rank.split(' ').map(x=>Number(x));
                    let content = resultObj.content;
                    let curr = 1;

                    // find the doc to append child
                    let parentElement = Array.from(document.querySelectorAll("td.gsc_a_t")).filter(x=>x.querySelector("a").href == content.myPaper.url)[0]
                    console.dir(parentElement);
                    rank.map(x => 
                        {
                            let display = `- Rank ${curr++}: ${content.otherPapers[x].title}\n`;
                            console.log(display);
                            let paperElement = document.createElement("a");
                            paperElement.innerText = display;
                            paperElement.href = content.otherPapers[x].url;
                            parentElement.appendChild(paperElement);
                        });
                }
            );
        }

        // detect google scholar number
        citation.innerText += `(${citeSumNoSelf})`;
        console.log(`Total Citation: ${citeSum}, Without Self-citation: ${citeSumNoSelf}`);
    }
    // Go to each author Google Scholar Page and Get their full name and affiliation
    async function GetFullNameAndAffiliation() {
        for (let property in authorInformation) {
            let url = authorInformation[property]["URL"];
            if (url == "null") {
                continue;
            }
            let html = await fetch(url).then(res => { return res.text(); });
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            authorInformation[property]["FullName"] = doc.querySelector("#gsc_prf_in").innerText;
            try {
                authorInformation[property]["Affiliation"] = doc.querySelector("div.gsc_prf_il").innerText;
            } catch (err) {
                console.log(`Cannot find affiliation for ${authorInformation[property]["FullName"]}`);
            }
        }
        return true;
    }

    await GetFullNameAndAffiliation();
    console.log(authorInformation);
    return JSON.stringify(authorInformation);
}

chrome.runtime.onMessage.addListener(
    function (request, _, sendResponse) {
        if (!request.summary) return true;
        console.log(request.summary);
        let depth = parseInt(request.depth);
        console.log(depth);

        iteratePapersAndCitedPapers(depth).then(sendResponse);
        return true;
    }
);