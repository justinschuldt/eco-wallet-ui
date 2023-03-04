/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
declare global {
    interface Worker {
      Module: any;
    }
  }

function solidityCompiler() {
    const ctx: Worker = self as any;
    let fetched = false
    let soljson: any = undefined
    let compile: any = undefined
  
    ctx.addEventListener('message', ({ data }) => {
        if (data === 'fetch-compiler-versions') {
            fetch('https://binaries.soliditylang.org/bin/list.json').then(response => response.json()).then(result => {
            postMessage(result)
            })
        } else {
            if (fetched === false) {
                importScripts(data.version);
                fetched = true
            } 

            // see if soljson needs to be loaded
            if (!soljson) {
                soljson = ctx.Module
            }

            // see if compile needs to be loaded
            if (!compile && '_solidity_compile' in soljson) {
                compile = soljson.cwrap('solidity_compile', 'string', ['string', 'number']);

            }

            // compile, if the method is there
            if (compile) {
                const output = JSON.parse(compile(data.input))
                // console.log("going to return compile: ", data.id)
                postMessage({ output, id: data.id})
            }
       }
    });

}

export default solidityCompiler