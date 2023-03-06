import { useEffect, useState } from 'react';
import { useGenesysCloudAPI } from '../../helpers/GenesysCloudAPI';

import { User } from '../../helpers/GenesysCloudAPITypes';
import UserCard from '../usercard/UserCard';

import './OrgChartMember.scss';

interface IProps {
	user: User;
	onClick?: { (user: User): void };
	noChildren?: boolean;
	className?: string;
}

export default function OrgChartMember(props: IProps) {
	const [directReports, setDirectReports] = useState<User[]>();
	const api = useGenesysCloudAPI();

	useEffect(() => {
		if (!api || props.noChildren) return;
		(async () => {
			setDirectReports(undefined);
			const data = await api.GetDirectReports(props.user.id || '');
			setDirectReports(data);
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.user, api]);

	return (
		<div className={`org-chart-member ${props.className || ''}`}>
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
