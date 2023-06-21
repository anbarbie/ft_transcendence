import React, { useEffect, useState } from "react";
import { BoxAchievements } from "../BoxAchievements/BoxAchievements";
import { getAchievements } from "../../requests/user";
import novice from "../../assets/novice.png"
import intermediate from "../../assets/intermediate.png"
import expert from "../../assets/expert.png"
import master from "../../assets/master.png"
import fire from "../../assets/fire.png"
import tenacious from "../../assets/tenacious.png"
import godlike from "../../assets/godlike.png"
import s from './style.module.css'
import { useCurrentUser } from "../../hooks/Hooks";

interface UserProfileProps {
	id: number;
}

export function Achievements({ id }: UserProfileProps) {

	const { token } = useCurrentUser();
	const [achievements, setAchievements] = useState(null);

	async function getUserAchievements() {
		const rep = await getAchievements(id, token);
		setAchievements(rep.data);
	}

	useEffect(() => {
		getUserAchievements();
	}, [])

	
	if (!achievements) {
		return ;
	}

	return (
		<div className={s.container}>
			<BoxAchievements name={'Novice'} description={"Play 1 Pong match"} image={novice} condition={achievements[0]["Novice"]} />
			<BoxAchievements name={'Intermediate'} description={"Win 5 Pong matches"} image={intermediate} condition={achievements[0]["Intermediate"]} />
			<BoxAchievements name={'Expert'} description={"Reach 10 Pong matches"} image={expert} condition={achievements[0]["Expert"]} />
			<BoxAchievements name={'Master'} description={"Reach 20 Pong matches"} image={master} condition={achievements[0]["Master"]} />
			<BoxAchievements name={'On fire'} description={"Achieve 5 wins in a row"} image={fire} condition={achievements[0]["OnFire"]} />
			<BoxAchievements name={'Tenacisous'} description={"Experience 5 losses in a row"} image={tenacious} condition={achievements[0]["Tenacious"]} />
			<BoxAchievements name={'Godlike'} description={"Have 80% win rate on 10 Pong matches"} image={godlike} condition={achievements[0]["Godlike"]} />
		</div>
	);
}