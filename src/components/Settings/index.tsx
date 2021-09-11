import React from "react";
import { Button, Select } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { EndpointContext, ENDPOINTS } from "../../contexts/endpoint";

export const Settings = () => {
  const { connected, disconnect } = useWallet();

  return (
    <EndpointContext.Consumer>
      { ({ endpoint, setEndpoint }) => (
        <div style={ { display: "grid" } }>
          Network:{ " " }
          <Select
            onSelect={ setEndpoint }
            value={ endpoint }
            style={ { marginBottom: 20 } }
          >
            { ENDPOINTS.map(({ name, endpoint }) => (
              <Select.Option value={ endpoint } key={ endpoint }>
                { name }
              </Select.Option>
            )) }
          </Select>
          { connected && (
            <Button type="primary" onClick={ disconnect }>
              Disconnect
            </Button>
          ) }
        </div>
      ) }
    </EndpointContext.Consumer>
  );
};
