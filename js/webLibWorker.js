// This file should only contain worker thread specific code.
sayWorkerReady() ;
let workerFirstRoute=null;
const codePrefix=location.origin + "/js/";
importScripts(codePrefix+'zlUtils.js');

onmessage = function (msg) 
{
    switch (msg.data.aTopic) 
    {
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

// Moving all worker logic to a second file to switch easily between worker and main thread, if needed.
const blogDataUrl= location.origin + "/blog/";
const maxPosts=3;
const INNER_HTML_NAME="innerHtml.html";

async function handleRenderRoute(inRouteStr, isLoggedIn)
{
  switch(inRouteStr)
  {
    case "":
    case "/":
    {
      const inFilePath = location.origin + "/" + INNER_HTML_NAME;
      const response = await fetch(inFilePath);
      const indexHtml = await response.text();
      cbIndexRoute(indexHtml);
    }
    break;

    case "/blog":
    {
      const inFilePath = location.origin + "/blog/" + INNER_HTML_NAME;
      const response = await fetch(inFilePath);
      const indexHtml = await response.text();
      cbIndexRoute(indexHtml);
    }
    break;

    default:
      console.log("WorkerLogic: No route found for: " + inRouteStr );
    break;
  }
}

function cbIndexRoute(inHtmlString)
{
  const myAbuf = str2ab(inHtmlString);
  self.postMessage({aTopic:'paintHome', aBuf:myAbuf}, [myAbuf]);
}

async function renderPostPage(inPostMdUrl, isLoggedIn)
{
  const inFilePath = location.origin + "/blog/" + inPostMdUrl + "/"+ INNER_HTML_NAME;
  const response = await fetch(inFilePath);
  const finalHtml = await response.text();
  const myAbuf = str2ab(finalHtml);
  self.postMessage({aTopic:'paintHome', aBuf:myAbuf}, [myAbuf]); 
}