import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./utils/getWeb3";

import ipfs from './ipfs';
import "./App.css";

class App extends Component {
    state = { ipfsHash: '', buffer: null, web3: null, accounts: null, contract: null };

    constructor (props) {
        super(props)
        this.captureFile = this.captureFile.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount = async () => {
        try {
            // Get network provider and web3 instance.
            const web3 = await getWeb3();

            // Use web3 to get the user's accounts.
            const accounts = await web3.eth.getAccounts();

            // Get the contract instance.
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = SimpleStorageContract.networks[networkId];
            const instance = new web3.eth.Contract(
              SimpleStorageContract.abi,
              deployedNetwork && deployedNetwork.address,
            );

            // Set web3, accounts, and contract to the state, and then proceed with an
            // example of interacting with the contract's methods.
            this.setState({ web3, accounts, contract: instance }, this.instantiateContract);
        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
              "Failed to load web3, accounts, or contract. Check console for details");
            console.error(error);
        }
    };

    setIpfsHash = async () => {
        const { accounts, contract } = this.state;

        await contract.methods.set(this.state.ipfsHash).send({ from: accounts[0] });

        // get the value from the contract to prove it worked.
        const response = await contract.methods.get().call();

        // update state with the result.
        this.setState({ ipfsHash: response });
    }

    instantiateContract = async () => {
        const { accounts, contract } = this.state;        
    }

    captureFile (event) {
        console.log('capture file works...');
        event.preventDefault();
        const file = event.target.files[0]
        const reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => {
            this.setState({ buffer: Buffer(reader.result) })
            console.log("buffer", this.state.buffer)
        }
    }

    onSubmit (event) {
        event.preventDefault();
        ipfs.files.add(this.state.buffer, (error, result) => {
            if (error) {
                console.error(error)
                return
            }
            this.setState({ ipfsHash: result[0].hash })
            this.setIpfsHash()
            console.log(result[0].hash)
            console.log('ipfsHash', this.state.ipfsHash)
        })
        console.log('on submit works...')
    }

    render() {
        if (!this.state.web3) {
            return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
            <div className="App">
                <h1>IPFS File Upload dApp</h1>
                <h2>Your image</h2>
                <p>
                    this image is stored on IPFS and the ethereum blockchain.
                </p>
                <img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt=""/>

                <form onSubmit={ this.onSubmit }>
                    <input type="file" onChange={this.captureFile} />
                    <input type="submit" />
                </form>
            </div>
        );
    }
  }

  export default App;
