import React, {Fragment, useState} from 'react';
import Web3 from "web3"
import { useMetaMask } from "metamask-react";
import Inputs from "Inputs"
import { Listbox, Transition } from '@headlessui/react'
import {  ChevronUpDownIcon } from '@heroicons/react/20/solid'


function App({}: {}) {
  const contractAddress = "0x82b035B4405Dd60b449b054894004FeE80566655"
  const contractAbi = JSON.parse(`[{"inputs":[],"name":"RuntimeDeployError","type":"error"},{"inputs":[],"name":"RuntimeDestroyError","type":"error"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"}],"name":"_deployRuntime","outputs":[{"internalType":"address","name":"runtime","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"exec","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"getExecuteInfo","outputs":[{"internalType":"address","name":"runtime","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"runtimeCode","type":"bytes"}],"name":"getRuntimeByRuntimeCode","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"getWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"runtime","type":"address"},{"internalType":"bytes","name":"callData","type":"bytes"},{"internalType":"uint256","name":"walletSalt","type":"uint256"}],"name":"reexec","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint248","name":"","type":"uint248"}],"name":"wasNonceUsed","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]`)

  const { status, connect, account, chainId, ethereum } = useMetaMask();

  const [parentAccount, setParentAccount] = useState("")
  const [activeSubAccount, setSubAccount] = useState("")
  const [subAccounts, setSubAccounts] = useState<string[]>([])
  const [amount, setAmount] = useState()
  const [compileResult, setCompileResult] = useState("")
  const [compileAbi, setCompileAbi] = useState<any[]>([])
  const [compileVersion, setCompileVersion] = useState("")
  const [loading, setLoading] = useState<boolean | undefined>()
  

  const connectWallet = async () => {
    setLoading(true)
    await connect()
    const eth = ethereum
    if (!eth) {
      setTimeout(() => {
        console.log("does not seem to have metamask, returning ")
        setLoading(false)
      }, 200)
      return
    }
    
    await eth.enable();
    try{
        const res = await eth.request({method:'eth_requestAccounts'})

        let acct = res.length >=1 ? res[0] : undefined
        if (acct) {
          setParentAccount(acct)
          
          if (!subAccounts || subAccounts.length === 0) {
            const subs = await getSubAccounts(acct)
            setLoading(false)
            return subs[0]
          }
          console.log("setting loading false")
          setLoading(false)

        }
      } catch (err: any) { 
        console.log(console.error( "failed getting accounts. err ", err))
        throw err
      }
  }
  
  const getSubAccounts = async (parentAcct: string) => {
    const web3 = new Web3(ethereum);
    await ethereum.enable()
    const contract = new web3.eth.Contract(contractAbi, contractAddress);
    const subAccts = await Promise.all([0,1,2].map(async (i) => {
      let res = await contract.methods.getWallet(parentAcct, i).call();
      return res
    }))
    setSubAccounts(subAccts)
    setSubAccount(subAccts[0])
    return subAccts
  }

  const sendTx = async () => {

    async function send(bytes: string) {
      const eth = ethereum
      const web3 = new Web3(ethereum);
      await eth.enable();

      const contract = new web3.eth.Contract(contractAbi, contractAddress);

      let hexRuntime =  "0x" + bytes
      let callData = "0x"
      let walletSalt = subAccounts.findIndex(i => i === activeSubAccount)
      const sendOpts: any = {from: parentAccount}
      if (amount) {
        sendOpts.value = amount
      }
      console.log("going to send with options: ", sendOpts)
      contract.methods.exec(hexRuntime, callData, walletSalt).send(sendOpts);
    }

    if (compileResult) {
        if (activeSubAccount) {
          await send(compileResult)
        }
    }
  }

  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
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
    setCompileVersion(res)
  }
  const setActiveAccount = (res: string) => {
    setSubAccount(res)
  }
  const handleAmount = (res: any) => {
    // console.log('res: ', res)
    setAmount(res)
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

  
    return (
      <div className="h-screen flex flex-col align-between text-white pb-12">

        {/* super hacky way to kick off the account fetch */}
        {!loading && subAccounts.length === 0 ? <>{(()=>connectWallet())()}</>: null}

            <Inputs
              compiledRuntime={handleCompiledRuntime}
              compiledAbi={handleCompiledAbi} 
              compiledVersion={handleCompiledVersion}
              amount={handleAmount}
            />

          <div className="flex flex-row justify-between w-full px-12 mb-12">

              <div className="shrink">
                {subAccounts && subAccounts.length >= 1 ?

                  <Listbox  value={activeSubAccount} onChange={setActiveAccount}>
                    {({ open }) => (
                      <>
                        <div className="relative mt-2">
                          <Listbox.Button className="relative backdrop-opacity-50 w-full cursor-default rounded-md bg-monaco py-1.5 pl-3 pr-10 text-left text-gray-50 shadow-sm  ring-gray-500 ring-opacity-1 sm:text-sm sm:leading-6">
                            <span className="block truncate text-md">{subAccounts.findIndex(i => i === activeSubAccount) + ": " + activeSubAccount}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>

                          <Transition
                            show={open}
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options  className="absolute backdrop-opacity-50 z-10  max-h-60 w-full overflow-visible rounded-md bg-monaco  shadow-lg  ring-1 ring-gray-500 ring-opacity-1  xs:text-sm">
                              {subAccounts.map((item, index) => (
                                item === activeSubAccount ? null :
                                <Listbox.Option
                                  key={index}
                                  className={({ active }) =>
                                    classNames(
                                      active ? 'bg-monaco text-white' : 'text-gray-50',
                                      'relative cursor-default select-none py-2 pl-3 pr-9 text-sm'
                                    )
                                  }
                                  value={item}
                                >
                                  {({ selected, active }) => (
                                    <>
                                      <span className={classNames(selected ? 'font-semibold' : 'font-normal', ' block truncate')}>
                                      {index + ": " + item}
                                      </span>
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </>
                    )}
                  </Listbox>
                : null}
              </div>
        
                <button
                  onClick={sendTx}
                  type="button"
                  className={"rounded-md bg-white/10 py-2 px-3 text-xl font-semibold tracking-wider text-white focus:bg-indigo-500 shadow-sm hover:bg-indigo-500 hoverr:bg-white/20 w-64"}
                >
                  Verify
                </button>
            
            </div>
          </div>
    );
}


export default App;
