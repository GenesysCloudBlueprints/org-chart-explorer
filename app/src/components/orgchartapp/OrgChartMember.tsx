import React, { useEffect, useState } from 'react';
import GenesysCloudAPI from '../../helpers/GenesysCloudAPI';

import { User } from '../../helpers/GenesysCloudAPITypes';
import UserCard from '../usercard/UserCard';

import './OrgChartMember.scss';

interface IProps {
	user: User;
	api: GenesysCloudAPI;
	onClick?: { (user: User): void };
}

export default function OrgChartMember(props: IProps) {
	const [directReports, setDirectReports] = useState<User[]>();

	useEffect(() => {
		(async () => {
			const data = await props.api.GetDirectReports(props.user.id || '');
			console.log('Direct reports', data);
			setDirectReports(data);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user]);

	return (
		<div className="org-chart-member">
			<UserCard
				key={props.user.id}
				user={props.user}
				onClick={() => {
					if (props.onClick) props.onClick(props.user);
				}}
			/>
			{directReports && (
				<div className="direct-reports">
					{directReports.map((user) => (
						<OrgChartMember
							key={user.id}
							api={props.api}
							user={user}
							onClick={(user) => {
								console.log('CLICK!!!');
								if (props.onClick) props.onClick(user);
							}}
						/>
					))}
				</div>
			)}
		</div>
	);
}
