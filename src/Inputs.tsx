import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import MonacoEditor from 'react-monaco-editor';
// import ReactTimeAgo from 'react-time-ago'

import solidityCompiler from "./workers/solc-complier.worker"

import { createCompilerInput, parseCompilerOutput, CompilerError, CompilerInputOpts, CompilerOutput } from './localsol/localsolc';


const worker = new Worker(URL.createObjectURL(new Blob([`(${solidityCompiler})()`], { type: 'module' }) ));


const solcVersions = [
    "soljson-v0.8.16+commit.07a7930e",
    "soljson-v0.7.2+commit.51b20bc0"
  ]
  const simple = `emit Hello("hellooo");

// do more stuff here

// transfer

// mint

// etc

`
  const outerDefDefault = ``
  const innerDefDefault = `event Hello(string);`
  

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}
interface InputsProps {
    compiledRuntime: (res: string) => void
    compiledAbi: (res: any[]) => void
    compiledVersion: (res: string) => void
}
export default function Inputs(props: InputsProps) {
  const [solcOptions, setSolcOptions] = useState(solcVersions)
  const [solcVersion, setSolcVersion] = useState(solcVersions[0])

  const [outerDefs, setOuterDefs] = useState<string[]>([outerDefDefault])
  const [innerDefs, setInnerDefs] = useState<string[]>([innerDefDefault])
  const [runtimeCode, setRuntimeCode] = useState(simple)
  const [compileResult, setCompileResult] = useState("")
  const [compileWarnings, setCompileWarnings] = useState<any[]>([])
  const [compileAbi, setCompileAbi] = useState<any[]>([])
  const [compileMillisec, setCompileMillisec] = useState(0)
  
  const [lastTouch, setLastTouch] = useState(0)
  const [loading, setLoading] = useState(false)

  const editorDidMount = (editor: any, monaco: any) => {
    editor.focus();
    compile()
  }
  const editorChanged = (newValue: any, e: any) => {
    setRuntimeCode(newValue)
    compile()
  }
  worker.onerror = ev => {
    console.error('worker error: ', ev)
  }
  worker.onmessage = (ev: MessageEvent<{
    output: CompilerOutput,
    id: number
  }>) => {
    // see if this is the most recent compile
    // console.log("worker.onmessage")
    // console.log("lastTouch === ev.data.id ")
    // console.log(`${lastTouch} ===  ${ev.data.id}.  (${lastTouch === ev.data.id})`)
    if (lastTouch === ev.data.id) {
        // console.log("most recent compile came in")

        const {abi, runtimeCode, warnings} = parseCompilerOutput(ev.data.output)
        setCompileAbi(abi)
        setCompileResult(runtimeCode)
        setCompileWarnings(warnings)
        setCompileMillisec(Date.now())
    
        props.compiledAbi(abi)
        props.compiledRuntime(runtimeCode)
        props.compiledVersion(solcVersion)

        setLoading(false)
    } else {
        console.log(`ignoring compile because id: ${ev.data.id} !== ${lastTouch} (lastTouch)`)
    }

  }
  const sendToWorker = (id: number) => {
      if (!solcVersion || !runtimeCode ) {
          return
      }
    
      const compileOpts: CompilerInputOpts = {
        version: solcVersion,
        fragment: runtimeCode,
        extraOuterDefs: outerDefs,
        extraInnerDefs: innerDefs
      }
      const input = JSON.stringify(createCompilerInput(compileOpts))
      worker.postMessage({
          version: `https://binaries.soliditylang.org/bin/${solcVersion}.js`,
          input,
          id
      })

  }
  const compile = () => {
    const id = lastTouch + 1
    sendToWorker(id)
    setLastTouch(id)
    setLoading(true)
  }


  const versionChanged = (res: string) => {
    setSolcVersion(res)
    compile()

  }
  const outerDefChanged = (res: React.ChangeEvent<HTMLTextAreaElement>) => {
    // console.log(res.target.value.split('\n'))
    setOuterDefs(res.target.value.split('\n'))
    compile()
  }
  const innerDefChanged = (res: React.ChangeEvent<HTMLTextAreaElement>) => {
    // console.log(res.target.value.split('\n'))
    setInnerDefs(res.target.value.split('\n'))
    compile()
  }

  const options = {
    selectOnLineNumbers: true,
    minimap: {
		enabled: false
	}
  }; 
  return (
    <>
    <div className="flex flex-col justify-between text-white pb-0 mx-4 mt-6 grow">   

    <MonacoEditor
            width="100%"
            className=""
            height="300"
            language="sol"
            theme="vs-dark"
            value={runtimeCode}
            options={options}
            onChange={editorChanged}
            editorDidMount={editorDidMount}
          />
       



    <div  className="flex flex-row pb-0 justify-between text-sm w-full"> 

        <div  className="flex flex-row pb-2 justify-between text-sm w-full ml-8 ">
            <div className="relative mt-2 rounded-md shadow-sm pl-2">
                <input
                type="text"
                name="price"
                id="price"
                className="block w-24 h-8 bg-monaco rounded-md border-0 py-1.5 pl-7 pr-12 text-gray-100 ring-1 ring-inset ring-gray-500 placeholder:text-gray-400  sm:text-sm sm:leading-6"
                placeholder="0.1"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-300 sm:text-sm" id="price-currency">
                    ETH
                </span>
                </div>
            </div>
        </div>

    <Listbox value={solcVersion} onChange={versionChanged}>
      {({ open }) => (
        <>
        {/* <Listbox.Label className="text-sm font-medium  text-gray-300">Signer</Listbox.Label> */}
          <div className="relative mt-2 mr-6">
            <Listbox.Button className="relative backdrop-opacity-50 w-full cursor-default rounded-md bg-monaco py-1.5 pl-3 pr-10 text-left text-gray-50 shadow-sm  ring-inset ring-gray-300 opacity sm:text-sm sm:leading-6">
              <span className="block truncate">{solcVersion}</span>
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
              <Listbox.Options className="absolute backdrop-opacity-50 z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-monaco py-1 text-base shadow-lg ring-1 ring-gray-400 ring-opacity-5 focus:outline sm:text-sm">
                {solcOptions.map((item, index) => (
                  <Listbox.Option
                    key={index}
                    className={({ active }) =>
                      classNames(
                        active ? 'bg-monaco-600 text-white' : 'text-gray-50',
                        'relative cursor-default select-none py-2 pl-3 pr-9'
                      )
                    }
                    value={item}
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                          {item}
                        </span>

                        {selected ? (
                          <span
                            className={classNames(
                              active ? 'bg-monaco text-white' : 'text-gray-50',
                              'absolute inset-y-0 right-0 flex items-center pr-4'
                            )}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
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

    </div>
    
    

    <div  className="flex flex-row pb-2 justify-end text-sm w-full">
            {/* {loading ? <div className="text-xs">compiling</div> : null} */}
            {compileWarnings && compileWarnings.length >= 1 ? <div className="text-xs">warnings:</div> : null}
            {compileWarnings.map(i => <div className="text-xs">{i}</div>)}
            {!loading && compileResult && compileWarnings.length === 0 && compileMillisec ? <div className="text-xs">compiled</div>: null}
    </div>

    </div>   
    </>
  )
}