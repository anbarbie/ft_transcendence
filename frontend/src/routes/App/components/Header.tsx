import React, { useContext } from 'react';

import './Header.css'

import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../../Hooks';
import ProfilePicture from '../../../components/ProfilePicture';

export default function Header() {
    const { user } = useCurrentUser();

    return (
        <header className='header'>
            <p className='header-pong'>Pong</p>
            <div className='pp-container'>
                <Link
                    className='pp-link'
                    to={"/profile"}
                >
                    <div style={{width: '40px', height: '40px', padding: '0 5px'}}>
                        <ProfilePicture image={user && user.url} />
                    </div>
                    <p className='pp-username'>{user.username}</p>
                </Link>
            </div>
        </header>
    )
}