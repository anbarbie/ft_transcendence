import { useEffect } from "react";
import { useChannelsContext, useChatSocket, useCurrentUser} from "../../../hooks/Hooks";
import { getChannel } from "../../../requests/chat";
import { useChannels } from "../../../hooks/Chat/useChannels";
import useMembers from "../../../hooks/Chat/useMembers";



export default function ChannelsEvents({ children }: any) {
    const { user, token } = useCurrentUser();
    const { socket } = useChatSocket();
    const { channels, channelsDispatch } = useChannelsContext();

    const { addedMember } = useMembers();

    const {
        addChannel,
        forceToLeaveChannel,
        updateChannelInfos,
    } = useChannels();

    useEffect(() => {
        if (socket && user) {

            socket.on('newChannel', async (channel: any) => {
                if (channel) {
                    addChannel(channel, false);
                }
            })

            socket.on('updatedChannel', (channel: any) => {
                updateChannelInfos(channel);
            })

            socket.on('joinedChannel', async (res: any) => {
                if (res && res.userId && res.channelId)
                    addedMember(res.userId, res.channelId)
            })

            socket.on('leftChannel', async (res: any) => {
                if (res && res.userId && res.channelId) {
                    channelsDispatch({ type: 'removeMember', channelId: res.channelId, userId: res.userId })
                    channelsDispatch({ type: 'removeAdministrators', channelId: res.channelId, userId: res.userId })
                }
            })


            socket.on('ownerChanged', (res: any) => {
                if (res && res.channelId && res.userId)
                    channelsDispatch({ type: 'ownerChanged', channelId: res.channelId, userId: res.userId })
            })

            socket.on('addedtoChannel', async (res: any) => {
                if (res && res.channelId && res.userId) {
                    if (res.userId === user.id) {
                        const channel = await getChannel(res.channelId, token).then(res => res.data);
                        if (channel) {
                            addChannel(channel, false);
                        }
                    }
                    else {
                        addedMember(res.userId, res.channelId)
                    }
                }
            })

            socket.on('madeAdmin', (res: any) => {
                if (res && res.channelId && res.userId) {
                    channelsDispatch({ type: 'addAdministrators', channelId: res.channelId, userId: res.userId })
                }
            })

            socket.on('removedAdmin', async (res: any) => {
                if (res && res.channelId && res.userId) {
                    channelsDispatch({ type: 'removeAdministrators', channelId: res.channelId, userId: res.userId })
                }
            })

            socket.on('kickedUser', async (res: any) => {
                forceToLeaveChannel(res)
            })

            socket.on('mutedUser', async (res: any) => {
                if (res && res.channelId && res.userId && res.mute) {
                    channelsDispatch({ type: 'addMuteList', channelId: res.channelId, userId: res.userId, mute: res.mute })
                }
            })

            socket.on('unmutedUser', async (res: any) => {
                if (res && res.channelId && res.userId) {
                    channelsDispatch({ type: 'removeMuteList', channelId: res.channelId, userId: res.userId })
                }
            })

            socket.on('bannedUser', async (res: any) => {
                if (res && res.channelId && res.userId) {
                    channelsDispatch({ type: 'addBanList', channelId: res.channelId, userId: res.userId });
                    forceToLeaveChannel(res)
                }
            })

            socket.on('unbannedUser', (res: any) => {
                if (res && res.channelId && res.userId) {
                    channelsDispatch({ type: 'removeBanList', channelId: res.channelId, userId: res.userId })
                }
            })

            if (channels && channels.length) {
                socket.on('message', (m: any) => {
                    if (m.length) {
                        channelsDispatch({ type: 'initMessages', messages: m });
                    }
                    if (m.content) {
                        channelsDispatch({ type: 'addMessage', message: m });
                    }
                });
            }


            return () => {
                if (socket) {
                    socket.off('newChannel')
                    socket.off('updatedChannel')
                    socket.off('joinedChannel')
                    socket.off('leftChannel')
                    socket.off('addedtoChannel')
                    socket.off('madeAdmin')
                    socket.off('removedAdmin')
                    socket.off('kickedUser')
                    socket.off('bannedUser')
                    socket.off('unbannedUser')
                    if (channels && channels.length)
                        socket.off('message')
                    socket.off('mutedUser')
                    socket.off('unmutedUser')
                }
            }
        }
    }, [socket, channels, user])
    return (children)
}