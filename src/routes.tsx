import { WalletModalProvider } from "@solana/wallet-adapter-ant-design";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import {
  getMathWallet,
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
  getSolongWallet
} from "@solana/wallet-adapter-wallets";
import React, { useMemo, useState } from "react";
import { HashRouter, Route, Switch } from "react-router-dom";
import { AppLayout } from "./components/Layout";
import { EndpointContext } from "./contexts/endpoint";
import { Main } from "./views/app";

export function Routes() {
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSolflareWallet(),
      getSolongWallet(),
      getMathWallet(),
      getSolletWallet(),
    ],
    []
  );

  const [endpoint, setEndpoint] = useState<string>("https://api.devnet.solana.com")

  return (
    <HashRouter basename={ "/" }>
      <EndpointContext.Provider value={ { endpoint, setEndpoint } }>
        <ConnectionProvider endpoint={ endpoint }>
          <WalletProvider wallets={ wallets } autoConnect>
            <WalletModalProvider>
              <AppLayout>
                <Switch key={ endpoint }>
                  <Route exact path="/" component={ Main } />
                </Switch>
              </AppLayout>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </EndpointContext.Provider>
    </HashRouter>
  );
}
