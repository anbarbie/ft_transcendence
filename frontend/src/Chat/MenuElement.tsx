
import React from "react";
import { Link, useParams } from "react-router-dom";

import FriendElement from "../Components/FriendElement";
import './MenuElement.css'

function CollectionElement(props)
{
    return (
        <div className="collection">
            <div className="collection-label">
                <h2 className="collection-title">{props.title}</h2>
                <Link 
                    to={`/chat/add-${props.title.toLowerCase().slice(0, -1)}`} 
                    className="collection-add"
                >
                    <span className="material-symbols-outlined">
                        add
                    </span>
                </Link>
            </div>
            <div className="flex-column">
                {props.collection}
            </div>
        </div>
    )
}

function GroupElement(props)
{
    return (
        <Link to={`/chat/groups/${props.name}`} className="group hover-fill-grey"
            style={props.selected ? {backgroundColor:'#F4F4F4'} : {}}
            onClick={() => props.click(props)}
        >
            <p className="group-name">{props.name}</p>
            <p className="group-separator">-</p>
            <p className="group-members">{props.members} members</p>
        </Link>
    )
}


/*
    2 setCurrentxxxxx in parent and child === bad approach
    1 setXXX in parent and called in child (parent will be updated as child)
*/

export default function MenuElement({...props})
{    
    const [groups, setGroups] = React.useState(props.user.channelList);
    const [friendsList, setFriendsList] = React.useState(props.friends);
    const [currentGroup, setCurrentGroup] = React.useState();

    const groupList = groups.map(e => 
        <GroupElement
            key={e.id}
            id={e.id}
            name={e.name}
            members={e.members.length}
            selected={currentGroup === e.id ? true : false}
            click={(user) => props.setCurrentElement(user)}
        />
    )

    React.useEffect(() => {
        if (props.friends)
        {     
            setFriendsList(
                props.friends.map(user => (
                    <FriendElement 
                        key={user.id}
                        id={user.id}
                        username={user.username}
                        avatar={user.avatar}
                        userStatus={user.userStatus}
                        click={(user) => props.setCurrentElement(user)}
                    />
                ))
            )
        }
    }, [props.friends])


    return (
        <div className="menu-container">
            <CollectionElement
                title="Groups"
                collection={groupList}
                addClick={props.addGroup}
            />
            <CollectionElement
                title="Friends"
                collection={friendsList}
            />
        </div>
    )
}