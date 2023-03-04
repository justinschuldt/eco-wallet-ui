import React, {useState} from 'react';
import Web3 from "web3"
import { useMetaMask } from "metamask-react";
import Inputs from "Inputs"
import { AbiItem } from 'web3-utils';

function App({}: {}) {
  const { status, connect, account, chainId, ethereum } = useMetaMask();

  const [address, setAddress] = useState("")
  const [compileResult, setCompileResult] = useState("")
  const [compileAbi, setCompileAbi] = useState<any[]>([])
  const [compileVersion, setCompileVersion] = useState("")

  const connectWallet = async () => {
    await connect()
    const eth = ethereum
    if (!eth) {
      console.log("does not seem to have metamask, returning ")
      return
    }
    try{
        const res = await eth.request({method:'eth_requestAccounts'})
        // console.log("metamask res: ", res)
        let acct = res.length >=1 ? res[0] : undefined
        if (acct) {
          setAddress(acct)
          return acct
        }
      } catch (err: any) { 
        console.log(console.error( "failed getting accounts. err ", err))
        throw err
      }
  }

  const sendTx = async () => {

    async function send(bytes: string, fromAddr: string) {
      const eth = ethereum
      const web3 = new Web3(ethereum);
      await eth.enable();

      
      const address = "0x82b035B4405Dd60b449b054894004FeE80566655"
      const abiString = `[{"inputs":[],"name":"RuntimeDeployError","type":"error"},{"inputs":[],"name":"RuntimeDestroyError","type":"error"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"}],"name":"_deployRuntime","outputs":[{"internalType":"address","name":"runtime","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"exec","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"getExecuteInfo","outputs":[{"internalType":"address","name":"runtime","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"}],"name":"getRuntimeByRuntimeCode","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"getWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"runtime","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"reexec","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint248","name":"","type":"uint248"}],"name":"wasNonceUsed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]`
      // console.log("bytes ", bytes)
      // console.log("senc abi ", abiString)
      // console.log("from addr: ", fromAddr)
      const abi = JSON.parse(abiString) as AbiItem[]
      const contract = new web3.eth.Contract(abi, address);
      // console.log("contract: ", contract)

      let hexRuntime =  "0x" + bytes
      let callData = "0x"
      let walletSalt = 0
      contract.methods.exec(hexRuntime, callData, walletSalt).send({from: fromAddr});
    }

    if (compileResult) {
        // console.log("going to connect wallet")
        let addr = await connectWallet()
        if (addr) {
          await send(compileResult, addr)
        }
    }
  }
  const handleCompiledRuntime = (res: string) => {
    // console.log("app handleCompiledRuntime", res)
    setCompileResult(res)
  }
  const handleCompiledAbi = (res: any[]) => {
    // console.log("app.tsx handleCompiledAbi", res)
    setCompileAbi(res)
  }
  const handleCompiledVersion = (res: string) => {
    // console.log("app.tsx handleCompiledVersion", res)
    setCompileVersion(res)
  }

  const mmStatus = () => {
    if (status === "initializing") return <div>Synchronisation with MetaMask ongoing...</div>
    if (status === "unavailable") return <div>MetaMask not available :(</div>
    if (status === "notConnected") return <button onClick={connect}>Connect to MetaMask</button>
    if (status === "connecting") return <div>Connecting...</div>
    if (status === "connected") {
      return <div className="shrink">
        <div>{chainId}</div>
        <div>{account}</div>
      </div>
    }
  }

    const options = {
      selectOnLineNumbers: true
    }; 
    let buttonStyle = "rounded-md bg-white/10 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
    return (
      <div className="h-screen flex flex-col align-between text-white pb-12">

            <Inputs
              compiledRuntime={handleCompiledRuntime}
              compiledAbi={handleCompiledAbi} 
              compiledVersion={handleCompiledVersion}
            />

          <div className="flex flex-row justify-between w-full px-12">

              <div className="shrink">
                {mmStatus()}
              </div>
        
                <button
                  onClick={sendTx}
                  type="button"
                  className={"rounded-md bg-white/10 py-2 px-3 text-sm font-semibold text-white shadow-sm hover:bg-white/20"}
                >
                  verify
                </button>
            
            </div>
          </div>
    );
}


export default App;
