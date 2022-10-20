var MopJS = require("@redesblock/mop.js");

async function test() {    
    var mopDebug = new MopJS.MopDebug("http://127.0.0.1:1685")

    const batch = await mopDebug.createVoucherBatch(100000000000, 20, {waitForUsable: false})
    console.log(batch)
}

test()

