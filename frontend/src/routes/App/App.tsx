import React from 'react'
import jwtDecode from 'jwt-decode';
import { Outlet, redirect, useLoaderData } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/SideBar';
import { extractCookie, setCookie } from '../../Cookie';

import {
  getUser,
  getUserProfilePictrue,
} from '../../requests/user'

import { CurrentUserProvider } from '../../contexts/CurrentUserContext';
import defaultPP from '../../assets/user.png'
import './App.css';


export async function loader() {
  const token = extractCookie("access_token");
  let token_d;
  if (token)
  {
   try {
     token_d = jwtDecode<any>(token);
    }
    catch(e)
    {
      token_d = null;
    } 
  }
  if (token_d) {
    let id = token_d.id;

    const user = await getUser(id, token);
    if (user.status !== 200 || user.statusText !== "OK")
      return (redirect("/login"));


    let image = await getUserProfilePictrue(id, token);
    if (image.status === 200 && image.statusText === "OK")
      image = window.URL.createObjectURL(new Blob([image.data]))
    else
      image = defaultPP;

    return ({ user: { ...user.data, url: image }, token })
  }
  setCookie("access_token", "");
  return (redirect("/login"));
}

function App() {

  const { user, token }: any = useLoaderData();

  return (
    <CurrentUserProvider
      user={user}
      token={token}
    >
      <div className="App" >
        <Header />
        <Sidebar />
        <Outlet />
        <Footer />
      </div>
    </CurrentUserProvider>
  );
}

export default App;
