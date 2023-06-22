import React from "react";
 
import {
    useChannelsContext,
    useCurrentUser
} from "../../../hooks/Hooks";
import ProfilePicture from "../../../components/users/ProfilePicture";
import { RawIcon } from "../../../components/Icon";
import ResizeContainer from "../../../components/ResizeContainer";
import useAdinistrators from "../../../hooks/Chat/useAdministrators";
import { useNavigate } from "react-router-dom";


type TAuthorAccess = {
    author: any,
    id: number,
    type: string,
}

function AuthorAccess(props: TAuthorAccess) {
    const navigate = useNavigate();
    const { currentChannel } = useChannelsContext();
    const { isUserAdministrators } = useAdinistrators();

    return (
        <div
            className="flex pointer"
            onClick={() => navigate(`/user/${props.author.id}`)}
            style={{ alignItems: 'flex-end' }}
        >

            <p className="message-author"
                style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
            >{props.author.username}</p>


            <ResizeContainer height="auto" className="flex" style={{ alignItems: 'flex-end' }}>
                {
                    currentChannel.type !== "WHISPER" && props.author &&
                    currentChannel.ownerId === props.author.id &&
                    <RawIcon icon="location_away" />
                }
                {props.author && isUserAdministrators(props.author) && <RawIcon icon="shield_person" />}
            </ResizeContainer>
        </div>
    )
}


type TUserMessage = {
    lastMessage: boolean,
    author: any,
    id: number,
    content: string
}

function AuthorMessage(props: TUserMessage) {

    const navigate = useNavigate();
    const { currentChannel } = useChannelsContext();

    let type = currentChannel && currentChannel.type;

    function style() {
        let style: any = { scrollMargin: '30px' };
        if (props.author && !props.lastMessage) {
            style = { ...style, marginBottom: '30px' }
        }
        return (style);
    }

    return (
        <div className="message-div" style={style()}>
            <div className="flex-column">
                <div className="flex" style={{ alignItems: 'flex-end' }}>
                    {
                        props.author &&
                        <div className="relative pointer" onClick={() => navigate(`/user/${props.author.id}`)}>
                            <ResizeContainer height="30px" width="30px" >
                                <ProfilePicture image={props.author.url} />
                            </ResizeContainer>
                        </div>
                    }

                    <p className="message"
                        style={props.author ?
                            { marginLeft: '5px' } :
                            { marginLeft: '35px' }}
                    >
                        {props.content}
                    </p>
                </div>

                {
                    props.author && type !== "WHISPER" &&
                    <AuthorAccess
                        id={props.id}
                        author={props.author}
                        type={type}
                    />
                }
            </div>
        </div>
    )

}


type TMessengerCurrentUserLabel = {
    author: any,
    content: string
}

function AuthorCurrentUserMessage(props: TMessengerCurrentUserLabel) {

    const { currentChannel } = useChannelsContext();
    const { isUserAdministrators } = useAdinistrators();

    return (
        <div style={{padding: '0 2%'}}>
            <div className="flex-column">
                <div className="flex" style={{ justifyContent: 'flex-end', alignItems: 'flex-end' }} >

                    <p className="message"
                        style={props.author ?
                            { marginRight: '5px' } :
                            { marginRight: '35px' }}
                    >
                        {props.content}
                    </p>
                    {
                        props.author &&
                        <ResizeContainer height="30px" width="30px">
                            <ProfilePicture image={props.author && props.author.url} />
                        </ResizeContainer>
                    }
                </div>

                <div className="flex" style={{ justifyContent: 'flex-end', alignItems: 'flex-end', paddingBottom: '2px' }}>
                    {
                        currentChannel && currentChannel.type !== "WHISPER" &&
                        <ResizeContainer height="auto">
                            {
                                currentChannel.type !== "WHISPER" && props.author &&
                                currentChannel.ownerId === props.author.id &&
                                <RawIcon icon="location_away" />
                            }
                            {props.author && isUserAdministrators(props.author) && <RawIcon icon="shield_person" />}
                        </ResizeContainer>
                    }
                    {
                        props.author &&
                        <p className="message-author"
                            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70px' }}
                        >{props.author.username}</p>
                    }
                </div>

            </div>
        </div>
    )
}


type TMessage = {
    id: number,
    content: string,
    sendBy: number,
    lastMessage: boolean,
    displayUser: boolean,
    author: any,
    owner: boolean,
}


export default function Message(props: TMessage) {

    const { user } = useCurrentUser();

    return (
        <>
            {
                props.sendBy === user.id ?
                    <AuthorCurrentUserMessage
                        {...props}
                    /> :
                    <AuthorMessage
                        {...props}
                    />
            }
        </>
    )
}
