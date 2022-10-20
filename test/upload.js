var MopJS = require("@redesblock/mop.js");

const gateway = "http://127.0.0.1:1683/mop/"

async function test() {
    batchId = "bc1e15ccb9e799b92a76df95b87f3169f37e31576c41df0527b3c7b420d89c14"
    
    
    // UploadOptions
    // pin? 上传的数据是否固定在上传节点上。不适用于以网关模式运行的节点！
    // encrypt? 上传的数据是否加密。不适用于以网关模式运行的节点！
    // tag? 自定义标签
    
    // FileUploadOptions
    // size? 文件大小
    // contentType? 文件类型
    
    // CollectionUploadOptions
    // indexDocument? 文件夹索引文件名
    // errorDocument? 错误文件名
    
    
    var mop = new MopJS.Mop("http://127.0.0.1:1683")
    // Upload Directory : Voucher、路径、名称、可选参数
    const d1 = new Date()
    var fileHash = await mop.uploadFilesFromDirectory(batchId, "file_example_MP4_1920_18MG", {indexDocument:"file_example_MP4_1920_18MG.m3u8"})
    const d2 = new Date()
    console.log("tag " + fileHash.tagUid)
    console.log("upload directory: " + gateway + fileHash.reference + "/")
    console.log("上传结束耗时秒数:" + parseInt(d2-d1)/1000)
    
    var mopDebug = new MopJS.MopDebug("http://127.0.0.1:1685")
    while(true) {
        const tag = await mopDebug.retrieveExtendedTag(fileHash.tagUid)
        if (tag.synced + tag.seen >= tag.stored) {
            const d3 = new Date()
            console.log("全网传播结束耗时秒数:" + parseInt(d3-d1)/1000)
            break
        } else {
            console.log("全网传播传播百分比", (tag.synced + tag.seen) + "/" + tag.total)
        }
        sleep(5000)
    }
}

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() - start < delay) {
        continue;
    }
}


test()

