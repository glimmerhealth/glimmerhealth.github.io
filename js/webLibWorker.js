// This file should only contain worker thread specific code.
sayWorkerReady() ;
let workerFirstRoute=null;
importScripts('zlUtils.js');
importScripts('workerLogic.js');

onmessage = function (msg) 
{
    switch (msg.data.aTopic) 
    {
        case 'do_sendWorkerArrBuff':
        {
            var u8buf = new Uint16Array(msg.data.aBuf);
            const len = u8buf.byteLength;
            var cnt = 0;
            for(cnt=0; cnt<len; cnt++)
            {
                //this.console.log(`Worker: ${u8buf[cnt]}`);
            }
            sendWorkerArrBuff(u8buf);
        }
        break;

        case 'renderRoute':
        {
            //this.console.log("renderRoute Req received!");
            let inRouteStr = ab2str(msg.data.aBuf)
            handleRenderRoute(inRouteStr, msg.data.loggedIn);
        }
        break;

        case "renderBlogPost":
        {
            //this.console.log("renderRoute Req received!");
            let inRouteStr = ab2str(msg.data.aBuf)
            renderPostPage(inRouteStr, msg.data.loggedIn);
        }
        break;
        case 'firstRoute':
            workerFirstRoute = ab2str(msg.data.aBuf);  
        break;
        default:
            throw 'no aTopic on incoming message to ChromeWorker';
    }
}

function sayWorkerReady() 
{
    self.postMessage({aTopic:'workerIsReady', aBuf:""});
}

