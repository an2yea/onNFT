import React, {useState} from 'react'

export const Context = React.createContext();

export const ContextProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [tokens, setTokens] = useState([]);
    const [gobMethod, setGOBMethod] = useState(null);
    const [gw, setGW] = useState();
  
    return (
        <>
        <Context.Provider value={{ loading, setLoading , tokens, setTokens, gobMethod, setGOBMethod, gw, setGW}}>
            {children}
        </Context.Provider>

        </>
    );
};