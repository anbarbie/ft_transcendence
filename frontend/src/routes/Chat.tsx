import React, { useEffect, useReducer, useState } from "react";

import MenuElement from "../Chat/MenuElement";
import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import {
    getChannelByIDs,
    getFriendList,
    getMessages,
    getUserInvitations,
    removeUserFriend
} from "../utils/User";

import { io } from 'socket.io-client';


import { useConversations, useFriends, useUser } from "../Hooks";
import { isEqual } from "../utils";

import { FriendsProvider } from "../contexts/Chat/FriendsContext";
import { ConversationsProvider } from "../contexts/Chat/ConversationsContexts";

import './Chat.css'

function ChatInterface() {

    const navigate = useNavigate();

    const {
        user,
        token
    }: any = useUser();

    const [socket, setSocket]: [any, any] = useState();
    const [currentElement, setCurrentElement]: [any, any] = useState();

    const [friends, friendsDispatch]: any = useFriends();
    const [conversations, conversationsDispatch]: any = useConversations();

    const [channel, setChannel]: [any, any] = useState();

    const [friendInvitations, setFriendInvitations]: [any, any] = useState([]);
    const [notifInvitation, setNotifInvitation]: [any, any] = useState(false);


    /////////////////////////////////////////////////////////////////////////
    //                          F R I E N D S                              //
    /////////////////////////////////////////////////////////////////////////

    async function loadFriends() {
        getFriendList(user.id)
            .then(friendListRes => {
                if (friendListRes.status === 200 && friendListRes.statusText === "OK") {
                    let friendList = friendListRes.data;
                    friendList = friendList.sort((a: any, b: any) => a.username > b.username ? 1 : -1)
                    friendsDispatch({ type: 'set', newFriends: friendList })
                }
            })
    }

    async function removeFriend(friend: any) {
        if (friend) {
            removeUserFriend(friend.id, token)
                .then(res => {
                    if (res.status === 200 && res.statusText === "OK") {
                        friendsDispatch({ type: 'removeFriend', friend })
                        navigate("/chat");
                    }
                })
        }
    }

    /*
        if a friend exists inside friendList[] then it updates, 
        else he is added in the array 
    */

    function updateFriendList(friend: any) {
        if (friend)
            friendsDispatch({ type: 'updateFriend', friend });
    }


    /////////////////////////////////////////////////////////////////////////
    //                         M E S S A G E S                             //
    /////////////////////////////////////////////////////////////////////////



    function initMessages(arrayMessages: any) {
        conversationsDispatch({ type: 'initMessages', messages: arrayMessages });
    }

    function addMessage(message: any) {
        if (message.sendBy !== user.id && message.sendBy !== currentElement.id) {
            friendsDispatch({ type: 'addNotif', friendId: message.sendBy })
        }
        conversationsDispatch({ type: 'addMessage', message });
    }

    function sendMessage(channelId: any, content: any) {
        socket.emit('message', {
            channelId,
            content
        })
    }

    useEffect(() => {
        if (socket && socket.connected) {
            socket.on('message', (m: any) => {
                if (m.length) {
                    initMessages(m)
                }
                if (m.content) {
                    addMessage(m)
                }
            });
        }

        return () => {
            if (socket)
                socket.off('message');
        }
    }, [socket, channel])

    /////////////////////////////////////////////////////////////////////////
    //                         I N V I T A T I O N S                       //
    /////////////////////////////////////////////////////////////////////////


    function removeFriendRequest(inviteId: any) {
        setNotifInvitation(false);
        setFriendInvitations((p: any) => p.filter((i: any) => i.id !== inviteId))
    }

    async function loadInvitations() {
        getUserInvitations(user.id)
            .then(invitationsRes => {
                if (invitationsRes.status === 200 && invitationsRes.statusText === "OK") {
                    if (invitationsRes.data.length) {
                        setFriendInvitations((p: any) => {
                            if (!isEqual(p, invitationsRes.data)) {
                                setNotifInvitation(true);
                                return (invitationsRes.data);
                            }
                            return (p);
                        });
                    }
                }
            })

    }


    /////////////////////////////////////////////////////////////////////////
    //                            C H A N N E L                            //
    /////////////////////////////////////////////////////////////////////////

    async function selectCurrentElement(e: any) {
        friendsDispatch({ type: 'removeNotif', friend: e });
        setCurrentElement({ ...e, notifs: 0 });

        getChannelByIDs(user.id, e.id)
            .then(d => {
                setChannel(d.data)
            })
            .catch(e => {
                socket.emit('createChannel', {
                    name: "privateMessage",
                    type: "WHISPER",
                    memberList: [e.id]
                })
            })
    }

    useEffect(() => {
        if (socket && channel) {
            if (conversations &&
                !conversations.find((e: any) => e.id === channel.id)) {
                conversationsDispatch({ type: 'addConv', conversation: channel })
            }

            socket.emit('joinChannel', {
                channelId: channel.id,
            })

        }
    }, [socket, channel])

    /////////////////////////////////////////////////////////////////////////
    //                       U S E    E F F E C T S                        //
    /////////////////////////////////////////////////////////////////////////

    useEffect(() => {
        loadInvitations();
        loadFriends();
        const loadFriendsInterval = setInterval(async () => {
            loadInvitations();
            loadFriends();
        }, 3000)

        let s = io(`${process.env.REACT_APP_BACK}`, {
            transports: ['websocket'],
            extraHeaders: {
                'Authorization': `Bearer ${token}`
            }
        });

        setSocket(s);

        return (() => {
            clearInterval(loadFriendsInterval);
            s.disconnect();
        })
    }, [])

    return (
        <div className="chat">
            <div className="chat-container">
                <MenuElement
                    friends={friends}
                    user={user}
                    addGroup={() => { }}
                    setCurrentElement={selectCurrentElement}
                    notification={notifInvitation}
                    removeNotif={() => setNotifInvitation(false)}
                />
                <Outlet context={
                    {
                        user,
                        currentElement,
                        friends,
                        token,
                        removeFriend,
                        channel,
                        conversations,
                        sendMessage,
                        friendInvitations,
                        removeFriendRequest,
                        updateFriendList
                    }
                }
                />
            </div>
        </div>
    )
}


export default function Chat() {
    return (
        <FriendsProvider>
            <ConversationsProvider>
                <ChatInterface />
            </ConversationsProvider>
        </FriendsProvider>
    )
}