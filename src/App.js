import React from 'react';
import MonacoEditor from 'react-monaco-editor';


const defaultCode = `// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract Storage {

    uint256 number;

    /**
     * @dev Store value in variable
     * @param num value to store
     */
    function store(uint256 num) public {
        number = num;
    }

    /**
     * @dev Return value 
     * @return value of 'number'
     */
    function retrieve() public view returns (uint256){
        return number;
    }
}
`

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      code: defaultCode,
      address: ''
    }
  }

  editorDidMount(editor, monaco) {
    console.log('editorDidMount', editor);
    editor.focus();
  }
  onChange(newValue, e) {
    console.log('onChange', newValue, e);
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
          onChange={this.onChange}
          editorDidMount={this.editorDidMount}
        />
        <div style={{display: "flex", justifyContent:"center"}}>
          <button>yoo</button>
        </div>
      </>
    );
  }
}


export default App;
