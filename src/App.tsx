import React, {useState} from 'react';
import MonacoEditor from 'react-monaco-editor';
import Web3 from "web3"
import { useMetaMask } from "metamask-react";

import solidityCompiler from "./workers/solc-complier.worker"

const worker = new Worker(URL.createObjectURL(new Blob([`(${solidityCompiler})()`], { type: 'module' }) ));

const simple = `// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract C { 
  fallback() external { 
    emit Hello("hello");
  } 
  event Hello(string);
}`

function App({}: {}) {
  const { status, connect, account, chainId, ethereum } = useMetaMask();

  const [code, setCode] = useState(simple)
  const [address, setAddress] = useState("")
  const [compileResult, setCompileResult] = useState("")
  const [unsafeCompileResult, setUnsafeCompileResult] = useState("")

  const editorDidMount = (editor: any, monaco: any) => {
    editor.focus();
  }

  const onChange = (newValue: any, e: any) => {
    setCode(newValue)
  }
  worker.onerror = ev => {
    console.error('worker error: ', ev)
  }
  worker.onmessage = ev => {
    const output = ev.data
    const byteCode = output.contracts.Compiled_Contracts.C.evm.deployedBytecode.object
    if (byteCode) {
      console.log("got byteCode from worker: ", byteCode)
      setCompileResult(byteCode)
    } else {
      console.log("did not get byteCode from worker")
    }

  }
  const compile = () => {
    console.log('code', code)

    const version = 'soljson-v0.8.16+commit.07a7930e.js'

    const input = JSON.stringify({
      language: 'Solidity',
      sources: {
          'Compiled_Contracts': {
          content: code
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
      },
    })
    worker.postMessage({
        version: `https://binaries.soliditylang.org/bin/${version}`,
        input
    })

  }
  const mmStatus = () => {
    console.log("status: ", status)
    if (status === "initializing") return <div>Synchronisation with MetaMask ongoing...</div>

    if (status === "unavailable") return <div>MetaMask not available :(</div>

    if (status === "notConnected") return <button onClick={connect}>Connect to MetaMask</button>

    if (status === "connecting") return <div>Connecting...</div>

    if (status === "connected") return <div>Connected account {account} on chain ID {chainId}</div>
  }
  const connectWallet = () => {

    const eth = ethereum
    if(eth){
      // Do something 
      console.log("has metamask")
    } else {
      // no metamask
      console.log("does not seem to have metamask, returning ")
      return
    }
    console.log("going to request accounts")
    eth.request({method:'eth_requestAccounts'})
      .then((res: any)=>{
              // Return the address of the wallet
              console.log(res)
              let acct = res.length >=1 ? res[0] : undefined
              if (acct) {
                setAddress(acct)
              }
      }, (err: any) => {
          console.log(console.error( "failed getting accounts. err ", err))
        })
  }
  const sendTx = () => {
    async function send(bytes: string, fromAddr: string) {
      const eth = ethereum
      const web3 = new Web3(ethereum);
      await eth.enable();
      const address = "0x82b035B4405Dd60b449b054894004FeE80566655"
      const abi = JSON.parse(`[{"inputs":[],"name":"RuntimeDeployError","type":"error"},{"inputs":[],"name":"RuntimeDestroyError","type":"error"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"}],"name":"_deployRuntime","outputs":[{"internalType":"address","name":"runtime","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"exec","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"getExecuteInfo","outputs":[{"internalType":"address","name":"runtime","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"}],"name":"getRuntimeByRuntimeCode","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"getWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"runtime","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"reexec","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint248","name":"","type":"uint248"}],"name":"wasNonceUsed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]`)
      const NameContract = new web3.eth.Contract(abi, address);

      let runtimeCode =  "0x" + bytes
      console.log("runtimeCode: ", runtimeCode)
      let callData = "0x"
      let walletSalt = 0
      NameContract.methods.exec(runtimeCode, callData, walletSalt).send({from: fromAddr});
    }
    console.log("compileResult: ", compileResult)
    console.log("this.state.address ", address)
    if (compileResult && address) {
      console.log("have bytecode and from address, going to send")
      send(compileResult, address)
    }
  }


    const options = {
      selectOnLineNumbers: true
    }; 
    let buttonStyle = "rounded-md bg-white/10 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
    return (
      <>
          <MonacoEditor
            width="100%"
            height="40vh"
            language="sol"
            theme="vs-dark"
            value={code}
            options={options}
            onChange={onChange}
            editorDidMount={editorDidMount}
          />
          <div>

     
            <div style={{display: "flex", justifyContent:"space-around"}} className="text-white pb-2">
                {mmStatus()}
            </div>

            <div style={{display: "flex", justifyContent:"space-around"}}>
              <button
                onClick={compile}
                type="button"
                className={buttonStyle}
              >
                compile
              </button>
              <button
                onClick={connectWallet}
                type="button"
                className={buttonStyle}
              >
                connect
              </button>
              <button
                onClick={sendTx}
                type="button"
                className={buttonStyle}
             >
                send
              </button>
            </div>
          </div>
      </>
    );
}


export default App;
