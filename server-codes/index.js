const express = require("express");
const execSync = require('child_process').execSync;
const fs = require('fs');
const app = express();
const port = 5050;
let id = 0; // incremental id that will denote the subfolder to create

app.get("/", (req, res) => {
    console.log("Welcome!");
    res.send("Welcome");
});

app.use(express.json());
app.post("/refer", (req, res) => {
    console.log(`Got post request...${req.body}`);
    let paperObj = req.body;

    // if no other paper, send back a string with null
    if (paperObj.otherPapers.length == 0) {
        console.log("No paper refers to this paper!");
        res.send("null");
        return;
    }

    // extract title
    let title = `"${paperObj.myPaper.title}"`;

    // create text file
    let abstracts = paperObj.otherPapers.map(x => x.title.concat('. ', x.abstract));
    let abstractsString = abstracts.join('\n');
    let dat_file = "tmp_task_" + id + ".dat";
    let dat_path = "search_ranker_test/" + dat_file;
    fs.writeFileSync(dat_path, abstractsString);

    output = execSync(`bash run.sh ${id} ${dat_file} ${title} && rm -f ${dat_file}`, {cwd: "search_ranker_test"});

    // read rank file
    let rankFile = "search_ranker_test/tmp_task_" + id + "/rank";
    let rankString = fs.readFileSync(rankFile).toString();

    // remove tmp files and idx folder
    execSync("rm -rf tmp* idx", {cwd: "search_ranker_test"});

    console.log(`stdout from id = ${id}:\n${output}`);
    id += 1;
    res.send(JSON.stringify({rank: rankString, content: paperObj}));
});

app.listen(port, () => {
    console.log(`LISTENING ON PORT ${port}`);
});