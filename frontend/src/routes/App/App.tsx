import React from 'react'
import jwtDecode from 'jwt-decode';
import { Outlet, redirect, useLoaderData, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/SideBar';
import { extractCookie } from '../../utils/Cookie';
import {
  getUser,
  getUserProfilePictrue,
  updateUser,
  blockUserRequest,
  unblockUserRequest
} from '../../utils/User';

import './App.css';
import { CurrentUserProvider } from '../../contexts/CurrentUserContext';


export async function loader() {
  const token = extractCookie("access_token");
  if (token) {
    let id = jwtDecode<any>(token).id;

    const user = await getUser(id);
    if (user.status !== 200 || user.statusText !== "OK")
      console.log("Error: app loader => ", user)

    let image = await getUserProfilePictrue(id);
    if (image.status === 200 && image.statusText === "OK")
      image = window.URL.createObjectURL(new Blob([image.data]))
    else
      image = './assets/user.png';

    return ({ user: { ...user.data, url: image }, token })
  }
  return (redirect("/login"));
}

function App() {

  const { user, token }: any = useLoaderData();

  return (
    <div className="App" >
      <CurrentUserProvider
        user={user}
        token={token}
      >
        <Header />
        <Sidebar />
        <Footer />
        <Outlet />
      </CurrentUserProvider>
    </div>
  );
}

export default App;