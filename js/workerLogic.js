// Moving all worker logic to a second file to switch easily between worker and main thread, if needed.
//initiate wasm
importScripts('../bld/a.out.js');
zlMdModeBc=true; // required to use zlMdTools (below)
importScripts('../bldCmarkGfm/zlMdTools.js');

    
ghWebApp.onRuntimeInitialized = _ => 
{
    ghWebApp._zlInitMd2HTML();
    self.postMessage({aTopic:'workerIsReady', aBuf:""});
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
  const isValid = ghWebApp.ccall("appRenderRoute", //name of C Func
                'number', //return type
                ["string", "boolean"], //argument types
                [inRouteStr, isLoggedIn]); //arguments

  if(isValid)
  {
    console.log(`Route ${inRouteStr} Not FOUND! Error code: ${isValid}`);
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

function str2ab(str) 
{
    var buf = new ArrayBuffer(str.length*1); // 1 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}