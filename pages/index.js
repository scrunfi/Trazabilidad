import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { Contract, providers, utils } from 'ethers'
import React, { useEffect, useRef, useState } from 'react'
import Web3Modal from 'web3modal'
import { ABI, NFT_CONTRACT_ADDRESS } from '../constants'
import Owner from './owner'
import Agricultor from './agricultor'
import Comercio from './comercio'
import Transporte from './transporte'
import Consumidor from './consumidor'
//
export default function Home() {
  
  const [walletConnected, setWalletConnected] = useState(false);
  const [provider, setProvider] = useState(null);
  const [userLogged, setUserLogged] = useState(null);
  const [showUI, setShowUI] = useState(false);

  const web3ModelRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {

    const provider = await web3ModelRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId != 11155111) {
      window.alert("Por favor, conectate a la red Sepolia!");
      throw new Error("Red incorrecta");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  }

  const connectWallet = async () => {
    try {
      const provider = await getProviderOrSigner();
      setProvider(provider);
      setWalletConnected(true);
    } catch (error) {
      console.log(error);
    }
  }

  const readyWallet = async () => {

    await connectWallet();

    window.ethereum.on("accountsChanged", async function (accounts) {
      if (accounts[0]) {
        const currentAccount = utils.getAddress(accounts[0]);
        const role = await getUserRol(currentAccount);
        setUserLogged(role);
      } else {
        setWalletConnected(false);
        setUserLogged(null);
        setShowUI(false);
      }
    })
    
  }

  const getUserRol = async (currentAccount) => {
    try {
      const provider = await getProviderOrSigner();
      const trazabilidad = new Contract(NFT_CONTRACT_ADDRESS, ABI, provider);

      if (await trazabilidad.owner() == currentAccount) {
       return 4;
      } else {
        const role = await trazabilidad.getUserRol(currentAccount);
        
        return role;
      
      }
    } catch (error) {
      console.log(error);
    }
  }

  const readyAccount = async () => {
    try {
      const accounts = await provider.send("eth_requestAccounts", []);
      const currentAccount = utils.getAddress(accounts[0]);
      const role = await getUserRol(currentAccount);
      setUserLogged(role);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    async function fetchProvider() {
      if (!walletConnected) {
        web3ModelRef.current = new Web3Modal({
          network: "sepolia",
          providerOptions: {},
          disableInjectedProvider: false
        });
        await readyWallet();
      }
    }
    fetchProvider();
  }, )

  useEffect(() => {
    if (provider) {
      async function fetchRole() {
        await readyAccount();
      }
      fetchRole();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider])
  
  useEffect(() => {
    if (userLogged != null) {
      setShowUI(true);
    }
  }, [userLogged])
  
  const showUserUI = () => {
    
    
    switch (userLogged) {
      case 0:
        return (
          <Agricultor provider={provider}/>
        );
      case 1:
        return (
          <Comercio provider={provider}/>
        );
      case 2:
        return (
          <Transporte provider={provider}/>
        );  
      case 3:
        return (
          <Consumidor provider={provider} />
        );
      case 4:
        return (
          <Owner provider={provider} />
        );
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Tranzabilidad Alimentaria</title>
      </Head>      

      <div>
        {
          showUI ?
            showUserUI()
            :
            <h3 className={`${styles.main} ${styles.connect_wallet}`}>Conectando una cartera...</h3>
        }
      </div>
    </div>
  )
}
