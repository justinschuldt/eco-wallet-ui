import React from 'react';
import MonacoEditor from 'react-monaco-editor';

import { solidityCompiler } from "@agnostico/browser-solidity-compiler";

const simple = `// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract C { 
  fallback() external { 
    emit Hello("hello");
  } 
  event Hello(string);
}`

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      code: simple,
      address: ''
    }
  }

  editorDidMount(editor, monaco) {
    console.log('editorDidMount', editor);
    editor.focus();
  }
  onChange(newValue, e) {
    console.log('onChange', newValue, e);
    this.setState({ code: newValue })
  }
  compile() {

    console.log('code', this.state.code)
    
    let version = 'soljson-v0.8.16+commit.07a7930e.js'
    let options = {}
    solidityCompiler({
      version: `https://binaries.soliditylang.org/bin/${version}`,
      contractBody: this.state.code,
      options,
    }).then((output => {
      console.log("compile output: ", output)
    }, error => {
      console.log("compile error ", error)
    }))

  }
  render() {
    const code = this.state.code;
    const options = {
      selectOnLineNumbers: true
    }; 
    return (
      <>
        <MonacoEditor
          width="100%"
          height="90vh"
          language="sol"
          theme="vs-dark"
          value={code}
          options={options}
          onChange={this.onChange.bind(this)}
          editorDidMount={this.editorDidMount.bind(this)}
        />
        <div style={{display: "flex", justifyContent:"space-around"}}>
          <button
            onClick={this.compile.bind(this)}
            type="button"
            className="rounded-md bg-indigo-500 py-1.5 px-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            compile
          </button>
        </div>
      </>
    );
  }
}


export default App;
