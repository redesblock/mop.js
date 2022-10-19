var MopJS = require("@redesblock/mop.js");

async function test() {    
    var mopDebug = new MopJS.HopDebug("http://127.0.0.1:1635")
    const batch = await mopDebug.createVoucherBatch(100000000000, 20)
    console.log(batch)
}

test()

