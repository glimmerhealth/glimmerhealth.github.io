// Moving all worker logic to a second file to switch easily between worker and main thread, if needed.
//initiate wasm
importScripts('../bld/a.out.js');
zlMdModeBc=true; // required to use zlMdTools (below)
importScripts('../bldCmarkGfm/zlMdTools.js');
let blogIndexInHtml = "";
const blogDataUrl="https://GlimmerHealth.com/blog";
const maxPosts=3;

    
ghWebApp.onRuntimeInitialized = _ => 
{
    ghWebApp._zlInitMd2HTML();
    self.postMessage({aTopic:'workerIsReady', aBuf:""});
    let postCnt=0;
    for(postCnt=maxPosts; postCnt>=1; postCnt--)
    {
      const numInStr = postCnt.toString();
      const postMetaDataLink=blogDataUrl + "/" + numInStr + "/" + numInStr+ ".json";
      fetch(postMetaDataLink);
    }
};

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


function handleRenderRoute(inRouteStr, isLoggedIn)
{
  switch(inRouteStr)
  {
    case "":
    case "/":
    {
      getHtmlFromMdFile("../content/index.md", cbIndexRoute);
    }
    break;

    case "/blog":
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
function renderBlogPage(inBlogPath, inMaxPosts)
{
  let postCnt = 0;
  blogIndexInHtml="";

  for(postCnt=inMaxPosts; postCnt>=1; postCnt--)
  {
    const numInStr = postCnt.toString();
    const postMetaDataLink=inBlogPath + "/" + numInStr + "/" + numInStr+ ".json";
    const postMdUrl = inBlogPath + "/" + numInStr + "/" + numInStr+ ".md";
    console.log(`\n\nPost MetaData Link is: ${postMetaDataLink}\n\n`);
    getPostMetaData(postMetaDataLink, buildPostSummary, postCnt==1?true:false , postMdUrl);
    
  }
}

function buildPostSummary(inPostDataJSON, isFinalPost, postMdUrl)
{
  const postTitle = inPostDataJSON.title;
  const postAuthorThumbnail="content/shesh.jpg";
  const postAuthors = inPostDataJSON.authors[0];
  const postDate= inPostDataJSON.publishDate;
  const postSummary = "";
  const postLink = "#renderPost?post=" + postMdUrl;
  console.log(postLink);

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
            <a href=${postLink} style="margin: 0.5%;" class="button is-primary is-outlined is-rounded"> Read More </a>
            </div>
        </div>
      </div>
    </div><!--END OF Testing Cards-->
    `;

    //return postTemplate;
    blogIndexInHtml = blogIndexInHtml + postTemplate;
    if(isFinalPost===true)
    {
      const myAbuf = str2ab(blogIndexInHtml);
      self.postMessage({aTopic:'paintHome', aBuf:myAbuf}, [myAbuf]);
    }
}

function getPostMetaData(inPostMetaDataPath, cbFunc, isFinalPost, postMdUrl)
{
  fetch(inPostMetaDataPath)
  .then(function(response) 
  {
      return response.text();
  })
  .then(function(retText) 
  {
      const postData = JSON.parse(retText);
      
      cbFunc(postData, isFinalPost, postMdUrl);
      return postData;
  });
}


function renderPostPage(inPostMdUrl)
{
  const postUrl = getUrlVars()["post"];
  getHtmlFromMdFile(postUrl, cbRenderPost);
}

function cbRenderPost(inHtml)
{
  const postTemplate = `  <div class="block">
    <nav class="breadcrumb">
      <ul>
        <li>
          <a href="#">GlimmerHealth</a>
        </li>
        <li>
          <a href="javascript:history.back()">Blog</a>
        </li>
        <li class="is-active">
          <a>Post</a>
        </li>
      </ul>
    </nav>
  </div>
  `;

  const finalHtml = postTemplate + inHtml;
  const myAbuf = str2ab(blogIndexInHtml);
  self.postMessage({aTopic:'paintHome', aBuf:myAbuf}, [myAbuf]);
}

function getUrlVars() {
  var vars = {};
  var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
      vars[key] = value;
  });
  return vars;
}