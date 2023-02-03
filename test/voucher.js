var MopJS = require("@redesblock/mop.js");

async function test() {    
    var mopDebug = new MopJS.MopDebug("http://127.0.0.1:1685")

    const batch = await mopDebug.createVoucherBatch(1000000000, 35, {waitForUsable: false})
    console.log(batch)
}

test()

