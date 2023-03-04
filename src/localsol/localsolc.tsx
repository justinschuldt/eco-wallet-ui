import {hexlify, sha256, keccak256, } from "ethers"

export interface CompilerInput {
    language: string,
    sources: {
        [name: string]: {
            content: string;
        };
    };
    settings: {
        optimizer: {
            enabled: boolean;
            runs: number;
        };
        viaIR?: boolean;
        outputSelection: {
            [file: string]: {
                [contract: string]: string[];
            };
        };
    };
}

export interface CompilerOutput {
    errors?: Array<
        {
            sourceLocation: {
                file: string;
                start: number;
                end: number;
            };
            type: string;
            severity: 'error' | 'warning' | 'info';
            errorCode: number;
            message: string;
            formattedMessage: string;
        }
    >;
    contracts: {
        [file: string]: {
            [contract: string]: {
                abi: any[];
                evm: { deployedBytecode: { object: string; }; };            
            };
        };
    };
}

export interface CompilerInputOpts {
    version: string;
    fragment: string;
    extraOuterDefs?: string[];
    extraInnerDefs?: string[];
}

const DEFAULT_OUTPUT_SELECTION = ['evm.deployedBytecode.object', 'abi'];

export function createCompilerInput(opts: CompilerInputOpts): CompilerInput {
    const name = getWalletOperationContractName(opts.fragment);
    const version = opts.version.split("v")[1].split("+")[0]
    // console.log("solidity version for contract: ", version)
    // console.log("contract name: ", name)
    const src = `// SPDX-License-Identifier: UNLICENSED

pragma solidity ${version};

${(opts.extraOuterDefs ? "\n" + opts.extraOuterDefs.join('\n') : "")}

contract ${name} {

    ${(opts.extraInnerDefs ? opts.extraInnerDefs.join('\n') : "")}

    fallback() external payable {
        ${opts.fragment}
    }
}
`;
    // console.log("src:")
    // console.log(src)
    return {
        language: 'Solidity',
        sources: { 'main': { content: src } },
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            outputSelection: {
                'main': { 
                    [name]: DEFAULT_OUTPUT_SELECTION
                },
            },
        },
    };
}

function getWalletOperationContractName(fragment: string): string {
    // this doesnt work in the browser
    // return 'WalletOperation_' + crypto.createHash('sha256').update(fragment).digest().slice(0, 4).toString('hex');
    
    // this attempts to do the same as above
    let utf8Encode = new TextEncoder();
    const arr = utf8Encode.encode(fragment);
    const sha = sha256( arr)
    // console.log("sha ", sha )
    const digest = keccak256(sha)
    // console.log("digest ", digest)
    const sliced = digest.slice(0, 6)
    // console.log("sliced ", sliced)
    const hex = hexlify(sliced)
    // console.log("hex ", hex)
    return 'WalletOperation_' + hex
}


export class CompilerError extends Error {
    constructor(msg: string) {
        super(msg);
    }
}

export function parseCompilerOutput(output: CompilerOutput): { abi: any[], runtimeCode: string, warnings: string[] } {
    // console.log("output ", output)
    const errors = (output.errors || []).filter(e => e.severity === 'error');
    if (errors.length) {
        throw new CompilerError(errors.map(e => e.formattedMessage).join('\n'));
    }
    const art = Object.values(output.contracts?.['main'] || {})?.[0];
    return {
        abi: art.abi,
        runtimeCode: art.evm.deployedBytecode.object,
        warnings: (output.errors || []).filter(e => e.severity === 'warning').map(e => e.formattedMessage),
    };
}