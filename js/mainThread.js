var myWorker = new Worker('js/webLibWorker.js');
var isUserLoggedIn = false;

function paintHome(inHtml)
{
    var contentElement = null;
    fastdom.measure(() => 
    {
        contentElement = measureHome();
    });
    fastdom.mutate(() => 
    {
        mutateHome(contentElement, inHtml)
    });

}

function paintLogin(inStr)
{
    console.log(`MT: PaintLogin invoked with isUserLoggedIn: ${isUserLoggedIn}`);
    window.location.href = 'login.html';
}

function paintLogout(inStr)
{
    firebase.auth().signOut();
    console.log(`MT: PaintLogout invoked with isUserLoggedIn: ${isUserLoggedIn}`);
    if(inStr)
    {
        window.location.href = inStr;
    }
    else
    {
        window.location.href = '#';
    }
    
}

function paintString(inStr)
{
    var contentElement = null;
    fastdom.measure(() => 
    {
        contentElement = measureHome();
    });
    fastdom.mutate(() => 
    {
        contentElement.innerHTML = inStr;
    });

}

function reqWorkerRenderRoute(inRouteString)
{
    let arrayBuffInStr = str2ab(inRouteString);
    myWorker.postMessage(
    {
        aTopic: 'renderRoute',
        aBuf: arrayBuffInStr,
        loggedIn: false
    },
    [
        arrayBuffInStr
    ]);
}

function reqWorkerRenderPost(inPostLink)
{
    let arrayBuffInStr = str2ab(inPostLink);
    myWorker.postMessage(
    {
        aTopic: 'renderBlogPost',
        aBuf: arrayBuffInStr,
        loggedIn: false
    },
    [
        arrayBuffInStr
    ]);
}

function reqFirstRoute2Render(inRouteString)
{
    let arrayBuffInStr = str2ab(inRouteString);
    myWorker.postMessage(
    {
        aTopic: 'firstRoute',
        aBuf: arrayBuffInStr,
        loggedIn: false
    },
    [
        arrayBuffInStr
    ]);
}


// Router
function zlRouter(inRoute) 
{ 
    const newRoute = window.location.hash;
    //window.history.replaceState({}, "", inRoute);
    closeNav();
    reqWorkerRenderRoute(newRoute);
}

function zlBlogRender(inPostLink) 
{ 
    //const newRoute = window.location.hash;
    window.history.replaceState({}, "", inPostLink);
    closeNav();
    reqWorkerRenderPost(inPostLink);
}


window.onhashchange = zlRouter;

myWorker.onmessage = function handleMessageFromWorker(msg) 
{
    switch (msg.data.aTopic) 
    {
        case 'workerIsReady':
        {
            const routeOnFirstLoad = window.location.hash;
            const postUrl = getUrlVars(routeOnFirstLoad)["post"];
            if(typeof postUrl!= 'undefined')
            {
                zlBlogRender(routeOnFirstLoad);
            }
            else
            {
                const contentEle=document.getElementById("content");
                if(contentEle.outerHTML==='<div id="content"></div>')
                {
                    //console.log("\nRequesting first load on: " + routeOnFirstLoad + "\n\n\n\n");
                    reqWorkerRenderRoute(routeOnFirstLoad);
                }
                else
                {
                    //console.log("\nAlready statically rendered. Skipping rendering.\n\n\n\n");
                }
            }
            
        }    
        break;

        case 'paintHome':
        {
            const u8buf = new Uint16Array(msg.data.aBuf);
            const mainHtml=ab2str(u8buf)
            paintHome(mainHtml);
        }
        break;

        case 'paintString':
			paintString(msg.data.aBuf);
        break;
        case 'paintLogin':
            paintLogin(msg.data.aBuf);
        break;
        case 'paintLogout':
            paintLogout(msg.data.aBuf);
        break;

        default:
            throw 'no aTopic on incoming message to ChromeWorker';
    }
}

function measureHome()
{

    var locContentElement = document.getElementById('content');

    return(locContentElement);
}

function mutateHome(inContentElement, inHtml)
{
    
    if(inContentElement)
    {
        inContentElement.innerHTML = inHtml;
    }
    else
    {
        console.log("no element");
    }

}