import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import reportWebVitals from './reportWebVitals'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider>
    <BrowserRouter>
           <Routes>
            {/* <Route element={<PageLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/log-in" element={<LogIn />} />
              <Route path="/account" element={<Account />} />
              </Route> */}
            </Routes>
          </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
