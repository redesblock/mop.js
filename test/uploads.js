var MopJS = require("@redesblock/mop.js");
const path = require('path');
const fs = require('fs');

async function uploads(thread, dirs) {
    const gateway = "http://gateway.mopweb3.cn/mop/"
    const batchId = "e8132426ad06832d38eb5fa9b757b7351811ea9910ff7c2c3736c4c8b59dd5cc"
    const nodeIP = "182.140.245.81"      

    var mop = new MopJS.Mop("http://" + nodeIP + ":1683")
    var mopDebug = new MopJS.MopDebug("http://" + nodeIP + ":1685")
    for (let i in dirs) {
        const directory = dirs[i]
        if (directory == "") {
            continue
        }
        console.log(thread + ": " + directory + " ...")
        const d1 = new Date()
        try {
            var fileHash = await mop.uploadFilesFromDirectory(batchId, directory)
            const d2 = new Date()
            console.log(thread + ": " + directory + " tag: " + fileHash.tagUid)
            console.log(thread + ": " + directory + " reference: " + gateway + fileHash.reference + "/")
            console.log(thread + ": " + directory + " upload elapsed: " + parseInt(d2-d1)/1000)
            while(true) {
                const tag = await mopDebug.retrieveExtendedTag(fileHash.tagUid)
                if (tag.synced + tag.seen >= tag.stored) {
                    const d3 = new Date()
                    console.log(thread + ": " + directory + " broadcast elapsed: " + parseInt(d3-d1)/1000)
                    break
                } else {
                    console.log(thread + ": " + directory + " broadcast process: ", (tag.synced + tag.seen) + "/" + tag.total)
                }
                sleep(5000)
            }
            fs.appendFileSync('result'+'.txt', path.basename(directory)+'|'+fileHash.reference+'\n');
        } catch(err) {
            fs.appendFileSync('result'+'.err', directory+'\n');
            console.error(err)
        }     
    } 
}

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() - start < delay) {
        continue;
    }
}

try {
    const data = fs.readFileSync('sortrankt60.txt', 'UTF-8');
    lines = data.split(/\r?\n/);
    len = lines.length
    threads = 5
    num = parseInt(len / threads)
    if (num == 0) {
        num = 1
        threads = len
    } 
    for(var i=0; i < threads; i++){
        let from = i * num
        if (i == threads-1) {
            uploads(i, lines.slice(from))
        } else {
            let to = (i+1) * num
            uploads(i, lines.slice(from, to))
        }
    }
} catch (err) {
    console.error(err);
}