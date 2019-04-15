// Moving all worker logic to a second file to switch easily between worker and main thread, if needed.
//initiate wasm
importScripts('https://cdnjs.cloudflare.com/ajax/libs/markdown-it/8.4.2/markdown-it.min.js');
zlMdModeBc=true; // required to use zlMdTools (below)
const blogDataUrl="https://GlimmerHealth.com/blog";
const maxPosts=3;

// Takes a string and returns a pointer on WASM heap that can be passed to a WASM method
// A Malloc happens in here, so a FREE needs to be called on this ptr eventually
function getHeapPtr(inString)
{
  let u8Str = stringToU8Buffer(inString);
  let u8StrLen = 1+(u8Str.length * u8Str.BYTES_PER_ELEMENT);
  let u8StrPtr = ghWebApp._malloc(u8StrLen);
  u8StrPtr[u8StrLen-1] =0;
  let u8StrHeap = new Uint8Array(ghWebApp.HEAPU8.buffer, u8StrPtr, u8StrLen);
  u8StrHeap.set(new Uint8Array(u8Str.buffer));
  u8StrPtr[u8StrLen-1] =0;

  return u8StrPtr;
}


async function handleRenderRoute(inRouteStr, isLoggedIn)
{
  switch(inRouteStr)
  {
    case "":
    case "#":
    case "/":
    {
      const indexHtml = await getHtmlFromMdLink("../content/index.md");
      cbIndexRoute(indexHtml);
    }
    break;

    case "#blog":
    {
      renderBlogPage(blogDataUrl, maxPosts);
    }
    break;

    default:
      console.log("WorkerLogic: No route found for: " + inRouteStr );
    break;
  }
}


// Takes a string and returns a pointer on WASM heap that can be passed to a WASM method
// A Malloc happens in here, so a FREE needs to be called on this ptr eventually
function getHeapPtrFromU8Buf(inU8Buf)
{
  let u8Str = inU8Buf;//stringToU8Buffer(inString);
  let u8StrLen = (u8Str.length * u8Str.BYTES_PER_ELEMENT);
  let u8StrPtr = ghWebApp._malloc(u8StrLen);
    u8StrPtr[u8StrLen-1] =0;
  
  let u8StrHeap = new Uint8Array(ghWebApp.HEAPU8.buffer, u8StrPtr, u8StrLen);
  u8StrHeap.set(new Uint8Array(u8Str.buffer));
  u8StrPtr[u8StrLen-1] =0;
  
  return u8StrPtr;
}

function cbIndexRoute(inHtmlString)
{
  const myAbuf = str2ab(inHtmlString);
  self.postMessage({aTopic:'paintHome', aBuf:myAbuf}, [myAbuf]);
}


/*
This function constitutes the blog mini app. It shall render a blog index page, and handle navigating
to and from blog posts.

TODO: Add a pagination section at the end of the blog index page
*/
async function renderBlogPage(inBlogPath, inMaxPosts)
{
  let postCnt = 0;
  let finalHtmlOut="";

  for(postCnt=inMaxPosts; postCnt>=1; postCnt--)
  {
    const numInStr = postCnt.toString();
    const postMetaDataLink=inBlogPath + "/" + numInStr + "/" + numInStr+ ".json";
    const postMdUrl = inBlogPath + "/" + numInStr + "/" + numInStr+ ".md";
    const postJsonData = await getPostMetaData(postMetaDataLink);
    const postSummaryHtml= buildPostSummary(postJsonData, postMdUrl);
    finalHtmlOut = finalHtmlOut + postSummaryHtml;
  }

  const myAbuf = str2ab(finalHtmlOut);
  self.postMessage({aTopic:'paintHome', aBuf:myAbuf}, [myAbuf]);
}

function buildPostSummary(inPostDataJSON, postMdUrl)
{
  const postTitle = inPostDataJSON.title;
  const postAuthorThumbnail="content/shesh.jpg";
  const postAuthors = inPostDataJSON.authors[0];
  const postDate= inPostDataJSON.publishDate;
  const postSummary = "";
  const postLink = "/#blog?post=" + postMdUrl;

  let postTemplate = `
    <div class="block">
    <!--Testing Cards-->
      <div class="card">
        <!--
        <div class="card-image">
          <figure class="image " style="height: 50%; width: 50%;"> <img src="https://source.unsplash.com/random/800x600" alt="Image"> </figure>
        </div>
        -->
        <div class="card-content">
              <p class="title is-1">${postTitle}</p>
          <div class="media">
            <div class="media-left">
              <figure class="image" style="height: 40px; width: 40px;"> <img src=${postAuthorThumbnail} alt="Image"> </figure>
            </div>
            <div class="media-content">
              <p class="subtitle is-5">by ${postAuthors} <br>
                <small>Published On: ${postDate}</small>  
              </p>
              
              <!--
                <p class="subtitle is-6">@johnsmith</p>
              -->
            </div>
          </div>
          <div class="content">
            ${postSummary} 
            </div>
            <div class="block">
            <a href="javascript:zlBlogRender('${postLink}')" style="margin: 0.5%;" class="button is-primary is-outlined is-rounded"> Read More </a>
            </div>
        </div>
      </div>
    </div><!--END OF Testing Cards-->
    `;

    return postTemplate;
}

async function getPostMetaData(inPostMetaDataPath)
{
  const response = await fetch(inPostMetaDataPath);
  const jsonResp = await response.text();
  const postData = JSON.parse(jsonResp);
  return postData;
}


async function renderPostPage(inPostMdUrl, isLoggedIn)
{
  const postUrl = getUrlVars(inPostMdUrl)["post"];
  const postMetaDataLink=postUrl.replace(".md", ".json");
  const postMetaData=await getPostMetaData(postMetaDataLink);
  const outHtml = await getHtmlFromMdLink(postUrl);
  cbRenderPost(outHtml, postMetaData);
}

function cbRenderPost(inHtml, postMetaData)
{
  const postTitle = postMetaData.title;
  const postAuthors = postMetaData.authors[0];
  const postDate= postMetaData.publishDate;
  
  const postTemplate = `  <div class="block">
    <nav class="breadcrumb">
      <ul>
        <li>
          <a href="#">GlimmerHealth</a>
        </li>
        <li>
          <a href="#blog">Blog</a>
        </li>
        <li class="is-active">
          <a>Post</a>
        </li>
      </ul>
    </nav>
  </div>
  <br>
  <div class="block">
  <h1>${postTitle}</h1>
  <h4>by ${postAuthors}</h4>
  <h5> Published: ${postDate} </h5>
  </div>
  `;

  const finalHtml = postTemplate + inHtml;
  const myAbuf = str2ab(finalHtml);
  self.postMessage({aTopic:'paintHome', aBuf:myAbuf}, [myAbuf]);
}

async function getHtmlFromMdLink(inFilePath)
{
  const response = await fetch(inFilePath);
  const rawMdText = await response.text();
  const retHtmlStr=getHtmlFromMdString(rawMdText);
  return retHtmlStr;
}

function getHtmlFromMdString(inStr)
{
  const md = markdownit({
      html: true,
      linkify: true,
      typographer: true
      });
  const result = md.render(inStr);
  return result;
}