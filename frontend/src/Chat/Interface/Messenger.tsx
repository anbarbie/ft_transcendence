
import React, { useEffect } from "react";

import './Messenger.css'
import { getChannelByIDs, getMessages } from "../../utils/User";
import userEvent from "@testing-library/user-event";
import { measureMemory } from "vm";
import { ElementFlags } from "typescript";
import { useOutlet, useOutletContext } from "react-router-dom";

function BlockMessage({ username }: any) {
    return (
        <div className="block">
            <p className="text-block">You have blocked <span className="friend-block">{username}</span></p>
        </div>
    )
}

function NoMessages() {
    return (
        <div className="no-messages-div">
            <p key={0} className="no-messages">
                No messages
            </p>
        </div>
    )
}

/*
    style and display an invitation
*/

function GameInvitation(props: any) {
    return (
        <>
            {
                props.author === "me" ?
                    <div className="invitation">
                        <p className="text-invitation">You have sent an invitation to<span className="friend-invitation">{props.to}</span></p>
                    </div> :
                    <div className="invitation">
                        <p className="text-invitation">You have recieved an invitation from<span className="friend-invitation">{props.author}</span></p>
                    </div>
            }
        </>
    )
}

/*
    style and display one single message
*/

function Message(props: any) {

    function isAdmin() {
        return (props.administrators.find((username: any) => username === props.author));
    }

    function addStyle() {
        let obj;

        if (props.author === props.userId)
            obj = { backgroundColor: '#FFF5DD' };
        return (obj);
    }

    return (
        <div className="message-div"
            style={props.author === props.userId ? { justifyContent: 'right' } : {}}
        >
            <div className="message-infos">
                <p className="message"
                    style={addStyle()}
                >
                    {props.message}
                </p>
                {props.group && <p className="message-author">{props.author}</p>}
            </div>
            {
                props.group && isAdmin() && <span className="material-symbols-outlined">
                    shield_person
                </span>
            }
        </div>
    )
}


export default function Messenger({
     user, 
     conversation,
     sendMessage,
     element, 
     channel, 
     blocked, 
     invitation, 
}: any) {

    const lastMessageRef: any = React.useRef(null);
    const [value, setValue] = React.useState("");


    console.log("messenger rendered")

    function handleChange(e: any) {
        setValue(e.target.value)
    }

    function submit(e: any) {
        if (e.key === "Enter" && value !== "" && !blocked) {
           sendMessage(conversation.id, value)
            setValue("")
        }
    }

    const renderMessages = conversation ? 
        conversation.messages.map((m: any) =>
            <Message
                key={m.id}
                id={m.id}
                message={m.content}
                author={m.sendBy}
                userId={user.id}
                group={null}
                administrators={null}
            />
        ) : null

    React.useEffect(() => {
        lastMessageRef.current.scrollIntoView();
    }, [element, blocked, invitation, renderMessages])



    return (
        <>
            <div className="messages-display">
                {
                    renderMessages ?
                        renderMessages : <NoMessages />
                }
                {blocked && <BlockMessage username={element.username || element.name} />}
                <div ref={lastMessageRef}></div>
            </div>
            <div className="messages-input"
            >
                <input
                    className="messenger-input"
                    value={value}
                    onChange={handleChange}
                    placeholder={blocked ? "User blocked" : "Write your message"}
                    onKeyDown={submit}
                    disabled={blocked}
                />
            </div>
        </>
    )
}
