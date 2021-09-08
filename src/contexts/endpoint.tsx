import { clusterApiUrl } from "@solana/web3.js";
import React from "react"

export const EndpointContext = React.createContext({
  endpoint: "http://127.0.0.1:8899",
  setEndpoint: (endpoint: string) => { }
})

export const ENDPOINTS = [
  {
    name: "devnet",
    endpoint: clusterApiUrl("devnet")
  },
  {
    name: "localnet",
    endpoint: "http://127.0.0.1:8899"
  },
];