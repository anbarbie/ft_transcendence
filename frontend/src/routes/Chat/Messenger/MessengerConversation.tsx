import React, { useCallback, useEffect, useRef, useState } from "react";

import { useChannelsContext, useCurrentUser } from "../../../hooks/Hooks";
import useMembers from "../../../hooks/Chat/useMembers";
import useFetchUsers from "../../../hooks/useFetchUsers";

import Message from "./Message";
import './Messenger.css'
import { ConfirmViewButtons } from "../Profile/ChannelProfile/ConfirmAction";
import { useInvitation } from "../../../hooks/Chat/useInvitation";


function MessageNotification(props: any) {
    return (
        <div className="flex-center gray-c message-notification" >
            {props.content}
        </div>
    )
}

function BlockMessage({ username }: any) {
    return (
        <div className="flex-center sticky-bot">
            <p className="flex-center reset-m">You have blocked <span className="friend-block">{username}</span></p>
        </div>
    )
}

function NoMessages() {
    return (
        <div className="no-messages-div">
            <p className="no-messages">
                No messages
            </p>
        </div>
    )
}


type TInvitationMessage = {
    message: any,
    author: any
}

function InvitationMessage(props: TInvitationMessage) {

    const { user } = useCurrentUser();
    const { acceptInvitation } = useInvitation();
    const [accepted, setAccepted] = useState(props.message && props.message.acceptedBy);

    return (
        <div className="flex-center">
            <div
                className="flex-ai"
                style={{ width: '80%', margin: '5px 0', border: '1px solid black', borderRadius: '5px', boxShadow: '1px 2px 5px black', padding: '3%' }}
            >
                {
                    props.author &&
                    <p className="reset" >{props.author.username} wants to play a game in CLASSIC mode</p>

                }
                {
                    props.message && !accepted && user && props.message.sendBy !== user.id &&
                    <button
                        className="button"
                        style={{ width: '100px', fontSize: 'medium', fontWeight: '500' }}
                        onClick={() => {
                            acceptInvitation(props.message.id);
                            setAccepted(true);
                        }}
                    >
                        Join
                    </button>
                }
            </div>
        </div>
    )
}



export default function MessengerConversation({ messages, blockedFriend, hidden, whisperUser }: any) {

    const { fetchUser } = useFetchUsers();
    const { currentChannel } = useChannelsContext();
    const { getMemberById, isUserIdMember } = useMembers();
    const [authors, setAuthors]: any = useState([]);
    const messagesContainerRef = useRef(null);

    async function loadAuthors(messages: any[], membersId: number[], members: any[]) {
        let users: any[] = members;
        let ids: number[] = membersId;
        await Promise.all(
            messages.map(async (m: any, index: number) => {
                if ((index + 1 !== messages.length &&
                    m.sendBy !== messages[index + 1].sendBy) || (index === messages.length - 1) || (m.type === "INVITE")) {
                    if (!ids.length || !ids.find((id: number) => id === m.sendBy)) {
                        ids = [...ids, m.sendBy];
                        if (!isUserIdMember(m.sendBy)) {
                            users.push(await fetchUser(m.sendBy));
                        }
                        else {
                            users.push(getMemberById(m.sendBy));
                        }
                    }
                }
            }))
        if (users && users.length)
            users = users.filter(u => u);
        setAuthors(users);
    }

    useEffect(() => {
        if (messages && messages.length && currentChannel && currentChannel.members) {
            loadAuthors(messages, currentChannel.members, currentChannel.users);
        }
        else {
            setAuthors([]);
        }
    }, [messages, currentChannel])


    const rendMessages = useCallback(() => {
        if (messages.length) {
            let displayUser: boolean;
            let _author: any;
            return (
                messages.map((m: any, index: number) => {
                    _author = null;
                    displayUser = false;
                    if ((index + 1 !== messages.length && m.sendBy !== messages[index + 1].sendBy) ||
                        (index === messages.length - 1) || (m.type === "INVITE")) {
                        displayUser = true;
                        _author = authors.find((u: any) => u.id === m.sendBy)
                    }

                    if (m.type === "NOTIF")
                        return (<MessageNotification key={m.id} content={m.content} />)
                    else if (m.type === "INVITE")
                        return (<InvitationMessage key={m.id} author={_author} message={m} />)
                    else if (m.type !== "NOTIF") {

                        return (
                            <Message
                                lastMessage={index + 1 === messages.length}
                                key={m.id}
                                id={m.id}
                                content={m.content}
                                sendBy={m.sendBy}
                                author={_author}
                                displayUser={displayUser}
                                owner={currentChannel.type !== "WHISPER" && currentChannel.ownerId === m.sendBy}
                            />
                        )
                    }
                }));
        }
    }, [messages, authors]);

    useEffect(() => {
        if (messagesContainerRef) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messagesContainerRef, authors, hidden])

    return (
        <div className={hidden ? "messages-display hidden" : "messages-display visible"} ref={messagesContainerRef}>
            {
                !messages.length || !authors.length ?
                    <NoMessages />
                    :
                    rendMessages()
            }
            {
                blockedFriend && currentChannel && currentChannel.type === "WHISPER" &&
                <BlockMessage username={whisperUser.username || currentChannel.name} />
            }
        </div>
    )
}
