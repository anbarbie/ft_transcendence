import React, { useEffect, useState } from "react";
import { getLadder } from "../../requests/user";
import s from './style.module.css'
import { LadderList } from "../../components/LadderList/LadderList";
import { useCurrentUser } from "../../hooks/Hooks";

export function Ladder() {

	const { token } = useCurrentUser();
	const [ladder, setLadder] = useState(null);

	async function getData() {
		const rep = await getLadder(token);
		setLadder(rep.data);
	}

	useEffect(() => {
		getData();
	}, [])

	if (!ladder) {
		return ;
	}

	return (
		<div className={s.container}>
			<h1 className={s.title}>Ladder</h1>
			<div className={s.list}>
				{ladder.map((user: any, index: number) => {
					return (
						<div key={user.id}>
							<LadderList user={user} index={index} />
						</div>
					);
				})}
			</div>
		</div>
	);
}