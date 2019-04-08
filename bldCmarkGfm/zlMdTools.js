let zlMdModule;
if(zlMdModeBc===false || typeof zlMdModeBc == "undefined")
{
  zlMdModule=zlMd2Html;
}
else
{
  zlMdModule=ghWebApp;
}

if(zlMdModeBc===false || typeof zlMdModeBc == "undefined")
{
  zlMdModule.onRuntimeInitialized = _ => 
  {
    zlMdModule._zlInitMd2HTML();
    cbOnMdToolsInit();
    if(typeof zlMdToolsTest!="undefined" && zlMdToolsTest===true)
    {
      runTest();
    }

  }
}


function zlMdTooklsCleanUp()
{
  zlMdModule._zlUnInitMd2HTML();
}

function getHtmlFromMdFile(inFilePath, cbFunc)
{
  fetch(inFilePath)
    .then(function(response) 
    {
        return response.text();
    })
    .then(function(retText) 
    {
      const inStr = retText;
      const retHtmlStr=getHtmlFromMdString(inStr);
      cbFunc(retHtmlStr);
    });

}

function getHtmlFromMdString(inMdString)
{
  const rawMdNumOfBytes = inMdString.length;
  const outBufSize=rawMdNumOfBytes*3;
  var outPtr =  zlMdModule._malloc(outBufSize);
  
  const outLen = zlMdModule.ccall("zlConvertMd2HTML", //name of C Func
                'number', //return type
                ["string", "number", "number", "number"], //argument types
                [inMdString, rawMdNumOfBytes, outPtr, outBufSize]); //arguments

  const outHtmlStr = UTF8ToString(outPtr, outLen);
  zlMdModule._free(outPtr);
  return outHtmlStr;
}


/*=====================================================================
All functions beyond this are for unit testing this module
=====================================================================*/
function runTest()
{
  getHtmlFromMdFile("README.md", cbHtmlFromMdFile);
  setTimeout(carloExec, 3000);
  setTimeout(readMeExec, 6000);
  setTimeout(carloExec, 9000);
  setTimeout(readMeExec, 12000);
  setTimeout(zlMdTooklsCleanUp, 12500);
  
}

function readMeExec()
{
  getHtmlFromMdFile("README.md", cbHtmlFromMdFile);
}

function carloExec()
{
  getHtmlFromMdFile("bldCmarkGfm/carlo.md", cbHtmlFromMdFile);
}

function cbHtmlFromMdFile(inHtmlStr)
{
  const myOut = document.getElementById("mdOut");
  myOut.innerHTML=inHtmlStr;
}