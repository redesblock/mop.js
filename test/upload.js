var MopJS = require("@redesblock/mop.js");

async function upload({directory, index}) {
    return new Promise(async (resolve,reject) => {
        const gateway = "https://gateway.mopweb3.cn/mop/"
        const batchId = "e8132426ad06832d38eb5fa9b757b7351811ea9910ff7c2c3736c4c8b59dd5cc"
        const nodeIP = "182.140.245.81"
        
        var mop = new MopJS.Mop("http://" + nodeIP + ":1683")
        const d1 = new Date()
        var fileHash = await mop.uploadFilesFromDirectory(batchId, directory, {indexDocument:index, encrypt: false})
        const d2 = new Date()
        console.log(directory + " tag: " + fileHash.tagUid)
        console.log(directory + " reference: " + gateway + fileHash.reference + "/")
        console.log(directory + " upload elapsed: " + parseInt(d2-d1)/1000)
        
        var mopDebug = new MopJS.MopDebug("http://" + nodeIP + ":1685")
        while(true) {
            const tag = await mopDebug.retrieveExtendedTag(fileHash.tagUid)
            if (tag.synced + tag.seen >= tag.stored) {
                const d3 = new Date()
                console.log(directory + " broadcast elapsed: " + parseInt(d3-d1)/1000)
                break
            } else {
                console.log(directory + " broadcast process: ", (tag.synced + tag.seen) + "/" + tag.total)
            }
            sleep(5000)
        }
        resolve({name: directory, reference: fileHash.reference})
    })
}

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() - start < delay) {
        continue;
    }
}

upload({directory: "file_example_MP4_1920_18MG", index: "index.m3u8"}).then(data => {
    console.log("complete", data.name+"|"+data.reference)
}).catch(data => {
    console.log(data)
})

